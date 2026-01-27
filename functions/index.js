const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

// Define the Stripe secret key as a secret parameter
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

admin.initializeApp();

// Initialize Expo SDK
const expo = new Expo();

/**
 * Fee calculation functions
 */
function calculateServiceFee(kg) {
  if (kg <= 0) return 0;
  if (kg <= 5) return 3.70;
  if (kg < 10) return 5.50;
  if (kg <= 20) return 7.00;
  return 7.00;
}

function calculateFeeBreakdown(kg, pricePerKg) {
  const basePrice = kg * pricePerKg;
  const serviceFee = calculateServiceFee(kg);
  const senderTotal = basePrice + serviceFee;
  const platformCommission = basePrice * 0.08;
  const travelerEarnings = basePrice * 0.92;
  const travelerInitialPayment = travelerEarnings * 0.60;
  const travelerFinalPayment = travelerEarnings * 0.40;
  const platformRevenue = serviceFee + platformCommission;

  return {
    basePrice,
    serviceFee,
    senderTotal,
    platformCommission,
    platformRevenue,
    travelerEarnings,
    travelerInitialPayment,
    travelerFinalPayment,
  };
}

/**
 * Create Payment Sheet
 * Called by the app to initialize Stripe Payment Sheet (with Apple Pay/Google Pay support)
 * Returns clientSecret, ephemeralKey, and customer ID needed for Payment Sheet
 */
exports.createPaymentSheet = onCall(
  {
    secrets: [stripeSecretKey],
    cors: true,
  },
  async (request) => {
    // Initialize Stripe with the secret key
    const stripe = require('stripe')(stripeSecretKey.value().trim());

    const { data, auth } = request;

    console.log('createPaymentSheet called with auth:', auth?.uid, 'data:', data);

    // Verify user is authenticated
    if (!auth) {
      // For debugging, also check if senderId was passed
      if (data.senderId) {
        console.log('No auth but senderId provided:', data.senderId);
      }
      throw new Error('User must be authenticated');
    }

    const { amount, currency = 'usd', kg, offerId, travelerId, senderId } = data;

    // Validate input
    if (!amount || !kg || !offerId || !travelerId) {
      throw new Error('Missing required fields');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      console.log('Creating payment sheet for:', {
        amount,
        kg,
        offerId,
        userId: auth.uid,
      });

      const db = admin.firestore();

      // Get or create Stripe customer for this user
      let customerId;
      const userRef = db.collection('users').doc(auth.uid);
      const userDoc = await userRef.get();
      const userData = userDoc.exists ? userDoc.data() : {};

      if (userData.stripeCustomerId) {
        // Use existing customer
        customerId = userData.stripeCustomerId;
        console.log('Using existing Stripe customer:', customerId);
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          metadata: {
            firebaseUserId: auth.uid,
          },
          email: userData.email || undefined,
          name: userData.username || userData.fullName || undefined,
        });
        customerId = customer.id;

        // Save customer ID to user document
        await userRef.set({ stripeCustomerId: customerId }, { merge: true });
        console.log('Created new Stripe customer:', customerId);
      }

      // Create an ephemeral key for the customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2023-10-16' }
      );

      // Create a PaymentIntent with Apple Pay and Cash App Pay support
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: currency,
        customer: customerId,
        // Enable specific payment methods: card, Apple Pay (via card), and Cash App
        payment_method_types: ['card', 'cashapp'],
        metadata: {
          userId: auth.uid,
          kg: kg.toString(),
          offerId: offerId,
          travelerId: travelerId,
        },
      });

      console.log('Payment sheet created:', {
        paymentIntentId: paymentIntent.id,
        customerId: customerId,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating payment sheet:', error);
      throw new Error(error.message);
    }
  }
);

/**
 * Create Payment Intent
 * Called by the app to initialize a Stripe payment
 */
