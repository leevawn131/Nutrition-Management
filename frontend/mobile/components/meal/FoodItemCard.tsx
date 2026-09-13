import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { FoodItem } from '@/types/food.types';
import { Ionicons } from '@expo/vector-icons';

interface FoodItemCardProps {
  item: FoodItem;
  onSelect?: (item: FoodItem) => void;
  isSelected?: boolean;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onSelect, isSelected }) => {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect && onSelect(item)}
      activeOpacity={0.7}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="fast-food-outline" size={24} color="#64748B" />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
        
        <View style={styles.macroRow}>
          <Text style={styles.caloriesText}>
            🔥 <Text style={styles.bold}>{item.calories_per_100g}</Text> kcal/100g
          </Text>
          <Text style={styles.macroText}>
            P: {item.protein_per_100g || 0}g • C: {item.carb_per_100g || 0}g • F: {item.fat_per_100g || 0}g
          </Text>
        </View>
      </View>

      {onSelect && (
        <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
          <Ionicons name={isSelected ? 'checkmark' : 'add'} size={18} color={isSelected ? '#FFFFFF' : '#059669'} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  image: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  imagePlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'column',
    gap: 2,
  },
  caloriesText: {
    fontSize: 12,
    color: '#D97706',
  },
  macroText: {
    fontSize: 11,
    color: '#64748B',
  },
  bold: {
    fontWeight: '700',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkCircleSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
});
