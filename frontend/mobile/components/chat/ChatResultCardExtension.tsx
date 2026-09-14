import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatResultCardExtensionProps {
  type: 'confirm' | 'result' | string;
  payload: any;
}

/**
 * Extension Point Component for Quoc and future cards (Goal, Exercise, System Results)
 */
export const ChatResultCardExtension: React.FC<ChatResultCardExtensionProps> = ({
  type,
  payload,
}) => {
  if (!payload) return null;

  // Confirm Card
  if (type === 'confirm') {
    return (
      <View style={styles.confirmCard}>
        <Text style={styles.confirmIcon}>🎉</Text>
        <View style={styles.confirmTextContainer}>
          <Text style={styles.confirmTitle}>Đã lưu thành công!</Text>
          <Text style={styles.confirmSub}>
            Đã thêm {payload.saved_count || 0} bữa ăn vào Kế hoạch dinh dưỡng của bạn.
          </Text>
        </View>
      </View>
    );
  }

  // Quoc's Goal Result Card Extension Point
  if (type === 'result' && payload.goal_result) {
    return (
      <View style={styles.goalCard}>
        <Text style={styles.cardHeader}>🎯 Mục tiêu dinh dưỡng khuyến nghị</Text>
        <Text style={styles.cardCalories}>
          {payload.goal_result.recommended_calories || 2000} kcal/ngày
        </Text>
      </View>
    );
  }

  // Quoc's Exercise Guide Card Extension Point
  if (type === 'result' && payload.exercise_guide) {
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.cardHeader}>🏃 Hướng dẫn bài tập</Text>
        <Text>{payload.exercise_guide.activity_name || 'Bài tập'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.genericCard}>
      <Text style={styles.genericText}>
        {typeof payload === 'string' ? payload : JSON.stringify(payload)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  confirmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    width: '100%',
  },
  confirmIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  confirmTextContainer: {
    flex: 1,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  confirmSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    width: '100%',
  },
  exerciseCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    width: '100%',
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  cardCalories: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  genericCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    width: '100%',
  },
  genericText: {
    fontSize: 12,
    color: '#4B5563',
  },
});
