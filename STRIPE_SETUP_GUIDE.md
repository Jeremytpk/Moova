# Stripe Integration Setup Guide

This guide will help you set up real Stripe payments in your Moova app.

## Overview

The app now uses **Stripe** for secure payment processing. Payments are handled through:
1. **Frontend**: React Native app with Stripe CardField component
2. **Backend**: Firebase Cloud Functions that securely communicate with Stripe

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete your business profile (required for live payments)

## Step 2: Get Your Stripe API Keys

### Test Mode Keys (for development)

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_...`)
3. Copy your **Secret key** (starts with `sk_test_...`) - Click "Reveal test key token"

### Live Mode Keys (for production)

1. Complete Stripe account verification
2. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Copy your **Publishable key** (starts with `pk_live_...`)
4. Copy your **Secret key** (starts with `sk_live_...`)

⚠️ **NEVER commit your secret keys to git!**

## Step 3: Configure Your App

### Update App.js

Open `App.js` and replace the placeholder with your **Publishable Key**:

```javascript
// Line 17 in App.js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_KEY_HERE';
```

For production, use your live publishable key:
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_ACTUAL_KEY_HERE';
```

## Step 4: Set Up Firebase Functions

### Initialize Firebase Functions (if not already done)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init functions
# Select your Firebase project
# Choose JavaScript
# Install dependencies
```

### Configure Stripe Secret Key in Firebase

You need to securely store your Stripe secret key in Firebase Functions config:

```bash
# Set the Stripe secret key (TEST MODE)
firebase functions:config:set stripe.secret_key="sk_test_YOUR_ACTUAL_SECRET_KEY_HERE"

# For production, use your LIVE secret key:
# firebase functions:config:set stripe.secret_key="sk_live_YOUR_ACTUAL_SECRET_KEY_HERE"
```

### Deploy Firebase Functions

```bash
# Deploy only functions
firebase deploy --only functions

# Or deploy everything (functions + hosting + rules)
firebase deploy
```

After deployment, you should see:
- ✓ functions[createPaymentIntent]
- ✓ functions[confirmPayment]

## Step 5: Test Payments

### Test Card Numbers

Stripe provides test cards for development:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success (default) |
| `4000 0000 0000 0002` | Card declined |
| `4000 0027 6000 3184` | Requires 3D Secure authentication |

Use any:
- **Expiry date**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Testing the Flow

1. Open the app
2. Navigate to a travel offer
3. Chat with the traveler
4. Traveler creates a payment request
5. Click "Pay Now"
6. Enter test card details: `4242 4242 4242 4242`
7. Complete payment
8. Check that:
   - Payment succeeds
   - Offer capacity updates
   - Shipment is created

## Step 6: View Payments in Stripe Dashboard

### Test Mode
- [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)

### Live Mode
- [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)

## Step 7: Go Live (Production)

When you're ready to accept real payments:

1. **Complete Stripe Verification**
   - Verify your business
   - Add bank account for payouts
   - Complete tax information

2. **Switch to Live Keys**
   - Update `App.js` with live publishable key
   - Update Firebase Functions config with live secret key:
     ```bash
     firebase functions:config:set stripe.secret_key="sk_live_YOUR_LIVE_KEY"
     firebase deploy --only functions
     ```

3. **Test with Real Card**
   - Use a real credit/debit card (will charge real money!)
   - Start with small amounts to verify

4. **Set Up Webhooks** (recommended)
   - Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
   - Listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`

## Troubleshooting

### "Payment Failed" Error

**Check:**
1. Firebase Functions deployed correctly
2. Stripe secret key configured in Firebase
3. Internet connection
4. Firebase Functions logs: `firebase functions:log`

### "Unable to confirm payment"

**Check:**
1. Publishable key in App.js is correct
2. Card details are valid
3. Using test cards in test mode, real cards in live mode

### View Firebase Function Logs

```bash
# View recent logs
firebase functions:log

# View logs in real-time
firebase functions:log --only createPaymentIntent,confirmPayment
```

### View Stripe Logs

- Test mode: [https://dashboard.stripe.com/test/logs](https://dashboard.stripe.com/test/logs)
- Live mode: [https://dashboard.stripe.com/logs](https://dashboard.stripe.com/logs)

## Security Best Practices

1. ✅ **Never** commit secret keys to git
2. ✅ **Use** Firebase Functions for server-side operations
3. ✅ **Validate** all inputs in Firebase Functions
4. ✅ **Use** HTTPS for all API calls (handled by Firebase)
5. ✅ **Enable** Stripe's fraud detection (Radar)
6. ✅ **Test** with test cards before going live
7. ✅ **Monitor** payments in Stripe Dashboard

## Payment Flow Summary

```
User clicks "Pay Now"
    ↓
App calls createPaymentIntent (Firebase Function)
    ↓
Firebase Function creates PaymentIntent with Stripe
    ↓
App receives clientSecret
    ↓
App shows PaymentModal with Stripe CardField
    ↓
User enters card details
    ↓
Stripe confirms payment (happens on Stripe's servers)
    ↓
App calls confirmPayment (Firebase Function)
    ↓
Firebase Function verifies payment with Stripe
    ↓
Firebase Function updates offer & creates shipment
    ↓
Success! User sees confirmation
```

## Costs

### Stripe Fees (Standard Pricing)
- **2.9% + $0.30** per successful card charge
- **No monthly fees** for standard integration
- **No setup fees**

### Firebase Costs
- **Cloud Functions**: Pay per invocation (generous free tier)
- **Firestore**: Pay per read/write (generous free tier)

**Example:**
- $100 payment = $2.90 + $0.30 = **$3.20 in Stripe fees**
- You receive: **$96.80**

## Support

- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Stripe Docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **Firebase Support**: [https://firebase.google.com/support](https://firebase.google.com/support)

## Next Steps

1. Create Stripe account ✓
2. Get API keys ✓
3. Update App.js ✓
4. Configure Firebase Functions ✓
5. Deploy functions ✓
6. Test with test cards ✓
7. Go live when ready!

---

**Happy testing! 🎉**
