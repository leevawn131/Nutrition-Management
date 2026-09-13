import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NutritionItem = {
  name: string;
  amount: string;
  unit: string;
  dailyValue: string;
  warning?: boolean;
};

const vitamins: NutritionItem[] = [
  { name: 'Vitamin A', amount: '0.0', unit: 'mcg', dailyValue: '0.0% DV' },
  { name: 'Vitamin D', amount: '0.0', unit: 'mcg', dailyValue: '0.0% DV' },
  { name: 'Vitamin E', amount: '0.0', unit: 'mg', dailyValue: '0.0% DV' },
  { name: 'Vitamin K', amount: '0', unit: 'mg', dailyValue: '0.0% DV', warning: true },
  { name: 'Vitamin C', amount: '0.0', unit: 'mcg', dailyValue: '0.0% DV', warning: true },
  { name: 'Acid Folic', amount: '0.0', unit: 'µg', dailyValue: '0.0% DV', warning: true },
  { name: 'Vitamin B12', amount: '0.0', unit: 'µg', dailyValue: '0.0% DV', warning: true },
];

const minerals: NutritionItem[] = [
  { name: 'Canxi', amount: '0', unit: 'mg', dailyValue: '0.0% DV', warning: true },
  { name: 'Sắt', amount: '0', unit: 'mg', dailyValue: '0.0% DV', warning: true },
  { name: 'Kẽm', amount: '0', unit: 'mg', dailyValue: '0.0% DV', warning: true },
  { name: 'Magiê', amount: '0', unit: 'mg', dailyValue: '0.0% DV', warning: true },
];

const beneficial: NutritionItem[] = [
  { name: 'Chất đạm', amount: '0.0', unit: 'g', dailyValue: '0.0% DV', warning: true },
  { name: 'Chất xơ', amount: '0.0', unit: 'g', dailyValue: '0.0% DV', warning: true },
  { name: 'Kali', amount: '0', unit: 'mg', dailyValue: '0.0% DV', warning: true },
];

function NutritionSection({ title, description, items }: { title: string; description: string; items: NutritionItem[] }) {
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionDescription}>{description}</Text>
    {items.map((item) => <NutritionRow key={item.name} item={item} />)}
  </View>;
}

function NutritionRow({ item }: { item: NutritionItem }) {
  return <View style={styles.nutritionRow}>
    <Text style={styles.nutritionName}>{item.name}</Text>
    <View style={styles.nutritionDetails}>
      <View style={styles.progressTrack} />
      <Text style={styles.nutritionValue}><Text style={styles.nutritionValueStrong}>{item.amount} {item.unit}</Text> <Text style={styles.dailyValue}>({item.dailyValue})</Text></Text>
      {item.warning && <View style={styles.warningRow}><Text style={styles.warningText}>Ngưỡng nguy hiểm</Text><View style={styles.warningIcon}><Text style={styles.warningMark}>!</Text></View></View>}
    </View>
  </View>;
}

