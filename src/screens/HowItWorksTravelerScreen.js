import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * HowItWorksTravelerScreen
 * Explains step-by-step how travelers can use the app to earn money
 */
export default function HowItWorksTravelerScreen({ navigation }) {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'How to Earn as a Traveler',
      subtitle: 'Turn your extra luggage space into earnings on your trip to Kinshasa',
      steps: [
        {
          number: '1',
          title: 'Create an Account',
          description: 'Sign up with your name, email, and phone number. This is the same account you use for sending packages.',
        },
        {
          number: '2',
          title: 'Set Up Your Payment Method',
          description: 'Before creating offers, set up how you want to receive your earnings. Go to "My Offers" and tap "Become a Traveler" to add your payment details.',
        },
        {
          number: '3',
          title: 'Create a Travel Offer',
          description: 'Tap "Create Offer" and enter your trip details: origin city, travel date, price per kilogram, and available luggage capacity. All users will be notified about your new offer.',
        },
        {
          number: '4',
          title: 'Receive Inquiries',
          description: 'Senders interested in your offer will contact you through the chat. Discuss package details, contents, and arrange a convenient pickup time and location.',
        },
        {
          number: '5',
          title: 'Send Payment Request',
          description: 'Once you agree on the details, tap the "$" button in the chat to send a payment request. Enter the weight in kilograms and the app calculates the total automatically.',
        },
        {
          number: '6',
          title: 'Collect the Package',
          description: 'After the sender pays, meet them at the agreed location to collect the package. Make sure to verify the package details match what was discussed.',
        },
        {
          number: '7',
          title: 'Update Delivery Status',
          description: 'Go to your offer and tap "Deliveries" to see all your shipments. Update the status as you progress:\n• Mark as Received - when you pick up the package\n• On the Way - when you start traveling\n• Arrived - when you reach Kinshasa',
        },
        {
          number: '8',
          title: 'Complete the Delivery',
          description: 'Meet the recipient in Kinshasa. Ask them for the 6-digit verification code (given to them by the sender). Enter this code in the app to confirm delivery.',
        },
        {
          number: '9',
          title: 'Get Paid',
          description: 'Your earnings are released in two parts:\n• 60% is released 24 hours after the sender pays\n• 40% is released immediately when you verify the delivery code',
        },
        {
          number: '10',
          title: 'Build Your Reputation',
          description: 'Senders can rate you after delivery. Good ratings help you attract more customers. Always be professional and communicate clearly.',
        },
      ],
      earningsTitle: 'Your Earnings',
      earningsDescription: 'You receive 92% of the base price (price per kg x weight). The platform keeps 8% as a commission.',
      earningsExample: 'Example: If you charge $10/kg for 5kg, that\'s $50 base price. You receive $46 (92% of $50).',
      tipTitle: 'Tips for Travelers',
      tips: [
        'Set competitive prices by checking other offers',
        'Respond to inquiries quickly to secure bookings',
        'Be clear about what items you can and cannot carry',
        'Always verify package contents before accepting',
        'Keep senders updated on your travel status',
        'Be punctual for pickup and delivery meetings',
      ],
    },
    fr: {
      title: 'Comment Gagner en tant que Voyageur',
      subtitle: 'Transformez votre espace bagage supplementaire en revenus lors de votre voyage a Kinshasa',
      steps: [
        {
          number: '1',
          title: 'Creer un Compte',
          description: 'Inscrivez-vous avec votre nom, email et numero de telephone. C\'est le meme compte que vous utilisez pour envoyer des colis.',
        },
        {
          number: '2',
          title: 'Configurer Votre Mode de Paiement',
          description: 'Avant de creer des offres, configurez comment vous souhaitez recevoir vos gains. Allez dans "Mes Offres" et appuyez sur "Devenir Voyageur" pour ajouter vos details de paiement.',
        },
        {
          number: '3',
          title: 'Creer une Offre de Voyage',
          description: 'Appuyez sur "Creer une Offre" et entrez les details de votre voyage: ville de depart, date de voyage, prix par kilogramme et capacite de bagage disponible. Tous les utilisateurs seront notifies de votre nouvelle offre.',
        },
        {
          number: '4',
          title: 'Recevoir des Demandes',
          description: 'Les expediteurs interesses par votre offre vous contacteront par chat. Discutez des details du colis, du contenu et organisez un lieu et une heure de ramassage pratiques.',
        },
        {
          number: '5',
          title: 'Envoyer une Demande de Paiement',
          description: 'Une fois les details convenus, appuyez sur le bouton "$" dans le chat pour envoyer une demande de paiement. Entrez le poids en kilogrammes et l\'application calcule le total automatiquement.',
        },
        {
          number: '6',
          title: 'Collecter le Colis',
          description: 'Apres le paiement de l\'expediteur, rencontrez-le a l\'endroit convenu pour collecter le colis. Assurez-vous de verifier que les details du colis correspondent a ce qui a ete discute.',
        },
        {
          number: '7',
          title: 'Mettre a Jour le Statut de Livraison',
          description: 'Allez dans votre offre et appuyez sur "Livraisons" pour voir tous vos envois. Mettez a jour le statut au fur et a mesure:\n• Marquer comme Recu - quand vous recuperez le colis\n• En Route - quand vous commencez a voyager\n• Arrive - quand vous arrivez a Kinshasa',
        },
        {
          number: '8',
          title: 'Completer la Livraison',
          description: 'Rencontrez le destinataire a Kinshasa. Demandez-lui le code de verification a 6 chiffres (donne par l\'expediteur). Entrez ce code dans l\'application pour confirmer la livraison.',
        },
        {
          number: '9',
          title: 'Recevoir Votre Paiement',
          description: 'Vos gains sont liberes en deux parties:\n• 60% est libere 24 heures apres le paiement de l\'expediteur\n• 40% est libere immediatement quand vous verifiez le code de livraison',
        },
        {
          number: '10',
          title: 'Construire Votre Reputation',
          description: 'Les expediteurs peuvent vous noter apres la livraison. De bonnes notes vous aident a attirer plus de clients. Soyez toujours professionnel et communiquez clairement.',
        },
      ],
      earningsTitle: 'Vos Gains',
      earningsDescription: 'Vous recevez 92% du prix de base (prix par kg x poids). La plateforme garde 8% comme commission.',
      earningsExample: 'Exemple: Si vous facturez $10/kg pour 5kg, c\'est $50 de prix de base. Vous recevez $46 (92% de $50).',
      tipTitle: 'Conseils pour les Voyageurs',
      tips: [
        'Fixez des prix competitifs en consultant les autres offres',
        'Repondez rapidement aux demandes pour securiser les reservations',
        'Soyez clair sur ce que vous pouvez et ne pouvez pas transporter',
        'Verifiez toujours le contenu du colis avant d\'accepter',
        'Tenez les expediteurs informes de votre statut de voyage',
        'Soyez ponctuel pour les rendez-vous de ramassage et de livraison',
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

          {/* Earnings Info */}
          <View style={styles.earningsSection}>
            <Text style={styles.infoTitle}>{data.earningsTitle}</Text>
            <Text style={styles.infoDescription}>{data.earningsDescription}</Text>
            <View style={styles.exampleBox}>
              <Text style={styles.exampleText}>{data.earningsExample}</Text>
            </View>
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
    backgroundColor: theme.colors.success,
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
  earningsSection: {
    backgroundColor: theme.colors.success + '15',
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
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  exampleText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  tipsSection: {
    backgroundColor: theme.colors.success + '10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  tipBullet: {
    color: theme.colors.success,
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
