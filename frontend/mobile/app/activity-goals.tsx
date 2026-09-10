import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GoalMode = 'automatic' | 'fixed';

const stepPresets = [5000, 7500, 10000, 12500];
const minutePresets = [150, 200, 250, 300];
const strengthPresets = [1, 2, 3, 4];

function PresetRow({ values, selected, onSelect, format }: { values: number[]; selected: number; onSelect: (value: number) => void; format?: (value: number) => string }) {
  return <View style={styles.presetRow}>{values.map((value) => <TouchableOpacity key={value} style={[styles.preset, selected === value && styles.presetActive]} onPress={() => onSelect(value)}><Text style={[styles.presetText, selected === value && styles.presetTextActive]}>{format ? format(value) : value}</Text></TouchableOpacity>)}</View>;
}

function Stepper({ value, unit, onDecrease, onIncrease }: { value: number; unit: string; onDecrease: () => void; onIncrease: () => void }) {
  return <View style={styles.stepperRow}>
    <TouchableOpacity style={styles.stepperButton} onPress={onDecrease} accessibilityLabel="Giảm mục tiêu"><Text style={styles.stepperSymbol}>-</Text></TouchableOpacity>
    <View style={styles.stepperValue}><Text style={styles.stepperNumber}>{value}</Text><Text style={styles.stepperUnit}>{unit}</Text></View>
    <TouchableOpacity style={styles.stepperButton} onPress={onIncrease} accessibilityLabel="Tăng mục tiêu"><Text style={styles.stepperSymbol}>+</Text></TouchableOpacity>
  </View>;
}

function GoalModeCard({ mode, selected, title, description, onPress }: { mode: GoalMode; selected: boolean; title: string; description: string; onPress: () => void }) {
  return <TouchableOpacity style={[styles.modeCard, selected && styles.modeCardActive]} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.radio, selected && styles.radioActive]}>{selected && <View style={styles.radioDot} />}</View>
    <View style={styles.modeCopy}><Text style={styles.modeTitle}>{title}</Text><Text style={styles.modeDescription}>{description}</Text></View>
  </TouchableOpacity>;
}

