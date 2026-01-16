import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * TermsConditionsScreen
 * Displays the terms and conditions for using the Moova app
 */
export default function TermsConditionsScreen({ navigation }) {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Terms and Conditions',
      lastUpdated: 'Last updated: January 15, 2026',
      sections: [
        {
          title: '0. Privacy, Security, and Sharing Restrictions',
          content: `Moova prohibits screenshots and screen recording within the app. Sharing or reading of email addresses, phone numbers, or payment IDs (such as Zelle or CashApp) is strictly forbidden in chat and all other areas. Only photos sent as proof of package are allowed; all other photo sharing is prohibited. Violation of these rules may result in account suspension or termination.`,
        },
        {
          title: '1. Acceptance of Terms',
          content: `By accessing and using Moova, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.

These terms apply to all users including travelers, senders, and visitors.`,
        },
        {
          title: '2. Eligibility',
          content: `To use Moova, you must:
• Be at least 18 years of age
• Have the legal capacity to enter into contracts
• Provide accurate and complete registration information
• Comply with all applicable laws and regulations

You are responsible for maintaining the confidentiality of your account credentials.`,
        },
        {
          title: '3. User Accounts',
          content: `When creating an account, you agree to:
• Provide accurate, current, and complete information
• Maintain and update your information
• Keep your password secure and confidential
• Notify us immediately of any unauthorized use
• Be responsible for all activities under your account

We reserve the right to suspend or terminate accounts that violate these terms.`,
        },
        {
          title: '4. Traveler Responsibilities',
          content: `As a traveler, you agree to:
• Accurately represent your available luggage capacity
• Transport packages safely and securely
• Comply with all customs and airline regulations
• Deliver packages to the agreed destination
• Provide valid payment information (Zelle or CashApp)
• Not transport illegal, prohibited, or dangerous items

Travelers are responsible for ensuring compliance with international shipping laws.`,
        },
        {
          title: '5. Sender Responsibilities',
          content: `As a sender, you agree to:
• Accurately describe package contents and weight
• Not send illegal, prohibited, or dangerous items
• Comply with all customs and shipping regulations
• Provide accurate delivery information
• Pay the agreed amount plus applicable fees
• Respect traveler's terms and conditions

Senders are solely responsible for package contents and compliance with laws.`,
        },
        {
          title: '6. Payments and Fees',
          content: `Payment terms:
• Senders pay the base price plus a tiered service fee ($3.70-$7.00)
• Platform charges travelers 8% commission on base price
• Travelers receive 60% of earnings after 24 hours
• Remaining 40% released upon delivery confirmation
• All payments processed securely through Stripe

Fees are non-refundable except in cases of service failure or as required by law.`,
        },
        {
          title: '7. Prohibited Items',
          content: `The following items are strictly prohibited:
• Illegal substances or contraband
• Weapons, explosives, or hazardous materials
• Perishable goods without proper packaging
• Live animals
• Stolen goods
• Items that violate customs or airline regulations

Violation may result in account termination and legal action.`,
        },
        {
          title: '8. Liability and Disclaimers',
          content: `Moova provides a platform to connect users. We are not responsible for:
• Lost, damaged, or delayed packages
• User conduct or interactions
• Customs seizures or legal issues
• Accuracy of user-provided information
• Third-party services (Stripe, Firebase)

USE OF MOOVA IS AT YOUR OWN RISK. SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.`,
        },
        {
          title: '9. Limitation of Liability',
          content: `To the maximum extent permitted by law, Moova shall not be liable for:
• Indirect, incidental, or consequential damages
• Loss of profits, data, or business opportunities
• Damages exceeding the fees paid in the past 12 months

Some jurisdictions do not allow limitations on liability, so these may not apply to you.`,
        },
        {
          title: '10. Dispute Resolution',
          content: `In case of disputes:
• Users should first attempt to resolve directly
• Contact Moova support at support@moova.app
• Mediation may be required before legal action
• Disputes governed by [Jurisdiction] law
• Arbitration agreement [if applicable]

Payment disputes should be reported within 30 days.`,
        },
        {
          title: '11. Intellectual Property',
          content: `All content, trademarks, and intellectual property on Moova are owned by Moova, Inc. You may not:
• Copy, modify, or distribute our content
• Use our trademarks without permission
• Reverse engineer our software
• Create derivative works

User-generated content remains your property, but you grant us a license to use it for service operation.`,
        },
        {
          title: '12. Privacy',
          content: `Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using Moova, you consent to our data practices as described in the Privacy Policy.`,
        },
        {
          title: '13. Termination',
          content: `We may suspend or terminate your account if you:
• Violate these terms
• Engage in fraudulent activity
• Transport prohibited items
• Receive multiple user complaints
• Fail to comply with laws

You may close your account at any time through the app settings.`,
        },
        {
          title: '14. Changes to Terms',
          content: `We reserve the right to modify these terms at any time. We will notify users of significant changes via email or app notification. Continued use after changes constitutes acceptance of the new terms.`,
        },
        {
          title: '15. Contact Information',
          content: `For questions about these terms, contact us:

Email: legal@moova.app
Support: support@moova.app
Website: www.moova.app

Moova, Inc.
[Address]
[City, State, ZIP]`,
        },
      ],
    },
    fr: {
      title: 'Conditions Générales',
      lastUpdated: 'Dernière mise à jour : 15 janvier 2026',
      sections: [
        {
          title: '1. Acceptation des Conditions',
          content: `En accédant et en utilisant Moova, vous acceptez d'être lié par ces Conditions Générales. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.

Ces conditions s'appliquent à tous les utilisateurs, y compris les voyageurs, les expéditeurs et les visiteurs.`,
        },
        {
          title: '2. Éligibilité',
          content: `Pour utiliser Moova, vous devez :
• Avoir au moins 18 ans
• Avoir la capacité légale de conclure des contrats
• Fournir des informations d'inscription exactes et complètes
• Respecter toutes les lois et réglementations applicables

Vous êtes responsable du maintien de la confidentialité de vos identifiants.`,
        },
        {
          title: '3. Comptes Utilisateurs',
          content: `Lors de la création d'un compte, vous acceptez de :
• Fournir des informations exactes, actuelles et complètes
• Maintenir et mettre à jour vos informations
• Garder votre mot de passe sécurisé et confidentiel
• Nous informer immédiatement de toute utilisation non autorisée
• Être responsable de toutes les activités sous votre compte

Nous nous réservons le droit de suspendre ou résilier les comptes qui violent ces conditions.`,
        },
        {
          title: '4. Responsabilités des Voyageurs',
          content: `En tant que voyageur, vous acceptez de :
• Représenter avec précision votre capacité de bagages disponible
• Transporter les colis en toute sécurité
• Respecter toutes les réglementations douanières et aériennes
• Livrer les colis à la destination convenue
• Fournir des informations de paiement valides (Zelle ou CashApp)
• Ne pas transporter d'articles illégaux, interdits ou dangereux

Les voyageurs sont responsables du respect des lois d'expédition internationales.`,
        },
        {
          title: '5. Responsabilités des Expéditeurs',
          content: `En tant qu'expéditeur, vous acceptez de :
• Décrire avec précision le contenu et le poids du colis
• Ne pas envoyer d'articles illégaux, interdits ou dangereux
• Respecter toutes les réglementations douanières et d'expédition
• Fournir des informations de livraison exactes
• Payer le montant convenu plus les frais applicables
• Respecter les conditions générales du voyageur

Les expéditeurs sont seuls responsables du contenu des colis et du respect des lois.`,
        },
        {
          title: '6. Paiements et Frais',
          content: `Conditions de paiement :
• Les expéditeurs paient le prix de base plus des frais de service échelonnés (3,70 $ à 7,00 $)
• La plateforme facture aux voyageurs 8 % de commission sur le prix de base
• Les voyageurs reçoivent 60 % des gains après 24 heures
• Les 40 % restants sont libérés à la confirmation de livraison
• Tous les paiements sont traités en toute sécurité via Stripe

Les frais ne sont pas remboursables sauf en cas de défaillance du service ou si la loi l'exige.`,
        },
        {
          title: '7. Articles Interdits',
          content: `Les articles suivants sont strictement interdits :
• Substances illégales ou contrebande
• Armes, explosifs ou matières dangereuses
• Denrées périssables sans emballage approprié
• Animaux vivants
• Biens volés
• Articles qui violent les réglementations douanières ou aériennes

La violation peut entraîner la résiliation du compte et des poursuites judiciaires.`,
        },
        {
          title: '8. Responsabilité et Dénis',
          content: `Moova fournit une plateforme pour connecter les utilisateurs. Nous ne sommes pas responsables de :
• Colis perdus, endommagés ou retardés
• Conduite ou interactions des utilisateurs
• Saisies douanières ou problèmes juridiques
• Exactitude des informations fournies par les utilisateurs
• Services tiers (Stripe, Firebase)

L'UTILISATION DE MOOVA EST À VOS PROPRES RISQUES. LES SERVICES SONT FOURNIS "EN L'ÉTAT" SANS GARANTIES D'AUCUNE SORTE.`,
        },
        {
          title: '9. Limitation de Responsabilité',
          content: `Dans la mesure maximale autorisée par la loi, Moova ne sera pas responsable de :
• Dommages indirects, accessoires ou consécutifs
• Perte de profits, de données ou d'opportunités commerciales
• Dommages dépassant les frais payés au cours des 12 derniers mois

Certaines juridictions n'autorisent pas les limitations de responsabilité, celles-ci peuvent donc ne pas s'appliquer à vous.`,
        },
        {
          title: '10. Résolution des Litiges',
          content: `En cas de litiges :
• Les utilisateurs doivent d'abord tenter de résoudre directement
• Contacter le support Moova à support@moova.app
• La médiation peut être requise avant toute action en justice
• Litiges régis par la loi de [Juridiction]
• Accord d'arbitrage [le cas échéant]

Les litiges de paiement doivent être signalés dans les 30 jours.`,
        },
        {
          title: '11. Propriété Intellectuelle',
          content: `Tout le contenu, les marques et la propriété intellectuelle sur Moova appartiennent à Moova, Inc. Vous ne pouvez pas :
• Copier, modifier ou distribuer notre contenu
• Utiliser nos marques sans autorisation
• Effectuer de l'ingénierie inverse de notre logiciel
• Créer des œuvres dérivées

Le contenu généré par les utilisateurs reste votre propriété, mais vous nous accordez une licence pour l'utiliser pour le fonctionnement du service.`,
        },
        {
          title: '12. Confidentialité',
          content: `Votre vie privée est importante pour nous. Notre Politique de Confidentialité explique comment nous collectons, utilisons et protégeons vos informations. En utilisant Moova, vous consentez à nos pratiques de données décrites dans la Politique de Confidentialité.`,
        },
        {
          title: '13. Résiliation',
          content: `Nous pouvons suspendre ou résilier votre compte si vous :
• Violez ces conditions
• Vous engagez dans une activité frauduleuse
• Transportez des articles interdits
• Recevez plusieurs plaintes d'utilisateurs
• Ne respectez pas les lois

Vous pouvez fermer votre compte à tout moment via les paramètres de l'application.`,
        },
        {
          title: '14. Modifications des Conditions',
          content: `Nous nous réservons le droit de modifier ces conditions à tout moment. Nous informerons les utilisateurs des changements importants par email ou notification dans l'application. L'utilisation continue après les modifications constitue une acceptation des nouvelles conditions.`,
        },
        {
          title: '15. Informations de Contact',
          content: `Pour des questions sur ces conditions, contactez-nous :

Email : legal@moova.app
Support : support@moova.app
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
                ? 'By using Moova, you agree to these Terms and Conditions.'
                : 'En utilisant Moova, vous acceptez ces Conditions Générales.'}
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
