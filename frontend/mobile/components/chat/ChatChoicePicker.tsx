import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const hasDescription = payload.choices.some((c) => Boolean(c.description));

  if (hasDescription) {
    return (
      <View style={styles.container}>
        {payload.title && <Text style={styles.title}>{payload.title}</Text>}
        <View style={styles.cardListWrapper}>
          {payload.choices.map((choice, idx) => {
            const iconChar = choice.icon || choice.label.match(/^(\p{Emoji})/u)?.[0] || '✨';
            const cleanLabel = choice.label.replace(/^(\p{Emoji}\s*)/u, '').trim();

            return (
              <TouchableOpacity
                key={`card-choice-${idx}`}
                style={[styles.workflowCard, disabled && styles.cardDisabled]}
                disabled={disabled}
                activeOpacity={0.75}
                onPress={() => onSelectChoice(choice.value, choice.label)}
              >
                <View style={styles.cardIconBox}>
                  <Text style={styles.cardIconText}>{iconChar}</Text>
                </View>

                <View style={styles.cardTextContent}>
                  <Text style={[styles.cardLabel, disabled && styles.textDisabled]}>
                    {cleanLabel}
                  </Text>
                  {choice.description ? (
                    <Text
                      style={[styles.cardDescription, disabled && styles.textDisabled]}
                      numberOfLines={2}
                    >
                      {choice.description}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.chevronWrapper}>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={disabled ? '#9CA3AF' : '#10B981'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

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
    marginBottom: 8,
  },
  // Chip styles for quick option buttons
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
  // Card styles for rich workflows
  cardListWrapper: {
    gap: 8,
  },
  workflowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardIconText: {
    fontSize: 20,
  },
  cardTextContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  chevronWrapper: {
    marginLeft: 6,
  },
  textDisabled: {
    color: '#9CA3AF',
  },
});