export default function ActivityGoalsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<GoalMode>('automatic');
  const [steps, setSteps] = useState(7500);
  const [minutes, setMinutes] = useState(150);
  const [strengthSessions, setStrengthSessions] = useState(2);
  const [saved, setSaved] = useState(false);

  const updateValue = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, minimum: number, maximum: number, increment: number) => {
    setter(Math.min(maximum, Math.max(minimum, value + increment)));
    setSaved(false);
  };

  return <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại"><Ionicons name="arrow-back" size={24} color="#10294B" /></TouchableOpacity>
      <Text style={styles.headerTitle}>Mục tiêu vận động</Text>
      <View style={styles.headerSpacer} />
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Vận động hàng ngày</Text>
      <Text style={styles.pageDescription}>Đặt mục tiêu số bước chân mỗi ngày và tổng thời gian vận động mỗi tuần, để Health Hub theo dõi tiến độ cho bạn.</Text>

      <View style={styles.goalBlock}>
        <View style={styles.goalHeading}><View style={styles.goalIcon}><MaterialCommunityIcons name="shoe-sneaker" size={25} color="#EF6256" /></View><Text style={styles.goalTitle}>Số bước chân / ngày</Text></View>
        <PresetRow values={stepPresets} selected={steps} onSelect={(value) => { setSteps(value); setSaved(false); }} format={(value) => value.toLocaleString('vi-VN')} />
        <Stepper value={steps} unit="bước" onDecrease={() => updateValue(setSteps, steps, 1000, 50000, -500)} onIncrease={() => updateValue(setSteps, steps, 1000, 50000, 500)} />
        <Text style={styles.helperText}>Hôm nay: 0 bước</Text>
      </View>

      <View style={styles.goalBlock}>
        <View style={styles.goalHeading}><View style={styles.goalIcon}><Ionicons name="time-outline" size={26} color="#EF6256" /></View><Text style={styles.goalTitle}>Thời gian vận động / tuần</Text></View>
        <PresetRow values={minutePresets} selected={minutes} onSelect={(value) => { setMinutes(value); setSaved(false); }} format={(value) => `${value}'`} />
        <Stepper value={minutes} unit="phút" onDecrease={() => updateValue(setMinutes, minutes, 30, 600, -10)} onIncrease={() => updateValue(setMinutes, minutes, 30, 600, 10)} />
        <Text style={styles.helperText}>Khuyến nghị WHO: 150-300 phút/tuần. Đạt mục tiêu ngày trong 5/7 ngày là hoàn thành tuần đó.</Text>
      </View>

      <View style={styles.goalBlock}>
        <View style={styles.goalHeading}><View style={styles.goalIcon}><MaterialCommunityIcons name="dumbbell" size={25} color="#EF6256" /></View><Text style={styles.goalTitle}>Buổi tập kháng lực / tuần</Text></View>
        <PresetRow values={strengthPresets} selected={strengthSessions} onSelect={(value) => { setStrengthSessions(value); setSaved(false); }} />
        <Stepper value={strengthSessions} unit="buổi" onDecrease={() => updateValue(setStrengthSessions, strengthSessions, 0, 7, -1)} onIncrease={() => updateValue(setStrengthSessions, strengthSessions, 0, 7, 1)} />
        <Text style={styles.helperText}>Khuyến nghị ACSM: tối thiểu 2 buổi/tuần cho các nhóm cơ lớn, nghỉ ít nhất 48 giờ giữa 2 buổi cùng nhóm cơ.</Text>
      </View>

      <View style={styles.modeBlock}>
        <GoalModeCard mode="automatic" selected={mode === 'automatic'} title="Tự động điều chỉnh" description="Mục tiêu bước chân được điều chỉnh dần theo mức vận động thực tế của bạn." onPress={() => { setMode('automatic'); setSaved(false); }} />
        <GoalModeCard mode="fixed" selected={mode === 'fixed'} title="Cố định" description="Giữ nguyên mục tiêu bước chân bạn đã đặt cho đến khi bạn thay đổi." onPress={() => { setMode('fixed'); setSaved(false); }} />
      </View>
    </ScrollView>
    <View style={styles.footer}>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.saveButton, saved && styles.saveButtonActive]} onPress={() => setSaved(true)}><Text style={[styles.saveText, saved && styles.saveTextActive]}>{saved ? 'Đã lưu' : 'Lưu thay đổi'}</Text><Ionicons name="save-outline" size={20} color={saved ? '#FFFFFF' : '#B8BEC5'} /></TouchableOpacity>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 82, borderBottomWidth: 1, borderBottomColor: '#F0F1F3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 18 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 26, fontWeight: '800', color: '#10294B' },
  headerSpacer: { width: 48 },
  content: { padding: 32, paddingBottom: 150 },
  pageTitle: { fontSize: 27, fontWeight: '800', color: '#10294B', marginBottom: 8 },
  pageDescription: { fontSize: 19, lineHeight: 29, color: '#64748B', marginBottom: 28 },
  goalBlock: { marginBottom: 34 },
  goalHeading: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  goalIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' },
  goalTitle: { flex: 1, fontSize: 22, color: '#10294B' },
  presetRow: { flexDirection: 'row', gap: 14, marginBottom: 30 },
  preset: { flex: 1, height: 66, borderRadius: 16, backgroundColor: '#F3F3F4', alignItems: 'center', justifyContent: 'center' },
  presetActive: { backgroundColor: '#E5F9F2' },
  presetText: { fontSize: 20, color: '#64748B' },
  presetTextActive: { color: '#49C99B', fontWeight: '800' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  stepperButton: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  stepperSymbol: { color: '#49C99B', fontSize: 34, fontWeight: '300' },
  stepperValue: { flex: 1, height: 88, borderRadius: 16, backgroundColor: '#F3F3F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  stepperNumber: { fontSize: 36, fontWeight: '800', color: '#10294B' },
  stepperUnit: { fontSize: 21, color: '#64748B' },
  helperText: { fontSize: 18, lineHeight: 29, color: '#64748B', marginTop: 22 },
  modeBlock: { gap: 18, marginTop: 4 },
  modeCard: { minHeight: 160, borderRadius: 20, backgroundColor: '#F3F3F4', padding: 28, flexDirection: 'row', alignItems: 'center', gap: 28 },
  modeCardActive: { borderWidth: 3, borderColor: '#49C99B', backgroundColor: '#FFFFFF' },
  radio: { width: 43, height: 43, borderRadius: 22, borderWidth: 4, borderColor: '#73777B', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#49C99B' },
  radioDot: { width: 23, height: 23, borderRadius: 12, backgroundColor: '#49C99B' },
  modeCopy: { flex: 1 },
  modeTitle: { fontSize: 24, fontWeight: '800', color: '#10294B', marginBottom: 8 },
  modeDescription: { fontSize: 19, lineHeight: 29, color: '#64748B' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 32, paddingVertical: 18, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F1F3', flexDirection: 'row', justifyContent: 'space-between', gap: 18 },
  cancelButton: { width: 148, height: 64, borderRadius: 32, backgroundColor: '#F3F3F4', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 21, fontWeight: '700', color: '#10294B' },
  saveButton: { flex: 1, height: 64, borderRadius: 32, backgroundColor: '#F3F3F4', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  saveButtonActive: { backgroundColor: '#49C99B' },
  saveText: { fontSize: 19, fontWeight: '800', color: '#B8BEC5' },
  saveTextActive: { color: '#FFFFFF' },
});
