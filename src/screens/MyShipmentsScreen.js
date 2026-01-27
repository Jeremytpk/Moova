import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { deleteDoc } from 'firebase/firestore';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * MyShipmentsScreen
 * Displays user's shipments (as a sender)
 * Shows pickup and delivery status with Bridge Tracker
 */
export default function MyShipmentsScreen({ navigation }) {
  const { language } = useLanguage();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Translations
  const translations = {
    en: {
      title: 'My Shipments',
      subtitle: 'Track your packages to Kinshasa here',
      noShipments: 'No shipments yet',
      noShipmentsDesc: 'Your shipments will appear here after you make a purchase',
      from: 'From',
      to: 'To',
      kg: 'kg',
      status: 'Status',
      pending: 'Pending Pickup',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      arrived: 'Arrived - Ready for Pickup',
      delivered: 'Delivered',
      traveler: 'Traveler',
      paid: 'Paid',
      verificationCode: 'Verification Code',
      codeDescription: 'Share this code with the recipient for package delivery confirmation',
      copiedToClipboard: 'Code copied to clipboard!',
      tapToCopy: 'Tap to copy',
      generateCode: 'Generate Verification Code',
      codeGenerated: 'Verification code generated!',
      orderNumber: 'Order #',
    },
    fr: {
      title: 'Mes Expéditions',
      subtitle: 'Suivez vos colis vers ici',
      noShipments: 'Aucune expédition',
      noShipmentsDesc: 'Vos expéditions apparaîtront ici après un achat',
      from: 'De',
      to: 'À',
      kg: 'kg',
      status: 'Statut',
      pending: 'En attente de collecte',
      picked_up: 'Collecté',
      in_transit: 'En transit',
      arrived: 'Arrivé - Prêt pour récupération',
      delivered: 'Livré',
      traveler: 'Voyageur',
      paid: 'Payé',
      verificationCode: 'Code de Vérification',
      codeDescription: 'Partagez ce code avec le recepteur pour confirmer la livraison du colis',
      copiedToClipboard: 'Code copié dans le presse-papiers!',
      tapToCopy: 'Appuyez pour copier',
      generateCode: 'Générer le Code de Vérification',
      codeGenerated: 'Code de vérification généré!',
      orderNumber: 'Commande #',
    },
  };

  const text = translations[language];

  useEffect(() => {
    if (!currentUser) return;

    const shipmentsRef = collection(db, 'users', currentUser.uid, 'shipments');
    const q = query(shipmentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shipmentsData = [];
      snapshot.forEach((doc) => {
        shipmentsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setShipments(shipmentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA726';
      case 'picked_up':
        return '#42A5F5';
      case 'in_transit':
        return '#7E57C2';
      case 'arrived':
        return '#26A69A';
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

  const copyToClipboard = async (code) => {
    try {
      await Clipboard.setString(code);
      Alert.alert('✓', text.copiedToClipboard);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateVerificationCode = async (shipmentId) => {
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const shipmentRef = doc(db, 'users', currentUser.uid, 'shipments', shipmentId);
      await updateDoc(shipmentRef, {
        verificationCode: newCode,
      });
      Alert.alert('✓', text.codeGenerated);
    } catch (error) {
      console.error('Failed to generate code:', error);
      Alert.alert('Error', 'Failed to generate verification code');
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    try {
      const shipmentRef = doc(db, 'users', currentUser.uid, 'shipments', shipmentId);
      await deleteDoc(shipmentRef);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete shipment');
      console.error('Delete shipment error:', error);
    }
  };

  const renderShipment = ({ item }) => (
    <View style={styles.shipmentCard}>
      {/* Delete (X) icon, only if delivered */}
      {item.status === 'delivered' && (
        <TouchableOpacity
          style={styles.deleteIcon}
          onPress={() => {
            Alert.alert(
              'Delete Shipment',
              'Are you sure you want to delete this shipment?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteShipment(item.id) },
              ]
            );
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={22} color="#B00020" />
        </TouchableOpacity>
      )}
      {/* Order Number Badge above locations, not absolute */}
      {item.orderNumber && (
        <View style={styles.orderNumberBadgeStatic}>
          <Text style={styles.orderNumberText}>
            {text.orderNumber}{item.orderNumber}
          </Text>
        </View>
      )}
      <View style={styles.shipmentHeader}>
        <View style={styles.routeContainer}>
          <Text style={styles.cityText}>{item.departure}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.cityText}>{item.arrival}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>
      <View style={styles.shipmentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{text.traveler}:</Text>
          <Text style={styles.detailValue}>{item.travelerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{text.kg}:</Text>
          <Text style={styles.detailValue}>{item.kg}kg</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{text.paid}:</Text>
          <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
        </View>
      </View>
      {/* Verification Code Section */}
      {item.verificationCode ? (
        <View style={styles.verificationSection}>
          <Text style={styles.verificationLabel}>{text.verificationCode}</Text>
          <TouchableOpacity 
            style={styles.codeContainer}
            onPress={() => copyToClipboard(item.verificationCode)}
            activeOpacity={0.7}
          >
            <Text style={styles.codeText}>{item.verificationCode}</Text>
            <Text style={styles.tapToCopy}>{text.tapToCopy}</Text>
          </TouchableOpacity>
          <Text style={styles.codeDescription}>{text.codeDescription}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => generateVerificationCode(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.generateButtonText}>{text.generateCode}</Text>
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
      </View>

      {shipments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{text.noShipments}</Text>
          <Text style={styles.emptySubtitle}>{text.noShipmentsDesc}</Text>
        </View>
      ) : (
        <FlatList
          data={shipments}
          renderItem={renderShipment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
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
    paddingTop: theme.spacing.xxl,
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
  shipmentCard: {
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
    top: 2,
    paddingTop: 5,
    fontSize: 20,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  shipmentHeader: {
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
  shipmentDetails: {
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
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  verificationSection: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    borderStyle: 'dashed',
  },
  verificationLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  tapToCopy: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 10,
    opacity: 0.6,
  },
  codeDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  generateButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
});
