# Onboarding and Legal Pages Implementation

## Overview

Added comprehensive onboarding flow and legal pages (Privacy Policy & Terms & Conditions) to the Moova app. The implementation includes:
- Swipable onboarding screens shown on first launch
- Privacy Policy screen accessible to all users
- Terms & Conditions screen accessible to all users
- Updated ProfileScreen to show legal links and login/signup for non-authenticated users

## New Screens

### 1. OnboardingScreen ([src/screens/OnboardingScreen.js](src/screens/OnboardingScreen.js))

**Purpose**: First-time user onboarding with swipable slides

**Features**:
- 5 beautiful swipable slides explaining the app
- Animated pagination dots
- Skip button to bypass onboarding
- Next/Get Started button
- Saves completion status to AsyncStorage
- Multi-language support (English/French)

**Slides**:
1. **Welcome to Moova** - Introduction to the platform
2. **For Travelers** - Create offers and earn money
3. **Set Your Price** - Travelers receive 92% of base price
4. **For Senders** - Search and send packages safely
5. **Secure Payments** - 60/40 payment split with Stripe

**User Flow**:
- Shows on first app launch
- User can swipe through slides or skip
- Clicking "Get Started" saves completion and navigates to main app
- Never shows again unless app data is cleared

### 2. PrivacyPolicyScreen ([src/screens/PrivacyPolicyScreen.js](src/screens/PrivacyPolicyScreen.js))

**Purpose**: Display privacy policy for the Moova app

**Content Sections** (10 sections):
1. Information We Collect
2. How We Use Your Information
3. Information Sharing
4. Payment Information
5. Data Security
6. Your Rights
7. Data Retention
8. Children's Privacy
9. Changes to This Policy
10. Contact Us

**Features**:
- Scrollable full content
- Multi-language support (EN/FR)
- Always accessible from ProfileScreen
- Professional legal formatting
- Last updated date displayed

### 3. TermsConditionsScreen ([src/screens/TermsConditionsScreen.js](src/screens/TermsConditionsScreen.js))

**Purpose**: Display terms and conditions for using the Moova app

**Content Sections** (15 sections):
1. Acceptance of Terms
2. Eligibility
3. User Accounts
4. Traveler Responsibilities
5. Sender Responsibilities
6. Payments and Fees
7. Prohibited Items
8. Liability and Disclaimers
9. Limitation of Liability
10. Dispute Resolution
11. Intellectual Property
12. Privacy
13. Termination
14. Changes to Terms
15. Contact Information

**Features**:
- Scrollable full content
- Multi-language support (EN/FR)
- Always accessible from ProfileScreen
- Professional legal formatting
- Last updated date displayed

## Updated Components

### ProfileScreen Updates ([src/screens/ProfileScreen.js](src/screens/ProfileScreen.js))

**Changes**:

1. **Non-Authenticated User Support**:
   - Shows "Not Logged In" profile card
   - Sign In and Sign Up buttons
   - Redirects to AuthFlow screen

2. **Legal Section** (Always visible):
   - Privacy Policy link with lock icon 🔒
   - Terms & Conditions link with document icon 📄
   - Available to all users (logged in or not)

3. **Conditional Rendering**:
   - Account info only shown when logged in
   - Traveler setup only shown when logged in
   - Sign Out button only shown when logged in
   - Quick Actions available to all

**New Translations**:
- `legal`: "Legal" / "Légal"
- `privacyPolicy`: "Privacy Policy" / "Politique de Confidentialité"
- `termsConditions`: "Terms & Conditions" / "Conditions Générales"
- `notLoggedIn`: "Not Logged In" / "Non Connecté"
- `signIn`: "Sign In" / "Se Connecter"
- `signUp`: "Sign Up" / "S'inscrire"
- `signInDescription`: Description text for non-authenticated users

**New Styles**:
- `authButtons`: Container for sign in/up buttons
- `signInButton`: Primary button style
- `signInButtonText`: Primary button text style
- `signUpButton`: Outlined button style
- `signUpButtonText`: Outlined button text style
- `legalIcon`: Icon styling for legal links

## Navigation Updates ([App.js](App.js))

### New Routes Added:

1. **PrivacyPolicy**:
   - Path: `PrivacyPolicy`
   - Component: `PrivacyPolicyScreen`
   - Accessible: Always (no auth required)
   - Header: Shows with translated title

2. **TermsConditions**:
   - Path: `TermsConditions`
   - Component: `TermsConditionsScreen`
   - Accessible: Always (no auth required)
   - Header: Shows with translated title

