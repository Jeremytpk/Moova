const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

// Define the Stripe secret key as a secret parameter
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

admin.initializeApp();

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

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
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
