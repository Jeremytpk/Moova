import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * PrivacyPolicyScreen
 * Displays the privacy policy for the Moova app
 */
export default function PrivacyPolicyScreen({ navigation }) {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 15, 2026',
      sections: [
        {
          title: '1. Information We Collect',
          content: `We collect information you provide directly to us when you:
• Create an account (name, email, phone number)
• Set up a traveler profile (payment information)
• Create shipping offers or purchase capacity
• Use our messaging features
• Make or receive payments

We also collect information automatically including:
• Device information and identifiers
• Location data (with your permission)
• Usage data and analytics`,
        },
        {
          title: '2. How We Use Your Information',
          content: `We use the information we collect to:
• Provide and improve our services
• Process transactions and payments
• Send you updates and notifications
• Prevent fraud and ensure security
• Comply with legal obligations
• Communicate with you about our services`,
        },
        {
          title: '3. Information Sharing',
          content: `We share your information only in these circumstances:
• With other users as necessary for transactions
• With service providers (Stripe for payments, Firebase for hosting)
• When required by law or to protect rights
• With your consent

We never sell your personal information to third parties.`,
        },
        {
          title: '4. Payment Information',
          content: `Payment processing is handled securely by Stripe. We do not store your complete credit card information. Stripe's privacy policy applies to payment data.

Traveler payment information (Zelle email, CashApp ID) is stored securely and only shared with senders who purchase your capacity.`,
        },
        {
          title: '5. Data Security',
          content: `We implement appropriate security measures to protect your information:
• Encryption in transit and at rest
• Secure Firebase authentication
• Regular security audits
• Access controls and monitoring

However, no system is completely secure. Please use strong passwords and keep your account credentials safe.`,
        },
        {
          title: '6. Your Rights',
          content: `You have the right to:
• Access your personal data
• Correct inaccurate information
• Delete your account and data
• Opt out of marketing communications
• Export your data

Contact us at privacy@moova.app to exercise these rights.`,
        },
        {
          title: '7. Data Retention',
          content: `We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for legal compliance, fraud prevention, and dispute resolution.`,
        },
        {
          title: '8. Children\'s Privacy',
          content: `Moova is not intended for users under 18 years of age. We do not knowingly collect information from children. If we learn we have collected information from a child, we will delete it immediately.`,
        },
        {
          title: '9. Changes to This Policy',
          content: `We may update this privacy policy from time to time. We will notify you of significant changes by email or through the app. Your continued use after changes constitutes acceptance of the updated policy.`,
        },
        {
          title: '10. Contact Us',
          content: `If you have questions about this privacy policy, please contact us:

Email: privacy@moova.app
Website: www.moova.app

Moova, Inc.
[Address]
[City, State, ZIP]`,
        },
      ],
    },
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour : 15 janvier 2026',
      sections: [
        {
          title: '1. Informations que Nous Collectons',
          content: `Nous collectons les informations que vous nous fournissez directement lorsque vous :
• Créez un compte (nom, email, numéro de téléphone)
• Configurez un profil voyageur (informations de paiement)
• Créez des offres d'expédition ou achetez de la capacité
• Utilisez nos fonctionnalités de messagerie
• Effectuez ou recevez des paiements

Nous collectons également automatiquement :
• Informations sur l'appareil et identifiants
• Données de localisation (avec votre permission)
• Données d'utilisation et analyses`,
        },
        {
          title: '2. Comment Nous Utilisons Vos Informations',
          content: `Nous utilisons les informations collectées pour :
• Fournir et améliorer nos services
• Traiter les transactions et paiements
• Vous envoyer des mises à jour et notifications
• Prévenir la fraude et assurer la sécurité
• Respecter les obligations légales
• Communiquer avec vous sur nos services`,
        },
        {
          title: '3. Partage d\'Informations',
          content: `Nous partageons vos informations uniquement dans ces circonstances :
• Avec d'autres utilisateurs selon les besoins des transactions
• Avec des prestataires de services (Stripe pour les paiements, Firebase pour l'hébergement)
• Lorsque la loi l'exige ou pour protéger des droits
• Avec votre consentement

Nous ne vendons jamais vos informations personnelles à des tiers.`,
        },
        {
          title: '4. Informations de Paiement',
          content: `Le traitement des paiements est géré de manière sécurisée par Stripe. Nous ne stockons pas vos informations complètes de carte de crédit. La politique de confidentialité de Stripe s'applique aux données de paiement.

Les informations de paiement des voyageurs (email Zelle, ID CashApp) sont stockées en toute sécurité et partagées uniquement avec les expéditeurs qui achètent votre capacité.`,
        },
        {
          title: '5. Sécurité des Données',
          content: `Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations :
• Chiffrement en transit et au repos
• Authentification Firebase sécurisée
• Audits de sécurité réguliers
• Contrôles d'accès et surveillance

Cependant, aucun système n'est complètement sécurisé. Veuillez utiliser des mots de passe forts et garder vos identifiants en sécurité.`,
        },
        {
          title: '6. Vos Droits',
          content: `Vous avez le droit de :
• Accéder à vos données personnelles
• Corriger les informations inexactes
• Supprimer votre compte et vos données
• Refuser les communications marketing
• Exporter vos données

Contactez-nous à privacy@moova.app pour exercer ces droits.`,
        },
        {
          title: '7. Conservation des Données',
          content: `Nous conservons vos informations tant que votre compte est actif ou selon les besoins pour fournir des services. Après suppression du compte, nous pouvons conserver certaines données pour la conformité légale, la prévention de la fraude et la résolution des litiges.`,
        },
        {
          title: '8. Confidentialité des Enfants',
          content: `Moova n'est pas destiné aux utilisateurs de moins de 18 ans. Nous ne collectons pas sciemment d'informations auprès d'enfants. Si nous apprenons que nous avons collecté des informations auprès d'un enfant, nous les supprimerons immédiatement.`,
        },
        {
          title: '9. Modifications de Cette Politique',
          content: `Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Nous vous informerons des modifications importantes par email ou via l'application. Votre utilisation continue après les modifications constitue une acceptation de la politique mise à jour.`,
        },
        {
          title: '10. Nous Contacter',
          content: `Si vous avez des questions sur cette politique de confidentialité, veuillez nous contacter :

Email : privacy@moova.app
Site web : www.moova.app

Moova, Inc.
[Adresse]
[Ville, État, Code Postal]`,
        },
      ],
    },
  };

  const data = content[language];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.lastUpdated}>{data.lastUpdated}</Text>

          {data.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {language === 'en'
                ? 'By using Moova, you agree to this Privacy Policy.'
                : 'En utilisant Moova, vous acceptez cette Politique de Confidentialité.'}
            </Text>
          </View>
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
  lastUpdated: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  sectionContent: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.lg,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
