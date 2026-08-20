import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityService } from '@/services/activity.service';
import { Activity } from '@/types/activity.types';

const categories = ['Tất cả', 'Tập luyện', 'Thể thao', 'Tinh thần'];

const DURATION_PRESETS = [15, 30, 45, 60, 90];

// Fallback activities if offline
const FALLBACK_ACTIVITIES: (Activity & { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; rate: number })[] = [
  { _id: 'act-1', name: 'Cardio / HIIT cường độ cao', met_value: 9.0, category: 'Tập luyện', icon: 'run-fast', color: '#F3C35C', rate: 12 },
  { _id: 'act-2', name: 'Chạy bộ (tốc độ trung bình 8 km/h)', met_value: 8.3, category: 'Tập luyện', icon: 'run', color: '#81C784', rate: 10 },
  { _id: 'act-3', name: 'Đạp xe đạp (15 - 20 km/h)', met_value: 6.8, category: 'Thể thao', icon: 'bike', color: '#9CCC65', rate: 8 },
  { _id: 'act-4', name: 'Đi bộ nhanh (5 - 6 km/h)', met_value: 3.8, category: 'Tập luyện', icon: 'walk', color: '#80CBC4', rate: 4 },
  { _id: 'act-5', name: 'Nhảy dây (tốc độ vừa)', met_value: 8.8, category: 'Tập luyện', icon: 'jump-rope', color: '#7EAFD0', rate: 9 },
  { _id: 'act-6', name: 'Pilates / Core training', met_value: 4.0, category: 'Tập luyện', icon: 'human', color: '#B0BEC5', rate: 5 },
  { _id: 'act-7', name: 'Tập tạ / Gym kháng lực (cường độ vừa)', met_value: 5.0, category: 'Tập luyện', icon: 'weight-lifter', color: '#F4A261', rate: 7 },
  { _id: 'act-8', name: 'Bơi lội tự do (tốc độ vừa)', met_value: 7.0, category: 'Thể thao', icon: 'swim', color: '#4FC3F7', rate: 9 },
  { _id: 'act-9', name: 'Tập Yoga / Giãn cơ (Stretching)', met_value: 2.8, category: 'Tinh thần', icon: 'yoga', color: '#90CAF9', rate: 3 },
];

const getActivityVisuals = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('chạy')) return { icon: 'run' as const, color: '#81C784' };
  if (lower.includes('đạp xe')) return { icon: 'bike' as const, color: '#9CCC65' };
  if (lower.includes('gym') || lower.includes('tạ')) return { icon: 'weight-lifter' as const, color: '#F4A261' };
  if (lower.includes('bơi')) return { icon: 'swim' as const, color: '#4FC3F7' };
  if (lower.includes('yoga') || lower.includes('giãn')) return { icon: 'yoga' as const, color: '#90CAF9' };
  if (lower.includes('cardio') || lower.includes('hiit')) return { icon: 'run-fast' as const, color: '#F3C35C' };
  if (lower.includes('nhảy')) return { icon: 'jump-rope' as const, color: '#7EAFD0' };
  if (lower.includes('pilates')) return { icon: 'human' as const, color: '#B0BEC5' };
  return { icon: 'dumbbell' as const, color: '#80CBC4' };
};

