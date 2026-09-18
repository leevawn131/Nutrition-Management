import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalAIProposal, goalService } from '@/services/goal.service';
import { getAuthToken } from '@/services/storage.service';
import { userService } from '@/services/user.service';
import { User } from '@/types/auth.types';

const { width } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  proposal?: GoalAIProposal | null;
  quickReplies?: string[];
  applied?: boolean;
}

const DEFAULT_PROMPT_CHIPS = [
  'Dạo này ăn hay bị đói và mệt',
  'Tôi muốn giảm 2kg trong 1 tháng',
  'Muốn tăng cơ giảm mỡ hiệu quả',
  'Cách phân bổ đạm - carb hợp lý',
];

export default function GoalSettingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [applyingProposalId, setApplyingProposalId] = useState<string | null>(null);

  // Time formatter
  const formatCurrentTime = useCallback(() => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, []);

  // Initialize and load user profile
  useEffect(() => {
    async function init() {
      try {
        const token = await getAuthToken();
        if (token) {
          const profile = await userService.getProfile(token);
          if (profile) {
            setUser(profile);
            const goalLabel =
              profile.goal === 'lose'
                ? 'Giảm cân'
                : profile.goal === 'gain'
                ? 'Tăng cân'
                : 'Duy trì vóc dáng';
            const cal = profile.target_calories || 1500;

            const welcomeMsg: ChatMessage = {
              id: 'welcome-msg',
              sender: 'ai',
              text: `Xin chào ${profile.full_name || 'bạn'}! 👋\n\nMục tiêu hiện tại của bạn là **${goalLabel}** với **${cal} kcal/ngày**.\n\nBạn cảm thấy năng lượng và chế độ ăn những ngày qua thế nào? Có bị đói, mệt mỏi, hay bạn muốn điều chỉnh mục tiêu mới? Cứ chia sẻ tự nhiên với mình nhé!`,
              time: formatCurrentTime(),
              quickReplies: DEFAULT_PROMPT_CHIPS,
            };
            setMessages([welcomeMsg]);
          }
        }
      } catch (err) {
        console.warn('Lỗi khởi tạo GoalSettingScreen:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [formatCurrentTime]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isAiTyping) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    Keyboard.dismiss();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content,
      time: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);
    scrollToBottom();

    try {
      const token = await getAuthToken();
      if (!token) {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          sender: 'ai',
          text: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
          time: formatCurrentTime(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setIsAiTyping(false);
        return;
      }

      // Prepare conversation history
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await goalService.chatGoalConsultation(token, {
        messages: historyPayload,
        userMessage: content,
      });

      if (response && response.success && response.data) {
        const aiData = response.data;
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiData.message,
          time: formatCurrentTime(),
          proposal: aiData.hasProposal ? aiData.proposal : null,
          quickReplies:
            aiData.suggestedQuickReplies && aiData.suggestedQuickReplies.length > 0
              ? aiData.suggestedQuickReplies
              : undefined,
        };

        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const fallbackMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text:
            response?.message ||
            'Mình gặp sự cố kết nối máy chủ một chút. Bạn có thể thử lại sau giây lát nhé!',
          time: formatCurrentTime(),
          quickReplies: DEFAULT_PROMPT_CHIPS,
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.warn('Lỗi gửi tin nhắn AI:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Có lỗi xảy ra khi kết nối với Trợ lý AI. Vui lòng kiểm tra lại mạng internet.',
        time: formatCurrentTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
      scrollToBottom();
    }
  };

  // Apply proposal directly to user's meal plan and profile
  const handleApplyProposal = async (messageId: string, proposal: GoalAIProposal) => {
    setApplyingProposalId(messageId);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getAuthToken();
      if (!token) return;

      const payload = {
        goal: proposal.goal,
        target_calories: proposal.targetCalories,
        target_protein_g: proposal.targetProteinG,
        target_carb_g: proposal.targetCarbG,
        target_fat_g: proposal.targetFatG,
        target_weight: proposal.targetWeightKg,
      };

      const res = await goalService.applyGoalToPlan(token, payload);
      if (res && res.success) {
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }

        // Mark as applied
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, applied: true } : m))
        );

        // Add confirmation message from AI
        const confirmMsg: ChatMessage = {
          id: `ai-applied-${Date.now()}`,
          sender: 'ai',
          text: `Tuyệt vời! 🎉 Mình đã áp dụng mục tiêu mới **${proposal.targetCalories} kcal/ngày** (${
            proposal.goal === 'lose' ? 'Giảm cân' : proposal.goal === 'gain' ? 'Tăng cân' : 'Duy trì'
          }) vào kế hoạch của bạn.\n\nHãy duy trì ăn uống theo các bữa ăn mẫu và cập nhật nhật ký đều đặn để xem tiến độ nhé!`,
          time: formatCurrentTime(),
          quickReplies: ['Xem kế hoạch ăn hôm nay', 'Xem tiến độ duy trì mục tiêu'],
        };
        setMessages((prev) => [...prev, confirmMsg]);
        scrollToBottom();

        Alert.alert(
          'Đã cập nhật mục tiêu! 🎉',
          `Mục tiêu mới ${proposal.targetCalories} kcal/ngày đã được lưu vào kế hoạch của bạn.`,
          [
            { text: 'Ở lại chat' },
            { text: 'Xem kế hoạch ăn', onPress: () => router.push('/plan' as any) },
          ]
        );
      } else {
        Alert.alert('Không thể lưu', res?.message || 'Có lỗi khi lưu mục tiêu.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ lúc này.');
    } finally {
      setApplyingProposalId(null);
    }
  };

  // Render Action Card for AI Proposal
  const renderProposalCard = (msg: ChatMessage) => {
    const p = msg.proposal;
    if (!p) return null;

    const isApplied = Boolean(msg.applied);
    const isApplying = applyingProposalId === msg.id;
    const goalLabel =
      p.goal === 'lose' ? 'Giảm mỡ / Giảm cân' : p.goal === 'gain' ? 'Tăng cơ / Tăng cân' : 'Duy trì vóc dáng';
    const goalBadgeColor = p.goal === 'lose' ? '#059669' : p.goal === 'gain' ? '#6366F1' : '#0284C7';

    return (
      <View style={styles.proposalCard}>
        {/* Header */}
        <View style={styles.proposalHeader}>
          <View style={styles.proposalBadge}>
            <Ionicons name="sparkles" size={13} color="#059669" />
            <Text style={styles.proposalBadgeText}>MỤC TIÊU ĐỀ XUẤT MỚI</Text>
          </View>
          <View style={[styles.goalTypePill, { backgroundColor: `${goalBadgeColor}15` }]}>
            <Text style={[styles.goalTypePillText, { color: goalBadgeColor }]}>{goalLabel}</Text>
          </View>
        </View>

        {/* Calories Highlight */}
        <View style={styles.calorieBox}>
          <Text style={styles.calorieNumber}>{p.targetCalories.toLocaleString()}</Text>
          <Text style={styles.calorieUnit}>kcal / ngày</Text>
        </View>

        {/* Macros Breakdown */}
        <View style={styles.macrosRow}>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>Đạm</Text>
            <Text style={styles.macroValue}>{p.targetProteinG}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>Carb</Text>
            <Text style={styles.macroValue}>{p.targetCarbG}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>Béo</Text>
            <Text style={styles.macroValue}>{p.targetFatG}g</Text>
          </View>
        </View>

        {/* Explanation */}
        {Boolean(p.explanation) && (
          <View style={styles.explanationBox}>
            <Ionicons name="information-circle-outline" size={15} color="#475569" style={{ marginTop: 2 }} />
            <Text style={styles.explanationText}>{p.explanation}</Text>
          </View>
        )}

        {/* Action Button */}
        {isApplied ? (
          <View style={styles.appliedButton}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.appliedButtonText}>Đã áp dụng mục tiêu này</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => handleApplyProposal(msg.id, p)}
            disabled={isApplying}
            activeOpacity={0.88}>
            {isApplying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>Áp dụng mục tiêu này ngay</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render each chat message item
  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isAi = item.sender === 'ai';

    return (
      <View style={[styles.messageRow, isAi ? styles.rowAi : styles.rowUser]}>
        {isAi && (
          <View style={styles.aiAvatarCircle}>
            <MaterialCommunityIcons name="robot" size={18} color="#FFFFFF" />
          </View>
        )}

        <View style={[styles.bubbleWrap, isAi ? styles.bubbleWrapAi : styles.bubbleWrapUser]}>
          <View style={[styles.bubble, isAi ? styles.bubbleAi : styles.bubbleUser]}>
            <Text style={[styles.messageText, isAi ? styles.textAi : styles.textUser]}>
              {item.text}
            </Text>
            <Text style={[styles.timeText, isAi ? styles.timeAi : styles.timeUser]}>
              {item.time}
            </Text>
          </View>

          {/* Proposal Action Card (if any) */}
          {item.proposal && renderProposalCard(item)}

          {/* Quick reply chips inside latest AI message */}
          {isAi && item.quickReplies && item.quickReplies.length > 0 && (
            <View style={styles.quickChipsWrap}>
              {item.quickReplies.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickChip}
                  onPress={() => {
                    if (chip === 'Xem kế hoạch ăn hôm nay') {
                      router.push('/plan' as any);
                    } else if (chip === 'Xem tiến độ duy trì mục tiêu') {
                      router.push('/goal-adherence' as any);
                    } else {
                      handleSendMessage(chip);
                    }
                  }}
                  activeOpacity={0.75}>
                  <Text style={styles.quickChipText}>{chip}</Text>
                  <Ionicons name="arrow-up-circle-outline" size={14} color="#10B981" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Trợ lý Sức khỏe AI</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerSubtitle}>Tư vấn & Thiết lập mục tiêu dinh dưỡng</Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/goal-adherence' as any)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}>
          <Ionicons name="stats-chart-outline" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Main Chat Body */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Đang tải Trợ lý AI...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.chatContent, { paddingBottom: 24 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              isAiTyping ? (
                <View style={styles.typingRow}>
                  <View style={styles.aiAvatarCircleSmall}>
                    <MaterialCommunityIcons name="robot" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text style={styles.typingText}>Trợ lý AI đang tính toán & tư vấn...</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Bottom Input Area */}
        <View style={[styles.bottomInputWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhắn tin với Bác sĩ Dinh dưỡng AI..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={400}
              returnKeyType="send"
              onSubmitEditing={() => handleSendMessage()}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputText.trim() || isAiTyping ? styles.sendBtnDisabled : styles.sendBtnActive,
              ]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isAiTyping}
              activeOpacity={0.8}>
              <Ionicons
                name="arrow-up"
                size={20}
                color={!inputText.trim() || isAiTyping ? '#94A3B8' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerDisclaimer}>
            Lời khuyên may đo từ Trợ lý AI theo chỉ số TDEE & thể trạng cá nhân.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat Content
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  rowAi: {
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  aiAvatarCircleSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubbleWrap: {
    maxWidth: width * 0.82,
  },
  bubbleWrapAi: {
    alignItems: 'flex-start',
  },
  bubbleWrapUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#10B981',
    borderTopRightRadius: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  textAi: {
    color: '#1E293B',
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 10.5,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  timeAi: {
    color: '#94A3B8',
  },
  timeUser: {
    color: 'rgba(255, 255, 255, 0.75)',
  },

  // Typing Indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },

  // Proposal Action Card
  proposalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 16,
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proposalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proposalBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  goalTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  goalTypePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calorieBox: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
  },
  calorieNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 36,
  },
  calorieUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  macroPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 12,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  explanationBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  explanationText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appliedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appliedButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },

  // Quick chips
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  quickChipText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
  },

  // Bottom Input Area
  bottomInputWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 100,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnActive: {
    backgroundColor: '#10B981',
  },
  sendBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  footerDisclaimer: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
});
