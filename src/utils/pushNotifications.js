import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Only import notifications on native platforms
let Notifications, Device;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  /**
   * Configure notification behavior (native only)
   */
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Register for push notifications and get the Expo push token
 * @param {string} userId - User's Firebase ID
 * @returns {Promise<string|null>} - Expo push token or null
 */
export async function registerForPushNotifications(userId) {
  try {
    // Skip on web (push notifications don't work the same way)
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return null;
    }

    // Check if we're on a physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log('Expo push token:', token);

    // Save token to user's Firestore document
    if (userId && token) {
      await updateDoc(doc(db, 'users', userId), {
        expoPushToken: token,
        pushTokenUpdatedAt: new Date(),
      });
      console.log('Push token saved to Firestore');
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0080FF',
      });

      await Notifications.setNotificationChannelAsync('offers', {
        name: 'New Offers',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#00FF80',
      });

      await Notifications.setNotificationChannelAsync('reviews', {
        name: 'New Reviews',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Send a push notification to specific users
 * This is a helper for testing - actual sending should be done from backend
 * @param {Array<string>} expoPushTokens - Array of Expo push tokens
 * @param {object} notification - Notification data
 */
export async function sendPushNotification(expoPushTokens, notification) {
  const messages = expoPushTokens
    .filter(token => token && token.startsWith('ExponentPushToken'))
    .map(token => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      channelId: notification.channelId || 'default',
    }));

  if (messages.length === 0) {
    console.log('No valid push tokens to send to');
    return;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Add notification response listener
 * Called when user taps on a notification
 * @param {function} handler - Function to handle notification response
 * @returns {object} - Subscription object
 */
export function addNotificationResponseListener(handler) {
  if (Platform.OS === 'web') {
    // Return a dummy subscription for web
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Add notification received listener
 * Called when notification is received while app is in foreground
 * @param {function} handler - Function to handle received notification
 * @returns {object} - Subscription object
 */
export function addNotificationReceivedListener(handler) {
  if (Platform.OS === 'web') {
    // Return a dummy subscription for web
    return { remove: () => {} };
  }
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  if (Platform.OS === 'web') {
    return;
  }
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Set badge count (iOS)
 * @param {number} count - Badge count
 */
export async function setBadgeCount(count) {
  if (Platform.OS === 'ios' && Notifications) {
    await Notifications.setBadgeCountAsync(count);
  }
}