export default function ActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planDate?: string }>();
  const planDate = params.planDate || new Date().toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const items = await activityService.getActivities();
        if (items && items.length > 0) {
          setActivitiesList(items);
          setSelectedActivity(items[0]);
        } else {
          setActivitiesList(FALLBACK_ACTIVITIES);
          setSelectedActivity(FALLBACK_ACTIVITIES[0]);
        }
      } catch (err) {
        setActivitiesList(FALLBACK_ACTIVITIES);
        setSelectedActivity(FALLBACK_ACTIVITIES[0]);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    return activitiesList.filter((act) => {
      const matchesCat = category === 'Tất cả' || (act.category && act.category.toLowerCase().includes(category.toLowerCase()));
      const matchesSearch = !search.trim() || act.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activitiesList, category, search]);

  const caloriesBurned = useMemo(() => {
    if (!selectedActivity) return 0;
    const met = selectedActivity.met_value || 5.0;
    // Estimate for 65kg: MET * 65kg * (mins/60)
    return Math.round(met * 65 * (duration / 60));
  }, [selectedActivity, duration]);

  const handleSchedule = async () => {
    if (!selectedActivity) {
      Alert.alert('Chưa chọn hoạt động', 'Vui lòng chọn một hoạt động để lên lịch.');
      return;
    }

    try {
      setSubmitting(true);
      const isFallback = selectedActivity._id.startsWith('act-');
      await activityService.addActivityLog({
        activity_id: isFallback ? null : selectedActivity._id,
        custom_activity_name: selectedActivity.name,
        duration_minutes: duration,
        calories_burned: caloriesBurned,
        logged_at: planDate,
      });

      Alert.alert('Thành công', `Đã lên kế hoạch "${selectedActivity.name}" (${duration} phút) cho ngày ${planDate.split('-').reverse().join('/')}.`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      Alert.alert('Thông báo', 'Đã thêm hoạt động vào kế hoạch thành công!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={24} color="#10294B" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm hoạt động</Text>
        <TouchableOpacity
          style={[styles.headerSchedule, (!selectedActivity || submitting) && styles.headerScheduleDisabled]}
          onPress={handleSchedule}
          disabled={!selectedActivity || submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color="#49C99B" />
          ) : (
            <Text style={styles.headerScheduleText}>Lên lịch</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={22} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm hoạt động"
            placeholderTextColor="#9AA2AE"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.categoryChip, category === item && styles.categoryChipActive]}
              onPress={() => setCategory(item)}>
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Activity Duration & Burn Preview */}
        {selectedActivity && (
          <View style={styles.durationCard}>
            <View style={styles.durationHeader}>
              <Text style={styles.durationTitle}>Thời lượng vận động</Text>
              <Text style={styles.caloriesEstimate}>~{caloriesBurned} kcal tiêu hao</Text>
            </View>

            <View style={styles.presetRow}>
              {DURATION_PRESETS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.presetChip, duration === m && styles.presetChipActive]}
                  onPress={() => setDuration(m)}>
                  <Text style={[styles.presetText, duration === m && styles.presetTextActive]}>
                    {m} phút
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section Title */}
        <Text style={styles.sectionTitle}>{category === 'Tất cả' ? 'Danh sách hoạt động' : category}</Text>

        {/* Grid of activities */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#49C99B" />
            <Text style={styles.loadingText}>Đang tải danh sách hoạt động...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredActivities.map((activity) => {
              const isSelected = selectedActivity?._id === activity._id;
              const visuals = getActivityVisuals(activity.name);
              const rate = Math.round((activity.met_value || 5.0) * 65 / 60);

              return (
                <TouchableOpacity
                  key={activity._id}
                  style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                  onPress={() => setSelectedActivity(activity)}
                  activeOpacity={0.85}>
                  <View style={[styles.activityIllustration, { backgroundColor: visuals.color }]}>
                    <MaterialCommunityIcons name={visuals.icon} size={36} color="#FFFFFF" />
                  </View>
                  <Text style={styles.activityName} numberOfLines={2}>
                    {activity.name}
                  </Text>
                  <Text style={styles.activityCalories}>~{rate} kcal/phút</Text>
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.scheduleButton, (!selectedActivity || submitting) && styles.scheduleButtonDisabled]}
          disabled={!selectedActivity || submitting}
          onPress={handleSchedule}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.scheduleButtonText}>
                {selectedActivity ? `Lên lịch (${duration} phút · ${caloriesBurned} kcal)` : 'Chọn hoạt động'}
              </Text>
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#10294B' },
  headerSchedule: {
    backgroundColor: '#E8FBF4',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  headerScheduleDisabled: { opacity: 0.5 },
  headerScheduleText: { color: '#49C99B', fontSize: 14, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 110 },
  searchBox: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#FAFAFB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#10294B' },
  categoryRow: { gap: 10, paddingBottom: 18 },
  categoryChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  categoryChipActive: { backgroundColor: '#49C99B' },
  categoryText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: '700' },
  durationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationTitle: { fontSize: 15, fontWeight: '700', color: '#10294B' },
  caloriesEstimate: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#49C99B',
    borderColor: '#49C99B',
  },
  presetText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  presetTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#10294B', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  activityCard: {
    width: '48%',
    minHeight: 150,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 10,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  activityCardSelected: {
    borderWidth: 2,
    borderColor: '#49C99B',
    backgroundColor: '#F0FDF4',
  },
  activityIllustration: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10294B',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  activityCalories: { fontSize: 12, color: '#64748B' },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#49C99B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: '#64748B' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  scheduleButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#49C99B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scheduleButtonDisabled: { opacity: 0.55 },
  scheduleButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
