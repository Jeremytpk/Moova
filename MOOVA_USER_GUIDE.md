# Moova User Guide

**Your Trusted Shipping Companion**

Welcome to Moova - the platform that connects travelers with senders to deliver packages efficiently and affordably.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [For Senders](#for-senders)
4. [For Travelers](#for-travelers)
5. [Payment System](#payment-system)
6. [Security & Safety](#security--safety)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating an Account

1. Open the Moova app
2. Tap **Sign Up** on the authentication screen
3. Enter your information:
   - **Full Name**: Your complete name
   - **Phone Number**: Contact number (with country code)
   - **Email**: Valid email address
   - **Password**: Minimum 6 characters
4. Tap **Sign Up**
5. You'll receive a confirmation and be logged in automatically

### First Login

After creating your account, you can:
- **Search for offers** (no setup required)
- **Send packages** (no setup required)
- **Become a traveler** (requires traveler account setup)

---

## User Roles

### Regular User (Sender)
- Search for travel offers
- Contact travelers
- Send packages
- Track shipments
- **No additional setup required**

### Traveler
- All sender capabilities PLUS:
- Create travel offers
- Receive payments via Zelle or CashApp
- Manage deliveries
- **Requires traveler account setup**

---

## For Senders

### How to Send a Package

#### Step 1: Find a Travel Offer

1. Go to the **Search** tab
2. Browse available travel offers
3. Filter by:
   - Origin city
   - Destination
   - Travel date
   - Price per kg

#### Step 2: Contact the Traveler

1. Tap on an offer to view details
2. Check:
   - Traveler's route
   - Travel date
   - Available capacity
   - Price per kg
3. Tap **Contact Traveler**
4. Send a message in the chat

#### Step 3: Request & Pay

1. Discuss package details with traveler
2. Traveler sends a **Payment Request** with:
   - Weight (kg)
   - Total amount
3. Tap **Pay Now**
4. Enter your payment information:
   - Full name
   - Email
   - Card details (via secure Stripe)
5. Complete payment

#### Step 4: Track Your Shipment

1. Go to **Shipments** tab
2. View your shipment details:
   - Order number
   - Verification code
   - Package weight
   - Amount paid
   - Traveler information
   - Status

#### Step 5: Receive Package

1. Meet the traveler at destination
2. Verify the package
3. Provide the **6-digit verification code** to traveler
4. Receive your package!

### Shipment Statuses

| Status | Description |
|--------|-------------|
| **Pending** | Payment received, waiting for pickup |
| **Picked Up** | Traveler has collected your package |
| **In Transit** | Traveler is traveling with your package |
| **Delivered** | Package delivered to you |

---

## For Travelers

### Becoming a Traveler

**IMPORTANT:** You must set up your traveler account with payment information **before** creating offers.

#### Step 1: Setup Traveler Account

1. Go to **Profile** tab
2. Tap **Setup Traveler Account**
3. Enter your personal information:
   - Full name
   - Phone number
4. Choose payment method:
   - **Zelle**: Enter your Zelle email (and optional phone)
   - **CashApp**: Enter your $Cashtag
5. Tap **Save & Continue**

> **Why payment info?** Senders pay via Stripe credit card, but travelers receive earnings through Zelle or CashApp.

#### Step 2: Create a Travel Offer

1. Go to **My Offers** tab
2. Tap **Create Offer** button
3. Enter travel details:
   - **Origin**: Where you're traveling from (e.g., "New York, USA")
   - **Destination**: Where you're going (default: Kinshasa)
   - **Travel Date**: When you're traveling
   - **Price per Kg**: How much you charge per kilogram (in USD)
   - **Available Capacity**: How many kg you can carry
4. Tap **Create Offer**
5. Your offer is now live!

### Managing Offers

#### View Your Offers

1. Go to **My Offers** tab
2. See all your offers with:
   - Route (origin → destination)
   - Date
   - Capacity (available/total)
   - Earnings
   - Status (Active/Expired)

#### Edit an Offer

1. In **My Offers**, tap the **Edit** icon (pencil)
2. Update details
3. Tap **Update Offer**

#### Delete an Offer

1. In **My Offers**, tap the **Delete** icon (trash)
2. Confirm deletion
3. Offer is removed

### Accepting Deliveries

#### Step 1: Receive Booking Requests

1. Senders will message you in **Chats** tab
2. Discuss package details:
   - Weight
   - Contents (ensure it's legal/allowed)
   - Pickup/delivery location

#### Step 2: Send Payment Request

1. In the chat, tap **Create Payment Request** button
2. Enter:
   - Weight (kg)
   - Price automatically calculated based on your offer
3. Tap **Send Request**
4. Sender receives payment request

#### Step 3: Receive Payment

1. Sender pays via credit card (Stripe)
2. Payment is processed instantly
3. You see the shipment in **My Deliveries**
4. **Earnings are tracked** in your offer

> **Note:** Money from senders goes to Stripe first, then will be sent to your Zelle/CashApp account within 2-3 business days.

#### Step 4: Pickup Package

1. Go to **My Deliveries** tab
2. View shipment details
3. Contact sender to arrange pickup
4. Update status to **Picked Up**

#### Step 5: Deliver Package

1. Travel to destination
2. Contact recipient (sender or their contact)
3. **Ask for 6-digit verification code**
4. Enter code to confirm delivery
5. Update status to **Delivered**

### Traveler Earnings

**How You Get Paid:**

```
Sender pays with card → Stripe processes → Your Zelle/CashApp receives funds
```

**Payment Timeline:**
- Sender pays instantly via Stripe
- Funds released to your Zelle/CashApp: **2-3 business days**
- Track total earnings in **My Offers** screen

**Example:**
- Offer: $10/kg, 5kg capacity
- Sender books 3kg
- You earn: **$30**
- Sender pays $30 via card
- You receive $30 to your Zelle/CashApp

---

## Payment System

### For Senders: Stripe Credit Card

**Accepted Cards:**
- Visa
- Mastercard
- American Express
- Discover

**Payment Process:**
1. Traveler sends payment request
2. You tap "Pay Now"
3. Enter card details in secure form
4. Stripe processes payment
5. Instant confirmation

**Security:**
- PCI-compliant (highest security standard)
- Card details never stored in Moova
- 3D Secure authentication when needed

### For Travelers: Zelle or CashApp

**Why Zelle/CashApp?**
- Fast transfers
- No fees
- Direct to your bank/account
- Widely used in USA and Africa

**Setting Up:**

#### Zelle
1. Download Zelle app or use your bank's app
2. Register with your email or phone
3. Link your bank account
4. Use the **same email** in Moova traveler setup

#### CashApp
1. Download CashApp
2. Create account and get your $Cashtag
3. Link debit card or bank
4. Use your **$Cashtag** in Moova traveler setup

**Receiving Payments:**
- Moova processes transfers within 2-3 business days
- You'll receive notification in Zelle/CashApp
- Money goes directly to your account

---

## Security & Safety

### Package Safety

**Do NOT accept:**
- ❌ Illegal items (drugs, weapons, etc.)
- ❌ Hazardous materials
- ❌ Unsealed or suspicious packages
- ❌ Items over airline weight limits

**Always:**
- ✅ Ask about package contents
- ✅ Inspect packages before accepting
- ✅ Follow airline regulations
- ✅ Get travel insurance

### Personal Safety

**For Senders:**
- ✅ Read traveler reviews (when available)
- ✅ Communicate through Moova chat
- ✅ Never send personal documents (passports, IDs)
- ✅ Use verification code when receiving

**For Travelers:**
- ✅ Meet in public places
- ✅ Don't share personal address
- ✅ Verify sender identity
- ✅ Use verification code for delivery

### Payment Security

**For Senders:**
- Your card info is encrypted
- Never share card details in chat
- Only pay through Moova's payment system

**For Travelers:**
- Never share Zelle/CashApp passwords
- Verify payments before traveling
- Track all earnings in the app

### Verification Codes

**6-Digit Codes:**
- Generated when sender pays
- Shared with traveler only
- Required to confirm delivery
- **Never share with strangers**

**How to Use:**
```
Sender → Shows code to traveler in person
Traveler → Enters code in app
System → Confirms delivery
```

---

## App Features

### Search Tab
- Browse all available travel offers
- Filter by route, date, price
- View traveler details
- Contact travelers

### My Offers Tab (Travelers Only)
- Create new offers
- View active/expired offers
- Track total earnings
- Edit/delete offers
- Access deliveries

### Chats Tab
- Message travelers/senders
- Send/receive payment requests
- Discuss package details
- Share pickup/delivery info

### Shipments Tab (Senders)
- View all your shipments
- Track delivery status
- See verification codes
- View package details

### Profile Tab
- Edit profile
- Setup traveler account
- Manage payment info
- View account status
- Language settings (English/French)
- Share app
- Sign out

---

## Troubleshooting

### Common Issues

#### "Cannot create offer"
**Problem:** You're not set up as a traveler

**Solution:**
1. Go to Profile → Setup Traveler Account
2. Enter payment information (Zelle or CashApp)
3. Save and try again

#### "Payment failed"
**Problem:** Card declined or network issue

**Solution:**
1. Check card details are correct
2. Ensure sufficient funds
3. Try a different card
4. Check internet connection

#### "Can't find my shipment"
**Problem:** Not showing in Shipments tab

**Solution:**
1. Pull down to refresh
2. Check you're logged in to correct account
3. Verify payment was successful
4. Contact traveler in Chats

#### "Didn't receive payment"
**Problem:** Traveler hasn't received money

**Solution:**
1. Wait 2-3 business days after sender pays
2. Check Zelle/CashApp email/tag is correct
3. Verify payment in My Offers → Total Earnings
4. Contact support if still not received

#### "Verification code not working"
**Problem:** Code rejected

**Solution:**
1. Double-check all 6 digits
2. Ensure sender gives you the correct code
3. Code is case-sensitive
4. Try refreshing the app

### Getting Help

**In-App Support:**
- Email: support@moova.com (example)
- Report issues on GitHub: https://github.com/anthropics/moova

**Community:**
- Share the app with friends
- Leave feedback for improvements

---

## Tips for Success

### For Senders

1. **Compare prices** - Check multiple offers
2. **Book early** - Popular routes fill up fast
3. **Communicate clearly** - Specify package details
4. **Be punctual** - Meet traveler on time
5. **Rate travelers** - Help others make decisions

### For Travelers

1. **Update capacity** - Keep available kg accurate
2. **Respond quickly** - Reply to messages fast
3. **Be reliable** - Honor your commitments
4. **Safe packaging** - Ask senders to package well
5. **Track earnings** - Monitor your income

---

## Frequently Asked Questions

### General

**Q: Is Moova free to use?**
A: Yes! No fees for senders or travelers. Travelers set their own prices.

**Q: What languages does Moova support?**
A: English and French (toggle in Profile)

**Q: Do I need an account to browse offers?**
A: No, you can browse as a guest. Account needed to contact travelers or send packages.

### For Senders

**Q: When do I pay?**
A: When traveler sends payment request and you approve.

**Q: Can I get a refund?**
A: Contact traveler immediately if there's an issue. Refund policies vary.

**Q: What if my package is lost?**
A: Contact the traveler through chat. Consider travel insurance.

**Q: How much can I send?**
A: Depends on traveler's available capacity and airline limits.

### For Travelers

**Q: When do I get paid?**
A: Funds transferred to Zelle/CashApp within 2-3 business days after sender pays.

**Q: Can I carry for free?**
A: Yes, you set your price (can be $0/kg if you want).

**Q: What if sender doesn't show up?**
A: Keep the payment as compensation for your time. Update shipment status.

**Q: How many packages can I accept?**
A: Up to your stated capacity in kg.

**Q: Do I need business insurance?**
A: Recommended. Check with your insurance provider.

---

## Legal & Compliance

### Prohibited Items

**Never transport:**
- Weapons or explosives
- Illegal drugs or substances
- Counterfeit goods
- Human remains
- Live animals
- Perishable food (unless properly packed)

### Customs & Regulations

**Travelers must:**
- Declare all packages at customs
- Follow import/export laws
- Pay applicable duties/taxes
- Keep receipts and documentation

**Senders must:**
- Provide accurate package descriptions
- Comply with destination country laws
- Not send prohibited items

### Terms of Service

By using Moova, you agree to:
- Provide accurate information
- Follow local laws and regulations
- Not misuse the platform
- Respect other users
- Accept liability for your packages/deliveries

---

## Version History

**Version 1.0.0** - Initial Release
- User registration and authentication
- Travel offer creation
- Package booking system
- Stripe payment integration
- Chat messaging
- Delivery tracking
- Multi-language support (EN/FR)

---

## Contact & Support

**Website:** https://moovacongo.netlify.app

**Email:** support@moova.com

**GitHub:** https://github.com/anthropics/moova

**Powered by:** Jerttech

---

**Thank you for using Moova! 🚀📦✈️**

*Making global shipping simple, one journey at a time.*
