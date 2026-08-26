import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { mealService } from '@/services/meal.service';
import { getAuthToken } from '@/services/storage.service';
import { AIAnalyzedFood, MealType } from '@/types/meal.types';

type ScreenState = 'idle' | 'text_input' | 'analyzing' | 'results' | 'error';

export default function AIVisionScreen() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  const [inputText, setInputText] = useState('');
  
  const [foods, setFoods] = useState<AIAnalyzedFood[]>([]);
  const [recognitionId, setRecognitionId] = useState<string>('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to trigger haptics
  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert('Quyền truy cập bị từ chối', 'Ứng dụng cần quyền truy cập Camera và Thư viện ảnh để hoạt động.');
      return false;
    }
    return true;
  };

  const pickImage = async (mode: 'camera' | 'gallery') => {
    triggerHaptic();
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    };

    if (mode === 'camera') {
      if (Platform.OS === 'web') {
        alert('Lưu ý: Trên trình duyệt Web, Máy ảnh sẽ tự động chuyển thành chọn File ảnh. Hãy dùng điện thoại để trải nghiệm Camera thật!');
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setBase64Image(`data:image/jpeg;base64,${asset.base64}`);
      analyzeImage(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const analyzeImage = async (base64: string) => {
    setScreenState('analyzing');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Không tìm thấy token đăng nhập');

      const response = await mealService.analyzeMealImage(base64, token);
      
      setFoods(response.foods);
      setRecognitionId(response.recognition_id);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setScreenState('results');
    } catch (error: any) {
      setScreenState('error');
    }
  };

  const analyzeText = async () => {
    if (!inputText.trim()) return;
    
    setScreenState('analyzing');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Không tìm thấy token đăng nhập');

      const response = await mealService.analyzeMealText(inputText, token);
      
      setFoods(response.foods);
      setRecognitionId(response.recognition_id);
      setImageUri(null); // Không có ảnh cho mô tả text
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setScreenState('results');
    } catch (error: any) {
      setScreenState('error');
    }
  };

  const handleSaveMeal = async () => {
    if (foods.length === 0) return;
    
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Không tìm thấy token đăng nhập');

      await mealService.saveMealLogs(
        {
          confirmed_foods: foods,
          meal_type: mealType,
          source_image_url: imageUri || '', // Trống nếu là text
          recognition_id: recognitionId,
          description: description.trim() !== '' ? description : inputText, // Dùng inputText làm mặc định nếu description trống
        },
        token
      );

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Thành công', 'Bữa ăn đã được lưu vào nhật ký!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/diary') }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi lưu bữa ăn', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalMacros = () => {
    return foods.reduce(
      (acc, curr) => ({
        calories: acc.calories + curr.calories,
        protein: acc.protein + curr.protein_g,
        carb: acc.carb + curr.carb_g,
        fat: acc.fat + curr.fat_g,
      }),
      { calories: 0, protein: 0, carb: 0, fat: 0 }
    );
  };

  const renderIdleState = () => (
    <View style={styles.idleContainer}>
      <View style={styles.idleHeader}>
        <Text style={styles.idleTitle}>Quét bữa ăn của bạn</Text>
        <Text style={styles.idleSubtitle}>Miu miu sẽ phân tích bữa ăn của bạn và tính toán dinh dưỡng giúp bạn!</Text>
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.primaryActionBtn} onPress={() => pickImage('camera')} activeOpacity={0.8}>
          <View style={styles.iconCircle}>
            <Ionicons name="camera" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.primaryActionText}>Chụp ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => pickImage('gallery')} activeOpacity={0.8}>
          <Ionicons name="images-outline" size={24} color="#F59E0B" />
          <Text style={[styles.secondaryActionText, { color: '#F59E0B' }]}>Chọn từ Thư viện</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryActionBtn, { borderColor: '#DBEAFE', backgroundColor: '#EFF6FF' }]} onPress={() => setScreenState('text_input')} activeOpacity={0.8}>
          <MaterialCommunityIcons name="text-box-edit-outline" size={24} color="#3B82F6" />
          <Text style={[styles.secondaryActionText, { color: '#3B82F6' }]}>Mô tả bữa ăn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTextInputState = () => (
    <View style={styles.textInputContainer}>
      <View style={styles.textInputHeader}>
        <Text style={styles.textInputTitle}>Bạn đã ăn gì?</Text>
        <Text style={styles.textInputSubtitle}>Mô tả càng chi tiết, kết quả càng chính xác!</Text>
      </View>
      
      <View style={styles.textAreaWrapper}>
        <TextInput
          style={styles.textArea}
          placeholder="VD: Ăn 1 tô phở bò tái lớn, 2 viên bò viên, uống 1 ly nước cam..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          value={inputText}
          onChangeText={setInputText}
          maxLength={500}
          autoFocus
        />
        <Text style={styles.charCount}>{inputText.length} / 500</Text>
      </View>

      <View style={styles.textInputFooter}>
        <TouchableOpacity 
          style={[styles.analyzeBtn, !inputText.trim() && styles.analyzeBtnDisabled]} 
          onPress={analyzeText}
          disabled={!inputText.trim()}>
          <MaterialCommunityIcons name="magic-staff" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>Phân tích dinh dưỡng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAnalyzingState = () => (
    <View style={styles.analyzingContainer}>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} blurRadius={10} />
          <View style={styles.scanOverlay}>
            <ActivityIndicator size="large" color="#34D399" />
            <Text style={styles.analyzingText}>AI đang phân tích ảnh...</Text>
            <Text style={styles.analyzingSubtext}>Đang bóc tách thành phần dinh dưỡng</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.scanOverlay, { backgroundColor: '#F8FAFC' }]}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.analyzingText, { color: '#3B82F6' }]}>AI đang đọc mô tả...</Text>
          <Text style={[styles.analyzingSubtext, { color: '#64748B' }]}>Đang bóc tách món ăn từ văn bản của bạn</Text>
        </View>
      )}
    </View>
  );

  const renderResultsState = () => {
    const totals = getTotalMacros();
    
    return (
      <View style={styles.resultsContainer}>
        {imageUri ? (
          <View style={styles.resultImageHeader}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.resultImageHeader, { height: '15%', backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="text-recognition" size={48} color="rgba(255,255,255,0.3)" />
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.bottomSheet, !imageUri && { marginTop: -20 }]}>
          <View style={styles.dragHandle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Meal Type Selector */}
            <View style={styles.segmentControl}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.segmentBtn, mealType === type && styles.segmentBtnActive]}
                  onPress={() => { triggerHaptic(); setMealType(type); }}
                >
                  <Text style={[styles.segmentText, mealType === type && styles.segmentTextActive]}>
                    {type === 'breakfast' ? 'Sáng' : type === 'lunch' ? 'Trưa' : type === 'dinner' ? 'Tối' : 'Ăn nhẹ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal Description Input */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.inputLabel}>Mô tả bữa ăn (Tùy chọn)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VD: Phở bò bát lớn nhiều hành..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                maxLength={100}
              />
            </View>

            {/* Total Macros Dashboard */}
            <View style={styles.macroDashboard}>
              <View style={styles.caloCircle}>
                <Text style={styles.caloValue}>{Math.round(totals.calories)}</Text>
                <Text style={styles.caloLabel}>Kcal</Text>
              </View>
              <View style={styles.macroBarsContainer}>
                <MacroBar label="Protein" value={totals.protein} color="#F43F5E" max={150} />
                <MacroBar label="Carb" value={totals.carb} color="#3B82F6" max={200} />
                <MacroBar label="Fat" value={totals.fat} color="#F59E0B" max={80} />
              </View>
            </View>

            {/* Food Cards */}
            <Text style={styles.sectionTitle}>Món ăn nhận diện được ({foods.length})</Text>
            {foods.map((food, index) => (
              <View key={index} style={styles.foodCard}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodAmount}>{food.estimated_grams}g • Đánh giá: {Math.round(food.confidence * 100)}%</Text>
                  {(food.glycemic_index !== undefined || food.glycemic_load !== undefined) && (
                    <Text style={styles.foodGlycemic}>
                      GI: {food.glycemic_index || '?'} • GL: {food.glycemic_load || '?'}
                    </Text>
                  )}
                </View>
                <Text style={styles.foodCalo}>{Math.round(food.calories)} kcal</Text>
              </View>
            ))}

            <View style={styles.spacer} />
          </ScrollView>

          {/* Sticky Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
              onPress={handleSaveMeal}
              disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Lưu vào nhật ký</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <TouchableOpacity 
        style={styles.errorCloseBtn} 
        onPress={() => {
          setScreenState('idle');
          setImageUri(null);
          setBase64Image(null);
        }}>
        <Ionicons name="close" size={20} color="#64748B" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.errorScrollContent}>
        <View style={styles.errorHeader}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIconText}>Error</Text>
          </View>
          <Text style={styles.errorTitle}>Không nhận diện được món ăn</Text>
          <Text style={styles.errorSubtitle}>Không thể phân tích bữa ăn. Vui lòng thử lại!</Text>
        </View>

        <View style={styles.suggestionsCard}>
          <Text style={styles.suggestionsTitle}>Gợi ý để cải thiện kết quả</Text>
          
          <View style={styles.suggestionItem}>
            <Ionicons name="checkmark" size={20} color="#34D399" />
            <Text style={styles.suggestionText}>Chụp ảnh trong điều kiện ánh sáng tốt.</Text>
          </View>
          
          <View style={styles.suggestionItem}>
            <Ionicons name="checkmark" size={20} color="#34D399" />
            <Text style={styles.suggestionText}>Đảm bảo món ăn nằm ở trung tâm khung hình.</Text>
          </View>
          
          <View style={styles.suggestionItem}>
            <Ionicons name="checkmark" size={20} color="#34D399" />
            <Text style={styles.suggestionText}>Tránh che khuất món ăn bằng tay hoặc đồ vật.</Text>
          </View>
          
          <View style={styles.suggestionItem}>
            <Ionicons name="checkmark" size={20} color="#34D399" />
            <Text style={styles.suggestionText}>Chụp từ góc độ dễ nhận diện nhất.</Text>
          </View>

          <Text style={styles.supportText}>
            Nếu vẫn gặp khó khăn, bạn có thể chụp lại hoặc liên hệ hỗ trợ.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.errorFooter}>
        <TouchableOpacity 
          style={styles.retakeBtn} 
          onPress={() => {
            setScreenState('idle');
            setImageUri(null);
            setBase64Image(null);
            // Có thể tự động gọi pickImage('camera') ở đây nếu muốn
          }}>
          <Ionicons name="camera" size={24} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.retakeBtnText}>Chụp lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={screenState === 'results' ? ['top'] : ['top', 'bottom']}>
      {(screenState === 'idle' || screenState === 'text_input') && (
        <>
          <TouchableOpacity style={styles.backBtnWrapper} onPress={() => {
            if (screenState === 'text_input') setScreenState('idle');
            else router.back();
          }}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          {screenState === 'idle' ? renderIdleState() : renderTextInputState()}
        </>
      )}
      {screenState === 'analyzing' && renderAnalyzingState()}
      {screenState === 'results' && renderResultsState()}
      {screenState === 'error' && renderErrorState()}
    </SafeAreaView>
  );
}

// Helper component for Macro Progress Bar
const MacroBar = ({ label, value, color, max }: { label: string, value: number, color: string, max: number }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.macroBarRow}>
      <Text style={styles.macroBarLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroBarValue}>{Math.round(value)}g</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backBtnWrapper: {
    padding: 20,
  },
  // Idle State
  idleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  idleHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  idleTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  idleSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionButtonsContainer: {
    gap: 16,
  },
  primaryActionBtn: {
    backgroundColor: '#34D399',
    borderRadius: 24,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 10,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  // Analyzing State
  analyzingContainer: {
    flex: 1,
  },
  imagePreviewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  analyzingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#E2E8F0',
  },
  // Results State
  resultsContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  resultImageHeader: {
    height: '35%',
    width: '100%',
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
    paddingTop: 12,
  },
  dragHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#0F172A',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  macroDashboard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  caloCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  caloValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  caloLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  macroBarsContainer: {
    flex: 1,
    gap: 12,
  },
  macroBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroBarLabel: {
    width: 48,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  macroTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroBarValue: {
    width: 32,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  foodAmount: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  foodGlycemic: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  foodCalo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  spacer: {
    height: 40,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#34D399',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Text Input State
  textInputContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  textInputHeader: {
    marginBottom: 32,
  },
  textInputTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  textInputSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  textAreaWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
    height: 250,
    position: 'relative',
  },
  textArea: {
    flex: 1,
    padding: 20,
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 24,
  },
  charCount: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  textInputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyzeBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeBtnDisabled: {
    opacity: 0.5,
  },
  // Error State
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  errorCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  errorHeader: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  errorIconContainer: {
    backgroundColor: '#F87171',
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#F87171',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  errorIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#34D399',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  supportText: {
    fontSize: 13,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  errorFooter: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#FFFFFF',
  },
  retakeBtn: {
    backgroundColor: '#34D399',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
