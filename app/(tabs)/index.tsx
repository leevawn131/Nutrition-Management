import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuickActionsModal } from '@/components/home/quick-actions-modal';
import { AppLogo } from '@/components/ui/app-logo';
import { getAuthToken, getCachedUser } from '@/services/storage.service';
import { HealthMetrics, userService } from '@/services/user.service';
import { User } from '@/types/auth.types';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Time-based greeting helper
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng,';
    if (hour < 18) return 'Chào buổi chiều,';
    return 'Chào buổi tối,';
  };

  // User Goal Display helper
  const getGoalText = (): string => {
    if (!user || !user.goal) {
      return 'Bạn chưa thiết lập mục tiêu';
    }
    switch (user.goal) {
      case 'lose':
        return 'Mục tiêu: Giảm cân';
      case 'gain':
        return 'Mục tiêu: Tăng cân';
      case 'maintain':
        return 'Mục tiêu: Duy trì cân nặng';
      default:
        return 'Mục tiêu: Chưa xác định';
    }
  };

  const loadData = useCallback(async () => {
    // 1. Try to load cached user first for instantaneous UI render
    const cached = await getCachedUser();
    if (cached) {
      setUser(cached);
    }

    // 2. Fetch live data from backend APIs (Module A)
    const token = await getAuthToken();
    if (token) {
      const [profileData, healthData] = await Promise.all([
        userService.getProfile(token),
        userService.getHealthMetrics(token),
      ]);

      if (profileData) {
        setUser(profileData);
      }
      if (healthData) {
        setHealth(healthData);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    await loadData();
    setIsRefreshing(false);
  };

  const handleAssistantAction = (action: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    Alert.alert('Trợ lý dinh dưỡng', `Chức năng "${action}" đang được chuẩn bị để kết nối trực tiếp!`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#34D399" />
        }>
        
        {/* 1. TOP HEADER */}
        <View style={styles.header}>
          <AppLogo size="small" />

          <View style={styles.headerActions}>
            {/* Notification Bell Button */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => Alert.alert('Thông báo', 'Bạn không có thông báo mới.')}
              activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={21} color="#334155" />
            </TouchableOpacity>

            {/* Bag/Shop Button */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => Alert.alert('Giỏ hàng', 'Giỏ hàng của bạn đang trống.')}
              activeOpacity={0.7}>
              <Ionicons name="bag-handle-outline" size={21} color="#334155" />
            </TouchableOpacity>

            {/* Profile Avatar Button */}
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
              accessibilityLabel="Mở trang cá nhân">
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={18} color="#0D9488" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. DISMISSABLE NOTIFICATION PROMPT */}
        {showNotificationBanner && (
          <View style={styles.notificationBanner}>
            <View style={styles.notifIconCircle}>
              <Ionicons name="notifications-outline" size={18} color="#64748B" />
            </View>

            <Text style={styles.notifText}>
              Bật thông báo để không bỏ lỡ nhắc nhở bữa ăn và thói quen.
            </Text>

            <TouchableOpacity
              onPress={() => {
                Alert.alert('Thông báo', 'Đã kích hoạt quyền nhận thông báo nhắc nhở!');
                setShowNotificationBanner(false);
              }}
              activeOpacity={0.7}>
              <Text style={styles.notifActionText}>Bật</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowNotificationBanner(false)}
              style={styles.notifCloseBtn}
              activeOpacity={0.7}>
              <Ionicons name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* 3. GREETING & USER GOAL SUMMARY */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greetingTitle}>
              {getGreeting()} {user?.full_name ? user.full_name : ''}
            </Text>
            <Text style={styles.greetingGoal}>{getGoalText()}</Text>
          </View>

          <TouchableOpacity
            style={styles.diaryBadgeBtn}
            onPress={() => Alert.alert('Nhật ký', 'Xem nhật ký dinh dưỡng tổng quan.')}
            activeOpacity={0.7}>
            <Ionicons name="book-outline" size={19} color="#334155" />
          </TouchableOpacity>
        </View>

        {/* 4. CALORIE & NUTRITION SUMMARY CARD */}
        <View style={styles.calorieCard}>
          {/* Left Circular Ring */}
          <View style={styles.calorieRingContainer}>
            <View style={styles.calorieRingOuter}>
              <View style={styles.calorieRingDot} />
              <View style={styles.calorieRingInner}>
                <Text style={styles.calorieNumber}>
                  {user?.target_calories
                    ? user.target_calories.toLocaleString()
                    : health?.tdee
                    ? Math.round(health.tdee).toLocaleString()
                    : '--'}
                </Text>
                <Text style={styles.calorieLabel}>cần nạp</Text>
              </View>
            </View>
          </View>

          {/* Right Stats Breakdown (Consumed / Burned) */}
          <View style={styles.calorieBreakdown}>
            {/* Consumed */}
            <View style={styles.statRow}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <FontAwesome6 name="utensils" size={16} color="#D97706" />
              </View>
              <View>
                <Text style={styles.statValue}>0 kcal</Text>
                <Text style={styles.statLabel}>Đã nạp</Text>
              </View>
            </View>

            {/* Burned */}
            <View style={styles.statRow}>
              <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="flame" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.statValue}>0 kcal</Text>
                <Text style={styles.statLabel}>Đã đốt</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. MACRO SUMMARY ROW */}
        <View style={styles.macroSection}>
          {/* Protein */}
          <View style={styles.macroCol}>
            <Text style={styles.macroName}>Chất đạm</Text>
            <Text style={styles.macroValue}>
              0g / {user?.target_protein_g ? `${user.target_protein_g}g` : '--'}
            </Text>
            <View style={styles.macroProgressBar}>
              <View style={[styles.macroProgressFill, { width: '0%', backgroundColor: '#F59E0B' }]} />
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroCol}>
            <Text style={styles.macroName}>Đường bột</Text>
            <Text style={styles.macroValue}>
              0g / {user?.target_carb_g ? `${user.target_carb_g}g` : '--'}
            </Text>
            <View style={styles.macroProgressBar}>
              <View style={[styles.macroProgressFill, { width: '0%', backgroundColor: '#3B82F6' }]} />
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroCol}>
            <Text style={styles.macroName}>Chất béo</Text>
            <Text style={styles.macroValue}>
              0g / {user?.target_fat_g ? `${user.target_fat_g}g` : '--'}
            </Text>
            <View style={styles.macroProgressBar}>
              <View style={[styles.macroProgressFill, { width: '0%', backgroundColor: '#10B981' }]} />
            </View>
          </View>
        </View>

        {/* 6. NUTRITION ASSISTANT CARD */}
        <View style={styles.assistantCard}>
          <View style={styles.assistantTopRow}>
            <View style={styles.assistantAvatar}>
              <MaterialCommunityIcons name="chef-hat" size={28} color="#10B981" />
            </View>
            <View style={styles.assistantTextWrapper}>
              <Text style={styles.assistantTitle}>Mình là trợ lý dinh dưỡng</Text>
              <Text style={styles.assistantSubtitle}>Cần gì, cứ hỏi nha!</Text>
            </View>
          </View>

          {/* Assistant Action Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.assistantBtnRow}>
            <TouchableOpacity
              style={styles.primaryPillBtn}
              onPress={() => handleAssistantAction('Bắt đầu')}
              activeOpacity={0.85}>
              <Text style={styles.primaryPillBtnText}>Bắt đầu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryPillBtn}
              onPress={() => handleAssistantAction('Thiết lập mục tiêu')}
              activeOpacity={0.8}>
              <Ionicons name="calculator-outline" size={15} color="#334155" />
              <Text style={styles.secondaryPillBtnText}>Thiết lập mục tiêu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryPillBtn}
              onPress={() => handleAssistantAction('Lên kế hoạch')}
              activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={15} color="#334155" />
              <Text style={styles.secondaryPillBtnText}>Lên kế hoạch</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 7. LOWER CONTENT CARDS */}
        <View style={styles.lowerCardsRow}>
          {/* Card 1: Glycemic Load (GL) */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoCardTitle}>Tải đường huyết</Text>
              <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>Thấp</Text>
              </View>
            </View>
            <Text style={styles.infoCardBigValue}>
              0 <Text style={styles.infoCardUnit}>GL (Tổng)</Text>
            </Text>
          </View>

          {/* Card 2: Health Physical Metrics (Module A data) */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoCardTitle}>Thể trạng BMI</Text>
              <View style={[styles.badgePill, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.badgePillText, { color: '#059669' }]}>Chuẩn</Text>
              </View>
            </View>
            <Text style={styles.infoCardBigValue}>
              {health?.bmi ? health.bmi.toFixed(1) : '--'}{' '}
              <Text style={styles.infoCardUnit}>
                {user?.weight_kg ? `(${user.weight_kg}kg)` : ''}
              </Text>
            </Text>
          </View>
        </View>

        {/* 8. DAILY PLAN SECTION */}
        <View style={styles.planSection}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Kế hoạch hôm nay</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/diary')}>
              <Text style={styles.planLink}>Chi tiết</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planEmptyCard}>
            <View style={styles.planIconContainer}>
              <MaterialCommunityIcons name="calendar-check" size={48} color="#94A3B8" />
            </View>

            <Text style={styles.planEmptyTitle}>Hôm nay bạn chưa có kế hoạch</Text>
            <Text style={styles.planEmptyText}>
              Lên kế hoạch bữa ăn và hoạt động để bắt đầu ngày mới.
            </Text>

            <TouchableOpacity style={styles.planButton} activeOpacity={0.85} onPress={() => router.push('/(tabs)/diary')}>
              <Text style={styles.planButtonText}>Lên kế hoạch</Text>
              <Ionicons name="chevron-forward" size={18} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* QUICK ACTIONS BOTTOM SHEET MODAL */}
      <QuickActionsModal
        visible={showQuickActions}
        onClose={() => setShowQuickActions(false)}
      />
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    marginLeft: 2,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  notifActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0284C7',
    paddingHorizontal: 4,
  },
  notifCloseBtn: {
    padding: 4,
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F2644',
    letterSpacing: -0.3,
  },
  greetingGoal: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
  },
  diaryBadgeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  calorieRingContainer: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieRingOuter: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 9,
    borderColor: '#F1F5F9',
    borderTopColor: '#F59E0B',
    borderRightColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calorieRingDot: {
    position: 'absolute',
    top: -2,
    right: 22,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
  },
  calorieRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieNumber: {
    fontSize: 21,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: -0.5,
  },
  calorieLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  calorieBreakdown: {
    flex: 1,
    paddingLeft: 20,
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  macroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  macroCol: {
    flex: 1,
  },
  macroName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  macroProgressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  assistantCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  assistantTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  assistantAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  assistantTextWrapper: {
    flex: 1,
  },
  assistantTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#065F46',
  },
  assistantSubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  assistantBtnRow: {
    gap: 8,
    paddingTop: 2,
  },
  primaryPillBtn: {
    backgroundColor: '#34D399',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryPillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  lowerCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  infoCardTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  badgePill: {
    marginLeft: 'auto',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  infoCardBigValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoCardUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  planSection: {
    marginTop: 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  planLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
  },
  planEmptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  planEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  planEmptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
});
