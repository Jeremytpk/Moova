import React, { useState, useEffect, useCallback } from 'react';
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
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import AutoSwipeBanner from '../components/AutoSwipeBanner';
import { SearchIcon, CloseIcon, EmptyMailboxIcon, SearchNotFoundIcon, FilterIcon, ProfileIcon } from '../components/Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { navigate as rootNavigate } from '../RootNavigation';

const MOCK_OFFERS = [
  {
    id: '1',
    origin: '🇺🇸 New York, NY',
    destination: '🇨🇩 Kinshasa, DRC',
    routeType: 'usa_to_africa',
    date: new Date('2026-02-15'),
    pricePerKg: 15.00,
    availableCapacity: 10,
    totalCapacity: 20,
    status: 'active',
  }
];

export default function SearchResultsScreen({ navigation }) {
  const { language, toggleLanguage } = useLanguage();
  
  // --- STATE ---
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [showRouteFilter, setShowRouteFilter] = useState(false); // Hidden by default
  const [searchQuery, setSearchQuery] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  // Fetch ratings for all offerers in the current offers list
  useEffect(() => {
    const fetchRatings = async () => {
      // Get unique userIds from offers
      const userIds = Array.from(new Set(offers.map(o => o.userId).filter(Boolean)));
      if (userIds.length === 0) return;
      const ratingsObj = {};
      try {
        // For each userId, fetch reviews from 'reviews' collection and calculate average and count
        await Promise.all(userIds.map(async (uid) => {
          const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('travelerId', '==', uid)));
          const reviews = reviewsSnap.docs.map(doc => doc.data());
          if (reviews.length > 0) {
            const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            ratingsObj[uid] = {
              avgRating: total / reviews.length,
              reviewCount: reviews.length
            };
          } else {
            ratingsObj[uid] = {
              avgRating: null,
              reviewCount: 0
            };
          }
        }));
        setUserRatings(ratingsObj);
      } catch (e) {
        // fallback: do nothing
      }
    };
    fetchRatings();
  }, [offers]);

  // Translations
  const t = {
    en: {
      subtitle: 'Send packages to Africa with trusted travelers',
      searchPlaceholder: 'Search by city (e.g., Kinshasa, Atlanta)',
      availableRoutes: '📍 Available Routes',
      allOffers: 'All',
      usaToAfrica: 'USA → Africa',
      africaToUsa: 'Africa → USA',
      from: 'From',
      to: 'To',
      pricePerKg: 'Price per kg',
      travelDate: 'Travel Date',
      viewDetails: 'View Details',
      noOffersFound: 'No offers found',
      createOffer: 'Create Offer',
    },
    fr: {
      subtitle: 'Envoyez vos colis en Afrique avec des voyageurs de confiance',
      searchPlaceholder: 'Rechercher par ville (ex: Kinshasa, Paris)',
      availableRoutes: '📍 Routes Disponibles',
      allOffers: 'Tout',
      usaToAfrica: 'USA → Afrique',
      africaToUsa: 'Afrique → USA',
      from: 'De',
      to: 'À',
      pricePerKg: 'Prix par kg',
      travelDate: 'Date de Voyage',
      viewDetails: 'Voir Détails',
      noOffersFound: 'Aucune offre trouvée',
      createOffer: 'Créer une Offre',
    }
  };

  const text = t[language] || t.en;

  // --- AUTH & DATA ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) setUserPhotoURL(snap.data().photoURL || null);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'offers'), where('status', '==', 'active'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOffers(data);
    } catch (e) {
      setOffers(MOCK_OFFERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadOffers(); }, []));

  useEffect(() => {
    let res = offers;
    if (filter !== 'all') res = res.filter(o => o.routeType === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(o => o.origin.toLowerCase().includes(q) || o.destination.toLowerCase().includes(q));
    }
    setFilteredOffers(res);
  }, [searchQuery, offers, filter]);

  // --- RENDER ---
  const renderOfferCard = ({ item }) => (
    <Card style={styles.offerCard} onPress={() => navigation.navigate('OfferDetails', { offerId: item.id })}>
      <View style={styles.routeContainer}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>{text.from}</Text>
          <Text style={styles.locationText}>{item.origin}</Text>
        </View>
        <Text style={styles.arrowIcon}>✈️</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>{text.to}</Text>
          <Text style={styles.locationText}>{item.destination}</Text>
        </View>
      </View>
      <View style={styles.priceRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.priceValue}>${item.pricePerKg}/kg</Text>
          {(() => {
            // Color rules: green (100%), orange (65-45%), red (<=44%), gray for loading/unknown
            const getBarColor = (percent) => {
              if (percent === 100) return '#2ecc40'; // green
              if (percent <= 65 && percent >= 45) return '#ff9800'; // orange
              if (percent <= 44) return '#e53935'; // red
              return '#2ecc40'; // default to green for any other value (shouldn't happen)
            };
            if (typeof item.availableCapacity === 'number' && typeof item.totalCapacity === 'number') {
              const percent = item.totalCapacity > 0 ? (item.availableCapacity / item.totalCapacity) * 100 : 0;
              const color = getBarColor(percent);
              return (
                <View style={{ marginTop: 2 }}>
                  <Text style={[styles.capacityText, { color, marginBottom: 2 }]}> 
                    {`${item.availableCapacity} / ${item.totalCapacity} kg left`}
                  </Text>
                  <View style={styles.capacityBarBackground}>
                    <View style={[styles.capacityBarFill, { width: `${percent}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            }
            // If not loaded, show a bar placeholder in gray
            return (
              <View style={{ marginTop: 2 }}>
                <View style={styles.capacityBarBackground}>
                  <View style={[styles.capacityBarFill, { width: '30%', backgroundColor: '#888' }]} />
                </View>
              </View>
            );
          })()}
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.dateValue}>{new Date(item.date?.seconds * 1000 || item.date).toLocaleDateString()}</Text>
        
          {/* Offerer review rate (hide review count) */}
          {item.userId && userRatings[item.userId] && userRatings[item.userId].avgRating !== null ? (
            <Text style={styles.reviewText}>
              {`⭐ ${userRatings[item.userId].avgRating.toFixed(1)}`}
            </Text>
          ) : null}
        </View>
      </View>
      <Button title={text.viewDetails} variant="primary" onPress={() => navigation.navigate('OfferDetails', { offerId: item.id })} />
    </Card>
  );

  if (loading && !refreshing) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Brand Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroTopBar}>
          <View style={styles.brandContainer}>
            <Image source={require('../../assets/logoMoova.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandName}>Moova</Text>
          </View>
          <View style={styles.iconBar}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleLanguage}>
              <Text style={[styles.languageFlag, { fontSize: 21 }]}>{language === 'en' ? '🇬🇧' : '🇫🇷'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => currentUser ? navigation.navigate('Profile') : setShowAuthModal(true)}>
              {userPhotoURL ? <Image source={{ uri: userPhotoURL }} style={styles.profilePic} /> : <ProfileIcon size={24} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.heroSubtitle}>{text.subtitle}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={text.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}><CloseIcon size={18} /></TouchableOpacity>
          )}
        </View>
      </View>

      <AutoSwipeBanner height={80} navigation={navigation} />

      {/* Toggable Route Filters */}
      <View style={styles.filterSection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{text.availableRoutes}</Text>
          <TouchableOpacity 
            style={styles.filterIconButton} 
            onPress={() => setShowRouteFilter(!showRouteFilter)}
          >
            <FilterIcon size={22} color={showRouteFilter ? theme.colors.primary : "#666"} />
          </TouchableOpacity>
        </View>

        {showRouteFilter && (
          <View style={styles.filterContainer}>
            {[
              { id: 'all', label: text.allOffers },
              { id: 'usa_to_africa', label: text.usaToAfrica },
              { id: 'africa_to_usa', label: text.africaToUsa }
            ].map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.filterButton, filter === item.id && styles.filterButtonActive]}
                onPress={() => setFilter(item.id)}
              >
                <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filteredOffers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOffers} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<View style={styles.emptyContainer}><EmptyMailboxIcon size={64} /><Text>{text.noOffersFound}</Text></View>}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => currentUser ? navigation.navigate('CreateOffer') : setShowAuthModal(true)}>
        <Text style={styles.fabIcon}>✈️</Text>
        <Text style={styles.fabText}>{text.createOffer}</Text>
      </TouchableOpacity>

      {/* Auth Modal */}
      <Modal visible={showAuthModal} animationType="slide" transparent onRequestClose={() => setShowAuthModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{language === 'en' ? 'Sign In Required' : 'Connexion Requise'}</Text>
            <Button title="Sign In" onPress={() => { setShowAuthModal(false); rootNavigate('AuthFlow'); }} />
            <Button title="Cancel" variant="outline" onPress={() => setShowAuthModal(false)} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  heroSection: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  heroTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 44, height: 44, marginRight: 10, borderRadius: 8 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  iconBar: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  profilePic: { width: 30, height: 30, borderRadius: 15 },
  heroSubtitle: { color: '#FFF', textAlign: 'center', marginTop: 15, opacity: 0.9, fontSize: 14 },
  searchSection: { marginHorizontal: 20, marginTop: -25, backgroundColor: '#FFF', borderRadius: 15, elevation: 5, padding: 5 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  filterSection: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  filterIconButton: { padding: 5 },
  filterContainer: { flexDirection: 'row', gap: 8, marginTop: 5 },
  filterButton: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, alignItems: 'center', backgroundColor: '#FFF' },
  filterButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#FFF' },
  listContent: { padding: 20, paddingBottom: 100 },
  offerCard: { padding: 15, marginBottom: 15 },
  routeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationContainer: { flex: 1 },
  locationLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase' },
  locationText: { fontSize: 16, fontWeight: '700' },
  arrowIcon: { fontSize: 18, marginHorizontal: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  priceValue: { color: theme.colors.success, fontWeight: '700', fontSize: 17 },
  capacityText: { color: '#888', fontSize: 12, marginTop: 2 },
  dateValue: { color: '#666', fontSize: 13 },
  rateText: { color: '#888', fontSize: 12, marginTop: 2, textAlign: 'right' },
  reviewText: { color: '#f5a623', fontSize: 13, marginTop: 2, textAlign: 'right', fontWeight: '600', paddingTop: 15 },
  capacityBarBackground: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  capacityBarFill: {
    height: 6,
    borderRadius: 3,
  },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: theme.colors.success, padding: 15, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 8 },
  fabText: { color: '#FFF', fontWeight: '700', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderRadius: 20, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
});