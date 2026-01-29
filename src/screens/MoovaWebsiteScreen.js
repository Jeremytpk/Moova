import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import AutoSwipeBanner from '../components/AutoSwipeBanner';
import { ArrowRightIcon } from '../components/Icons';

// APK download URL from Firebase Storage
const APK_DOWNLOAD_URL = 'https://firebasestorage.googleapis.com/v0/b/moova-ff8e6.firebasestorage.app/o/moova_apk%2FMoova_Android.apk?alt=media';

export default function MoovaWebsiteScreen() {
  const { language } = useLanguage();

  const t = {
    en: {
      title: 'Welcome to Moova',
      tagline: 'Your Trusted Shipping Companion',
      description: 'Moova is a peer-to-peer package delivery platform that connects travelers with senders. Travelers can earn money by delivering packages along their travel routes, while senders get affordable shipping options.',
      featuresTitle: 'Key Features',
      features: [
        'Peer-to-peer package delivery',
        'Travelers earn money by delivering packages',
        'Senders get affordable shipping options',
        'Real-time chat between senders and travelers',
        'Secure payments with Stripe',
        'Shipment tracking',
        'Multi-language support (English and French)',
      ],
      downloadTitle: 'Download for Android',
      downloadDescription: 'Get the Moova app directly on your Android device.',
      downloadButton: 'Download APK',
      poweredBy: 'Powered by Jerttech',
      ads: {
        traveler: {
          title: 'Become a Traveler and Earn!',
          subtitle: 'Got extra space in your luggage? Monetize it by delivering packages for our community.',
        },
      },
    },
    fr: {
      title: 'Bienvenue chez Moova',
      tagline: 'Votre Compagnon de Livraison de Confiance',
      description: 'Moova est une plateforme de livraison de colis de pair à pair qui met en relation les voyageurs avec les expéditeurs. Les voyageurs peuvent gagner de l\'argent en livrant des colis le long de leurs itinéraires de voyage, tandis que les expéditeurs bénéficient d\'options d\'expédition abordables.',
      featuresTitle: 'Fonctionnalités Clés',
      features: [
        'Livraison de colis de pair à pair',
        'Les voyageurs gagnent de l\'argent en livrant des colis',
        'Les expéditeurs bénéficient d\'options d\'expédition abordables',
        'Chat en temps réel entre expéditeurs et voyageurs',
        'Paiements sécurisés avec Stripe',
        'Suivi des expéditions',
        'Support multilingue (anglais et français)',
      ],
      downloadTitle: 'Télécharger pour Android',
      downloadDescription: 'Obtenez l\'application Moova directement sur votre appareil Android.',
      downloadButton: 'Télécharger APK',
      poweredBy: 'Propulsé par Jerttech',
      ads: {
        traveler: {
          title: 'Devenez voyageur et gagnez !',
          subtitle: 'Vous avez de la place en plus dans vos bagages ? Monétisez-la en livrant des colis pour notre communauté.',
        },
      },
    },
  };

  const text = t[language];

  const localBanners = [
    {
      id: 'traveler-ad',
      title: text.ads.traveler.title,
      subtitle: text.ads.traveler.subtitle,
      imageUrl: require('../../assets/ads/traveler.png'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logoMoova.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.tagline}>{text.tagline}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.description}>{text.description}</Text>
        </View>

        <AutoSwipeBanner localBanners={localBanners} height={150} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.featuresTitle}</Text>
          {text.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureDot}>•</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Android APK Download Section */}
        {(Platform.OS === 'android' || Platform.OS === 'web') && (
          <View style={styles.downloadSection}>
            <Text style={styles.downloadTitle}>{text.downloadTitle}</Text>
            <Text style={styles.downloadDescription}>{text.downloadDescription}</Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => Linking.openURL(APK_DOWNLOAD_URL)}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadButtonText}>{text.downloadButton}</Text>
              <ArrowRightIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.poweredBy}>{text.poweredBy}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  heroSection: {
    backgroundColor: theme.colors.primary,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  title: {
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
    textAlign: 'center',
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  section: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  featureDot: {
    color: theme.colors.primary,
    fontSize: 20,
    lineHeight: 24,
    marginRight: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  poweredBy: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  downloadSection: {
    backgroundColor: theme.colors.success + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  downloadTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  downloadDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  downloadButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  downloadButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
