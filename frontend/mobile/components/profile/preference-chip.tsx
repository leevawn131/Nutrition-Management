import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PreferenceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PreferenceChip({
  label,
  selected,
  onPress,
  onRemove,
  icon,
}: PreferenceChipProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    onPress();
  };

  const handleRemove = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={handlePress}
      activeOpacity={0.78}>
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? '#059669' : '#64748B'}
          style={styles.leadingIcon}
        />
      ) : null}

      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>

      {onRemove ? (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={handleRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={16} color={selected ? '#059669' : '#94A3B8'} />
        </TouchableOpacity>
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={16} color="#059669" style={styles.checkIcon} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  labelSelected: {
    color: '#065F46',
    fontWeight: '700',
  },
  leadingIcon: {
    marginRight: 6,
  },
  checkIcon: {
    marginLeft: 6,
  },
  removeBtn: {
    marginLeft: 6,
  },
});
