import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import AutoSwipeBanner from '../components/AutoSwipeBanner';
import { SearchIcon, CloseIcon, LocationIcon, EmptyMailboxIcon, SearchNotFoundIcon, FilterIcon, ProfileIcon, RefreshIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { navigate as rootNavigate } from '../RootNavigation';

// Mock data for development (when Firebase is not configured)
const MOCK_OFFERS = [
  {
    id: '1',
    origin: 'New York',
    destination: 'Kinshasa',
    date: new Date('2026-01-20'),
    pricePerKg: 15.00,
    availableCapacity: 10,
    status: 'active',
  },
  {
    id: '2',
    origin: 'Brussels',
    destination: 'Kinshasa',
    date: new Date('2026-01-25'),
    pricePerKg: 12.50,
    availableCapacity: 15,
    status: 'active',
  },
  {
    id: '3',
    origin: 'Paris',
    destination: 'Kinshasa',
    date: new Date('2026-02-01'),
    pricePerKg: 18.00,
    availableCapacity: 8,
    status: 'active',
  },
  {
    id: '4',
    origin: 'London',
    destination: 'Kinshasa',
    date: new Date('2026-02-05'),
    pricePerKg: 16.50,
    availableCapacity: 12,
    status: 'active',
  },
];

/**
 * SearchResultsScreen
 * Displays available offers for shipments to Kinshasa
 * Accessible to guests (no authentication required)
 */
export default function SearchResultsScreen({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [travelerRatings, setTravelerRatings] = useState({}); // { userId: { rating, count } }
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, upcoming
  const [useMockData, setUseMockData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const { language, toggleLanguage } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Import the helper
  const { requireAuthOrShowModal } = require('./ProfileScreen');

  // Translations
  const t = {
    en: {
      subtitle: 'Send packages to Kinshasa with trusted travelers',
      searchPlaceholder: 'Search by origin city (e.g., New York, Paris)',
      offersFound: 'offers found',
      offerFound: 'offer found',
      availableRoutes: '📍 Available Routes to Kinshasa',
      allOffers: 'All Offers',
      thisWeek: 'This Week',
      nextMonth: 'Next Month',
      from: 'From',
      to: 'To',
      pricePerKg: 'Price per kg',
      travelDate: 'Travel Date',
      available: 'available',
      viewDetails: 'View Details',
      updated: 'Updated',
      noMatchesFound: 'No matches found',
      noOffersFound: 'No offers found',
      noMatchesText: 'No offers match your search. Try searching for a different city.',
      noOffersText: 'There are no active offers to Kinshasa at the moment. Check back later or create your own offer!',
      clearSearch: 'Clear Search',
      refresh: 'Refresh',
      createOffer: 'Create Offer',
      filterByCity: 'Filter by Origin City',
      filterSubtitle: 'Enter the city where the sender is located',
      showingFrom: 'Showing offers from:',
      clearFilter: 'Clear Filter',
      applyFilter: 'Apply Filter',
    },
    fr: {
      subtitle: 'Envoyez des colis à Kinshasa avec des voyageurs de confiance',
      searchPlaceholder: 'Rechercher par ville d\'origine (ex: New York, Paris)',
      offersFound: 'offres trouvées',
      offerFound: 'offre trouvée',
      availableRoutes: '📍 Routes Disponibles vers Kinshasa',
      allOffers: 'Toutes les Offres',
      thisWeek: 'Cette Semaine',
      nextMonth: 'Le Mois Prochain',
      from: 'De',
      to: 'À',
      pricePerKg: 'Prix par kg',
      travelDate: 'Date de Voyage',
      available: 'disponible',
      viewDetails: 'Voir Détails',
      updated: 'Mis à jour',
      noMatchesFound: 'Aucun résultat trouvé',
      noOffersFound: 'Aucune offre trouvée',
      noMatchesText: 'Aucune offre ne correspond à votre recherche. Essayez une autre ville.',
      noOffersText: 'Il n\'y a pas d\'offres actives vers Kinshasa pour le moment. Revenez plus tard ou créez votre propre offre!',
      clearSearch: 'Effacer la Recherche',
      refresh: 'Actualiser',
      createOffer: 'Créer une Offre',
      filterByCity: 'Filtrer par Ville d\'Origine',
      filterSubtitle: 'Entrez la ville où se trouve l\'expéditeur',
      showingFrom: 'Affichage des offres de:',
      clearFilter: 'Effacer le Filtre',
      applyFilter: 'Appliquer le Filtre',
    }
  };

  const text = t[language];

  /**
   * Filter offers based on search query and city filter
   */
  const filterOffers = () => {
    let filtered = offers;

    // Apply city filter if set
    if (cityFilter.trim()) {
      const city = cityFilter.toLowerCase();
      filtered = filtered.filter(offer => 
        offer.origin.toLowerCase().includes(city)
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(offer => 
        offer.origin.toLowerCase().includes(query) ||
        offer.destination.toLowerCase().includes(query)
      );
    }

    setFilteredOffers(filtered);
  };

  /**
   * Clear search
   */
  const clearSearch = () => {
    setSearchQuery('');
  };

  /**
   * Apply city filter and close modal
   */
  const applyFilter = () => {
    setFilterModalVisible(false);
    // Filter will be applied automatically via useEffect
  };

  /**
   * Clear city filter
   */
  const clearCityFilter = () => {
    setCityFilter('');
  };

  /**
   * Handle create offer button press
   * Checks if user is authenticated
   */
  const handleCreateOffer = () => {
    requireAuthOrShowModal(currentUser, true, navigation, 'CreateOffer', setShowAuthModal);
  };

  useEffect(() => {
    filterOffers();
  }, [searchQuery, offers, cityFilter]);

  // Reload offers when screen comes into focus
  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // User logged out, clear photo
        setUserPhotoURL(null);
      } else {
        // User logged in, fetch their photo
        fetchUserPhoto(user);
      }
    });
    return unsubscribe;
  }, []);

  // Listen for real-time updates to user photoURL
  useEffect(() => {
    if (!currentUser) {
      setUserPhotoURL(null);
      return;
    }
    let unsubscribe;
    (async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', currentUser.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserPhotoURL(data.photoURL || null);
        }
      });
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [currentUser]);


  useFocusEffect(
    React.useCallback(() => {
      loadOffers();
    }, [filter, currentUser])
  );

  // Fetch traveler ratings for all offers
  useEffect(() => {
    const fetchRatings = async () => {
      const ratings = {};
      const travelerIds = Array.from(new Set(offers.map(o => o.userId).filter(Boolean)));
      for (const userId of travelerIds) {
        try {
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('travelerId', '==', userId)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const reviewsData = reviewsSnapshot.docs.map(doc => doc.data());
          if (reviewsData.length > 0) {
            const total = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
            ratings[userId] = {
              rating: total / reviewsData.length,
              count: reviewsData.length,
            };
          }
        } catch (e) {}
      }
      setTravelerRatings(ratings);
    };
    if (offers.length > 0) fetchRatings();
  }, [offers]);

  /**
   * Load offers from Firestore
   * Filter based on selected filter and destination: Kinshasa
   */
  const loadOffers = async () => {
    try {
      setLoading(true);
      
      // Check if Firebase is configured
      if (!db || db._settings?.projectId === 'YOUR_PROJECT_ID') {
        // Use mock data if Firebase is not configured
        console.log('Using mock data - Firebase not configured');
        setTimeout(() => {
          setOffers(MOCK_OFFERS);
          setUseMockData(true);
          setLoading(false);
          setRefreshing(false);
        }, 1000);
        return;
      }

      const offersRef = collection(db, 'offers');
      
      // Query offers with destination "Kinshasa" only (no composite index needed)
      let q = query(
        offersRef,
        where('destination', '==', 'Kinshasa')
      );

      const querySnapshot = await getDocs(q);
      const offersData = [];
      
      // Get current date for filtering
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const offerDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);

        // Skip offers that have passed their travel date
        if (offerDate < now) {
          return; // Offer has expired, don't include it
        }

        // Filter active status
        if (data.status === 'active') {
          // Apply filter based on selection
          let includeOffer = false;

          if (filter === 'all') {
            includeOffer = true;
          } else if (filter === 'active') {
            // This Week - offers with travel date within next 7 days
            includeOffer = offerDate >= now && offerDate <= oneWeekFromNow;
          } else if (filter === 'upcoming') {
            // Next Month - offers with travel date beyond 7 days
            includeOffer = offerDate > oneWeekFromNow;
          }

          if (includeOffer) {
            offersData.push({
              id: doc.id,
              ...data,
            });
          }
        }
      });

      // Sort by date in memory instead of in query
      offersData.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });

      setOffers(offersData);
      setUseMockData(false);
    } catch (error) {
      console.error('Error loading offers:', error);
      // Fallback to mock data on error
      console.log('Using mock data - Error occurred');
      setOffers(MOCK_OFFERS);
      setUseMockData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  /**
   * Calculate sender's total cost (including 11% platform fee)
   */
  const calculateSenderTotal = (askingPrice) => {
    return askingPrice + (askingPrice * 0.11);
  };

  /**
   * Format date for display
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date TBD';
    
    // Handle Firebase Timestamp, Date object, or date string
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
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

  // Check if offer was recently updated (within 24 hours)
  const isRecentlyUpdated = (item) => {
    if (!item.updatedAt || !item.createdAt) return false;

    const updatedAt = item.updatedAt?.toDate ? item.updatedAt.toDate() : new Date(item.updatedAt);
    const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);

    // Check if updated time is different from created time (meaning it was edited)
    if (updatedAt.getTime() === createdAt.getTime()) return false;

    // Check if updated within last 24 hours
    const now = new Date();
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24;
  };

  /**
   * Render individual offer card
   */
  const renderOfferCard = ({ item }) => {
    const senderTotal = calculateSenderTotal(item.pricePerKg);
    const capacityPercentage = item.totalCapacity ? ((item.totalCapacity - item.availableCapacity) / item.totalCapacity) * 100 : 0;
    const showUpdateBadge = isRecentlyUpdated(item);
    const travelerRating = travelerRatings[item.userId]?.rating;

    return (
      <Card
        onPress={() => navigation.navigate('OfferDetails', { offerId: item.id })}
  // For OfferDetails, allow guests to view, but protect actions inside OfferDetailsScreen
        style={styles.offerCard}
      >
        {/* Header: Origin to Destination */}
        <View style={styles.routeContainer}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>{text.from}</Text>
            <Text style={styles.locationText}>{item.origin}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrowIcon}>✈️</Text>
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>{text.to}</Text>
            <Text style={styles.locationText}>{item.destination}</Text>
          </View>
        </View>

        {/* Price and Date Row */}
        <View style={styles.priceAndDateRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{text.pricePerKg}</Text>
            <Text style={styles.priceValue}>${item.pricePerKg.toFixed(2)}/kg</Text>
          </View>
          <View style={styles.dateContainer}>
            <View style={styles.dateWithBadge}>
              <Text style={styles.dateLabel}>{text.travelDate}</Text>
              {showUpdateBadge && (
                <View style={styles.updateBadge}>
                  <RefreshIcon size={10} color={theme.colors.primary} />
                  <Text style={styles.updateBadgeText}>{text.updated}</Text>
                </View>
              )}
            </View>
            <Text style={styles.dateValue}>{formatDate(item.date)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Available capacity and traveler rating */}
        {item.availableCapacity && item.totalCapacity && (
          <View style={styles.capacitySection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.capacityLabel}>
                📦 {item.availableCapacity}kg / {item.totalCapacity}kg {text.available}
              </Text>
              {travelerRatings[item.userId]?.rating && (
                <Text style={{ marginLeft: 8, color: '#FFB800', fontWeight: 'bold', fontSize: 15 }}>
                  ★ {travelerRatings[item.userId].rating.toFixed(1)}
                </Text>
              )}
            </View>
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
          </View>
        )}

        {/* CTA */}
        <Button
          title={text.viewDetails}
          variant="primary"
          onPress={() => navigation.navigate('OfferDetails', { offerId: item.id })}
          style={styles.viewButton}
        />
      </Card>
    );
  };

  /**
   * Empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        {searchQuery ? <SearchNotFoundIcon size={64} /> : <EmptyMailboxIcon size={64} />}
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? text.noMatchesFound : text.noOffersFound}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery ? text.noMatchesText : text.noOffersText}
      </Text>
      {searchQuery ? (
        <Button
          title={text.clearSearch}
          variant="outline"
          onPress={clearSearch}
          style={styles.refreshButton}
        />
      ) : (
        <Button
          title={text.refresh}
          variant="outline"
          onPress={loadOffers}
          style={styles.refreshButton}
        />
      )}
    </View>
  );

  if (loading && !refreshing) {
    return <Loading fullScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Hero Section with Brand */}
      <View style={styles.heroSection}>
        <View style={styles.heroTopBar}>
          <View style={styles.brandContainer}>
            <Image 
              source={require('../../assets/logoMoova.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Moova</Text>
          </View>
          
          <View style={styles.iconBar}>
            {/* Language Switcher */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={toggleLanguage}
            >
              <Text style={styles.languageFlag}>
                {language === 'en' ? '🇬🇧' : '🇫🇷'}
              </Text>
            </TouchableOpacity>

            {/* Profile Icon (always visible) */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                if (!requireAuthOrShowModal(currentUser, true, navigation, 'Profile', setShowAuthModal)) return;
              }}
            >
              {userPhotoURL ? (
                <Image source={{ uri: userPhotoURL }} style={{ width: 28, height: 28, borderRadius: 14 }} />
              ) : (
                <ProfileIcon size={28} color={theme.colors.success} />
              )}
            </TouchableOpacity>
      {/* Auth Required Modal */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Sign In Required</Text>
            <Text style={{ marginBottom: 20 }}>You need to be signed in to access this feature.</Text>
            <Button title="Sign In" onPress={() => { 
              console.log('Sign In button pressed (SearchResultsScreen)');
              setShowAuthModal(false); 
              rootNavigate('AuthFlow'); 
            }} />
            <Button title="Cancel" variant="outline" onPress={() => setShowAuthModal(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
          </View>
        </View>
        
        {/*<Text style={styles.tagline}>Connecting Travelers & Senders</Text>*/}
        <Text style={styles.heroSubtitle}>
          {text.subtitle}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIconContainer}>
            <SearchIcon size={18} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder={text.searchPlaceholder}
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <CloseIcon size={18} />
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && (
          <Text style={styles.searchResultText}>
            {filteredOffers.length} {filteredOffers.length === 1 ? text.offerFound : text.offersFound}
          </Text>
        )}
      </View>

      {/* Auto-swipe Banner - only shows when there are active banners in Firestore */}
      <AutoSwipeBanner
        height={80}
        navigation={navigation}
      />

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            {text.availableRoutes}
          </Text>
        </View>
        {/* Filter buttons hidden - will be used later */}
        {/* <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {text.allOffers}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              {text.thisWeek}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
            onPress={() => setFilter('upcoming')}
          >
            <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
              {text.nextMonth}
            </Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Offers List */}
      <FlatList
        data={filteredOffers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateOffer}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>✈️</Text>
        <Text style={styles.fabText}>{text.createOffer}</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Offers</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <CloseIcon size={20} />
              </TouchableOpacity>
            </View>

            {/* Time Period Filter */}
            <View style={styles.filterTimeSection}>
              <Text style={styles.filterSectionLabel}>Time Period</Text>
              <View style={styles.filterOptionsRow}>
                <TouchableOpacity
                  style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
                  onPress={() => setFilter('all')}
                >
                  <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
                    {text.allOffers}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
                  onPress={() => setFilter('active')}
                >
                  <Text style={[styles.filterChipText, filter === 'active' && styles.filterChipTextActive]}>
                    {text.thisWeek}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filter === 'upcoming' && styles.filterChipActive]}
                  onPress={() => setFilter('upcoming')}
                >
                  <Text style={[styles.filterChipText, filter === 'upcoming' && styles.filterChipTextActive]}>
                    {text.nextMonth}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* City Filter */}
            <View style={styles.filterCitySection}>
              <Text style={styles.filterSectionLabel}>{text.filterByCity}</Text>
              <Text style={styles.modalSubtitle}>
                {text.filterSubtitle}
              </Text>

              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., New York, Paris, Brussels..."
                  placeholderTextColor={theme.colors.textLight}
                  value={cityFilter}
                  onChangeText={setCityFilter}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {cityFilter.length > 0 && (
                  <TouchableOpacity onPress={clearCityFilter} style={styles.modalClearButton}>
                    <CloseIcon size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {cityFilter.length > 0 && (
                <Text style={styles.modalInfo}>
                  {text.showingFrom} <Text style={styles.modalInfoBold}>{cityFilter}</Text>
                </Text>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title={text.clearFilter}
                variant="secondary"
                onPress={() => {
                  clearCityFilter();
                  setFilter('all');
                  setFilterModalVisible(false);
                }}
                style={styles.modalButton}
              />
              <Button
                title={text.applyFilter}
                variant="primary"
                onPress={applyFilter}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Auth Required Modal */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Sign In Required</Text>
            <Text style={{ marginBottom: 20 }}>You need to be signed in to access this feature.</Text>
            <Button title="Sign In" onPress={() => { setShowAuthModal(false); rootNavigate('AuthFlow'); }} />
            <Button title="Cancel" variant="outline" onPress={() => setShowAuthModal(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + theme.spacing.md : theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === 'android' ? theme.spacing.xl + theme.spacing.lg : theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 22,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 15,
    marginRight: theme.spacing.md,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.md,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.background,
    letterSpacing: 0.5,
  },
  tagline: {
    ...theme.typography.body,
    color: theme.colors.background,
    opacity: 0.95,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.background,
    opacity: 0.90,
    paddingBottom: 15,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },

  // Search Section
  searchSection: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    marginTop: -theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    elevation: 4,
    zIndex: 10,
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchIconContainer: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    height: '100%',
  },
  clearButton: {
    marginLeft: theme.spacing.sm,
  },
  searchResultText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  mockDataBadge: {
    backgroundColor: theme.colors.warning + '20',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
  },
  mockDataText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontWeight: '600',
  },

  // Filter Section
  filterSection: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  filterIconButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  filterText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.colors.background,
  },
  
  // Offer Card Styles
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 40,
  },
  offerCard: {
    marginBottom: theme.spacing.md,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  locationContainer: {
    flex: 1,
  },
  locationLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  locationText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  arrowContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  arrowIcon: {
    fontSize: 28,
  },
  priceAndDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontSize: 11,
    fontWeight: '600',
  },
  priceValue: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '700',
    fontSize: 16,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  dateLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  updateBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  updateBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
    opacity: 0.5,
  },
  infoContainer: {
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  priceText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  totalText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dateText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  capacitySection: {
    marginBottom: theme.spacing.md,
  },
  capacityInfo: {
    marginBottom: theme.spacing.sm,
  },
  capacityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  capacityLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  capacityBar: {
    height: 8,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: theme.borderRadius.md,
    // backgroundColor will be set dynamically based on capacity
  },
  capacityBadge: {
    backgroundColor: theme.colors.success + '15',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  capacityText: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    fontWeight: '600',
  },
  viewButton: {
    marginTop: 0,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  refreshButton: {
    minWidth: 120,
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.lg + 4,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.lg,
    elevation: 12,
  },
  fabIcon: {
    marginRight: theme.spacing.sm,
    fontSize: 20,
  },
  fabText: {
    ...theme.typography.button,
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    ...theme.shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  filterTimeSection: {
    marginBottom: theme.spacing.lg,
  },
  filterCitySection: {
    marginBottom: theme.spacing.lg,
  },
  filterSectionLabel: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterChip: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: theme.colors.background,
  },
  modalSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
    fontSize: 13,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
  },
  modalClearButton: {
    padding: theme.spacing.xs,
  },
  modalInfo: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalInfoBold: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
