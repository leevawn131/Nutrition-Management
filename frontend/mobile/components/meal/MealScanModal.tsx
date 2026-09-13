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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
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

    // Close picker bottom-sheet first to avoid native modal collision
    onClose();

    setTimeout(async () => {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          // Give camera activity time to cleanly dismiss before opening PhotoConfirmModal
          setTimeout(() => {
            onImageSelected(asset.uri, asset.mimeType || 'image/jpeg');
          }, 250);
        }
      } catch (err: any) {
        console.error('Lỗi khi chụp ảnh:', err);
      }
    }, Platform.OS === 'ios' ? 300 : 100);
  };

  // Handle Gallery picker
  const handleChooseFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    // Close picker bottom-sheet first to avoid native modal collision
    onClose();

    setTimeout(async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          // Give gallery activity time to cleanly dismiss before opening PhotoConfirmModal
          setTimeout(() => {
            onImageSelected(asset.uri, asset.mimeType || 'image/jpeg');
          }, 250);
        }
      } catch (err: any) {
        console.error('Lỗi khi chọn ảnh từ thư viện:', err);
      }
    }, Platform.OS === 'ios' ? 300 : 100);
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
    <Modal
      visible={visible}
      transparent
      animationType={showTextInput ? 'fade' : 'slide'}
      onRequestClose={() => {
        if (showTextInput) {
          setShowTextInput(false);
        } else {
          onClose();
        }
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalBackdrop}>
          {/* Dismiss backdrop on press outside */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (showTextInput) {
                setShowTextInput(false);
              } else {
                onClose();
              }
            }}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.keyboardAvoidingContainer,
              showTextInput ? styles.centeredOverlay : styles.bottomOverlay,
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              style={[
                styles.modalCard,
                showTextInput ? styles.centeredCard : styles.bottomSheetCard,
              ]}
              onPress={(e) => e.stopPropagation()}
            >
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
                          const msg =
                            'Chụp ảnh rõ ràng các món ăn trong đĩa để AI nhận diện tốt nhất!\n\n• Đặt đĩa ăn ở trung tâm khuôn hình.\n• Giữ thiết bị cố định và đủ ánh sáng.';
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
                /* CENTERED POPUP MODAL FOR MEAL DESCRIPTION */
                <View style={styles.centeredInputContent}>
                  <View style={styles.popupIconHeader}>
                    <View style={styles.sparkleIconCircle}>
                      <Ionicons name="sparkles" size={24} color="#2563EB" />
                    </View>
                  </View>

                  <Text style={styles.popupTitle}>Mô tả bữa ăn</Text>
                  <Text style={styles.popupSubtitle}>
                    Ví dụ: "1 bát phở bò tái chín ít bánh, 1 quả trứng chần, 1 cốc trà đá"
                  </Text>

                  <TextInput
                    style={styles.popupTextInput}
                    placeholder="Nhập chi tiết các món ăn của bạn..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    value={textInput}
                    onChangeText={setTextInput}
                    autoFocus
                  />

                  <View style={styles.popupActions}>
                    <TouchableOpacity
                      style={styles.popupBackBtn}
                      onPress={() => setShowTextInput(false)}
                    >
                      <Text style={styles.popupBackBtnText}>Quay lại</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.popupSubmitBtn} onPress={handleTextSubmit}>
                      <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.popupSubmitBtnText}>Phân tích</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  bottomOverlay: {
    justifyContent: 'flex-end',
  },
  centeredOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    overflow: 'hidden',
  },
  bottomSheetCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  centeredCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
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
  centeredInputContent: {
    width: '100%',
    alignItems: 'center',
  },
  popupIconHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  sparkleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  popupTextInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  popupActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  popupBackBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  popupBackBtnText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  popupSubmitBtn: {
    flex: 1.3,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupSubmitBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
