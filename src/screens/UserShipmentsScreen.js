import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import theme from '../theme';
import Loading from '../components/Loading';
import { ShipmentIcon } from '../components/Icons';

export default function UserShipmentsScreen({ route, navigation }) {
  const { userId, user, type = 'shipments' } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const isDeliveries = type === 'deliveries';
  const title = isDeliveries ? 'Deliveries' : 'Shipments';

  useEffect(() => {
    navigation.setOptions({
      title: `${user?.username || 'User'}'s ${title}`,
    });
    fetchItems();
  }, [userId, type]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const collectionName = isDeliveries ? 'deliveries' : 'shipments';
      const snapshot = await getDocs(collection(db, 'users', userId, collectionName));
      const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort by date, newest first
      itemsList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setItems(itemsList);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', `Failed to fetch ${title.toLowerCase()}`);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [userId, type]);

  const handleUpdateStatus = async (item, newStatus) => {
    try {
      const db = getFirestore();
      const collectionName = isDeliveries ? 'deliveries' : 'shipments';
      await updateDoc(doc(db, 'users', userId, collectionName, item.id), {
        status: newStatus,
        ...(newStatus === 'delivered' && { deliveredAt: new Date() }),
      });
      setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
      Alert.alert('Success', 'Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return 'N/A';
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    let d;
    if (typeof date === 'string') d = new Date(date);
    else if (date.toDate) d = date.toDate();
    else if (date.seconds) d = new Date(date.seconds * 1000);
    else return 'N/A';
    return d.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return theme.colors.success;
      case 'in_transit': return theme.colors.primary;
      case 'picked_up': return theme.colors.warning;
      case 'pending': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'in_transit': return 'In Transit';
      case 'picked_up': return 'Picked Up';
      case 'pending': return 'Pending';
      default: return status || 'Unknown';
    }
  };

  const calculateStats = () => {
    const delivered = items.filter(i => i.status === 'delivered').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const inTransit = items.filter(i => i.status === 'in_transit' || i.status === 'picked_up').length;
    const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    return { delivered, pending, inTransit, totalAmount };
  };

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  if (loading) return <Loading fullScreen />;

  const stats = calculateStats();

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
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.delivered}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.inTransit}</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>${stats.totalAmount.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <ShipmentIcon size={60} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No {title.toLowerCase()} found</Text>
        </View>
      ) : (
        items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => openDetailModal(item)}
          >
            <View style={styles.itemHeader}>
              <View>
                <Text style={styles.orderNumber}>#{item.orderNumber || item.id.slice(0, 6).toUpperCase()}</Text>
                <Text style={styles.itemRoute}>{item.departure} → {item.arrival}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{item.kg}kg</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>${(item.amount || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {isDeliveries ? 'Sender' : 'Traveler'}
                </Text>
                <Text style={styles.detailValue}>
                  {isDeliveries
                    ? (item.senderName || item.senderEmail || 'Unknown')
                    : (item.travelerName || 'Unknown')
                  }
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>

            {/* Payment Info for Deliveries */}
            {isDeliveries && (
              <View style={styles.paymentSection}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Initial (60%)</Text>
                  <View style={styles.paymentStatus}>
                    <Text style={styles.paymentAmount}>${(item.initialPayment || 0).toFixed(2)}</Text>
                    <View style={[
                      styles.paymentBadge,
                      { backgroundColor: item.initialPaymentReleased ? theme.colors.success + '20' : theme.colors.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.paymentBadgeText,
                        { color: item.initialPaymentReleased ? theme.colors.success : theme.colors.warning }
                      ]}>
                        {item.initialPaymentReleased ? 'Released' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Final (40%)</Text>
                  <View style={styles.paymentStatus}>
                    <Text style={styles.paymentAmount}>${(item.finalPayment || 0).toFixed(2)}</Text>
                    <View style={[
                      styles.paymentBadge,
                      { backgroundColor: item.finalPaymentReleased ? theme.colors.success + '20' : theme.colors.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.paymentBadgeText,
                        { color: item.finalPaymentReleased ? theme.colors.success : theme.colors.warning }
                      ]}>
                        {item.finalPaymentReleased ? 'Released' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {isDeliveries ? 'Delivery' : 'Shipment'} Details
              </Text>

              {selectedItem && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Order Info</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Order #</Text>
                      <Text style={styles.modalValue}>
                        {selectedItem.orderNumber || selectedItem.id.slice(0, 6).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Route</Text>
                      <Text style={styles.modalValue}>
                        {selectedItem.departure} → {selectedItem.arrival}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Status</Text>
                      <Text style={[styles.modalValue, { color: getStatusColor(selectedItem.status) }]}>
                        {getStatusLabel(selectedItem.status)}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Weight</Text>
                      <Text style={styles.modalValue}>{selectedItem.kg}kg</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Verification Code</Text>
                      <Text style={[styles.modalValue, styles.codeText]}>
                        {selectedItem.verificationCode || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>People</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Sender</Text>
                      <Text style={styles.modalValue}>{selectedItem.senderName || 'Unknown'}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Sender Email</Text>
                      <Text style={styles.modalValue}>{selectedItem.senderEmail || 'N/A'}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Traveler</Text>
                      <Text style={styles.modalValue}>{selectedItem.travelerName || 'Unknown'}</Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Financial</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Total Amount</Text>
                      <Text style={styles.modalValue}>${(selectedItem.amount || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Base Price</Text>
                      <Text style={styles.modalValue}>${(selectedItem.basePrice || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Service Fee</Text>
                      <Text style={styles.modalValue}>${(selectedItem.serviceFee || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Platform Commission</Text>
                      <Text style={styles.modalValue}>${(selectedItem.platformCommission || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Traveler Earnings</Text>
                      <Text style={[styles.modalValue, { color: theme.colors.success }]}>
                        ${(selectedItem.travelerEarnings || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Payment Split</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Initial (60%)</Text>
                      <Text style={styles.modalValue}>
                        ${(selectedItem.initialPayment || 0).toFixed(2)} -
                        {selectedItem.initialPaymentReleased ? ' Released' : ' Pending'}
                      </Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Final (40%)</Text>
                      <Text style={styles.modalValue}>
                        ${(selectedItem.finalPayment || 0).toFixed(2)} -
                        {selectedItem.finalPaymentReleased ? ' Released' : ' Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Dates</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Created</Text>
                      <Text style={styles.modalValue}>{formatDateTime(selectedItem.createdAt)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Departure</Text>
                      <Text style={styles.modalValue}>{formatDate(selectedItem.departureDate)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Arrival</Text>
                      <Text style={styles.modalValue}>{formatDate(selectedItem.arrivalDate)}</Text>
                    </View>
                    {selectedItem.deliveredAt && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Delivered</Text>
                        <Text style={styles.modalValue}>{formatDateTime(selectedItem.deliveredAt)}</Text>
                      </View>
                    )}
                  </View>

                  {selectedItem.stripePaymentIntentId && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Payment Reference</Text>
                      <Text style={styles.stripeId}>{selectedItem.stripePaymentIntentId}</Text>
                    </View>
                  )}

                  {/* Status Update Actions */}
                  {selectedItem.status !== 'delivered' && (
                    <View style={styles.statusActions}>
                      <Text style={styles.statusActionsTitle}>Update Status</Text>
                      <View style={styles.statusButtons}>
                        {['pending', 'picked_up', 'in_transit', 'delivered'].map(status => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.statusBtn,
                              selectedItem.status === status && styles.statusBtnActive,
                              { borderColor: getStatusColor(status) }
                            ]}
                            onPress={() => {
                              handleUpdateStatus(selectedItem, status);
                              setDetailModalVisible(false);
                            }}
                          >
                            <Text style={[
                              styles.statusBtnText,
                              { color: getStatusColor(status) }
                            ]}>
                              {getStatusLabel(status)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
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
  itemCard: {
    backgroundColor: theme.colors.background,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  itemRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetails: {
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
  paymentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stripeId: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 10,
    borderRadius: 8,
  },
  statusActions: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBtnActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
