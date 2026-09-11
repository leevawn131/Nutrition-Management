import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface MealScanModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (imageUri: string, mimeType: string) => void;
  onTextDescriptionSelected: (description: string) => void;
  onManualCookingSelected: () => void;
  onViewGuide?: () => void;
}

export const MealScanModal: React.FC<MealScanModalProps> = ({
  visible,
  onClose,
  onImageSelected,
  onTextDescriptionSelected,
  onManualCookingSelected,
  onViewGuide,
}) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Handle Camera capture
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền truy cập Camera để chụp ảnh bữa ăn.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      onClose();
      onImageSelected(asset.uri, asset.mimeType || 'image/jpeg');
    }
  };

  // Handle Gallery picker
  const handleChooseFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      onClose();
      onImageSelected(asset.uri, asset.mimeType || 'image/jpeg');
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mô tả bữa ăn của bạn.');
      return;
    }
    const text = textInput.trim();
    setTextInput('');
    setShowTextInput(false);
    onClose();
    onTextDescriptionSelected(text);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {!showTextInput ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Quét bữa ăn của bạn</Text>
                <Text style={styles.subtitle}>
                  Miu miu sẽ phân tích bữa ăn của bạn và tính toán dinh dưỡng giúp bạn!
                </Text>
              </View>

              {/* Options list */}
              <View style={styles.optionsList}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    if (onViewGuide) {
                      onViewGuide();
                    } else {
                      const msg = 'Chụp ảnh rõ ràng các món ăn trong đĩa để AI nhận diện tốt nhất!\n\n• Đặt đĩa ăn ở trung tâm khuôn hình.\n• Giữ thiết bị cố định và đủ ánh sáng.';
                      if (Platform.OS === 'web') {
                        window.alert(`📸 Hướng dẫn quét bữa ăn:\n\n${msg}`);
                      } else {
                        Alert.alert('📸 Hướng dẫn quét bữa ăn', msg);
                      }
                    }
                  }}
                >
                  <Ionicons name="help-circle-outline" size={22} color="#64748B" style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: '#1E293B' }]}>Xem hướng dẫn</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={handleTakePhoto}>
                  <Ionicons name="camera-outline" size={22} color="#10B981" style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: '#10B981', fontWeight: '600' }]}>Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={handleChooseFromLibrary}>
                  <Ionicons name="image-outline" size={22} color="#D97706" style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: '#D97706', fontWeight: '600' }]}>Chọn từ thư viện</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={() => setShowTextInput(true)}>
                  <Ionicons name="sparkles-outline" size={22} color="#2563EB" style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: '#2563EB', fontWeight: '600' }]}>Mô tả bữa ăn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionRow, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    onClose();
                    onManualCookingSelected();
                  }}
                >
                  <Ionicons name="restaurant-outline" size={22} color="#8B5CF6" style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: '#8B5CF6', fontWeight: '600' }]}>
                    Tự nấu & Ghi thủ công
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.textInputContainer}>
              <Text style={styles.title}>Mô tả bữa ăn</Text>
              <Text style={styles.subtitle}>Ví dụ: "1 bát phở bò tái chín ít bánh, 1 quả trứng chần"</Text>

              <TextInput
                style={styles.textInput}
                placeholder="Nhập chi tiết các món ăn..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={textInput}
                onChangeText={setTextInput}
                autoFocus
              />

              <View style={styles.textInputActions}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    setShowTextInput(false);
                  }}
                >
                  <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleTextSubmit}>
                  <Text style={styles.submitBtnText}>Phân tích</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  optionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  textInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    marginVertical: 14,
  },
  textInputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
