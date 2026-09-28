import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface RoulettePickerConfig {
  type: 'age' | 'height' | 'weight' | 'dual_weight' | 'duration';
  min: number;
  max: number;
  default: number;
  defaultTarget?: number;
  unit: string;
}

interface RouletteWheelPickerProps {
  config: RoulettePickerConfig;
  onConfirm: (formattedValue: string) => void;
  onSwitchToManual: () => void;
  disabled?: boolean;
}

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 3;

export const RouletteWheelPicker: React.FC<RouletteWheelPickerProps> = ({
  config,
  onConfirm,
  onSwitchToManual,
  disabled = false,
}) => {
  const isDualWeight = config.type === 'dual_weight';

  const items = useMemo(() => {
    const list: number[] = [];
    for (let i = config.min; i <= config.max; i++) {
      list.push(i);
    }
    return list;
  }, [config.min, config.max]);

  // Dual weight state
  const [currentWeight, setCurrentWeight] = useState<number>(config.default || 65);
  const [targetWeight, setTargetWeight] = useState<number>(
    config.defaultTarget || Math.max(config.min, (config.default || 65) - 5)
  );
  const [activeTab, setActiveTab] = useState<'current' | 'target'>('current');

  // Single value state
  const defaultIndex = useMemo(() => {
    const targetVal = isDualWeight
      ? activeTab === 'current'
        ? currentWeight
        : targetWeight
      : config.default;
    const idx = items.indexOf(targetVal);
    return idx >= 0 ? idx : Math.floor(items.length / 2);
  }, [items, isDualWeight, activeTab, currentWeight, targetWeight, config.default]);

  const [selectedIndex, setSelectedIndex] = useState<number>(defaultIndex);
  const flatListRef = useRef<FlatList>(null);
  const isUserScrollingRef = useRef(false);

  // Sync index when config or activeTab changes
  useEffect(() => {
    const targetVal = isDualWeight
      ? activeTab === 'current'
        ? currentWeight
        : targetWeight
      : config.default;
    const idx = items.indexOf(targetVal);
    const validIdx = idx >= 0 ? idx : Math.floor(items.length / 2);

    setSelectedIndex(validIdx);
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: validIdx * ITEM_HEIGHT,
        animated: false,
      });
    }, 60);
  }, [config.type, activeTab, isDualWeight]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        void Haptics.selectionAsync();
      } catch {
        // ignore
      }
    }
  };

  const updateValueFromIndex = (index: number) => {
    const val = items[index];
    if (val === undefined) return;
    if (isDualWeight) {
      if (activeTab === 'current') {
        setCurrentWeight(val);
      } else {
        setTargetWeight(val);
      }
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    if (clampedIndex !== selectedIndex && isUserScrollingRef.current) {
      setSelectedIndex(clampedIndex);
      updateValueFromIndex(clampedIndex);
      triggerHaptic();
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrollingRef.current = false;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    setSelectedIndex(clampedIndex);
    updateValueFromIndex(clampedIndex);
    triggerHaptic();
  };

  const scrollToIndex = (index: number, animated = true) => {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setSelectedIndex(clamped);
    updateValueFromIndex(clamped);
    triggerHaptic();
    flatListRef.current?.scrollToOffset({
      offset: clamped * ITEM_HEIGHT,
      animated,
    });
  };

  const handleStep = (delta: number) => {
    if (disabled) return;
    scrollToIndex(selectedIndex + delta);
  };

  const selectedValue = items[selectedIndex] ?? config.default;

  // Presets / Quick jump chips
  const presets = useMemo(() => {
    if (config.type === 'age') {
      return [18, 20, 22, 25, 28, 30, 35, 40].filter((v) => v >= config.min && v <= config.max);
    }
    if (config.type === 'height') {
      return [150, 155, 160, 165, 170, 175, 180, 185].filter((v) => v >= config.min && v <= config.max);
    }
    if (config.type === 'duration') {
      return [4, 6, 8, 12, 16, 24].filter((v) => v >= config.min && v <= config.max);
    }
    if (isDualWeight) {
      if (activeTab === 'current') {
        return [50, 55, 60, 65, 70, 75, 80, 85].filter((v) => v >= config.min && v <= config.max);
      }
      // Relative targets
      return [-3, -5, -7, -10, 0, 3, 5];
    }
    return [45, 50, 55, 60, 65, 70, 75, 80].filter((v) => v >= config.min && v <= config.max);
  }, [config.type, config.min, config.max, isDualWeight, activeTab]);

  const handleTargetRelativePreset = (delta: number) => {
    const newTarget = Math.max(config.min, Math.min(config.max, currentWeight + delta));
    setTargetWeight(newTarget);
    const targetIdx = items.indexOf(newTarget);
    if (targetIdx >= 0) {
      scrollToIndex(targetIdx);
    }
  };

  const weightDiff = targetWeight - currentWeight;

  const titleText =
    config.type === 'age'
      ? '🎂 Chọn độ tuổi của bạn'
      : config.type === 'height'
      ? '📏 Chọn chiều cao của bạn'
      : config.type === 'duration'
      ? '⏱️ Chọn thời gian / kỳ hạn mục tiêu'
      : isDualWeight
      ? '⚖️ Chọn cân nặng hiện tại & mục tiêu'
      : '⚖️ Chọn cân nặng của bạn';

  return (
    <View style={styles.container}>
      {/* Header bar with title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{titleText}</Text>
          {!isDualWeight && (
            <View style={styles.valueBadge}>
              <Text style={styles.valueBadgeText}>
                {selectedValue} {config.unit}
              </Text>
            </View>
          )}
        </View>

        {/* Dual Weight Selection Cards (Current vs Target) */}
        {isDualWeight && (
          <View style={styles.dualCardsContainer}>
            <View style={styles.dualCardsRow}>
              <TouchableOpacity
                style={[
                  styles.dualCard,
                  activeTab === 'current' && styles.dualCardActive,
                ]}
                onPress={() => setActiveTab('current')}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="scale-outline"
                    size={16}
                    color={activeTab === 'current' ? '#059669' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.dualCardLabel,
                      activeTab === 'current' && styles.dualCardLabelActive,
                    ]}
                  >
                    Hiện tại
                  </Text>
                </View>
                <Text
                  style={[
                    styles.dualCardValue,
                    activeTab === 'current' && styles.dualCardValueActive,
                  ]}
                >
                  {currentWeight} <Text style={styles.dualCardUnit}>kg</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.arrowWrapper}>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
              </View>

              <TouchableOpacity
                style={[
                  styles.dualCard,
                  activeTab === 'target' && styles.dualCardActive,
                ]}
                onPress={() => setActiveTab('target')}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="flag-outline"
                    size={16}
                    color={activeTab === 'target' ? '#059669' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.dualCardLabel,
                      activeTab === 'target' && styles.dualCardLabelActive,
                    ]}
                  >
                    Muốn giảm / đạt
                  </Text>
                </View>
                <Text
                  style={[
                    styles.dualCardValue,
                    activeTab === 'target' && styles.dualCardValueActive,
                  ]}
                >
                  {targetWeight} <Text style={styles.dualCardUnit}>kg</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Difference / Goal Trend Badge */}
            <View style={styles.diffBadgeRow}>
              {weightDiff < 0 ? (
                <View style={[styles.diffBadge, styles.diffBadgeLose]}>
                  <Ionicons name="trending-down" size={15} color="#059669" />
                  <Text style={styles.diffBadgeTextLose}>
                    Mục tiêu: Giảm {Math.abs(weightDiff)} kg (từ {currentWeight}kg về {targetWeight}kg)
                  </Text>
                </View>
              ) : weightDiff > 0 ? (
                <View style={[styles.diffBadge, styles.diffBadgeGain]}>
                  <Ionicons name="trending-up" size={15} color="#2563EB" />
                  <Text style={styles.diffBadgeTextGain}>
                    Mục tiêu: Tăng {weightDiff} kg (tăng cơ/tăng cân)
                  </Text>
                </View>
              ) : (
                <View style={[styles.diffBadge, styles.diffBadgeMaintain]}>
                  <Ionicons name="shield-checkmark" size={15} color="#D97706" />
                  <Text style={styles.diffBadgeTextMaintain}>
                    Mục tiêu: Duy trì cân nặng ổn định ({currentWeight} kg)
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick jump chips */}
        <View style={styles.presetsRow}>
          {isDualWeight && activeTab === 'target' ? (
            <>
              {presets.map((delta) => {
                const label = delta === 0 ? 'Giữ nguyên' : delta < 0 ? `${delta} kg` : `+${delta} kg`;
                const isSelected = targetWeight === currentWeight + delta;
                return (
                  <TouchableOpacity
                    key={`target-delta-${delta}`}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handleTargetRelativePreset(delta)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            presets.map((val) => {
              const activeVal = isDualWeight ? currentWeight : selectedValue;
              const isMatch = val === activeVal;
              const targetIndex = items.indexOf(val);
              const chipLabel =
                config.type === 'duration' && val === 8
                  ? '8 tuần ⭐'
                  : `${val} ${config.unit}`;
              return (
                <TouchableOpacity
                  key={`preset-${val}`}
                  style={[styles.presetChip, isMatch && styles.presetChipActive]}
                  onPress={() => targetIndex >= 0 && scrollToIndex(targetIndex)}
                  disabled={disabled}
                >
                  <Text style={[styles.presetChipText, isMatch && styles.presetChipTextActive]}>
                    {chipLabel}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* Roulette Wheel View */}
      <View style={styles.wheelWrapper}>
        {/* Selection Center Lens Highlight */}
        <View style={styles.lensHighlight} pointerEvents="none" />

        {/* Minus / Decrement step button */}
        <TouchableOpacity
          style={[styles.stepBtn, styles.stepBtnLeft, selectedIndex <= 0 && styles.stepBtnDisabled]}
          onPress={() => handleStep(-1)}
          disabled={disabled || selectedIndex <= 0}
        >
          <Ionicons name="remove" size={20} color={selectedIndex <= 0 ? '#CBD5E1' : '#10B981'} />
        </TouchableOpacity>

        {/* Scrolling Numbers List */}
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => `roulette-${item}`}
          style={styles.wheelList}
          contentContainerStyle={styles.wheelContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="center"
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          initialScrollIndex={defaultIndex}
          onScrollBeginDrag={() => {
            isUserScrollingRef.current = true;
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item, index }) => {
            const distance = Math.abs(index - selectedIndex);
            const isSelected = distance === 0;
            const opacity = isSelected ? 1 : distance === 1 ? 0.45 : 0.2;
            const scale = isSelected ? 1.15 : distance === 1 ? 0.95 : 0.85;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => scrollToIndex(index)}
                style={styles.itemRow}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.itemNumber,
                    isSelected ? styles.itemNumberSelected : styles.itemNumberUnselected,
                    { opacity, transform: [{ scale }] },
                  ]}
                >
                  {item}
                  {isSelected && <Text style={styles.itemUnit}> {config.unit}</Text>}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Plus / Increment step button */}
        <TouchableOpacity
          style={[
            styles.stepBtn,
            styles.stepBtnRight,
            selectedIndex >= items.length - 1 && styles.stepBtnDisabled,
          ]}
          onPress={() => handleStep(1)}
          disabled={disabled || selectedIndex >= items.length - 1}
        >
          <Ionicons
            name="add"
            size={20}
            color={selectedIndex >= items.length - 1 ? '#CBD5E1' : '#10B981'}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom action controls */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={onSwitchToManual}
          disabled={disabled}
        >
          <Ionicons name="keypad-outline" size={18} color="#64748B" />
          <Text style={styles.manualBtnText}>Tự nhập số</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, disabled && styles.confirmBtnDisabled]}
          onPress={() => {
            if (isDualWeight) {
              onConfirm(`Hiện tại ${currentWeight}kg, mục tiêu ${targetWeight}kg`);
            } else {
              onConfirm(`${selectedValue} ${config.unit}`);
            }
          }}
          disabled={disabled}
        >
          <Text style={styles.confirmBtnText}>
            {isDualWeight
              ? `Hoàn tất (${currentWeight}kg → ${targetWeight}kg)`
              : `Hoàn tất (${selectedValue} ${config.unit})`}
          </Text>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  valueBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  valueBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  dualCardsContainer: {
    marginBottom: 8,
  },
  dualCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dualCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dualCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  dualCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dualCardLabelActive: {
    color: '#059669',
  },
  dualCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  dualCardValueActive: {
    color: '#0F172A',
  },
  dualCardUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  arrowWrapper: {
    paddingHorizontal: 2,
  },
  diffBadgeRow: {
    marginTop: 6,
    alignItems: 'center',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  diffBadgeLose: {
    backgroundColor: '#ECFDF5',
  },
  diffBadgeGain: {
    backgroundColor: '#EFF6FF',
  },
  diffBadgeMaintain: {
    backgroundColor: '#FFFBEB',
  },
  diffBadgeTextLose: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  diffBadgeTextGain: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  diffBadgeTextMaintain: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  wheelWrapper: {
    height: ITEM_HEIGHT * VISIBLE_COUNT,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  lensHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 1,
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    zIndex: 1,
  },
  stepBtn: {
    position: 'absolute',
    top: ITEM_HEIGHT * 1 + 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  stepBtnLeft: {
    left: 28,
  },
  stepBtnRight: {
    right: 28,
  },
  stepBtnDisabled: {
    opacity: 0.4,
    borderColor: '#E2E8F0',
  },
  wheelList: {
    width: '100%',
    height: ITEM_HEIGHT * VISIBLE_COUNT,
    zIndex: 5,
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT * 1,
  },
  itemRow: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumber: {
    textAlign: 'center',
  },
  itemNumberSelected: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemNumberUnselected: {
    fontSize: 17,
    fontWeight: '500',
    color: '#64748B',
  },
  itemUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
