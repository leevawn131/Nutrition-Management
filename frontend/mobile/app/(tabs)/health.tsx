import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthToken, getCachedUser } from '@/services/storage.service';
import { userService } from '@/services/user.service';
import { User } from '@/types/auth.types';

export default function HealthScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Weight update modal state
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await getCachedUser();
      if (cached) setUser(cached);
      const token = await getAuthToken();
      if (token) {
        const freshUser = await userService.getProfile(token);
        if (freshUser) setUser(freshUser);
      }
    } catch (err) {
      console.warn('Error loading health profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const handleOpenWeightModal = () => {
    setNewWeight(user?.weight_kg ? String(user.weight_kg) : '65');
    setWeightModalVisible(true);
  };

  const handleSaveWeight = async () => {
    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum) || weightNum <= 20 || weightNum > 300) {
      Alert.alert('Không hợp lệ', 'Vui lòng nhập cân nặng hợp lệ (20kg - 300kg)');
      return;
    }

    setIsUpdatingWeight(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const updated = await userService.updateProfile(token, {
        weight_kg: weightNum,
      });

      if (updated) {
        setUser(updated);
        setWeightModalVisible(false);
        Alert.alert('Thành công', `Đã cập nhật cân nặng thành ${weightNum} kg!`);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật cân nặng lúc này.');
    } finally {
      setIsUpdatingWeight(false);
    }
  };

  // Health Calculations based on AGENTS.md Rule 8
  const weight = user?.weight_kg || 65;
  const height = user?.height_cm || 170;
  const heightM = height / 100;
  const gender = user?.gender || 'male';

  let age = 25;
  if (user?.date_of_birth) {
    const birthYear = new Date(user.date_of_birth).getFullYear();
    if (!isNaN(birthYear)) {
      age = Math.max(10, new Date().getFullYear() - birthYear);
    }
  }

  // 1. BMI
  const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
  let bmiCategory = 'Bình thường';
  let bmiColor = '#10B981';
  let bmiDesc = 'Thể trạng cân đối, hãy duy trì lối sống hiện tại!';
  if (bmi < 18.5) {
    bmiCategory = 'Thiếu cân';
    bmiColor = '#3B82F6';
    bmiDesc = 'Cần bổ sung dinh dưỡng và tăng cường calo.';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Thừa cân';
    bmiColor = '#F59E0B';
    bmiDesc = 'Nên điều chỉnh khẩu phần và tăng cường vận động.';
  } else if (bmi >= 30) {
    bmiCategory = 'Béo phì';
    bmiColor = '#EF4444';
    bmiDesc = 'Cần kế hoạch giảm mỡ và kiểm soát calo nghiêm ngặt.';
  }

  // 2. BMR (Mifflin-St Jeor)
  let bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5));

  // 3. TDEE
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const activityFactor = activityFactors[user?.activity_level || 'moderate'] || 1.55;
  const tdee = Math.round(bmr * activityFactor);

  // 4. Macro Targets
  const targetCalories = user?.target_calories || tdee;
  const targetProtein = user?.target_protein_g || Math.round((targetCalories * 0.25) / 4);
  const targetCarb = user?.target_carb_g || Math.round((targetCalories * 0.5) / 4);
  const targetFat = user?.target_fat_g || Math.round((targetCalories * 0.25) / 9);

  const getGoalLabel = (g?: string | null) => {
    switch (g) {
      case 'lose':
      case 'lose_weight':
        return 'Giảm cân lành mạnh';
      case 'gain':
      case 'gain_weight':
        return 'Tăng cân & cơ bắp';
      case 'maintain':
        return 'Duy trì vóc dáng';
      default:
        return 'Cải thiện sức khỏe';
    }
  };

  const getActivityLabel = (level?: string | null) => {
    switch (level) {
      case 'sedentary': return 'Ít vận động (1.2)';
      case 'light': return 'Vận động nhẹ (1.375)';
      case 'moderate': return 'Vừa phải 3-5 buổi/tuần (1.55)';
      case 'active': return 'Năng động 6-7 buổi/tuần (1.725)';
      case 'very_active': return 'Rất năng động (1.9)';
      default: return 'Vừa phải (1.55)';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Sức khỏe & Thể trạng</Text>
            <Text style={styles.subtitle}>Chỉ số sinh trắc học & Mục tiêu trao đổi chất</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadUserData}
            activeOpacity={0.7}>
            <Ionicons name="sync-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Weight & Height Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatarBox}>
              <Ionicons name="body-outline" size={28} color="#059669" />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{user?.full_name || 'Người dùng'}</Text>
              <Text style={styles.heroGoal}>{getGoalLabel(user?.goal)}</Text>
            </View>
            <TouchableOpacity
              style={styles.updateWeightBtn}
              onPress={handleOpenWeightModal}
              activeOpacity={0.8}>
              <Ionicons name="scale-outline" size={16} color="#FFFFFF" />
              <Text style={styles.updateWeightText}>Đổi cân nặng</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Cân nặng</Text>
              <Text style={styles.metricItemVal}>{weight} <Text style={styles.unit}>kg</Text></Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Chiều cao</Text>
              <Text style={styles.metricItemVal}>{height} <Text style={styles.unit}>cm</Text></Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Độ tuổi</Text>
              <Text style={styles.metricItemVal}>{age} <Text style={styles.unit}>tuổi</Text></Text>
            </View>
          </View>
        </View>

        {/* BMI Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="speedometer-outline" size={22} color={bmiColor} />
              <Text style={styles.cardTitle}>Chỉ số khối cơ thể (BMI)</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${bmiColor}15` }]}>
              <Text style={[styles.badgeText, { color: bmiColor }]}>{bmiCategory}</Text>
            </View>
          </View>

          <View style={styles.bmiValueRow}>
            <Text style={[styles.bmiScore, { color: bmiColor }]}>{bmi}</Text>
            <Text style={styles.bmiUnit}>kg/m²</Text>
          </View>

          {/* BMI Visual Scale Track */}
          <View style={styles.bmiScaleTrack}>
            <View style={[styles.bmiSegment, { backgroundColor: '#3B82F6', flex: 18.5 }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#10B981', flex: 6.4 }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#F59E0B', flex: 5.1 }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#EF4444', flex: 10 }]} />
          </View>
          <View style={styles.bmiScaleLabels}>
            <Text style={styles.bmiScaleLabel}>18.5</Text>
            <Text style={styles.bmiScaleLabel}>25.0</Text>
            <Text style={styles.bmiScaleLabel}>30.0</Text>
          </View>

          <Text style={styles.cardDesc}>{bmiDesc}</Text>
        </View>

        {/* Energy Metabolism Cards: BMR, TDEE, Maintenance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="flame-outline" size={22} color="#F59E0B" />
              <Text style={styles.cardTitle}>Năng lượng & Trao đổi chất</Text>
            </View>
          </View>

          <View style={styles.metabolismRow}>
            <View style={styles.metabolismBox}>
              <Text style={styles.metaLabel}>BMR (Cơ bản)</Text>
              <Text style={styles.metaValue}>{bmr}</Text>
              <Text style={styles.metaUnit}>kcal/ngày</Text>
              <Text style={styles.metaSub}>Khi nghỉ ngơi</Text>
            </View>

            <View style={styles.metabolismBox}>
              <Text style={styles.metaLabel}>TDEE (Tiêu hao)</Text>
              <Text style={styles.metaValue}>{tdee}</Text>
              <Text style={styles.metaUnit}>kcal/ngày</Text>
              <Text style={styles.metaSub}>{getActivityLabel(user?.activity_level).split(' ')[0]}</Text>
            </View>

            <View style={[styles.metabolismBox, styles.metabolismBoxHighlight]}>
              <Text style={[styles.metaLabel, { color: '#059669' }]}>Mục tiêu nạp</Text>
              <Text style={[styles.metaValue, { color: '#059669' }]}>{targetCalories}</Text>
              <Text style={[styles.metaUnit, { color: '#059669' }]}>kcal/ngày</Text>
              <Text style={[styles.metaSub, { color: '#059669' }]}>Mục tiêu ngày</Text>
            </View>
          </View>
        </View>

        {/* Macro Targets Distribution */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="chart-pie" size={22} color="#3B82F6" />
              <Text style={styles.cardTitle}>Tỷ lệ dinh dưỡng đa lượng (Macros)</Text>
            </View>
          </View>

          <View style={styles.macrosList}>
            {/* Protein */}
            <View style={styles.macroCard}>
              <View style={styles.macroCardTop}>
                <View style={styles.macroTagRow}>
                  <View style={[styles.macroDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.macroCardName}>Chất đạm (Protein)</Text>
                </View>
                <Text style={styles.macroCardGrams}>{targetProtein}g</Text>
              </View>
              <Text style={styles.macroCardKcal}>
                {Math.round(targetProtein * 4)} kcal · {Math.round(((targetProtein * 4) / targetCalories) * 100)}% tổng calo
              </Text>
            </View>

            {/* Carb */}
            <View style={styles.macroCard}>
              <View style={styles.macroCardTop}>
                <View style={styles.macroTagRow}>
                  <View style={[styles.macroDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.macroCardName}>Đường bột (Carbs)</Text>
                </View>
                <Text style={styles.macroCardGrams}>{targetCarb}g</Text>
              </View>
              <Text style={styles.macroCardKcal}>
                {Math.round(targetCarb * 4)} kcal · {Math.round(((targetCarb * 4) / targetCalories) * 100)}% tổng calo
              </Text>
            </View>

            {/* Fat */}
            <View style={styles.macroCard}>
              <View style={styles.macroCardTop}>
                <View style={styles.macroTagRow}>
                  <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.macroCardName}>Chất béo (Fat)</Text>
                </View>
                <Text style={styles.macroCardGrams}>{targetFat}g</Text>
              </View>
              <Text style={styles.macroCardKcal}>
                {Math.round(targetFat * 9)} kcal · {Math.round(((targetFat * 9) / targetCalories) * 100)}% tổng calo
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/plan')}
            activeOpacity={0.8}>
            <Ionicons name="calendar" size={24} color="#10B981" />
            <Text style={styles.actionCardTitle}>Kế hoạch dinh dưỡng</Text>
            <Text style={styles.actionCardSub}>Xem & lên thực đơn theo tuần</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/habit-analysis')}
            activeOpacity={0.8}>
            <Ionicons name="analytics" size={24} color="#3B82F6" />
            <Text style={styles.actionCardTitle}>Thống kê thói quen</Text>
            <Text style={styles.actionCardSub}>Phân tích chuỗi ngày & biểu đồ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Weight Update Modal */}
      <Modal
        visible={weightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeightModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="scale" size={28} color="#059669" />
            </View>
            <Text style={styles.modalTitle}>Cập nhật cân nặng</Text>
            <Text style={styles.modalSubtitle}>
              Cân nặng mới sẽ tự động tính lại BMI, BMR, TDEE và mục tiêu calo mỗi ngày.
            </Text>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.weightInput}
                placeholder="65.0"
                keyboardType="decimal-pad"
                value={newWeight}
                onChangeText={setNewWeight}
                autoFocus
              />
              <Text style={styles.weightInputUnit}>kg</Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setWeightModalVisible(false)}
                disabled={isUpdatingWeight}>
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveWeight}
                disabled={isUpdatingWeight}>
                {isUpdatingWeight ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Lưu cân nặng</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#10294B', letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: '#64748B', marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#FAFAFB',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 17, fontWeight: '800', color: '#10294B' },
  heroGoal: { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 2 },
  updateWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  updateWeightText: { fontSize: 12.5, fontWeight: '700', color: '#FFFFFF' },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricItemLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  metricItemVal: { fontSize: 17, fontWeight: '800', color: '#10294B' },
  unit: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  metricDivider: { width: 1, backgroundColor: '#F1F5F9' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#10294B' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  bmiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 },
  bmiScore: { fontSize: 36, fontWeight: '800' },
  bmiUnit: { fontSize: 14, color: '#64748B' },
  bmiScaleTrack: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  bmiSegment: { height: '100%' },
  bmiScaleLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '15%', marginBottom: 10 },
  bmiScaleLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  metabolismRow: { flexDirection: 'row', gap: 10 },
  metabolismBox: {
    flex: 1,
    backgroundColor: '#FAFAFB',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metabolismBoxHighlight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  metaLabel: { fontSize: 11.5, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  metaValue: { fontSize: 20, fontWeight: '800', color: '#10294B' },
  metaUnit: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  metaSub: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  macrosList: { gap: 10 },
  macroCard: {
    backgroundColor: '#FAFAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  macroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  macroTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroCardName: { fontSize: 14, fontWeight: '700', color: '#10294B' },
  macroCardGrams: { fontSize: 15, fontWeight: '800', color: '#10294B' },
  macroCardKcal: { fontSize: 12, color: '#64748B' },
  actionGrid: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionCard: {
    flex: 1,
    backgroundColor: '#FAFAFB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
  },
  actionCardTitle: { fontSize: 14, fontWeight: '700', color: '#10294B' },
  actionCardSub: { fontSize: 12, color: '#64748B' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#10294B', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    width: '100%',
    marginBottom: 22,
  },
  weightInput: {
    flex: 1,
    height: 52,
    fontSize: 24,
    fontWeight: '800',
    color: '#10294B',
    textAlign: 'center',
  },
  weightInputUnit: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  modalBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  modalSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
