import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PortionAdjuster } from './PortionAdjuster';
import { mealService } from '@/services/meal.service';
import { getAuthToken } from '@/services/storage.service';

interface EditMealLogModalProps {
  visible: boolean;
  meal: {
    _id: string;
    foodName?: string;
    description_text?: string;
    portion_grams?: number;
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
    meal_type?: string;
    food_item_id?: any;
  } | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const EditMealLogModal: React.FC<EditMealLogModalProps> = ({
  visible,
  meal,
  onClose,
  onSaveSuccess,
}) => {
  const [portionGrams, setPortionGrams] = useState<number>(100);
  const [basePortionGrams, setBasePortionGrams] = useState<number>(100);
  const [baseCalories, setBaseCalories] = useState<number>(0);
  const [baseProtein, setBaseProtein] = useState<number>(0);
  const [baseCarb, setBaseCarb] = useState<number>(0);
  const [baseFat, setBaseFat] = useState<number>(0);

  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (meal) {
      const origGrams = meal.portion_grams && meal.portion_grams > 0 ? meal.portion_grams : 100;
      setPortionGrams(origGrams);
      setBasePortionGrams(origGrams);
      setBaseCalories(meal.calories || 0);
      setBaseProtein(meal.protein_g || 0);
      setBaseCarb(meal.carb_g || 0);
      setBaseFat(meal.fat_g || 0);
    }
  }, [meal]);

  if (!meal) return null;

  // Real-time calculation based on adjusted grams
  const ratio = basePortionGrams > 0 ? portionGrams / basePortionGrams : portionGrams / 100;
  const currentCalories = Math.max(0, Math.round(baseCalories * ratio));
  const currentProtein = Math.max(0, Math.round(baseProtein * ratio * 10) / 10);
  const currentCarb = Math.max(0, Math.round(baseCarb * ratio * 10) / 10);
  const currentFat = Math.max(0, Math.round(baseFat * ratio * 10) / 10);

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await getAuthToken();
      if (!token) {
        const msg = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Thông báo', msg);
        return;
      }

      await mealService.updateMealLog(token, meal._id, {
        portion_grams: portionGrams,
        calories: currentCalories,
        protein_g: currentProtein,
        carb_g: currentCarb,
        fat_g: currentFat,
      });

      const successMsg = 'Cập nhật định lượng và dinh dưỡng bữa ăn thành công!';
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert('Thành công', successMsg);

      onSaveSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi cập nhật bữa ăn:', error);
      const errMsg = error.message || 'Lỗi khi cập nhật bữa ăn';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Lỗi', errMsg);
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    meal.foodName ||
    meal.food_item_id?.name ||
    meal.description_text ||
    'Món ăn';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="create-outline" size={22} color="#059669" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Chỉnh sửa định lượng món ăn</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Dish Info Card */}
            <View style={styles.dishCard}>
              <Text style={styles.dishName}>{displayName}</Text>
              <Text style={styles.dishSubtitle}>
                Khẩu phần gốc ban đầu: {basePortionGrams}g ({baseCalories} kcal)
              </Text>
            </View>

            {/* Adjuster Section */}
            <View style={styles.adjustSection}>
              <Text style={styles.adjustLabel}>
                Điều chỉnh trọng lượng (Bấm +/- 1g, giữ để chạy liên tục, hoặc gõ tay):
              </Text>
              <View style={styles.adjusterWrapper}>
                <PortionAdjuster
                  weight={portionGrams}
                  onChangeWeight={setPortionGrams}
                  step={1}
                  min={1}
                  max={5000}
                />
              </View>

              {/* Quick weight buttons */}
              <View style={styles.quickWeightRow}>
                {[50, 100, 150, 200, 250, 300].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.quickWeightChip, portionGrams === g && styles.quickWeightChipActive]}
                    onPress={() => setPortionGrams(g)}
                  >
                    <Text
                      style={[
                        styles.quickWeightText,
                        portionGrams === g && styles.quickWeightTextActive,
                      ]}
                    >
                      {g}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Live Recalculated Macros Summary */}
            <View style={styles.recalcCard}>
              <View style={styles.recalcHeader}>
                <Text style={styles.recalcTitle}>Dinh dưỡng sau điều chỉnh:</Text>
                <Text style={styles.recalcCalories}>{currentCalories} kcal</Text>
              </View>
              <View style={styles.macroRow}>
                <View style={styles.macroBox}>
                  <Text style={styles.macroLabel}>Chất đạm (P)</Text>
                  <Text style={styles.macroVal}>{currentProtein}g</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroLabel}>Đường bột (C)</Text>
                  <Text style={styles.macroVal}>{currentCarb}g</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroLabel}>Chất béo (F)</Text>
                  <Text style={styles.macroVal}>{currentFat}g</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu định lượng mới</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 18,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    maxHeight: 450,
  },
  dishCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dishName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  dishSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  adjustSection: {
    marginBottom: 16,
  },
  adjustLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
    lineHeight: 18,
  },
  adjusterWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  quickWeightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  quickWeightChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  quickWeightChipActive: {
    backgroundColor: '#059669',
  },
  quickWeightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickWeightTextActive: {
    color: '#FFFFFF',
  },
  recalcCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 10,
  },
  recalcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recalcTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  recalcCalories: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  macroVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
