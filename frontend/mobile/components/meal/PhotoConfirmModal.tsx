import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';

interface PhotoConfirmModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onAnalyze: (descriptionText: string) => void;
}

export const PhotoConfirmModal: React.FC<PhotoConfirmModalProps> = ({
  visible,
  imageUri,
  onClose,
  onAnalyze,
}) => {
  const [description, setDescription] = useState('');

  const handleAnalyzePress = () => {
    onAnalyze(description.trim());
  };

  if (!imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xác nhận ảnh</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Image Preview Card */}
          <View style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          </View>

          {/* Description prompt section */}
          <Text style={styles.sectionTitle}>Mô tả về món ăn:</Text>
          <Text style={styles.sectionSubtitle}>
            Hãy cho AI biết thêm thông tin để có kết quả chính xác hơn nhé!
          </Text>

          {/* Text Input Container */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ví dụ: Tôi chỉ ăn 1/2 bát cơm, phần thịt kho là 100g..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={300}
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.charCounter}>{description.length} / 300</Text>
          </View>
        </ScrollView>

        {/* Bottom Actions Row */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sparkleBtn}>
            <FontAwesome6 name="wand-magic-sparkles" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.micBtn}>
            <Ionicons name="mic-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAnalyzePress}>
            <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Phân tích bữa ăn</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  imageCard: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sparkleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
