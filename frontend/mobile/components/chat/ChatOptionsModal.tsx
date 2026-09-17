import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onOpenHistory: () => void;
}

export const ChatOptionsModal: React.FC<ChatOptionsModalProps> = ({
  visible,
  onClose,
  onNewConversation,
  onOpenHistory,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(event) => event.stopPropagation()}>
              {/* Handle indicator */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.sheetTitle}>Tùy chọn</Text>
              </View>

              {/* Option 1: Cuộc trò chuyện mới */}
              <TouchableOpacity
                style={styles.optionItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onNewConversation();
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#10B981" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Cuộc trò chuyện mới</Text>
                  <Text style={styles.optionSubtitle}>Bắt đầu phiên tư vấn mới với AI</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Option 2: Lịch sử trò chuyện */}
              <TouchableOpacity
                style={styles.optionItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onOpenHistory();
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="time-outline" size={22} color="#3B82F6" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Lịch sử trò chuyện</Text>
                  <Text style={styles.optionSubtitle}>Xem lại các cuộc trò chuyện trước đây</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Option 3: Hủy */}
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  titleContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelButton: {
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
});