exports.createPaymentIntent = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
  // Initialize Stripe with the secret key (trim to remove any whitespace/newlines)
  const stripe = require('stripe')(stripeSecretKey.value().trim());

  const { data, auth } = request;
  // Verify user is authenticated
  if (!auth) {
    throw new Error('User must be authenticated');
  }

  const { amount, currency = 'usd', kg, offerId, travelerId } = data;

  // Validate input
  if (!amount || !kg || !offerId || !travelerId) {
    throw new Error('Missing required fields');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  try {
    console.log('Creating payment intent for:', {
      amount,
      kg,
      offerId,
      userId: auth.uid,
    });

    // Create a PaymentIntent with Stripe (card payments for web)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency,
      payment_method_types: ['card'], // Web only supports card payments
      metadata: {
        userId: auth.uid,
        kg: kg.toString(),
        offerId: offerId,
        travelerId: travelerId,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error(error.message);
  }
});

/**
 * Confirm Payment and Update Database
 * Called after payment is successful to update offer and create shipment
 */
exports.confirmPayment = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
  // Initialize Stripe with the secret key (trim to remove any whitespace/newlines)
  const stripe = require('stripe')(stripeSecretKey.value().trim());

  const { data, auth } = request;

  if (!auth) {
    throw new Error('User must be authenticated');
  }

  const { paymentIntentId, offerId, kg, amount, travelerId, fullName, email } = data;

  // Validate input
  if (!paymentIntentId || !offerId || !kg || !amount || !travelerId) {
    throw new Error('Missing required fields');
  }

  try {
    console.log('Confirming payment:', { paymentIntentId, offerId, kg, amount });

    // Verify payment was successful with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not successful');
    }

    const db = admin.firestore();
    const offerRef = db.collection('offers').doc(offerId);
    const offerDoc = await offerRef.get();

    if (!offerDoc.exists) {
      throw new Error('Offer not found');
    }

    const offerData = offerDoc.data();

    // Check if there's enough capacity
    if (offerData.availableCapacity < kg) {
      throw new Error('Not enough capacity available');
    }

    // Calculate fee breakdown
    const feeBreakdown = calculateFeeBreakdown(kg, offerData.pricePerKg);

    const newAvailableCapacity = offerData.availableCapacity - kg;
    const currentEarnings = offerData.totalEarnings || 0;
    // Add only traveler's net earnings to total (87% of base price)
    const newTotalEarnings = currentEarnings + feeBreakdown.travelerEarnings;

    // Create new sale record with fee breakdown
    const sales = offerData.sales || [];
    const newSale = {
      id: Date.now().toString(),
      kg: kg,
      amount: amount, // Total amount sender paid (includes service fee)
      basePrice: feeBreakdown.basePrice,
      serviceFee: feeBreakdown.serviceFee,
      platformCommission: feeBreakdown.platformCommission,
      travelerEarnings: feeBreakdown.travelerEarnings,
      date: admin.firestore.Timestamp.now(),
      buyerEmail: email || 'unknown@example.com',
      buyerName: fullName || 'Unknown',
      stripePaymentIntentId: paymentIntentId,
    };

    // Update offer
    await offerRef.update({
      availableCapacity: newAvailableCapacity,
      totalEarnings: newTotalEarnings,
      sales: [...sales, newSale],
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log('Offer updated successfully');

    // Create shipment record in the buyer's shipments subcollection
    const shipmentData = {
      offerId: offerId,
      orderNumber: generateOrderNumber(),
      travelerId: offerData.userId || travelerId,
      travelerName: offerData.userUsername || offerData.userName || 'Traveler',
      senderId: auth.uid,
      senderName: fullName || 'Sender',
      senderEmail: email || 'unknown@example.com',
      kg: kg,
      amount: amount, // Total amount sender paid
      pricePerKg: offerData.pricePerKg || 0,
      // Fee breakdown
      basePrice: feeBreakdown.basePrice,
      serviceFee: feeBreakdown.serviceFee,
      platformCommission: feeBreakdown.platformCommission,
      travelerEarnings: feeBreakdown.travelerEarnings,
      // Payment splits (60/40)
      initialPayment: feeBreakdown.travelerInitialPayment,
      finalPayment: feeBreakdown.travelerFinalPayment,
      initialPaymentReleased: false,
      finalPaymentReleased: false,
      initialPaymentDate: null,
      finalPaymentDate: null,
      departure: offerData.origin || 'Unknown',
      arrival: offerData.destination || 'Unknown',
      departureDate: offerData.date || null,
      arrivalDate: offerData.date || null,
      status: 'pending', // pending, picked_up, in_transit, delivered
      verificationCode: generatePasscode(),
      stripePaymentIntentId: paymentIntentId,
      paymentDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add to sender's shipments subcollection
    await db.collection('users').doc(auth.uid)
      .collection('shipments').add(shipmentData);

    // Also add to traveler's deliveries subcollection
    await db.collection('users').doc(travelerId)
      .collection('deliveries').add({
        ...shipmentData,
        // For traveler's view, swap sender/receiver perspective
        recipientId: auth.uid,
        recipientName: fullName || 'Sender',
        recipientEmail: email || 'unknown@example.com',
      });

    console.log('Shipment created successfully');

    return {
      success: true,
      shipmentData: {
        orderNumber: shipmentData.orderNumber,
        verificationCode: shipmentData.verificationCode,
      }
    };
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw new Error(error.message);
  }
});

