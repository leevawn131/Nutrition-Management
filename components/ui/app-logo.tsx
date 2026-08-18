import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export function AppLogo({ size = 'medium' }: AppLogoProps) {
  const isLarge = size === 'large';

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={[styles.textBlack, isLarge && styles.textLarge]}>the.</Text>
        <Text style={[styles.textGreen, isLarge && styles.textLarge]}>Nutri</Text>
        <View style={styles.leafIconWrapper}>
          <Ionicons name="leaf" size={isLarge ? 18 : 14} color="#34D399" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  textBlack: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F2644', // Dark navy charcoal
    letterSpacing: -0.5,
  },
  textGreen: {
    fontSize: 34,
    fontWeight: '800',
    color: '#10B981', // Nutrition emerald green
    letterSpacing: -0.5,
  },
  textLarge: {
    fontSize: 40,
  },
  leafIconWrapper: {
    marginLeft: 2,
    marginTop: -16,
  },
});
