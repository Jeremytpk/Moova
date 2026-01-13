import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import theme from '../theme';

/**
 * Icon Components
 * Consistent styled icons throughout the app
 */

// Profile/User Icon - Matches Moova brand
export const ProfileIcon = ({ size = 32, color = theme.colors.primary }) => (
  <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
    <View style={[styles.userIconHead, { 
      width: size * 0.35, 
      height: size * 0.35, 
      borderRadius: size * 0.175,
      top: size * 0.15,
    }]} />
    <View style={[styles.userIconBody, { 
      width: size * 0.6, 
      height: size * 0.4, 
      borderRadius: size * 0.3,
      bottom: size * 0.05,
    }]} />
  </View>
);

// Search Icon
export const SearchIcon = ({ size = 20, color = theme.colors.textSecondary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Magnifying glass circle */}
    <View style={{
      width: size * 0.6,
      height: size * 0.6,
      borderRadius: size * 0.3,
      borderWidth: size * 0.12,
      borderColor: color,
      position: 'absolute',
      top: size * 0.05,
      left: size * 0.05,
    }} />
    {/* Handle */}
    <View style={{
      position: 'absolute',
      width: size * 0.12,
      height: size * 0.35,
      backgroundColor: color,
      borderRadius: size * 0.06,
      bottom: size * 0.05,
      right: size * 0.05,
      transform: [{ rotate: '45deg' }],
    }} />
  </View>
);

// Package/Offers Icon
export const PackageIcon = ({ size = 24, color = theme.colors.success }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Box */}
    <View style={{
      width: size * 0.8,
      height: size * 0.8,
      borderWidth: size * 0.1,
      borderColor: color,
      borderRadius: size * 0.1,
      backgroundColor: 'transparent',
    }}>
      {/* Top flap line */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: size * 0.1,
        backgroundColor: color,
      }} />
      {/* Vertical center line */}
      <View style={{
        position: 'absolute',
        left: '50%',
        marginLeft: -size * 0.05,
        top: 0,
        bottom: 0,
        width: size * 0.1,
        backgroundColor: color,
      }} />
    </View>
  </View>
);

// Shipments/Truck Icon
export const ShipmentIcon = ({ size = 24, color = theme.colors.primary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Truck body */}
    <View style={{
      position: 'absolute',
      left: size * 0.05,
      top: size * 0.2,
      width: size * 0.5,
      height: size * 0.4,
      backgroundColor: color,
      borderRadius: size * 0.05,
    }} />
    {/* Truck cab */}
    <View style={{
      position: 'absolute',
      right: size * 0.1,
      top: size * 0.3,
      width: size * 0.3,
      height: size * 0.3,
      backgroundColor: color,
      borderRadius: size * 0.05,
    }} />
    {/* Wheels */}
    <View style={{
      position: 'absolute',
      left: size * 0.15,
      bottom: size * 0.15,
      width: size * 0.15,
      height: size * 0.15,
      borderRadius: size * 0.075,
      backgroundColor: color,
    }} />
    <View style={{
      position: 'absolute',
      right: size * 0.15,
      bottom: size * 0.15,
      width: size * 0.15,
      height: size * 0.15,
      borderRadius: size * 0.075,
      backgroundColor: color,
    }} />
  </View>
);

// Airplane/Travel Icon
export const AirplaneIcon = ({ size = 20, color = theme.colors.white }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Fuselage (body) */}
    <View style={{
      position: 'absolute',
      width: size * 0.2,
      height: size * 0.7,
      backgroundColor: color,
      borderTopLeftRadius: size * 0.1,
      borderTopRightRadius: size * 0.1,
      top: size * 0.05,
      left: size * 0.4,
    }} />
    {/* Main wings */}
    <View style={{
      position: 'absolute',
      width: size * 0.85,
      height: size * 0.18,
      backgroundColor: color,
      borderRadius: size * 0.05,
      top: size * 0.35,
      left: size * 0.075,
    }} />
    {/* Tail wings */}
    <View style={{
      position: 'absolute',
      width: size * 0.45,
      height: size * 0.12,
      backgroundColor: color,
      borderRadius: size * 0.03,
      bottom: size * 0.12,
      left: size * 0.275,
    }} />
  </View>
);

// Location/Pin Icon
export const LocationIcon = ({ size = 20, color = theme.colors.text }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Pin shape */}
    <View style={{
      width: size * 0.6,
      height: size * 0.75,
      borderRadius: size * 0.3,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
      backgroundColor: color,
      position: 'absolute',
      top: size * 0.05,
    }}>
      {/* Inner white circle */}
      <View style={{
        width: size * 0.25,
        height: size * 0.25,
        borderRadius: size * 0.125,
        backgroundColor: theme.colors.background,
        position: 'absolute',
        top: size * 0.15,
        left: size * 0.175,
      }} />
    </View>
    {/* Bottom point */}
    <View style={{
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: size * 0.15,
      borderRightWidth: size * 0.15,
      borderTopWidth: size * 0.25,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: color,
      position: 'absolute',
      bottom: size * 0.05,
    }} />
  </View>
);

