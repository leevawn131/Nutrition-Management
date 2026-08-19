import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Activity = {
  id: string;
  name: string;
  calories: number;
  category: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
};

const categories = ['Tất cả', 'Tập luyện', 'Thể thao', 'Tinh thần', 'Phục hồi'];
const activities: Activity[] = [
  { id: 'cardio', name: 'Cardio / HIIT', calories: 13, category: 'Tập luyện', icon: 'run-fast', color: '#F3C35C' },
  { id: 'running', name: 'Chạy bộ', calories: 10, category: 'Tập luyện', icon: 'run', color: '#81C784' },
  { id: 'cycling', name: 'Đạp xe', calories: 6, category: 'Thể thao', icon: 'bike', color: '#9CCC65' },
  { id: 'walking', name: 'Đi bộ', calories: 4, category: 'Tập luyện', icon: 'walk', color: '#80CBC4' },
  { id: 'rope', name: 'Nhảy dây', calories: 9, category: 'Tập luyện', icon: 'jump-rope', color: '#7EAFD0' },
  { id: 'pilates', name: 'Pilates', calories: 4, category: 'Tập luyện', icon: 'human', color: '#B0BEC5' },
  { id: 'gym', name: 'Tập Gym', calories: 7, category: 'Tập luyện', icon: 'weight-lifter', color: '#F4A261' },
  { id: 'home', name: 'Tập tại nhà', calories: 5, category: 'Tập luyện', icon: 'dumbbell', color: '#F4A261' },
  { id: 'yoga', name: 'Yoga', calories: 3, category: 'Tinh thần', icon: 'yoga', color: '#90CAF9' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [selected, setSelected] = useState<string | null>(null);

  const filteredActivities = useMemo(() => activities.filter((activity) => {
    const matchesCategory = category === 'Tất cả' || activity.category === category;
    return matchesCategory && activity.name.toLowerCase().includes(search.toLowerCase());
  }), [category, search]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={24} color="#10294B" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm hoạt động</Text>
        <TouchableOpacity style={styles.headerSchedule} onPress={() => router.back()}>
          <Text style={styles.headerScheduleText}>Lên lịch</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={27} color="#64748B" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Tìm hoạt động" placeholderTextColor="#9AA2AE" style={styles.searchInput} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((item) => (
            <TouchableOpacity key={item} style={[styles.categoryChip, category === item && styles.categoryChipActive]} onPress={() => setCategory(item)}>
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{category === 'Tất cả' ? 'Tập luyện' : category}</Text>
        <View style={styles.grid}>
          {filteredActivities.map((activity) => (
            <TouchableOpacity key={activity.id} style={[styles.activityCard, selected === activity.id && styles.activityCardSelected]} onPress={() => setSelected(activity.id)} activeOpacity={0.85}>
              <View style={[styles.activityIllustration, { backgroundColor: activity.color }]}>
                <MaterialCommunityIcons name={activity.icon} size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.activityName} numberOfLines={1}>{activity.name}</Text>
              <Text style={styles.activityCalories}>{activity.calories} kcal/ph</Text>
              <View style={styles.infoIcon}><Ionicons name="information-outline" size={16} color="#B8BEC5" /></View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.scheduleButton, !selected && styles.scheduleButtonDisabled]} disabled={!selected} onPress={() => router.back()}>
          <Text style={styles.scheduleButtonText}>Lên lịch</Text>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 82, borderBottomWidth: 1, borderBottomColor: '#F0F1F3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 18 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 26, fontWeight: '500', color: '#10294B' },
  headerSchedule: { backgroundColor: '#E8FBF4', paddingHorizontal: 20, paddingVertical: 13, borderRadius: 24 },
  headerScheduleText: { color: '#49C99B', fontSize: 16, fontWeight: '800' },
  content: { padding: 32, paddingBottom: 120 },
  searchBox: { height: 100, borderWidth: 1, borderColor: '#D8DCE1', borderRadius: 18, backgroundColor: '#FAFAFB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, gap: 16, marginBottom: 24 },
  searchInput: { flex: 1, fontSize: 22, color: '#10294B' },
  categoryRow: { gap: 12, paddingBottom: 26 },
  categoryChip: { backgroundColor: '#F4F4F5', borderRadius: 28, paddingHorizontal: 28, paddingVertical: 16 },
  categoryChipActive: { backgroundColor: '#49C99B' },
  categoryText: { fontSize: 18, color: '#64748B' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#10294B', marginBottom: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22 },
  activityCard: { width: '31.5%', minHeight: 210, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', paddingTop: 28, paddingHorizontal: 8, shadowColor: '#64748B', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  activityCardSelected: { borderWidth: 2, borderColor: '#49C99B' },
  activityIllustration: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  activityName: { fontSize: 17, color: '#10294B', textAlign: 'center', marginBottom: 7 },
  activityCalories: { fontSize: 15, color: '#64748B' },
  infoIcon: { position: 'absolute', right: 12, bottom: 16, width: 24, height: 24, borderWidth: 2, borderColor: '#D7DADF', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: 32, paddingVertical: 18 },
  scheduleButton: { height: 64, borderRadius: 32, backgroundColor: '#49C99B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  scheduleButtonDisabled: { opacity: 0.55 },
  scheduleButtonText: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
});
