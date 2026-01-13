import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { auth } from './src/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import theme from './src/theme';
import { ProfileIcon, SearchIcon, PackageIcon, ShipmentIcon, ChatIcon } from './src/components/Icons';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';

// Screens
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import OfferDetailsScreen from './src/screens/OfferDetailsScreen';
import CreateOfferScreen from './src/screens/CreateOfferScreen';
import AuthFlowScreen from './src/screens/AuthFlowScreen';
import MyOffersScreen from './src/screens/MyOffersScreen';
import MyShipmentsScreen from './src/screens/MyShipmentsScreen';
import TravelerDeliveriesScreen from './src/screens/TravelerDeliveriesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatsListScreen from './src/screens/ChatsListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Main Tab Navigator for all users (guest and authenticated)
 * Guest users can see Search, but need to sign in for other features
 */
function MainTabs() {
  const [user, setUser] = useState(null);
  const { language } = useLanguage();

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
      <Tab.Screen 
        name="MyOffers" 
        component={user ? MyOffersScreen : AuthFlowScreen}
        options={{
          tabBarLabel: labels.myOffers,
          tabBarIcon: ({ color, focused }) => (
            <PackageIcon size={24} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (!user) {
              e.preventDefault();
              navigation.navigate('AuthFlow');
            }
          },
        })}
      />
      <Tab.Screen 
        name="Chats" 
        component={user ? ChatsListScreen : AuthFlowScreen}
        options={{
          tabBarLabel: labels.chats,
          tabBarIcon: ({ color, focused }) => (
            <ChatIcon size={24} color={focused ? theme.colors.primary : theme.colors.textSecondary} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (!user) {
              e.preventDefault();
              navigation.navigate('AuthFlow');
            }
          },
        })}
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
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (!user) {
              e.preventDefault();
              navigation.navigate('AuthFlow');
            }
          },
        })}
      />
      <Tab.Screen 
        name="Profile" 
        component={user ? ProfileScreen : AuthFlowScreen}
        options={{
          tabBarLabel: labels.profile,
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon size={24} color={focused ? theme.colors.primary : theme.colors.textSecondary} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (!user) {
              e.preventDefault();
              navigation.navigate('AuthFlow');
            }
          },
        })}
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
  const { language } = useLanguage();

  // Header titles translations
  const headerTitles = {
    en: {
      offerDetails: 'Offer Details',
      chat: 'Chat',
      signIn: 'Sign In',
      createOffer: 'Create New Offer',
      deliveries: 'My Deliveries',
    },
    fr: {
      offerDetails: 'Détails de l\'Offre',
      chat: 'Discussion',
      signIn: 'Se Connecter',
      createOffer: 'Créer une Nouvelle Offre',
      deliveries: 'Mes Livraisons',
    },
  };

  const titles = headerTitles[language];

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
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
            title: titles.signIn,
            presentation: 'modal',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <LanguageProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </LanguageProvider>
  );
}
