
import ProfileDetailsScreen from './src/screens/ProfileDetailsScreen';
import AdminScreen from './src/screens/AdminScreen';
import ContactUs from './src/screens/ContactUs';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/RootNavigation';
// Debug: Log when NavigationContainer is mounted and ref is set
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

// Conditionally import Stripe providers based on platform
let StripeProvider;
let Elements, loadStripe;
if (Platform.OS !== 'web') {
  StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
} else {
  Elements = require('@stripe/react-stripe-js').Elements;
  loadStripe = require('@stripe/stripe-js').loadStripe;
}

// Stripe Publishable Key - Live Mode
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SpgpJPoKtwC5G8hPwrhXSAKBUemKSO5pG8iH9QwJMzxDakddHeZXZLouBdijEJNIehlzMSNvJSwmMheGyuwTaIl001Pxs2qIp';

// Initialize Stripe for web
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Main Tab Navigator for all users (guest and authenticated)
 * Guest users can see Search, but need to sign in for other features
 */

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useUnreadMessages } from './src/contexts/UnreadMessagesContext';

function MainTabs() {
  const [user, setUser] = useState(null);
  const [isTraveler, setIsTraveler] = useState(false);
  const { language } = useLanguage();
  const { unreadCount } = useUnreadMessages();

  // Debug: Log unreadCount changes
  useEffect(() => {
    console.log('MainTabs: Unread count changed to:', unreadCount);
  }, [unreadCount]);

  // Tab labels translations
  const tabLabels = {
    en: {
      search: 'Search',
      myOffers: 'My Offers',
      chats: 'Chats',
      shipments: 'Shipments',
      profile: 'Profile',
    },
    fr: {
      search: 'Rechercher',
      myOffers: 'Mes Offres',
      chats: 'Discussions',
      shipments: 'Envois',
      profile: 'Profil',
    },
  };

  const labels = tabLabels[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setIsTraveler(!!userDoc.data().isTraveler);
          } else {
            setIsTraveler(false);
          }
        } catch (e) {
          setIsTraveler(false);
        }
      } else {
        setIsTraveler(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          elevation: 8,
          shadowOpacity: 0.1,
        },
      }}
    >
      <Tab.Screen 
        name="Search" 
        component={SearchResultsScreen}
        options={{
          tabBarLabel: labels.search,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.6 }}>
              <SearchIcon size={24} />
            </View>
          ),
        }}
      />
      {user && isTraveler && (
        <Tab.Screen
          name="MyOffers"
          component={MyOffersScreen}
          options={{
            tabBarLabel: labels.myOffers,
            tabBarIcon: ({ color, focused }) => (
              <PackageIcon size={24} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Chats"
        component={user ? ChatsListScreen : AuthFlowScreen}
        options={{
          tabBarLabel: labels.chats,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.error,
            color: '#FFFFFF',
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 18,
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <ChatIcon size={24} color={focused ? theme.colors.primary : theme.colors.textSecondary} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: -3,
                    backgroundColor: theme.colors.error,
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: theme.colors.background,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyShipments"
        component={user ? MyShipmentsScreen : AuthFlowScreen}
        options={{
          tabBarLabel: labels.shipments,
          tabBarIcon: ({ color, focused }) => (
            <ShipmentIcon size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: labels.profile,
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon size={24} color={focused ? theme.colors.primary : theme.colors.textSecondary} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Main App Component with Guest Mode Support
 * Allows unauthenticated users to search and view offer details
 * Authentication required for Contact, Create Offer, and other actions
 */
function AppNavigator() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { language } = useLanguage();
  const localNavigationRef = React.useRef();

  // Header titles translations
  const headerTitles = {
    en: {
      offerDetails: 'Offer Details',
      chat: 'Chat',
      signIn: 'Sign In',
      createOffer: 'Create New Offer',
      deliveries: 'My Deliveries',
      privacyPolicy: 'Privacy Policy',
      termsConditions: 'Terms & Conditions',
      reviews: 'Reviews',
      setupTraveler: 'Traveler Setup',
    },
    fr: {
      offerDetails: 'Détails de l\'Offre',
      chat: 'Discussion',
      signIn: 'Se Connecter',
      createOffer: 'Créer une Nouvelle Offre',
      deliveries: 'Mes Livraisons',
      privacyPolicy: 'Politique de Confidentialité',
      termsConditions: 'Conditions Générales',
      reviews: 'Avis',
      setupTraveler: 'Configuration Voyageur',
    },
  };

  const titles = headerTitles[language];

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const { getFirestore, doc, getDoc } = await import('firebase/firestore');
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setIsAdmin(!!userDoc.data().isAdmin);
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          setIsAdmin(false);
        }

        // Register for push notifications when user logs in
        registerForPushNotifications(currentUser.uid);
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  // Handle notification tap navigation (native only)
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
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
  <NavigationContainer ref={navigationRef} onReady={() => { localNavigationRef.current = navigationRef.current; }}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitleVisible: false, // Hide back button title globally
        }}
      >
        {/* Main Tabs - Always visible (guest and authenticated) */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Admin Dashboard - Only for admin users */}
        {isAdmin && (
          <Stack.Screen
            name="AdminScreen"
            component={AdminScreen}
            options={{
              title: 'Admin Dashboard',
              headerShown: true,
            }}
          />
        )}

        {/* Offer Details - Modal style */}
        <Stack.Screen 
          name="OfferDetails" 
          component={OfferDetailsScreen}
          options={{ 
            title: titles.offerDetails,
            headerShown: true,
          }}
        />

        {/* Chat Screen - for messaging between sender and traveler */}
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ 
            title: titles.chat,
            headerShown: true,
          }}
        />
        
        {/* Auth Flow - shown when user tries to contact or create offer */}
        <Stack.Screen
          name="AuthFlow"
          component={AuthFlowScreen}
          options={{
            title: '',
            presentation: 'modal',
          }}
        />

        {/* Traveler Setup - requires authentication */}
        <Stack.Screen
          name="TravelerSetup"
          component={TravelerSetupScreen}
          options={{
            title: titles.setupTraveler || "Traveler Setup",
            headerShown: true,
          }}
        />

        {/* Create Offer - requires authentication */}
        {user && (
          <Stack.Screen
            name="CreateOffer"
            component={CreateOfferScreen}
            options={{
              title: titles.createOffer,
              presentation: 'modal',
            }}
          />
        )}

        {/* Traveler Deliveries - requires authentication */}
        {user && (
          <Stack.Screen
            name="TravelerDeliveries"
            component={TravelerDeliveriesScreen}
            options={{
              title: "",
              headerShown: true,
            }}
          />
        )}

        {/* Privacy Policy - Always accessible */}
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            title: titles.privacyPolicy,
            headerShown: true,
          }}
        />

        {/* Contact Us - Always accessible */}
        <Stack.Screen
          name="ContactUs"
          component={ContactUs}
          options={{
            title: 'Contact Us',
            headerShown: true,
          }}
        />

        {/* Terms and Conditions - Always accessible */}
        <Stack.Screen
          name="TermsConditions"
          component={TermsConditionsScreen}
          options={{
            title: titles.termsConditions,
            headerShown: true,
          }}
        />

        {/* Onboarding - First time launch */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ProfileDetailsScreen"
          component={ProfileDetailsScreen}
          options={{
            title: 'Profile Details',
            headerShown: true,
          }}
        />

        {/* Traveler Reviews - Always accessible */}
        <Stack.Screen
          name="TravelerReviews"
          component={TravelerReviewsScreen}
          options={{
            title: titles.reviews || 'Reviews',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Skip onboarding on web - only show on mobile apps
      if (Platform.OS === 'web') {
        setShowOnboarding(false);
        setLoading(false);
        return;
      }

      // Check if user has completed onboarding
      const onboardingComplete = await AsyncStorage.getItem('@onboarding_complete');

      if (!onboardingComplete) {
        setShowOnboarding(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Wrapper component that conditionally adds Stripe providers based on platform
  const AppContent = ({ children }) => {
    if (Platform.OS === 'web') {
      return <Elements stripe={stripePromise}>{children}</Elements>;
    }
    return <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>{children}</StripeProvider>;
  };

  // Show language selection and onboarding if first launch
  if (showOnboarding) {
    return (
      <AppContent>
        <LanguageProvider>
          <UnreadMessagesProvider>
            <StatusBar style="auto" />
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="LanguageSelection"
                  component={LanguageSelectionScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Onboarding"
                  component={OnboardingScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="MainTabs"
                  component={MainTabs}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </UnreadMessagesProvider>
        </LanguageProvider>
      </AppContent>
    );
  }

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