3. **Onboarding**:
   - Path: `Onboarding`
   - Component: `OnboardingScreen`
   - Accessible: First launch only
   - Header: Hidden

### Profile Tab Update:
- Changed from requiring authentication to always accessible
- Now shows different content based on auth state
- Non-authenticated users see login buttons and legal links

### Onboarding Flow:

**Implementation**:
```javascript
// Check onboarding status on app start
const onboardingComplete = await AsyncStorage.getItem('@onboarding_complete');

if (!onboardingComplete) {
  // Show onboarding screen
  setShowOnboarding(true);
}
```

**Flow**:
1. App checks AsyncStorage for `@onboarding_complete`
2. If not found, shows OnboardingScreen
3. User completes or skips onboarding
4. Status saved to AsyncStorage
5. Navigate to main app (MainTabs)
6. Never shows again unless app data cleared

## Dependencies

**Required packages** (already installed):
- `@react-native-async-storage/async-storage` - For onboarding status persistence
- `@react-navigation/native` - Navigation framework
- `@react-navigation/native-stack` - Stack navigator
- `react-native` - Core RN components

## File Structure

```
src/
├── screens/
│   ├── OnboardingScreen.js           ✨ NEW - Swipable onboarding
│   ├── PrivacyPolicyScreen.js        ✨ NEW - Privacy policy
│   ├── TermsConditionsScreen.js      ✨ NEW - Terms & conditions
│   └── ProfileScreen.js              📝 UPDATED - Legal links + auth buttons
App.js                                 📝 UPDATED - New routes + onboarding check
```

## Testing Checklist

### Onboarding:
- [ ] Shows on first app launch
- [ ] Can swipe through all 5 slides
- [ ] Pagination dots animate correctly
- [ ] Skip button bypasses onboarding
- [ ] Next button advances slides
- [ ] Get Started button on last slide
- [ ] Saves completion status
- [ ] Never shows again after completion
- [ ] Works in both English and French

### Privacy Policy:
- [ ] Accessible from ProfileScreen
- [ ] All 10 sections display correctly
- [ ] Scrollable content
- [ ] Back button works
- [ ] English version correct
- [ ] French version correct
- [ ] Available when logged out
- [ ] Available when logged in

### Terms & Conditions:
- [ ] Accessible from ProfileScreen
- [ ] All 15 sections display correctly
- [ ] Scrollable content
- [ ] Back button works
- [ ] English version correct
- [ ] French version correct
- [ ] Available when logged out
- [ ] Available when logged in

### ProfileScreen Updates:
- [ ] Legal section always visible
- [ ] Privacy Policy link navigates correctly
- [ ] Terms link navigates correctly
- [ ] Non-auth users see "Not Logged In" card
- [ ] Non-auth users see Sign In/Sign Up buttons
- [ ] Buttons navigate to AuthFlow
- [ ] Account info hidden when not logged in
- [ ] Quick Actions visible to all
- [ ] Sign Out only shows when logged in
- [ ] Language switcher works for all

## User Experience

### First Time Launch:
1. User opens app for first time
2. Sees OnboardingScreen with 5 slides
3. Can swipe, skip, or proceed through slides
4. Clicks "Get Started" on last slide
5. Navigates to main app
6. Onboarding never shows again

### Accessing Legal Pages:
1. User navigates to Profile tab (no login required)
2. Scrolls to "Legal" section
3. Taps "Privacy Policy" or "Terms & Conditions"
4. Reads full legal content
5. Taps back to return to Profile

### Non-Authenticated User Experience:
1. User opens app (after onboarding)
2. Can browse Search tab freely
3. Taps Profile tab
4. Sees "Not Logged In" profile card
5. Can tap "Sign In" or "Sign Up"
6. Redirected to AuthFlow
7. Can access Legal links anytime

## Content Customization

### To Update Legal Content:

**Privacy Policy**:
Edit `src/screens/PrivacyPolicyScreen.js`:
- Update `content.en.sections` for English
- Update `content.fr.sections` for French
- Update `lastUpdated` date

**Terms & Conditions**:
Edit `src/screens/TermsConditionsScreen.js`:
- Update `content.en.sections` for English
- Update `content.fr.sections` for French
- Update `lastUpdated` date

**Onboarding Slides**:
Edit `src/screens/OnboardingScreen.js`:
- Modify `slides` array
- Update `titleEN`, `titleFR`, `descriptionEN`, `descriptionFR`
- Change icons and colors

## Future Enhancements

### Optional Features:
1. **Onboarding Analytics**:
   - Track which slide users exit from
   - Measure completion rates
   - A/B test different content

2. **Legal Updates Notification**:
   - Notify users when legal docs are updated
   - Require re-acceptance of terms
   - Track acceptance history

