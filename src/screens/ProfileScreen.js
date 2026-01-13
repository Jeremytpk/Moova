import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import theme from '../theme';
import Button from '../components/Button';
import { ProfileIcon, PackageIcon, ShipmentIcon, SettingsIcon, ArrowRightIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ProfileScreen
 * User profile and settings
 */
export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const { language, toggleLanguage } = useLanguage();

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
      quickActions: 'Quick Actions',
      myShipments: 'My Shipments',
      myOffers: 'My Offers',
      language: 'Language',
      signOut: 'Sign Out',
      version: 'Version',
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
      quickActions: 'Actions Rapides',
      myShipments: 'Mes Envois',
      myOffers: 'Mes Offres',
      language: 'Langue',
      signOut: 'Se Déconnecter',
      version: 'Version',
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
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <ProfileIcon size={60} color={theme.colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>{text.editProfile}</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
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
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.quickActions}</Text>
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <ShipmentIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>{text.myShipments}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <PackageIcon size={20} color={theme.colors.success} />
            </View>
            <Text style={styles.actionText}>{text.myOffers}</Text>
            <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={toggleLanguage}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.languageIcon}>{language === 'en' ? '🇬🇧' : '🇫🇷'}</Text>
            </View>
            <Text style={styles.actionText}>{text.language}</Text>
            <Text style={styles.languageValue}>{language === 'en' ? 'English' : 'Français'}</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <Button
          title={text.signOut}
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        {/* App Version */}
        <Text style={styles.versionText}>{text.version} 1.0.0</Text>
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
    borderRadius: 50,
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
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    ...theme.typography.body,
    color: theme.colors.white + 'DD',
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
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    textTransform: 'capitalize',
  },
  userEmail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
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
    color: theme.colors.white,
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
});
