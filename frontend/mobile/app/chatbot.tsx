import { ChatHistoryModal } from '@/components/chat/ChatHistoryModal';
import { ChatMessageItem } from '@/components/chat/ChatMessageItem';
import { ChatOptionsModal } from '@/components/chat/ChatOptionsModal';
import { ChatRecipeDetailModal } from '@/components/chat/ChatRecipeDetailModal';
import { chatService } from '@/services/chat.service';
import { recipeService } from '@/services/recipe.service';
import { ChatInput, ChatMessage } from '@/types/chat.types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

// --- COMPONENT THẺ ĐỀ XUẤT MỤC TIÊU (THE.MEAL STYLE) ---
interface GoalProposal {
  readyToApply?: boolean;
  goalType?: string;
  targetWeightKg?: number;
  currentWeight?: number;
  tdee?: number;
  targetCalories: number;
  macros: {
    protein: number;
    carb: number;
    fat: number;
  };
  waterIntakeMl?: number;
  recommendationSummary?: string;
}

const goalStyles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 8, padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1FAE5' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1FAE5' },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subTitle: { marginTop: 2, fontSize: 11, color: '#6B7280' },
  summary: { marginTop: 12, fontSize: 13, lineHeight: 19, color: '#374151' },
  caloRow: { flexDirection: 'row', marginTop: 14, gap: 12 },
  caloItem: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#ECFDF5' },
  tdeeItem: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  caloLabel: { fontSize: 11, color: '#6B7280' },
  caloValue: { marginTop: 4, fontSize: 18, fontWeight: '700', color: '#047857' },
  tdeeValue: { marginTop: 4, fontSize: 16, fontWeight: '700', color: '#374151' },
  macroTitle: { marginTop: 14, fontSize: 12, fontWeight: '600', color: '#374151' },
  macroContainer: { flexDirection: 'row', gap: 6, marginTop: 8 },
  macroBadge: { flex: 1, padding: 8, borderRadius: 8 },
  macroLabel: { fontSize: 10, fontWeight: '600' },
  macroVal: { marginTop: 3, fontSize: 15, fontWeight: '700' },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  waterText: { fontSize: 12, color: '#2563EB' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingVertical: 11, borderRadius: 8, backgroundColor: '#10B981' },
  appliedBtn: { backgroundColor: '#6B7280' },
  applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

