import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { Modal as RNModal } from 'react-native';

/**
 * TravelerDeliveriesScreen
 * Shows deliveries for the traveler's offers
 * Allows verification of delivery codes
 */
export default function TravelerDeliveriesScreen({ navigation }) {
  const { language } = useLanguage();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultModal, setResultModal] = useState(null); // 'success' | 'error' | null
  const currentUser = auth.currentUser;

  // Translations
  const translations = {
    en: {
      title: 'My Deliveries',
      subtitle: 'Packages to deliver to Kinshasa',
      noDeliveries: 'No deliveries yet',
      noDeliveriesDesc: 'Deliveries will appear here when someone books your offer',
      sender: 'Sender',
      kg: 'kg',
      status: 'Status',
      pending: 'Pending Pickup',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      amount: 'Amount',
      verifyDelivery: 'Verify Delivery',
      enterCode: 'Enter Verification Code',
      codePlaceholder: '6-digit code',
      verify: 'Verify & Complete Delivery',
      cancel: 'Cancel',
      invalidCode: 'Invalid verification code',
      deliverySuccess: 'Delivery Confirmed!',
      deliverySuccessMsg: 'The package has been successfully delivered.',
      codeInstruction: 'Ask the recipient for the 6-digit verification code',
      orderNumber: 'Order #',
    },
    fr: {
      title: 'Mes Livraisons',
      subtitle: 'Colis à livrer à Kinshasa',
      noDeliveries: 'Aucune livraison',
      noDeliveriesDesc: 'Les livraisons apparaîtront ici lorsque quelqu\'un réservera votre offre',
      sender: 'Expéditeur',
      kg: 'kg',
      status: 'Statut',
      pending: 'En attente de collecte',
      picked_up: 'Collecté',
      in_transit: 'En transit',
      delivered: 'Livré',
      amount: 'Montant',
      verifyDelivery: 'Vérifier la Livraison',
      enterCode: 'Entrez le Code de Vérification',
      codePlaceholder: 'Code à 6 chiffres',
      verify: 'Vérifier et Confirmer la Livraison',
      cancel: 'Annuler',
      invalidCode: 'Code de vérification invalide',
      deliverySuccess: 'Livraison Confirmée!',
      deliverySuccessMsg: 'Le colis a été livré avec succès.',
      codeInstruction: 'Demandez au destinataire le code de vérification à 6 chiffres',
      orderNumber: 'Commande #',
    },
  };

  const text = translations[language];

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Get all users to search their shipments
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allDeliveries = [];

      // Search through each user's shipments subcollection
      for (const userDoc of usersSnapshot.docs) {
        const shipmentsRef = collection(db, 'users', userDoc.id, 'shipments');
        const q = query(shipmentsRef, where('travelerId', '==', currentUser.uid));
        const shipmentsSnapshot = await getDocs(q);
        
        shipmentsSnapshot.forEach((doc) => {
          allDeliveries.push({
            id: doc.id,
            senderId: userDoc.id,
            ...doc.data(),
          });
        });
      }

      // Sort by date, most recent first
      allDeliveries.sort((a, b) => {
        const dateA = a.paymentDate?.seconds || 0;
        const dateB = b.paymentDate?.seconds || 0;
        return dateB - dateA;
      });

      setDeliveries(allDeliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA726';
      case 'picked_up':
        return '#42A5F5';
      case 'in_transit':
        return '#7E57C2';
      case 'delivered':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    return text[status] || status;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openVerifyModal = (delivery) => {
    if (delivery.status === 'delivered') {
      Alert.alert('Already Delivered', 'This package has already been delivered.');
      return;
    }
    setSelectedDelivery(delivery);
    setEnteredCode('');
    setVerifyModalVisible(true);
  };

  const verifyAndDeliver = async () => {
    if (!enteredCode || enteredCode.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit verification code');
      return;
    }

    if (enteredCode !== selectedDelivery.verificationCode) {
      setResultModal('error');
      return;
    }

    try {
      setVerifying(true);

      // Update the shipment status to delivered
      const shipmentRef = doc(db, 'users', selectedDelivery.senderId, 'shipments', selectedDelivery.id);
      await updateDoc(shipmentRef, {
        status: 'delivered',
        deliveredAt: new Date(),
      });

      // Close modal and show success
      setVerifyModalVisible(false);
      setResultModal('success');
      // ...existing code...
    } catch (error) {
      console.error('Error verifying delivery:', error);
      Alert.alert('Error', 'Failed to verify delivery. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Filter deliveries by search query
  const filteredDeliveries = deliveries.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (item.orderNumber && item.orderNumber.toLowerCase().includes(query)) ||
      (item.senderName && item.senderName.toLowerCase().includes(query)) ||
      (item.departure && item.departure.toLowerCase().includes(query)) ||
      (item.arrival && item.arrival.toLowerCase().includes(query))
    );
  });

  const renderDelivery = ({ item }) => (
    <View style={styles.deliveryCard}>
      {/* Order Number Badge above locations, not absolute */}
      {item.orderNumber && (
        <View style={styles.orderNumberBadgeStatic}>
          <Text style={styles.orderNumberText}>
            {text.orderNumber}{item.orderNumber}
          </Text>
        </View>
      )}
      <View style={styles.deliveryHeader}>
        <View style={styles.routeContainer}>
          <Text style={styles.cityText}>{item.departure}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.cityText}>{item.arrival}</Text>
        </View>
      </View>
      
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{text.sender}:</Text>
          <Text style={styles.detailValue}>{item.senderName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{text.kg}:</Text>
          <Text style={styles.detailValue}>{item.kg}kg</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{text.amount}:</Text>
          <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
        </View>
      </View>

      {item.status !== 'delivered' && (
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => openVerifyModal(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.verifyButtonText}>{text.verifyDelivery}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.dateText}>{formatDate(item.paymentDate)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.subtitle}>{text.subtitle}</Text>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              language === 'fr'
                ? 'Rechercher par commande, expéditeur ou ville'
                : 'Search by order, sender, or city'
            }
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {filteredDeliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{text.noDeliveries}</Text>
          <Text style={styles.emptySubtitle}>{text.noDeliveriesDesc}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Verification Modal */}
      <Modal
        visible={verifyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={48} color={theme.colors.primary} />
              <Text style={styles.modalTitle}>{text.enterCode}</Text>
              <Text style={styles.modalSubtitle}>{text.codeInstruction}</Text>
            </View>

            {selectedDelivery && (
              <View style={styles.deliveryInfo}>
                {selectedDelivery.orderNumber && (
                  <Text style={styles.modalOrderNumber}>
                    {text.orderNumber}{selectedDelivery.orderNumber}
                  </Text>
                )}
                <Text style={styles.deliveryInfoText}>
                  {selectedDelivery.senderName} • {selectedDelivery.kg}kg • ${selectedDelivery.amount.toFixed(2)}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.codeInput}
              value={enteredCode}
              onChangeText={setEnteredCode}
              placeholder={text.codePlaceholder}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />

            <View style={[styles.modalButtons, { flexDirection: 'column' }]}> 
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyModalButton]}
                onPress={verifyAndDeliver}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.verifyModalButtonText}>{text.verify}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { marginTop: theme.spacing.sm }]}
                onPress={() => setVerifyModalVisible(false)}
                disabled={verifying}
              >
                <Text style={styles.cancelButtonText}>{text.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {resultModal === 'success' && (
        <RNModal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setResultModal(null)}
        >
          <View style={styles.resultModalOverlay}>
            <View style={styles.resultModalContent}>
              <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} style={{ marginBottom: 16 }} />
              <Text style={styles.resultModalTitle}>{text.deliverySuccess}</Text>
              <Text style={styles.resultModalMessage}>{text.deliverySuccessMsg}</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyModalButton, { marginTop: 24 }]}
                onPress={() => {
                  setResultModal(null);
                  loadDeliveries();
                }}
              >
                <Text style={styles.verifyModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNModal>
      )}
      {resultModal === 'error' && (
        <RNModal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setResultModal(null)}
        >
          <View style={styles.resultModalOverlay}>
            <View style={styles.resultModalContent}>
              <Ionicons name="close-circle" size={64} color={theme.colors.error} style={{ marginBottom: 16 }} />
              <Text style={styles.resultModalTitle}>{text.invalidCode}</Text>
              <Text style={styles.resultModalMessage}>{text.codeInstruction}</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { marginTop: 24 }]}
                onPress={() => setResultModal(null)}
              >
                <Text style={styles.cancelButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  deliveryCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  orderNumberBadgeStatic: {
    alignSelf: 'flex-start',
    height: 30,
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  orderNumberText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    //top: 2,
    paddingTop: 5,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  deliveryHeader: {
    marginBottom: theme.spacing.xs,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 16,
    flexShrink: 1,
  },
  arrow: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.sm,
  },
  statusBadge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  deliveryDetails: {
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  amountText: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
  verifyButton: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  deliveryInfo: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  modalOrderNumber: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  deliveryInfoText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 13,
  },
  codeInput: {
    ...theme.typography.h1,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: theme.spacing.lg,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: theme.spacing.md,
  },
  modalButton: {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary + '30',
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
    fontWeight: '600',
  },
  verifyModalButton: {
    backgroundColor: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  verifyModalButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchBarContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  searchBar: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalContent: {
    width: '85%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  resultModalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  resultModalMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
