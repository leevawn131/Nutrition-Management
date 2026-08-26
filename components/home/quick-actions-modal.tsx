import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface OtherFeatureItem {
  id: string;
  title: string;
  iconName: string;
  iconType: 'mci' | 'fa6' | 'ion';
  bgColor: string;
  iconColor: string;
}

const OTHER_FEATURES: OtherFeatureItem[] = [
  {
    id: 'plan',
    title: 'Kế hoạch của bạn',
    iconName: 'calendar-month-outline',
    iconType: 'mci',
    bgColor: '#CCFBF1',
    iconColor: '#0F766E',
  },
  {
    id: 'family',
    title: 'Chăm sóc gia đình',
    iconName: 'account-group-outline',
    iconType: 'mci',
    bgColor: '#FCE7F3',
    iconColor: '#BE185D',
  },
  {
    id: 'devices',
    title: 'Quản lý thiết bị',
    iconName: 'watch',
    iconType: 'ion',
    bgColor: '#E0F2FE',
    iconColor: '#0369A1',
  },
  {
    id: 'groceries',
    title: 'Giỏ đi chợ',
    iconName: 'basket-outline',
    iconType: 'mci',
    bgColor: '#FEF3C7',
    iconColor: '#B45309',
  },
  {
    id: 'store',
    title: 'Gian hàng thiết bị',
    iconName: 'shopping-outline',
    iconType: 'mci',
    bgColor: '#F3E8FF',
    iconColor: '#7E22CE',
  },
  {
    id: 'assistant',
    title: 'Trợ lý sức khoẻ',
    iconName: 'wand-magic-sparkles',
    iconType: 'fa6',
    bgColor: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 'journey',
    title: 'Hành trình của bạn',
    iconName: 'trophy-outline',
    iconType: 'mci',
    bgColor: '#FEF9C3',
    iconColor: '#A16207',
  },
];

export function QuickActionsModal({ visible, onClose }: QuickActionsModalProps) {
  const insets = useSafeAreaInsets();

  const handleFeaturePress = (title: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    Alert.alert(title, 'Tính năng đang được hoàn thiện và sẽ sớm ra mắt trong các bản cập nhật tới!');
  };

  const handleQuickRecord = (type: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    onClose();
    
    if (type === 'Bữa ăn') {
      // Import useRouter ở trên
      const { router } = require('expo-router');
      router.push('/meal/ai-vision');
    } else {
      Alert.alert(
        `Ghi nhận ${type}`,
        `Tính năng ghi nhận ${type} thuộc Module chuyên trách và sẽ sớm kết nối trực tiếp!`
      );
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              {/* Drag Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* SECTION 1: TÍNH NĂNG KHÁC */}
              <Text style={styles.sectionHeader}>TÍNH NĂNG KHÁC</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuresScrollContent}>
                {OTHER_FEATURES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.featureItem}
                    onPress={() => handleFeaturePress(item.title)}
                    activeOpacity={0.7}>
                    <View style={[styles.featureIconBox, { backgroundColor: item.bgColor }]}>
                      {item.iconType === 'mci' && (
                        <MaterialCommunityIcons name={item.iconName as any} size={24} color={item.iconColor} />
                      )}
                      {item.iconType === 'fa6' && (
                        <FontAwesome6 name={item.iconName as any} size={20} color={item.iconColor} />
                      )}
                      {item.iconType === 'ion' && (
                        <Ionicons name={item.iconName as any} size={22} color={item.iconColor} />
                      )}
                    </View>
                    <Text style={styles.featureTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* SECTION 2: GHI NHẬN NHANH */}
              <Text style={[styles.sectionHeader, { marginTop: 24 }]}>GHI NHẬN NHANH</Text>
              <View style={styles.quickRecordRow}>
                {/* 1. Bữa ăn */}
                <TouchableOpacity
                  style={[styles.recordCard, { backgroundColor: '#F59E0B' }]}
                  onPress={() => handleQuickRecord('Bữa ăn')}
                  activeOpacity={0.88}>
                  <View style={styles.recordIconCircle}>
                    <FontAwesome6 name="utensils" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.recordCardTitle}>Bữa ăn</Text>
                </TouchableOpacity>

                {/* 2. Hoạt động */}
                <TouchableOpacity
                  style={[styles.recordCard, { backgroundColor: '#3B82F6' }]}
                  onPress={() => handleQuickRecord('Hoạt động')}
                  activeOpacity={0.88}>
                  <View style={styles.recordIconCircle}>
                    <Ionicons name="flame" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={styles.recordCardTitle}>Hoạt động</Text>
                </TouchableOpacity>

                {/* 3. Cân nặng */}
                <TouchableOpacity
                  style={[styles.recordCard, { backgroundColor: '#10B981' }]}
                  onPress={() => handleQuickRecord('Cân nặng')}
                  activeOpacity={0.88}>
                  <View style={styles.recordIconCircle}>
                    <MaterialCommunityIcons name="scale-bathroom" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={styles.recordCardTitle}>Cân nặng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)', // Dimmed dark slate background
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 14,
    marginLeft: 4,
  },
  featuresScrollContent: {
    gap: 16,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  featureItem: {
    width: 76,
    alignItems: 'center',
  },
  featureIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 15,
  },
  quickRecordRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  recordCard: {
    flex: 1,
    height: 106,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  recordIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
