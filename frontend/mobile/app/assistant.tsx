import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function AssistantScreen() {
  const router = useRouter();

  const handleOpenWorkflow = (prompt: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    router.push({
      pathname: '/chatbot',
      params: {
        prompt,
        autoSend: '1',
        newChat: '1',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Trợ lý AI & Khám phá</Text>
        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khám phá & Trợ lý</Text>
          <Text style={styles.headerSubtitle}>
            Đồng hành cùng AI và cộng đồng dinh dưỡng thông minh
          </Text>
        </View>

        {/* Hero Card: AI Assistant */}
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/chatbot', params: { newChat: '1' } })}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>✨ AI ASSISTANT</Text>
            </View>
            <Text style={styles.heroTitle}>Trợ lý AI Dinh dưỡng 🤖</Text>
            <Text style={styles.heroDesc}>
              Tìm công thức nấu ăn, lên thực đơn nhiều ngày và tính toán mục tiêu calo/macro tự động.
            </Text>

            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Trò chuyện cùng AI Assistant</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Workflow Cards */}
        <Text style={styles.sectionTitle}>Các luồng hỗ trợ nổi bật</Text>

        <View style={styles.grid}>
          {/* Card 1: Tìm công thức */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() => handleOpenWorkflow('Tìm công thức nấu ăn')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.cardEmoji}>🍲</Text>
            </View>
            <Text style={styles.cardTitle}>Tìm công thức</Text>
            <Text style={styles.cardDesc}>Tìm món ăn theo bữa sáng, trưa, tối hoặc mức calo mong muốn</Text>
          </TouchableOpacity>

          {/* Card 2: Lập thực đơn */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() => handleOpenWorkflow('Lập kế hoạch bữa ăn')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.cardEmoji}>📅</Text>
            </View>
            <Text style={styles.cardTitle}>Lập thực đơn</Text>
            <Text style={styles.cardDesc}>Tạo kế hoạch ăn uống 3-7 ngày cá nhân hóa theo mục tiêu</Text>
          </TouchableOpacity>

          {/* Card 3: Mục tiêu dinh dưỡng */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() => handleOpenWorkflow('Thiết lập mục tiêu dinh dưỡng')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.cardEmoji}>🎯</Text>
            </View>
            <Text style={styles.cardTitle}>Mục tiêu dinh dưỡng</Text>
            <Text style={styles.cardDesc}>Tính BMR, TDEE, calo thâm hụt/thặng dư và tỷ lệ macro chuẩn</Text>
          </TouchableOpacity>

          {/* Card 4: Luyện tập */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() => handleOpenWorkflow('Luyện tập & vận động')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FCE7F3' }]}>
              <Text style={styles.cardEmoji}>🏃</Text>
            </View>
            <Text style={styles.cardTitle}>Luyện tập & Vận động</Text>
            <Text style={styles.cardDesc}>Lên lịch bài tập và hướng dẫn vận động khoa học</Text>
          </TouchableOpacity>
        </View>

        {/* Recipes Direct Link */}
        <TouchableOpacity
          style={styles.recipeBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/recipes' as any)}
        >
          <View style={styles.recipeBannerTextCol}>
            <Text style={styles.recipeBannerTitle}>Thư viện công thức món ăn</Text>
            <Text style={styles.recipeBannerSub}>
              Khám phá hàng trăm món ăn dinh dưỡng đầy đủ calo và nguyên liệu
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#059669" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  navPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  heroCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroContent: {},
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: '#D1FAE5',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  recipeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  recipeBannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  recipeBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  recipeBannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
});