/**
 * Release Initial Payment (60%)
 * Called manually or automatically after 24 hours
 */
exports.releaseInitialPayment = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new Error('User must be authenticated');
  }

  const { shipmentId, userId } = data;

  if (!shipmentId || !userId) {
    throw new Error('Missing required fields');
  }

  const db = admin.firestore();

  try {
    // Get shipment from deliveries collection
    const deliveriesSnapshot = await db.collection('users').doc(userId)
      .collection('deliveries')
      .where('orderNumber', '==', shipmentId)
      .get();

    if (deliveriesSnapshot.empty) {
      throw new Error('Shipment not found');
    }

    const deliveryDoc = deliveriesSnapshot.docs[0];
    const deliveryData = deliveryDoc.data();

    // Check if payment already released
    if (deliveryData.initialPaymentReleased) {
      throw new Error('Initial payment already released');
    }

    // Check if 24 hours have passed
    const paymentDate = deliveryData.paymentDate?.toDate();
    const now = new Date();
    const hoursSincePayment = (now - paymentDate) / (1000 * 60 * 60);

    if (hoursSincePayment < 24) {
      throw new Error(`Initial payment can be released in ${Math.ceil(24 - hoursSincePayment)} hours`);
    }

    // Update delivery with initial payment released
    await deliveryDoc.ref.update({
      initialPaymentReleased: true,
      initialPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also update the sender's shipment record
    const shipmentsSnapshot = await db.collectionGroup('shipments')
      .where('orderNumber', '==', shipmentId)
      .get();

    for (const shipmentDoc of shipmentsSnapshot.docs) {
      await shipmentDoc.ref.update({
        initialPaymentReleased: true,
        initialPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`Initial payment released for shipment ${shipmentId}`);

    return {
      success: true,
      message: 'Initial payment (60%) has been released',
      amount: deliveryData.initialPayment,
    };
  } catch (error) {
    console.error('Error releasing initial payment:', error);
    throw new Error(error.message);
  }
});

/**
 * Release Final Payment (40%)
 * Called when delivery is confirmed
 */
exports.releaseFinalPayment = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new Error('User must be authenticated');
  }

  const { shipmentId, userId, verificationCode } = data;

  if (!shipmentId || !userId || !verificationCode) {
    throw new Error('Missing required fields');
  }

  const db = admin.firestore();

  try {
    // Get shipment from deliveries collection
    const deliveriesSnapshot = await db.collection('users').doc(userId)
      .collection('deliveries')
      .where('orderNumber', '==', shipmentId)
      .get();

    if (deliveriesSnapshot.empty) {
      throw new Error('Shipment not found');
    }

    const deliveryDoc = deliveriesSnapshot.docs[0];
    const deliveryData = deliveryDoc.data();

    // Verify code
    if (deliveryData.verificationCode !== verificationCode) {
      throw new Error('Invalid verification code');
    }

    // Check if already delivered
    if (deliveryData.status === 'delivered') {
      throw new Error('Shipment already marked as delivered');
    }

    // Update delivery status and release final payment
    await deliveryDoc.ref.update({
      status: 'delivered',
      finalPaymentReleased: true,
      finalPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
      deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also update the sender's shipment record
    const shipmentsSnapshot = await db.collectionGroup('shipments')
      .where('orderNumber', '==', shipmentId)
      .get();

    for (const shipmentDoc of shipmentsSnapshot.docs) {
      await shipmentDoc.ref.update({
        status: 'delivered',
        finalPaymentReleased: true,
        finalPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`Final payment released for shipment ${shipmentId}`);

    return {
      success: true,
      message: 'Package delivered! Final payment (40%) has been released',
      amount: deliveryData.finalPayment,
      totalEarned: deliveryData.travelerEarnings,
    };
  } catch (error) {
    console.error('Error releasing final payment:', error);
    throw new Error(error.message);
  }
});

/**
 * Generate a 6-digit verification passcode
 */
function generatePasscode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a 6-character alphanumeric order number
 */
function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let orderNumber = '';
  for (let i = 0; i < 6; i++) {
    orderNumber += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return orderNumber;
}

/**
 * Send push notifications using Expo
 * @param {Array} tokens - Array of Expo push tokens
 * @param {object} notification - Notification data
 */
async function sendPushNotifications(tokens, notification) {
  const messages = [];

  for (const pushToken of tokens) {
    // Check that the token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      channelId: notification.channelId || 'default',
    });
  }

  // Send notifications in chunks
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }

  return tickets;
}

