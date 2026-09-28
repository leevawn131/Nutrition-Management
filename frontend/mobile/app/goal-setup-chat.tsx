import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChatGoalCard, GoalProposalData } from '../components/chat/ChatGoalCard';
import {
  RoulettePickerConfig,
  RouletteWheelPicker,
} from '../components/chat/RouletteWheelPicker';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  goalProposal?: GoalProposalData;
  choices?: { label: string; value: string }[];
  picker?: RoulettePickerConfig;
  isApplied?: boolean;
}

export default function GoalSetupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string; autoSend?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: 'Chào bạn! Mình là AI Tri từ the Nutri. Hãy chia sẻ cho Tri biết mục tiêu chính của bạn hiện tại là gì nhé? (Ví dụ: Giảm mỡ bụng, Tăng cơ tập gym, Duy trì vóc dáng hay Ăn sạch Eat Clean?)',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const messageSequenceRef = useRef(0);
  const [pendingChoice, setPendingChoice] = useState<{ messageId: string; label: string; value: string } | null>(null);
  const [manualInputMode, setManualInputMode] = useState(false);

  const handleSend = async (presetText?: string) => {
    const messageText = (presetText || inputText).trim();
    if (!messageText || isLoading) return;

    setPendingChoice(null);
    setManualInputMode(false);

    const userMsg: ChatMessage = {
      id: `user-${messageSequenceRef.current++}`,
      sender: 'user',
      text: messageText,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const payload = {
        message: userMsg.text,
        history: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      };

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chatbot/goal-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data?.success && data?.data) {
        const { reply, goalProposal, choices, picker } = data.data;
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.sender === 'bot' && lastMsg.text.trim() === reply.trim()) {
            return prev;
          }
          const botMsg: ChatMessage = {
            id: `bot-${messageSequenceRef.current++}`,
            sender: 'bot',
            text: reply,
            goalProposal: goalProposal || undefined,
            choices: Array.isArray(choices) && choices.length > 0 ? choices : undefined,
            picker: picker || undefined,
          };
          return [...prev, botMsg];
        });
      } else {
        throw new Error(data?.message || 'Response format invalid');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không xác định';
      Alert.alert('Kết nối gián đoạn', `AI Tri chưa nhận được tin nhắn (${message}). Vui lòng thử lại!`);
    } finally {
      setIsLoading(false);
    }
  };

  const autoSendExecutedRef = useRef(false);
  useEffect(() => {
    if (!autoSendExecutedRef.current && params.autoSend === '1' && typeof params.prompt === 'string' && params.prompt.trim()) {
      autoSendExecutedRef.current = true;
      void handleSend(params.prompt.trim());
    }
  }, [params.autoSend, params.prompt]);

  const handleApplyGoal = async (goal: GoalProposalData, messageId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chatbot/apply-goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(goal),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Không thể lưu mục tiêu');
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isApplied: true } : msg))
      );
      Alert.alert(
        'Thành công! 🎉',
        'Mục tiêu calo và phân bổ macro đã được cập nhật trực tiếp vào trang chủ của bạn.',
        [
          { text: 'Về trang chủ', onPress: () => router.replace('/(tabs)') },
          { text: 'Tiếp tục hỏi Tri', style: 'cancel' },
        ]
      );
    } catch {
      Alert.alert('Thất bại', 'Chưa thể lưu mục tiêu. Vui lòng kiểm tra lại mạng.');
    }
  };

  const getPickerConfig = (message?: ChatMessage): RoulettePickerConfig | null => {
    if (!message || message.sender !== 'bot') return null;
    if (message.picker) return message.picker;
    const text = message.text.toLowerCase();
    if (/\b(tuổi|bao nhiêu tuổi|độ tuổi|năm sinh)\b/i.test(text)) {
      return { type: 'age', min: 14, max: 90, default: 24, unit: 'tuổi' };
    }
    if (/\b(chiều cao|cao bao nhiêu|bao nhiêu cm|thước đo)\b/i.test(text)) {
      return { type: 'height', min: 120, max: 220, default: 168, unit: 'cm' };
    }
    const isDuration = /\b(trong bao lâu|bao lâu|thời hạn|kỳ hạn|mấy tuần|mấy tháng|bao nhiêu tuần|bao nhiêu tháng)\b/i.test(text);
    if (isDuration) {
      return { type: 'duration', min: 2, max: 52, default: 8, unit: 'tuần' };
    }
    const mentionsWeight = !isDuration && /\b(cân nặng|nặng bao nhiêu|bao nhiêu kg|số cân)\b/i.test(text);
    const mentionsCurrent = /hiện tại|của bạn là bao nhiêu|bây giờ/i.test(text);
    const mentionsTarget = /mục tiêu|muốn giảm|muốn tăng|đạt mốc|về mốc/i.test(text);

    if (
      mentionsWeight &&
      (mentionsCurrent || text.includes('hiện tại')) &&
      (mentionsTarget || text.includes('giảm') || text.includes('mục tiêu'))
    ) {
      return {
        type: 'dual_weight',
        min: 35,
        max: 180,
        default: 65,
        defaultTarget: 60,
        unit: 'kg',
      };
    }
    if (mentionsWeight) {
      return {
        type: 'weight',
        min: 35,
        max: 180,
        default: 60,
        unit: 'kg',
      };
    }
    return null;
  };

  const lastMessage = messages[messages.length - 1];
  const activePickerConfig = !isLoading ? getPickerConfig(lastMessage) : null;
  const showRouletteBar = Boolean(activePickerConfig && !manualInputMode);

  const isLastMessageBotWithChoices = Boolean(
    lastMessage &&
    lastMessage.sender === 'bot' &&
    Array.isArray(lastMessage.choices) &&
    lastMessage.choices.length > 0
  );
  const activeChoiceMessage = isLastMessageBotWithChoices ? lastMessage : null;
  const hasActiveChoices = Boolean(activeChoiceMessage && !isLoading);
  const showChoicesBar = hasActiveChoices && !showRouletteBar && !manualInputMode;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Trợ lý sức khỏe</Text>
          <Text style={styles.subtitle}>Trợ lý AI Tri</Text>
        </View>
        <TouchableOpacity style={styles.headerMenu} onPress={() => router.back()}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.sender === 'user' ? styles.userBubbleText : styles.botBubbleText,
              ]}
            >
              {item.text}
            </Text>

            {getPickerConfig(item) && item.id === lastMessage?.id && showRouletteBar && (
              <View style={styles.bubblePickerHint}>
                <Ionicons name="disc-outline" size={16} color="#10B981" />
                <Text style={styles.bubblePickerHintText}>
                  Đang mở con lăn roulette chọn{' '}
                  {getPickerConfig(item)?.type === 'age'
                    ? 'độ tuổi'
                    : getPickerConfig(item)?.type === 'height'
                    ? 'chiều cao'
                    : getPickerConfig(item)?.type === 'duration'
                    ? 'thời gian / kỳ hạn'
                    : getPickerConfig(item)?.type === 'dual_weight'
                    ? 'cân nặng hiện tại & mục tiêu'
                    : 'cân nặng'}{' '}
                  ở dưới
                </Text>
              </View>
            )}

            {item.goalProposal && (
              <ChatGoalCard
                goal={item.goalProposal}
                isApplied={item.isApplied}
                onApply={(goal) => handleApplyGoal(goal, item.id)}
              />
            )}

            {item.choices && item.choices.length > 0 && (
              <View style={styles.choiceList}>
                {item.choices.map((choice: { label: string; value: string }) => {
                  const isActive = item.id === activeChoiceMessage?.id;
                  const isSelected =
                    pendingChoice?.messageId === item.id &&
                    (pendingChoice?.value === choice.value || pendingChoice?.label === choice.label);
                  return (
                    <TouchableOpacity
                      key={`${item.id}-${choice.value}`}
                      style={[
                        styles.choiceButton,
                        isSelected && styles.choiceButtonSelected,
                        !isActive && styles.choiceButtonDisabled,
                      ]}
                      onPress={() => {
                        if (!isActive || isLoading) return;
                        if (showRouletteBar || isSelected) {
                          setPendingChoice(null);
                          setManualInputMode(false);
                          void handleSend(choice.label || choice.value);
                        } else {
                          setPendingChoice({
                            messageId: item.id,
                            label: choice.label,
                            value: choice.value,
                          });
                        }
                      }}
                      disabled={!isActive || isLoading}
                    >
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.choiceButtonText,
                          isSelected && styles.choiceButtonTextSelected,
                        ]}
                      >
                        {choice.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#45C995" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      />

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.loadingText}>AI Tri đang phân tích chỉ số thể trạng...</Text>
        </View>
      )}

      {showRouletteBar && activePickerConfig ? (
        <RouletteWheelPicker
          config={activePickerConfig}
          onConfirm={(val) => {
            void handleSend(val);
          }}
          onSwitchToManual={() => setManualInputMode(true)}
          disabled={isLoading}
        />
      ) : showChoicesBar ? (
        <View style={styles.completeBar}>
          <View style={styles.completeBarRow}>
            <TouchableOpacity
              style={styles.switchInputBtn}
              onPress={() => setManualInputMode(true)}
            >
              <Ionicons name="create-outline" size={18} color="#64748B" />
              <Text style={styles.switchInputText}>Tự nhập câu trả lời</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.completeButton, !pendingChoice && styles.completeButtonDisabled]}
              disabled={!pendingChoice}
              onPress={() => {
                if (pendingChoice) {
                  const choice = pendingChoice.label || pendingChoice.value;
                  setPendingChoice(null);
                  setManualInputMode(false);
                  void handleSend(choice);
                }
              }}
            >
              <Text style={styles.completeButtonText}>Hoàn tất</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>Tri có thể sai. Hãy tham khảo chuyên gia khi cần.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          {activePickerConfig && manualInputMode && (
            <View style={styles.switchBackBar}>
              <TouchableOpacity
                style={styles.switchBackBtn}
                onPress={() => setManualInputMode(false)}
              >
                <Ionicons name="disc-outline" size={16} color="#10B981" />
                <Text style={styles.switchBackText}>
                  Dùng con lăn roulette chọn{' '}
                  {activePickerConfig.type === 'age'
                    ? 'tuổi'
                    : activePickerConfig.type === 'height'
                    ? 'chiều cao'
                    : 'cân nặng'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {hasActiveChoices && manualInputMode && !activePickerConfig && (
            <View style={styles.switchBackBar}>
              <TouchableOpacity
                style={styles.switchBackBtn}
                onPress={() => setManualInputMode(false)}
              >
                <Ionicons name="options-outline" size={16} color="#10B981" />
                <Text style={styles.switchBackText}>Xem các lựa chọn gợi ý</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                activePickerConfig?.type === 'age'
                  ? 'Nhập số tuổi (Ví dụ: 24)...'
                  : activePickerConfig?.type === 'height'
                  ? 'Nhập chiều cao (Ví dụ: 170cm)...'
                  : activePickerConfig?.type === 'dual_weight'
                  ? 'Ví dụ: Hiện tại 68kg, mục tiêu 62kg...'
                  : activePickerConfig?.type === 'weight'
                  ? 'Nhập cân nặng (Ví dụ: 65kg)...'
                  : 'Nhập câu trả lời (Ví dụ: 24 tuổi, 1m70, 65kg...)'
              }
              placeholderTextColor="#94A3B8"
              onSubmitEditing={() => void handleSend()}
              returnKeyType="send"
              keyboardType={activePickerConfig && activePickerConfig.type !== 'dual_weight' ? 'numeric' : 'default'}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => void handleSend()}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  headerMenu: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listPadding: {
    padding: 16,
    paddingBottom: 20,
  },
  bubble: {
    maxWidth: '86%',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  botBubbleText: {
    color: '#1E293B',
  },
  choiceList: {
    marginTop: 10,
    gap: 8,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6DCE4',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  choiceButtonSelected: {
    borderColor: '#45C995',
    borderWidth: 2,
    backgroundColor: '#F4FFFB',
  },
  choiceButtonDisabled: {
    opacity: 0.55,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioSelected: {
    borderColor: '#45C995',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#45C995',
  },
  choiceButtonText: {
    flex: 1,
    color: '#172B4D',
    fontSize: 16,
    fontWeight: '500',
  },
  choiceButtonTextSelected: {
    color: '#0F172A',
    fontWeight: '600',
  },
  completeBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  completeBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  switchInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  switchInputText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  switchBackBar: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchBackText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  completeButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#45C995',
  },
  completeButtonDisabled: {
    backgroundColor: '#DDE2E8',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 12,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  bubblePickerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  bubblePickerHintText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
});