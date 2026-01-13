# Moova Logistics Platform

A peer-to-peer logistics app connecting travelers with people who need to send packages to Kinshasa, DRC.

## 🚀 Tech Stack

- **Framework**: Expo React Native (JavaScript/ES6)
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Navigation**: React Navigation 6
- **UI**: Professional/Minimalist Design System

## 🎨 Brand Colors

- **Primary Blue**: `#2563EB`
- **Success Green**: `#10B981`
- **Warning Amber**: `#F59E0B`
- **Text Navy**: `#111827`

## 📋 Project Structure

```
moova/
├── App.js                          # Main app entry with navigation
├── src/
│   ├── theme.js                    # Brand colors and design system
│   ├── config/
│   │   └── firebaseConfig.js       # Firebase initialization
│   ├── components/
│   │   ├── Button.js               # Reusable button component
│   │   ├── Card.js                 # Card container component
│   │   └── Input.js                # Themed input component
│   └── screens/
│       ├── SearchResultsScreen.js  # Browse shipment offers (Guest Mode ✓)
│       ├── OfferDetailsScreen.js   # View offer details (Guest Mode ✓)
│       ├── AuthFlowScreen.js       # Sign In/Sign Up
│       ├── CreateOfferScreen.js    # Create new offer (Auth required)
│       ├── MyOffersScreen.js       # Traveler's offers
│       ├── MyShipmentsScreen.js    # Sender's shipments
│       └── ProfileScreen.js        # User profile
```

## 💰 Fee & Payout Logic

Every transaction follows this model:

- **Sender Total**: `AskingPrice + (AskingPrice × 0.11)` (11% platform fee)
- **Offerer Net**: `AskingPrice - (AskingPrice × 0.05)` (5% commission)
- **Escrow Split (40/60)**:
  - Milestone 1 (Pickup): 40% released to traveler
  - Milestone 2 (Delivery): 60% released upon passcode verification

## 🗄️ Database Schema (Firestore)

### Collections

**offers**
```javascript
{
  origin: String,
  destination: String,
  date: Timestamp,
  pricePerKg: Number,
  offererId: String,
  status: String, // 'active', 'completed', 'cancelled'
  availableCapacity: Number
}
```

**shipments**
```javascript
{
  senderId: String,
  offererId: String,
  weight: Number,
  totalPaid: Number,
  offererEarnings: Number,
  status: String, // 'pending', 'picked_up', 'delivered'
  hashedPasscode: String
}
```

**chats** (sub-collection under shipments)
- Auto-masks phone numbers, emails, payment IDs (Venmo, CashApp)

## 🔐 Security Features

### Prohibited Items Checklist
- Flammables
- Illegal drugs
- Loose lithium batteries
- Cash/currency

### Anti-Leakage Measures
- Copy/paste disabled in chat
- Regex detection for contact information
- Automatic masking of sensitive data

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Update `src/config/firebaseConfig.js` with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Start Development Server

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## ✨ Key Features

### Guest Mode ✓
- Browse shipment offers without authentication
- View offer details
- Authentication triggered only when:
  - Contacting a traveler
  - Creating an offer
  - Accessing profile features

### The Bridge Tracker 🌉
Visual progress tracker shaped like the "M" logo:
- Origin → Pickup → In Transit → Delivery → Kinshasa

### Passcode Handshake 🤝
1. Sender generates 6-digit code
2. Offerer enters code at delivery
3. Match triggers:
   - Status update to `delivered`
   - Final 60% payout release

## 🚧 TODO

### Next Steps
1. Implement Firebase Cloud Functions for:
   - Fee calculations
   - Escrow management
   - Payout automation
2. Build Bridge Tracker component
3. Implement chat with regex masking
4. Add prohibited items checklist
5. Create passcode handshake flow
6. Implement payment integration

### Future Enhancements
- Push notifications
- In-app messaging
- Rating system
- Dispute resolution
- Multi-language support (French, Lingala)

## 📱 Screen Flow

```
SearchResults (Guest ✓)
  → OfferDetails (Guest ✓)
    → AuthFlow (Modal) → Contact
  → CreateOffer (Auth Required)

Authenticated:
  MainTabs
    ├── Search
    ├── My Offers
    ├── Shipments (Bridge Tracker)
    └── Profile
```

## 🔒 Environment Variables

Create a `.env` file (not committed to git):

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

## 📄 License

Proprietary - Jerttech © 2026

---

Built with ❤️ for the Congolese diaspora
