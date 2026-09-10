import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  showChevron?: boolean;
  isDestructive?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function SettingsItem({
  title,
  subtitle,
  showChevron = false,
  isDestructive = false,
  onPress,
  accessibilityLabel,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}>
      <View style={styles.contentWrapper}>
        <Text style={[styles.title, isDestructive && styles.destructiveTitle]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={styles.chevron} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#0F2644',
    letterSpacing: -0.2,
  },
  destructiveTitle: {
    color: '#EF4444',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  chevron: {
    marginLeft: 4,
  },
});
