import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PortionAdjusterProps {
  weight: number; // in grams
  onChangeWeight: (newWeight: number) => void;
  step?: number; // default 1 or 2
  min?: number;
  max?: number;
  compact?: boolean;
}

export const PortionAdjuster: React.FC<PortionAdjusterProps> = ({
  weight,
  onChangeWeight,
  step = 1,
  min = 1,
  max = 5000,
  compact = false,
}) => {
  const [inputText, setInputText] = useState<string>(weight.toString());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentWeightRef = useRef<number>(weight);

  useEffect(() => {
    currentWeightRef.current = weight;
    setInputText(weight.toString());
  }, [weight]);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const updateVal = (delta: number) => {
    const nextVal = Math.min(max, Math.max(min, currentWeightRef.current + delta));
    currentWeightRef.current = nextVal;
    setInputText(nextVal.toString());
    onChangeWeight(nextVal);
    Haptics.selectionAsync().catch(() => {});
  };

  const startAdjusting = (delta: number) => {
    updateVal(delta);
    // After 250ms initial hold, start repeating every 50ms
    timerRef.current = setTimeout(() => {
      repeatTimerRef.current = setInterval(() => {
        updateVal(delta);
      }, 50);
    }, 250);
  };

  const stopAdjusting = () => {
    clearTimers();
  };

  const handleManualTextChange = (text: string) => {
    setInputText(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(0, parsed));
      currentWeightRef.current = clamped;
      onChangeWeight(clamped);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputText);
    if (isNaN(parsed) || parsed < min) {
      currentWeightRef.current = min;
      setInputText(min.toString());
      onChangeWeight(min);
    }
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Minus Button */}
      <TouchableOpacity
        style={[styles.btn, compact && styles.btnCompact]}
        activeOpacity={0.6}
        onPressIn={() => startAdjusting(-step)}
        onPressOut={stopAdjusting}
      >
        <Ionicons name="remove" size={compact ? 16 : 20} color="#059669" />
      </TouchableOpacity>

      {/* Editable Numeric Text Input */}
      <View style={[styles.inputWrapper, compact && styles.inputWrapperCompact]}>
        <TextInput
          style={[styles.input, compact && styles.inputCompact]}
          keyboardType="numeric"
          value={inputText}
          onChangeText={handleManualTextChange}
          onBlur={handleBlur}
          selectTextOnFocus
        />
        <Text style={styles.unitText}>g</Text>
      </View>

      {/* Plus Button */}
      <TouchableOpacity
        style={[styles.btn, compact && styles.btnCompact]}
        activeOpacity={0.6}
        onPressIn={() => startAdjusting(step)}
        onPressOut={stopAdjusting}
      >
        <Ionicons name="add" size={compact ? 16 : 20} color="#059669" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  containerCompact: {
    borderRadius: 8,
    padding: 2,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  btnCompact: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 64,
    justifyContent: 'center',
  },
  inputWrapperCompact: {
    paddingHorizontal: 4,
    minWidth: 48,
  },
  input: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    minWidth: 36,
    padding: 0,
  },
  inputCompact: {
    fontSize: 13,
    minWidth: 28,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 2,
  },
});
