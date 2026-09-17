import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostItem } from '@/types/post.types';

interface PostCardProps {
  post: PostItem;
  onLikeToggle?: (postId: string) => void;
  onOpenComment?: (post: PostItem) => void;
  onOpenReport?: (post: PostItem) => void;
  onPressPost?: (post: PostItem) => void;
  onPressRecipe?: (recipeId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikeToggle,
  onOpenComment,
  onOpenReport,
  onPressPost,
  onPressRecipe,
}) => {
  const authorName = post.user?.full_name || 'Người dùng';
  const authorInitials = authorName.substring(0, 2).toUpperCase();
  const hasRecipe = Boolean(post.recipe || post.recipe_id);

  // Extract hashtags from content if any
  const hashtagRegex = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g;
  const hashtags = post.content ? post.content.match(hashtagRegex) : null;
  const cleanContent = post.content ? post.content.replace(hashtagRegex, '').trim() : '';

  return (
    <View style={styles.card}>
      {/* Post Author Header */}
      <View style={styles.header}>
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

        <TouchableOpacity style={styles.moreBtn} onPress={() => onOpenReport?.(post)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Post Text Content */}
      {cleanContent ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onPressPost?.(post)}>
          <Text style={styles.contentText}>{cleanContent}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Hashtag Pills */}
      {hashtags && hashtags.length > 0 ? (
        <View style={styles.hashtagRow}>
          {hashtags.map((tag, idx) => (
            <View key={idx} style={styles.hashtagBadge}>
              <Text style={styles.hashtagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Embedded Recipe Card */}
      {post.recipe ? (
        <TouchableOpacity
          style={styles.recipeCard}
          activeOpacity={0.88}
          onPress={() => {
            const recipeId = post.recipe?.id || (post.recipe as any)?._id || post.recipe_id;
            if (onPressRecipe && recipeId) {
              onPressRecipe(String(recipeId));
            } else {
              onPressPost?.(post);
            }
          }}
        >
          {post.recipe.image_url ? (
            <Image source={{ uri: post.recipe.image_url }} style={styles.recipeImage} />
          ) : null}
          <View style={styles.recipeCardBody}>
            <View style={styles.recipeTitleRow}>
              <Text style={styles.recipeTitle} numberOfLines={1}>{post.recipe.title}</Text>
              <View style={styles.viewRecipeBadge}>
                <Text style={styles.viewRecipeText}>Xem công thức</Text>
                <Ionicons name="arrow-forward" size={11} color="#059669" />
              </View>
            </View>

            <View style={styles.recipeMetaRow}>
              {(post.recipe.prep_time_minutes || post.recipe.cook_time_minutes) ? (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText}>
                    {(post.recipe.prep_time_minutes || 0) + (post.recipe.cook_time_minutes || 0)} phút
                  </Text>
                </View>
              ) : null}

              {post.recipe.ingredient_count ? (
                <View style={styles.metaItem}>
                  <Ionicons name="nutrition-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText}>{post.recipe.ingredient_count} ng liệu</Text>
                </View>
              ) : null}

              {post.recipe.calories_per_serving ? (
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={13} color="#EF4444" />
                  <Text style={styles.metaText}>{Math.round(post.recipe.calories_per_serving)} kcal</Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      ) : post.images && post.images.length > 0 ? (
        /* Image Grid / Regular Images */
        <TouchableOpacity
          style={styles.imagesContainer}
          activeOpacity={0.9}
          onPress={() => onPressPost?.(post)}
        >
          {post.images.length === 1 ? (
            <Image source={{ uri: post.images[0] }} style={styles.singleImage} />
          ) : (
            <View style={styles.multiImageRow}>
              {post.images.slice(0, 2).map((imgUrl, i) => (
                <Image key={i} source={{ uri: imgUrl }} style={styles.multiImage} />
              ))}
            </View>
          )}
        </TouchableOpacity>
      ) : null}

      {/* Action Footer (Likes, Comments) */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLikeToggle?.(post.id)}
        >
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={18}
            color={post.is_liked ? '#EF4444' : '#64748B'}
          />
          <Text style={[styles.actionText, post.is_liked && styles.actionTextLiked]}>
            {post.like_count || 0} lượt thích
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, !hasRecipe && styles.actionBtnDisabled]}
          disabled={!hasRecipe}
          onPress={() => hasRecipe && onOpenComment?.(post)}
        >
          <Ionicons name="chatbubble-outline" size={17} color={hasRecipe ? '#64748B' : '#94A3B8'} />
          <Text style={[styles.actionText, !hasRecipe && styles.actionTextDisabled]}>
            {post.comment_count || 0} bình luận
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  postTime: {
    fontSize: 12,
    color: '#64748B',
  },
  moreBtn: {
    padding: 6,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1E293B',
    marginBottom: 10,
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  hashtagBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hashtagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  recipeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  recipeImage: {
    width: '100%',
    height: 180,
  },
  recipeCardBody: {
    padding: 12,
  },
  recipeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  recipeTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewRecipeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  viewRecipeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  imagesContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  singleImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  multiImageRow: {
    flexDirection: 'row',
    gap: 6,
  },
  multiImage: {
    flex: 1,
    height: 160,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  actionTextLiked: {
    color: '#EF4444',
  },
  actionTextDisabled: {
    color: '#94A3B8',
  },
});
