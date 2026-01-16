import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import theme from '../theme';

// Share Icon (universal share arrow)
export const ShareIcon = ({ size = 22, color = theme.colors.primary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 16V4m0 0l-4 4m4-4l4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);
