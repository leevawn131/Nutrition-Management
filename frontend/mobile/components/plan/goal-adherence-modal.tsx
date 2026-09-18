import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SuggestedPlan } from '@/services/goal.service';

interface GoalAdherenceModalProps {
  visible: boolean;
  onClose: () => void;
  consecutiveDays: number;
  suggestedPlan?: SuggestedPlan | null;
  onAcceptSuggestion?: () => Promise<void> | void;
  onKeepCurrent: () => Promise<void> | void;
  onViewPlanDetails?: (templateId?: string) => void;
  loading?: boolean;
}

export function GoalAdherenceModal({
  visible,
  onClose,
  consecutiveDays,
  suggestedPlan,
  onAcceptSuggestion,
  onKeepCurrent,
  onViewPlanDetails,
  loading = false,
}: GoalAdherenceModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="compass-rose" size={32} color="#F59E0B" />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Đã {consecutiveDays} ngày bạn chưa theo sát kế hoạch
          </Text>

          {/* Subtitle */}
          <Text style={styles.description}>
            Chúng tôi nhận thấy bạn gặp khó khăn trong việc duy trì mục tiêu những ngày gần đây. Kế
            hoạch hiện tại có thể chưa phù hợp với lịch trình hoặc thể trạng thực tế của bạn.
          </Text>

          {/* Suggested Plan Box */}
          {suggestedPlan && (
            <View style={styles.suggestedBox}>
              <View style={styles.suggestedBadge}>
                <Ionicons name="sparkles" size={14} color="#10B981" />
                <Text style={styles.suggestedBadgeText}>Kế hoạch mới đề xuất</Text>
              </View>

              <View style={styles.calorieCompareRow}>
                <View style={styles.calCompareItem}>
                  <Text style={styles.calCompareLabel}>Hiện tại</Text>
                  <Text style={styles.calCompareOld}>
                    {suggestedPlan.currentCalories} <Text style={styles.unit}>kcal</Text>
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
                <View style={styles.calCompareItem}>
                  <Text style={[styles.calCompareLabel, { color: '#10B981' }]}>Gợi ý mới</Text>
                  <Text style={styles.calCompareNew}>
                    {suggestedPlan.suggestedTargetCalories} <Text style={styles.unit}>kcal</Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.reasonText}>{suggestedPlan.reason}</Text>

              {suggestedPlan.templates && suggestedPlan.templates[0] && (
                <View style={styles.templatePreviewBox}>
                  <Text style={styles.templatePreviewLabel}>Thực đơn mẫu đề xuất:</Text>
                  <Text style={styles.templatePreviewName} numberOfLines={1}>
                    🍴 {suggestedPlan.templates[0].name}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonsWrap}>
            <TouchableOpacity
              style={styles.viewPlanButton}
              onPress={() => onViewPlanDetails?.(suggestedPlan?.templates?.[0]?._id)}
              disabled={loading}
              activeOpacity={0.88}>
              <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
              <Text style={styles.viewPlanButtonText}>Xem chi tiết kế hoạch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepButton}
              onPress={onKeepCurrent}
              disabled={loading}
              activeOpacity={0.7}>
              <Text style={styles.keepButtonText}>Tiếp tục kế hoạch hiện tại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  description: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  suggestedBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  suggestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  suggestedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  calorieCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calCompareItem: {
    alignItems: 'center',
  },
  calCompareLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  calCompareOld: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  calCompareNew: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
  },
  templatePreviewBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  templatePreviewLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  templatePreviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  buttonsWrap: {
    width: '100%',
    gap: 10,
  },
  viewPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  viewPlanButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keepButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  keepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
