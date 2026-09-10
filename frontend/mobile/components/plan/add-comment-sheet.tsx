import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddCommentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (commentText: string) => void;
}

export function AddCommentSheet({ visible, onClose, onSubmit }: AddCommentSheetProps) {
  const [comment, setComment] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const maxLength = 500;

  const handleCameraPress = () => {
    const nextState = !hasPhoto;
    setHasPhoto(nextState);
    const msg = nextState
      ? 'Đã đính kèm ảnh chụp món ăn của bạn!'
      : 'Đã gỡ ảnh đính kèm.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Đính kèm ảnh', msg);
    }
  };

  const handleSendComment = () => {
    const trimmed = comment.trim();
    if (!trimmed) {
      if (Platform.OS === 'web') {
        window.alert('Vui lòng nhập nội dung bình luận!');
      } else {
        Alert.alert('Thông báo', 'Vui lòng nhập nội dung bình luận!');
      }
      return;
    }

    onSubmit(trimmed);
    const msg = '🎉 Cảm ơn bạn! Bình luận của bạn đã được gửi thành công.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Thành công', msg);
    }
    setComment('');
    setHasPhoto(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheetContainer}>
          {/* Top Handle Bar */}
          <View style={styles.sheetHandle} />

          {/* Header matching Image 3 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityLabel="Quay lại">
              <Ionicons name="arrow-back" size={22} color="#10294B" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Thêm bình luận</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Text Input Area */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Bạn đang nghĩ gì?"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={maxLength}
              value={comment}
              onChangeText={setComment}
              autoFocus
            />

            {/* Character Counter */}
            <Text style={styles.charCounter}>
              {comment.length} / {maxLength}
            </Text>
          </View>

          {/* Photo attachment preview if selected */}
          {hasPhoto && (
            <View style={styles.photoAttachedBadge}>
              <Ionicons name="image-outline" size={16} color="#EA580C" />
              <Text style={styles.photoAttachedText}>Đã đính kèm 1 ảnh</Text>
              <TouchableOpacity onPress={() => setHasPhoto(false)}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Actions Row matching Image 3 */}
          <View style={styles.bottomRow}>
            {/* Orange Camera Circle Button */}
            <TouchableOpacity
              style={[styles.cameraButton, hasPhoto && styles.cameraButtonActive]}
              onPress={handleCameraPress}
              activeOpacity={0.8}
              accessibilityLabel="Chụp hoặc đính kèm ảnh">
              <Ionicons name="camera" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Green Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, !comment.trim() && styles.submitButtonDisabled]}
              onPress={handleSendComment}
              activeOpacity={0.85}
              accessibilityLabel="Gửi bình luận">
              <Text style={styles.submitButtonText}>Gửi bình luận</Text>
              <Ionicons name="send" size={16} color="#FFFFFF" style={styles.sendIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    minHeight: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
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
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#10294B',
    textAlignVertical: 'top',
    lineHeight: 26,
  },
  charCounter: {
    textAlign: 'right',
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
  photoAttachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  photoAttachedText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 10,
  },
  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  cameraButtonActive: {
    backgroundColor: '#EA580C',
  },
  submitButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#49C99B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#49C99B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sendIcon: {
    marginLeft: 2,
  },
});
