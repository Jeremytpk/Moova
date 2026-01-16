import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrCreateChat, sendMessage as sendChatMessage, sendPaymentRequest, createPaymentIntent, confirmPayment } from '../utils/chatHelpers';
import SellKgModal from '../components/SellKgModal';
import PaymentResultModal from '../components/PaymentResultModal';
import PaymentModal from '../components/PaymentModal';

/**
 * ChatScreen
 * Real-time chat between sender and traveler
 */
export default function ChatScreen({ route, navigation }) {
  // Security: Prevent screenshots and screen recording
  useEffect(() => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        const { default: RNPreventScreenshot } = require('react-native-prevent-screenshot');
        RNPreventScreenshot.forbid();
      } catch (e) {
        // If library not available, ignore
      }
    }
    return () => {
      try {
        const { default: RNPreventScreenshot } = require('react-native-prevent-screenshot');
        RNPreventScreenshot.allow();
      } catch (e) {}
    };
  }, []);
  const { offerId, otherUserId, otherUserName, chatId: existingChatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState(existingChatId || null);
  const [offer, setOffer] = useState(null);
  const [showSellKgModal, setShowSellKgModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPaymentMessage, setEditingPaymentMessage] = useState(null);
  const [editedAmount, setEditedAmount] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null);
  const [paymentIntentData, setPaymentIntentData] = useState(null);
  const flatListRef = useRef(null);
  const currentUser = auth.currentUser;
  const { language } = useLanguage();

  // Translations
  const translations = {
    en: {
      typeMessage: 'Type a message...',
      send: 'Send',
      noMessages: 'No messages yet',
      startChat: 'Start the conversation!',
      sellKg: 'Create Payment Request',
      payNow: 'Pay Now',
      paid: 'Paid',
      paymentFailed: 'Payment Failed',
      editAmount: 'Edit',
      updateAmount: 'Update Amount',
      cancel: 'Cancel',
      newAmount: 'New Amount',
      deleteRequest: 'Delete Request',
      deleteConfirm: 'Are you sure you want to delete this payment request?',
      delete: 'Delete',
      requestCanceled: 'Payment request canceled',
    },
    fr: {
      typeMessage: 'Écrivez un message...',
      send: 'Envoyer',
      noMessages: 'Aucun message',
      startChat: 'Commencez la conversation!',
      sellKg: 'Créer une Demande de Paiement',
      payNow: 'Payer Maintenant',
      paid: 'Payé',
      paymentFailed: 'Paiement Échoué',
      editAmount: 'Modifier',
      updateAmount: 'Mettre à Jour',
      cancel: 'Annuler',
      newAmount: 'Nouveau Montant',
      deleteRequest: 'Supprimer la Demande',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette demande de paiement?',
      delete: 'Supprimer',
      requestCanceled: 'Demande de paiement annulée',
    },
  };

  const text = translations[language];

  // Load offer details
  useEffect(() => {
    const loadOffer = async () => {
      try {
        const offerDoc = await getDoc(doc(db, 'offers', offerId));
        if (offerDoc.exists()) {
          setOffer({ id: offerDoc.id, ...offerDoc.data() });
        }
      } catch (error) {
        console.error('Error loading offer:', error);
      }
    };
    loadOffer();
  }, [offerId]);

  useEffect(() => {
    if (!currentUser || !otherUserId) return;

    const initializeChat = async () => {
      try {
        // Get or create chat
        const id = await getOrCreateChat(currentUser.uid, otherUserId, offerId);
        setChatId(id);
        console.log('Chat initialized:', id);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();
  }, [currentUser, otherUserId, offerId]);

  useEffect(() => {
    if (!currentUser || !chatId) return;

    console.log('Setting up message listener for chat:', chatId);

    // Listen to messages in current user's messages subcollection
    const messagesRef = collection(db, 'users', currentUser.uid, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      console.log('Messages loaded:', messagesData.length);
      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, currentUser]);

  const sendMessage = async () => {
    if (!messageText.trim() || !currentUser || !chatId) return;
    // Block sending sensitive info
    const sensitiveRegex = /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\b\d{10,}\b|zelle|cashapp|payment id)/i;
    if (sensitiveRegex.test(messageText)) {
      Alert.alert('Prohibited', 'Sharing email addresses, phone numbers, or payment IDs (Zelle, CashApp) is not allowed.');
      return;
    }
    try {
      await sendChatMessage(chatId, currentUser.uid, otherUserId, messageText.trim());
      setMessageText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  // Only allow photo proof of package
  // (Assume photo sending logic is in sendPhotoProof function)
  // All other photo sharing is prohibited
  };

  const handleSendPaymentRequest = async (kg, amount) => {
    if (!currentUser || !chatId) return;

    try {
      await sendPaymentRequest(chatId, currentUser.uid, otherUserId, kg, amount, offerId);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending payment request:', error);
      Alert.alert('Error', 'Failed to send payment request. Please try again.');
    }
  };

  const handlePayNow = async (paymentData) => {
    try {
      // Set the selected payment request
      setSelectedPaymentRequest(paymentData);

      // Create payment intent with Stripe
      const intentData = await createPaymentIntent({
        amount: paymentData.amount,
        kg: paymentData.kg,
        offerId: offerId,
        travelerId: otherUserId,
      });

      if (!intentData || !intentData.clientSecret) {
        Alert.alert('Error', 'Failed to initialize payment. Please try again.');
        return;
      }

      // Store payment intent data and show payment modal
      setPaymentIntentData({
        ...intentData,
        amount: paymentData.amount,
        kg: paymentData.kg,
        offerId: offerId,
        travelerId: otherUserId,
        senderId: currentUser?.uid,
      });
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
    }
  };

  const handleProcessPayment = async (paymentInfo) => {
    try {
      // Confirm payment with backend
      const success = await confirmPayment({
        paymentIntentId: paymentInfo.paymentIntentId,
        offerId: paymentInfo.offerId,
        kg: paymentInfo.kg,
        amount: paymentInfo.amount,
        travelerId: paymentInfo.travelerId,
        fullName: paymentInfo.fullName,
        email: paymentInfo.email,
      });

      setShowPaymentModal(false);
      setPaymentSuccess(success);
      setShowResultModal(true);

      if (success) {
        // Reload offer to get updated capacity
        const offerDoc = await getDoc(doc(db, 'offers', offerId));
        if (offerDoc.exists()) {
          setOffer({ id: offerDoc.id, ...offerDoc.data() });
        }
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setShowPaymentModal(false);
      setPaymentSuccess(false);
      setShowResultModal(true);
    }
  };

  const handleEditPaymentRequest = (messageItem) => {
    setEditingPaymentMessage(messageItem);
    setEditedAmount(messageItem.paymentData.amount.toString());
    setShowEditPaymentModal(true);
  };

  const handleUpdatePaymentAmount = async () => {
    if (!editingPaymentMessage || !editedAmount || !currentUser || !chatId) return;

    const newAmount = parseFloat(editedAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      // Update the payment request in both users' message collections
      const { updateDoc, doc, query, where, getDocs } = await import('firebase/firestore');
      
      const currentUserMessagesRef = collection(db, 'users', currentUser.uid, 'chats', chatId, 'messages');
      const otherUserMessagesRef = collection(db, 'users', otherUserId, 'chats', chatId, 'messages');
      
      console.log('Updating payment request:', {
        senderId: editingPaymentMessage.senderId,
        kg: editingPaymentMessage.paymentData.kg,
        oldAmount: editingPaymentMessage.paymentData.amount,
        newAmount: newAmount,
        offerId: editingPaymentMessage.paymentData.offerId,
        status: editingPaymentMessage.paymentData.status
      });
      
      // Query for all payment requests (less restrictive to avoid query issues)
      const currentUserQuery = query(
        currentUserMessagesRef,
        where('type', '==', 'paymentRequest')
      );
      
      const currentUserSnapshot = await getDocs(currentUserQuery);
      console.log('Current user query found:', currentUserSnapshot.size, 'total payment requests');
      
      // Update in current user's messages
      const currentUserUpdates = [];
      currentUserSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Match by all key fields
        if (data.senderId === editingPaymentMessage.senderId &&
            data.paymentData.kg === editingPaymentMessage.paymentData.kg &&
            data.paymentData.amount === editingPaymentMessage.paymentData.amount &&
            data.paymentData.offerId === editingPaymentMessage.paymentData.offerId &&
            data.paymentData.status === editingPaymentMessage.paymentData.status) {
          console.log('Updating current user message:', docSnapshot.id);
          const docRef = doc(currentUserMessagesRef, docSnapshot.id);
          currentUserUpdates.push(
            updateDoc(docRef, {
              'paymentData.amount': newAmount,
              text: `Payment request: $${newAmount.toFixed(2)} for ${editingPaymentMessage.paymentData.kg}kg`,
            })
          );
        }
      });
      await Promise.all(currentUserUpdates);
      console.log('Updated', currentUserUpdates.length, 'messages in current user collection');
      
      // Query and update in other user's messages
      const otherUserQuery = query(
        otherUserMessagesRef,
        where('type', '==', 'paymentRequest')
      );
      
      const otherUserSnapshot = await getDocs(otherUserQuery);
      console.log('Other user query found:', otherUserSnapshot.size, 'total payment requests');
      
      const otherUserUpdates = [];
      otherUserSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Match by all key fields
        if (data.senderId === editingPaymentMessage.senderId &&
            data.paymentData.kg === editingPaymentMessage.paymentData.kg &&
            data.paymentData.amount === editingPaymentMessage.paymentData.amount &&
            data.paymentData.offerId === editingPaymentMessage.paymentData.offerId &&
            data.paymentData.status === editingPaymentMessage.paymentData.status) {
          console.log('Updating other user message:', docSnapshot.id);
          const docRef = doc(otherUserMessagesRef, docSnapshot.id);
          otherUserUpdates.push(
            updateDoc(docRef, {
              'paymentData.amount': newAmount,
              text: `Payment request: $${newAmount.toFixed(2)} for ${editingPaymentMessage.paymentData.kg}kg`,
            })
          );
        }
      });
      await Promise.all(otherUserUpdates);
      console.log('Updated', otherUserUpdates.length, 'messages in other user collection');

      setShowEditPaymentModal(false);
      setEditingPaymentMessage(null);
      setEditedAmount('');
    } catch (error) {
      console.error('Error updating payment request:', error);
      Alert.alert('Error', 'Failed to update payment request');
    }
  };

  const handleDeletePaymentRequest = (messageItem) => {
    Alert.alert(
      text.deleteRequest,
      text.deleteConfirm,
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
              const { updateDoc, doc, query, where, getDocs } = await import('firebase/firestore');
              
              const currentUserMessagesRef = collection(db, 'users', currentUser.uid, 'chats', chatId, 'messages');
              const otherUserMessagesRef = collection(db, 'users', otherUserId, 'chats', chatId, 'messages');
              
              console.log('Deleting payment request:', {
                senderId: messageItem.senderId,
                kg: messageItem.paymentData.kg,
                amount: messageItem.paymentData.amount,
                offerId: messageItem.paymentData.offerId,
                status: messageItem.paymentData.status
              });
              
              // Query for all payment requests (less restrictive to avoid query issues)
              const currentUserQuery = query(
                currentUserMessagesRef,
                where('type', '==', 'paymentRequest')
              );
              
              const currentUserSnapshot = await getDocs(currentUserQuery);
              console.log('Current user query found:', currentUserSnapshot.size, 'total payment requests');
              
              // Update in current user's messages - mark as canceled
              const currentUserUpdates = [];
              currentUserSnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                // Match by all key fields
                if (data.senderId === messageItem.senderId &&
                    data.paymentData.kg === messageItem.paymentData.kg &&
                    data.paymentData.amount === messageItem.paymentData.amount &&
                    data.paymentData.offerId === messageItem.paymentData.offerId &&
                    data.paymentData.status === messageItem.paymentData.status) {
                  console.log('Updating current user message:', docSnapshot.id);
                  const docRef = doc(currentUserMessagesRef, docSnapshot.id);
                  currentUserUpdates.push(
                    updateDoc(docRef, {
                      'paymentData.status': 'canceled',
                      text: 'Payment request canceled',
                    })
                  );
                }
              });
              await Promise.all(currentUserUpdates);
              console.log('Updated', currentUserUpdates.length, 'messages in current user collection');

              // Query and update in other user's messages - mark as canceled
              const otherUserQuery = query(
                otherUserMessagesRef,
                where('type', '==', 'paymentRequest')
              );
              
              const otherUserSnapshot = await getDocs(otherUserQuery);
              console.log('Other user query found:', otherUserSnapshot.size, 'total payment requests');
              
              const otherUserUpdates = [];
              otherUserSnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                // Match by all key fields
                if (data.senderId === messageItem.senderId &&
                    data.paymentData.kg === messageItem.paymentData.kg &&
                    data.paymentData.amount === messageItem.paymentData.amount &&
                    data.paymentData.offerId === messageItem.paymentData.offerId &&
                    data.paymentData.status === messageItem.paymentData.status) {
                  console.log('Updating other user message:', docSnapshot.id);
                  const docRef = doc(otherUserMessagesRef, docSnapshot.id);
                  otherUserUpdates.push(
                    updateDoc(docRef, {
                      'paymentData.status': 'canceled',
                      text: 'Payment request canceled',
                    })
                  );
                }
              });
              await Promise.all(otherUserUpdates);
              console.log('Updated', otherUserUpdates.length, 'messages in other user collection');
              
              console.log('Payment request canceled successfully in both users collections');
            } catch (error) {
              console.error('Error deleting payment request:', error);
              Alert.alert('Error', 'Failed to delete payment request');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === currentUser?.uid;
    const messageDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();

    // Payment request message
    if (item.type === 'paymentRequest') {
      const paymentData = item.paymentData;
      const isPaid = paymentData.status === 'paid';
      const isFailed = paymentData.status === 'failed';
      const isCanceled = paymentData.status === 'canceled';
      
      // If canceled, show a simple gray notification
      if (isCanceled) {
        return (
          <View
            style={[
              styles.paymentRequestBubble,
              styles.canceledPaymentRequest,
            ]}
          >
            <Text style={styles.canceledText}>🚫 {text.requestCanceled}</Text>
            <Text style={styles.paymentRequestTime}>
              {messageDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        );
      }
      
      return (
        <View
          style={[
            styles.paymentRequestBubble,
            isMyMessage ? styles.myPaymentRequest : styles.theirPaymentRequest,
          ]}
        >
          <Text style={styles.paymentRequestTitle}>💳 Payment Request</Text>
          <Text style={styles.paymentAmount}>${paymentData.amount.toFixed(2)}</Text>
          <Text style={styles.paymentKg}>for {paymentData.kg}kg</Text>
          
          {/* Edit and Delete buttons for traveler's own payment requests (not paid/failed) */}
          {isMyMessage && !isPaid && !isFailed && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditPaymentRequest(item)}
              >
                <Text style={styles.editButtonText}>✎ {text.editAmount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePaymentRequest(item)}
              >
                <Text style={styles.deleteButtonText}>✕ {text.delete}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Pay button for sender (not their message, not paid/failed) */}
          {!isMyMessage && !isPaid && !isFailed && (
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => handlePayNow(paymentData)}
            >
              <Text style={styles.payNowButtonText}>{text.payNow}</Text>
            </TouchableOpacity>
          )}
          
          {isPaid && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>✓ {text.paid}</Text>
            </View>
          )}
          
          {isFailed && (
            <View style={styles.failedBadge}>
              <Text style={styles.failedBadgeText}>✕ {text.paymentFailed}</Text>
            </View>
          )}
          
          <Text style={styles.paymentRequestTime}>
            {messageDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      );
    }

    // Regular text message
    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
          {item.text}
        </Text>
        <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
          {messageDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Traveler</Text>
        <Text style={styles.headerSubtitle}>{otherUserName || 'User'}</Text>
        
        {/* Payment Request Button (only show for traveler/offer owner) */}
        {offer && offer.userId === currentUser?.uid && (
          <TouchableOpacity
            style={styles.sellKgButton}
            onPress={() => setShowSellKgModal(true)}
          >
            <Text style={styles.sellKgButtonText}>💰 {text.sellKg}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start the conversation by sending a message!
              </Text>
            </View>
          )
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={text.typeMessage}
          placeholderTextColor={theme.colors.textLight}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim()}
        >
          <Text style={styles.sendButtonText}>{text.send}</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {offer && (
        <SellKgModal
          visible={showSellKgModal}
          onClose={() => setShowSellKgModal(false)}
          offer={offer}
          isChat={true}
          onSendPaymentRequest={handleSendPaymentRequest}
        />
      )}

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentRequest={paymentIntentData}
        onProcessPayment={handleProcessPayment}
      />

      <PaymentResultModal
        visible={showResultModal}
        onClose={() => setShowResultModal(false)}
        success={paymentSuccess}
        amount={selectedPaymentRequest?.amount}
        kg={selectedPaymentRequest?.kg}
      />

      {/* Edit Payment Request Modal */}
      <Modal
        visible={showEditPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditPaymentModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>{text.editAmount}</Text>
            
            <Text style={styles.editModalLabel}>{text.newAmount} ($)</Text>
            <TextInput
              style={styles.editModalInput}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="decimal-pad"
              value={editedAmount}
              onChangeText={setEditedAmount}
              autoFocus
            />

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.editModalCancelButton]}
                onPress={() => {
                  setShowEditPaymentModal(false);
                  setEditingPaymentMessage(null);
                  setEditedAmount('');
                }}
              >
                <Text style={styles.editModalCancelText}>{text.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editModalButton, styles.editModalConfirmButton]}
                onPress={handleUpdatePaymentAmount}
              >
                <Text style={styles.editModalConfirmText}>{text.updateAmount}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  sellKgButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  sellKgButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  messagesList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.borderRadius.xs,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.borderRadius.xs,
    ...theme.shadows.sm,
  },
  messageText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: theme.spacing.xs,
  },
  myMessageTime: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  paymentRequestBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
  },
  myPaymentRequest: {
    alignSelf: 'flex-end',
    backgroundColor: '#E3F2FD',
    borderColor: theme.colors.primary,
    borderBottomRightRadius: theme.borderRadius.xs,
  },
  theirPaymentRequest: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderColor: '#FFA726',
    borderBottomLeftRadius: theme.borderRadius.xs,
  },
  paymentRequestTitle: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    fontSize: 12,
  },
  paymentAmount: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  paymentKg: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  editButton: {
    backgroundColor: '#FFA726',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  editButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  payNowButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  payNowButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paidBadge: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  paidBadgeText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  failedBadge: {
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  failedBadgeText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  canceledPaymentRequest: {
    backgroundColor: '#E5E7EB',
  },
  canceledText: {
    ...theme.typography.body,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentRequestTime: {
    ...theme.typography.caption,
    color: '#000000',
    fontSize: 11,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    maxHeight: 100,
    color: theme.colors.text,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  sendButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  editModalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  editModalLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  editModalInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    fontSize: 18,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  editModalCancelButton: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  editModalCancelText: {
    ...theme.typography.button,
    color: theme.colors.text,
    fontWeight: '600',
  },
  editModalConfirmButton: {
    backgroundColor: theme.colors.primary,
  },
  editModalConfirmText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
