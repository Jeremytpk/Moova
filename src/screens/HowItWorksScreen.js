import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRightIcon, PackageIcon, ShipmentIcon, BookIcon } from '../components/Icons';

/**
 * HowItWorksScreen
 * Hub screen for learning how to use Moova as a sender or traveler
 */
export default function HowItWorksScreen({ navigation }) {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'How Moova Works',
      subtitle: 'Learn how to use Moova to send packages or earn money as a traveler',
      senderCard: {
        title: 'Send a Package',
        description: 'Learn how to find travelers, book capacity, pay securely, and track your shipment to Kinshasa.',
        buttonText: 'Learn More',
      },
      travelerCard: {
        title: 'Earn as a Traveler',
        description: 'Learn how to create offers, accept deliveries, and earn money by carrying packages on your trip.',
        buttonText: 'Learn More',
      },
      tutorialCard: {
        title: 'App Tutorial',
        description: 'Watch a quick walkthrough of the app features and how to navigate Moova.',
        buttonText: 'View Tutorial',
      },
    },
    fr: {
      title: 'Comment Moova Fonctionne',
      subtitle: 'Apprenez a utiliser Moova pour envoyer des colis ou gagner de l\'argent en tant que voyageur',
      senderCard: {
        title: 'Envoyer un Colis',
        description: 'Apprenez a trouver des voyageurs, reserver de la capacite, payer en securite et suivre votre envoi vers Kinshasa.',
        buttonText: 'En Savoir Plus',
      },
      travelerCard: {
        title: 'Gagner en tant que Voyageur',
        description: 'Apprenez a creer des offres, accepter des livraisons et gagner de l\'argent en transportant des colis lors de votre voyage.',
        buttonText: 'En Savoir Plus',
      },
      tutorialCard: {
        title: 'Tutoriel de l\'App',
        description: 'Regardez une presentation rapide des fonctionnalites de l\'application et comment naviguer dans Moova.',
        buttonText: 'Voir le Tutoriel',
      },
    },
  };

  const data = content[language];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>

          {/* Sender Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('HowItWorksSender')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <ShipmentIcon size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{data.senderCard.title}</Text>
              <Text style={styles.cardDescription}>{data.senderCard.description}</Text>
            </View>
            <View style={styles.cardButton}>
              <Text style={[styles.cardButtonText, { color: theme.colors.primary }]}>{data.senderCard.buttonText}</Text>
              <ArrowRightIcon size={16} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Traveler Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('HowItWorksTraveler')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '15' }]}>
              <PackageIcon size={32} color={theme.colors.success} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{data.travelerCard.title}</Text>
              <Text style={styles.cardDescription}>{data.travelerCard.description}</Text>
            </View>
            <View style={styles.cardButton}>
              <Text style={[styles.cardButtonText, { color: theme.colors.success }]}>{data.travelerCard.buttonText}</Text>
              <ArrowRightIcon size={16} color={theme.colors.success} />
            </View>
          </TouchableOpacity>

          {/* Tutorial Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Onboarding')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
              <BookIcon size={32} color={theme.colors.warning} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{data.tutorialCard.title}</Text>
              <Text style={styles.cardDescription}>{data.tutorialCard.description}</Text>
            </View>
            <View style={styles.cardButton}>
              <Text style={[styles.cardButtonText, { color: theme.colors.warning }]}>{data.tutorialCard.buttonText}</Text>
              <ArrowRightIcon size={16} color={theme.colors.warning} />
            </View>
          </TouchableOpacity>

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
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  cardButtonText: {
    ...theme.typography.button,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: theme.spacing.xxl,
  },
});
