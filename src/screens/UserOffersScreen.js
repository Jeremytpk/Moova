import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import theme from '../theme';
import Loading from '../components/Loading';
import { PackageIcon } from '../components/Icons';

export default function UserOffersScreen({ route, navigation }) {
  const { userId, user } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: `${user?.username || 'User'}'s Offers`,
    });
    fetchOffers();
  }, [userId]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const offersSnapshot = await getDocs(collection(db, 'offers'));
      const userOffers = offersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(offer => offer.userId === userId);
      setOffers(userOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      Alert.alert('Error', 'Failed to fetch offers');
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  }, [userId]);

  const handleEditOffer = (offer) => {
    setSelectedOffer(offer);
    setEditFields({
      origin: offer.origin || '',
      destination: offer.destination || '',
      pricePerKg: String(offer.pricePerKg || ''),
      totalCapacity: String(offer.totalCapacity || ''),
      availableCapacity: String(offer.availableCapacity || ''),
      status: offer.status || 'active',
    });
    setEditModalVisible(true);
  };

  const handleSaveOffer = async () => {
    if (!selectedOffer) return;
    setSaving(true);
    try {
      const db = getFirestore();
      const updateData = {
        origin: editFields.origin,
        destination: editFields.destination,
        pricePerKg: parseFloat(editFields.pricePerKg) || 0,
        totalCapacity: parseFloat(editFields.totalCapacity) || 0,
        availableCapacity: parseFloat(editFields.availableCapacity) || 0,
        status: editFields.status,
      };
      await updateDoc(doc(db, 'offers', selectedOffer.id), updateData);
      setOffers(offers.map(o => o.id === selectedOffer.id ? { ...o, ...updateData } : o));
      setEditModalVisible(false);
      Alert.alert('Success', 'Offer updated successfully');
    } catch (error) {
      console.error('Error updating offer:', error);
      Alert.alert('Error', 'Failed to update offer');
    }
    setSaving(false);
  };

  const handleDeleteOffer = (offer) => {
    Alert.alert(
      'Delete Offer',
      `Are you sure you want to delete this offer?\n${offer.origin} → ${offer.destination}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore();
              await deleteDoc(doc(db, 'offers', offer.id));
              setOffers(offers.filter(o => o.id !== offer.id));
              Alert.alert('Success', 'Offer deleted successfully');
            } catch (error) {
              console.error('Error deleting offer:', error);
              Alert.alert('Error', 'Failed to delete offer');
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
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return 'N/A';
  };

  const calculateOfferStats = () => {
    const totalSales = offers.reduce((sum, o) => sum + (o.sales?.length || 0), 0);
    const totalEarnings = offers.reduce((sum, o) => sum + (o.totalEarnings || 0), 0);
    const activeOffers = offers.filter(o => o.status === 'active').length;
    return { totalSales, totalEarnings, activeOffers };
  };

  if (loading) return <Loading fullScreen />;

  const stats = calculateOfferStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{offers.length}</Text>
          <Text style={styles.statLabel}>Total Offers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.activeOffers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalSales}</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>${stats.totalEarnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {/* Offers List */}
      {offers.length === 0 ? (
        <View style={styles.emptyState}>
          <PackageIcon size={60} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No offers found</Text>
        </View>
      ) : (
        offers.map(offer => (
          <View key={offer.id} style={styles.offerCard}>
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
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>${offer.pricePerKg}/kg</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Capacity</Text>
                <Text style={styles.detailValue}>
                  {offer.availableCapacity || 0}kg / {offer.totalCapacity || 0}kg
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Travel Date</Text>
                <Text style={styles.detailValue}>{formatDate(offer.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{formatDate(offer.createdAt)}</Text>
              </View>
            </View>

            {/* Sales Section */}
            {offer.sales && offer.sales.length > 0 && (
              <View style={styles.salesSection}>
                <Text style={styles.salesTitle}>Sales ({offer.sales.length})</Text>
                {offer.sales.map((sale, index) => (
                  <View key={index} style={styles.saleItem}>
                    <View style={styles.saleHeader}>
                      <Text style={styles.saleBuyer}>{sale.buyerName || sale.buyerEmail || 'Unknown'}</Text>
                      <Text style={styles.saleAmount}>${(sale.amount || 0).toFixed(2)}</Text>
                    </View>
                    <Text style={styles.saleDetails}>
                      {sale.kg}kg • Traveler earnings: ${(sale.travelerEarnings || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={styles.totalEarnings}>
                  <Text style={styles.totalLabel}>Total Earnings</Text>
                  <Text style={styles.totalValue}>${(offer.totalEarnings || 0).toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.offerActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleEditOffer(offer)}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteOffer(offer)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Offer</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Origin</Text>
              <TextInput
                style={styles.input}
                value={editFields.origin}
                onChangeText={(v) => setEditFields({ ...editFields, origin: v })}
                placeholder="Origin city"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Destination</Text>
              <TextInput
                style={styles.input}
                value={editFields.destination}
                onChangeText={(v) => setEditFields({ ...editFields, destination: v })}
                placeholder="Destination city"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Price/kg ($)</Text>
                <TextInput
                  style={styles.input}
                  value={editFields.pricePerKg}
                  onChangeText={(v) => setEditFields({ ...editFields, pricePerKg: v })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusToggle}>
                  {['active', 'inactive'].map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        editFields.status === status && styles.statusOptionActive
                      ]}
                      onPress={() => setEditFields({ ...editFields, status })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        editFields.status === status && styles.statusOptionTextActive
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Total Capacity (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editFields.totalCapacity}
                  onChangeText={(v) => setEditFields({ ...editFields, totalCapacity: v })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Available (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editFields.availableCapacity}
                  onChangeText={(v) => setEditFields({ ...editFields, availableCapacity: v })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
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
                onPress={handleSaveOffer}
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.sm,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  offerCard: {
    backgroundColor: theme.colors.background,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.sm,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
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
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  salesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  salesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  saleItem: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleBuyer: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saleAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  saleDetails: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  totalEarnings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  offerActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  editBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: theme.colors.error,
    fontWeight: '600',
    fontSize: 14,
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputRow: {
    flexDirection: 'row',
  },
  statusToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusOption: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  statusOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusOptionTextActive: {
    color: 'white',
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
