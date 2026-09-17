import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { postService } from '@/services/post.service';
import { getAuthToken } from '@/services/storage.service';

interface ShareMealModalProps {
  visible: boolean;
  meal: {
    _id?: string;
    foodName?: string;
    calories?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    source_image_url?: string;
    meal_type?: string;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ShareMealModal: React.FC<ShareMealModalProps> = ({
  visible,
  meal,
  onClose,
  onSuccess,
}) => {
  const [caption, setCaption] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!meal) return null;

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Bữa sáng 🍳',
    lunch: 'Bữa trưa 🍱',
    dinner: 'Bữa tối 🍲',
    snack: 'Bữa phụ 🍎',
  };

  const handleShare = async () => {
    try {
      setSubmitting(true);
      const token = await getAuthToken();
      if (!token) {
        const msg = 'Vui lòng đăng nhập để chia sẻ bữa ăn';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Thông báo', msg);
        return;
      }

      // Format post content with meal nutrition summary
      const foodTitle = meal.foodName || 'Bữa ăn dinh dưỡng';
      const macroSummary = `[${mealTypeLabels[meal.meal_type || 'lunch'] || 'Bữa ăn'}] ${foodTitle} - ${Math.round(
        meal.calories || 0
      )} kcal (P: ${Math.round(meal.protein_g || 0)}g | C: ${Math.round(
        meal.carb_g || 0
      )}g | F: ${Math.round(meal.fat_g || 0)}g)`;

      const fullContent = caption.trim()
        ? `${caption.trim()}\n\n📊 Dinh dưỡng bữa ăn:\n${macroSummary}`
        : `Hôm nay mình thưởng thức: ${foodTitle}\n\n📊 Dinh dưỡng bữa ăn:\n${macroSummary}`;

      const images = meal.source_image_url ? [{ image_url: meal.source_image_url }] : [];

      await postService.createPost(token, {
        content: fullContent,
        images,
      });

      const successMsg = 'Đã chia sẻ bữa ăn lên Bảng tin Cộng đồng thành công!';
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert('Thành công', successMsg);

      setCaption('');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi chia sẻ bữa ăn:', error);
      const errMsg = error.message || 'Không thể chia sẻ bài viết';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Lỗi', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="share-social" size={22} color="#059669" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Chia sẻ lên Mạng xã hội</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Meal Image Preview */}
            {meal.source_image_url ? (
              <Image source={{ uri: meal.source_image_url }} style={styles.mealImage} resizeMode="cover" />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="restaurant-outline" size={40} color="#10B981" />
                <Text style={styles.noImageText}>Ảnh bữa ăn sẽ được đính kèm</Text>
              </View>
            )}

            {/* Meal Nutrition Highlight Card */}
            <View style={styles.nutritionCard}>
              <Text style={styles.mealName}>
                {mealTypeLabels[meal.meal_type || 'lunch'] || 'Bữa ăn'}: {meal.foodName || 'Món ăn'}
              </Text>
              <Text style={styles.caloriesText}>{Math.round(meal.calories || 0)} kcal</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroBadgeLabel}>Đạm (P)</Text>
                  <Text style={styles.macroBadgeVal}>{Math.round(meal.protein_g || 0)}g</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroBadgeLabel}>Đường (C)</Text>
                  <Text style={styles.macroBadgeVal}>{Math.round(meal.carb_g || 0)}g</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroBadgeLabel}>Béo (F)</Text>
                  <Text style={styles.macroBadgeVal}>{Math.round(meal.fat_g || 0)}g</Text>
                </View>
              </View>
            </View>

            {/* Caption Input */}
            <Text style={styles.inputLabel}>Lời nhắn / Cảm nhận của bạn:</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Hôm nay ăn món này ngon tuyệt, mọi người cùng thử nhé! #eatclean #healthy"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={caption}
              onChangeText={setCaption}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, submitting && { opacity: 0.7 }]}
              onPress={handleShare}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.shareBtnText}>Đăng lên MXH</Text>
                </>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    marginBottom: 14,
  },
  mealImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  nutritionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  caloriesText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D97706',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroBadge: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  macroBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  macroBadgeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 90,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  shareBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
