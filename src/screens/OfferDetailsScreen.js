import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, TouchableOpacity, Alert, FlatList, Image } from 'react-native';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { ProfileIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * OfferDetailsScreen
 * Shows detailed information about a specific offer
 * Accessible to guests, but "Contact" button triggers auth
 */
export default function OfferDetailsScreen({ route, navigation }) {
  const { offerId } = route.params;
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [soldKg, setSoldKg] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [updating, setUpdating] = useState(false);
  const [travelerRating, setTravelerRating] = useState(null);
  const [travelerReviewCount, setTravelerReviewCount] = useState(0);
  const currentUser = auth.currentUser;
  const { language } = useLanguage();

  // Translations
  const translations = {
    en: {
      offerNotFound: 'Offer not found',
      failedToLoad: 'Failed to load offer details',
      goBack: 'Go Back',
      route: 'Route',
      pricing: 'Pricing',
      capacity: 'Capacity',
      available: 'available of',
      total: 'total',
      traveler: 'Traveler',
      activeOffer: '✓ Active Offer',
      inactive: '○ Inactive',
      sellKg: 'Sale Kg',
      contactTraveler: 'Contact Traveler',
      signInToContact: 'Sign In to Contact',
      manageSales: 'Manage Sales',
      salesHistory: 'Sales History',
      addNewSale: 'Add New Sale',
      kgSold: 'Kg Sold',
      enterAmount: 'Enter amount in kg',
      saleAmount: 'Sale Amount ($)',
      totalReceived: 'Total amount received',
      suggested: 'Suggested',
      close: 'Close',
      addSale: 'Add Sale',
      updating: 'Updating...',
      invalidAmount: 'Invalid Amount',
      invalidAmountMsg: 'Please enter a valid amount of kg sold.',
      invalidPrice: 'Invalid Price',
      invalidPriceMsg: 'Please enter the total amount you received for this sale.',
      insufficientCapacity: 'Insufficient Capacity',
      onlyAvailable: 'You only have',
      available2: 'kg available.',
      saleRecorded: 'Sale Recorded',
      saleRecordedMsg: 'sold successfully!',
      cancelSale: 'Cancel Sale',
      confirmCancel: 'Are you sure you want to cancel this sale? The capacity will be restored.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      saleCancelled: 'Sale Cancelled',
      saleCancelledMsg: 'The sale has been cancelled and capacity restored.',
      error: 'Error',
      failedToUpdate: 'Failed to update capacity. Please try again.',
      success: 'Success',
      successMsg: 'Successfully sold',
      for: 'for',
      remaining: 'Remaining',
      totalEarnings: 'Total Earnings',
      cancelSaleMsg: 'Cancel sale of',
      restoreMsg: 'This will restore the capacity and reduce your earnings.',
      no: 'No',
      yesCancel: 'Yes, Cancel',
      kgRestored: 'kg restored to available capacity.',
      failedToCancel: 'Failed to cancel sale. Please try again.',
      rating: 'Rating',
      reviews: 'reviews',
      viewReviews: 'View Reviews',
      noRating: 'No ratings yet',
    },
    fr: {
      offerNotFound: 'Offre non trouvée',
      failedToLoad: 'Échec du chargement des détails de l\'offre',
      goBack: 'Retour',
      route: 'Itinéraire',
      pricing: 'Tarification',
      capacity: 'Capacité',
      available: 'disponible sur',
      total: 'total',
      traveler: 'Voyageur',
      activeOffer: '✓ Offre Active',
      inactive: '○ Inactif',
      sellKg: 'Vente Kg',
      contactTraveler: 'Contacter le Voyageur',
      signInToContact: 'Se Connecter pour Contacter',
      manageSales: 'Gérer les Ventes',
      salesHistory: 'Historique des Ventes',
      addNewSale: 'Ajouter une Nouvelle Vente',
      kgSold: 'Kg Vendus',
      enterAmount: 'Entrez la quantité en kg',
      saleAmount: 'Montant de la Vente ($)',
      totalReceived: 'Montant total reçu',
      suggested: 'Suggéré',
      close: 'Fermer',
      addSale: 'Ajouter la Vente',
      updating: 'Mise à jour...',
      invalidAmount: 'Montant Invalide',
      invalidAmountMsg: 'Veuillez entrer une quantité valide de kg vendus.',
      invalidPrice: 'Prix Invalide',
      invalidPriceMsg: 'Veuillez entrer le montant total que vous avez reçu pour cette vente.',
      insufficientCapacity: 'Capacité Insuffisante',
      onlyAvailable: 'Vous n\'avez que',
      available2: 'kg disponibles.',
      saleRecorded: 'Vente Enregistrée',
      saleRecordedMsg: 'vendu avec succès!',
      cancelSale: 'Annuler la Vente',
      confirmCancel: 'Êtes-vous sûr de vouloir annuler cette vente? La capacité sera restaurée.',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      saleCancelled: 'Vente Annulée',
      saleCancelledMsg: 'La vente a été annulée et la capacité restaurée.',
      error: 'Erreur',
      failedToUpdate: 'Échec de la mise à jour de la capacité. Veuillez réessayer.',
      success: 'Succès',
      successMsg: 'Vendu avec succès',
      for: 'pour',
      remaining: 'Restant',
      totalEarnings: 'Gains Totaux',
      cancelSaleMsg: 'Annuler la vente de',
      restoreMsg: 'Cela restaurera la capacité et réduira vos gains.',
      no: 'Non',
      yesCancel: 'Oui, Annuler',
      kgRestored: 'kg restaurés à la capacité disponible.',
      failedToCancel: 'Échec de l\'annulation de la vente. Veuillez réessayer.',
      rating: 'Note',
      reviews: 'avis',
      viewReviews: 'Voir les Avis',
      noRating: 'Pas encore de notes',
    },
  };

  const text = translations[language];

  useEffect(() => {
    loadOfferDetails();
  }, [offerId]);

  // Fetch offer details and traveler info
  const loadOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const offerDoc = await getDoc(doc(db, 'offers', offerId));
      if (offerDoc.exists()) {
        const offerData = { id: offerDoc.id, ...offerDoc.data() };
        // Fetch the traveler's username and photo
        if (offerData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', offerData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              offerData.userUsername = userData.username || userData.name || userData.email;
              offerData.userPhotoURL = userData.photoURL || null;
            }
          } catch (error) {
            console.log('Error fetching user details:', error);
          }
          // Fetch traveler's reviews for rating and count
          try {
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('travelerId', '==', offerData.userId)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewsData = reviewsSnapshot.docs.map(doc => doc.data());
            if (reviewsData.length > 0) {
              const total = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
              setTravelerRating(total / reviewsData.length);
              setTravelerReviewCount(reviewsData.length);
            } else {
              setTravelerRating(null);
              setTravelerReviewCount(0);
            }
          } catch (error) {
            setTravelerRating(null);
            setTravelerReviewCount(0);
          }
        }
        setOffer(offerData);
      } else {
        setError(text.offerNotFound);
      }
    } catch (err) {
      console.error('Error loading offer:', err);
      setError(text.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleContactTraveler = () => {
    if (!currentUser) {
      navigation.navigate('AuthFlow');
      return;
    }

    if (!offer) {
      return;
    }

    // Navigate to Chat with offer and traveler details
    navigation.navigate('Chat', {
      offerId: offer.id,
      otherUserId: offer.userId,
      otherUserName: offer.userUsername || offer.userEmail || 'Traveler',
    });
  };

  const handleSellKg = async () => {
    const soldAmount = parseFloat(soldKg);
    const soldPrice = parseFloat(salePrice);
    
    // Validation
    if (!soldKg || isNaN(soldAmount) || soldAmount <= 0) {
      Alert.alert(text.invalidAmount, text.invalidAmountMsg);
      return;
    }

    if (!salePrice || isNaN(soldPrice) || soldPrice <= 0) {
      Alert.alert(text.invalidPrice, text.invalidPriceMsg);
      return;
    }

    if (soldAmount > offer.availableCapacity) {
      Alert.alert(text.insufficientCapacity, `${text.onlyAvailable} ${offer.availableCapacity}${text.available2}`);
      return;
    }

    try {
      setUpdating(true);
      const newAvailableCapacity = offer.availableCapacity - soldAmount;
      
      // Calculate new total earnings
      const currentEarnings = offer.totalEarnings || 0;
      const newTotalEarnings = currentEarnings + soldPrice;
      
      // Get existing sales array or create new one
      const sales = offer.sales || [];
      const newSale = {
        id: Date.now().toString(), // Unique ID for the sale
        kg: soldAmount,
        amount: soldPrice,
        date: Timestamp.now(),
      };
      
      // Update Firestore
      await updateDoc(doc(db, 'offers', offerId), {
        availableCapacity: newAvailableCapacity,
        totalEarnings: newTotalEarnings,
        sales: [...sales, newSale],
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setOffer({
        ...offer,
        availableCapacity: newAvailableCapacity,
        totalEarnings: newTotalEarnings,
        sales: [...sales, newSale],
      });

      // Reset inputs
      setSoldKg('');
      setSalePrice('');
      
      Alert.alert(
        text.success, 
        `${text.successMsg} ${soldAmount}kg ${text.for} $${soldPrice.toFixed(2)}\n\n${text.remaining}: ${newAvailableCapacity}kg\n${text.totalEarnings}: $${newTotalEarnings.toFixed(2)}`
      );
    } catch (err) {
      console.error('Error updating capacity:', err);
      Alert.alert(text.error, text.failedToUpdate);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelSale = async (saleToCancel) => {
    Alert.alert(
      text.cancelSale,
      `${text.cancelSaleMsg} ${saleToCancel.kg}kg ${text.for} $${saleToCancel.amount.toFixed(2)}?\n\n${text.restoreMsg}`,
      [
        { text: text.no, style: 'cancel' },
        {
          text: text.yesCancel,
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              
              // Remove the sale from the array
              const sales = offer.sales || [];
              const updatedSales = sales.filter(sale => sale.id !== saleToCancel.id);
              
              // Restore capacity and reduce earnings
              const newAvailableCapacity = offer.availableCapacity + saleToCancel.kg;
              const newTotalEarnings = (offer.totalEarnings || 0) - saleToCancel.amount;
              
              // Update Firestore
              await updateDoc(doc(db, 'offers', offerId), {
                availableCapacity: newAvailableCapacity,
                totalEarnings: Math.max(0, newTotalEarnings), // Ensure it doesn't go negative
                sales: updatedSales,
                updatedAt: Timestamp.now(),
              });

              // Update local state
              setOffer({
                ...offer,
                availableCapacity: newAvailableCapacity,
                totalEarnings: Math.max(0, newTotalEarnings),
                sales: updatedSales,
              });

              Alert.alert(text.success, `${text.saleCancelled}. ${saleToCancel.kg}${text.kgRestored}`);
            } catch (err) {
              console.error('Error cancelling sale:', err);
              Alert.alert(text.error, text.failedToCancel);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const formatSaleDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render star rating
  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Text key={i} style={styles.star}>★</Text>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Text key={i} style={styles.star}>⭐</Text>);
      } else {
        stars.push(<Text key={i} style={styles.starEmpty}>☆</Text>);
      }
    }
    return stars;
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

  const isOfferOwner = currentUser && offer && currentUser.uid === offer.userId;

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title={text.goBack}
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  if (!offer) {
    return null;
  }

  // Format date
  const offerDate = offer.date?.toDate ? offer.date.toDate() : new Date(offer.date);
  const formattedDate = offerDate.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* <Text style={styles.title}>Offer Details</Text> */}
        
        {/* Route Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.route}</Text>
          <View style={styles.routeContainer}>
            <View style={styles.locationColumn}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{offer.origin}</Text>
            </View>
            <Text style={styles.planeIcon}>✈️</Text>
            <View style={styles.locationColumn}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{offer.destination}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Pricing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.pricing}</Text>
          <Text style={styles.priceText}>${offer.pricePerKg}/kg</Text>
        </View>

        {/* Capacity Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.capacity}</Text>
          <Text style={styles.capacityText}>
            {offer.availableCapacity}kg {text.available} {offer.totalCapacity}kg {text.total}
          </Text>
          <View style={styles.capacityBar}>
            <View 
              style={[
                styles.capacityFill, 
                { 
                  width: `${((offer.totalCapacity - offer.availableCapacity) / offer.totalCapacity) * 100}%`,
                  backgroundColor: getCapacityColor(offer.availableCapacity, offer.totalCapacity)
                }
              ]} 
            />
          </View>
        </View>

        {/* Traveler Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.traveler}</Text>
          <View style={styles.travelerContainer}>
            <View style={styles.travelerAvatarContainer}>
              {offer.userPhotoURL ? (
                <Image source={{ uri: offer.userPhotoURL }} style={styles.travelerAvatar} />
              ) : (
                <View style={styles.travelerAvatarPlaceholder}>
                  <ProfileIcon size={40} color={theme.colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.travelerInfo}>
              <Text style={styles.travelerName}>{offer.userUsername || offer.userEmail || 'Traveler'}</Text>
              {travelerRating ? (
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {renderStars(travelerRating)}
                  </View>
                  <Text style={styles.ratingText}>
                    {travelerRating.toFixed(1)} ({travelerReviewCount} {text.reviews})
                  </Text>
                </View>
              ) : (
                <Text style={styles.noRatingText}>{text.noRating}</Text>
              )}
            </View>
          </View>
          {!isOfferOwner && (
            <TouchableOpacity
              style={styles.viewReviewsButton}
              onPress={() => {
                // Navigate to reviews screen (to be implemented)
                navigation.navigate('TravelerReviews', {
                  userId: offer.userId,
                  userName: offer.userUsername || 'Traveler',
                });
              }}
            >
              <Text style={styles.viewReviewsButtonText}>{text.viewReviews}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, offer.status === 'active' ? styles.activeStatus : styles.inactiveStatus]}>
          <Text style={styles.statusText}>
            {offer.status === 'active' ? text.activeOffer : text.inactive}
          </Text>
        </View>
        
        {/* Action Buttons */}
        {isOfferOwner ? (
          <Button
            title={text.sellKg}
            variant="primary"
            onPress={() => setShowSellModal(true)}
            style={styles.button}
          />
        ) : (
          <Button
            title={currentUser ? text.contactTraveler : text.signInToContact}
            variant="primary"
            onPress={handleContactTraveler}
            style={styles.button}
          />
        )}
      </View>

      {/* Sell Kg Modal */}
      <Modal
        visible={showSellModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSellModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{text.manageSales}</Text>
              <Text style={styles.modalSubtitle}>
                {text.available}: {offer.availableCapacity}kg @ ${offer.pricePerKg}/kg
              </Text>

              {/* Sales History */}
              {offer.sales && offer.sales.length > 0 && (
                <View style={styles.salesSection}>
                  <Text style={styles.salesTitle}>{text.salesHistory}</Text>
                  {offer.sales.map((sale) => (
                    <View key={sale.id} style={styles.saleItem}>
                      <View style={styles.saleInfo}>
                        <Text style={styles.saleKg}>{sale.kg}kg</Text>
                        <Text style={styles.saleAmount}>${sale.amount.toFixed(2)}</Text>
                        <Text style={styles.saleDate}>{formatSaleDate(sale.date)}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cancelSaleButton}
                        onPress={() => handleCancelSale(sale)}
                        disabled={updating}
                      >
                        <Text style={styles.cancelSaleText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.salesDivider} />
                </View>
              )}

              {/* Add New Sale */}
              <Text style={styles.newSaleTitle}>{text.addNewSale}</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{text.kgSold}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={text.enterAmount}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={soldKg}
                  onChangeText={setSoldKg}
                  keyboardType="decimal-pad"
                  editable={!updating}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{text.saleAmount}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={text.totalReceived}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={salePrice}
                  onChangeText={setSalePrice}
                  keyboardType="decimal-pad"
                  editable={!updating}
                />
                <Text style={styles.inputHint}>
                  {text.suggested}: ${soldKg ? (parseFloat(soldKg) * offer.pricePerKg).toFixed(2) : '0.00'}
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowSellModal(false);
                    setSoldKg('');
                    setSalePrice('');
                  }}
                  disabled={updating}
                >
                  <Text style={styles.cancelButtonText}>{text.close}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton, updating && styles.disabledButton]}
                  onPress={handleSellKg}
                  disabled={updating}
                >
                  <Text style={styles.confirmButtonText}>
                    {updating ? text.updating : text.addSale}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    marginBottom: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  locationColumn: {
    flex: 1,
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  locationText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  planeIcon: {
    fontSize: 24,
    marginHorizontal: theme.spacing.sm,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  priceText: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontSize: 32,
  },
  capacityText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  capacityBar: {
    height: 8,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
    // backgroundColor removed - will be set dynamically
  },
  travelerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  travelerAvatarContainer: {
    marginRight: theme.spacing.md,
  },
  travelerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  travelerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerInfo: {
    flex: 1,
  },
  travelerName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    color: '#FFB800',
    fontSize: 16,
  },
  starEmpty: {
    color: theme.colors.border,
    fontSize: 16,
  },
  ratingText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  noRatingText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  viewReviewsButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  viewReviewsButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  activeStatus: {
    backgroundColor: theme.colors.successLight,
  },
  inactiveStatus: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
  },
  button: {
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  salesSection: {
    marginBottom: theme.spacing.lg,
  },
  salesTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  saleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  saleKg: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    minWidth: 50,
  },
  saleAmount: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
    minWidth: 60,
  },
  saleDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  cancelSaleButton: {
    backgroundColor: theme.colors.error,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelSaleText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  salesDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  newSaleTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputHint: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    ...theme.typography.button,
    color: theme.colors.background,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
