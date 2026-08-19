import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface NutritionDonutProps {
  proteinPct?: number;
  carbPct?: number;
  fatPct?: number;
  proteinG?: number;
  carbG?: number;
  fatG?: number;
}

export function NutritionDonut({
  proteinPct = 20,
  carbPct = 54,
  fatPct = 26,
  proteinG = 117,
  carbG = 317,
  fatG = 68,
}: NutritionDonutProps) {
  return (
    <View style={styles.container}>
      {/* Visual Ring */}
      <View style={styles.ringWrapper}>
        <View style={styles.outerRing}>
          <View style={styles.innerHole} />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendWrapper}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>
            {proteinPct}% Protein ({proteinG}g)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>
            {carbPct}% Carbohydrate ({carbG}g)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>
            {fatPct}% Fat ({fatG}g)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 16,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 12,
    borderColor: '#10B981', // Green for carbs
    borderTopColor: '#3B82F6', // Blue for protein
    borderRightColor: '#F59E0B', // Orange for fat
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerHole: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
  },
  legendWrapper: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
