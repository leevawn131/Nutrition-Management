import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { StepHeader } from '@/components/setup/step-header';
import { BodyIllustration } from '@/components/setup/body-illustration';
import { useSetup } from '@/context/setup-context';

type BodyType = 'low' | 'fit' | 'full' | 'high';

const BODY_TYPE_CARDS: { id: BodyType; title: string; desc: string; fatPct: number }[] = [
  { id: 'low', title: 'Mỡ thấp', desc: '(nhỏ hơn 15%)', fatPct: 13 },
  { id: 'fit', title: 'Cân đối', desc: '(15%-18%)', fatPct: 16 },
  { id: 'full', title: 'Đầy đặn', desc: '(19%-22%)', fatPct: 20 },
  { id: 'high', title: 'Mỡ cao', desc: '(lớn hơn 22%)', fatPct: 25 },
];

export default function SetupStep5Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizardData, updateWizardData } = useSetup();

  const [hasMeasurements, setHasMeasurements] = useState<boolean>(
    wizardData.hasBodyMeasurements !== undefined ? wizardData.hasBodyMeasurements : false
  );
  const [waist, setWaist] = useState<string>(wizardData.waist ? String(wizardData.waist) : '');
  const [hip, setHip] = useState<string>(wizardData.hip ? String(wizardData.hip) : '');
  const [selectedBodyType, setSelectedBodyType] = useState<BodyType>(
    (wizardData.body_type as BodyType) || 'fit'
  );

  const handleToggleMeasurementMode = (hasData: boolean) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setHasMeasurements(hasData);
  };

  const handleSelectBodyType = (type: BodyType) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSelectedBodyType(type);
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    const estimatedFat = BODY_TYPE_CARDS.find((c) => c.id === selectedBodyType)?.fatPct || 18;

    // Temporary calculation values (discarded after setup, not stored in MongoDB)
    updateWizardData({
      hasBodyMeasurements: hasMeasurements,
      waist: waist ? parseFloat(waist) : undefined,
      hip: hip ? parseFloat(hip) : undefined,
      body_type: selectedBodyType,
      body_fat: estimatedFat,
    });

    router.push('/(setup)/step-6');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StepHeader currentStep={5} totalSteps={12} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Để chúng tôi hiểu thêm về thể trạng của bạn</Text>
          <Text style={styles.title}>
            Bạn có sẵn các thông tin về số đo vòng bụng và vòng hông của mình không?
          </Text>
          <Text style={styles.description}>
            Chúng tôi sẽ dùng một công thức đơn giản để tính tỷ lệ mỡ cơ thể chính xác của bạn. Nếu
            không, đừng lo, chúng tôi có cách khác để ước lượng giúp bạn
          </Text>
        </View>

        {/* 2 Main Choice Cards */}
        <View style={styles.choiceGroup}>
          <TouchableOpacity
            style={[styles.choiceCard, hasMeasurements && styles.choiceCardSelected]}
            onPress={() => handleToggleMeasurementMode(true)}
            activeOpacity={0.88}>
            <View style={[styles.radioCircle, hasMeasurements && styles.radioCircleSelected]}>
              {hasMeasurements && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.choiceText}>Có, tôi có các số đo này</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choiceCard, !hasMeasurements && styles.choiceCardSelected]}
            onPress={() => handleToggleMeasurementMode(false)}
            activeOpacity={0.88}>
            <View style={[styles.radioCircle, !hasMeasurements && styles.radioCircleSelected]}>
              {!hasMeasurements && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.choiceText}>
              Không, tôi không có các số đo này hoặc không chắc chắn
            </Text>
          </TouchableOpacity>
        </View>

        {/* Branch 1: Has measurements (Inputs) */}
        {hasMeasurements ? (
          <View style={styles.measurementSection}>
            <Text style={styles.sectionHeader}>Nhập số đo của bạn</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Số đo vòng bụng của bạn:</Text>
              <Text style={styles.fieldSublabel}>(Đo tại vị trí điểm ngang rốn của bạn)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={waist}
                  onChangeText={setWaist}
                  placeholder="Ví dụ: 78"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.unitText}>cm</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Số đo vòng hông của bạn:</Text>
              <Text style={styles.fieldSublabel}>(Đo tại vị trí điểm lớn nhất vòng hông)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={hip}
                  onChangeText={setHip}
                  placeholder="Ví dụ: 92"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.unitText}>cm</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Branch 2: Visual Body Type Cards */
          <View style={styles.bodyTypeSection}>
            <Text style={styles.sectionHeader}>
              Bạn thấy hình ảnh nào trong số này giống với cơ thể của bạn nhất?
            </Text>
            <Text style={styles.sectionDesc}>
              Bạn có thể so sánh với các hình ảnh minh họa dưới đây để ước lượng mức mỡ cơ thể của
              mình một cách dễ dàng
            </Text>

            <View style={styles.bodyGrid}>
              {BODY_TYPE_CARDS.map((card) => {
                const isSelected = selectedBodyType === card.id;
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[styles.bodyCard, isSelected && styles.bodyCardSelected]}
                    onPress={() => handleSelectBodyType(card.id)}
                    activeOpacity={0.88}>
                    <BodyIllustration type={card.id} />

                    <View style={styles.bodyCardFooter}>
                      <View
                        style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.bodyCardTextWrapper}>
                        <Text style={styles.bodyCardTitle}>{card.title}</Text>
                        <Text style={styles.bodyCardDesc}>{card.desc}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color="#475569" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.88}>
            <Text style={styles.nextButtonText}>Tiếp theo</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F2644',
    lineHeight: 26,
    marginBottom: 8,
  },
  description: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 20,
  },
  choiceGroup: {
    gap: 12,
    marginBottom: 24,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    gap: 12,
  },
  choiceCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  choiceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2644',
    lineHeight: 20,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#34D399',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
  },
  measurementSection: {
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F2644',
    marginBottom: 6,
    lineHeight: 24,
  },
  sectionDesc: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F2644',
  },
  fieldSublabel: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  bodyTypeSection: {
    marginTop: 8,
  },
  bodyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bodyCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  bodyCardSelected: {
    borderColor: '#34D399',
    backgroundColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  bodyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  bodyCardTextWrapper: {
    flex: 1,
  },
  bodyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2644',
  },
  bodyCardDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    gap: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
