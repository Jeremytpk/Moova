import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs
} from 'firebase/firestore';
import theme from '../theme';
import Loading from '../components/Loading';
import { ArrowRightIcon, PackageIcon, ShipmentIcon, ProfileIcon, ChatIcon, ChevronUpIcon, ChevronDownIcon } from '../components/Icons';
import MessagesList from './MessagesList';

export default function AdminScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMessagesModalVisible, setMessagesModalVisible] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTravelers: 0,
    totalOffers: 0,
    activeOffers: 0,
    totalShipments: 0,
    totalMessages: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
  });
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'offers', 'payments'
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setAdminUser({
        name: user.displayName || user.email?.split('@')[0] || 'Admin',
        photoURL: user.photoURL,
        email: user.email,
      });
    }
    fetchAllData();
  }, []);

  useEffect(() => {
    if (search) {
      const s = search.toLowerCase();
      const filtered = users.filter(
        u => (u.username && u.username.toLowerCase().includes(s)) ||
              (u.name && u.name.toLowerCase().includes(s)) ||
              (u.email && u.email.toLowerCase().includes(s))
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [search, users]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const db = getFirestore();

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);

      // Get recent users (last 5)
      const sortedUsers = [...usersList].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      setRecentUsers(sortedUsers.slice(0, 5));

      // Fetch offers
      const offersSnapshot = await getDocs(collection(db, 'offers'));
      const offersList = offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOffers(offersList);

      // Fetch messages count
      let totalMessages = 0;
      try {
        const messagesSnapshot = await getDocs(collection(db, 'messages'));
        totalMessages = messagesSnapshot.size;
      } catch (e) {
        // Messages collection might not exist
      }

      // Calculate stats
      const totalTravelers = usersList.filter(u => u.isTraveler).length;
      const activeOffers = offersList.filter(o => o.status === 'active').length;

      // Calculate total revenue from offers
      let totalRevenue = 0;
      let totalShipments = 0;
      offersList.forEach(offer => {
        if (offer.sales && Array.isArray(offer.sales)) {
          totalShipments += offer.sales.length;
          offer.sales.forEach(sale => {
            totalRevenue += sale.platformCommission || 0;
          });
        }
      });

      // Calculate pending payouts (initial + final payments not yet released)
      let pendingPayouts = 0;
      for (const user of usersList) {
        if (user.isTraveler) {
          try {
            const deliveriesSnapshot = await getDocs(collection(db, 'users', user.id, 'deliveries'));
            deliveriesSnapshot.docs.forEach(doc => {
              const delivery = doc.data();
              if (!delivery.initialPaymentReleased) {
                pendingPayouts += delivery.initialPayment || 0;
              }
              if (!delivery.finalPaymentReleased && delivery.status === 'delivered') {
                pendingPayouts += delivery.finalPayment || 0;
              }
            });
          } catch (e) {
            // Skip if no deliveries
          }
        }
      }

      setStats({
        totalUsers: usersList.length,
        totalTravelers,
        totalOffers: offersList.length,
        activeOffers,
        totalShipments,
        totalMessages,
        totalRevenue,
        pendingPayouts,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, []);

  const handleUserPress = (user) => {
    navigation.navigate('UserDetails', { userId: user.id, user });
  };

  const StatCard = ({ title, value, subtitle, icon, color = theme.colors.primary, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, onPress && styles.statCardPressable]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const UserRow = ({ user, showArrow = true }) => (
    <TouchableOpacity style={styles.userRow} onPress={() => handleUserPress(user)}>
      <View style={styles.userAvatar}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
          <ProfileIcon size={24} color={theme.colors.textSecondary} />
        )}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{user.username || user.name || 'No Name'}</Text>
          {user.isAdmin && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
          {user.isTraveler && !user.isAdmin && (
            <View style={[styles.badge, styles.travelerBadge]}>
              <Text style={styles.badgeText}>Traveler</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      {showArrow && <ArrowRightIcon size={20} color={theme.colors.textSecondary} />}
    </TouchableOpacity>
  );

  if (loading) return <Loading fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {adminUser?.photoURL ? (
            <Image source={{ uri: adminUser.photoURL }} style={styles.adminPhoto} />
          ) : (
            <View style={styles.adminPhotoPlaceholder}>
              <ProfileIcon size={24} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.adminName}>{adminUser?.name}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Search Results */}
      {search && searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.searchResultsTitle}>Search Results ({searchResults.length})</Text>
          {searchResults.slice(0, 5).map(user => (
            <UserRow key={user.id} user={user} />
          ))}
          {searchResults.length > 5 && (
            <Text style={styles.moreResults}>+{searchResults.length - 5} more results</Text>
          )}
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['overview', 'users', 'offers', 'payments'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              <TouchableOpacity onPress={() => setIsGridVisible(!isGridVisible)}>
                {isGridVisible ? (
                  <ChevronUpIcon size={24} color={theme.colors.textSecondary} />
                ) : (
                  <ChevronDownIcon size={24} color={theme.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            {isGridVisible && (
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<ProfileIcon size={24} color={theme.colors.primary} />}
                  color={theme.colors.primary}
                />
                <StatCard
                  title="Travelers"
                  value={stats.totalTravelers}
                  icon={<PackageIcon size={24} color={theme.colors.success} />}
                  color={theme.colors.success}
                />
                <StatCard
                  title="Active Offers"
                  value={stats.activeOffers}
                  subtitle={`of ${stats.totalOffers} total`}
                  icon={<PackageIcon size={24} color={theme.colors.warning} />}
                  color={theme.colors.warning}
                />
                <StatCard
                  title="Shipments"
                  value={stats.totalShipments}
                  icon={<ShipmentIcon size={24} color={theme.colors.error} />}
                  color={theme.colors.error}
                />
                <StatCard
                  title="Messages"
                  value={stats.totalMessages}
                  icon={<ChatIcon size={24} color="#8B5CF6" />}
                  color="#8B5CF6"
                  onPress={() => setMessagesModalVisible(true)}
                />
                <StatCard
                  title="Banners"
                  value="Manage"
                  icon={<Text style={{ fontSize: 24 }}>📢</Text>}
                  color={theme.colors.primary}
                  onPress={() => navigation.navigate('AdminBanners')}
                />
              </View>
            )}
          </View>

          {/* Revenue Card */}
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Platform Revenue (8% Commission)</Text>
            <Text style={styles.revenueValue}>${stats.totalRevenue.toFixed(2)}</Text>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueRow}>
              <Text style={styles.revenueSubLabel}>Pending Payouts</Text>
              <Text style={styles.revenueSubValue}>${stats.pendingPayouts.toFixed(2)}</Text>
            </View>
          </View>

          {/* Recent Users */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Users</Text>
              <TouchableOpacity onPress={() => setActiveTab('users')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentUsers.map(user => (
              <UserRow key={user.id} user={user} />
            ))}
          </View>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
          {users.map(user => (
            <UserRow key={user.id} user={user} />
          ))}
        </View>
      )}

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Offers ({offers.length})</Text>
          {offers.map(offer => (
            <TouchableOpacity
              key={offer.id}
              style={styles.offerCard}
              onPress={() => {
                const offerUser = users.find(u => u.id === offer.userId);
                if (offerUser) {
                  navigation.navigate('UserOffers', { userId: offer.userId, user: offerUser });
                }
              }}
            >
              <View style={styles.offerHeader}>
                <Text style={styles.offerRoute}>{offer.origin} → {offer.destination}</Text>
                <View style={[
                  styles.statusBadge,
                  offer.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    offer.status === 'active' ? styles.activeText : styles.inactiveText
                  ]}>
                    {offer.status || 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.offerDetails}>
                <Text style={styles.offerInfo}>
                  ${offer.pricePerKg}/kg • {offer.availableCapacity || 0}kg available
                </Text>
                <Text style={styles.offerOwner}>
                  By: {offer.userUsername || offer.userName || 'Unknown'}
                </Text>
              </View>
              {offer.sales && offer.sales.length > 0 && (
                <View style={styles.offerSales}>
                  <Text style={styles.salesText}>
                    {offer.sales.length} sale(s) • ${offer.totalEarnings?.toFixed(2) || '0.00'} earned
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Overview</Text>

          <View style={styles.paymentCard}>
            <Text style={styles.paymentCardTitle}>Platform Commission (8%)</Text>
            <Text style={styles.paymentCardValue}>${stats.totalRevenue.toFixed(2)}</Text>
          </View>

          <View style={styles.paymentCard}>
            <Text style={styles.paymentCardTitle}>Pending Traveler Payouts</Text>
            <Text style={[styles.paymentCardValue, { color: theme.colors.warning }]}>
              ${stats.pendingPayouts.toFixed(2)}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Travelers with Payouts</Text>
          {users.filter(u => u.isTraveler).map(user => (
            <TouchableOpacity
              key={user.id}
              style={styles.travelerPayoutRow}
              onPress={() => navigation.navigate('UserPayouts', { userId: user.id, user })}
            >
              <View style={styles.userAvatar}>
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                ) : (
                  <ProfileIcon size={24} color={theme.colors.textSecondary} />
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.username || user.name || 'No Name'}</Text>
                <Text style={styles.paymentMethod}>
                  {user.travelerPayment?.method === 'cashapp'
                    ? `CashApp: ${user.travelerPayment.cashappTag}`
                    : user.travelerPayment?.method === 'zelle'
                    ? `Zelle: ${user.travelerPayment.zelleEmail || user.travelerPayment.zellePhone}`
                    : 'No payment method'}
                </Text>
              </View>
              <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isMessagesModalVisible}
        onRequestClose={() => {
          setMessagesModalVisible(!isMessagesModalVisible);
        }}
      >
        <MessagesList onClose={() => setMessagesModalVisible(false)} />
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
 const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  adminPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 14,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  adminName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -12,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    ...theme.shadows.sm,
  },
  searchResults: {
    margin: 16,
    marginTop: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.sm,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  moreResults: {
    textAlign: 'center',
    color: theme.colors.primary,
    marginTop: 8,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: theme.colors.background,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    margin: '1%',
    ...theme.shadows.sm,
  },
  statCardPressable: {
    opacity: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  revenueCard: {
    margin: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.md,
  },
  revenueLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  revenueValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueSubLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  revenueSubValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 8,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  adminBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  travelerBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  offerCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  inactiveBadge: {
    backgroundColor: theme.colors.textSecondary + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: theme.colors.success,
  },
  inactiveText: {
    color: theme.colors.textSecondary,
  },
  offerDetails: {
    marginTop: 8,
  },
  offerInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  offerOwner: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  offerSales: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  salesText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentCardTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  paymentCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: 4,
  },
  travelerPayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  paymentMethod: {
    fontSize: 13,
    color: theme.colors.primary,
    marginTop: 2,
  },
});