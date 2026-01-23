import * as React from 'react';

export const navigationRef = React.createRef();
const navigationQueue = [];

export function navigate(name, params) {
  console.log('RootNavigation.navigate called:', name, params, navigationRef.current);
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    // Queue the navigation action if ref is not ready
    navigationQueue.push({ name, params });
  }
}

// Helper to flush queued navigation actions when ref becomes ready
export function flushNavigationQueue() {
  if (navigationRef.current && navigationQueue.length > 0) {
    while (navigationQueue.length > 0) {
      const { name, params } = navigationQueue.shift();
      navigationRef.current.navigate(name, params);
    }
  }
}
