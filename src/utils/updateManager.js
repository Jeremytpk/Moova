import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Only import expo-updates in production builds (not in Expo Go)
let Updates = null;
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Updates = require('expo-updates');
  } catch (error) {
    console.log('expo-updates not available:', error.message);
  }
}

/**
 * Check if updates are supported on this platform
 * @returns {boolean}
 */
export function isUpdateSupported() {
  // Updates don't work in Expo Go - only in production builds
  if (isExpoGo) {
    return false;
  }

  // Skip if Updates module not available
  if (!Updates) {
    return false;
  }

  // Skip on web
  if (Platform.OS === 'web') {
    return false;
  }

  return true;
}

/**
 * Check for available updates
 * @returns {Promise<{isAvailable: boolean, manifest?: object}>}
 */
export async function checkForUpdates() {
  if (!isUpdateSupported()) {
    console.log('Updates not supported in this environment');
    return { isAvailable: false };
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    console.log('Update check result:', update);
    return update;
  } catch (error) {
    console.error('Error checking for updates:', error);
    throw error;
  }
}

/**
 * Download and apply available update
 * @returns {Promise<boolean>} - Returns true if update was fetched successfully
 */
export async function fetchAndApplyUpdate() {
  if (!isUpdateSupported()) {
    console.log('Updates not supported in this environment');
    return false;
  }

  try {
    const update = await Updates.fetchUpdateAsync();
    console.log('Update fetch result:', update);

    if (update.isNew) {
      // Reload the app to apply the update
      await Updates.reloadAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error fetching update:', error);
    throw error;
  }
}

/**
 * Check for updates and automatically apply if available
 * @param {function} onUpdateAvailable - Callback when update is available
 * @param {function} onError - Callback when error occurs
 * @param {function} onNoUpdate - Callback when no update is available
 * @param {number} timeout - Timeout in milliseconds (default 10000)
 * @returns {Promise<void>}
 */
export async function checkAndApplyUpdate(onUpdateAvailable, onError, onNoUpdate, timeout = 10000) {
  if (!isUpdateSupported()) {
    console.log('OTA updates are only available in production builds');
    if (onNoUpdate) {
      onNoUpdate('not_supported');
    }
    return;
  }

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Update check timed out')), timeout);
  });

  try {
    // Race between the update check and the timeout
    const { isAvailable } = await Promise.race([
      checkForUpdates(),
      timeoutPromise
    ]);

    if (isAvailable) {
      console.log('Update available, fetching...');
      if (onUpdateAvailable) {
        onUpdateAvailable();
      }
      await fetchAndApplyUpdate();
    } else {
      console.log('No updates available');
      if (onNoUpdate) {
        onNoUpdate('up_to_date');
      }
    }
  } catch (error) {
    console.error('Error in checkAndApplyUpdate:', error);
    if (onError) {
      onError(error);
    }
  }
}

/**
 * Get current update information
 * @returns {object} - Current update info including updateId, createdAt, etc.
 */
export function getCurrentUpdateInfo() {
  if (!isUpdateSupported()) {
    return {
      updateId: isExpoGo ? 'expo-go' : 'web',
      channel: isExpoGo ? 'development' : 'web',
      isEmbeddedLaunch: true,
    };
  }

  return {
    updateId: Updates.updateId,
    channel: Updates.channel,
    createdAt: Updates.createdAt,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    isEmergencyLaunch: Updates.isEmergencyLaunch,
  };
}

/**
 * Reload the app (useful after manual update)
 */
export async function reloadApp() {
  if (!isUpdateSupported()) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  await Updates.reloadAsync();
}
