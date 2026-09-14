import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChatRecipeItem } from '@/types/chat.types';

interface ChatRecipeDetailModalProps {
  visible: boolean;
  recipe:
    | (ChatRecipeItem & {
        description?: string;
        ingredients?: Array<{ ingredient_name: string; quantity?: number; unit?: string }>;
        steps?: Array<{ step_number: number; instruction: string; image_url?: string }>;
      })
    | null;
  onClose: () => void;
  onAddToMealPlan?: (recipeId: string) => void;
}

export const ChatRecipeDetailModal: React.FC<ChatRecipeDetailModalProps> = ({
  visible,
  recipe,
  onClose,
  onAddToMealPlan,
}) => {
  if (!recipe) return null;

  const fallbackImg =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

  const calo = Math.round(
    Number(recipe.calories ?? (recipe as any).calories_per_serving ?? (recipe as any).nutrition_facts?.energy_kcal ?? 0) || 0
  );
  const protein =
    Number(recipe.protein ?? (recipe as any).protein_g ?? (recipe as any).nutrition_facts?.protein_g ?? 0) || 0;
  const carbs =
    Number(
      recipe.carbs ??
        (recipe as any).carb_g ??
        (recipe as any).carbs_g ??
        (recipe as any).nutrition_facts?.carbohydrate_g ??
        0
    ) || 0;
  const fat =
    Number(recipe.fat ?? (recipe as any).fat_g ?? (recipe as any).nutrition_facts?.fat_g ?? 0) || 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <Image
              source={{ uri: recipe.image_url || fallbackImg }}
              style={styles.image}
              resizeMode="cover"
            />

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{calo}</Text>
                <Text style={styles.statLbl}>Kcal</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{protein}g</Text>
                <Text style={styles.statLbl}>Đạm</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{carbs}g</Text>
                <Text style={styles.statLbl}>Đường bột</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{fat}g</Text>
                <Text style={styles.statLbl}>Chất béo</Text>
              </View>
            </View>

            {recipe.description ? (
              <View style={styles.section}>
                <Text style={styles.desc}>{recipe.description}</Text>
              </View>
            ) : null}

            {/* Ingredients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🥕 Nguyên liệu</Text>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ing, idx) => (
                  <View key={`ing-${idx}`} style={styles.ingItem}>
                    <Text style={styles.ingBullet}>•</Text>
                    <Text style={styles.ingName}>{ing.ingredient_name}</Text>
                    {ing.quantity ? (
                      <Text style={styles.ingQty}>
                        {ing.quantity} {ing.unit || ''}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNote}>
                  Công thức dinh dưỡng khuyến nghị. Bạn có thể tự do kết hợp nguyên liệu theo khẩu vị và lượng calo mục tiêu.
                </Text>
              )}
            </View>

            {/* Steps */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👨‍🍳 Các bước thực hiện</Text>
              {recipe.steps && recipe.steps.length > 0 ? (
                recipe.steps.map((st, idx) => (
                  <View key={`step-${idx}`} style={styles.stepItem}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumText}>{st.step_number || idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{st.instruction}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNote}>
                  Chế biến đơn giản: Sơ chế sạch nguyên liệu, ưu tiên luộc, hấp, áp chảo hoặc xào ít dầu để giữ trọn vi chất.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            {onAddToMealPlan && (
              <TouchableOpacity
                style={styles.addPlanBtn}
                onPress={() => {
                  onAddToMealPlan(recipe.id || (recipe as any)._id);
                  onClose();
                }}
              >
                <Text style={styles.addPlanBtnText}>+ Thêm vào kế hoạch ăn uống</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  scrollBody: {
    padding: 16,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  statLbl: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  desc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  ingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ingBullet: {
    color: '#10B981',
    fontWeight: 'bold',
    marginRight: 8,
  },
  ingName: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  ingQty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyNote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  addPlanBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
