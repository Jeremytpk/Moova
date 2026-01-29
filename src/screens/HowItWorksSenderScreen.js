import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * HowItWorksSenderScreen
 * Explains step-by-step how senders can use the app to ship packages
 */
export default function HowItWorksSenderScreen({ navigation }) {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'How to Send a Package',
      subtitle: 'Follow these simple steps to ship your package to Kinshasa',
      steps: [
        {
          number: '1',
          title: 'Create an Account',
          description: 'Sign up with your name, email, and phone number. Your account lets you browse offers, chat with travelers, and track your shipments.',
        },
        {
          number: '2',
          title: 'Browse Travel Offers',
          description: 'Go to the Search tab to see all available travelers heading to Kinshasa. You can filter by origin city, travel date, and price per kilogram.',
        },
        {
          number: '3',
          title: 'Check Traveler Ratings',
          description: 'View each traveler\'s profile to see their ratings and reviews from previous senders. This helps you choose a reliable traveler.',
        },
        {
          number: '4',
          title: 'Contact a Traveler',
          description: 'Found a good offer? Tap "Contact Traveler" to start a conversation. Discuss your package details, pickup location, and any special requirements.',
        },
        {
          number: '5',
          title: 'Receive Payment Request',
          description: 'Once you agree on the details, the traveler will send you a payment request with the exact amount based on your package weight.',
        },
        {
          number: '6',
          title: 'Make Payment',
          description: 'Tap "Pay Now" to complete your payment securely. Your money is held safely by the platform until delivery is confirmed.',
        },
        {
          number: '7',
          title: 'Track Your Shipment',
          description: 'Go to "My Shipments" to track your package in real-time. You\'ll receive notifications as the status updates: Picked Up, In Transit, Arrived, and Delivered.',
        },
        {
          number: '8',
          title: 'Share Verification Code',
          description: 'You\'ll receive a 6-digit verification code for your shipment. Share this code with your recipient in Kinshasa so they can confirm delivery to the traveler.',
        },
        {
          number: '9',
          title: 'Delivery Complete',
          description: 'Once your recipient provides the code to the traveler, delivery is confirmed and marked complete. You\'ll receive a notification.',
        },
        {
          number: '10',
          title: 'Leave a Review',
          description: 'Help other senders by rating your experience with the traveler. You can leave a star rating and an optional comment.',
        },
      ],
      feeTitle: 'Service Fees',
      feeDescription: 'A small service fee is added to help maintain the platform:',
      fees: [
        '0 - 5 kg: $3.70',
        '5 - 10 kg: $5.50',
        '10 - 20 kg: $7.00',
      ],
      tipTitle: 'Tips for Senders',
      tips: [
        'Always check traveler reviews before booking',
        'Be clear about your package contents and weight',
        'Arrange a convenient pickup location',
        'Keep your verification code safe and share it only with your recipient',
        'Track your shipment regularly for updates',
      ],
    },
    fr: {
      title: 'Comment Envoyer un Colis',
      subtitle: 'Suivez ces etapes simples pour expedier votre colis a Kinshasa',
      steps: [
        {
          number: '1',
          title: 'Creer un Compte',
          description: 'Inscrivez-vous avec votre nom, email et numero de telephone. Votre compte vous permet de parcourir les offres, discuter avec les voyageurs et suivre vos envois.',
        },
        {
          number: '2',
          title: 'Parcourir les Offres de Voyage',
          description: 'Allez dans l\'onglet Recherche pour voir tous les voyageurs disponibles vers Kinshasa. Vous pouvez filtrer par ville de depart, date de voyage et prix par kilogramme.',
        },
        {
          number: '3',
          title: 'Verifier les Evaluations',
          description: 'Consultez le profil de chaque voyageur pour voir ses notes et avis des expediteurs precedents. Cela vous aide a choisir un voyageur fiable.',
        },
        {
          number: '4',
          title: 'Contacter un Voyageur',
          description: 'Trouve une bonne offre? Appuyez sur "Contacter le Voyageur" pour demarrer une conversation. Discutez des details de votre colis, du lieu de ramassage et de toute exigence speciale.',
        },
        {
          number: '5',
          title: 'Recevoir une Demande de Paiement',
          description: 'Une fois les details convenus, le voyageur vous enverra une demande de paiement avec le montant exact base sur le poids de votre colis.',
        },
        {
          number: '6',
          title: 'Effectuer le Paiement',
          description: 'Appuyez sur "Payer Maintenant" pour completer votre paiement en toute securite. Votre argent est garde en securite par la plateforme jusqu\'a confirmation de la livraison.',
        },
        {
          number: '7',
          title: 'Suivre Votre Envoi',
          description: 'Allez dans "Mes Envois" pour suivre votre colis en temps reel. Vous recevrez des notifications a chaque mise a jour: Ramasse, En Transit, Arrive et Livre.',
        },
        {
          number: '8',
          title: 'Partager le Code de Verification',
          description: 'Vous recevrez un code de verification a 6 chiffres pour votre envoi. Partagez ce code avec votre destinataire a Kinshasa pour qu\'il puisse confirmer la livraison au voyageur.',
        },
        {
          number: '9',
          title: 'Livraison Terminee',
          description: 'Une fois que votre destinataire fournit le code au voyageur, la livraison est confirmee et marquee comme terminee. Vous recevrez une notification.',
        },
        {
          number: '10',
          title: 'Laisser un Avis',
          description: 'Aidez les autres expediteurs en evaluant votre experience avec le voyageur. Vous pouvez laisser une note etoilee et un commentaire optionnel.',
        },
      ],
      feeTitle: 'Frais de Service',
      feeDescription: 'Un petit frais de service est ajoute pour maintenir la plateforme:',
      fees: [
        '0 - 5 kg: $3.70',
        '5 - 10 kg: $5.50',
        '10 - 20 kg: $7.00',
      ],
      tipTitle: 'Conseils pour les Expediteurs',
      tips: [
        'Verifiez toujours les avis des voyageurs avant de reserver',
        'Soyez clair sur le contenu et le poids de votre colis',
        'Organisez un lieu de ramassage pratique',
        'Gardez votre code de verification en securite et partagez-le uniquement avec votre destinataire',
        'Suivez regulierement votre envoi pour les mises a jour',
      ],
    },
  };

  const data = content[language];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            {data.steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Service Fees */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>{data.feeTitle}</Text>
            <Text style={styles.infoDescription}>{data.feeDescription}</Text>
            {data.fees.map((fee, index) => (
              <View key={index} style={styles.feeRow}>
                <Text style={styles.feeText}>{fee}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.infoTitle}>{data.tipTitle}</Text>
            {data.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: theme.spacing.xl,
  },
  stepsContainer: {
    marginBottom: theme.spacing.xl,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  stepNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  stepDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  infoDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  feeRow: {
    paddingVertical: theme.spacing.xs,
  },
  feeText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  tipBullet: {
    color: theme.colors.primary,
    fontSize: 16,
    marginRight: theme.spacing.sm,
    fontWeight: '700',
  },
  tipText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: theme.spacing.xxl,
  },
});
