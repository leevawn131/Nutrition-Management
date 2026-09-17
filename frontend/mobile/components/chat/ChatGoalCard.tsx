import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface GoalProposalData {
  readyToApply: boolean;
  goalType: string;
  currentWeight?: number;
  targetWeight?: number;
  weeklyPaceKg?: number;
  tdee?: number;
  targetCalories: number;
  macros: {
    protein: number;
    carb: number;
    fat: number;
  };
  waterIntakeMl?: number;
  durationWeeks?: number;
  recommendationSummary?: string;
}

interface Props {
  goal: GoalProposalData;
  onApply: (goal: GoalProposalData) => void;
  isApplied?: boolean;
}

export const ChatGoalCard: React.FC<Props> = ({ goal, onApply, isApplied }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badgeIcon}>
          <MaterialCommunityIcons name="target" size={20} color="#10B981" />
        </View>
        <Text style={styles.headerTitle}>Mục tiêu gợi ý từ AI Tri</Text>
      </View>

      {goal.recommendationSummary ? (
        <Text style={styles.summaryText}>{goal.recommendationSummary}</Text>
      ) : null}

      <View style={styles.statContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mục tiêu nạp</Text>
          <Text style={styles.statValueHighlight}>{goal.targetCalories}</Text>
          <Text style={styles.statUnit}>kcal / ngày</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tiêu thụ TDEE</Text>
          <Text style={styles.statValue}>{goal.tdee || '---'}</Text>
          <Text style={styles.statUnit}>kcal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mục tiêu cân</Text>
          <Text style={styles.statValue}>{goal.targetWeight || '---'}</Text>
          <Text style={styles.statUnit}>kg</Text>
        </View>
      </View>

      <Text style={styles.macroHeading}>Tỷ lệ phân bổ dinh dưỡng (Macro):</Text>
      <View style={styles.macroRow}>
        <View style={[styles.macroPill, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.macroPillLabel, { color: '#DC2626' }]}>Đạm (Protein)</Text>
          <Text style={[styles.macroPillValue, { color: '#991B1B' }]}>{goal.macros.protein}g</Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.macroPillLabel, { color: '#D97706' }]}>Tinh bột (Carb)</Text>
          <Text style={[styles.macroPillValue, { color: '#92400E' }]}>{goal.macros.carb}g</Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.macroPillLabel, { color: '#2563EB' }]}>Chất béo (Fat)</Text>
          <Text style={[styles.macroPillValue, { color: '#1E40AF' }]}>{goal.macros.fat}g</Text>
        </View>
      </View>

      {goal.waterIntakeMl ? (
        <View style={styles.waterRow}>
          <MaterialCommunityIcons name="cup-water" size={16} color="#3B82F6" />
          <Text style={styles.waterText}>Nước khuyến nghị: {goal.waterIntakeMl} ml/ngày</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.applyButton, isApplied && styles.appliedButton]}
        onPress={() => !isApplied && onApply(goal)}
        disabled={isApplied}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={isApplied ? 'check-circle' : 'lightning-bolt'}
          size={18}
          color="#FFFFFF"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.applyButtonText}>
          {isApplied ? 'Đã kích hoạt mục tiêu này' : 'Áp dụng mục tiêu vào App'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  statValueHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  statUnit: {
    fontSize: 10,
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  macroHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  macroPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroPillValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  waterText: {
    fontSize: 12,
    color: '#1D4ED8',
    marginLeft: 6,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  appliedButton: {
    backgroundColor: '#94A3B8',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});