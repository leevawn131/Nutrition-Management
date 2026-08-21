import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SettingsItem } from '@/components/settings/settings-item';
import { getAuthToken, clearAuthData } from '@/services/storage.service';
import { authService } from '@/services/auth.service';

export default function SettingsScreen() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  const handlePlaceholder = (featureName: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    Alert.alert(
      featureName,
      `Tính năng "${featureName}" đang được hoàn thiện và sẽ sớm khả dụng trong các bản cập nhật tiếp theo!`
    );
  };

  const handleLogoutPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }

    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const token = await getAuthToken();
              // 1. Notify backend logout endpoint (stateless JWT)
              await authService.logout(token);
              // 2. Clear client-side stored token and cached user data
              await clearAuthData();

              if (Platform.OS !== 'web') {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch {}
              }

              // 3. Redirect to login screen
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error during logout:', error);
              await clearAuthData();
              router.replace('/(auth)/login');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccountPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
    Alert.alert(
      'Xóa tài khoản',
      'Tính năng xóa tài khoản hiện đang được quản lý bảo mật bởi hệ thống. Vui lòng liên hệ quản trị viên nếu bạn có yêu cầu xóa toàn bộ dữ liệu.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* 1. TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cài đặt</Text>

        <View style={styles.placeholderRight} />
      </View>

      {/* 2. SCROLLABLE SETTINGS CONTENT */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* SECTION 1: Account / Profile */}
        <View style={styles.section}>
          <SettingsItem
            title="Hồ sơ"
            showChevron={true}
            onPress={() => router.push('/edit-profile' as any)}
          />
          <SettingsItem
            title="Thông tin cá nhân"
            showChevron={true}
            onPress={() => router.push('/personal-info' as any)}
          />
          <SettingsItem
            title="Sở thích ăn uống"
            showChevron={true}
            onPress={() => handlePlaceholder('Sở thích ăn uống')}
          />
          <SettingsItem
            title="Cài đặt thông báo"
            showChevron={true}
            onPress={() => handlePlaceholder('Cài đặt thông báo')}
          />
          <SettingsItem
            title="Gia đình"
            showChevron={true}
            onPress={() => handlePlaceholder('Gia đình')}
          />
        </View>

        <View style={styles.divider} />

        {/* SECTION 2: Feedback / Support */}
        <View style={styles.section}>
          <SettingsItem
            title="Báo lỗi"
            showChevron={false}
            onPress={() => handlePlaceholder('Báo lỗi')}
          />
          <SettingsItem
            title="Góp ý"
            showChevron={false}
            onPress={() => handlePlaceholder('Góp ý')}
          />
        </View>

        <View style={styles.divider} />

        {/* SECTION 3: Chính sách & Điều khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CHÍNH SÁCH & ĐIỀU KHOẢN</Text>
          <SettingsItem
            title="Chính sách bảo hành"
            showChevron={false}
            onPress={() => handlePlaceholder('Chính sách bảo hành')}
          />
          <SettingsItem
            title="Chính sách giao hàng"
            showChevron={false}
            onPress={() => handlePlaceholder('Chính sách giao hàng')}
          />
          <SettingsItem
            title="Chính sách đổi trả"
            showChevron={false}
            onPress={() => handlePlaceholder('Chính sách đổi trả')}
          />
          <SettingsItem
            title="Chính sách bảo mật"
            showChevron={false}
            onPress={() => handlePlaceholder('Chính sách bảo mật')}
          />
          <SettingsItem
            title="Điều khoản dịch vụ"
            showChevron={false}
            onPress={() => handlePlaceholder('Điều khoản dịch vụ')}
          />
          <SettingsItem
            title="Chính sách giá"
            showChevron={false}
            onPress={() => handlePlaceholder('Chính sách giá')}
          />
          <SettingsItem
            title="Chính sách thanh toán"
            showChevron={false}
            onPress={() => handlePlaceholder('Chính sách thanh toán')}
          />
          <SettingsItem
            title="Giải quyết khiếu nại"
            showChevron={false}
            onPress={() => handlePlaceholder('Giải quyết khiếu nại')}
          />
          <SettingsItem
            title="Điều kiện giao dịch"
            showChevron={false}
            onPress={() => handlePlaceholder('Điều kiện giao dịch')}
          />
          <SettingsItem
            title="Hỗ trợ trực tuyến"
            showChevron={false}
            onPress={() => handlePlaceholder('Hỗ trợ trực tuyến')}
          />
        </View>

        <View style={styles.divider} />

        {/* SECTION 4: Other */}
        <View style={styles.section}>
          <SettingsItem
            title="Hướng dẫn sử dụng"
            showChevron={true}
            onPress={() => handlePlaceholder('Hướng dẫn sử dụng')}
          />
        </View>

        <View style={styles.divider} />

        {/* SECTION 5: Security / Account Actions */}
        <View style={styles.section}>
          <SettingsItem
            title="Đổi mật khẩu"
            showChevron={true}
            onPress={() => router.push('/change-password' as any)}
          />
          <SettingsItem
            title="Đăng xuất"
            showChevron={false}
            onPress={handleLogoutPress}
          />
          <SettingsItem
            title="Xóa tài khoản"
            showChevron={false}
            isDestructive={true}
            onPress={handleDeleteAccountPress}
          />
        </View>
      </ScrollView>

      {/* Loading overlay during logout */}
      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Đang đăng xuất...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F2644',
    letterSpacing: -0.3,
  },
  placeholderRight: {
    width: 38,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingVertical: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 99,
  },
  loadingText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F2644',
  },
});