const InlineGoalProposalCard = ({
  goal,
  onApply,
  isApplied,
}: {
  goal: GoalProposal;
  onApply: (g: GoalProposal) => void;
  isApplied?: boolean;
}) => {
  return (
    <View style={goalStyles.card}>
      <View style={goalStyles.header}>
        <View style={goalStyles.iconBadge}>
          <MaterialCommunityIcons name="bullseye-arrow" size={20} color="#10B981" />
        </View>
        <View>
          <Text style={goalStyles.title}>Kế hoạch mục tiêu từ AI Tri</Text>
          <Text style={goalStyles.subTitle}>Chuẩn Viện Dinh Dưỡng VDD & USDA</Text>
        </View>
      </View>

      {goal.recommendationSummary ? (
        <Text style={goalStyles.summary}>{goal.recommendationSummary}</Text>
      ) : null}

      <View style={goalStyles.caloRow}>
        <View style={goalStyles.caloItem}>
          <Text style={goalStyles.caloLabel}>Mục tiêu mỗi ngày</Text>
          <Text style={goalStyles.caloValue}>
            {goal.targetCalories} <Text style={{ fontSize: 13 }}>kcal</Text>
          </Text>
        </View>
        {goal.tdee ? (
          <View style={goalStyles.tdeeItem}>
            <Text style={goalStyles.caloLabel}>Tiêu hao TDEE</Text>
            <Text style={goalStyles.tdeeValue}>{goal.tdee} kcal</Text>
          </View>
        ) : null}
      </View>

      <Text style={goalStyles.macroTitle}>Tỷ lệ đa lượng dinh dưỡng (Macro):</Text>
      <View style={goalStyles.macroContainer}>
        <View style={[goalStyles.macroBadge, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[goalStyles.macroLabel, { color: '#DC2626' }]}>Đạm (Protein)</Text>
          <Text style={[goalStyles.macroVal, { color: '#991B1B' }]}>{goal.macros?.protein || 0}g</Text>
        </View>
        <View style={[goalStyles.macroBadge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[goalStyles.macroLabel, { color: '#D97706' }]}>Tinh bột (Carb)</Text>
          <Text style={[goalStyles.macroVal, { color: '#92400E' }]}>{goal.macros?.carb || 0}g</Text>
        </View>
        <View style={[goalStyles.macroBadge, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[goalStyles.macroLabel, { color: '#2563EB' }]}>Chất béo (Fat)</Text>
          <Text style={[goalStyles.macroVal, { color: '#1E40AF' }]}>{goal.macros?.fat || 0}g</Text>
        </View>
      </View>

      {goal.waterIntakeMl ? (
        <View style={goalStyles.waterRow}>
          <MaterialCommunityIcons name="water" size={16} color="#3B82F6" />
          <Text style={goalStyles.waterText}>Nước khuyến nghị: {goal.waterIntakeMl} ml/ngày</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[goalStyles.applyBtn, isApplied && goalStyles.appliedBtn]}
        onPress={() => !isApplied && onApply(goal)}
        disabled={isApplied}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={isApplied ? 'check-circle' : 'lightning-bolt'}
          size={18}
          color="#FFFFFF"
          style={{ marginRight: 6 }}
        />
        <Text style={goalStyles.applyBtnText}>
          {isApplied ? '✓ Đã kích hoạt mục tiêu này' : 'Áp dụng mục tiêu vào App'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// --- MÀN HÌNH CHÍNH CHATBOT ---
export default function ChatbotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string; autoSend?: string; newChat?: string }>();
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

  // Lưu trữ trạng thái mục tiêu đã áp dụng theo message ID
  const [appliedGoalMap, setAppliedGoalMap] = useState<{ [key: string]: boolean }>({});

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
          // Cleanup an toàn khi rời khỏi màn hình
        });
      }
    };
  }, []);

  const redirectToLogin = () => {
    router.replace('/(auth)/login');
  };

  // 1. Khởi tạo và nạp lịch sử hội thoại khi vào màn hình
  useEffect(() => {
    if (params.newChat === '1') {
      if (params.autoSend === '1' && typeof params.prompt === 'string' && params.prompt.trim()) {
        setMessages([]);
        setConversationId(null);
        setInitialLoading(false);
        autoSentPromptRef.current = true;
        void handleSend({ type: 'text', value: params.prompt.trim() }, null);
      } else {
        void handleReset();
      }
    } else {
      loadConversation();
    }
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
        'Chào bạn! Mình là Tri, trợ lý dinh dưỡng và sức khoẻ của The Nutri. Mình có thể tính mục tiêu calo, lên thực đơn, gợi ý món ăn, theo dõi vận động, hoặc trả lời câu hỏi về dinh dưỡng và chỉ số của bạn. Bạn chọn một việc bên dưới, hoặc cứ hỏi mình bất cứ điều gì nhé.',
      ui: {
        type: 'choice',
        payload: {
          title: 'Chọn tác vụ bạn cần:',
          choices: [
            {
              label: '💬 Trò chuyện chung',
              value: 'Trò chuyện chung',
              description: 'Trò chuyện, hỏi đáp về dinh dưỡng và sức khỏe',
              icon: '💬',
            },
            {
              label: '🎯 Thiết lập mục tiêu',
              value: 'Thiết lập mục tiêu dinh dưỡng',
              description: 'Tính BMR, TDEE, calo thâm hụt/thặng dư và tỷ lệ macro chuẩn',
              icon: '🎯',
            },
            {
              label: '🍲 Tìm công thức',
              value: 'Tìm công thức nấu ăn',
              description: 'Tìm món ăn từ nguyên liệu hoặc khám phá món mới',
              icon: '🍲',
            },
            {
              label: '📅 Lập kế hoạch bữa ăn',
              value: 'Lập kế hoạch bữa ăn',
              description: 'Lên thực đơn 1-7 ngày cá nhân hóa theo mục tiêu',
              icon: '📅',
            },
            {
              label: '🏃 Luyện tập & vận động',
              value: 'Luyện tập & vận động',
              description: 'Lên lịch bài tập và hướng dẫn vận động khoa học',
              icon: '🏃',
            },
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

  const handleSend = async (customInput?: ChatInput, explicitConvId?: string | null) => {
    const inputToSend: ChatInput = customInput || { type: 'text', value: inputText.trim() };
    if (inputToSend.type === 'text' && !inputToSend.value) return;
    if (!customInput) setInputText('');

    const displayContent = inputToSend.type === 'action'
      ? `Thao tác: ${inputToSend.value?.action || ''}`
      : typeof inputToSend.value === 'string' ? inputToSend.value : JSON.stringify(inputToSend.value);
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: displayContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const targetConvId = explicitConvId !== undefined ? explicitConvId : conversationId;
      const res = await chatService.sendMessage({ conversation_id: targetConvId, input: inputToSend });
      if (res.success && res.data) {
        setConversationId(res.data.conversation_id);
        const aiMsg: ChatMessage = res.data.message;
        if (res.data.ui) aiMsg.ui = res.data.ui;
        setMessages((prev) => [...prev, aiMsg]);
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
      setMessages((prev) => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Đã có lỗi xảy ra: ${error.message || 'Không thể kết nối máy chủ'}`,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChoice = (value: any, label: string) => {
    const selectedValue = String(label || value || '');
    const isGoalChoice = /giảm mỡ|giảm cân|tăng cơ|tăng cân|duy trì cân nặng|cải thiện sức khỏe/i.test(
      selectedValue
    );
    if (isGoalChoice) {
      router.push({
        pathname: '/goal-setup-chat',
        params: { prompt: selectedValue, autoSend: '1' },
      });
      return;
    }

    void handleSend({ type: 'choice', value: label || value });
  };

  const handleAction = async (action: string, data: any) => {
    if (action === 'view_recipe') {
      const recipe = data.recipe;
      if (recipe) {
        setSelectedRecipeDetail(recipe);
        setDetailModalVisible(true);
      } else {
        try {
          const detail = await recipeService.getRecipeById(data.recipe_id || data.id);
          if (detail) {
            setSelectedRecipeDetail(detail);
            setDetailModalVisible(true);
          }
        } catch {
          Alert.alert('Thông báo', 'Không thể tải chi tiết công thức');
        }
      }
      return;
    }
    void handleSend({ type: 'action', value: { action, data } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.avatarEmoji}>🧑‍⚕️</Text>
              <Text style={styles.headerTitle}>AI Assistant</Text>
            </View>
            <Text style={styles.headerStatus}>{loading ? 'Đang xử lý...' : 'Sẵn sàng hỗ trợ'}</Text>
          </View>
          <TouchableOpacity onPress={() => setOptionsModalVisible(true)} style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

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

        {loading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.typingText}>AI đang suy nghĩ...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về món ăn, thực đơn, mục tiêu..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="send"
            onSubmitEditing={() => void handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            disabled={!inputText.trim() || loading}
            onPress={() => void handleSend()}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ChatRecipeDetailModal
          visible={detailModalVisible}
          recipe={selectedRecipeDetail}
          onClose={() => setDetailModalVisible(false)}
          onAddToMealPlan={(recipeId) => void handleAction('add_to_meal_plan', { recipe_id: recipeId })}
        />
        <ChatOptionsModal
          visible={optionsModalVisible}
          onClose={() => setOptionsModalVisible(false)}
          onNewConversation={() => void handleReset()}
          onOpenHistory={() => setHistoryModalVisible(true)}
        />
        <ChatHistoryModal
          visible={historyModalVisible}
          currentConversationId={conversationId}
          onClose={() => setHistoryModalVisible(false)}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => void handleReset()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 6 },
  backBtnText: { fontSize: 22, color: '#374151', fontWeight: '700' },
  headerInfo: { alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarEmoji: { fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerStatus: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 1 },
  moreBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingVertical: 12 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 13, color: '#6B7280' },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  typingText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8 },
  textInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1F2937', maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
});