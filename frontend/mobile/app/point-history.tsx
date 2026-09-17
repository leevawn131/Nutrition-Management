import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gamificationService, PointHistoryItem } from '@/services/gamification.service';

interface DayGroup {
  dateKey: string;
  dayLabel: string;
  endOfDayBalance: number;
  items: PointHistoryItem[];
}

/**
 * Format tên lý do cộng/trừ điểm sang tiếng Việt chuẩn đẹp theo thiết kế
 */
function formatReasonTitle(reason: string): string {
  if (!reason) return 'Giao dịch điểm';
  const r = reason.trim();

  if (/daily_checkin|điểm danh/i.test(r)) {
    return 'Điểm danh hôm nay';
  }
  if (/Ghi nhận bữa ăn theo kế hoạch/i.test(r)) {
    return 'Ghi nhật ký bữa ăn';
  }
  if (/Ghi nhận bữa ăn/i.test(r)) {
    return 'Ghi nhật ký bữa ăn';
  }
  if (/Bữa ăn đầu tiên|Ghi bữa ăn đầu/i.test(r)) {
    return 'Ghi bữa ăn đầu tiên';
  }
  if (/mission_meals/i.test(r)) {
    return 'Ghi đủ 3 bữa';
  }
  if (/mission_weight|cân nặng/i.test(r)) {
    return 'Ghi cân nặng';
  }
  if (/mission_recipe|công thức/i.test(r)) {
    return 'Chia sẻ công thức món ăn';
  }
  if (/Mở khoá danh hiệu:\s*(.*)/i.test(r)) {
    const match = r.match(/Mở khoá danh hiệu:\s*(.*)/i);
    return `Huy hiệu: ${match ? match[1] : 'Mới'}`;
  }
  if (/Huy hiệu/i.test(r)) {
    return r;
  }
  if (/Mốc streak 7 ngày/i.test(r)) {
    return 'Mốc chuỗi 7 ngày liên tục';
  }
  if (/Mốc streak 30 ngày/i.test(r)) {
    return 'Mốc chuỗi 30 ngày liên tục';
  }
  if (/Duy trì streak/i.test(r)) {
    return 'Duy trì chuỗi ngày liên tục';
  }
  if (/referral|mã giới thiệu/i.test(r)) {
    return 'Thưởng giới thiệu bạn bè';
  }
  if (/post|bài viết/i.test(r)) {
    return 'Đăng bài viết';
  }
  if (/chatbot|chat|miu|tri/i.test(r)) {
    return 'Trò chuyện với trợ lý dinh dưỡng';
  }

  return r;
}

/**
 * Chuyển đổi ngày sang nhãn tiếng Việt (VD: CN, 13/09 hoặc T4, 19/08)
 */
function formatVietnameseDateLabel(date: Date): string {
  const dayIndex = date.getDay(); // 0 = CN, 1 = T2, ...
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = dayNames[dayIndex];

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');

  return `${dayName}, ${d}/${m}`;
}

/**
 * Format giờ HH:mm
 */
function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '00:00';
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return '00:00';
  }
}

