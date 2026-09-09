import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe, IngredientItem, RecipeStep } from '@/types/recipe.types';
import { recipeService } from '@/services/recipe.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StepByStepCookingModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
  userToken?: string | null;
  onReviewSubmitted?: (updatedRecipe: Recipe) => void;
}

const TASTE_TAG_OPTIONS = [
  'Ngon xuất sắc',
  'Ngọt',
  'Cay',
  'Nhạt',
  'Mềm ẩm',
  'Khô',
  'Giòn',
  'Tươi',
  'Dễ làm',
  'Phù hợp cho trẻ em',
  'Làm dưới 30 phút',
  'Món ăn trọn vẹn',
  'Không làm lại đâu',
];

export const StepByStepCookingModal: React.FC<StepByStepCookingModalProps> = ({
  visible,
  onClose,
  recipe,
  userToken,
  onReviewSubmitted,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState(3600); // 60:00 default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Review screen states
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: RecipeStep[] = recipe?.steps && recipe.steps.length > 0
    ? recipe.steps
    : [
        { step_number: 1, title: 'Sơ chế nguyên liệu', description: 'Chuẩn bị và làm sạch tất cả nguyên liệu.' },
        { step_number: 2, title: 'Chế biến', description: 'Tiến hành nấu theo hướng dẫn của món ăn.' },
        { step_number: 3, title: 'Hoàn thiện', description: 'Trình bày ra đĩa và thưởng thức!' },
      ];

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || steps[0];

  // Reset states when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      setIsCompleted(false);
      setIsTimerRunning(false);
      setTimerSeconds(3600);
      setStartTime(Date.now());
      setRating(5);
      setCommentText('');
      setSelectedTags([]);
    }
  }, [visible]);

  // Countdown timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            const alertMsg = 'Thời gian đếm ngược của bước nấu ăn đã hoàn thành.';
            if (Platform.OS === 'web') {
              window.alert(`⏰ Hết giờ!\n${alertMsg}`);
            } else {
              Alert.alert('⏰ Hết giờ!', alertMsg);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Format MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const padMins = mins < 10 ? `0${mins}` : `${mins}`;
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${padMins}:${padSecs}`;
  };

  // Calculate elapsed time in minutes
  const getElapsedMinutes = () => {
    const elapsedMs = Date.now() - startTime;
    const elapsedMins = Math.max(1, Math.round(elapsedMs / (1000 * 60)));
    return elapsedMins;
  };

  // Navigation handlers
  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      handleClosePrompt();
    }
  };

  const handleClosePrompt = () => {
    if (!isCompleted) {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('Bạn có chắc chắn muốn thoát khỏi hướng dẫn từng bước?');
        if (confirmed) onClose();
      } else {
        Alert.alert(
          'Thoát chế độ nấu ăn?',
          'Bạn có chắc chắn muốn thoát khỏi hướng dẫn từng bước?',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Thoát', style: 'destructive', onPress: onClose },
          ]
        );
      }
    } else {
      onClose();
    }
  };

  // Toggle tag selection
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Post Review
  const handlePostReview = async () => {
    try {
      setIsSubmitting(true);
      const recipeId = recipe?._id || (recipe as any)?.id || 'thit-nac-rim';
      const result = await recipeService.submitReview(userToken || null, recipeId, {
        rating,
        quick_tags: selectedTags,
        comment: commentText.trim(),
      });

      setIsSubmitting(false);
      const successMsg = 'Cảm ơn bạn đã gửi đánh giá cho công thức này!';
      if (Platform.OS === 'web') {
        window.alert(`Thành công 🎉\n${successMsg}`);
      } else {
        Alert.alert('Thành công 🎉', successMsg);
      }
      if (onReviewSubmitted && result.data) {
        onReviewSubmitted(result.data);
      }
      onClose();
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Lỗi handlePostReview:', error);
      const errorMsg = error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
      if (Platform.OS === 'web') {
        window.alert(`Lỗi: ${errorMsg}`);
      } else {
        Alert.alert('Lỗi', errorMsg);
      }
    }
  };

  // PanResponder for swipe gestures (left = next, right = prev)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 40;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Swipe Left -> Next
          handleNextStep();
        } else if (gestureState.dx > 50) {
          // Swipe Right -> Prev
          handlePrevStep();
        }
      },
    })
  ).current;

  if (!visible || !recipe) return null;

  // Progress Bar %
  const progressPercent = Math.min(100, Math.max(0, ((currentStepIndex + 1) / totalSteps) * 100));

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClosePrompt}>
      <View style={styles.container}>
        {/* ======================= STEP VIEW MODE ======================= */}
        {!isCompleted ? (
          <View style={styles.stepContainer} {...panResponder.panHandlers}>
            {/* Top Navigation Header */}
            <View style={styles.topHeader}>
              <TouchableOpacity style={styles.iconCircleBtn} onPress={handlePrevStep}>
                <Ionicons name="arrow-back" size={20} color="#1E293B" />
              </TouchableOpacity>

              <Text style={styles.stepHeaderTitle}>
                Step {currentStepIndex + 1} of {totalSteps}
              </Text>

              <TouchableOpacity style={styles.iconCircleBtn} onPress={handleClosePrompt}>
                <Ionicons name="close" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Green Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            {/* Body Content */}
            <ScrollView style={styles.contentScrollView} contentContainerStyle={styles.contentScrollInner} showsVerticalScrollIndicator={false}>
              {/* Recipe Title */}
              <Text style={styles.recipeTitle}>{recipe.title}</Text>

              {/* Ingredients Grid (Pills) */}
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <View style={styles.ingredientsPillGrid}>
                  {recipe.ingredients.map((ing: IngredientItem, idx: number) => (
                    <View key={idx} style={styles.ingredientPill}>
                      <Text style={styles.ingredientPillText}>
                        {ing.name}{' '}
                        <Text style={styles.ingredientPillAmount}>
                          {ing.amount} {ing.unit}
                        </Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Step Image if uploaded */}
              {currentStep.image_url ? (
                <Image
                  source={{ uri: currentStep.image_url }}
                  style={{ width: '100%', height: 200, borderRadius: 16, marginBottom: 16 }}
                  resizeMode="cover"
                />
              ) : null}

              {/* Step Title & Instruction Body */}
              <View style={styles.instructionCard}>
                <Text style={styles.stepInstructionText}>
                  {currentStep.title ? (
                    <Text style={styles.stepInstructionTitle}>
                      Bước {currentStep.step_number || currentStepIndex + 1}: {currentStep.title}{' '}
                    </Text>
                  ) : (
                    <Text style={styles.stepInstructionTitle}>
                      Bước {currentStep.step_number || currentStepIndex + 1}:{' '}
                    </Text>
                  )}
                  {currentStep.description}
                </Text>
              </View>

              {/* Floating Timer UI */}
              <View style={styles.timerCard}>
                <Text style={styles.timerDigitsText}>{formatTimer(timerSeconds)}</Text>

                <TouchableOpacity
                  style={styles.timerControlBtn}
                  onPress={() => setIsTimerRunning(!isTimerRunning)}
                  activeOpacity={0.8}>
                  <Ionicons name={isTimerRunning ? 'pause' : 'play'} size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Bottom Primary Button */}
            <View style={styles.bottomBarContainer}>
              <TouchableOpacity style={styles.nextPrimaryBtn} onPress={handleNextStep} activeOpacity={0.85}>
                <Text style={styles.nextPrimaryBtnText}>
                  {currentStepIndex === totalSteps - 1 ? 'Hoàn thành' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ======================= COMPLETION & REVIEW SCREEN ======================= */
          <View style={styles.completionContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.completionScrollInner}>
              {/* Header Illustration Area */}
              <View style={styles.illustrationHeaderBanner}>
                <View style={styles.saladBowlCircle}>
                  <Image
                    source={{
                      uri:
                        recipe.cover_image_url &&
                        !recipe.cover_image_url.startsWith('file://') &&
                        !recipe.cover_image_url.startsWith('blob:')
                          ? recipe.cover_image_url
                          : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
                    }}
                    style={styles.bowlImage}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Congratulations Card */}
              <View style={styles.congratulationsCard}>
                <Text style={styles.congratulationsSub}>You have complete the recipe for</Text>
                <Text style={styles.congratulationsRecipeTitle}>{recipe.title}</Text>
                <Text style={styles.timeElapsedText}>Time elapsed: {getElapsedMinutes()} minutes</Text>
              </View>

              {/* Rating Section */}
              <View style={styles.reviewSectionCard}>
                <Text style={styles.ratePromptTitle}>Enjoy this? Please rate so we can improve</Text>
                <View style={styles.starsRowPicker}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                        style={styles.starIconPadding}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Comment Section */}
                <Text style={styles.commentFieldLabel}>Để lại bình luận</Text>
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentTextInput}
                    placeholder="Viết bình luận của bạn ở đây"
                    placeholderTextColor="#94A3B8"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity style={styles.photoAttachBtn} onPress={() => Alert.alert('Ảnh', 'Đính kèm ảnh món ăn')}>
                    <Ionicons name="image-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Quick Tags Section */}
                <Text style={styles.tastePromptTitle}>How did it taste?</Text>
                <View style={styles.tasteTagsGrid}>
                  {TASTE_TAG_OPTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.tasteTagPill, isSelected && styles.tasteTagPillSelected]}
                        onPress={() => handleToggleTag(tag)}
                        activeOpacity={0.8}>
                        <Text style={[styles.tasteTagText, isSelected && styles.tasteTagTextSelected]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions Row (Finish vs Post Review) */}
            <View style={styles.completionBottomRow}>
              <TouchableOpacity style={styles.finishSecondaryBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.finishSecondaryBtnText}>Finish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postReviewPrimaryBtn}
                onPress={handlePostReview}
                disabled={isSubmitting}
                activeOpacity={0.85}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.postReviewPrimaryBtnText}>Post review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* STEP VIEW STYLES */
  stepContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#10B981',
  },
  contentScrollView: {
    flex: 1,
  },
  contentScrollInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  ingredientsPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  ingredientPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ingredientPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  ingredientPillAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  instructionCard: {
    marginBottom: 32,
  },
  stepInstructionText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#334155',
  },
  stepInstructionTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    width: 220,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 20,
  },
  timerDigitsText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 1,
  },
  timerControlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  nextPrimaryBtn: {
    backgroundColor: '#34D399',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextPrimaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* COMPLETION & REVIEW STYLES */
  completionContainer: {
    flex: 1,
    backgroundColor: '#FFFBEB',
  },
  completionScrollInner: {
    paddingBottom: 110,
  },
  illustrationHeaderBanner: {
    height: 220,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  saladBowlCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  bowlImage: {
    width: '100%',
    height: '100%',
  },
  congratulationsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  congratulationsSub: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 6,
  },
  congratulationsRecipeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  timeElapsedText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  reviewSectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  ratePromptTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 14,
  },
  starsRowPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  starIconPadding: {
    marginHorizontal: 4,
  },
  commentFieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  commentTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 38,
  },
  photoAttachBtn: {
    padding: 4,
  },
  tastePromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  tasteTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tasteTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tasteTagPillSelected: {
    backgroundColor: '#334155',
  },
  tasteTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  tasteTagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completionBottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  finishSecondaryBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishSecondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  postReviewPrimaryBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#34D399',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postReviewPrimaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