3. **In-App Legal Viewer**:
   - Add PDF export of legal documents
   - Add print functionality
   - Email legal docs to user

4. **Onboarding Customization**:
   - Show different onboarding for travelers vs senders
   - Personalized onboarding based on user interests
   - Video tutorials instead of static slides

5. **~~Reset Onboarding~~**: ✅ IMPLEMENTED
   - ✅ Users can view onboarding again from Profile
   - ✅ "View Tutorial" button in Quick Actions

## Language Selection Update

### New: LanguageSelectionScreen ([src/screens/LanguageSelectionScreen.js](src/screens/LanguageSelectionScreen.js))

**Purpose**: First screen for new users to choose their preferred language

**Features**:
- Beautiful UI with country flags (🇬🇧 🇫🇷)
- Bilingual labels for accessibility
- Saves to `@app_language` in AsyncStorage
- Updates LanguageContext immediately
- Auto-navigates to onboarding

**First Launch Flow**:
```
1. App opens → LanguageSelection
2. User taps English or Français
3. Language saved & context updated
4. Navigate to Onboarding (in selected language)
5. Complete onboarding
6. Never see LanguageSelection again
```

### Updated: LanguageContext ([src/contexts/LanguageContext.js](src/contexts/LanguageContext.js))

**New Features**:
- `isLoading` state for initial load
- Auto-loads saved language from AsyncStorage on mount
- `toggleLanguage()` now saves to AsyncStorage
- `updateLanguage()` function for programmatic updates
- Language persists across app restarts

### Updated: OnboardingScreen

**Smart Navigation**:
- Detects if accessed from Profile or first launch
- First launch: `navigation.replace('MainTabs')`
- From Profile: `navigation.goBack()`
- Always saves completion status

### Updated: ProfileScreen

**New "View Tutorial" Button**:
- Location: Quick Actions section
- Icon: 📚
- Accessible to all users
- Re-opens onboarding as modal
- Translations: "View Tutorial" / "Voir le Tutoriel"

### Updated: App.js

**New Navigation Flow**:
- LanguageSelection added before Onboarding
- Both accessible in first-launch stack
- Onboarding also in main navigator for re-access

## Storage Keys

| Key | Purpose | Values | Set By |
|-----|---------|--------|--------|
| `@app_language` | User's preferred language | 'en' \| 'fr' | LanguageSelectionScreen, LanguageContext |
| `@onboarding_complete` | Onboarding done | 'true' \| null | OnboardingScreen |

## Complete User Flows

### First Time User:
1. Open app
2. **LanguageSelection** screen appears
3. Tap 🇬🇧 English or 🇫🇷 Français
4. Language saved to AsyncStorage
5. **Onboarding** appears in chosen language
6. Swipe through 5 slides or skip
7. Tap "Get Started"
8. Navigate to **MainTabs**
9. All app content in chosen language

### Returning User:
1. Open app
2. Language loaded from AsyncStorage
3. Skip directly to **MainTabs**
4. Content in saved language

### View Tutorial Later:
1. Go to **Profile** tab
2. Scroll to Quick Actions
3. Tap **"View Tutorial"** button
4. Onboarding opens as modal
5. Complete or skip
6. Return to Profile

### Change Language:
1. Go to Profile → Quick Actions
2. Tap **Language** toggle
3. Switches EN ↔ FR
4. Saves to AsyncStorage
5. Entire app updates
6. Persists on restart

## Status

✅ **Fully Implemented**
- ✅ Language selection screen before onboarding
- ✅ Language preference persistence with AsyncStorage
- ✅ Onboarding screen with 5 swipable slides
- ✅ Privacy Policy screen with complete content
- ✅ Terms & Conditions screen with complete content
- ✅ ProfileScreen updated with legal links
- ✅ "View Tutorial" option to re-access onboarding
- ✅ Navigation routes configured
- ✅ AsyncStorage persistence for language and onboarding
- ✅ Multi-language support (EN/FR) with full persistence
- ✅ Non-authenticated user support in Profile

**Last Updated**: 2026-01-15

**Implementation Time**: ~3 hours

**Files Changed**: 6 files
- App.js
- LanguageContext.js
- OnboardingScreen.js
- ProfileScreen.js
- (Plus Privacy & Terms screens)

**Files Created**: 5 files
- LanguageSelectionScreen.js
- OnboardingScreen.js
- PrivacyPolicyScreen.js
- TermsConditionsScreen.js
- ONBOARDING_LEGAL_IMPLEMENTATION.md

**Lines Added**: ~1,500 lines
