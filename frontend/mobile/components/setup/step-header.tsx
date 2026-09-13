import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StepHeaderProps {
  currentStep: number;
  totalSteps?: number;
  showBack?: boolean;
  onBack?: () => void;
  onExit?: () => void;
}

export function StepHeader({
  currentStep,
  totalSteps = 16,
  showBack = false,
  onBack,
  onExit,
}: StepHeaderProps) {
  const router = useRouter();

  const handleExitPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (onExit) {
      onExit();
      return;
    }
    Alert.alert(
      'Tạm dừng thiết lập?',
      'Bạn có muốn rời khỏi quá trình thiết lập khảo sát và quay về trang chính không?',
      [
        { text: 'Tiếp tục thiết lập', style: 'cancel' },
        {
          text: 'Rời khỏi',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  const handleBackPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const progressPercent = Math.min(Math.max((currentStep / totalSteps) * 100, 4), 100);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleBackPress}
            activeOpacity={0.7}
            accessibilityLabel="Quay lại">
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleExitPress}
            activeOpacity={0.7}
            accessibilityLabel="Đóng khảo sát">
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Thin Horizontal Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34D399', // Emerald green
    borderRadius: 2,
  },
});
