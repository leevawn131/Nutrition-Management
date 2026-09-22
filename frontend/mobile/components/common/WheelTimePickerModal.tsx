import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface WheelTimePickerModalProps {
  visible: boolean;
  currentTimeStr: string; // HH:mm
  onClose: () => void;
  onSelectTime: (timeStr: string) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // 5 items visible in list
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export const WheelTimePickerModal: React.FC<WheelTimePickerModalProps> = ({
  visible,
  currentTimeStr,
  onClose,
  onSelectTime,
}) => {
  // Parse initial hour and minute
  const parseTime = (tStr: string) => {
    try {
      const parts = tStr.split(':');
      if (parts.length >= 2) {
        const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
        const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
        return { hour: h, minute: m };
      }
    } catch {
      // fallback
    }
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  };

  const initial = parseTime(currentTimeStr);
  const [selectedHour, setSelectedHour] = useState<number>(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initial.minute);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Sync scroll position on open
  useEffect(() => {
    if (visible) {
      const init = parseTime(currentTimeStr);
      setSelectedHour(init.hour);
      setSelectedMinute(init.minute);

      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: init.hour * ITEM_HEIGHT,
          animated: false,
        });
        minuteScrollRef.current?.scrollTo({
          y: init.minute * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [visible, currentTimeStr]);

  const handleHourScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(23, index));
    if (clamped !== selectedHour) {
      setSelectedHour(clamped);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleMinuteScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(59, index));
    if (clamped !== selectedMinute) {
      setSelectedMinute(clamped);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const scrollToHour = (h: number) => {
    setSelectedHour(h);
    hourScrollRef.current?.scrollTo({ y: h * ITEM_HEIGHT, animated: true });
    Haptics.selectionAsync().catch(() => {});
  };

  const scrollToMinute = (m: number) => {
    setSelectedMinute(m);
    minuteScrollRef.current?.scrollTo({ y: m * ITEM_HEIGHT, animated: true });
    Haptics.selectionAsync().catch(() => {});
  };

  const setPreset = (h: number, m: number) => {
    scrollToHour(h);
    scrollToMinute(m);
  };

  const setNow = () => {
    const now = new Date();
    scrollToHour(now.getHours());
    scrollToMinute(now.getMinutes());
  };

  const handleConfirm = () => {
    const formatted = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onSelectTime(formatted);
    onClose();
  };

  const paddingItemsCount = Math.floor(VISIBLE_ITEMS / 2); // 2 padding items on top and bottom

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="time" size={22} color="#059669" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Chọn giờ ăn (Giống báo thức)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetChip} onPress={setNow}>
              <Text style={styles.presetChipText}>Bây giờ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPreset(7, 0)}>
              <Text style={styles.presetChipText}>Sáng 07:00</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPreset(12, 0)}>
              <Text style={styles.presetChipText}>Trưa 12:00</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPreset(19, 0)}>
              <Text style={styles.presetChipText}>Tối 19:00</Text>
            </TouchableOpacity>
          </View>

          {/* Wheel Selector Box */}
          <View style={styles.wheelContainer}>
            {/* Center highlight indicator line */}
            <View style={styles.centerSelectionIndicator} pointerEvents="none" />

            {/* Hours Column */}
            <View style={styles.columnWrapper}>
              <Text style={styles.columnHeader}>Giờ</Text>
              <ScrollView
                ref={hourScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleHourScroll}
                onScrollEndDrag={handleHourScroll}
                style={styles.scrollView}
                contentContainerStyle={{
                  paddingVertical: paddingItemsCount * ITEM_HEIGHT,
                }}
              >
                {hours.map((h) => {
                  const isSelected = h === selectedHour;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={styles.wheelItem}
                      onPress={() => scrollToHour(h)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {String(h).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Separator Colon */}
            <View style={styles.colonWrapper}>
              <Text style={styles.colonText}>:</Text>
            </View>

            {/* Minutes Column */}
            <View style={styles.columnWrapper}>
              <Text style={styles.columnHeader}>Phút</Text>
              <ScrollView
                ref={minuteScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMinuteScroll}
                onScrollEndDrag={handleMinuteScroll}
                style={styles.scrollView}
                contentContainerStyle={{
                  paddingVertical: paddingItemsCount * ITEM_HEIGHT,
                }}
              >
                {minutes.map((m) => {
                  const isSelected = m === selectedMinute;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={styles.wheelItem}
                      onPress={() => scrollToMinute(m)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Footer Action */}
          <View style={styles.footer}>
            <Text style={styles.previewText}>
              Thời gian đã chọn:{' '}
              <Text style={styles.previewHighlight}>
                {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
              </Text>
            </Text>
            <View style={styles.footerBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 18,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  wheelContainer: {
    flexDirection: 'row',
    height: CONTAINER_HEIGHT,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSelectionIndicator: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    backgroundColor: '#E6F4EA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    zIndex: 1,
  },
  columnWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  columnHeader: {
    position: 'absolute',
    top: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    zIndex: 3,
  },
  scrollView: {
    width: '100%',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#94A3B8',
  },
  wheelTextSelected: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  colonWrapper: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  colonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  previewText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
