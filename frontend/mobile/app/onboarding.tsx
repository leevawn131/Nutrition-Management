import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import {
  ONBOARDING_SLIDES,
  OnboardingSlideItem,
  OnboardingSlide,
  PaginationDots,
} from '@/components/onboarding';
import { setOnboardingCompleted } from '@/services/storage.service';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlideItem>>(null);

  // Handle momentum scroll end to calculate active slide index
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      if (index >= 0 && index < ONBOARDING_SLIDES.length && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [width, activeIndex]
  );

  const handleRegisterPress = async () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    await setOnboardingCompleted(true);
    router.replace('/(auth)/register');
  };

  const handleLoginPress = async () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    await setOnboardingCompleted(true);
    router.replace('/(auth)/login');
  };

  const renderItem = useCallback(
    ({ item }: { item: OnboardingSlideItem }) => (
      <OnboardingSlide item={item} width={width} />
    ),
    [width]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Slides Pager */}
        <View style={styles.slidesArea}>
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_SLIDES}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        </View>

        {/* Pagination Indicator */}
        <PaginationDots total={ONBOARDING_SLIDES.length} activeIndex={activeIndex} />

        {/* Action Buttons Section */}
        <View style={styles.actionsContainer}>
          {/* Primary Action: Đăng ký ngay */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegisterPress}
            activeOpacity={0.88}>
            <Text style={styles.primaryButtonText}>Đăng ký ngay</Text>
          </TouchableOpacity>

          {/* Secondary Action: Đăng nhập */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLoginPress}
            activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  slidesArea: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 12,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 8,
  },
  primaryButton: {
    height: 54,
    backgroundColor: '#34D399', // Fresh vibrant emerald/green matching reference
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    height: 54,
    backgroundColor: '#F1F5F9', // Soft light gray matching reference
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A', // Dark charcoal text
    letterSpacing: 0.2,
  },
});
