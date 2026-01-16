import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import theme from '../theme';

// Link Icon (chain/fav icon style)
export const LinkIcon = ({ size = 22, color = theme.colors.primary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 7a5 5 0 0 1 0 7l-4 4a5 5 0 0 1-7-7l2-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 17a5 5 0 0 1 0-7l4-4a5 5 0 0 1 7 7l-2 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);
