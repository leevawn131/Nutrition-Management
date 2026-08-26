import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface CookingStepData {
  step_number: number;
  ingredients_used: string[];
  instruction: string;
  duration_seconds: number;
}

const DEFAULT_COOKING_STEPS: CookingStepData[] = [
  {
    step_number: 1,
    ingredients_used: [
      'Cá rô phi 500 g',
      'Tôm sú 300 g',
      'Ớt tươi (Ớt cay) 3 quả',
      'Hành khô (hành tím) 3 muỗng canh băm',
      'Tỏi ta 5 tép',
      'Cà chua 2 quả (vừa)',
      'Rau muống 300 g',
      'Cải thảo (bắp cải thảo) 300 g',
      'Mắm tôm đặc 20 g',
      'Nước 1.5 lít',
      'Dầu ăn 1 thìa canh',
      'Muối 1 thìa cà phê',
      'Đường kính 15 g',
      'Bún 600 g',
      'Rau mùi tàu (ngò gai) 20 g',
    ],
    instruction:
      'Sơ chế nguyên liệu: Cá rô phi làm sạch, đánh vảy, bỏ ruột, rửa sạch, cắt khúc vừa ăn. Tôm rửa sạch, rút chỉ đen trên lưng. Hành khô, tỏi băm nhỏ. Cà chua rửa sạch, cắt múi cau. Ớt tươi thái lát.',
    duration_seconds: 30 * 60, // 30 mins
  },
  {
    step_number: 2,
    ingredients_used: [
      'Dầu ăn 1 thìa canh',
      'Hành khô (hành tím) 3 muỗng canh băm',
      'Tỏi ta 5 tép',
      'Ớt tươi (Ớt cay) 3 quả',
      'Cà chua 2 quả (vừa)',
    ],
    instruction:
      'Xào thơm gia vị: Đặt nồi lên bếp, cho 1 thìa canh dầu ăn vào đun nóng. Phi thơm hành khô, tỏi băm và ớt tươi. Cho cà chua vào xào đến khi chín mềm ra màu đỏ tự nhiên đẹp mắt.',
    duration_seconds: 5 * 60, // 5 mins
  },
  {
    step_number: 3,
    ingredients_used: [
      'Nước 1.5 lít',
      'Mắm tôm đặc 20 g',
      'Muối 1 thìa cà phê',
      'Đường kính 15 g',
    ],
    instruction:
      'Nấu nước dùng lẩu: Đổ 1.5 lít nước vào nồi đun sôi. Nêm vào mắm tôm đặc, muối, đường kính, điều chỉnh vị chua cay mặn ngọt thanh nhẹ vừa khẩu vị.',
    duration_seconds: 10 * 60, // 10 mins
  },
  {
    step_number: 4,
    ingredients_used: ['Cá rô phi 500 g', 'Tôm sú 300 g'],
    instruction:
      'Nấu cá và tôm: Khi nước dùng sôi bùng, thả cá rô phi và tôm sú vào nấu trong khoảng 5-7 phút cho cá và tôm vừa chín tới, giữ trọn độ ngọt dai thơm ngon.',
    duration_seconds: 7 * 60, // 7 mins
  },
  {
    step_number: 5,
    ingredients_used: [
      'Rau muống 300 g',
      'Cải thảo (bắp cải thảo) 300 g',
      'Rau mùi tàu (ngò gai) 20 g',
      'Bún 600 g',
    ],
    instruction:
      'Thưởng thức: Bày nồi lẩu ra bàn ăn. Nhúng rau muống, cải thảo, rau mùi tàu vào nước lẩu sôi sùng sục. Ăn kèm bún tươi, chấm nước mắm ớt cay nồng tuyệt hảo!',
    duration_seconds: 20 * 60, // 20 mins
  },
];

interface CookingStepsModalProps {
  visible: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function CookingStepsModal({ visible, onClose, onCompleted }: CookingStepsModalProps) {
  const steps = DEFAULT_COOKING_STEPS;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState(currentStep.duration_seconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Update timer whenever step changes
  useEffect(() => {
    setTimeLeft(currentStep.duration_seconds);
    setIsTimerRunning(false);
  }, [currentStepIndex]);

  // Tick timer every second
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (Platform.OS === 'web') {
        window.alert(`Hết giờ cho Bước ${currentStep.step_number}! Hãy chuyển sang bước tiếp theo.`);
      } else {
        Alert.alert('Hết giờ nấu!', `Đã hoàn thành thời gian cho Bước ${currentStep.step_number}.`);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, currentStep.step_number]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed all steps
      const msg = '🎉 Chúc mừng! Bạn đã hoàn thành chế biến món ăn ngon miệng và giàu dinh dưỡng!';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Nấu ăn thành công', msg);
      }
      onCompleted?.();
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header matching Image 2 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handlePrevStep}
            activeOpacity={0.8}
            accessibilityLabel="Quay lại">
            <Ionicons name="arrow-back" size={22} color="#10294B" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Step {currentStepIndex + 1} of {totalSteps}
          </Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityLabel="Đóng">
            <Ionicons name="close" size={22} color="#10294B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Ingredient Pills Wrap */}
          <View style={styles.ingredientsWrap}>
            {currentStep.ingredients_used.map((ing, idx) => (
              <View key={idx} style={styles.ingredientPill}>
                <Text style={styles.ingredientPillText}>{ing}</Text>
              </View>
            ))}
          </View>

          {/* Step Instruction Text */}
          <Text style={styles.instructionText}>{currentStep.instruction}</Text>
        </ScrollView>

        {/* Floating Timer Widget matching Image 2 */}
        <View style={styles.timerContainer}>
          <View style={styles.timerBox}>
            <Text style={styles.timerDigits}>{formatTimer(timeLeft)}</Text>
            <TouchableOpacity
              style={styles.timerPlayButton}
              onPress={toggleTimer}
              activeOpacity={0.8}
              accessibilityLabel={isTimerRunning ? 'Tạm dừng hẹn giờ' : 'Bắt đầu hẹn giờ'}>
              <Ionicons
                name={isTimerRunning ? 'pause' : 'play'}
                size={22}
                color="#10294B"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Button matching Image 2 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextStep}
            activeOpacity={0.85}
            accessibilityLabel="Bước tiếp theo">
            <Text style={styles.nextButtonText}>
              {currentStepIndex === totalSteps - 1 ? 'Hoàn thành' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10294B',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 160,
  },
  ingredientsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 26,
  },
  ingredientPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  ingredientPillText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#10294B',
    fontWeight: '500',
  },
  timerContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  timerDigits: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10294B',
    letterSpacing: 1,
  },
  timerPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  nextButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#49C99B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#49C99B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
