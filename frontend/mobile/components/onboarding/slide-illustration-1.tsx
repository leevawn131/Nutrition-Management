import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome6 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width * 0.78, 300);

export function SlideIllustration1() {
  return (
    <View style={styles.container}>
      {/* Background Soft Pastel Circle */}
      <View style={styles.backgroundCircle} />

      {/* Center Main Card - Steaming Healthy Soup */}
      <View style={[styles.card, styles.centerCard]}>
        <MaterialCommunityIcons name="bowl-mix-outline" size={38} color="#EA580C" />
      </View>

      {/* Top Left Card - Egg & Salad Bowl */}
      <View style={[styles.card, styles.posTopLeft, { transform: [{ rotate: '-8deg' }] }]}>
        <MaterialCommunityIcons name="egg-easter" size={28} color="#D97706" />
      </View>

      {/* Top Right Card - Organic Sprout & Tofu */}
      <View style={[styles.card, styles.posTopRight, { transform: [{ rotate: '10deg' }] }]}>
        <Ionicons name="leaf-outline" size={28} color="#16A34A" />
      </View>

      {/* Middle Left Card - Grain Bowl */}
      <View style={[styles.card, styles.posMidLeft, { transform: [{ rotate: '-5deg' }] }]}>
        <MaterialCommunityIcons name="noodles" size={28} color="#CA8A04" />
      </View>

      {/* Middle Right Card - Balanced Bento with Chopsticks */}
      <View style={[styles.card, styles.posMidRight, { transform: [{ rotate: '8deg' }] }]}>
        <FontAwesome6 name="utensils" size={24} color="#DC2626" />
      </View>

      {/* Bottom Left Card - Fresh Apple with Leaf */}
      <View style={[styles.card, styles.posBottomLeft, { transform: [{ rotate: '6deg' }] }]}>
        <Ionicons name="nutrition-outline" size={28} color="#E11D48" />
      </View>

      {/* Bottom Right Card - Protein Skewer / Roll */}
      <View style={[styles.card, styles.posBottomRight, { transform: [{ rotate: '-12deg' }] }]}>
        <MaterialCommunityIcons name="baguette" size={28} color="#B45309" />
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
    width: CONTAINER_SIZE * 0.76,
    height: CONTAINER_SIZE * 0.76,
    borderRadius: (CONTAINER_SIZE * 0.76) / 2,
    backgroundColor: '#DBEAFE', // Soft pastel blue
    opacity: 0.9,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  centerCard: {
    width: 68,
    height: 68,
    zIndex: 10,
  },
  posTopLeft: {
    width: 58,
    height: 58,
    top: 10,
    left: CONTAINER_SIZE * 0.16,
  },
  posTopRight: {
    width: 58,
    height: 58,
    top: 10,
    right: CONTAINER_SIZE * 0.16,
  },
  posMidLeft: {
    width: 58,
    height: 58,
    top: CONTAINER_SIZE * 0.38,
    left: 4,
  },
  posMidRight: {
    width: 58,
    height: 58,
    top: CONTAINER_SIZE * 0.38,
    right: 4,
  },
  posBottomLeft: {
    width: 58,
    height: 58,
    bottom: 12,
    left: CONTAINER_SIZE * 0.22,
  },
  posBottomRight: {
    width: 58,
    height: 58,
    bottom: 12,
    right: CONTAINER_SIZE * 0.22,
  },
});
