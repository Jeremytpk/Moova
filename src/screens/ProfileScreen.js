import React, { useState, useEffect } from 'react';
import { Modal, Platform } from 'react-native';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import theme from '../theme';
import Button from '../components/Button';
import { ProfileIcon, PackageIcon, ShipmentIcon, SettingsIcon, ArrowRightIcon, BookIcon, LockIcon, SheetIcon, MailIcon, LinkIcon } from '../components/Icons';
import { ShareIcon } from '../components/ShareIcon';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ProfileScreen
 * User profile and settings
 */
export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(auth.currentUser);
  const [username, setUsername] = useState(user?.email?.split('@')[0] || user?.displayName || 'User');
  const [isTraveler, setIsTraveler] = useState(false);
  const [travelerPayment, setTravelerPayment] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  // Listen for real-time updates to user profile (photoURL, etc)
  useEffect(() => {
    if (!user) return;
    let unsubscribe;
    (async () => {
      const { doc, onSnapshot, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.photoURL) setPhotoURL(data.photoURL);
          if (data.username) setUsername(data.username);
          setIsTraveler(data.isTraveler || false);
          setTravelerPayment(data.travelerPayment || null);
        }
      });
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);
  const { language, toggleLanguage } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Listen to auth state changes to update user state and trigger re-render
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Fetch user data from Firestore
  const fetchUserData = async () => {
    if (!user) return;
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.username) {
          setUsername(data.username);
        }
        setIsTraveler(data.isTraveler || false);
        setTravelerPayment(data.travelerPayment || null);
        setIsAdmin(!!data.isAdmin);
        setPhotoURL(data.photoURL || null);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [user])
  );

  const t = {
    en: {
      appName: 'Moova',
      tagline: 'Your Trusted Shipping Companion',
      editProfile: 'Edit Profile',
      accountInfo: 'Account Information',
      email: 'Email',
      memberSince: 'Member Since',
      accountStatus: 'Account Status',
      active: 'Active',
      travelerAccount: 'Traveler Account',
      travelerStatus: 'Traveler Status',
      notATraveler: 'Regular Account',
      travelerVerified: 'Verified Traveler',
      paymentInfo: 'Payment Information',
      setupPayment: 'Setup Traveler Account',
      editPayment: 'Edit Payment Info',
      quickActions: 'Quick Actions',
      myShipments: 'My Shipments',
      myOffers: 'My Offers',
      shareApp: 'Share the App',
      language: 'Language',
      signOut: 'Sign Out',
      version: 'Version',
      legal: 'Legal',
      privacyPolicy: 'Privacy Policy',
      termsConditions: 'Terms & Conditions',
      notLoggedIn: 'Not Logged In',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signInDescription: 'Sign in to access all features and create offers',
      viewTutorial: 'View Tutorial',
    },
    fr: {
      appName: 'Moova',
      tagline: 'Votre Compagnon de Livraison de Confiance',
      editProfile: 'Modifier le Profil',
      accountInfo: 'Informations du Compte',
      email: 'Email',
      memberSince: 'Membre Depuis',
      accountStatus: 'Statut du Compte',
      active: 'Actif',
      travelerAccount: 'Compte Voyageur',
      travelerStatus: 'Statut Voyageur',
      notATraveler: 'Compte Régulier',
      travelerVerified: 'Voyageur Vérifié',
      paymentInfo: 'Informations de Paiement',
      setupPayment: 'Configurer Compte Voyageur',
      editPayment: 'Modifier Info Paiement',
      quickActions: 'Actions Rapides',
      myShipments: 'Mes Envois',
      myOffers: 'Mes Offres',
      shareApp: 'Partager l\'application',
      language: 'Langue',
      signOut: 'Se Déconnecter',
      version: 'Version',
      legal: 'Légal',
      privacyPolicy: 'Politique de Confidentialité',
      termsConditions: 'Conditions Générales',
      notLoggedIn: 'Non Connecté',
      signIn: 'Se Connecter',
      signUp: 'S\'inscrire',
      signInDescription: 'Connectez-vous pour accéder à toutes les fonctionnalités',
      viewTutorial: 'Voir le Tutoriel',
    }
  };

  const text = t[language];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.navigate('SearchResults');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section with Brand */}
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logoMoova.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>{text.appName}</Text>
        <Text style={styles.tagline}>{text.tagline}</Text>
      </View>

      <View style={styles.content}>
        {/* If user is not logged in */}
        {!user ? (
          <>
            {/* Not Logged In Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <ProfileIcon size={60} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{text.notLoggedIn}</Text>
                  <Text style={styles.userEmail}>{text.signInDescription}</Text>
                </View>
              </View>
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => navigation.navigate('AuthFlow')}
                >
                  <Text style={styles.signInButtonText}>{text.signIn}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={() => navigation.navigate('AuthFlow')}
                >
                  <Text style={styles.signUpButtonText}>{text.signUp}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {photoURL ? (
                    <Image source={{ uri: photoURL }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                  ) : (
                    <ProfileIcon size={60} color={theme.colors.primary} />
                  )}
                  {isTraveler && (
                    <View style={styles.travelerBadge}>
                      <Text style={styles.travelerBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{username}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('ProfileDetailsScreen')}>
                <Text style={styles.editButtonText}>{text.editProfile}</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.success, marginTop: 10 }]} onPress={() => navigation.navigate('AdminScreen')}>
                  <Text style={[styles.editButtonText, { color: 'white' }]}>Admin Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Account Section - Only for logged in users */}
        {user && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{text.accountInfo}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{text.email}</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{text.memberSince}</Text>
                <Text style={styles.infoValue}>
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{text.accountStatus}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{text.active}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{text.travelerStatus}</Text>
                <View style={[styles.statusBadge, !isTraveler && styles.inactiveBadge]}>
                  <Text style={[styles.statusText, !isTraveler && styles.inactiveText]}>
                    {isTraveler ? text.travelerVerified : text.notATraveler}
                  </Text>
                </View>
              </View>
            </View>

            {/* Traveler Payment Info Section */}
            {isTraveler && travelerPayment && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{text.paymentInfo}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Method</Text>
                  <Text style={styles.infoValue}>
                    {travelerPayment.method === 'zelle' ? 'Zelle' : 'CashApp'}
                  </Text>
                </View>
                {travelerPayment.method === 'zelle' && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Zelle Email</Text>
                      <Text style={styles.infoValue}>{travelerPayment.zelleEmail}</Text>
                    </View>
                    {travelerPayment.zellePhone && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Zelle Phone</Text>
                        <Text style={styles.infoValue}>{travelerPayment.zellePhone}</Text>
                      </View>
                    )}
                  </>
                )}
                {travelerPayment.method === 'cashapp' && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>CashApp</Text>
                    <Text style={styles.infoValue}>{travelerPayment.cashappTag}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editPaymentButton}
                  onPress={() => navigation.navigate('TravelerSetup')}
                >
                  <Text style={styles.editPaymentButtonText}>{text.editPayment}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Setup Traveler Account Button */}
            {!isTraveler && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{text.travelerAccount}</Text>
                <Text style={styles.setupDescription}>
                  {language === 'fr'
                    ? "Devenez voyageur pour créer des offres et gagner de l'argent en livrant des colis."
                    : 'Become a traveler to create offers and earn money by delivering packages.'}
                </Text>
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={() => navigation.navigate('TravelerSetup')}
                >
                  <Text style={styles.setupButtonText}>{text.setupPayment}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.quickActions}</Text>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              if (!user) {
                setShowAuthModal(true);
              } else {
                navigation.navigate('MyShipments');
              }
            }}
          >
            <View style={styles.actionIconContainer}>
              <ShipmentIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>{text.myShipments}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          {user && isTraveler && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                if (!user) {
                  setShowAuthModal(true);
                } else {
                  navigation.navigate('MyOffers');
                }
              }}
            >
              <View style={styles.actionIconContainer}>
                <PackageIcon size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.actionText}>{text.myOffers}</Text>
              <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ContactUs')}>
            <View style={styles.actionIconContainer}>
              <MailIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>{language === 'fr' ? 'Contactez-nous' : 'Contact Us'}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          {/* Share the App */}
          <TouchableOpacity
            style={styles.actionItem}
            accessibilityRole="button"
            accessibilityLabel="Share the app with friends"
            activeOpacity={0.7}
            onPress={async () => {
              const { Share } = await import('react-native');
              Share.share({
                message: `Check out Moova! Send and receive packages easily. Try it now: https://moovacongo.netlify.app`,
                url: 'https://moovacongo.netlify.app',
                title: 'Moova - Your Trusted Shipping Companion',
              });
            }}
          >
            <View style={styles.actionIconContainer}>
              <ShareIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>{text.shareApp}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={toggleLanguage}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.languageIcon}>{language === 'en' ? '🇬🇧' : '🇫🇷'}</Text>
            </View>
            <Text style={styles.actionText}>{text.language}</Text>
            <Text style={styles.languageValue}>{language === 'en' ? 'English' : 'Français'}</Text>
          </TouchableOpacity>
          {/* View Tutorial / Onboarding */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <View style={styles.actionIconContainer}>
              <BookIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>{text.viewTutorial}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Auth Required Modal */}
        <Modal
          visible={showAuthModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAuthModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image source={require('../../assets/logoMoova.png')} style={{ width: 60, height: 60, alignSelf: 'center', marginBottom: 16 }} />
              <Text style={styles.modalTitle}>{language === 'fr' ? 'Connexion requise' : 'Sign In Required'}</Text>
              <Text style={styles.modalText}>
                {language === 'fr'
                  ? 'Vous devez être connecté pour accéder à cette fonctionnalité.'
                  : 'You need to be signed in to access this feature.'}
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowAuthModal(false);
                  navigation.navigate('AuthFlow');
                }}
              >
                <Text style={styles.modalButtonText}>{language === 'fr' ? 'Se connecter' : 'Sign In'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.backgroundSecondary, marginTop: 8 }]}
                onPress={() => setShowAuthModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.primary }]}>{language === 'fr' ? 'Annuler' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Legal Section - Always visible */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.legal}</Text>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.actionIconContainer}>
              <LockIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>{text.privacyPolicy}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('TermsConditions')}
          >
            <View style={styles.actionIconContainer}>
              <SheetIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>{text.termsConditions}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button - Only for logged in users */}
        {user && (
          <Button
            title={text.signOut}
            variant="outline"
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
        )}

        {/* App Version */}
        <Text style={styles.versionText}>{text.version} 1.0.0</Text>
        <Text style={styles.versionText}>Powered by Jerttech</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    ...theme.typography.h1,
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    ...theme.typography.body,
    color: 'white',
    fontSize: 14,
  },

  // Content
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: -theme.spacing.xl,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary + '30',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    textTransform: 'capitalize',
  },
  userEmail: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontSize: 14,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  editButtonText: {
    ...theme.typography.button,
    color: 'white',
    fontWeight: '600',
  },

  // Sections
  section: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  travelerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.success,
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: theme.colors.background,
    zIndex: 2,
  },
  travelerBadgeText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
  },

  // Action Items
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 16,
    flex: 1,
  },
  languageIcon: {
    fontSize: 20,
  },
  languageValue: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Sign Out Button
  signOutButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },

  // Version
  versionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },

  // Traveler Badge
  travelerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.success,
    borderRadius: 100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: theme.colors.background,
    zIndex: 2,
  },
  travelerBadgeText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Traveler-specific styles
  inactiveBadge: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  inactiveText: {
    color: theme.colors.textSecondary,
  },
  setupDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  setupButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  setupButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  editPaymentButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  editPaymentButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Auth buttons for non-logged in users
  authButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  signInButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  signInButtonText: {
    ...theme.typography.button,
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  signUpButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  signUpButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },

  // Legal icon
  legalIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 350,
    alignSelf: 'center',
    ...theme.shadows.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    color: theme.colors.text,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

// Helper for bottom tab navigation
export function requireAuthOrShowModal(user, isTraveler, navigation, screen, setShowAuthModal) {
  if (!user) {
    setShowAuthModal(true);
    return false;
  }
  if (screen === 'MyOffersScreen' && !isTraveler) {
    return false;
  }
  navigation.navigate(screen);
  return true;
}
