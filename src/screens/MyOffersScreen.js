import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import Loading from '../components/Loading';
import { AirplaneIcon, EmptyMailboxIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * MyOffersScreen
 * Displays user's created offers (as a traveler)
 */
export default function MyOffersScreen({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUser = auth.currentUser;
  const { language } = useLanguage();

  // Translations
  const translations = {
    en: {
      myOffers: 'My Offers',
      totalEarnings: 'Total Earnings',
      active: '✓ Active',
      inactive: '○ Inactive',
      to: 'to',
      available: 'Available',
      of: 'of',
      earned: 'Earned',
      noOffers: 'No Offers Yet',
      createFirst: 'Create your first travel offer to start earning!',
      createOffer: 'Create Offer',
      deleteOffer: 'Delete Offer',
      deleteConfirmation: 'Are you sure you want to delete this offer? This action cannot be undone.',
      cancel: 'Cancel',
      delete: 'Delete',
      deleteSuccess: 'Offer deleted successfully',
      deleteError: 'Failed to delete offer',
      viewDeliveries: 'View My Deliveries',
    },
    fr: {
      myOffers: 'Mes Offres',
      totalEarnings: 'Gains Totaux',
      active: '✓ Actif',
      inactive: '○ Inactif',
      to: 'vers',
      available: 'Disponible',
      of: 'sur',
      earned: 'Gagné',
      noOffers: 'Aucune Offre',
      createFirst: 'Créez votre première offre de voyage pour commencer à gagner!',
      createOffer: 'Créer une Offre',
      deleteOffer: 'Supprimer l\'offre',
      deleteConfirmation: 'Êtes-vous sûr de vouloir supprimer cette offre? Cette action ne peut pas être annulée.',
      cancel: 'Annuler',
      delete: 'Supprimer',
      deleteSuccess: 'Offre supprimée avec succès',
      deleteError: 'Échec de la suppression de l\'offre',
      viewDeliveries: 'Voir Mes Livraisons',
    },
  };

  const text = translations[language];

  // Load offers when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMyOffers();
    }, [])
  );

  const loadMyOffers = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Query offers for the current user
      const offersQuery = query(
        collection(db, 'offers'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(offersQuery);
      let offersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort by createdAt on the client side to avoid composite index requirement
      offersData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime; // Descending order (newest first)
      });
      
      setOffers(offersData);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyOffers();
    setRefreshing(false);
  };

  const handleDeleteOffer = (offerId, offerRoute) => {
    Alert.alert(
      text.deleteOffer,
      text.deleteConfirmation,
      [
        {
          text: text.cancel,
          style: 'cancel',
        },
        {
          text: text.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'offers', offerId));
              
              // Remove the offer from the local state
              setOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
              
              // Show success message
              Alert.alert(text.deleteSuccess);
            } catch (error) {
              console.error('Error deleting offer:', error);
              Alert.alert(text.deleteError);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get capacity bar color based on available capacity percentage
  const getCapacityColor = (available, total) => {
    const availablePercentage = (available / total) * 100;
    
    if (availablePercentage >= 70) {
      return theme.colors.success; // Green (70-100%)
    } else if (availablePercentage >= 40) {
      return '#FF9500'; // Orange (40-69%)
    } else {
      return theme.colors.error; // Red (0-39%)
    }
  };

  const renderOfferCard = ({ item }) => {
    const capacityPercentage = ((item.totalCapacity - item.availableCapacity) / item.totalCapacity) * 100;
    const earnings = item.totalEarnings || 0;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OfferDetails', { offerId: item.id })}
      >
        {/* Header with Status Badge */}
        <View style={styles.cardHeader}>
          <View style={[
            styles.statusBadge,
            item.status === 'active' ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'active' ? text.active : text.inactive}
            </Text>
          </View>
          
          <View style={styles.dateAndDeleteContainer}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteOffer(item.id, `${item.origin} → ${item.destination}`)}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.locationWrapper}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.cityText}>{item.origin}</Text>
          </View>
          <Text style={styles.planeIcon}>✈️</Text>
          <View style={styles.locationWrapper}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.cityText}>{item.destination}</Text>
          </View>
        </View>

        {/* Price and Capacity */}
        <View style={styles.detailsRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>${item.pricePerKg}/kg</Text>
          </View>
          
          <View style={styles.capacityContainer}>
            <Text style={styles.capacityLabel}>{text.available}</Text>
            <Text style={styles.capacityValue}>
              {item.availableCapacity}kg / {item.totalCapacity}kg
            </Text>
          </View>
        </View>

        {/* Capacity Bar */}
        <View style={styles.capacityBar}>
          <View 
            style={[
              styles.capacityFill, 
              { 
                width: `${capacityPercentage}%`,
                backgroundColor: getCapacityColor(item.availableCapacity, item.totalCapacity)
              }
            ]} 
          />
        </View>

        {/* Earnings */}
        {earnings > 0 && (
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>💰 {text.earned}:</Text>
            <Text style={styles.earningsValue}>${earnings.toFixed(2)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {/*
      <Image 
        source={require('../../assets/logoMoova.png')} 
        style={styles.emptyLogo}
      />
      */}
      <EmptyMailboxIcon size={80} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>{text.noOffers}</Text>
      <Text style={styles.emptyText}>
        {text.createFirst}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return <Loading fullScreen />;
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Please sign in to view your offers
          </Text>
        </View>
      </View>
    );
  }

  // Calculate total earnings
  const totalEarnings = offers.reduce((sum, offer) => sum + (offer.totalEarnings || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logoMoova.png')} 
          style={styles.logo}
        />
        <Text style={styles.title}>{text.myOffers}</Text>
        <Text style={styles.subtitle}>
          {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
        </Text>

        {/* Total Earnings Card */}
        {totalEarnings > 0 && (
          <View style={styles.totalEarningsCard}>
            <Text style={styles.totalEarningsLabel}>💰 {text.totalEarnings}</Text>
            <Text style={styles.totalEarningsValue}>${totalEarnings.toFixed(2)}</Text>
          </View>
        )}

        {/* View Deliveries Button */}
        <TouchableOpacity
          style={styles.deliveriesButton}
          onPress={() => navigation.navigate('TravelerDeliveries')}
        >
          <Text style={styles.deliveriesButtonText}>📦 {text.viewDeliveries}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={offers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          offers.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: theme.spacing. sm,
    marginTop: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  totalEarningsCard: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  totalEarningsLabel: {
    ...theme.typography.caption,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontSize: 14,
  },
  totalEarningsValue: {
    ...theme.typography.h1,
    color: theme.colors.success,
    fontSize: 32,
    fontWeight: 'bold',
  },
  deliveriesButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveriesButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  activeBadge: {
    backgroundColor: theme.colors.successLight,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  dateAndDeleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  deleteIcon: {
    fontSize: 22,
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  locationWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  cityText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  planeIcon: {
    fontSize: 20,
    marginHorizontal: theme.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  priceValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontSize: 18,
  },
  capacityContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  capacityLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  capacityValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  capacityBar: {
    height: 6,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
    // backgroundColor removed - will be set dynamically
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.backgroundSecondary,
  },
  earningsLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  earningsValue: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyLogo: {
    width: 80,
    height: 80,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
