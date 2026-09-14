import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '@/services/chat.service';
import { ChatConversationSummary } from '@/types/chat.types';

interface ChatHistoryModalProps {
  visible: boolean;
  currentConversationId: string | null;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  visible,
  currentConversationId,
  onClose,
  onSelectConversation,
  onNewConversation,
}) => {
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const list = await chatService.getConversations();
      setConversations(list);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải lịch sử trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: ChatConversationSummary) => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      `Bạn có chắc chắn muốn xóa "${item.title || 'Cuộc trò chuyện'}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(item._id);
              await chatService.deleteConversation(item._id);
              setConversations((prev) => prev.filter((c) => c._id !== item._id));

              // Nếu đang mở đúng cuộc trò chuyện bị xóa, tạo mới
              if (currentConversationId === item._id) {
                onNewConversation();
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa cuộc trò chuyện');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const formatChatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      if (isToday) {
        return `Hôm nay ${hours}:${minutes}`;
      }
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return `Hôm qua ${hours}:${minutes}`;
      }
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const getFlowBadge = (flow: string) => {
    switch (flow) {
      case 'recipe':
        return { label: '🍲 Công thức', color: '#D97706', bg: '#FEF3C7' };
      case 'meal_plan':
        return { label: '📅 Kế hoạch', color: '#059669', bg: '#D1FAE5' };
      case 'goal':
        return { label: '🎯 Mục tiêu', color: '#4F46E5', bg: '#EEF2FF' };
      case 'exercise':
        return { label: '🏃 Luyện tập', color: '#DB2777', bg: '#FCE7F3' };
      default:
        return { label: '💬 Chung', color: '#4B5563', bg: '#F3F4F6' };
    }
  };

  const renderItem = ({ item }: { item: ChatConversationSummary }) => {
    const isActive = item._id === currentConversationId;
    const badge = getFlowBadge(item.current_flow);
    const isDeleting = deletingId === item._id;

    return (
      <TouchableOpacity
        style={[styles.itemCard, isActive && styles.itemCardActive]}
        activeOpacity={0.7}
        onPress={() => {
          onSelectConversation(item._id);
          onClose();
        }}
      >
        <View style={styles.itemHeader}>
          <View style={styles.titleArea}>
            <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]} numberOfLines={1}>
              {item.title || 'Cuộc trò chuyện'}
            </Text>
          </View>

          {isActive && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Đang mở</Text>
            </View>
          )}
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.metaRow}>
            <View style={[styles.flowBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.flowBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
            <Text style={styles.itemDate}>{formatChatDate(item.updated_at || item.created_at)}</Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isDeleting}
            onPress={() => handleDelete(item)}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Lịch sử trò chuyện</Text>

          <TouchableOpacity
            style={styles.newChatHeaderBtn}
            onPress={() => {
              onClose();
              onNewConversation();
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newChatHeaderBtnText}>Mới</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
            <Text style={styles.emptySubtitle}>
              Bắt đầu trò chuyện với AI Assistant để nhận tư vấn dinh dưỡng và thực đơn!
            </Text>
            <TouchableOpacity
              style={styles.startChatBtn}
              onPress={() => {
                onClose();
                onNewConversation();
              }}
            >
              <Text style={styles.startChatBtnText}>Bắt đầu cuộc trò chuyện mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={loadHistory}
            refreshing={loading}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  newChatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 2,
  },
  newChatHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  startChatBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startChatBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemTitleActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  activePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flowBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  deleteBtn: {
    padding: 4,
  },
});
