import { collection, doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebaseConfig';

/**
 * Get or create a chat between two users
 * Creates a chat reference in both users' subcollections
 * @param {string} currentUserId - Current user's ID
 * @param {string} otherUserId - Other user's ID
 * @param {string} offerId - Related offer ID
 * @returns {Promise<string>} - Chat ID
 */
export const getOrCreateChat = async (currentUserId, otherUserId, offerId) => {
  try {
    console.log('Getting or creating chat between:', currentUserId, 'and', otherUserId);
    
    // Create a unique chat ID based on sorted user IDs to ensure same chat for both users
    const sortedIds = [currentUserId, otherUserId].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}_${offerId}`;
    
    console.log('Chat ID:', chatId);
    
    // Check if chat already exists in current user's chats
    const currentUserChatRef = doc(db, 'users', currentUserId, 'chats', chatId);
    const currentUserChatDoc = await getDoc(currentUserChatRef);
    
    if (currentUserChatDoc.exists()) {
      console.log('Chat already exists');
      return chatId;
    }
    
    // Create chat document in both users' subcollections
    const chatData = {
      chatId: chatId,
      otherUserId: otherUserId,
      offerId: offerId,
      createdAt: serverTimestamp(),
      lastMessageText: '',
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: '',
      unreadCount: 0,
    };
    
    // Create in current user's chats subcollection
    await setDoc(currentUserChatRef, {
      ...chatData,
      otherUserId: otherUserId,
    });
    
    // Create in other user's chats subcollection
    const otherUserChatRef = doc(db, 'users', otherUserId, 'chats', chatId);
    await setDoc(otherUserChatRef, {
      ...chatData,
      otherUserId: currentUserId, // From other user's perspective
    });
    
    console.log('Chat created successfully');
    return chatId;
  } catch (error) {
    console.error('Error getting or creating chat:', error);
    throw error;
  }
};

/**
 * Send a message in a chat
 * Updates both users' chat documents
 * @param {string} chatId - Chat ID
 * @param {string} currentUserId - Current user's ID
 * @param {string} otherUserId - Other user's ID
 * @param {string} text - Message text
 * @returns {Promise<void>}
 */
export const sendMessage = async (chatId, currentUserId, otherUserId, text) => {
  try {
    console.log('Sending message in chat:', chatId);
    
    // Generate a unique message ID that will be used in both users' collections
    const messageId = `${Date.now()}_${currentUserId}`;
    
    // Add message to messages subcollection
    const messageData = {
      senderId: currentUserId,
      text: text,
      createdAt: serverTimestamp(),
      read: false,
    };
    
    // Add to current user's messages with specific ID
    const currentMessagesRef = doc(db, 'users', currentUserId, 'chats', chatId, 'messages', messageId);
    await setDoc(currentMessagesRef, messageData);
    
    // Also add to other user's messages subcollection (mirror the messages) with same ID
    const otherMessagesRef = doc(db, 'users', otherUserId, 'chats', chatId, 'messages', messageId);
    await setDoc(otherMessagesRef, messageData);
    
    // Update current user's chat document
    const currentUserChatRef = doc(db, 'users', currentUserId, 'chats', chatId);
    await updateDoc(currentUserChatRef, {
      lastMessageText: text,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: currentUserId,
    });
    
    // Update other user's chat document and increment unread count
    const otherUserChatRef = doc(db, 'users', otherUserId, 'chats', chatId);
    const otherUserChatDoc = await getDoc(otherUserChatRef);
    const currentUnreadCount = otherUserChatDoc.exists() ? (otherUserChatDoc.data().unreadCount || 0) : 0;
    
    await updateDoc(otherUserChatRef, {
      lastMessageText: text,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: currentUserId,
      unreadCount: currentUnreadCount + 1,
    });
    
    console.log('Message sent successfully');
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark chat as read (reset unread count)
 * @param {string} userId - User's ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<void>}
 */
export const markChatAsRead = async (userId, chatId) => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await updateDoc(chatRef, {
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
  }
};

/**
 * Send a payment request message
 * Creates a special message type that includes payment information
 * @param {string} chatId - Chat ID
 * @param {string} currentUserId - Traveler's user ID (sender of payment request)
 * @param {string} otherUserId - Sender's user ID (receiver of payment request)
 * @param {number} kg - Amount of kg sold
 * @param {number} amount - Payment amount
 * @param {string} offerId - Related offer ID
 * @returns {Promise<void>}
 */
export const sendPaymentRequest = async (chatId, currentUserId, otherUserId, kg, amount, offerId) => {
  try {
    console.log('Sending payment request in chat:', chatId);
    
    // Generate a unique message ID that will be used in both users' collections
    const messageId = `${Date.now()}_${currentUserId}`;
    
    // Create payment request message
    const messageData = {
      senderId: currentUserId,
      type: 'paymentRequest',
      text: `Payment request: $${amount.toFixed(2)} for ${kg}kg`,
      paymentData: {
        kg: kg,
        amount: amount,
        offerId: offerId,
        status: 'pending', // pending, paid, failed
        createdAt: serverTimestamp(),
      },
      createdAt: serverTimestamp(),
      read: false,
    };
    
    // Add to current user's messages with specific ID
    const currentMessagesRef = doc(db, 'users', currentUserId, 'chats', chatId, 'messages', messageId);
    await setDoc(currentMessagesRef, messageData);
    
    // Add to other user's messages (mirror) with same ID
    const otherMessagesRef = doc(db, 'users', otherUserId, 'chats', chatId, 'messages', messageId);
    await setDoc(otherMessagesRef, messageData);
    
    // Update current user's chat document
    const currentUserChatRef = doc(db, 'users', currentUserId, 'chats', chatId);
    await updateDoc(currentUserChatRef, {
      lastMessageText: `Payment request: $${amount.toFixed(2)}`,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: currentUserId,
    });
    
    // Update other user's chat document
    const otherUserChatRef = doc(db, 'users', otherUserId, 'chats', chatId);
    const otherUserChatDoc = await getDoc(otherUserChatRef);
    const currentUnreadCount = otherUserChatDoc.exists() ? (otherUserChatDoc.data().unreadCount || 0) : 0;
    
    await updateDoc(otherUserChatRef, {
      lastMessageText: `Payment request: $${amount.toFixed(2)}`,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: currentUserId,
      unreadCount: currentUnreadCount + 1,
    });
    
    console.log('Payment request sent successfully');
  } catch (error) {
    console.error('Error sending payment request:', error);
    throw error;
  }
};

/**
 * Create Payment Intent with Stripe
 * @param {object} paymentInfo - Payment information
 * @returns {Promise<object>} - { clientSecret, paymentIntentId } or null
 */
export const createPaymentIntent = async (paymentInfo) => {
  try {
    console.log('Creating payment intent...', paymentInfo);

    const functions = getFunctions();
    const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');

    const result = await createPaymentIntentFn({
      amount: paymentInfo.amount,
      kg: paymentInfo.kg,
      offerId: paymentInfo.offerId,
      travelerId: paymentInfo.travelerId,
      currency: 'usd',
    });

    console.log('Payment intent created:', result.data);
    return result.data; // { clientSecret, paymentIntentId }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Confirm payment and update database
 * Called after Stripe payment is successful
 * @param {object} paymentInfo - Payment information including paymentIntentId
 * @returns {Promise<boolean>} - Success or failure
 */
export const confirmPayment = async (paymentInfo) => {
  try {
    console.log('Confirming payment...', paymentInfo);

    const functions = getFunctions();
    const confirmPaymentFn = httpsCallable(functions, 'confirmPayment');

    const result = await confirmPaymentFn({
      paymentIntentId: paymentInfo.paymentIntentId,
      offerId: paymentInfo.offerId,
      kg: paymentInfo.kg,
      amount: paymentInfo.amount,
      travelerId: paymentInfo.travelerId,
      fullName: paymentInfo.fullName,
      email: paymentInfo.email,
    });

    console.log('Payment confirmed successfully:', result.data);
    return result.data.success;
  } catch (error) {
    console.error('Error confirming payment:', error);
    return false;
  }
};

/**
 * Process payment (legacy function - kept for backward compatibility)
 * Now creates a payment intent instead of simulating payment
 * @param {object} paymentInfo - Payment information
 * @returns {Promise<object>} - Payment intent data or false
 */
export const processPayment = async (paymentInfo) => {
  try {
    console.log('Processing payment...', paymentInfo);

    // Create payment intent with Stripe
    const paymentIntentData = await createPaymentIntent({
      amount: paymentInfo.amount,
      kg: paymentInfo.kg,
      offerId: paymentInfo.offerId,
      travelerId: paymentInfo.travelerId,
    });

    return paymentIntentData; // Return clientSecret for the payment modal
  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
};