/**
 * Firestore Trigger: Send notification when a new offer is created
 */
exports.onOfferCreated = onDocumentCreated('offers/{offerId}', async (event) => {
  try {
    const offerData = event.data.data();
    const offerId = event.params.offerId;

    console.log('New offer created:', offerId, offerData);

    // Get all users with push tokens (exclude the offer creator)
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users')
      .where('expoPushToken', '!=', null)
      .get();

    const pushTokens = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      // Don't send notification to the user who created the offer
      if (doc.id !== offerData.userId && userData.expoPushToken) {
        pushTokens.push(userData.expoPushToken);
      }
    });

    if (pushTokens.length === 0) {
      console.log('No users with push tokens found');
      return;
    }

    // Send notification
    await sendPushNotifications(pushTokens, {
      title: '✈️ New Travel Offer Available!',
      body: `${offerData.origin} → ${offerData.destination} | ${offerData.availableCapacity}kg available at $${offerData.pricePerKg}/kg`,
      data: {
        type: 'new_offer',
        offerId: offerId,
      },
      channelId: 'offers',
    });

    console.log(`Sent new offer notification to ${pushTokens.length} users`);
  } catch (error) {
    console.error('Error sending new offer notification:', error);
  }
});

/**
 * Firestore Trigger: Send notification when a new message is received
 * Triggers on messages in users/{userId}/chats/{chatId}/messages/{messageId}
 */
