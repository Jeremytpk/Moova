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
  Linking,
  Share
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
import { ProfileIcon } from '../components/Icons';

export default function UserPayoutsScreen({ route, navigation }) {
  const { userId, user } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: `${user?.username || 'User'}'s Payouts`,
    });
    fetchDeliveries();
  }, [userId]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, 'users', userId, 'deliveries'));
      const deliveriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort by date, newest first
      deliveriesList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setDeliveries(deliveriesList);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      Alert.alert('Error', 'Failed to fetch payout data');
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  }, [userId]);

  const calculateStats = () => {
    let totalEarnings = 0;
    let pendingPayouts = 0;
    let releasedPayouts = 0;

    deliveries.forEach(d => {
      totalEarnings += d.travelerEarnings || 0;

      if (d.initialPaymentReleased) {
        releasedPayouts += d.initialPayment || 0;
      } else {
        pendingPayouts += d.initialPayment || 0;
      }

      if (d.finalPaymentReleased) {
        releasedPayouts += d.finalPayment || 0;
      } else if (d.status === 'delivered') {
        pendingPayouts += d.finalPayment || 0;
      }
    });

    return { totalEarnings, pendingPayouts, releasedPayouts };
  };

  const handleReleasePayment = async (delivery, paymentType) => {
    setProcessing(true);
    try {
      const db = getFirestore();
      const updateData = {};

      if (paymentType === 'initial') {
        updateData.initialPaymentReleased = true;
        updateData.initialPaymentDate = new Date();
      } else {
        updateData.finalPaymentReleased = true;
        updateData.finalPaymentDate = new Date();
      }

      // Check if both payments will be released after this update
      const willInitialBeReleased = paymentType === 'initial' ? true : delivery.initialPaymentReleased;
      const willFinalBeReleased = paymentType === 'final' ? true : delivery.finalPaymentReleased;

      if (willInitialBeReleased && willFinalBeReleased) {
        updateData.payoutStatus = 'paid';
      }

      await updateDoc(doc(db, 'users', userId, 'deliveries', delivery.id), updateData);

      // Also update in sender's shipments subcollection if we have the senderId
      if (delivery.senderId) {
        try {
          // Find matching shipment
          const shipmentsSnapshot = await getDocs(collection(db, 'users', delivery.senderId, 'shipments'));
          const matchingShipment = shipmentsSnapshot.docs.find(d => d.data().orderNumber === delivery.orderNumber);
          if (matchingShipment) {
            await updateDoc(doc(db, 'users', delivery.senderId, 'shipments', matchingShipment.id), updateData);
          }
        } catch (e) {
          console.log('Could not update sender shipment:', e);
        }
      }

      setDeliveries(deliveries.map(d => d.id === delivery.id ? { ...d, ...updateData } : d));
      setPayoutModalVisible(false);

      if (willInitialBeReleased && willFinalBeReleased) {
        Alert.alert('Success', 'All payments released! Payout marked as Paid.');
      } else {
        Alert.alert('Success', `${paymentType === 'initial' ? 'Initial' : 'Final'} payment marked as released`);
      }
    } catch (error) {
      console.error('Error releasing payment:', error);
      Alert.alert('Error', 'Failed to release payment');
    }
    setProcessing(false);
  };

  const openCashApp = (delivery = null) => {
    if (user?.travelerPayment?.cashappTag) {
      const tag = user.travelerPayment.cashappTag.replace('$', '');

      if (delivery) {
        // Pre-fill amount for the payout
        // Note: CashApp doesn't support pre-populating the note/message via URL
        const amount = (delivery.finalPayment || 0).toFixed(2);
        Linking.openURL(`https://cash.app/$${tag}/${amount}`);
      } else {
        Linking.openURL(`https://cash.app/$${tag}`);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return 'N/A';
  };

  const getPaymentInfo = () => {
    if (!user?.travelerPayment) return null;
    const payment = user.travelerPayment;
    if (payment.method === 'cashapp') {
      return {
        method: 'CashApp',
        detail: payment.cashappTag,
        icon: '$',
        color: '#00D632',
      };
    } else if (payment.method === 'zelle') {
      return {
        method: 'Zelle',
        detail: payment.zelleEmail || payment.zellePhone,
        icon: 'Z',
        color: '#6D1ED4',
      };
    }
    return null;
  };

  if (loading) return <Loading fullScreen />;

  const stats = calculateStats();
  const paymentInfo = getPaymentInfo();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Payment Method Card */}
      {paymentInfo ? (
        <TouchableOpacity
          style={[styles.paymentMethodCard, { borderColor: paymentInfo.color }]}
          onPress={paymentInfo.method === 'CashApp' ? openCashApp : undefined}
        >
          <View style={[styles.paymentMethodIcon, { backgroundColor: paymentInfo.color }]}>
            <Text style={styles.paymentMethodIconText}>{paymentInfo.icon}</Text>
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodLabel}>Payout via {paymentInfo.method}</Text>
            <Text style={styles.paymentMethodDetail}>{paymentInfo.detail}</Text>
          </View>
          {paymentInfo.method === 'CashApp' && (
            <Text style={styles.openAppText}>Open App</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.noPaymentCard}>
          <ProfileIcon size={40} color={theme.colors.textSecondary} />
          <Text style={styles.noPaymentText}>No payment method configured</Text>
        </View>
      )}

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${stats.totalEarnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            ${stats.releasedPayouts.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Released</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>
            ${stats.pendingPayouts.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Payment Explanation */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Payment Split Info</Text>
        <Text style={styles.infoText}>
          Travelers receive 92% of the base price, split as:
        </Text>
        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <Text style={styles.infoRowText}>60% initial payment (after 24 hours)</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.infoRowText}>40% final payment (upon delivery)</Text>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions ({deliveries.length})</Text>

        {deliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          deliveries.map(delivery => (
            <TouchableOpacity
              key={delivery.id}
              style={styles.transactionCard}
              onPress={() => {
                setSelectedDelivery(delivery);
                setPayoutModalVisible(true);
              }}
            >
              <View style={styles.transactionHeader}>
                <View>
                  <Text style={styles.transactionRoute}>
                    {delivery.departure} → {delivery.arrival}
                  </Text>
                  <Text style={styles.transactionOrder}>
                    #{delivery.orderNumber || delivery.id.slice(0, 6).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.transactionTotal}>
                  ${(delivery.travelerEarnings || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.paymentBreakdown}>
                {/* Initial Payment */}
                <View style={styles.paymentItem}>
                  <View style={styles.paymentItemLeft}>
                    <View style={[
                      styles.paymentDot,
                      { backgroundColor: delivery.initialPaymentReleased ? theme.colors.success : theme.colors.warning }
                    ]} />
                    <Text style={styles.paymentItemLabel}>Initial (60%)</Text>
                  </View>
                  <View style={styles.paymentItemRight}>
                    <Text style={styles.paymentItemAmount}>
                      ${(delivery.initialPayment || 0).toFixed(2)}
                    </Text>
                    <View style={[
                      styles.paymentStatusBadge,
                      { backgroundColor: delivery.initialPaymentReleased ? theme.colors.success + '20' : theme.colors.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.paymentStatusText,
                        { color: delivery.initialPaymentReleased ? theme.colors.success : theme.colors.warning }
                      ]}>
                        {delivery.initialPaymentReleased ? 'Released' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Final Payment */}
                <View style={styles.paymentItem}>
                  <View style={styles.paymentItemLeft}>
                    <View style={[
                      styles.paymentDot,
                      { backgroundColor: delivery.finalPaymentReleased ? theme.colors.success :
                          delivery.status === 'delivered' ? theme.colors.warning : theme.colors.textSecondary }
                    ]} />
                    <Text style={styles.paymentItemLabel}>Final (40%)</Text>
                  </View>
                  <View style={styles.paymentItemRight}>
                    <Text style={styles.paymentItemAmount}>
                      ${(delivery.finalPayment || 0).toFixed(2)}
                    </Text>
                    <View style={[
                      styles.paymentStatusBadge,
                      { backgroundColor: delivery.finalPaymentReleased ? theme.colors.success + '20' :
                          delivery.status === 'delivered' ? theme.colors.warning + '20' : theme.colors.textSecondary + '20' }
                    ]}>
                      <Text style={[
                        styles.paymentStatusText,
                        { color: delivery.finalPaymentReleased ? theme.colors.success :
                            delivery.status === 'delivered' ? theme.colors.warning : theme.colors.textSecondary }
                      ]}>
                        {delivery.finalPaymentReleased ? 'Released' :
                          delivery.status === 'delivered' ? 'Pending' : 'Awaiting Delivery'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.transactionFooter}>
                <Text style={styles.transactionDate}>{formatDate(delivery.createdAt)}</Text>
                {delivery.initialPaymentReleased && delivery.finalPaymentReleased ? (
                  <View style={[styles.paymentStatusBadge, { backgroundColor: theme.colors.success + '20' }]}>
                    <Text style={[styles.paymentStatusText, { color: theme.colors.success }]}>
                      ✓ Paid
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.transactionStatus}>
                    Payout: Pending
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Payout Action Modal */}
      <Modal visible={payoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Payout</Text>

            {selectedDelivery && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalRoute}>
                    {selectedDelivery.departure} → {selectedDelivery.arrival}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const noteText = `Moova AF ${selectedDelivery.orderNumber || selectedDelivery.id.slice(0, 6).toUpperCase()}`;
                      Share.share({ message: noteText });
                    }}
                  >
                    <Text style={[styles.modalOrder, { color: theme.colors.primary }]}>
                      Moova AF {selectedDelivery.orderNumber || selectedDelivery.id.slice(0, 6).toUpperCase()} (tap to copy)
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Payment Details</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Total Earnings</Text>
                    <Text style={styles.modalValue}>
                      ${(selectedDelivery.travelerEarnings || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Sender</Text>
                    <Text style={styles.modalValue}>
                      {selectedDelivery.senderName || selectedDelivery.senderEmail || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Delivery Status</Text>
                    <Text style={styles.modalValue}>{selectedDelivery.status || 'Unknown'}</Text>
                  </View>
                </View>

                {/* Payment Actions */}
                <View style={styles.paymentActions}>
                  {/* Initial Payment Action */}
                  <View style={styles.paymentActionCard}>
                    <View style={styles.paymentActionHeader}>
                      <Text style={styles.paymentActionTitle}>Initial Payment (60%)</Text>
                      <Text style={styles.paymentActionAmount}>
                        ${(selectedDelivery.initialPayment || 0).toFixed(2)}
                      </Text>
                    </View>
                    {selectedDelivery.initialPaymentReleased ? (
                      <View style={styles.releasedBadge}>
                        <Text style={styles.releasedText}>Released on {formatDate(selectedDelivery.initialPaymentDate)}</Text>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.releaseBtn}
                          onPress={() => handleReleasePayment(selectedDelivery, 'initial')}
                          disabled={processing}
                        >
                          <Text style={styles.releaseBtnText}>
                            {processing ? 'Processing...' : 'Mark as Released'}
                          </Text>
                        </TouchableOpacity>
                        {paymentInfo && paymentInfo.method === 'CashApp' && (
                          <TouchableOpacity
                            style={[styles.quickPayBtn, { backgroundColor: paymentInfo.color, marginTop: 8 }]}
                            onPress={() => {
                              const tag = paymentInfo.detail.replace('$', '');
                              const amount = (selectedDelivery.initialPayment || 0).toFixed(2);
                              Linking.openURL(`https://cash.app/$${tag}/${amount}`);
                            }}
                          >
                            <Text style={styles.quickPayBtnText}>
                              Open {paymentInfo.method} to Pay ${(selectedDelivery.initialPayment || 0).toFixed(2)}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>

                  {/* Final Payment Action */}
                  <View style={styles.paymentActionCard}>
                    <View style={styles.paymentActionHeader}>
                      <Text style={styles.paymentActionTitle}>Final Payment (40%)</Text>
                      <Text style={styles.paymentActionAmount}>
                        ${(selectedDelivery.finalPayment || 0).toFixed(2)}
                      </Text>
                    </View>
                    {selectedDelivery.finalPaymentReleased ? (
                      <View style={styles.releasedBadge}>
                        <Text style={styles.releasedText}>Released on {formatDate(selectedDelivery.finalPaymentDate)}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.releaseBtn}
                        onPress={() => {
                          Alert.alert(
                            'Confirm Release',
                            'Are you sure you want to mark the final payment as released?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Yes',
                                onPress: () => handleReleasePayment(selectedDelivery, 'final'),
                                style: 'destructive',
                              },
                            ]
                          );
                        }}
                        disabled={processing}
                      >
                        <Text style={styles.releaseBtnText}>
                          {processing ? 'Processing...' : 'Mark Final as Released'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Payment Method for Quick Access */}
                {paymentInfo && (
                  <TouchableOpacity
                    style={[styles.quickPayBtn, { backgroundColor: paymentInfo.color }]}
                    onPress={paymentInfo.method === 'CashApp' ? () => openCashApp(selectedDelivery) : undefined}
                  >
                    <Text style={styles.quickPayBtnText}>
                      Open {paymentInfo.method} to Pay ${(selectedDelivery.finalPayment || 0).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPayoutModalVisible(false)}
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
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    ...theme.shadows.sm,
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paymentMethodIconText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  paymentMethodDetail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 2,
  },
  openAppText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  noPaymentCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    ...theme.shadows.sm,
  },
  noPaymentText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    marginHorizontal: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: theme.colors.primary + '10',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.warning,
    marginRight: 10,
  },
  infoRowText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.background,
    margin: 16,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  transactionCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  transactionOrder: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  transactionTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  paymentBreakdown: {
    gap: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  paymentItemLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  paymentItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  transactionStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
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
    marginBottom: 16,
  },
  modalInfo: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  modalRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalOrder: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
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
  },
  paymentActions: {
    gap: 12,
    marginBottom: 16,
  },
  paymentActionCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
  },
  paymentActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  paymentActionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  releasedBadge: {
    backgroundColor: theme.colors.success + '20',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  releasedText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  releaseBtn: {
    backgroundColor: theme.colors.success,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  releaseBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  awaitingBadge: {
    backgroundColor: theme.colors.textSecondary + '20',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  awaitingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  quickPayBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickPayBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
