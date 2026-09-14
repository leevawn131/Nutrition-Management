import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatChoicePayload } from '@/types/chat.types';

interface ChatChoicePickerProps {
  payload: ChatChoicePayload;
  onSelectChoice: (value: any, label: string) => void;
  disabled?: boolean;
}

export const ChatChoicePicker: React.FC<ChatChoicePickerProps> = ({
  payload,
  onSelectChoice,
  disabled = false,
}) => {
  if (!payload || !payload.choices || payload.choices.length === 0) return null;

  return (
    <View style={styles.container}>
      {payload.title && <Text style={styles.title}>{payload.title}</Text>}
      <View style={styles.choicesWrapper}>
        {payload.choices.map((choice, idx) => (
          <TouchableOpacity
            key={`choice-${idx}`}
            style={[styles.chip, disabled && styles.chipDisabled]}
            disabled={disabled}
            activeOpacity={0.7}
            onPress={() => onSelectChoice(choice.value, choice.label)}
          >
            <Text style={[styles.chipText, disabled && styles.chipTextDisabled]}>
              {choice.icon ? `${choice.icon} ` : ''}
              {choice.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    width: '100%',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  choicesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDisabled: {
    opacity: 0.6,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  chipText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  chipTextDisabled: {
    color: '#9CA3AF',
  },
});
