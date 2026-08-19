import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiaryScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(19);
  const [selectedWeek, setSelectedWeek] = useState<'prev' | 'current' | 'next'>('current');
  const [displayMode, setDisplayMode] = useState('Tất cả');
  const [displayModeVisible, setDisplayModeVisible] = useState(false);

  const diaryDays = [
    { day: 'T2', date: 17 },
    { day: 'T3', date: 18 },
    { day: 'T4', date: 19 },
    { day: 'T5', date: 20 },
    { day: 'T6', date: 21 },
    { day: 'T7', date: 22, weekend: true },
    { day: 'CN', date: 23, weekend: true },
  ];

  const displayModes = ['Tất cả', 'Đã ghi nhận', 'Chưa hoàn thành', 'Chỉ hoạt động', 'Chỉ bữa ăn'];

  const selectedDay = diaryDays.find((item) => item.date === selectedDate) ?? diaryDays[2];

  const getDayName = (day: string) => {
    switch (day) {
      case 'T2': return 'thứ hai';
      case 'T3': return 'thứ ba';
      case 'T4': return 'thứ tư';
      case 'T5': return 'thứ năm';
      case 'T6': return 'thứ sáu';
      case 'T7': return 'thứ bảy';
      case 'CN': return 'chủ nhật';
      default: return 'thứ tư';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nhật ký của bạn</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              accessibilityLabel="Điều hướng hoặc chia sẻ">
              <Ionicons name="paper-plane-outline" size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => router.push('/habit-analysis')}
              accessibilityLabel="Xem phân tích thói quen">
              <Ionicons name="bar-chart-outline" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Selector */}
        <View style={styles.weekPicker}>
          <TouchableOpacity
            style={[styles.weekCell, selectedWeek === 'prev' && styles.weekCellActive]}
            activeOpacity={0.7}
            onPress={() => setSelectedWeek('prev')}>
            <Text style={[styles.weekLabel, selectedWeek === 'prev' && styles.activeText]}>
              Tuần trước
            </Text>
            <Text style={[styles.weekDate, selectedWeek === 'prev' && styles.activeText]}>
              10/08 - 16/08
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.weekCell, selectedWeek === 'current' && styles.weekCellActive]}
            activeOpacity={0.7}
            onPress={() => setSelectedWeek('current')}>
            <Text style={[styles.weekLabel, selectedWeek === 'current' && styles.activeText]}>
              Tuần này
            </Text>
            <Text style={[styles.weekDate, selectedWeek === 'current' && styles.activeText]}>
              17/08 - 23/08
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.weekCell, selectedWeek === 'next' && styles.weekCellActive, selectedWeek !== 'next' && styles.weekCellDisabled]}
            activeOpacity={0.7}
            onPress={() => setSelectedWeek('next')}>
            <Text style={[styles.weekLabel, selectedWeek === 'next' && styles.activeText]}>
              Tuần sau
            </Text>
            <Text style={[styles.weekDate, selectedWeek === 'next' && styles.activeText]}>
              24/08 - 30/08
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day Picker */}
        <View style={styles.dayPicker}>
          {diaryDays.map((item) => {
            const isSelected = selectedDate === item.date;
            return (
              <TouchableOpacity
                key={item.date}
                style={[styles.dayCell, isSelected && styles.dayCellActive]}
                activeOpacity={0.7}
                onPress={() => setSelectedDate(item.date)}>
                <Text
                  style={[
                    styles.dayLabel,
                    item.weekend && styles.weekendText,
                    isSelected && styles.activeText,
                  ]}>
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dayDate,
                    item.weekend && styles.weekendText,
                    isSelected && styles.activeText,
                  ]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>
            {getDayName(selectedDay.day)}, {selectedDay.date} tháng 8, 2026
            {selectedDay.date === 19 ? ' · Hôm nay' : ''}
          </Text>

          <View style={styles.summaryRow}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={20}
              color="#F59E0B"
            />
            <Text style={styles.summaryLabel}>Bữa ăn đã ghi</Text>
            <View style={styles.mealDots}>
              {[0, 1, 2, 3].map((dot) => (
                <View key={dot} style={styles.mealDot} />
              ))}
            </View>
            <Text style={styles.summaryValue}>0/4</Text>
          </View>

          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name="dumbbell" size={20} color="#49C99B" />
            <Text style={styles.summaryLabel}>Vận động</Text>
            <View style={styles.activityLine} />
            <Text style={styles.summaryMuted}>--</Text>
          </View>
        </View>

        {/* Events in Day */}
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>Sự kiện trong ngày</Text>
          <TouchableOpacity
            onPress={() => setDisplayModeVisible(true)}
            style={styles.filterButton}
            activeOpacity={0.7}>
            <Text style={styles.filterText}>{displayMode}</Text>
            <Ionicons name="caret-down" size={14} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={38} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có dữ liệu hôm nay</Text>
          <Text style={styles.emptySubtitle}>
            Nhấn nút &quot;+&quot; ở thanh dưới để ghi lại bữa ăn và hoạt động.
          </Text>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={displayModeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisplayModeVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Chế độ hiển thị</Text>
            {displayModes.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modalOption,
                  displayMode === mode && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setDisplayMode(mode);
                  setDisplayModeVisible(false);
                }}>
                <Text
                  style={[
                    styles.modalOptionText,
                    displayMode === mode && styles.modalOptionTextActive,
                  ]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setDisplayModeVisible(false)}>
            <Text style={styles.modalCancelText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10294B',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  weekCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  weekCellActive: {
    backgroundColor: '#49C99B',
  },
  weekCellDisabled: {
    opacity: 0.55,
  },
  weekLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  weekDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10294B',
  },
  activeText: {
    color: '#FFFFFF',
  },
  dayPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 26,
  },
  dayCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  dayCellActive: {
    backgroundColor: '#49C99B',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
  },
  weekendText: {
    color: '#F87171',
  },
  summarySection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
    paddingTop: 24,
    paddingBottom: 28,
  },
  summaryTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 10,
    fontWeight: '500',
  },
  mealDots: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginLeft: 14,
  },
  mealDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#F1F2F5',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10294B',
    marginLeft: 10,
  },
  activityLine: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F2F5',
    marginLeft: 18,
    marginRight: 10,
  },
  summaryMuted: {
    fontSize: 16,
    color: '#CBD0D6',
    fontWeight: '700',
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  eventsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10294B',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F6F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#64748B',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
    textAlign: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalOption: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionActive: {
    backgroundColor: '#E6FAF2',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#10294B',
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: '#49C99B',
    fontWeight: '700',
  },
  modalCancelButton: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10294B',
  },
});
