import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import {
  gamificationService,
  GamificationOverviewData,
  DailyMission,
  BadgeItem,
  StreakDay,
} from '@/services/gamification.service';

export default function JourneyScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<GamificationOverviewData | null>(null);

  // Modals
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
  const [referralModalVisible, setReferralModalVisible] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [friendCodeInput, setFriendCodeInput] = useState<string>('');
  const [submittingReferral, setSubmittingReferral] = useState<boolean>(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await gamificationService.getOverview();
      if (res) {
        setData(res);
      }
    } catch (e) {
      console.warn('Error fetching gamification data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Luôn làm mới dữ liệu khi người dùng quay lại màn hình Hành Trình
  useFocusEffect(
    useCallback(() => {
      fetchOverview();
    }, [fetchOverview])
  );

  // Handle Daily Checkin
  const handleCheckIn = async () => {
    const res = await gamificationService.checkInToday();
    if (res.success) {
      Alert.alert('Thành công! 🎉', `Bạn đã nhận được ${res.pointsAwarded || 5} điểm danh hôm nay!`);
      fetchOverview();
    } else {
      Alert.alert('Thông báo', res.message || 'Bạn đã điểm danh hôm nay rồi!');
    }
  };

  // Handle Mission Claim
  const handleClaimMission = async (mission: DailyMission) => {
    if (!mission.completed || mission.claimed) return;
    const res = await gamificationService.claimMissionReward(mission.id);
    if (res.success) {
      Alert.alert('Chúc mừng! 🎉', `Bạn đã nhận được +${res.pointsAwarded || 10} điểm thưởng!`);
      fetchOverview();
    } else {
      Alert.alert('Thông báo', res.message || 'Chưa thể nhận điểm');
    }
  };

  // Handle Mission Tap (hướng dẫn hoặc nhận thưởng)
  const handlePressMission = (mission: DailyMission) => {
    if (mission.completed && !mission.claimed) {
      handleClaimMission(mission);
    } else if (mission.claimed) {
      Alert.alert('Nhiệm vụ ngày', `Bạn đã hoàn thành và nhận thưởng nhiệm vụ "${mission.title}" hôm nay rồi!`);
    } else {
      const remaining = Math.max(0, mission.target - mission.current);
      Alert.alert(
        'Nhiệm vụ hôm nay',
        `Nhiệm vụ: ${mission.title}\nTiến độ: ${mission.current}/${mission.target} ${mission.unit || ''}.\nCòn thiếu ${remaining} để hoàn thành và nhận +${mission.points} điểm thưởng!`
      );
    }
  };

  // Handle Claim Badge (Nhận danh hiệu khi đủ điều kiện)
  const handleClaimBadge = async (badge: BadgeItem) => {
    if (badge.unlocked) {
      Alert.alert('Thông báo', `Bạn đã sở hữu danh hiệu "${badge.name}" rồi!`);
      return;
    }
    if (!badge.canClaim) {
      Alert.alert('Chưa đủ điều kiện', `Bạn chưa đạt điều kiện mở khoá danh hiệu này.\n${badge.progressText}`);
      return;
    }

    const res = await gamificationService.claimBadge(badge.id);
    if (res.success) {
      Alert.alert(
        'Chúc mừng! 🏆🎉',
        res.message || `Bạn đã nhận được danh hiệu "${badge.name}" và +${badge.points} điểm thưởng!`
      );
      setSelectedBadge(null);
      fetchOverview();
    } else {
      Alert.alert('Thông báo', res.message || 'Chưa thể nhận danh hiệu');
    }
  };

  // Handle Copy Referral Code
  const handleCopyCode = async () => {
    if (!data?.referral_code) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(data.referral_code);
      }
    } catch {}
    Alert.alert('Đã sao chép! 📋', `Mã giới thiệu "${data.referral_code}" đã được sao chép.`);
  };

  // Handle Share Referral Code
  const handleShareCode = async () => {
    if (!data?.referral_code) return;
    try {
      await Share.share({
        message: `Tham gia cùng tôi trên ứng dụng Dinh Dưỡng Thông Minh the.Meal! Nhập mã giới thiệu của tôi: ${data.referral_code} để cả hai cùng nhận 50 điểm thưởng nhé!`,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  // Handle Submit Friend Code
  const handleApplyFriendCode = async () => {
    if (!friendCodeInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã giới thiệu của bạn bè');
      return;
    }
    setSubmittingReferral(true);
    const res = await gamificationService.applyReferralCode(friendCodeInput);
    setSubmittingReferral(false);

    if (res.success) {
      Alert.alert('Thành công! 🎉', res.message);
      setFriendCodeInput('');
      setReferralModalVisible(false);
      fetchOverview();
    } else {
      Alert.alert('Không thành công', res.message);
    }
  };

  // Fallback / Initial State (hoàn toàn loại bỏ bước đi & giấc ngủ)
  const points = data?.points ?? 15;
  const streak = data?.current_streak ?? 1;
  const freezes = data?.freezes ?? 2;
  const referralCode = data?.referral_code ?? 'KZX0LV';
  const missions = data?.missions ?? [
    {
      id: 'checkin',
      title: 'Điểm danh hôm nay',
      icon: 'calendar-outline',
      iconBg: '#DCFCE7',
      current: 0,
      target: 1,
      points: 5,
      completed: false,
      claimed: false,
      type: 'checkin',
    },
    {
      id: 'meals',
      title: 'Ghi đủ 3 bữa hôm nay',
      icon: 'restaurant-outline',
      iconBg: '#FEF3C7',
      current: 0,
      target: 3,
      points: 10,
      completed: false,
      claimed: false,
      type: 'action',
    },
    {
      id: 'weight',
      title: 'Cập nhật cân nặng',
      icon: 'scale-outline',
      iconBg: '#EFF6FF',
      current: 0,
      target: 1,
      points: 10,
      completed: false,
      claimed: false,
      type: 'action',
    },
    {
      id: 'recipe',
      title: 'Chia sẻ 1 công thức món ăn',
      icon: 'book-outline',
      iconBg: '#F3E8FF',
      current: 0,
      target: 1,
      points: 10,
      completed: false,
      claimed: false,
      type: 'action',
    },
  ];

  const badges = data?.badges ?? [
    {
      id: 'b1',
      name: 'Người mới bắt đầu',
      description: 'Ghi nhận bữa ăn đầu tiên trên the.Meal',
      icon: '🌱',
      tier: 'Đồng' as const,
      category: 'Khám phá',
      points: 20,
      progress: 1,
      maxProgress: 1,
      progressText: '1/1 bữa ăn',
      unlocked: false,
      canClaim: true,
    },
    {
      id: 'b2',
      name: 'Người ghi chép',
      description: 'Ghi nhật ký bữa ăn trong 10 ngày',
      icon: '📝',
      tier: 'Đồng' as const,
      category: 'Ghi chép',
      points: 30,
      progress: 1,
      maxProgress: 10,
      progressText: '1/10 · còn 9 ngày có ghi bữa',
      unlocked: false,
      canClaim: false,
    },
  ];

  const calendarDays = data?.streakCalendar ?? Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    return {
      day: dayNum,
      dateString: `2026-09-${dayNum < 10 ? '0' + dayNum : dayNum}`,
      status: dayNum === 16 ? 'completed' : dayNum > 16 ? 'future' : 'missed',
      isToday: dayNum === 16,
      hasMeal: dayNum === 16,
    } as StreakDay;
  });

  const nextMilestone = data?.nextMilestone ?? { target: 7, daysLeft: 6 };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Hành trình của bạn</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => Alert.alert('Đổi quà', 'Tính năng đổi quà từ điểm tích lũy đang được liên kết với cửa hàng the.Meal!')}
            activeOpacity={0.7}>
            <Ionicons name="gift-outline" size={20} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setInfoModalVisible(true)}
            activeOpacity={0.7}>
            <Ionicons name="information-circle-outline" size={21} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 2. POINTS OVERVIEW CARD */}
        <View style={styles.pointsSection}>
          <View style={styles.pointsLeft}>
            <View style={styles.pointMedalCircle}>
              <FontAwesome6 name="medal" size={18} color="#D97706" />
            </View>
            <View>
              <Text style={styles.pointsLabel}>Điểm của bạn</Text>
              <View style={styles.pointsValueRow}>
                <Text style={styles.pointsValueText}>{points}</Text>
                <Text style={styles.pointsUnitText}> điểm</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.historyLinkBtn}
            onPress={() => router.push('/point-history')}
            activeOpacity={0.7}>
            <Text style={styles.historyLinkText}>Lịch sử</Text>
            <Ionicons name="chevron-forward" size={14} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* 3. PROMO / COUPON BANNER */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextCol}>
            <Text style={styles.promoTitle}>Bạn đủ điểm đổi 1 ưu đãi</Text>
            <Text style={styles.promoSubtitle}>
              Mã giảm giá dùng khi mua thiết bị the.Meal
            </Text>
          </View>
          <TouchableOpacity
            style={styles.redeemBtn}
            onPress={() => Alert.alert('Đổi mã ưu đãi', 'Bạn có muốn dùng 100 điểm để đổi Voucher giảm giá 50.000đ khi mua thiết bị the.Meal không?')}
            activeOpacity={0.88}>
            <Text style={styles.redeemBtnText}>Đổi ngay</Text>
          </TouchableOpacity>
        </View>

        {/* 4. DAILY MISSIONS SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderIconWrap}>
              <Ionicons name="calendar-outline" size={16} color="#10B981" />
            </View>
            <Text style={styles.sectionTitle}>Nhiệm vụ hôm nay</Text>
          </View>

          <View style={styles.missionsList}>
            {missions.map((mission) => {
              const isCheckin = mission.type === 'checkin' || mission.id === 'checkin';
              const isClaimed = mission.claimed;
              const isCompleted = mission.completed;

              return (
                <TouchableOpacity
                  key={mission.id}
                  style={styles.missionCard}
                  onPress={() => handlePressMission(mission)}
                  activeOpacity={0.88}>
                  <View style={[styles.missionIconCircle, { backgroundColor: mission.iconBg || '#F1F5F9' }]}>
                    {mission.id === 'meals' ? (
                      <Ionicons name="restaurant-outline" size={18} color="#D97706" />
                    ) : mission.id === 'weight' ? (
                      <MaterialCommunityIcons name="scale-bathroom" size={18} color="#0284C7" />
                    ) : mission.id === 'recipe' ? (
                      <Ionicons name="book-outline" size={18} color="#8B5CF6" />
                    ) : (
                      <Ionicons name="calendar-outline" size={18} color="#10B981" />
                    )}
                  </View>

                  <View style={styles.missionMiddleCol}>
                    <Text style={styles.missionTitle}>{mission.title}</Text>
                    {/* Progress bar */}
                    {!isCheckin && (
                      <View style={styles.missionProgressRow}>
                        <View style={styles.missionProgressBarTrack}>
                          <View
                            style={[
                              styles.missionProgressBarFill,
                              {
                                width: `${Math.min(
                                  100,
                                  Math.round((mission.current / (mission.target || 1)) * 100)
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Right side: Claim / Target status */}
                  <View style={styles.missionRightCol}>
                    {isCheckin ? (
                      <TouchableOpacity
                        style={[
                          styles.checkinBtn,
                          isClaimed && styles.checkinBtnClaimed,
                        ]}
                        disabled={isClaimed}
                        onPress={handleCheckIn}
                        activeOpacity={0.85}>
                        <Text style={[styles.checkinBtnText, isClaimed && styles.checkinBtnTextClaimed]}>
                          {isClaimed ? '✓ Đã nhận' : `Điểm danh +${mission.points || 5}`}
                        </Text>
                      </TouchableOpacity>
                    ) : isCompleted && !isClaimed ? (
                      <TouchableOpacity
                        style={styles.checkinBtn}
                        onPress={() => handleClaimMission(mission)}
                        activeOpacity={0.85}>
                        <Text style={styles.checkinBtnText}>
                          Nhận +{mission.points}
                        </Text>
                      </TouchableOpacity>
                    ) : isClaimed ? (
                      <View style={[styles.checkinBtn, styles.checkinBtnClaimed]}>
                        <Text style={styles.checkinBtnTextClaimed}>Đã nhận</Text>
                      </View>
                    ) : (
                      <View style={styles.missionScoreRow}>
                        <Text style={styles.missionCurrentRatio}>
                          <Text style={{ color: '#10B981', fontWeight: '700' }}>
                            {mission.current.toLocaleString()}
                          </Text>
                          {' / '}
                          {mission.target.toLocaleString()}
                        </Text>
                        <Text style={styles.missionRewardPoints}>+{mission.points}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. BADGES SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.badgeSectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionHeaderIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <FontAwesome6 name="award" size={15} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Huy hiệu của bạn</Text>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert('Huy hiệu', 'Khám phá tất cả các danh hiệu để thăng cấp và nhận hàng trăm điểm thưởng!')}
              activeOpacity={0.7}
              style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={14} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Badges Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScrollRow}>
            {badges.map((badge) => {
              const percent = Math.min(100, Math.round((badge.progress / (badge.maxProgress || 1)) * 100));
              const canClaim = badge.canClaim;

              return (
                <TouchableOpacity
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    canClaim && { borderColor: '#10B981', borderWidth: 1.5, backgroundColor: '#F0FDF4' },
                  ]}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.88}>
                  <View style={styles.badgeCardTop}>
                    <View style={styles.badgeIconBox}>
                      <Text style={{ fontSize: 24 }}>{badge.icon || '🏆'}</Text>
                      {badge.unlocked ? (
                        <View style={[styles.badgeLockPill, { backgroundColor: '#10B981' }]}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      ) : canClaim ? (
                        <View style={[styles.badgeLockPill, { backgroundColor: '#F59E0B' }]}>
                          <Ionicons name="star" size={10} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.badgeLockPill}>
                          <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                        </View>
                      )}
                    </View>

                    <Text style={[styles.badgePointsReward, canClaim && { color: '#059669', fontWeight: '700' }]}>
                      +{badge.points} điểm
                    </Text>
                  </View>

                  <Text style={styles.badgeCardTitle} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  <Text style={styles.badgeCardSub} numberOfLines={2}>
                    {canClaim ? '🎉 Đủ điều kiện nhận!' : badge.progressText}
                  </Text>

                  {/* Progress bar */}
                  <View style={styles.badgeProgressTrack}>
                    <View
                      style={[
                        styles.badgeProgressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: badge.unlocked ? '#10B981' : canClaim ? '#F59E0B' : '#6366F1',
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 6. REFERRAL BANNER */}
        <TouchableOpacity
          style={styles.referralBannerCard}
          onPress={() => setReferralModalVisible(true)}
          activeOpacity={0.88}>
          <View style={styles.referralIconWrap}>
            <Ionicons name="people" size={20} color="#0D9488" />
          </View>
          <View style={styles.referralTextWrap}>
            <Text style={styles.referralTitle}>Giới thiệu bạn bè</Text>
            <Text style={styles.referralSubtitle}>
              Chia sẻ mã của bạn, cùng nhận thưởng Đại sứ
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 7. STREAK SECTION (Duy trì chuỗi ghi bữa ăn) */}
        <View style={styles.streakSectionCard}>
          {/* Streak Top Header */}
          <View style={styles.streakHeaderRow}>
            <View style={styles.streakCountRow}>
              <View style={styles.fireIconWrap}>
                <Ionicons name="flame" size={22} color="#F97316" />
              </View>
              <Text style={styles.streakCountText}>{streak} ngày liên tục</Text>
            </View>

            <View style={styles.freezePill}>
              <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
              <Text style={styles.freezePillText}>{freezes} phao</Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
            Ghi nhận bữa ăn đều đặn để tích luỹ chuỗi và mở khoá mốc thưởng
          </Text>

          {/* Calendar Day Labels */}
          <View style={styles.calendarDayHeaderRow}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, index) => (
              <Text key={index} style={styles.calendarDayHeaderLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* 30-Day Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayItem) => {
              const isGreen = dayItem.status === 'completed';
              const isToday = dayItem.isToday;
              const isFreeze = dayItem.status === 'freeze';
              const isMissed = dayItem.status === 'missed';
              const isFuture = dayItem.status === 'future';

              return (
                <View
                  key={dayItem.day}
                  style={[
                    styles.calendarDayCell,
                    isGreen && styles.calendarDayCellGreen,
                    isToday && styles.calendarDayCellToday,
                    isFreeze && styles.calendarDayCellFreeze,
                    (isMissed || isFuture) && styles.calendarDayCellMuted,
                  ]}>
                  <Text
                    style={[
                      styles.calendarDayText,
                      isGreen && styles.calendarDayTextGreen,
                      isToday && styles.calendarDayTextToday,
                      isFreeze && styles.calendarDayTextFreeze,
                      (isMissed || isFuture) && styles.calendarDayTextMuted,
                    ]}>
                    {dayItem.day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Calendar Legend */}
          <View style={styles.calendarLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>đạt</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#FFFFFF', borderColor: '#3B82F6', borderWidth: 1.5 },
                ]}
              />
              <Text style={styles.legendText}>dùng phao</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
              <Text style={styles.legendText}>bỏ</Text>
            </View>
          </View>

          {/* Milestone Note */}
          <View style={styles.milestoneNoteRow}>
            <Ionicons name="flash-outline" size={15} color="#64748B" />
            <Text style={styles.milestoneNoteText}>
              Còn {nextMilestone.daysLeft} ngày tới mốc {nextMilestone.target}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: GIẢI THÍCH THÀNH TỰU VÀ QUY TẮC HOẠT ĐỘNG         */}
      {/* ========================================================= */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Thành tựu hoạt động thế nào?</Text>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <View style={styles.ruleSection}>
                <Text style={styles.ruleHeading}>Duy trì thói quen</Text>
                <Text style={styles.ruleBody}>
                  Mỗi ngày bạn hoàn thành một thói quen — ghi bữa ăn, đạt bước chân, hoặc ngủ đủ giấc — số ngày liên tục tăng thêm một. Bỏ lỡ một ngày sẽ khiến thói quen đó trở về vạch xuất phát.
                </Text>
              </View>

              <View style={styles.ruleSection}>
                <Text style={styles.ruleHeading}>Phao đóng băng (❄️)</Text>
                <Text style={styles.ruleBody}>
                  Phao tự động bù cho một ngày bạn quên, giúp thói quen không bị gián đoạn. Bạn tích luỹ tối đa 2 phao; hệ thống dùng tự động khi cần.
                </Text>
              </View>

              <View style={styles.ruleSection}>
                <Text style={styles.ruleHeading}>Mốc thưởng</Text>
                <Text style={styles.ruleBody}>
                  Duy trì đủ 7, 30 và 100 ngày liên tục để nhận điểm thưởng mốc.
                </Text>
              </View>

              <View style={styles.ruleSection}>
                <Text style={styles.ruleHeading}>Điểm</Text>
                <Text style={styles.ruleBody}>
                  Bạn tích điểm khi ghi bữa ăn, duy trì thói quen, hoàn thành hoạt động, hoặc tương tác trên cộng đồng. Xem chi tiết từng giao dịch trong Lịch sử điểm.
                </Text>
              </View>

              <View style={styles.ruleSection}>
                <Text style={styles.ruleHeading}>Huy hiệu</Text>
                <Text style={styles.ruleBody}>
                  Huy hiệu tự động mở khoá khi bạn đạt các mốc — số ngày ghi bữa, số ngày duy trì liên tục, công thức đã tạo, hoặc tương tác nhận được. Mỗi huy hiệu có 3 cấp: Đồng, Bạc, Vàng.
                </Text>
              </View>

              <View style={styles.ruleSection}>
                <Text style={styles.ruleHeading}>Đổi điểm</Text>
                <Text style={styles.ruleBody}>
                  Điểm tích luỹ được dùng làm mã giảm giá khi bạn mua thiết bị the.Meal. Mã có hạn 90 ngày; nếu chưa dùng, bạn có thể hoàn lại điểm bất cứ lúc nào.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setInfoModalVisible(false)}
              activeOpacity={0.85}>
              <Text style={styles.sheetCloseBtnText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: GIỚI THIỆU BẠN BÈ (REFERRAL MODAL)                */}
      {/* ========================================================= */}
      <Modal
        visible={referralModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReferralModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.bottomSheetContainer, { maxHeight: '80%' }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.referralModalHeader}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => setReferralModalVisible(false)}
                activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={20} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Giới thiệu bạn bè</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.referralCodeTitle}>Mã giới thiệu của bạn</Text>
              <Text style={styles.referralCodeDesc}>
                Chia sẻ mã này cho bạn bè khi họ đăng ký tài khoản mới
              </Text>

              {/* Dashed Code Box */}
              <TouchableOpacity
                style={styles.dashedCodeBox}
                onPress={handleCopyCode}
                activeOpacity={0.8}>
                <Text style={styles.codeLargeText}>{referralCode}</Text>
                <Ionicons name="copy-outline" size={22} color="#B45309" style={{ marginLeft: 10 }} />
              </TouchableOpacity>

              {/* Enter friend code section */}
              <View style={styles.enterFriendSection}>
                <Text style={styles.enterFriendLabel}>Nhập mã từ người bạn giới thiệu</Text>
                <View style={styles.enterFriendRow}>
                  <TextInput
                    style={styles.enterFriendInput}
                    placeholder="Nhập mã (VD: KZX0LV)"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    value={friendCodeInput}
                    onChangeText={setFriendCodeInput}
                  />
                  <TouchableOpacity
                    style={styles.applyCodeBtn}
                    onPress={handleApplyFriendCode}
                    disabled={submittingReferral}
                    activeOpacity={0.8}>
                    {submittingReferral ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.applyCodeBtnText}>Nhận thưởng</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.referralActionFooter}>
              <TouchableOpacity
                style={styles.shareNowBtn}
                onPress={handleShareCode}
                activeOpacity={0.88}>
                <Ionicons name="share-social-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.shareNowBtnText}>Chia sẻ ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: CHI TIẾT HUY HIỆU (BADGE DETAIL SHEET)           */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBadge(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.sheetHandle} />

            {selectedBadge && (
              <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
                {/* Header Badge Info */}
                <View style={styles.badgeDetailHeader}>
                  <View style={styles.badgeDetailIconBox}>
                    <Text style={{ fontSize: 36 }}>{selectedBadge.icon || '🏆'}</Text>
                    <View
                      style={[
                        styles.badgeLockPillLarge,
                        selectedBadge.unlocked && { backgroundColor: '#10B981' },
                        selectedBadge.canClaim && { backgroundColor: '#F59E0B' },
                      ]}>
                      <Ionicons
                        name={selectedBadge.unlocked ? 'checkmark' : selectedBadge.canClaim ? 'star' : 'lock-closed'}
                        size={12}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>

                  <View style={styles.badgeDetailTitleCol}>
                    <Text style={styles.badgeDetailTitle}>{selectedBadge.name}</Text>
                    <View style={styles.badgeDetailTagsRow}>
                      <View style={styles.tierTagPill}>
                        <Text style={styles.tierTagText}>{selectedBadge.tier}</Text>
                      </View>
                      <Text style={styles.categoryTagText}>{selectedBadge.category}</Text>
                    </View>
                    <View style={styles.statusPillRow}>
                      <Ionicons
                        name={selectedBadge.unlocked ? 'checkmark-circle' : selectedBadge.canClaim ? 'gift-outline' : 'lock-closed-outline'}
                        size={12}
                        color={selectedBadge.unlocked ? '#10B981' : selectedBadge.canClaim ? '#F59E0B' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          selectedBadge.unlocked && { color: '#10B981', fontWeight: '700' },
                          selectedBadge.canClaim && { color: '#D97706', fontWeight: '700' },
                        ]}>
                        {selectedBadge.unlocked
                          ? 'Đã mở khoá'
                          : selectedBadge.canClaim
                          ? 'Đủ điều kiện nhận thưởng!'
                          : 'Chưa mở khoá'}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.badgeDetailDesc}>{selectedBadge.description}</Text>

                {/* Unlock condition card */}
                <View style={styles.unlockConditionCard}>
                  <Text style={styles.unlockConditionHeading}>Điều kiện mở khoá</Text>
                  <Text style={styles.unlockConditionDetail}>{selectedBadge.description}</Text>

                  {/* Progress bar */}
                  <View style={styles.badgeDetailProgressTrack}>
                    <View
                      style={[
                        styles.badgeDetailProgressFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.round(
                              (selectedBadge.progress / (selectedBadge.maxProgress || 1)) * 100
                            )
                          )}%`,
                          backgroundColor: selectedBadge.unlocked ? '#10B981' : selectedBadge.canClaim ? '#F59E0B' : '#6366F1',
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.badgeDetailProgressSub}>
                    <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                      {selectedBadge.progress}/{selectedBadge.maxProgress}
                    </Text>{' '}
                    {selectedBadge.unlocked
                      ? 'Đã hoàn thành điều kiện mở khoá'
                      : selectedBadge.canClaim
                      ? 'Đã hoàn thành! Nhấn nút bên dưới để nhận'
                      : `Còn ${Math.max(0, selectedBadge.maxProgress - selectedBadge.progress)} mục để mở khoá`}
                  </Text>

                  <View style={styles.rewardPointsTagRow}>
                    <FontAwesome6 name="award" size={16} color="#B45309" />
                    <Text style={styles.rewardPointsTagText}>
                      Mở khoá được +{selectedBadge.points} điểm
                    </Text>
                  </View>
                </View>

                {/* Claim / Status Actions */}
                {selectedBadge.unlocked ? (
                  <View style={[styles.badgeDoneBtn, { backgroundColor: '#E2E8F0' }]}>
                    <Text style={[styles.badgeDoneBtnText, { color: '#475569' }]}>
                      ✓ Đã sở hữu danh hiệu
                    </Text>
                  </View>
                ) : selectedBadge.canClaim ? (
                  <TouchableOpacity
                    style={[styles.badgeDoneBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleClaimBadge(selectedBadge)}
                    activeOpacity={0.88}>
                    <Text style={styles.badgeDoneBtnText}>
                      Nhận danh hiệu (+{selectedBadge.points} điểm) 🎉
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.badgeDoneBtn, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={[styles.badgeDoneBtnText, { color: '#94A3B8' }]}>
                      Chưa đủ điều kiện ({selectedBadge.progress}/{selectedBadge.maxProgress})
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: 'center', paddingVertical: 8 }}
                  onPress={() => setSelectedBadge(null)}>
                  <Text style={{ color: '#64748B', fontWeight: '600' }}>Đóng</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  // TOP HEADER
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // 2. POINTS SECTION
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointMedalCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsLabel: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 2,
  },
  pointsValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  pointsUnitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  historyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  historyLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },

  // 3. PROMO BANNER
  promoBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  promoTextCol: {
    flex: 1,
    marginRight: 12,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 3,
  },
  promoSubtitle: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  redeemBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  redeemBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // SECTIONS COMMON
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // 4. MISSIONS
  missionsList: {
    gap: 10,
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  missionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionMiddleCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  missionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  missionProgressRow: {
    marginTop: 6,
  },
  missionProgressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  missionProgressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  missionRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  missionScoreRow: {
    alignItems: 'flex-end',
  },
  missionCurrentRatio: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  missionRewardPoints: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  checkinBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  checkinBtnClaimed: {
    backgroundColor: '#E2E8F0',
  },
  checkinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  checkinBtnTextClaimed: {
    color: '#64748B',
  },

  // 5. BADGES
  badgeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#10B981',
  },
  badgesScrollRow: {
    gap: 12,
  },
  badgeCard: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeLockPill: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#FFFFFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgePointsReward: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  badgeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  badgeCardSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    height: 32,
    marginBottom: 8,
  },
  badgeProgressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // 6. REFERRAL BANNER
  referralBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  referralIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  referralTextWrap: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  referralSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },

  // 7. STREAK
  streakSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fireIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  freezePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  freezePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Streak Tabs
  streakTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  streakTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  streakTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  streakTabText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  streakTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // Calendar
  calendarDayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  calendarDayHeaderLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  calendarDayCell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCellGreen: {
    backgroundColor: '#10B981',
  },
  calendarDayCellToday: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  calendarDayCellFreeze: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  calendarDayCellMuted: {
    backgroundColor: '#F8FAFC',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  calendarDayTextGreen: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#0F172A',
    fontWeight: '800',
  },
  calendarDayTextFreeze: {
    color: '#1D4ED8',
  },
  calendarDayTextMuted: {
    color: '#64748B',
  },

  // Legend
  calendarLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Milestone Note
  milestoneNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  milestoneNoteText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },

  // ==========================================
  // BOTTOM SHEET / MODALS COMMON
  // ==========================================
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetBody: {
    paddingHorizontal: 20,
  },
  ruleSection: {
    marginBottom: 16,
  },
  ruleHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  ruleBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  sheetCloseBtn: {
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  sheetCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  // Referral Modal Elements
  referralModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  referralCodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  referralCodeDesc: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
  },
  dashedCodeBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  codeLargeText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#0F172A',
  },
  enterFriendSection: {
    marginBottom: 20,
  },
  enterFriendLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  enterFriendRow: {
    flexDirection: 'row',
    gap: 8,
  },
  enterFriendInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  applyCodeBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },
  applyCodeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  referralActionFooter: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  shareNowBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 24,
  },
  shareNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Badge Details Elements
  badgeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeDetailIconBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 14,
  },
  badgeLockPillLarge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeDetailTitleCol: {
    flex: 1,
  },
  badgeDetailTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  badgeDetailTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tierTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTagText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPillText: {
    fontSize: 12,
    color: '#64748B',
  },
  badgeDetailDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  unlockConditionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unlockConditionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  unlockConditionDetail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  badgeDetailProgressTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  badgeDetailProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2.5,
  },
  badgeDetailProgressSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  rewardPointsTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardPointsTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeDoneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  badgeDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
