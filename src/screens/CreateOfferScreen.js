import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * CreateOfferScreen
 * Allows travelers to create new shipment offers
 * Requires authentication
 */
export default function CreateOfferScreen({ navigation }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('Kinshasa');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pricePerKg, setPricePerKg] = useState('');
  const [capacity, setCapacity] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  // Translations
  const translations = {
    en: {
      createNewOffer: 'Create New Offer',
      offerDescription: 'Offer to bring packages from your location to Kinshasa',
      originLabel: 'Origin City, State, Country',
      originPlaceholder: 'e.g., New York',
      destinationLabel: 'Destination City, Country',
      destinationPlaceholder: 'Kinshasa',
      travelDate: 'Travel Date',
      pricePerKg: 'Price per Kg ($)',
      pricePlaceholder: '0.00',
      availableCapacity: 'Available Capacity (kg)',
      capacityPlaceholder: '0',
      createOffer: 'Create Offer',
      creatingOffer: 'Creating Offer...',
      offerCreated: 'Offer Created!',
      offerCreatedMsg: 'Your travel offer from',
      to: 'to',
      successCreated: 'has been successfully created.',
      sendersCanFind: 'Senders can now find and book your offer!',
      done: 'Done',
      originRequired: 'Origin city is required',
      destinationRequired: 'Destination is required',
      priceRequired: 'Price per kg is required',
      validPrice: 'Please enter a valid price',
      capacityRequired: 'Capacity is required',
      validCapacity: 'Please enter a valid capacity',
      failedToCreate: 'Failed to create offer. Please try again.',
    },
    fr: {
      createNewOffer: 'Créer une Nouvelle Offre',
      offerDescription: 'Proposez d\'apporter des colis de votre emplacement à Kinshasa',
      originLabel: 'Ville d\'Origine, État, Pays',
      originPlaceholder: 'ex: Paris',
      destinationLabel: 'Ville de Destination, Pays',
      destinationPlaceholder: 'Kinshasa',
      travelDate: 'Date de Voyage',
      pricePerKg: 'Prix par Kg ($)',
      pricePlaceholder: '0.00',
      availableCapacity: 'Capacité Disponible (kg)',
      capacityPlaceholder: '0',
      createOffer: 'Créer l\'Offre',
      creatingOffer: 'Création en cours...',
      offerCreated: 'Offre Créée!',
      offerCreatedMsg: 'Votre offre de voyage de',
      to: 'vers',
      successCreated: 'a été créée avec succès.',
      sendersCanFind: 'Les expéditeurs peuvent maintenant trouver et réserver votre offre!',
      done: 'Terminé',
      originRequired: 'La ville d\'origine est requise',
      destinationRequired: 'La destination est requise',
      priceRequired: 'Le prix par kg est requis',
      validPrice: 'Veuillez entrer un prix valide',
      capacityRequired: 'La capacité est requise',
      validCapacity: 'Veuillez entrer une capacité valide',
      failedToCreate: 'Échec de la création de l\'offre. Veuillez réessayer.',
    },
  };

  const text = translations[language];

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validateInputs = () => {
    const newErrors = {};

    if (!origin.trim()) {
      newErrors.origin = text.originRequired;
    }

    if (!destination.trim()) {
      newErrors.destination = text.destinationRequired;
    }

    if (!pricePerKg.trim()) {
      newErrors.pricePerKg = text.priceRequired;
    } else if (isNaN(parseFloat(pricePerKg)) || parseFloat(pricePerKg) <= 0) {
      newErrors.pricePerKg = text.validPrice;
    }

    if (!capacity.trim()) {
      newErrors.capacity = text.capacityRequired;
    } else if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
      newErrors.capacity = text.validCapacity;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      
      if (!user) {
        console.error('No user logged in');
        setLoading(false);
        return;
      }

      // Create offer document in Firestore
      // Get user's username from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const username = userData.username || userData.name || user.email;
      
      const offerData = {
        origin: origin.trim(),
        destination: destination.trim(),
        date: Timestamp.fromDate(date),
        pricePerKg: parseFloat(pricePerKg),
        availableCapacity: parseInt(capacity),
        totalCapacity: parseInt(capacity),
        status: 'active',
        userId: user.uid,
        userEmail: user.email,
        userUsername: username,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'offers'), offerData);
      
      console.log('Offer created successfully:', offerData);
      setLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating offer:', error);
      setLoading(false);
      // Show error to user
      alert(text.failedToCreate);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Reset form
    setOrigin('');
    setDestination('Kinshasa');
    setDate(new Date());
    setPricePerKg('');
    setCapacity('');
    setErrors({});
    // Navigate back to search screen
    navigation.navigate('SearchResults');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{text.createNewOffer}</Text>
        <Text style={styles.subtitle}>
          {text.offerDescription}
        </Text>

        <Input
          label={text.originLabel}
          value={origin}
          onChangeText={(text) => {
            setOrigin(text);
            if (errors.origin) setErrors({ ...errors, origin: null });
          }}
          placeholder={text.originPlaceholder}
          error={errors.origin}
        />

        <Input
          label={text.destinationLabel}
          value={destination}
          onChangeText={(text) => {
            setDestination(text);
            if (errors.destination) setErrors({ ...errors, destination: null });
          }}
          placeholder={text.destinationPlaceholder}
          error={errors.destination}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{text.travelDate}</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        <Input
          label={text.pricePerKg}
          value={pricePerKg}
          onChangeText={(text) => {
            setPricePerKg(text);
            if (errors.pricePerKg) setErrors({ ...errors, pricePerKg: null });
          }}
          placeholder={text.pricePlaceholder}
          keyboardType="decimal-pad"
          error={errors.pricePerKg}
        />

        <Input
          label={text.availableCapacity}
          value={capacity}
          onChangeText={(text) => {
            setCapacity(text);
            if (errors.capacity) setErrors({ ...errors, capacity: null });
          }}
          placeholder={text.capacityPlaceholder}
          keyboardType="number-pad"
          error={errors.capacity}
        />

        <Button
          title={loading ? text.creatingOffer : text.createOffer}
          variant="primary"
          onPress={handleSubmit}
          disabled={loading}
          style={styles.button}
        />
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logoMoova.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>

            <Text style={styles.modalTitle}>{text.offerCreated}</Text>
            <Text style={styles.modalMessage}>
              {text.offerCreatedMsg} <Text style={styles.boldText}>{origin}</Text> {text.to} <Text style={styles.boldText}>{destination}</Text> {text.successCreated}
            </Text>
            <Text style={styles.modalSubMessage}>
              {text.sendersCanFind}
            </Text>

            <Button
              title={text.done}
              variant="primary"
              onPress={handleSuccessClose}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  datePickerButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  dateText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 16,
  },
  button: {
    marginTop: theme.spacing.md,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 15,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  successIcon: {
    fontSize: 36,
    color: theme.colors.white,
    fontWeight: '700',
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 22,
  },
  modalSubMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontSize: 14,
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalButton: {
    width: '100%',
  },
});
