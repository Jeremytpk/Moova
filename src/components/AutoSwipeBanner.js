import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
} from 'firebase/firestore';
import theme from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - (theme.spacing.md * 2);
const AUTO_SWIPE_INTERVAL = 4000; // 4 seconds

// Moova brand colors from logo
const BRAND_COLORS = [
  '#2563EB', // Primary Blue
  '#10B981', // Green (from logo accents)
  '#1E3A5F', // Dark Navy Blue
  '#0EA5E9', // Light Blue / Teal
  '#059669', // Darker Green
];

/**
 * AutoSwipeBanner
 * A compact auto-scrolling banner for ads and information
 * Fetches banners from Firestore and displays image + title
 */
export default function AutoSwipeBanner({
  onBannerPress,
  height = 100,
  navigation,
  localBanners,
}) {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch banners from Firestore or use local data
  useEffect(() => {
    const fetchBanners = async () => {
      if (localBanners) {
        setBanners(localBanners);
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const snapshot = await getDocs(collection(db, 'banners'));
        const bannersList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(banner => banner.isActive === true)
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
          });
        setBanners(bannersList);
      } catch (error) {
        console.error('Error fetching banners:', error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [localBanners]);

  // Auto-swipe effect
  useEffect(() => {
    if (banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * BANNER_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SWIPE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [banners.length]);

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / BANNER_WIDTH);
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (banner, index) => {
    // Handle external URL
    if (banner.linkUrl) {
      Linking.openURL(banner.linkUrl).catch(err =>
        console.error('Error opening URL:', err)
      );
      return;
    }

    // Handle internal navigation
    if (banner.linkScreen && navigation) {
      navigation.navigate(banner.linkScreen);
      return;
    }

    // Custom callback
    if (onBannerPress) {
      onBannerPress(banner);
    }
  };

  // Don't render anything if loading or no banners
  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id || index}
            activeOpacity={0.9}
            onPress={() => handleBannerPress(banner, index)}
            style={[
              styles.bannerItem,
              {
                height,
                backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length],
              },
            ]}
          >
            {banner.imageUrl ? (
              <Image
                source={typeof banner.imageUrl === 'string' ? { uri: banner.imageUrl } : banner.imageUrl}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : null}
            <View style={[styles.overlay, !banner.imageUrl && styles.noImageOverlay]}>
              <Text style={styles.bannerTitle} numberOfLines={2}>
                {banner.title}
              </Text>
              {banner.subtitle && (
                <Text style={styles.bannerSubtitle} numberOfLines={2}>
                  {banner.subtitle}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  scrollContent: {
    // No extra padding needed
  },
  bannerItem: {
    width: BANNER_WIDTH,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  noImageOverlay: {
    backgroundColor: 'transparent',
  },
  bannerTitle: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    ...theme.typography.caption,
    color: 'white',
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 16,
  },
});
