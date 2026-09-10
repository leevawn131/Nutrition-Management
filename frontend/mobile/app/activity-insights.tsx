import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MetricProps = {
  label: string;
  value: string;
  target: string;
};

function ProgressMetric({ label, value, target }: MetricProps) {
  return <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.metricDetails}>
      <Text style={styles.metricValue}><Text style={styles.metricValueStrong}>{value}</Text> <Text style={styles.metricTarget}>({target})</Text></Text>
      <View style={styles.progressTrack} />
      <View style={styles.warningRow}>
        <Text style={styles.warningText}>Chưa đạt khuyến nghị</Text>
        <View style={styles.warningIcon}><Text style={styles.warningMark}>!</Text></View>
      </View>
    </View>
  </View>;
}

function ActivitySection() {
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>Vận động thể chất</Text>
    <Text style={styles.sectionDescription}>Khuyến nghị WHO: 150–300 phút hoạt động cường độ vừa/tuần (≈21–43 phút/ngày). Kiểm tra kế hoạch hôm nay.</Text>
    <ProgressMetric label="Tổng hoạt động" value="0 hoạt động" target="0% mục tiêu" />
    <ProgressMetric label="Thời lượng vận động" value="0 phút" target="0% mục tiêu" />
    <ProgressMetric label="Kcal tiêu hao dự kiến" value="0 kcal" target="0% mục tiêu" />
  </View>;
}

function RecoverySection() {
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>Ngủ nghỉ &amp; Bù nước</Text>
    <Text style={styles.sectionDescription}>National Sleep Foundation: 7–9 giờ ngủ/đêm. EFSA: 2000ml nước/ngày cho người trưởng thành.</Text>
    <ProgressMetric label="Giấc ngủ dự kiến" value="0.0 giờ" target="0% mục tiêu" />
    <ProgressMetric label="Nước bổ sung" value="0 ml" target="0% mục tiêu" />
  </View>;
}

export default function ActivityInsightsScreen() {
  const router = useRouter();

  return <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
        <Ionicons name="arrow-back" size={24} color="#10294B" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Phân tích hoạt động</Text>
      <View style={styles.headerSpacer} />
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ActivitySection />
      <RecoverySection />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lời khuyên</Text>
        <Text style={styles.sectionDescription}>Dựa trên khuyến nghị WHO, ACSM và Hội Giấc ngủ Quốc gia.</Text>
        <View style={styles.adviceCard}>
          <MaterialCommunityIcons name="arm-flex-outline" size={28} color="#F59E0B" />
          <Text style={styles.adviceText}>WHO khuyến nghị tối thiểu 21 phút vận động cường độ vừa/ngày. Hãy thêm hoạt động vào kế hoạch!</Text>
        </View>
      </View>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Tuyên bố miễn trừ trách nhiệm: Thông tin phân tích dựa trên khuyến nghị chung của WHO và ACSM. Vui lòng tham khảo ý kiến bác sĩ hoặc chuyên gia trước khi thay đổi chế độ vận động.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 82, borderBottomWidth: 1, borderBottomColor: '#F0F1F3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 18 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 25, fontWeight: '500', color: '#10294B' },
  headerSpacer: { width: 48 },
  content: { paddingTop: 34, paddingBottom: 48 },
  section: { paddingHorizontal: 32, paddingBottom: 30, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#F1F2F3' },
  sectionTitle: { fontSize: 27, lineHeight: 34, fontWeight: '800', color: '#10294B', marginBottom: 6 },
  sectionDescription: { fontSize: 19, lineHeight: 29, color: '#A1A8B2', marginBottom: 24 },
  metricRow: { flexDirection: 'row', minHeight: 112, marginBottom: 8 },
  metricLabel: { width: '39%', fontSize: 23, lineHeight: 31, color: '#10294B', paddingTop: 7 },
  metricDetails: { flex: 1 },
  metricValue: { textAlign: 'right', fontSize: 20, color: '#64748B', marginBottom: 12 },
  metricValueStrong: { color: '#10294B', fontWeight: '800' },
  metricTarget: { color: '#64748B' },
  progressTrack: { height: 15, borderRadius: 8, backgroundColor: '#F0F1F3' },
  warningRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 10 },
  warningText: { fontSize: 18, color: '#A1A8B2' },
  warningIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF6256', alignItems: 'center', justifyContent: 'center' },
  warningMark: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  adviceCard: { borderRadius: 20, backgroundColor: '#FFF0F0', paddingHorizontal: 24, paddingVertical: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  adviceText: { flex: 1, fontSize: 21, lineHeight: 30, color: '#10294B' },
  disclaimer: { paddingHorizontal: 32, paddingTop: 36 },
  disclaimerText: { fontSize: 17, lineHeight: 26, color: '#A1A8B2' },
});