exports.onMessageCreated = onDocumentCreated(
  'users/{userId}/chats/{chatId}/messages/{messageId}',
  async (event) => {
    try {
      const messageData = event.data.data();
      const { userId, chatId } = event.params;
      const senderId = messageData.senderId;

      console.log('New message created:', { userId, chatId, senderId });

      // Don't send notification to the sender
      if (userId === senderId) {
        console.log('Skipping notification - user is the sender');
        return;
      }

      // Get the recipient's push token
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        console.log('User not found');
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData.expoPushToken;

      if (!pushToken) {
        console.log('User does not have a push token');
        return;
      }

      // Get sender's name
      const senderDoc = await db.collection('users').doc(senderId).get();
      const senderName = senderDoc.exists
        ? (senderDoc.data().username || senderDoc.data().email || 'Someone')
        : 'Someone';

      // Get chat info to include in notification data
      const chatDoc = await db.collection('users').doc(userId).collection('chats').doc(chatId).get();
      const chatData = chatDoc.exists ? chatDoc.data() : {};

      // Send notification only for regular messages (not payment requests shown separately)
      const messageText = messageData.type === 'paymentRequest'
        ? '💳 Sent a payment request'
        : messageData.text;

      await sendPushNotifications([pushToken], {
        title: `💬 ${senderName}`,
        body: messageText,
        data: {
          type: 'new_message',
          chatId: chatId,
          otherUserId: senderId,
          otherUserName: senderName,
          offerId: chatData.offerId || '',
        },
        channelId: 'chat',
      });

      console.log(`Sent message notification to user ${userId}`);
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }
);

/**
 * Firestore Trigger: Send notification when a new review is created
 */
exports.onReviewCreated = onDocumentCreated('reviews/{reviewId}', async (event) => {
  try {
    const reviewData = event.data.data();
    const { travelerId, rating, comment, senderName } = reviewData;

    console.log('New review created:', event.params.reviewId, reviewData);

    // Get the traveler's push token
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(travelerId).get();

    if (!userDoc.exists) {
      console.log('Traveler not found');
      return;
    }

    const userData = userDoc.data();
    const pushToken = userData.expoPushToken;

    if (!pushToken) {
      console.log('Traveler does not have a push token');
      return;
    }

    // Send notification
    await sendPushNotifications([pushToken], {
      title: '🌟 You have a new review!',
      body: `${senderName} left you a ${rating}-star review: "${comment}"`,
      data: {
        type: 'new_review',
        travelerId: travelerId,
      },
      channelId: 'reviews',
    });

    console.log(`Sent new review notification to traveler ${travelerId}`);
  } catch (error) {
    console.error('Error sending new review notification:', error);
  }
});

/**
 * Firestore Trigger: Send notification when shipment status is updated
 * Notifies the sender about package status changes
 */
exports.onShipmentStatusUpdated = onDocumentUpdated(
  'users/{userId}/shipments/{shipmentId}',
  async (event) => {
    try {
      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();
      const { userId } = event.params;

      // Check if status actually changed
      if (beforeData.status === afterData.status) {
        console.log('Status unchanged, skipping notification');
        return;
      }

      const newStatus = afterData.status;
      const travelerName = afterData.travelerName || 'Your traveler';
      const orderNumber = afterData.orderNumber || '';

      console.log('Shipment status updated:', {
        userId,
        orderNumber,
        oldStatus: beforeData.status,
        newStatus: newStatus,
      });

      // Get the sender's push token
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        console.log('User not found');
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData.expoPushToken;

      if (!pushToken) {
        console.log('User does not have a push token');
        return;
      }

      // Define notification messages for each status
      const statusNotifications = {
        picked_up: {
          title: '📦 Package Picked Up!',
          body: `${travelerName} has received your package (Order #${orderNumber}). It's now with the traveler.`,
        },
        in_transit: {
          title: '✈️ Package On The Way!',
          body: `${travelerName} is now traveling with your package (Order #${orderNumber}). Your package is on its way to the destination.`,
        },
        arrived: {
          title: '📍 Traveler Has Arrived!',
          body: `${travelerName} has arrived at the destination with your package (Order #${orderNumber}). Please notify the recipient to pick up the package.`,
        },
        delivered: {
          title: '✅ Package Delivered!',
          body: `Your package (Order #${orderNumber}) has been successfully delivered. Thank you for using Moova!`,
        },
      };

      const notification = statusNotifications[newStatus];

      if (!notification) {
        console.log('No notification defined for status:', newStatus);
        return;
      }

      // Send notification
      await sendPushNotifications([pushToken], {
        title: notification.title,
        body: notification.body,
        data: {
          type: 'shipment_status_update',
          shipmentId: event.params.shipmentId,
          orderNumber: orderNumber,
          status: newStatus,
        },
        channelId: 'default',
      });

      console.log(`Sent status update notification to sender ${userId} for status: ${newStatus}`);
    } catch (error) {
      console.error('Error sending shipment status notification:', error);
    }
  }
);
