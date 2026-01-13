import { collection, doc, setDoc, addDoc, serverTimestamp, query, where, getDocs, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
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
 * Process payment and update offer
 * @param {object} paymentInfo - Payment information
 * @returns {Promise<boolean>} - Success or failure
 */
export const processPayment = async (paymentInfo) => {
  try {
    console.log('Processing payment...', paymentInfo);
    
    // Simulate payment processing (in real app, this would call Stripe/PayPal API)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    
    // Random success/failure for demonstration (80% success rate)
    const success = Math.random() > 0.2;
    
    if (!success) {
      throw new Error('Payment failed');
    }
    
    // Update the offer's sales
    const offerRef = doc(db, 'offers', paymentInfo.offerId);
    const offerDoc = await getDoc(offerRef);
    
    if (!offerDoc.exists()) {
      throw new Error('Offer not found');
    }
    
    const offerData = offerDoc.data();
    console.log('Offer data for shipment:', offerData);
    
    const newAvailableCapacity = offerData.availableCapacity - paymentInfo.kg;
    const currentEarnings = offerData.totalEarnings || 0;
    const newTotalEarnings = currentEarnings + paymentInfo.amount;
    
    // Create new sale record
    const sales = offerData.sales || [];
    const newSale = {
      id: Date.now().toString(),
      kg: paymentInfo.kg,
      amount: paymentInfo.amount,
      date: Timestamp.now(),
      buyerEmail: paymentInfo.email,
      buyerName: paymentInfo.fullName,
    };
    
    // Update offer
    await updateDoc(offerRef, {
      availableCapacity: newAvailableCapacity,
      totalEarnings: newTotalEarnings,
      sales: [...sales, newSale],
      updatedAt: Timestamp.now(),
    });
    
    // Generate a 6-digit verification passcode
    const generatePasscode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    
    // Generate a 6-character alphanumeric tracking/order number
    const generateOrderNumber = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let orderNumber = '';
      for (let i = 0; i < 6; i++) {
        orderNumber += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return orderNumber;
    };
    
    // Create a shipment record in the buyer's shipments subcollection
    const shipmentData = {
      offerId: paymentInfo.offerId,
      orderNumber: generateOrderNumber(),
      travelerId: offerData.userId || offerData.travelerId,
      travelerName: offerData.userUsername || offerData.userName || offerData.travelerName || 'Traveler',
      senderId: paymentInfo.senderId,
      senderName: paymentInfo.fullName,
      senderEmail: paymentInfo.email,
      kg: paymentInfo.kg,
      amount: paymentInfo.amount,
      pricePerKg: offerData.pricePerKg || 0,
      departure: offerData.origin || offerData.departure || offerData.from || 'Unknown',
      arrival: offerData.destination || offerData.arrival || offerData.to || 'Unknown',
      departureDate: offerData.date || offerData.departureDate || null,
      arrivalDate: offerData.date || offerData.arrivalDate || null,
      status: 'pending', // pending, picked_up, in_transit, delivered
      verificationCode: generatePasscode(),
      paymentDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    
    // Add to sender's shipments subcollection
    const senderShipmentsRef = collection(db, 'users', paymentInfo.senderId, 'shipments');
    await addDoc(senderShipmentsRef, shipmentData);
    
    console.log('Payment processed successfully and shipment created');
    return true;
  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
};
