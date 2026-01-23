import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
  Modal
} from 'react-native';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import theme from '../theme';
import Loading from '../components/Loading';
import { ProfileIcon, ArrowRightIcon, PackageIcon, ShipmentIcon } from '../components/Icons';

export default function UserDetailsScreen({ route, navigation }) {
  const { userId, user: initialUser } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(initialUser || null);
  const [shipments, setShipments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [offers, setOffers] = useState([]);
  const [chats, setChats] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFields, setEditFields] = useState({
    isAdmin: false,
    isTraveler: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const db = getFirestore();

      // Fetch user document
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        setUser(userData);
        setEditFields({
          isAdmin: !!userData.isAdmin,
          isTraveler: !!userData.isTraveler,
        });
      }

      // Fetch user's shipments (as sender)
      try {
        const shipmentsSnapshot = await getDocs(collection(db, 'users', userId, 'shipments'));
        const shipmentsList = shipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShipments(shipmentsList);
      } catch (e) {
        setShipments([]);
      }

      // Fetch user's deliveries (as traveler)
      try {
        const deliveriesSnapshot = await getDocs(collection(db, 'users', userId, 'deliveries'));
        const deliveriesList = deliveriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeliveries(deliveriesList);
      } catch (e) {
        setDeliveries([]);
      }

      // Fetch user's offers
      try {
        const offersSnapshot = await getDocs(collection(db, 'offers'));
        const userOffers = offersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(offer => offer.userId === userId);
        setOffers(userOffers);
      } catch (e) {
        setOffers([]);
      }

      // Fetch user's chats
      try {
        const chatsSnapshot = await getDocs(collection(db, 'users', userId, 'chats'));
        const chatsList = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChats(chatsList);
      } catch (e) {
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to fetch user data');
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, [userId]);

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: editFields.isAdmin,
        isTraveler: editFields.isTraveler,
      });
      setUser({ ...user, ...editFields });
      setEditModalVisible(false);
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    }
    setSaving(false);
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user?.username || user?.email}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              await deleteDoc(doc(db, 'users', userId));
              Alert.alert('Success', 'User deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.toDate) return date.toDate().toLocaleDateString();
    return 'N/A';
  };

  const calculateTotalEarnings = () => {
    return deliveries.reduce((sum, d) => sum + (d.travelerEarnings || 0), 0);
  };

  const calculatePendingPayouts = () => {
    let pending = 0;
    deliveries.forEach(d => {
      if (!d.initialPaymentReleased) pending += d.initialPayment || 0;
      if (!d.finalPaymentReleased && d.status === 'delivered') pending += d.finalPayment || 0;
    });
    return pending;
  };

  if (loading) return <Loading fullScreen />;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <ProfileIcon size={60} color="white" />
          )}
        </View>
        <Text style={styles.userName}>{user.username || user.name || 'No Name'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.badgesRow}>
          {user.isAdmin && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
          {user.isTraveler && (
            <View style={[styles.badge, styles.travelerBadge]}>
              <Text style={styles.badgeText}>Traveler</Text>
            </View>
          )}
          {!user.isAdmin && !user.isTraveler && (
            <View style={[styles.badge, styles.userBadge]}>
              <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>User</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{offers.length}</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{shipments.length}</Text>
          <Text style={styles.statLabel}>Shipments</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{deliveries.length}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{chats.length}</Text>
          <Text style={styles.statLabel}>Chats</Text>
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{userId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Profile Complete</Text>
          <Text style={styles.infoValue}>{user.profileComplete ? 'Yes' : 'No'}</Text>
        </View>
        {user.stripeCustomerId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stripe Customer</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user.stripeCustomerId}</Text>
          </View>
        )}
      </View>

      {/* Payment Information (for travelers) */}
      {user.isTraveler && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          {user.travelerPayment ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Method</Text>
                <Text style={styles.infoValue}>
                  {user.travelerPayment.method === 'cashapp' ? 'CashApp' : 'Zelle'}
                </Text>
              </View>
              {user.travelerPayment.method === 'cashapp' && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CashApp Tag</Text>
                  <Text style={[styles.infoValue, styles.highlightValue]}>
                    {user.travelerPayment.cashappTag}
                  </Text>
                </View>
              )}
              {user.travelerPayment.method === 'zelle' && (
                <>
                  {user.travelerPayment.zelleEmail && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Zelle Email</Text>
                      <Text style={styles.infoValue}>{user.travelerPayment.zelleEmail}</Text>
                    </View>
                  )}
                  {user.travelerPayment.zellePhone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Zelle Phone</Text>
                      <Text style={styles.infoValue}>{user.travelerPayment.zellePhone}</Text>
                    </View>
                  )}
                </>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>No payment method configured</Text>
          )}

          {/* Earnings Summary */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsValue}>${calculateTotalEarnings().toFixed(2)}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Pending Payouts</Text>
              <Text style={[styles.earningsValue, { color: theme.colors.warning }]}>
                ${calculatePendingPayouts().toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Data</Text>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('UserOffers', { userId, user })}
        >
          <View style={[styles.navIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <PackageIcon size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Offers</Text>
            <Text style={styles.navSubtitle}>{offers.length} offer(s)</Text>
          </View>
          <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('UserShipments', { userId, user, type: 'shipments' })}
        >
          <View style={[styles.navIcon, { backgroundColor: theme.colors.success + '15' }]}>
            <ShipmentIcon size={20} color={theme.colors.success} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Shipments (as Sender)</Text>
            <Text style={styles.navSubtitle}>{shipments.length} shipment(s)</Text>
          </View>
          <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {user.isTraveler && (
          <>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('UserShipments', { userId, user, type: 'deliveries' })}
            >
              <View style={[styles.navIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <ShipmentIcon size={20} color={theme.colors.warning} />
              </View>
              <View style={styles.navContent}>
                <Text style={styles.navTitle}>Deliveries (as Traveler)</Text>
                <Text style={styles.navSubtitle}>{deliveries.length} delivery(ies)</Text>
              </View>
              <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('UserPayouts', { userId, user })}
            >
              <View style={[styles.navIcon, { backgroundColor: theme.colors.error + '15' }]}>
                <Text style={styles.dollarIcon}>$</Text>
              </View>
              <View style={styles.navContent}>
                <Text style={styles.navTitle}>Payouts & Transactions</Text>
                <Text style={styles.navSubtitle}>View payment history</Text>
              </View>
              <ArrowRightIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Admin Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Edit User Roles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDeleteUser}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Delete User</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User Roles</Text>
            <Text style={styles.modalSubtitle}>{user.username || user.email}</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Admin</Text>
              <Switch
                value={editFields.isAdmin}
                onValueChange={(v) => setEditFields({ ...editFields, isAdmin: v })}
                trackColor={{ true: theme.colors.warning }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Traveler</Text>
              <Switch
                value={editFields.isTraveler}
                onValueChange={(v) => setEditFields({ ...editFields, isTraveler: v })}
                trackColor={{ true: theme.colors.success }}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveUser}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'white',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: theme.colors.warning,
  },
  travelerBadge: {
    backgroundColor: theme.colors.success,
  },
  userBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.colors.background,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  highlightValue: {
    color: theme.colors.primary,
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  earningsCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  navSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dollarIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  dangerButtonText: {
    color: theme.colors.error,
  },
  errorText: {
    textAlign: 'center',
    color: theme.colors.error,
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
