import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostItem, PostComment } from '@/types/post.types';
import { postService } from '@/services/post.service';

interface PostDetailModalProps {
  visible: boolean;
  post: PostItem | null;
  onClose: () => void;
  onLikeToggle?: (postId: string) => void;
  onReportPost?: (post: PostItem) => void;
  onPressRecipe?: (recipeId: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  visible,
  post,
  onClose,
  onLikeToggle,
  onReportPost,
  onPressRecipe,
}) => {
  const [showRecipeContent, setShowRecipeContent] = useState(true);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const authorName = post?.user?.full_name || 'Người dùng';
  const authorInitials = authorName.substring(0, 2).toUpperCase();
  const hasRecipe = Boolean(post?.recipe || post?.recipe_id);

  useEffect(() => {
    if (visible && post) {
      loadComments();
    }
  }, [visible, post?.id]);

  const loadComments = async () => {
    if (!post?.id) return;
    setIsLoadingComments(true);
    try {
      const data = await postService.getComments(post.id);
      setComments(data);
    } catch (err) {
      console.log('Lỗi tải bình luận:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !post) return;
    if (!hasRecipe) {
      Alert.alert('Thông báo', 'Bài viết này không đính kèm công thức nên không thể bình luận');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const updatedComments = await postService.addComment(post.id, commentText.trim());
      setComments(updatedComments);
      setCommentText('');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể bình luận');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nội dung bài viết</Text>
          <TouchableOpacity onPress={() => onReportPost?.(post)} style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Author Info Header */}
            <View style={styles.authorRow}>
              {post.user?.avatar_url ? (
                <Image source={{ uri: post.user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{authorInitials}</Text>
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{authorName}</Text>
                <Text style={styles.postTime}>
                  {formatTimeAgo(post.created_at)}
                </Text>
              </View>
            </View>

            {/* Post Content Text */}
            {post.content ? (
              <Text style={styles.contentText}>{post.content}</Text>
            ) : null}

            {/* Recipe Attachment Section */}
            {post.recipe ? (
              <View style={styles.recipeSection}>
                <View style={styles.recipeHeaderRow}>
                  <Text style={styles.recipeSectionTitle}>Công thức nấu ăn:</Text>
                  <TouchableOpacity onPress={() => setShowRecipeContent(!showRecipeContent)}>
                    <Text style={styles.recipeToggleText}>
                      {showRecipeContent ? 'Ẩn' : 'Hiện'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showRecipeContent && (
                  <View style={styles.recipeCard}>
                    {post.recipe.image_url ? (
                      <Image source={{ uri: post.recipe.image_url }} style={styles.recipeImage} />
                    ) : null}
                    <View style={styles.recipeCardBody}>
                      <Text style={styles.recipeCardTitle}>{post.recipe.title}</Text>
                      <View style={styles.recipeMetaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>
                            {(post.recipe.prep_time_minutes || 0) + (post.recipe.cook_time_minutes || 0)} phút
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="nutrition-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>
                            {post.recipe.ingredient_count || (post.recipe.ingredients || []).length || 0} nguyên liệu
                          </Text>
                        </View>
                        {post.recipe.calories_per_serving ? (
                          <View style={styles.metaItem}>
                            <Ionicons name="flame-outline" size={14} color="#EF4444" />
                            <Text style={styles.metaText}>
                              {Math.round(post.recipe.calories_per_serving)} kcal
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Action to view full interactive recipe details */}
                      <TouchableOpacity
                        style={styles.viewFullRecipeActionBtn}
                        activeOpacity={0.88}
                        onPress={() => {
                          const recId = post.recipe?.id || (post.recipe as any)?._id || post.recipe_id;
                          if (recId) {
                            onClose();
                            onPressRecipe?.(String(recId));
                          }
                        }}
                      >
                        <Ionicons name="restaurant-outline" size={17} color="#FFFFFF" />
                        <Text style={styles.viewFullRecipeActionText}>
                          Xem chi tiết công thức & cách nấu
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                      </TouchableOpacity>

                      {/* Expanded Recipe Ingredients & Steps */}
                      {post.recipe.ingredients && post.recipe.ingredients.length > 0 ? (
                        <View style={styles.recipeDetailsBlock}>
                          <Text style={styles.detailsBlockTitle}>Danh sách nguyên liệu:</Text>
                          {post.recipe.ingredients.map((ing, i) => (
                            <Text key={i} style={styles.detailsItemText}>
                              • {ing.ingredient_name} {ing.quantity ? `(${ing.quantity} ${ing.unit || ''})` : ''}
                            </Text>
                          ))}
                        </View>
                      ) : null}

                      {post.recipe.steps && post.recipe.steps.length > 0 ? (
                        <View style={styles.recipeDetailsBlock}>
                          <Text style={styles.detailsBlockTitle}>Các bước thực hiện:</Text>
                          {post.recipe.steps.map((st, i) => (
                            <Text key={i} style={styles.detailsItemText}>
                              Bước {st.step_number}: {st.instruction}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            ) : post.images && post.images.length > 0 ? (
              <View style={styles.imagesContainer}>
                {post.images.map((imgUri, idx) => (
                  <Image key={idx} source={{ uri: imgUri }} style={styles.postImage} />
                ))}
              </View>
            ) : null}

            {/* Like & Comment Summary */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statBtn}
                onPress={() => onLikeToggle?.(post.id)}
              >
                <Ionicons
                  name={post.is_liked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={post.is_liked ? '#EF4444' : '#64748B'}
                />
                <Text style={[styles.statText, post.is_liked && styles.statTextLiked]}>
                  {post.like_count || 0} lượt thích
                </Text>
              </TouchableOpacity>

              <View style={styles.statBtn}>
                <Ionicons name="chatbubble-outline" size={17} color="#64748B" />
                <Text style={styles.statText}>
                  Bình luận ({comments.length || post.comment_count || 0})
                </Text>
              </View>
            </View>

            {/* Comments List */}
            <View style={styles.commentsListSection}>
              {isLoadingComments ? (
                <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 16 }} />
              ) : comments.length > 0 ? (
                comments.map((c) => (
                  <View key={c.id || c._id} style={styles.commentItem}>
                    <View style={styles.commentAvatarFallback}>
                      <Text style={styles.commentAvatarText}>
                        {(c.user?.full_name || 'U').substring(0, 1)}
                      </Text>
                    </View>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentUserName}>{c.user?.full_name || 'Người dùng'}</Text>
                      <Text style={styles.commentContent}>{c.content}</Text>
                      <Text style={styles.commentTime}>{formatTimeAgo(c.created_at)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyCommentsText}>
                  {hasRecipe ? 'Chưa có bình luận nào. Hãy là người đầu tiên bình luận!' : 'Bài viết không có công thức đính kèm.'}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Bottom Comment Input Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.myAvatarFallback}>
              <Text style={styles.myAvatarText}>SH</Text>
            </View>
            <TextInput
              style={[styles.inputField, !hasRecipe && styles.inputFieldDisabled]}
              placeholder={hasRecipe ? 'Thêm bình luận...' : 'Vô hiệu hóa (bài viết không có công thức)'}
              placeholderTextColor="#94A3B8"
              editable={hasRecipe}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleAddComment}
            />
            {hasRecipe && commentText.trim() ? (
              <TouchableOpacity
                style={styles.sendBtn}
                disabled={isSubmittingComment}
                onPress={handleAddComment}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <Ionicons name="send" size={18} color="#10B981" />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return 'vừa xong';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'một ngày trước';
  return `${diffDays} ngày trước`;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  postTime: {
    fontSize: 12,
    color: '#64748B',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E293B',
    marginBottom: 16,
  },
  recipeSection: {
    marginBottom: 16,
  },
  recipeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recipeSectionTitle: {
    fontSize: 14,
    color: '#64748B',
  },
  recipeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  recipeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipeImage: {
    width: '100%',
    height: 200,
  },
  recipeCardBody: {
    padding: 14,
  },
  recipeCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  recipeDetailsBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailsBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  detailsItemText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  imagesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  statBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  statTextLiked: {
    color: '#EF4444',
  },
  commentsListSection: {
    gap: 12,
    marginBottom: 20,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  commentTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyCommentsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  myAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  inputFieldDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#94A3B8',
  },
  sendBtn: {
    padding: 6,
  },
  viewFullRecipeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  viewFullRecipeActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
