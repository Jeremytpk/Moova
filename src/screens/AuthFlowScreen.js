import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Modal, TouchableOpacity, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import theme from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * AuthFlowScreen
 * Handles user authentication (Sign In / Sign Up)
 * Modal presentation
 */
export default function AuthFlowScreen({ navigation }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  // Translations
  const translations = {
    en: {
      joinCommunity: 'Join the Community',
      welcomeBack: 'Welcome Back',
      createAccount: 'Create your account to start sending or offering',
      signInAccess: 'Sign in to access your account',
      fullName: 'Full Name',
      fullNamePlaceholder: 'John Doe',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      pleaseWait: 'Please wait...',
      signUp: 'Sign Up',
      signIn: 'Sign In',
      alreadyHaveAccount: 'Already have an account? Sign In',
      needAccount: 'Need an account? Sign Up',
      continueAsGuest: 'Continue as Guest',
      welcomeToMoova: 'Welcome to Moova!',
      accountCreated: 'Your account has been created successfully. Start connecting with travelers and senders now!',
      getStarted: 'Get Started',
      error: 'Error',
      fillAllFields: 'Please fill in all required fields',
      enterFullName: 'Please enter your full name',
      authError: 'Authentication Error',
      errorOccurred: 'An error occurred. Please try again.',
      emailInUse: 'This email is already registered. Please sign in instead.',
      invalidEmail: 'Invalid email address.',
      weakPassword: 'Password should be at least 6 characters.',
      userNotFound: 'No account found with this email.',
      wrongPassword: 'Incorrect password. Please try again.',
      invalidCredential: 'Invalid email or password. Please try again.',
    },
    fr: {
      joinCommunity: 'Rejoindre la Communauté',
      welcomeBack: 'Bon Retour',
      createAccount: 'Créez votre compte pour commencer à envoyer ou offrir',
      signInAccess: 'Connectez-vous pour accéder à votre compte',
      fullName: 'Nom Complet',
      fullNamePlaceholder: 'Jean Dupont',
      email: 'Email',
      emailPlaceholder: 'vous@exemple.com',
      password: 'Mot de Passe',
      passwordPlaceholder: '••••••••',
      pleaseWait: 'Veuillez patienter...',
      signUp: 'S\'inscrire',
      signIn: 'Se Connecter',
      alreadyHaveAccount: 'Vous avez déjà un compte? Se Connecter',
      needAccount: 'Besoin d\'un compte? S\'inscrire',
      continueAsGuest: 'Continuer en tant qu\'Invité',
      welcomeToMoova: 'Bienvenue sur Moova!',
      accountCreated: 'Votre compte a été créé avec succès. Commencez à vous connecter avec des voyageurs et des expéditeurs maintenant!',
      getStarted: 'Commencer',
      error: 'Erreur',
      fillAllFields: 'Veuillez remplir tous les champs obligatoires',
      enterFullName: 'Veuillez entrer votre nom complet',
      authError: 'Erreur d\'Authentification',
      errorOccurred: 'Une erreur s\'est produite. Veuillez réessayer.',
      emailInUse: 'Cet email est déjà enregistré. Veuillez vous connecter à la place.',
      invalidEmail: 'Adresse email invalide.',
      weakPassword: 'Le mot de passe doit contenir au moins 6 caractères.',
      userNotFound: 'Aucun compte trouvé avec cet email.',
      wrongPassword: 'Mot de passe incorrect. Veuillez réessayer.',
      invalidCredential: 'Email ou mot de passe invalide. Veuillez réessayer.',
    },
  };

  const text = translations[language];

  const handleEmailChange = (text) => {
    setEmail(text.toLowerCase());
  };

  /**
   * Generate a unique username from name
   * Format: Random mix of name letters and numbers (7 chars)
   * Example: "John Doe" -> "J3oh5nD", "Ma8r2ia" etc.
   */
  const generateUsername = (fullName) => {
    // Remove spaces and special characters
    const cleanName = fullName.replace(/[^a-zA-Z]/g, '');
    
    // Get letters from name (up to 5)
    const nameChars = cleanName.substring(0, 5).split('');
    
    // Generate random digits (2-3 digits)
    const numDigits = Math.floor(2 + Math.random() * 2); // 2 or 3 digits
    const digits = [];
    for (let i = 0; i < numDigits; i++) {
      digits.push(Math.floor(Math.random() * 10).toString());
    }
    
    // Combine letters and numbers
    const combined = [...nameChars, ...digits];
    
    // Shuffle the array randomly
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    
    // Take first 7 characters
    return combined.slice(0, 7).join('');
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(text.error, text.fillAllFields);
      return;
    }

    if (isSignUp && !name) {
      Alert.alert(text.error, text.enterFullName);
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up - Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Generate unique username
        const username = generateUsername(name);
        console.log('Generated username:', username);
        
        // Save user data to Firestore users collection
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          name: name,
          username: username,
          createdAt: new Date().toISOString(),
          role: 'user', // Can be 'user', 'sender', or 'traveler'
          profileComplete: false,
        });
        
        console.log('Account created successfully with username:', username);
        setShowSuccess(true);
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Signed in successfully');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = text.errorOccurred;
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = text.emailInUse;
          break;
        case 'auth/invalid-email':
          errorMessage = text.invalidEmail;
          break;
        case 'auth/weak-password':
          errorMessage = text.weakPassword;
          break;
        case 'auth/user-not-found':
          errorMessage = text.userNotFound;
          break;
        case 'auth/wrong-password':
          errorMessage = text.wrongPassword;
          break;
        case 'auth/invalid-credential':
          errorMessage = text.invalidCredential;
          break;
      }
      
      Alert.alert(text.authError, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section with Brand */}
      <View style={styles.heroSection}>
        <View style={styles.brandContainer}>
          <Image 
            source={require('../../assets/logoMoova.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          {/* <Text style={styles.brandName}>Moova</Text> */}
        </View>
        <Text style={styles.tagline}>
          {isSignUp ? text.joinCommunity : text.welcomeBack}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          {isSignUp 
            ? text.createAccount
            : text.signInAccess
          }
        </Text>

        {isSignUp && (
          <Input
            label={text.fullName}
            value={name}
            onChangeText={setName}
            placeholder={text.fullNamePlaceholder}
            style={styles.input}
          />
        )}

        <Input
          label={text.email}
          value={email}
          onChangeText={handleEmailChange}
          placeholder={text.emailPlaceholder}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Input
          label={text.password}
          value={password}
          onChangeText={setPassword}
          placeholder={text.passwordPlaceholder}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <Button
          title={loading ? text.pleaseWait : (isSignUp ? text.signUp : text.signIn)}
          variant="primary"
          onPress={handleAuth}
          disabled={loading}
          style={styles.button}
        />

        <Button
          title={isSignUp ? text.alreadyHaveAccount : text.needAccount}
          variant="outline"
          onPress={() => setIsSignUp(!isSignUp)}
          style={styles.toggleButton}
        />

        <Button
          title={text.continueAsGuest}
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.guestButton}
        />
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>{text.welcomeToMoova}</Text>
            <Text style={styles.successMessage}>
              {text.accountCreated}
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>{text.getStarted}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSection: {
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 28,
    marginRight: theme.spacing.md,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.background,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 20,
    color: theme.colors.background,
    opacity: 0.95,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    fontSize: 16,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
  },
  toggleButton: {
    marginTop: theme.spacing.md,
  },
  guestButton: {
    marginTop: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  successModal: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  successButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 12,
    width: '100%',
  },
  successButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
