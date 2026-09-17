import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    const guide = payload.exercise_guide;
    const sessions = guide.sessions || [];
    const formatDate = (value: string) => {
      const date = new Date(`${value}T00:00:00`);
      return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.cardHeader}>🏃 Lịch tập đề xuất</Text>
        <Text style={styles.exerciseTitle}>{guide.activity_name || 'Bài tập'}</Text>
        <Text style={styles.exerciseSummary}>
          {guide.frequency}  •  Cường độ {guide.health_consent ? 'vừa phải' : 'vừa đến khá'}
        </Text>
        {sessions.map((session: any) => (
          <View key={`${session.date}-${session.session}`} style={styles.sessionBlock}>
            <Text style={styles.sessionHeading}>Buổi {session.session} · {formatDate(session.date)}</Text>
            <Text style={styles.exerciseSession}>{session.activity} · {session.duration_minutes} phút</Text>
            {session.source === 'database' && (
              <Text style={styles.catalogSource}>Từ catalog bài tập · {session.met_value} MET</Text>
            )}
            <Text style={styles.exerciseDetail}>• {session.warmup}</Text>
            {session.exercises?.map((exercise: string) => (
              <Text key={exercise} style={styles.exerciseDetail}>• {exercise}</Text>
            ))}
            <Text style={styles.exerciseDetail}>• {session.cooldown}</Text>
          </View>
        ))}
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
  exerciseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 6,
  },
  exerciseSession: {
    fontSize: 12,
    color: '#7C2D12',
    marginTop: 4,
  },
  exerciseSummary: {
    fontSize: 12,
    color: '#7C2D12',
    marginBottom: 8,
  },
  sessionBlock: {
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    paddingTop: 8,
    marginTop: 6,
  },
  sessionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#7C2D12',
    marginTop: 3,
  },
  catalogSource: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 3,
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
