import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';

interface PhotoConfirmModalProps {
  visible: boolean;
  imageUri?: string | null;
  images?: Array<{ uri: string; mimeType: string }> | null;
  onClose: () => void;
  onAnalyze: (descriptionText: string) => void;
  onRemoveImage?: (index: number) => void;
  onAddMoreImages?: () => void;
}

export const PhotoConfirmModal: React.FC<PhotoConfirmModalProps> = ({
  visible,
  imageUri,
  images,
  onClose,
  onAnalyze,
  onRemoveImage,
  onAddMoreImages,
}) => {
  const [description, setDescription] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Normalize image list
  const photoList = images && images.length > 0
    ? images
    : imageUri
    ? [{ uri: imageUri, mimeType: 'image/jpeg' }]
    : [];

  const handleAnalyzePress = () => {
    onAnalyze(description.trim());
  };

  if (photoList.length === 0) return null;

  const currentActiveUri = photoList[activeIndex]?.uri || photoList[0]?.uri;

  return (
    <Modal visible={visible && (photoList.length > 0 || !!imageUri)} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Xác nhận ảnh bữa ăn</Text>
            {photoList.length > 1 && (
              <Text style={styles.headerSubBadge}>
                {photoList.length} ảnh đã chọn
              </Text>
            )}
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Active Image Preview Card */}
          <View style={styles.imageCard}>
            {currentActiveUri ? (
              <Image source={{ uri: currentActiveUri }} style={styles.previewImage} contentFit="cover" />
            ) : null}
            {photoList.length > 1 && (
              <View style={styles.counterFloatingBadge}>
                <Ionicons name="images" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.counterFloatingText}>
                  {activeIndex + 1} / {photoList.length}
                </Text>
              </View>
            )}
          </View>

          {/* Multiple Photos Thumbnail Strip */}
          {photoList.length > 1 && (
            <View style={styles.thumbnailsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailsScroll}>
                {photoList.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <View key={idx} style={styles.thumbnailWrapper}>
                      <TouchableOpacity
                        style={[styles.thumbnailCard, isActive && styles.thumbnailCardActive]}
                        onPress={() => setActiveIndex(idx)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                      </TouchableOpacity>

                      {onRemoveImage && photoList.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteThumbnailBtn}
                          onPress={() => {
                            if (activeIndex >= photoList.length - 1) {
                              setActiveIndex(Math.max(0, photoList.length - 2));
                            }
                            onRemoveImage(idx);
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {onAddMoreImages && photoList.length < 5 && (
                  <TouchableOpacity style={styles.addMoreThumbBtn} onPress={onAddMoreImages}>
                    <Ionicons name="add" size={22} color="#10B981" />
                    <Text style={styles.addMoreThumbText}>Thêm</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* Description prompt section */}
          <Text style={styles.sectionTitle}>Mô tả thêm về bữa ăn (nếu có):</Text>
          <Text style={styles.sectionSubtitle}>
            Bạn có thể ghi chú khẩu phần ăn thực tế, nước chấm, hoặc phần ăn dở để AI ước lượng chính xác nhất!
          </Text>

          {/* Text Input Container */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ví dụ: Đĩa cơm sườn ăn 1/2, ly trà đá ít ngọt, đĩa rau xào ăn hết..."
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
          <TouchableOpacity style={styles.submitBtn} onPress={handleAnalyzePress}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>
              Phân tích {photoList.length > 1 ? `${photoList.length} ảnh` : 'bữa ăn'}
            </Text>
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
  headerSubBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  counterFloatingBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterFloatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  thumbnailsContainer: {
    marginBottom: 18,
  },
  thumbnailsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnailCard: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  thumbnailCardActive: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  deleteThumbnailBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  addMoreThumbBtn: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreThumbText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
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
