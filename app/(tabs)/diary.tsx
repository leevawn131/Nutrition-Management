import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { mealService } from '@/services/meal.service';
import { getAuthToken } from '@/services/storage.service';
import { EditMealLogModal } from '@/components/meal/EditMealLogModal';
import { ShareMealModal } from '@/components/meal/ShareMealModal';

export default function DiaryScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMealForEdit, setSelectedMealForEdit] = useState<any | null>(null);
  const [selectedMealForShare, setSelectedMealForShare] = useState<any | null>(null);

  const fetchMealLogs = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await mealService.getMealLogs(token, todayStr);
      setLogs(res.data || []);
    } catch (error) {
      console.error('Lỗi tải nhật ký:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMealLogs();
  }, [fetchMealLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMealLogs();
  };

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'Bữa sáng 🍳';
      case 'lunch':
        return 'Bữa trưa 🍱';
      case 'dinner':
        return 'Bữa tối 🍲';
      case 'snack':
        return 'Bữa phụ 🍎';
      default:
        return 'Bữa ăn 🍽️';
    }
  };

  const totalCalories = logs.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = logs.reduce((sum, item) => sum + (item.protein_g || 0), 0);
  const totalCarb = logs.reduce((sum, item) => sum + (item.carb_g || 0), 0);
  const totalFat = logs.reduce((sum, item) => sum + (item.fat_g || 0), 0);

  const handleDeleteMeal = (mealId: string) => {
    const confirmAction = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        await mealService.deleteMealLog(token, mealId);
        fetchMealLogs();
      } catch (err) {
        console.error('Lỗi khi xóa bữa ăn:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn xóa bữa ăn này không?')) {
        confirmAction();
      }
    } else {
      Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bữa ăn này khỏi nhật ký?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: confirmAction },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhật ký dinh dưỡng</Text>
        <Text style={styles.headerSubtitle}>Hôm nay, {new Date().toLocaleDateString('vi-VN')}</Text>
      </View>

      {/* Daily Summary Header Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Tổng Calo hôm nay</Text>
            <Text style={styles.summaryCalories}>{Math.round(totalCalories)} kcal</Text>
          </View>
          <View style={styles.macrosBadgeRow}>
            <Text style={styles.macroPill}>P: {Math.round(totalProtein)}g</Text>
            <Text style={styles.macroPill}>C: {Math.round(totalCarb)}g</Text>
            <Text style={styles.macroPill}>F: {Math.round(totalFat)}g</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="book-outline" size={40} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có bữa ăn nào</Text>
            <Text style={styles.emptySubtitle}>
              Hãy bấm nút Quét/Ghi bữa ăn để bắt đầu lưu lại dinh dưỡng ngày hôm nay!
            </Text>
          </View>
        ) : (
          logs.map((log) => {
            const foodDisplayName =
              log.food_item_id?.name ||
              log.description_text ||
              log.recognition_summary?.corrected_label ||
              'Bữa ăn đã ghi';

            return (
              <View key={log._id} style={styles.mealCard}>
                <View style={styles.mealCardHeader}>
                  <Text style={styles.mealTypeTitle}>{getMealTypeLabel(log.meal_type)}</Text>
                  <Text style={styles.mealCalories}>{Math.round(log.calories)} kcal</Text>
                </View>

                <Text style={styles.foodName}>{foodDisplayName}</Text>

                {log.portion_grams ? (
                  <Text style={styles.portionText}>Khẩu phần: {log.portion_grams}g</Text>
                ) : null}

                <View style={styles.mealMacroRow}>
                  <Text style={styles.mealMacroText}>Đạm: {log.protein_g || 0}g</Text>
                  <Text style={styles.mealMacroText}>•</Text>
                  <Text style={styles.mealMacroText}>Đường: {log.carb_g || 0}g</Text>
                  <Text style={styles.mealMacroText}>•</Text>
                  <Text style={styles.mealMacroText}>Chất béo: {log.fat_g || 0}g</Text>
                </View>

                {/* Meal Action Buttons */}
                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() =>
                      setSelectedMealForEdit({
                        ...log,
                        foodName: foodDisplayName,
                      })
                    }
                  >
                    <Ionicons name="create-outline" size={15} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnSecondaryText}>Sửa định lượng</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnShare}
                    onPress={() =>
                      setSelectedMealForShare({
                        ...log,
                        foodName: foodDisplayName,
                      })
                    }
                  >
                    <Ionicons name="share-social-outline" size={15} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnShareText}>Chia sẻ MXH</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnDelete}
                    onPress={() => handleDeleteMeal(log._id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit Meal Log Modal */}
      <EditMealLogModal
        visible={!!selectedMealForEdit}
        meal={selectedMealForEdit}
        onClose={() => setSelectedMealForEdit(null)}
        onSaveSuccess={() => {
          fetchMealLogs();
        }}
      />

      {/* Share Meal to Social Feed Modal */}
      <ShareMealModal
        visible={!!selectedMealForShare}
        meal={selectedMealForShare}
        onClose={() => setSelectedMealForShare(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F2644',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#059669',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#D1FAE5',
    fontWeight: '500',
  },
  summaryCalories: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  macrosBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealTypeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  portionText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  mealMacroRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  mealMacroText: {
    fontSize: 12,
    color: '#64748B',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  actionBtnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnShareText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});
