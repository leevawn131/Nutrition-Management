import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostItem } from '@/types/post.types';

interface ReportPostModalProps {
  visible: boolean;
  post: PostItem | null;
  onClose: () => void;
  onConfirmReport: (post: PostItem) => void;
}

export const ReportPostModal: React.FC<ReportPostModalProps> = ({
  visible,
  post,
  onClose,
  onConfirmReport,
}) => {
  if (!post) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              onConfirmReport(post);
            }}
          >
            <Ionicons name="flag-outline" size={20} color="#1E293B" style={styles.actionIcon} />
            <Text style={styles.actionText}>Báo cáo bài viết</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelItem} activeOpacity={0.7} onPress={onClose}>
            <Text style={styles.cancelText}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheetContainer: {
    gap: 10,
    marginBottom: 10,
  },
  actionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  cancelItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
