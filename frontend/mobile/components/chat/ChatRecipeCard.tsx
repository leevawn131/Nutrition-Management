import { ChatRecipeItem } from '@/types/chat.types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatRecipeCardProps {
  recipe: ChatRecipeItem;
  onAction: (action: string, data: any) => void;
  disabled?: boolean;
}

export const ChatRecipeCard: React.FC<ChatRecipeCardProps> = ({
  recipe,
  onAction,
  disabled = false,
}) => {
  const fallbackImg =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

  const handleCardPress = () => {
    onAction('view_recipe', {
      recipe_id: recipe.id,
      title: recipe.title,
      recipe,
    });
  };

  const handleSave = () => {
    onAction('save_recipe', {
      recipe_id: recipe.id,
      title: recipe.title,
    });
  };

  const handleAddToPlan = () => {
    onAction('add_to_meal_plan', {
      recipe_id: recipe.id,
      title: recipe.title,
      meal_type: recipe.meal_type || 'lunch',
    });
  };

  return (
    <View style={styles.card}>
      {/* Tap card to view recipe details */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCardPress}
        style={styles.cardHeaderArea}
      >
        <Image
          source={{ uri: recipe.image_url || fallbackImg }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>

          <View style={styles.metaRow}>
            <View style={styles.badgeCalo}>
              <Text style={styles.badgeCaloText}>🔥 {Math.round(recipe.calories)} kcal</Text>
            </View>
            <View style={styles.badgeProtein}>
              <Text style={styles.badgeProteinText}>💪 {Math.round(recipe.protein)}g Đạm</Text>
            </View>
            {recipe.cook_time_minutes ? (
              <Text style={styles.cookTime}>⏱️ {recipe.cook_time_minutes}p</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Button Row: Left: Lưu món | Right: Thêm vào kế hoạch */}
      <View style={styles.buttonRow}>
        {/* Nút bên trái: Lưu món */}
        <TouchableOpacity
          style={[styles.saveBtn, disabled && styles.btnDisabled]}
          disabled={disabled}
          onPress={handleSave}
          activeOpacity={0.75}
        >
          <Ionicons name="bookmark-outline" size={15} color="#374151" />
          <Text style={styles.saveBtnText}>Lưu món</Text>
        </TouchableOpacity>

        {/* Nút bên phải: Thêm vào kế hoạch */}
        <TouchableOpacity
          style={[styles.planBtn, disabled && styles.btnDisabled]}
          disabled={disabled}
          onPress={handleAddToPlan}
          activeOpacity={0.75}
        >
          <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
          <Text style={styles.planBtnText}>+ Thêm vào kế hoạch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginVertical: 6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderArea: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 125,
  },
  content: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeCalo: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeCaloText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeProtein: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeProteinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  cookTime: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 5,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  planBtn: {
    flex: 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 5,
  },
  planBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
