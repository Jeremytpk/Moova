import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../config/firebaseConfig';
import theme from '../theme';

export default function ContactUs({ navigation }) {
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  const t = {
    en: {
      contactUs: 'Contact Us',
      yourName: 'Your Name',
      yourEmail: 'Your Email',
      yourMessage: 'Your Message',
      sendMessage: 'Send Message',
      sending: 'Sending...',
      thankYou: 'Thank you!',
      sent: 'Your message has been sent. We will get back to you soon.',
      backToProfile: 'Back to Profile',
    },
    fr: {
      contactUs: 'Contactez-nous',
      yourName: 'Votre nom',
      yourEmail: 'Votre email',
      yourMessage: 'Votre message',
      sendMessage: 'Envoyer le message',
      sending: 'Envoi...',
      thankYou: 'Merci !',
      sent: 'Votre message a été envoyé. Nous vous répondrons bientôt.',
      backToProfile: 'Retour au profil',
    },
  };
  const text = t[language];

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'messages'), {
        name: name || 'Anonymous',
        email: email || 'No email',
        message,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch (e) {
      alert('Failed to send message. Please try again.');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmTitle}>{text.thankYou}</Text>
        <Text style={styles.confirmText}>{text.sent}</Text>
        <TouchableOpacity style={styles.confirmButton} onPress={() => navigation.goBack()}>
          <Text style={styles.confirmButtonText}>{text.backToProfile}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>{text.contactUs}</Text>
      <TextInput
        style={styles.input}
        placeholder={text.yourName}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder={text.yourEmail}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder={text.yourMessage}
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? text.sending : text.sendMessage}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 24,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
