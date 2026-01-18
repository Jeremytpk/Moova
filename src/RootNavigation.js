import * as React from 'react';

export const navigationRef = React.createRef();

export function navigate(name, params) {
  console.log('RootNavigation.navigate called:', name, params, navigationRef.current);
  navigationRef.current?.navigate(name, params);
}
