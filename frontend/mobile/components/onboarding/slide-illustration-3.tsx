import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { MaterialCommunityIcons, FontAwesome6, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width * 0.78, 300);

export function SlideIllustration3() {
  return (
    <View style={styles.container}>
      {/* Background Soft Pastel Circle */}
      <View style={styles.backgroundCircle} />

      {/* Community Group Card / Avatar Illustration */}
      <View style={styles.groupWrapper}>
        {/* Back Row Avatars */}
        <View style={styles.backRow}>
          {/* Back Left - Nutrition Coach */}
          <View style={[styles.avatarCard, styles.backAvatar, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="account-star" size={24} color="#EF4444" />
            <Text style={styles.avatarRole}>Coach</Text>
          </View>

          {/* Back Center - Master Dietitian */}
          <View style={[styles.avatarCard, styles.backAvatar, { backgroundColor: '#E0E7FF' }]}>
            <FontAwesome6 name="user-doctor" size={20} color="#4F46E5" />
            <Text style={styles.avatarRole}>Bác sĩ</Text>
          </View>

          {/* Back Right - Fitness & Nutrition KOL */}
          <View style={[styles.avatarCard, styles.backAvatar, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="sparkles" size={22} color="#D97706" />
            <Text style={styles.avatarRole}>KOL</Text>
          </View>
        </View>

        {/* Front Row Avatars (Main Characters in Chef/Nutritionist Coats) */}
        <View style={styles.frontRow}>
          {/* Front Left - Healthy Recipe Creator */}
          <View style={[styles.mainCard, { borderColor: '#10B981' }]}>
            <View style={styles.chefHatMini}>
              <MaterialCommunityIcons name="chef-hat" size={20} color="#059669" />
            </View>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account-heart" size={26} color="#059669" />
            </View>
            <Text style={styles.mainCardTitle}>Home Chef</Text>
          </View>

          {/* Front Center - Lead Nutrition Specialist */}
          <View style={[styles.mainCard, styles.leadCard, { borderColor: '#3B82F6' }]}>
            <View style={styles.starBadge}>
              <Ionicons name="star" size={12} color="#FFFFFF" />
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: '#EFF6FF' }]}>
              <FontAwesome6 name="user-graduate" size={24} color="#2563EB" />
            </View>
            <Text style={[styles.mainCardTitle, { color: '#1D4ED8', fontWeight: '800' }]}>
              Chuyên Gia
            </Text>
          </View>

          {/* Front Right - Wellness Influencer */}
          <View style={[styles.mainCard, { borderColor: '#EC4899' }]}>
            <View style={styles.chefHatMini}>
              <Ionicons name="heart" size={18} color="#DB2777" />
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: '#FDF2F8' }]}>
              <MaterialCommunityIcons name="account-group" size={26} color="#DB2777" />
            </View>
            <Text style={styles.mainCardTitle}>Cộng Đồng</Text>
          </View>
        </View>
      </View>

      {/* Floating Badges */}
      <View style={[styles.floatingBadge, styles.badgeTopLeft]}>
        <Ionicons name="people" size={15} color="#2563EB" />
        <Text style={styles.badgeText}>50.000+ Thành viên</Text>
      </View>

      <View style={[styles.floatingBadge, styles.badgeBottomRight]}>
        <MaterialCommunityIcons name="creation" size={15} color="#D97706" />
        <Text style={styles.badgeText}>Chia sẻ công thức</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
    width: CONTAINER_SIZE * 0.78,
    height: CONTAINER_SIZE * 0.78,
    borderRadius: (CONTAINER_SIZE * 0.78) / 2,
    backgroundColor: '#FFE4E6', // Soft warm rose/peach
    opacity: 0.8,
  },
  groupWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: -16,
    zIndex: 1,
  },
  backAvatar: {
    width: 62,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    paddingTop: 2,
  },
  avatarCard: {},
  avatarRole: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  frontRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    zIndex: 5,
  },
  mainCard: {
    width: 78,
    height: 94,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    paddingVertical: 6,
    position: 'relative',
  },
  leadCard: {
    width: 86,
    height: 106,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ translateY: -4 }],
  },
  starBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#F59E0B',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chefHatMini: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mainCardTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  badgeTopLeft: {
    top: 10,
    left: -4,
  },
  badgeBottomRight: {
    bottom: -6,
    right: -4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
});
