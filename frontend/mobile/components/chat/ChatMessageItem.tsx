import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/types/chat.types';
import { ChatChoicePicker } from './ChatChoicePicker';
import { ChatRecipeCard } from './ChatRecipeCard';
import { ChatMealPlanPreview } from './ChatMealPlanPreview';
import { ChatResultCardExtension } from './ChatResultCardExtension';

interface ChatMessageItemProps {
  message: ChatMessage;
  onSelectChoice: (value: any, label: string) => void;
  onAction: (action: string, data: any) => void;
  isLastMessage?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSelectChoice,
  onAction,
  isLastMessage = false,
}) => {
  const isUser = message.role === 'user';

  const formatTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}

      <View style={[styles.bubbleWrapper, isUser && styles.userBubbleWrapper]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>

          {/* Timestamp */}
          <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.assistantTimeText]}>
            {formatTime(message.created_at)}
          </Text>
        </View>

        {/* Dynamic UI Components rendered below the assistant message */}
        {!isUser && message.ui && (
          <View style={styles.uiContainer}>
            {/* 1. Choice Picker */}
            {message.ui.type === 'choice' && (
              <ChatChoicePicker
                payload={message.ui.payload}
                onSelectChoice={onSelectChoice}
                disabled={!isLastMessage}
              />
            )}

            {/* 2. Recipe List */}
            {message.ui.type === 'recipe_list' && message.ui.payload?.recipes && (
              <View style={styles.recipeListWrapper}>
                {message.ui.payload.title && (
                  <Text style={styles.recipeListTitle}>{message.ui.payload.title}</Text>
                )}
                {message.ui.payload.recipes.map((recipe: any, idx: number) => (
                  <ChatRecipeCard
                    key={`rec-${recipe.id || idx}`}
                    recipe={recipe}
                    onAction={onAction}
                  />
                ))}
              </View>
            )}

            {/* 3. Meal Plan Preview */}
            {message.ui.type === 'meal_plan_preview' && (
              <ChatMealPlanPreview
                payload={message.ui.payload}
                onConfirm={() => onAction('confirm_meal_plan', {})}
                onEdit={() => onAction('refine_recommendation', {})}
                onViewRecipe={(recipeId, meal) =>
                  onAction('view_recipe', {
                    recipe_id: recipeId,
                    recipe: meal,
                    title: meal?.title,
                  })
                }
                disabled={!isLastMessage}
              />
            )}

            {/* 4. Confirm / Result (Goal, Exercise extension points) */}
            {(message.ui.type === 'confirm' || message.ui.type === 'result') && (
              <ChatResultCardExtension
                type={message.ui.type}
                payload={message.ui.payload}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 12,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 18,
  },
  bubbleWrapper: {
    maxWidth: '85%',
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: '#1F2937',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: '#D1FAE5',
  },
  assistantTimeText: {
    color: '#9CA3AF',
  },
  uiContainer: {
    width: '100%',
    marginTop: 4,
  },
  recipeListWrapper: {
    width: '100%',
    marginTop: 6,
  },
  recipeListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
});