// Empty Mailbox Icon
export const EmptyMailboxIcon = ({ size = 64, color = theme.colors.textSecondary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Box */}
    <View style={{
      width: size * 0.7,
      height: size * 0.5,
      backgroundColor: color + '30',
      borderWidth: size * 0.04,
      borderColor: color,
      borderRadius: size * 0.08,
      position: 'absolute',
      top: size * 0.25,
    }} />
    {/* Lid */}
    <View style={{
      width: size * 0.7,
      height: size * 0.15,
      backgroundColor: color,
      borderTopLeftRadius: size * 0.08,
      borderTopRightRadius: size * 0.08,
      position: 'absolute',
      top: size * 0.25,
    }} />
    {/* Empty indicator lines */}
    <View style={{
      width: size * 0.4,
      height: size * 0.03,
      backgroundColor: color + '50',
      borderRadius: size * 0.015,
      position: 'absolute',
      top: size * 0.5,
    }} />
    <View style={{
      width: size * 0.3,
      height: size * 0.03,
      backgroundColor: color + '50',
      borderRadius: size * 0.015,
      position: 'absolute',
      top: size * 0.6,
    }} />
  </View>
);

// Search Not Found Icon
export const SearchNotFoundIcon = ({ size = 64, color = theme.colors.textSecondary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Large magnifying glass */}
    <View style={{
      width: size * 0.5,
      height: size * 0.5,
      borderRadius: size * 0.25,
      borderWidth: size * 0.08,
      borderColor: color,
      position: 'absolute',
      top: size * 0.05,
      left: size * 0.05,
    }} />
    {/* Handle */}
    <View style={{
      position: 'absolute',
      width: size * 0.08,
      height: size * 0.3,
      backgroundColor: color,
      borderRadius: size * 0.04,
      bottom: size * 0.05,
      right: size * 0.05,
      transform: [{ rotate: '45deg' }],
    }} />
    {/* X mark inside */}
    <View style={{
      position: 'absolute',
      width: size * 0.06,
      height: size * 0.25,
      backgroundColor: color,
      borderRadius: size * 0.03,
      top: size * 0.2,
      left: size * 0.27,
      transform: [{ rotate: '45deg' }],
    }} />
    <View style={{
      position: 'absolute',
      width: size * 0.06,
      height: size * 0.25,
      backgroundColor: color,
      borderRadius: size * 0.03,
      top: size * 0.2,
      left: size * 0.27,
      transform: [{ rotate: '-45deg' }],
    }} />
  </View>
);

// Close/Clear Icon
export const CloseIcon = ({ size = 18 }) => (
  <View style={[styles.closeIconCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.closeIconText, { fontSize: size * 0.7 }]}>✕</Text>
  </View>
);

// Filter Icon
export const FilterIcon = ({ size = 20, color = theme.colors.primary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size, height: size }}>
      {/* Top line */}
      <View style={{
        position: 'absolute',
        top: size * 0.1,
        left: 0,
        right: 0,
        height: size * 0.1,
        backgroundColor: color,
        borderRadius: size * 0.05,
      }} />
      {/* Middle funnel part */}
      <View style={{
        position: 'absolute',
        top: size * 0.35,
        left: size * 0.2,
        right: size * 0.2,
        height: size * 0.1,
        backgroundColor: color,
        borderRadius: size * 0.05,
      }} />
      {/* Bottom vertical line */}
      <View style={{
        position: 'absolute',
        top: size * 0.6,
        left: size * 0.4,
        width: size * 0.2,
        height: size * 0.35,
        backgroundColor: color,
        borderRadius: size * 0.05,
      }} />
    </View>
  </View>
);

// Settings/Gear Icon
export const SettingsIcon = ({ size = 24, color = theme.colors.text }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Center circle */}
    <View style={{
      width: size * 0.4,
      height: size * 0.4,
      borderRadius: size * 0.2,
      backgroundColor: color,
    }} />
    {/* Gear teeth - 4 spokes */}
    {[0, 90, 180, 270].map((rotation, index) => (
      <View
        key={index}
        style={{
          position: 'absolute',
          width: size * 0.15,
          height: size * 0.5,
          backgroundColor: color,
          borderRadius: size * 0.075,
          transform: [{ rotate: `${rotation}deg` }],
        }}
      />
    ))}
  </View>
);

// Arrow/Chevron Right Icon
export const ArrowRightIcon = ({ size = 24, color = theme.colors.textSecondary }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.35,
      height: size * 0.35,
      borderRightWidth: size * 0.12,
      borderTopWidth: size * 0.12,
      borderColor: color,
      transform: [{ rotate: '45deg' }],
      marginLeft: -size * 0.08,
    }} />
  </View>
);

// Chat/Message Icon
export const ChatIcon = ({ size = 24, color = theme.colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const styles = StyleSheet.create({
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
    elevation: 2,
  },
  iconText: {
    color: theme.colors.background,
  },
  userIconHead: {
    backgroundColor: theme.colors.background,
    position: 'absolute',
  },
  userIconBody: {
    backgroundColor: theme.colors.background,
    position: 'absolute',
  },
  closeIconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.textLight,
  },
  closeIconText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
});
