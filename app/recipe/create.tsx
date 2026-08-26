import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { getAuthToken } from '@/services/storage.service';
import { API_BASE_URL } from '@/constants/api'; // Giả sử có API_BASE_URL

type Step = 1 | 2 | 3 | 4 | 5;

interface CookingStep {
  id: string;
  instruction: string;
  image_url?: string;
  image_base64?: string;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  image_url?: string;
}

export default function CreateRecipeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Ingredients State
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // Search Modal State
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Cooking Steps State
  const [cookingSteps, setCookingSteps] = useState<CookingStep[]>([
    { id: '1', instruction: '' }
  ]);
  const [activeStepIdForImage, setActiveStepIdForImage] = useState<string | null>(null);

  // Image Picker Modal
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock data for search
  const mockIngredients = [
    { id: '1', name: 'Hạt dưa hấu rang', image_url: 'https://via.placeholder.com/50' },
    { id: '2', name: 'Bột sắn dây', image_url: 'https://via.placeholder.com/50' },
    { id: '3', name: 'Dâu gia', image_url: 'https://via.placeholder.com/50' },
    { id: '4', name: 'Khoai riềng (củ dong riềng)', image_url: 'https://via.placeholder.com/50' },
    { id: '5', name: 'Bún dọc mùng', image_url: 'https://via.placeholder.com/50' },
    { id: '6', name: 'Sữa chua trái cây ít béo', image_url: 'https://via.placeholder.com/50' },
  ];

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(mockIngredients);
    } else {
      setSearchResults(mockIngredients.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [searchQuery]);

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  const pickImage = async (mode: 'camera' | 'gallery') => {
    setIsImagePickerVisible(false);
    triggerHaptic();

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert('Quyền bị từ chối', 'Ứng dụng cần quyền truy cập Camera và Thư viện ảnh.');
      return;
    }

    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    };

    if (mode === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      if (activeStepIdForImage) {
        // Cập nhật ảnh cho một bước nấu ăn
        setCookingSteps(cookingSteps.map(s => 
          s.id === activeStepIdForImage 
            ? { ...s, image_url: asset.uri, image_base64: `data:image/jpeg;base64,${asset.base64}` } 
            : s
        ));
        setActiveStepIdForImage(null);
      } else {
        // Cập nhật ảnh cho món ăn (Step 1)
        setImageUri(asset.uri);
        setBase64Image(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const handleNextStep1 = () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề món ăn.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Lỗi', 'Vui lòng thêm ảnh món ăn.');
      return;
    }
    triggerHaptic();
    setStep(2);
  };

  const handleNextStep2 = () => {
    triggerHaptic();
    setStep(3);
  };

  const handleNextStep3 = () => {
    // Validate
    const invalidSteps = cookingSteps.filter(s => !s.instruction.trim());
    if (invalidSteps.length > 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả cho tất cả các bước hướng dẫn.');
      return;
    }
    triggerHaptic();
    setStep(4);
  };

  const handleAddIngredient = (item: any) => {
    triggerHaptic();
    setIsSearchVisible(false);
    setSearchQuery('');
    
    // Check if already added
    if (!ingredients.find(i => i.id === item.id)) {
      setIngredients([...ingredients, { ...item, quantity: '1', unit: 'g' }]);
    }
  };

  const updateIngredientQuantity = (id: string, qty: string) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeIngredient = (id: string) => {
    triggerHaptic();
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const handleSubmit = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Không tìm thấy token');

      // Gửi dữ liệu lên API
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          image_base64: base64Image,
          prep_time_minutes: prepTime ? parseInt(prepTime) : 0,
          cook_time_minutes: cookTime ? parseInt(cookTime) : 0,
          is_public: isPublic,
          servings,
          ingredients: ingredients.map(i => ({
            ingredient_name: i.name,
            quantity: parseFloat(i.quantity || '0'),
            unit: i.unit,
          })),
          steps: cookingSteps.map((s, index) => ({
            step_number: index + 1,
            instruction: s.instruction,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Lưu thất bại');
      }

      setStep(5);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể lưu công thức. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
      </View>
    );
  };

  const renderStep1 = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Tiêu đề */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiêu đề <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Tên món ăn"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>
          <Text style={styles.charCount}>{title.length} / 50</Text>
        </View>

        {/* Ảnh món ăn */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ảnh món ăn <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.imagePicker, imageUri && styles.imagePickerActive]}
            onPress={() => {
              setActiveStepIdForImage(null);
              setIsImagePickerVisible(true);
            }}
            activeOpacity={0.8}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.pickedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#94A3B8" />
                <Text style={styles.imagePlaceholderText}>Thêm ảnh</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Mô tả */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <View style={[styles.inputWrapper, { height: 100 }]}>
            <TextInput
              style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
              placeholder="Mô tả về món ăn của bạn..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              maxLength={250}
              multiline
            />
          </View>
          <Text style={styles.charCount}>{description.length} / 250</Text>
        </View>

        {/* Thời gian */}
        <View style={styles.timeRow}>
          <View style={styles.timeInputGroup}>
            <Text style={styles.label}>Thời gian chuẩn bị</Text>
            <View style={styles.timeInputWrapper}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={prepTime}
                onChangeText={setPrepTime}
              />
              <Text style={styles.timeUnit}>phút</Text>
            </View>
          </View>
          <View style={styles.timeInputGroup}>
            <Text style={styles.label}>Thời gian nấu</Text>
            <View style={styles.timeInputWrapper}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={cookTime}
                onChangeText={setCookTime}
              />
              <Text style={styles.timeUnit}>phút</Text>
            </View>
          </View>
        </View>

        {/* Sự riêng tư */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sự riêng tư</Text>
          <TouchableOpacity 
            style={styles.privacyOption} 
            onPress={() => setIsPublic(!isPublic)}
            activeOpacity={0.8}
          >
            <View style={styles.privacyTextGroup}>
              <Text style={styles.privacyTitle}>{isPublic ? 'Công khai' : 'Riêng tư'}</Text>
              <Text style={styles.privacySubtitle}>
                {isPublic ? 'Mọi người có thể xem món ăn của bạn' : 'Chỉ mình bạn có thể xem món ăn này'}
              </Text>
            </View>
            <View style={styles.radioCircle}>
              {isPublic && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep1}>
          <Text style={styles.nextBtnText}>Tiếp theo ➔</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Khẩu phần */}
        <View style={styles.servingsRow}>
          <View>
            <Text style={styles.sectionTitle}>Khẩu phần</Text>
            <Text style={styles.sectionSubtitle}>(số lượng người dùng)</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setServings(Math.max(1, servings - 1))}
            >
              <Ionicons name="remove" size={20} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{servings}</Text>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setServings(servings + 1)}
            >
              <Ionicons name="add" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danh sách nguyên liệu */}
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>Danh sách nguyên liệu</Text>
          <Text style={styles.sectionSubtitle}>Ấn thêm thêm vào danh sách và vuốt trái để xóa nguyên liệu</Text>

          {ingredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientItem}>
              <View style={styles.ingredientAvatar}>
                {ing.image_url ? (
                  <Image source={{ uri: ing.image_url }} style={styles.ingredientImg} />
                ) : (
                  <Ionicons name="restaurant" size={24} color="#94A3B8" />
                )}
              </View>
              <Text style={styles.ingredientName} numberOfLines={2}>{ing.name}</Text>
              
              <View style={styles.ingredientControls}>
                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={ing.quantity}
                  onChangeText={(val) => updateIngredientQuantity(ing.id, val)}
                />
                <View style={styles.unitSelector}>
                  <Text style={styles.unitText}>{ing.unit}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.addIngredientBtn}
            onPress={() => setIsSearchVisible(true)}
          >
            <Text style={styles.addIngredientText}>Thêm nguyên liệu</Text>
          </TouchableOpacity>

          {ingredients.length === 0 && (
            <Text style={styles.emptyHintText}>
              Hãy tính toán lượng nguyên liệu dựa trên số lượng khẩu phần
            </Text>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep2}>
          <Text style={styles.nextBtnText}>Tiếp theo ➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {cookingSteps.map((s, index) => (
          <View key={s.id} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Bước {String(index + 1).padStart(2, '0')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <View style={[styles.inputWrapper, { height: 100 }]}>
                <TextInput
                  style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
                  placeholder="Nhập hướng dẫn cho từng bước..."
                  placeholderTextColor="#94A3B8"
                  value={s.instruction}
                  onChangeText={(text) => {
                    setCookingSteps(cookingSteps.map(step => 
                      step.id === s.id ? { ...step, instruction: text } : step
                    ));
                  }}
                  multiline
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ảnh/videos</Text>
              <TouchableOpacity 
                style={[styles.stepImagePicker, s.image_url && styles.imagePickerActive]}
                onPress={() => {
                  setActiveStepIdForImage(s.id);
                  setIsImagePickerVisible(true);
                }}
                activeOpacity={0.8}
              >
                {s.image_url ? (
                  <Image source={{ uri: s.image_url }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={24} color="#94A3B8" />
                    <Text style={styles.imagePlaceholderText}>Thêm ảnh/video</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={styles.addStepBtn}
          onPress={() => {
            triggerHaptic();
            setCookingSteps([...cookingSteps, { id: Date.now().toString(), instruction: '' }]);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addStepBtnText}>Thêm bước hướng dẫn</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep3}>
          <Text style={styles.nextBtnText}>Tiếp theo ➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Tóm tắt Info */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.editIconBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          {description ? <Text style={styles.summaryDesc}>{description}</Text> : null}
          
          <View style={styles.summaryImageWrapper}>
            <Image source={{ uri: imageUri! }} style={styles.summaryImage} />
            <TouchableOpacity onPress={() => setStep(1)} style={[styles.editIconBtn, styles.editIconAbsolute]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Thời gian chuẩn bị</Text>
              <Text style={styles.summaryValue}>{prepTime || 0} phút</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.editIconBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Thời gian nấu</Text>
              <Text style={styles.summaryValue}>{cookTime || 0} phút</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.editIconBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Chia sẻ</Text>
              <Text style={styles.summaryValue}>{isPublic ? 'Công khai' : 'Riêng tư'}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.editIconBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tóm tắt Nguyên liệu */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Nguyên liệu</Text>
            <TouchableOpacity onPress={() => setStep(2)} style={styles.editIconBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryLabel}>Dành cho: {servings} khẩu phần</Text>
          
          {/* List of ingredients can be shown here if needed */}
        </View>

        {/* Tóm tắt Hướng dẫn */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Hướng dẫn</Text>
            <TouchableOpacity onPress={() => setStep(3)} style={styles.editIconBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryLabel}>{cookingSteps.length} bước thực hiện</Text>
        </View>

      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={handleSubmit} disabled={isSaving}>
          <Text style={styles.doneBtnText}>{isSaving ? 'Đang lưu...' : 'Hoàn thành'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconWrapper}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark" size={60} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.successTitle}>Lưu thành công</Text>

      <View style={styles.successCard}>
        <Image source={{ uri: imageUri! }} style={styles.successImage} />
        <View style={styles.successCardBody}>
          <Text style={styles.successCardTitle}>{title}</Text>
          <Text style={styles.successCardDate}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.shareBtn}>
        <Ionicons name="share-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
        <Text style={styles.shareBtnText}>Chia sẻ</Text>
      </TouchableOpacity>

      <View style={[styles.footer, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backHomeBtnText}>Quay về trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewRecipeBtn} onPress={() => router.replace('/profile')}>
          <Text style={styles.viewRecipeBtnText}>Xem công thức</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      {step < 5 && (
        <View>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo món ăn của bạn</Text>
          </View>
          {renderProgressBar()}
        </View>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}

      {/* Image Picker Modal */}
      <Modal visible={isImagePickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheet}>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={() => pickImage('camera')}>
              <Ionicons name="camera" size={20} color="#0F172A" style={{ marginRight: 12 }} />
              <Text style={styles.actionSheetText}>Chụp ảnh</Text>
            </TouchableOpacity>
            <View style={styles.actionSheetDivider} />
            <TouchableOpacity style={styles.actionSheetBtn} onPress={() => pickImage('gallery')}>
              <Ionicons name="images" size={20} color="#0F172A" style={{ marginRight: 12 }} />
              <Text style={styles.actionSheetText}>Chọn ảnh từ thư viện</Text>
            </TouchableOpacity>
            <View style={styles.actionSheetDivider} />
            <TouchableOpacity style={[styles.actionSheetBtn, { justifyContent: 'center' }]} onPress={() => setIsImagePickerVisible(false)}>
              <Text style={[styles.actionSheetText, { color: '#F43F5E', textAlign: 'center' }]}>Huỷ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Search Ingredient Modal */}
      <Modal visible={isSearchVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.searchModalContainer}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchTitle}>Thêm nguyên liệu</Text>
            <TouchableOpacity style={styles.searchCloseBtn} onPress={() => setIsSearchVisible(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          <ScrollView>
            {searchResults.map((item) => (
              <TouchableOpacity key={item.id} style={styles.searchResultItem} onPress={() => handleAddIngredient(item)}>
                <Image source={{ uri: item.image_url }} style={styles.searchResultImg} />
                <Text style={styles.searchResultText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34D399',
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  required: {
    color: '#F43F5E',
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    color: '#0F172A',
  },
  charCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  },
  imagePicker: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePickerActive: {
    borderStyle: 'solid',
    borderWidth: 0,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  timeUnit: {
    fontSize: 14,
    color: '#0F2644',
    fontWeight: '500',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  privacyTextGroup: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  privacySubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  backBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  nextBtn: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneBtn: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Step 2
  servingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  stepperBtn: {
    padding: 10,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    width: 32,
    textAlign: 'center',
  },
  ingredientsSection: {
    flex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  ingredientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ingredientImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ingredientName: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  ingredientControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyInput: {
    width: 50,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    gap: 4,
  },
  unitText: {
    fontSize: 15,
    color: '#475569',
  },
  addIngredientBtn: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  addIngredientText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34D399',
  },
  emptyHintText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
  },
  
  // Step 3 (Cooking Steps)
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  stepImagePicker: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addStepBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addStepBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2644',
  },

  // Step 4 (Review)
  summarySection: {
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  editIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
  },
  summaryDesc: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
  },
  summaryImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  summaryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Step 4
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    color: '#0F2644',
    marginBottom: 32,
  },
  successCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
    overflow: 'hidden',
  },
  successImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  successCardBody: {
    padding: 20,
    alignItems: 'center',
  },
  successCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successCardDate: {
    fontSize: 13,
    color: '#94A3B8',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  backHomeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewRecipeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRecipeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionSheetText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchCloseBtn: {
    position: 'absolute',
    right: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  searchResultImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 16,
  },
  searchResultText: {
    fontSize: 15,
    color: '#0F172A',
  },
});
