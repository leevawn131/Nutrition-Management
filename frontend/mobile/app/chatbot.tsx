import { ChatHistoryModal } from '@/components/chat/ChatHistoryModal';
import { ChatMessageItem } from '@/components/chat/ChatMessageItem';
import { ChatOptionsModal } from '@/components/chat/ChatOptionsModal';
import { ChatRecipeDetailModal } from '@/components/chat/ChatRecipeDetailModal';
import { chatService } from '@/services/chat.service';
import { recipeService } from '@/services/recipe.service';
import { ChatInput, ChatMessage } from '@/types/chat.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatbotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string; autoSend?: string }>();
  const flatListRef = useRef<FlatList>(null);
  const autoSentPromptRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState(
    typeof params.prompt === 'string' ? params.prompt : ''
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Recipe detail modal state
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Options & History modals
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    return () => {
      const id = conversationIdRef.current;
      if (id) {
        void chatService.deleteConversation(id).catch(() => {
          // The screen is already closing; cleanup should not block navigation.
        });
      }
    };
  }, []);

  const redirectToLogin = () => {
    router.replace('/(auth)/login');
  };

  // 1. Khởi tạo và nạp lịch sử hội thoại khi vào màn hình
  useEffect(() => {
    loadConversation();
  }, []);

  const loadConversation = async () => {
    try {
      setInitialLoading(true);
      const res = await chatService.getActiveConversation();
      if (res && res.conversation) {
        setConversationId(res.conversation._id);
        if (res.messages && res.messages.length > 0) {
          setMessages(res.messages);
        } else {
          // Tạo tin nhắn chào mừng ban đầu
          startInitialGreeting(res.conversation._id);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AuthExpiredError') {
        redirectToLogin();
        return;
      }
      console.log('Load conversation fallback to reset:', error);
      handleReset();
    } finally {
      setInitialLoading(false);
    }
  };

  const startInitialGreeting = (convId: string) => {
    const greetingMsg: ChatMessage = {
      id: 'greeting_0',
      role: 'assistant',
      content:
        'Xin chào! Mình là AI Assistant - Trợ lý dinh dưỡng và thể chất của bạn. Hôm nay bạn cần hỗ trợ gì nào?',
      ui: {
        type: 'choice',
        payload: {
          title: 'Chọn tính năng bạn cần:',
          choices: [
            { label: '🍲 Tìm công thức nấu ăn', value: 'Tìm công thức nấu ăn' },
            { label: '📅 Lập kế hoạch bữa ăn', value: 'Lập kế hoạch bữa ăn' },
            { label: '🎯 Thiết lập mục tiêu dinh dưỡng', value: 'Thiết lập mục tiêu dinh dưỡng' },
            { label: '🏃 Luyện tập & vận động', value: 'Luyện tập & vận động' },
          ],
        },
      },
      created_at: new Date().toISOString(),
    };
    setMessages([greetingMsg]);
    setConversationId(convId);
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await chatService.resetConversation();
      if (res.success && res.data) {
        setConversationId(res.data.conversation_id);
        setMessages([res.data.message]);
      }
    } catch (error: any) {
      Alert.alert('Thông báo', error.message || 'Không thể làm mới cuộc trò chuyện');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleSelectConversation = async (selectedId: string) => {
    try {
      setInitialLoading(true);
      const res = await chatService.getConversationById(selectedId);
      if (res && res.conversation) {
        setConversationId(res.conversation._id);
        setMessages(res.messages || []);
      }
    } catch (error: any) {
      Alert.alert('Thông báo', error.message || 'Không thể tải cuộc trò chuyện');
    } finally {
      setInitialLoading(false);
    }
  };

  // 2. Gửi tin nhắn
  const handleSend = async (customInput?: ChatInput) => {
    const inputToSend: ChatInput = customInput || {
      type: 'text',
      value: inputText.trim(),
    };

    if (inputToSend.type === 'text' && !inputToSend.value) return;

    if (!customInput) {
      setInputText('');
    }

    // Tin nhắn tạm trên UI (dùng text thân thiện thay vì raw JSON kỹ thuật)
    let displayContent = '';
    if (inputToSend.type === 'action') {
      const act = inputToSend.value?.action;
      const title = inputToSend.value?.data?.title;
      if (act === 'save_recipe') {
        displayContent = title ? `⭐ Lưu món: "${title}"` : '⭐ Lưu món vào bộ sưu tập';
      } else if (act === 'add_to_meal_plan') {
        displayContent = title ? `📅 Thêm vào kế hoạch: "${title}"` : '📅 Thêm vào kế hoạch';
      } else {
        displayContent = `Thao tác: ${act || ''}`;
      }
    } else {
      displayContent = typeof inputToSend.value === 'string' ? inputToSend.value : JSON.stringify(inputToSend.value);
    }

    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: displayContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage({
        conversation_id: conversationId,
        input: inputToSend,
      });

      if (res.success && res.data) {
        setConversationId(res.data.conversation_id);
        const aiMsg: ChatMessage = res.data.message;

        // Nếu có UI từ response thì gán vào message
        if (res.data.ui) {
          aiMsg.ui = res.data.ui;
        }

        setMessages((prev) => [...prev, aiMsg]);

        // Nếu response là recipe detail modal
        if (res.data.ui?.type === 'recipe_detail' && res.data.ui.payload?.recipe) {
          setSelectedRecipeDetail(res.data.ui.payload.recipe);
          setDetailModalVisible(true);
        }
      }
    } catch (error: any) {
      if (error?.name === 'AuthExpiredError') {
        redirectToLogin();
        return;
      }
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Đã có lỗi xảy ra: ${error.message || 'Không thể kết nối máy chủ'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !initialLoading &&
      conversationId &&
      params.autoSend === '1' &&
      typeof params.prompt === 'string' &&
      params.prompt.trim() &&
      !autoSentPromptRef.current
    ) {
      autoSentPromptRef.current = true;
      handleSend({ type: 'text', value: params.prompt.trim() });
    }
  }, [conversationId, initialLoading, params.autoSend, params.prompt]);

  // 3. Xử lý khi user chọn Choice từ Quick Picker
  const handleSelectChoice = (value: any, label: string) => {
    handleSend({
      type: 'choice',
      value: label || value,
    });
  };

  // 4. Xử lý Structured Action (view_recipe, save_recipe, add_to_meal_plan, confirm_meal_plan)
  const handleAction = async (action: string, data: any) => {
    if (action === 'view_recipe') {
      // Khi xem chi tiết: KHÔNG gửi tin nhắn chat, mở trực tiếp Modal chi tiết món ăn!
      const recipeData = data.recipe;
      const normalizeData = (raw: any) => {
        if (!raw) return null;
        return {
          id: raw.id || raw._id?.toString?.() || String(raw._id || data.recipe_id || ''),
          title: raw.title || data.title || 'Công thức món ăn',
          description: raw.description || '',
          image_url: raw.image_url,
          calories: Math.round(Number(raw.calories ?? raw.calories_per_serving ?? raw.nutrition_facts?.energy_kcal ?? 0) || 0),
          protein: Number(raw.protein ?? raw.protein_g ?? raw.nutrition_facts?.protein_g ?? 0) || 0,
          carbs: Number(raw.carbs ?? raw.carb_g ?? raw.carbs_g ?? raw.nutrition_facts?.carbohydrate_g ?? 0) || 0,
          fat: Number(raw.fat ?? raw.fat_g ?? raw.nutrition_facts?.fat_g ?? 0) || 0,
          cook_time_minutes: raw.cook_time_minutes || 15,
          prep_time_minutes: raw.prep_time_minutes || 10,
          servings: raw.servings || 1,
          meal_type: raw.meal_type || 'lunch',
          ingredients: raw.ingredients || [],
          steps: raw.steps || [],
        };
      };

      if (recipeData && recipeData.ingredients && recipeData.ingredients.length > 0) {
        setSelectedRecipeDetail(normalizeData(recipeData));
        setDetailModalVisible(true);
      } else {
        try {
          const detail = await recipeService.getRecipeById(data.recipe_id || data.id);
          if (detail) {
            setSelectedRecipeDetail(normalizeData(detail));
            setDetailModalVisible(true);
          } else if (recipeData) {
            setSelectedRecipeDetail(normalizeData(recipeData));
            setDetailModalVisible(true);
          }
        } catch {
          if (recipeData) {
            setSelectedRecipeDetail(normalizeData(recipeData));
            setDetailModalVisible(true);
          }
        }
      }
      return;
    }

    handleSend({
      type: 'action',
      value: { action, data },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.avatarEmoji}>🤖</Text>
              <Text style={styles.headerTitle}>AI Assistant</Text>
            </View>
            <Text style={styles.headerStatus}>
              {loading ? 'Đang xử lý...' : 'Sẵn sàng hỗ trợ'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setOptionsModalVisible(true)}
            style={styles.moreBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        {initialLoading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Đang tải cuộc trò chuyện...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ChatMessageItem
                message={item}
                onSelectChoice={handleSelectChoice}
                onAction={handleAction}
                isLastMessage={index === messages.length - 1}
              />
            )}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.typingText}>AI đang suy nghĩ...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về món ăn, thực đơn, mục tiêu..."
            placeholderTextColor="#9CA3AF"
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            disabled={!inputText.trim() || loading}
            onPress={() => handleSend()}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Recipe Detail Modal */}
        <ChatRecipeDetailModal
          visible={detailModalVisible}
          recipe={selectedRecipeDetail}
          onClose={() => setDetailModalVisible(false)}
          onAddToMealPlan={(recId) =>
            handleAction('add_to_meal_plan', {
              recipe_id: recId,
              meal_type: selectedRecipeDetail?.meal_type || 'lunch',
            })
          }
        />

        {/* Options Modal (Tùy chọn popup) */}
        <ChatOptionsModal
          visible={optionsModalVisible}
          onClose={() => setOptionsModalVisible(false)}
          onNewConversation={() => {
            handleReset();
          }}
          onOpenHistory={() => {
            setHistoryModalVisible(true);
          }}
        />

        {/* Conversation History Modal (Lịch sử trò chuyện) */}
        <ChatHistoryModal
          visible={historyModalVisible}
          currentConversationId={conversationId}
          onClose={() => setHistoryModalVisible(false)}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => {
            handleReset();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    color: '#374151',
    fontWeight: '700',
  },
  headerInfo: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