export default function NutritionScreen() {
  const router = useRouter();

  return <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
        <Ionicons name="arrow-back" size={24} color="#10294B" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Thông tin dinh dưỡng</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Năng lượng</Text>
        <Text style={styles.sectionDescription}>Các chất dinh dưỡng thiết yếu cần thiết cho sự phát triển và duy trì các chức năng cơ thể khỏe mạnh.</Text>
        <View style={styles.energyChart}>
          <View style={styles.energyArc} />
          <View style={styles.energyValue}><Text style={styles.energyNumber}>0</Text><Text style={styles.energyUnit}>/ 1492 kcal</Text></View>
        </View>
        <Text style={styles.glTitle}>Chỉ số tải đường huyết (Glycemic Load index): <Text style={styles.glValue}>0</Text></Text>
        <View style={styles.glScale}><View style={[styles.glSegment, styles.glLow]} /><View style={[styles.glSegment, styles.glMedium]} /><View style={[styles.glSegment, styles.glHigh]} /></View>
        <View style={styles.glLabels}><Text style={styles.glLowText}>80</Text><Text style={styles.glHighText}>120</Text></View>
        <TouchableOpacity style={styles.glInfoButton}><Text style={styles.glInfoText}>What is Glycemic Load (GL)?</Text></TouchableOpacity>
      </View>

      <NutritionSection title="Chất dinh dưỡng có lợi" description="Các chất dinh dưỡng mà việc tiêu thụ ở mức khuyến nghị hoặc cao hơn (trong giới hạn hợp lý) sẽ mang lại lợi ích cho sức khỏe, như hỗ trợ chức năng cơ thể, phòng ngừa bệnh tật, và cải thiện sức khỏe tổng thể." items={beneficial} />
      <NutritionSection title="Vitamin" description="Các vitamin thiết yếu giúp cơ thể duy trì hoạt động khỏe mạnh mỗi ngày." items={vitamins} />
      <NutritionSection title="Khoáng chất" description="Các chất dinh dưỡng thiết yếu cần thiết cho sự phát triển và duy trì các chức năng cơ thể khỏe mạnh." items={minerals} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 82, borderBottomWidth: 1, borderBottomColor: '#F0F1F3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 18 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 25, fontWeight: '500', color: '#10294B' },
  content: { paddingHorizontal: 32, paddingTop: 34, paddingBottom: 48 },
  section: { marginBottom: 42 },
  sectionTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: '#10294B', marginBottom: 6 },
  sectionDescription: { fontSize: 20, lineHeight: 29, color: '#A1A8B2', marginBottom: 24 },
  energyChart: { height: 190, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 24 },
  energyArc: { position: 'absolute', bottom: 36, width: '100%', height: 150, borderWidth: 20, borderBottomColor: 'transparent', borderLeftColor: '#DDE1E6', borderRightColor: '#DDE1E6', borderTopColor: '#DDE1E6', borderRadius: 180 },
  energyValue: { flexDirection: 'row', alignItems: 'baseline', zIndex: 1, marginBottom: 36 },
  energyNumber: { fontSize: 62, fontWeight: '800', color: '#EF6256' },
  energyUnit: { fontSize: 24, color: '#64748B', marginLeft: 8 },
  glTitle: { fontSize: 21, lineHeight: 29, color: '#10294B', marginBottom: 22 },
  glValue: { fontWeight: '800' },
  glScale: { flexDirection: 'row', height: 9, marginHorizontal: 16 },
  glSegment: { flex: 1 },
  glLow: { backgroundColor: '#49C99B' },
  glMedium: { backgroundColor: '#F2C632' },
  glHigh: { backgroundColor: '#EF6256' },
  glLabels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  glLowText: { color: '#49C99B', fontSize: 20 },
  glHighText: { color: '#EF6256', fontSize: 20 },
  glInfoButton: { alignSelf: 'flex-start', backgroundColor: '#F4F4F5', paddingHorizontal: 52, paddingVertical: 14, borderRadius: 26, marginTop: 24 },
  glInfoText: { color: '#10294B', fontSize: 20, fontWeight: '600' },
  nutritionRow: { flexDirection: 'row', minHeight: 102, marginBottom: 16 },
  nutritionName: { width: '39%', fontSize: 23, color: '#10294B', paddingTop: 6 },
  nutritionDetails: { flex: 1 },
  progressTrack: { height: 15, backgroundColor: '#F0F1F3', borderRadius: 8, marginBottom: 12 },
  nutritionValue: { textAlign: 'right', fontSize: 20, color: '#64748B' },
  nutritionValueStrong: { color: '#10294B', fontWeight: '800' },
  dailyValue: { color: '#64748B' },
  warningRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 8 },
  warningText: { fontSize: 18, color: '#A1A8B2' },
  warningIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF6256', alignItems: 'center', justifyContent: 'center' },
  warningMark: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
});
