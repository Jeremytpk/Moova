import ProfileDetailsScreen from './src/screens/ProfileDetailsScreen';
import AdminScreen from './src/screens/AdminScreen';
import AdminBannersScreen from './src/screens/AdminBannersScreen';
import UserDetailsScreen from './src/screens/UserDetailsScreen';
import UserOffersScreen from './src/screens/UserOffersScreen';
import UserShipmentsScreen from './src/screens/UserShipmentsScreen';
import UserPayoutsScreen from './src/screens/UserPayoutsScreen';
import ContactUs from './src/screens/ContactUs';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, flushNavigationQueue, navigate } from './src/RootNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './src/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import theme from './src/theme';
import { ProfileIcon, SearchIcon, PackageIcon, ShipmentIcon, ChatIcon } from './src/components/Icons';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { UnreadMessagesProvider } from './src/contexts/UnreadMessagesContext';
import { registerForPushNotifications, addNotificationResponseListener } from './src/utils/pushNotifications';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useUnreadMessages } from './src/contexts/UnreadMessagesContext';

// Conditionally import Stripe providers
let StripeProvider;
let Elements, loadStripe;
if (Platform.OS !== 'web') {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} else {
  Elements = require('@stripe/react-stripe-js').Elements;
  loadStripe = require('@stripe/stripe-js').loadStripe;
}

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SpgpJPoKtwC5G8hPwrhXSAKBUemKSO5pG8iH9QwJMzxDakddHeZXZLouBdijEJNIehlzMSNvJSwmMheGyuwTaIl001Pxs2qIp';
const stripePromise = Platform.OS === 'web' ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Screens
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import OfferDetailsScreen from './src/screens/OfferDetailsScreen';
import CreateOfferScreen from './src/screens/CreateOfferScreen';
import AuthFlowScreen from './src/screens/AuthFlowScreen';
import MyOffersScreen from './src/screens/MyOffersScreen';
import MyShipmentsScreen from './src/screens/MyShipmentsScreen';
import TravelerDeliveriesScreen from './src/screens/TravelerDeliveriesScreen';
import TravelerSetupScreen from './src/screens/TravelerSetupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatsListScreen from './src/screens/ChatsListScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsConditionsScreen from './src/screens/TermsConditionsScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import TravelerReviewsScreen from './src/screens/TravelerReviewsScreen';
import MoovaWebsiteScreen from './src/screens/MoovaWebsiteScreen';
import DeactivatedAccountScreen from './src/screens/DeactivatedAccountScreen';
import HowItWorksSenderScreen from './src/screens/HowItWorksSenderScreen';
import HowItWorksTravelerScreen from './src/screens/HowItWorksTravelerScreen';
import HowItWorksScreen from './src/screens/HowItWorksScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const [user, setUser] = useState(null);
  const [isTraveler, setIsTraveler] = useState(false);
  const { language } = useLanguage();
  const { unreadCount } = useUnreadMessages();

  const tabLabels = {
    en: { search: 'Search', myOffers: 'My Offers', chats: 'Chats', shipments: 'Shipments', profile: 'Profile' },
    fr: { search: 'Rechercher', myOffers: 'Mes Offres', chats: 'Discussions', shipments: 'Envois', profile: 'Profil' },
  };
  const labels = tabLabels[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          setIsTraveler(!!userDoc.data()?.isTraveler);
        } catch (e) { setIsTraveler(false); }
      } else { setIsTraveler(false); }
    });
    return unsubscribe;
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen name="Search" component={SearchResultsScreen} options={{ tabBarLabel: labels.search, tabBarIcon: () => <SearchIcon size={24} /> }} />
      {user && isTraveler && (
        <Tab.Screen name="MyOffers" component={MyOffersScreen} options={{ tabBarLabel: labels.myOffers, tabBarIcon: () => <PackageIcon size={24} /> }} />
      )}
      <Tab.Screen name="Chats" component={user ? ChatsListScreen : AuthFlowScreen} options={{ tabBarLabel: labels.chats, tabBarBadge: unreadCount > 0 ? unreadCount : undefined, tabBarIcon: ({focused}) => <ChatIcon size={24} color={focused ? theme.colors.primary : theme.colors.textSecondary} /> }} />
      <Tab.Screen name="MyShipments" component={user ? MyShipmentsScreen : AuthFlowScreen} options={{ tabBarLabel: labels.shipments, tabBarIcon: () => <ShipmentIcon size={24} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: labels.profile, tabBarIcon: ({focused}) => <ProfileIcon size={24} color={focused ? theme.colors.primary : theme.colors.textSecondary} /> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { language } = useLanguage();
  const localNavigationRef = React.useRef();

  const headerTitles = {
    en: { offerDetails: 'Offer Details', chat: 'Chat', signIn: 'Sign In', createOffer: 'Create New Offer', setupTraveler: 'Traveler Setup', reviews: 'Reviews', privacyPolicy: 'Privacy Policy', termsConditions: 'Terms & Conditions', aboutMoova: 'About Moova', howItWorks: 'How It Works', howItWorksSender: 'How to Send', howItWorksTraveler: 'How to Earn' },
    fr: { offerDetails: 'Détails de l\'Offre', chat: 'Discussion', signIn: 'Se Connecter', createOffer: 'Créer une Nouvelle Offre', setupTraveler: 'Configuration Voyageur', reviews: 'Avis', privacyPolicy: 'Politique de Confidentialité', termsConditions: 'Conditions Générales', aboutMoova: 'À propos de Moova', howItWorks: 'Comment Ça Marche', howItWorksSender: 'Comment Envoyer', howItWorksTraveler: 'Comment Gagner' },
  };
  const titles = headerTitles[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          setIsAdmin(!!userDoc.data()?.isAdmin);
          registerForPushNotifications(currentUser.uid);
        } catch (e) { setIsAdmin(false); }
      } else { setIsAdmin(false); }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const db = getFirestore();
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      const userData = doc.data();
      const currentRoute = navigationRef.current?.getCurrentRoute()?.name;

      if (userData?.isDeactivated) {
        if (currentRoute !== 'DeactivatedAccountScreen') {
          navigate('DeactivatedAccountScreen');
        }
      } else {
        if (currentRoute === 'DeactivatedAccountScreen') {
          navigate('MainTabs');
        }
      }
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    // Skip on web - notifications don't work on web
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;

      if (localNavigationRef.current) {
        if (data.type === 'new_offer' && data.offerId) {
          // Navigate to offer details
          localNavigationRef.current.navigate('OfferDetails', {
            offerId: data.offerId,
          });
        } else if (data.type === 'new_message' && data.chatId) {
          // Navigate to chat
          localNavigationRef.current.navigate('Chat', {
            chatId: data.chatId,
            otherUserId: data.otherUserId,
            otherUserName: data.otherUserName,
            offerId: data.offerId,
          });
        } else if (data.type === 'new_review' && data.travelerId) {
          // Navigate to traveler reviews
          localNavigationRef.current.navigate('TravelerReviews', {
            travelerId: data.travelerId,
          });
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef} onReady={() => { localNavigationRef.current = navigationRef.current; flushNavigationQueue(); }}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text, headerBackTitleVisible: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        
        {/* AuthFlow is now always registered at the root level */}
        <Stack.Screen name="AuthFlow" component={AuthFlowScreen} options={{ title: titles.signIn, presentation: 'modal' }} />

        {isAdmin && (
          <>
            <Stack.Screen name="AdminScreen" component={AdminScreen} options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ title: 'User Details' }} />
            <Stack.Screen name="UserOffers" component={UserOffersScreen} options={{ title: 'User Offers' }} />
            <Stack.Screen name="UserShipments" component={UserShipmentsScreen} options={{ title: 'User Shipments' }} />
            <Stack.Screen name="UserPayouts" component={UserPayoutsScreen} options={{ title: 'User Payouts' }} />
            <Stack.Screen name="AdminBanners" component={AdminBannersScreen} options={{ title: 'Manage Banners' }} />
          </>
        )}
        <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} options={{ title: titles.offerDetails }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: titles.chat }} />
        <Stack.Screen name="TravelerSetup" component={TravelerSetupScreen} options={{ title: titles.setupTraveler }} />
        
        {user && (
          <>
            <Stack.Screen name="CreateOffer" component={CreateOfferScreen} options={{ title: titles.createOffer, presentation: 'modal' }} />
            <Stack.Screen name="TravelerDeliveries" component={TravelerDeliveriesScreen} options={{ title: "" }} />
          </>
        )}
        
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: titles.privacyPolicy }} />
        <Stack.Screen name="ContactUs" component={ContactUs} options={{ title: 'Contact Us' }} />
        <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} options={{ title: titles.termsConditions }} />
        <Stack.Screen name="HowItWorks" component={HowItWorksScreen} options={{ title: titles.howItWorks }} />
        <Stack.Screen name="HowItWorksSender" component={HowItWorksSenderScreen} options={{ title: titles.howItWorksSender }} />
        <Stack.Screen name="HowItWorksTraveler" component={HowItWorksTravelerScreen} options={{ title: titles.howItWorksTraveler }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileDetailsScreen" component={ProfileDetailsScreen} options={{ title: 'Profile Details' }} />
        <Stack.Screen name="TravelerReviews" component={TravelerReviewsScreen} options={{ title: titles.reviews }} />
        <Stack.Screen name="MoovaWebsite" component={MoovaWebsiteScreen} options={{ title: titles.aboutMoova }} />
        <Stack.Screen name="DeactivatedAccountScreen" component={DeactivatedAccountScreen} options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const onboardingComplete = await AsyncStorage.getItem('@onboarding_complete');
        if (!onboardingComplete) setShowOnboarding(true);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingScreen />;

  const AppContent = ({ children }) => (
    Platform.OS === 'web' 
      ? <Elements stripe={stripePromise}>{children}</Elements> 
      : <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>{children}</StripeProvider>
  );

  return (
    <AppContent>
      <LanguageProvider>
        <UnreadMessagesProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </UnreadMessagesProvider>
      </LanguageProvider>
    </AppContent>
  );
}