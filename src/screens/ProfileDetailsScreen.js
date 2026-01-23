import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image, Platform } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import theme from '../theme';
import { ProfileIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';
import Loading from '../components/Loading';
import { EditIcon } from '../components/Icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

/**
 * ProfileDetailsScreen
 * Shows complete user profile information including payment details
 * Accessible only to logged-in users
 */
export default function ProfileDetailsScreen({ navigation }) {
  // Screenshot blocking removed for Expo compatibility
  // Profile photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { language } = useLanguage();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOffers: 0, totalShipments: 0, totalEarnings: 0 });
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  // Name edit state and handler
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      setNameError(language === 'en' ? 'Name cannot be empty.' : 'Le nom ne peut pas être vide.');
      return;
    }
    setNameError('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { name: nameInput.trim() });
      setUserData({ ...userData, name: nameInput.trim() });
      setShowNameModal(false);
      Alert.alert(
        language === 'en' ? 'Success' : 'Succès',
        language === 'en' ? 'Name updated.' : 'Nom mis à jour.'
      );
    } catch (error) {
      setNameError(language === 'en' ? 'Failed to update name.' : 'Échec de la mise à jour.');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigation.goBack();
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch statistics from collections
        const offersQuery = query(
          collection(db, 'offers'),
          where('userId', '==', currentUser.uid)
        );

        const [offersSnapshot, shipmentsSnapshot] = await Promise.all([
          getDocs(offersQuery),
          getDocs(collection(db, 'users', currentUser.uid, 'shipments')),
        ]);

        const totalOffers = offersSnapshot.size;
        const totalShipments = shipmentsSnapshot.size;

        // Calculate total earnings from all offers (sum of totalEarnings per offer)
        let totalEarnings = 0;
        offersSnapshot.forEach(doc => {
          const offer = doc.data();
          totalEarnings += offer.totalEarnings || 0;
        });

        setStats({ totalOffers, totalShipments, totalEarnings });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const translations = {
    en: {
      profileDetails: 'Profile Details',
      personalInfo: 'Personal Information',
      username: 'Username',
      email: 'Email',
      phoneNumber: 'Phone Number',
      memberSince: 'Member Since',
      accountType: 'Account Type',
      regularAccount: 'Regular Account',
      verifiedTraveler: 'Verified Traveler',
      travelerInfo: 'Traveler Information',
      paymentMethod: 'Payment Method',
      zelleEmail: 'Zelle Email',
      zellePhone: 'Zelle Phone',
      cashappTag: 'CashApp Tag',
      setupTraveler: 'Setup Traveler Account',
      editPayment: 'Edit Payment Information',
      accountStats: 'Account Statistics',
      totalOffers: 'Total Offers Created',
      totalShipments: 'Total Shipments',
      totalEarnings: 'Total Earnings',
      notAvailable: 'Not Available',
    },
    fr: {
      profileDetails: 'Détails du Profil',
      personalInfo: 'Informations Personnelles',
      username: 'Nom d\'utilisateur',
      email: 'Email',
      phoneNumber: 'Numéro de Téléphone',
      memberSince: 'Membre Depuis',
      accountType: 'Type de Compte',
      regularAccount: 'Compte Régulier',
      verifiedTraveler: 'Voyageur Vérifié',
      travelerInfo: 'Informations Voyageur',
      paymentMethod: 'Méthode de Paiement',
      zelleEmail: 'Email Zelle',
      zellePhone: 'Téléphone Zelle',
      cashappTag: 'Tag CashApp',
      setupTraveler: 'Configurer Compte Voyageur',
      editPayment: 'Modifier Informations de Paiement',
      accountStats: 'Statistiques du Compte',
      totalOffers: 'Offres Créées',
      totalShipments: 'Envois Totaux',
      totalEarnings: 'Gains Totaux',
      notAvailable: 'Non Disponible',
    },
  };

  const text = translations[language];

  if (loading) {
    return <Loading fullScreen />;
  }

  const currentUser = auth.currentUser;
  if (!currentUser || !userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load profile data</Text>
      </View>
    );
  }

  const isTraveler = userData.isTraveler || false;
  const travelerPayment = userData.travelerPayment || null;

  // Phone number validation (simple international format)
  const validatePhone = (phone) => {
    // Accepts +countrycode and 10-15 digits
    const regex = /^\+?[0-9]{10,15}$/;
    return regex.test(phone);
  };

  // Save phone number to Firestore
  const handleSavePhone = async () => {
    if (!validatePhone(phoneInput)) {
      setPhoneError(language === 'en' ? 'Invalid phone number format.' : 'Format de numéro invalide.');
      return;
    }
    setPhoneError('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { phone: phoneInput });
      setUserData({ ...userData, phone: phoneInput });
      setShowPhoneModal(false);
      Alert.alert(
        language === 'en' ? 'Success' : 'Succès',
        language === 'en' ? 'Phone number updated.' : 'Numéro de téléphone mis à jour.'
      );
    } catch (error) {
      setPhoneError(language === 'en' ? 'Failed to update phone number.' : 'Échec de la mise à jour.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Card with Avatar */}
      <View style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  // Request permission (skip on web - browser handles this)
                  if (Platform.OS !== 'web') {
                    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

                    if (permissionResult.granted === false) {
                      Alert.alert(
                        language === 'en' ? 'Permission Required' : 'Permission requise',
                        language === 'en' ? 'Please allow access to your photo library.' : 'Veuillez autoriser l\'accès à votre bibliothèque photos.'
                      );
                      return;
                    }
                  }

                  // Pick image from gallery
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                  });

                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    setUploadingPhoto(true);
                    try {
                      const asset = result.assets[0];
                      const response = await fetch(asset.uri);
                      const blob = await response.blob();
                      const currentUser = auth.currentUser;
                      if (!currentUser) return;
                      const photoRef = ref(storage, `profilePhotos/${currentUser.uid}.jpg`);
                      await uploadBytes(photoRef, blob);
                      const photoURL = await getDownloadURL(photoRef);

                      // Update both Firestore and Firebase Auth profile
                      const userRef = doc(db, 'users', currentUser.uid);
                      await updateDoc(userRef, { photoURL });
                      await updateProfile(currentUser, { photoURL });

                      setUserData({ ...userData, photoURL });
                      Alert.alert(
                        language === 'en' ? 'Success' : 'Succès',
                        language === 'en' ? 'Profile photo updated.' : 'Photo de profil mise à jour.'
                      );
                    } catch (error) {
                      console.error('Upload error:', error);
                      Alert.alert(
                        language === 'en' ? 'Error' : 'Erreur',
                        language === 'en' ? 'Failed to upload photo.' : 'Échec du téléchargement.'
                      );
                    } finally {
                      setUploadingPhoto(false);
                    }
                  }
                } catch (error) {
                  console.error('Image picker error:', error);
                  Alert.alert(
                    language === 'en' ? 'Error' : 'Erreur',
                    language === 'en' ? 'Failed to open image picker.' : 'Échec de l\'ouverture du sélecteur d\'images.'
                  );
                }
              }}
              accessibilityLabel={language === 'en' ? 'Edit profile photo' : 'Modifier la photo de profil'}
              style={styles.avatarContainer}
            >
              {userData?.photoURL ? (
                <Image source={{ uri: userData.photoURL }} style={styles.avatarImage} />
              ) : (
                <ProfileIcon size={80} color={theme.colors.primary} />
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{language === 'en' ? 'Uploading...' : 'Téléchargement...'}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isTraveler && (
              <View style={styles.travelerBadge}>
                <Text style={styles.badgeText}>✓</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.userName}>{userData.username || auth.currentUser?.email?.split('@')[0]}</Text>
        <View style={styles.accountTypeBadge}>
          <Text style={styles.accountTypeText}>
            {isTraveler ? text.verifiedTraveler : text.regularAccount}
          </Text>
        </View>
      </View>

      {/* Personal Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{text.personalInfo}</Text>

        <View style={styles.infoRow}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}
            onPress={() => setShowNameModal(true)}
            accessibilityLabel={language === 'en' ? 'Edit name' : 'Modifier le nom'}
          >
            <Text style={styles.infoLabel}>{language === 'en' ? 'Name' : 'Nom'}</Text>
            <Text style={styles.infoValue}>{userData.name || text.notAvailable}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{text.username}</Text>
          <Text style={styles.infoValue}>{userData.username || text.notAvailable}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{text.email}</Text>
          <Text style={styles.infoValue}>{auth.currentUser?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}
            onPress={() => setShowPhoneModal(true)}
            accessibilityLabel={language === 'en' ? 'Edit phone number' : 'Modifier le numéro de téléphone'}
          >
            <Text style={styles.infoLabel}>{text.phoneNumber}</Text>
            <Text style={styles.infoValue}>{userData.phone || text.notAvailable}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{text.memberSince}</Text>
          <Text style={styles.infoValue}>
            {auth.currentUser?.metadata?.creationTime
              ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString()
              : text.notAvailable}
          </Text>
        </View>

        <Text style={styles.editInfoHint}>
          {language === 'en'
            ? 'Tap on your name or phone number to edit.'
            : 'Appuyez sur votre nom ou numéro pour modifier.'}
        </Text>
      </View>

      {/* Traveler Information Section */}
      {isTraveler ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.travelerInfo}</Text>

          {travelerPayment ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{text.paymentMethod}</Text>
                <Text style={styles.infoValue}>
                  {travelerPayment.method === 'zelle' ? 'Zelle' : 'CashApp'}
                </Text>
              </View>

              {travelerPayment.method === 'zelle' && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{text.zelleEmail}</Text>
                    <Text style={styles.infoValue}>{travelerPayment.zelleEmail}</Text>
                  </View>
                  {travelerPayment.zellePhone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{text.zellePhone}</Text>
                      <Text style={styles.infoValue}>{travelerPayment.zellePhone}</Text>
                    </View>
                  )}
                </>
              )}

              {travelerPayment.method === 'cashapp' && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{text.cashappTag}</Text>
                  <Text style={styles.infoValue}>{travelerPayment.cashappTag}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('TravelerSetup')}
              >
                <Text style={styles.editButtonText}>{text.editPayment}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => navigation.navigate('TravelerSetup')}
            >
              <Text style={styles.setupButtonText}>{text.setupTraveler}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.accountType}</Text>
          <Text style={styles.setupDescription}>
            {language === 'en'
              ? 'Become a traveler to create offers and earn money by delivering packages.'
              : 'Devenez voyageur pour créer des offres et gagner de l\'argent en livrant des colis.'}
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => navigation.navigate('TravelerSetup')}
          >
            <Text style={styles.setupButtonText}>{text.setupTraveler}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Account Statistics Section */}
      {isTraveler && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.accountStats}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalOffers}</Text>
              <Text style={styles.statLabel}>{text.totalOffers}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalShipments}</Text>
              <Text style={styles.statLabel}>{text.totalShipments}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ${stats.totalEarnings.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>{text.totalEarnings}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Phone Edit Modal */}
      {/* Name Edit Modal */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              {language === 'en' ? 'Edit Name' : 'Modifier le nom'}
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginBottom: 8 }}
              placeholder={userData.name || (language === 'en' ? 'Enter your name' : 'Entrez votre nom')}
              value={nameInput}
              onChangeText={setNameInput}
            />
            {nameError ? (
              <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{nameError}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600', fontSize: 16 }}>
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 16 }}>
                  {language === 'en' ? 'Save' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              {language === 'en' ? 'Edit Phone Number' : 'Modifier le numéro de téléphone'}
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginBottom: 8 }}
              placeholder={userData.phone || (language === 'en' ? 'Enter phone number' : 'Entrez le numéro')}
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={setPhoneInput}
            />
            {phoneError ? (
              <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{phoneError}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600', fontSize: 16 }}>
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePhone}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 16 }}>
                  {language === 'en' ? 'Save' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  editInfoHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  headerCard: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  travelerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    zIndex: 10,
    elevation: 10,
  },
  travelerBadgeLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginRight: 16,
    ...theme.shadows.md,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userName: {
    ...theme.typography.h1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    textTransform: 'capitalize',
  },
  realName: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  accountTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    top: 5,
  },
  accountTypeText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  editButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  setupButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  setupButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  setupDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