export default function PointHistoryScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [rawLogs, setRawLogs] = useState<PointHistoryItem[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await gamificationService.getPointHistory();
      setTotalPoints(data.totalPoints);
      setRawLogs(data.logs || []);
    } catch (e) {
      console.warn('Lỗi tải lịch sử điểm:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  // Gom nhóm lịch sử theo ngày và tính số dư cuối ngày
  const groupedData: DayGroup[] = useMemo(() => {
    if (!rawLogs || rawLogs.length === 0) {
      return [];
    }

    // Sắp xếp mới nhất trước
    const sorted = [...rawLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Tính số dư lùi dần từ totalPoints hiện tại
    let currentBalance = totalPoints;
    const itemsWithBalance = sorted.map((item) => {
      const balanceAfter = currentBalance;
      currentBalance = currentBalance - item.points;
      return {
        ...item,
        balanceAfter,
      };
    });

    // Gom nhóm theo YYYY-MM-DD
    const map = new Map<string, { label: string; endBalance: number; items: PointHistoryItem[] }>();

    for (const item of itemsWithBalance) {
      const d = new Date(item.created_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = formatVietnameseDateLabel(d);

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          label: dayLabel,
          endBalance: item.balanceAfter, // Giao dịch mới nhất trong ngày chính là số dư cuối ngày
          items: [item],
        });
      } else {
        map.get(dateKey)!.items.push(item);
      }
    }

    return Array.from(map.entries()).map(([dateKey, val]) => ({
      dateKey,
      dayLabel: val.label,
      endOfDayBalance: Math.max(0, val.endBalance),
      items: val.items,
    }));
  }, [rawLogs, totalPoints]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Lịch sử điểm</Text>

        <View style={styles.pointsBadgePill}>
          <Text style={styles.pointsBadgeText}>{totalPoints} điểm</Text>
        </View>
      </View>

      {/* 2. BODY CONTENT */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Đang tải lịch sử điểm...</Text>
        </View>
      ) : groupedData.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có lịch sử điểm</Text>
          <Text style={styles.emptySubtitle}>
            Hãy ghi nhận bữa ăn, điểm danh mỗi ngày và mở khoá các danh hiệu để tích luỹ hàng trăm điểm thưởng nhé!
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {groupedData.map((group) => (
            <View key={group.dateKey} style={styles.groupCard}>
              {/* Header Ngày & Số dư cuối ngày */}
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupDateText}>{group.dayLabel}</Text>
                <Text style={styles.groupBalanceText}>
                  số dư cuối ngày {group.endOfDayBalance}
                </Text>
              </View>

              {/* Danh sách các giao dịch trong ngày */}
              <View style={styles.groupItemsContainer}>
                {group.items.map((item, index) => {
                  const isPositive = item.points >= 0;
                  const isLast = index === group.items.length - 1;

                  return (
                    <View
                      key={item.id || index}
                      style={[styles.historyItemRow, !isLast && styles.historyItemDivider]}>
                      {/* Left Icon Circle */}
                      <View
                        style={[
                          styles.actionIconCircle,
                          isPositive ? styles.actionIconPositive : styles.actionIconNegative,
                        ]}>
                        <Ionicons
                          name={isPositive ? 'arrow-up' : 'arrow-down'}
                          size={18}
                          color={isPositive ? '#10B981' : '#EF4444'}
                        />
                      </View>

                      {/* Middle Details */}
                      <View style={styles.itemDetailsCol}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {formatReasonTitle(item.reason)}
                        </Text>
                        <Text style={styles.itemTime}>{formatTime(item.created_at)}</Text>
                      </View>

                      {/* Right Points Amount */}
                      <View style={styles.itemPointsCol}>
                        <Text
                          style={[
                            styles.itemPointsText,
                            isPositive ? styles.pointsPositiveText : styles.pointsNegativeText,
                          ]}>
                          {isPositive ? `+${item.points}` : item.points}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // TOP HEADER
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
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
  pointsBadgePill: {
    backgroundColor: '#E6F7F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },

  // GROUP SECTION
  groupCard: {
    marginBottom: 0,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  groupDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  groupBalanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },

  // ITEMS LIST
  groupItemsContainer: {
    backgroundColor: '#FFFFFF',
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionIconPositive: {
    backgroundColor: '#E6F7F0',
  },
  actionIconNegative: {
    backgroundColor: '#FEE2E2',
  },

  itemDetailsCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  itemTime: {
    fontSize: 12,
    color: '#94A3B8',
  },

  itemPointsCol: {
    paddingLeft: 12,
  },
  itemPointsText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsPositiveText: {
    color: '#10B981',
  },
  pointsNegativeText: {
    color: '#EF4444',
  },

  // EMPTY & LOADING
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
