import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { PostCard } from '@/components/community/PostCard';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { PostDetailModal } from '@/components/community/PostDetailModal';
import { ReportPostModal } from '@/components/community/ReportPostModal';

import { postService } from '@/services/post.service';
import { recipeService } from '@/services/recipe.service';
import { PostItem, SearchTab, RecipeSearchResult, IngredientSearchResult, UserAuthor } from '@/types/post.types';

export default function ExploreScreen() {
  const router = useRouter();

  // Search & Active Tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');

  // Data states
  const [feedPosts, setFeedPosts] = useState<PostItem[]>([]);
  const [recipeResults, setRecipeResults] = useState<RecipeSearchResult[]>([]);
  const [ingredientResults, setIngredientResults] = useState<IngredientSearchResult[]>([]);
  const [userResults, setUserResults] = useState<UserAuthor[]>([]);

  // Recipe bookmark & filter states
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'mine' | 'saved'>('all');
  const [myRecipesList, setMyRecipesList] = useState<any[]>([]);
  const [savedRecipesList, setSavedRecipesList] = useState<any[]>([]);

  // Loading & Refreshing states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDetailPost, setSelectedDetailPost] = useState<PostItem | null>(null);
  const [selectedReportPost, setSelectedReportPost] = useState<PostItem | null>(null);

  const searchTimeoutRef = useRef<any>(null);

  const loadSavedRecipes = useCallback(async () => {
    try {
      const saved = await recipeService.getSavedRecipes();
      const idSet = new Set<string>();
      saved.forEach((r) => {
        if (r._id) idSet.add(String(r._id));
        if ((r as any).id) idSet.add(String((r as any).id));
      });
      setSavedRecipeIds(idSet);
      setSavedRecipesList(saved);
    } catch (e) {
      console.warn('Lỗi tải công thức đã lưu:', e);
    }
  }, []);

  const loadMyRecipes = useCallback(async () => {
    try {
      const mine = await recipeService.getMyRecipes();
      setMyRecipesList(mine || []);
    } catch (e) {
      console.warn('Lỗi tải công thức của tôi:', e);
    }
  }, []);

  useEffect(() => {
    loadSavedRecipes();
    loadMyRecipes();
  }, [loadSavedRecipes, loadMyRecipes]);

  const handleToggleBookmark = async (recipe: any) => {
    try {
      const targetId = String(recipe.id || recipe._id);
      const normalizedRecipe = {
        _id: targetId,
        title: recipe.title,
        image_url: recipe.image_url,
        description: recipe.description || '',
        prep_time_minutes: recipe.prep_time_minutes || 10,
        cook_time_minutes: recipe.cook_time_minutes || 15,
        servings: 1,
        calories_per_serving: recipe.calories_per_serving || 250,
        protein_g: recipe.protein_g || 15,
        carb_g: recipe.carb_g || 20,
        fat_g: recipe.fat_g || 8,
      } as any;

      const res = await recipeService.toggleSaveRecipe(normalizedRecipe);

      setSavedRecipeIds((prev) => {
        const next = new Set(prev);
        if (res.isSaved) {
          next.add(targetId);
        } else {
          next.delete(targetId);
        }
        return next;
      });

      loadSavedRecipes();

      Alert.alert(
        res.isSaved ? 'Đã lưu công thức' : 'Đã bỏ lưu',
        res.isSaved
          ? `Đã thêm "${recipe.title}" vào bộ sưu tập cá nhân! 🔖`
          : `Đã xóa "${recipe.title}" khỏi bộ sưu tập.`
      );
    } catch (err: any) {
      console.log('Lỗi lưu công thức:', err);
    }
  };

  const executeSearch = useCallback(async (query: string, tab: SearchTab) => {
    setIsLoading(true);
    try {
      if (tab === 'posts' && !query.trim()) {
        const posts = await postService.getFeed();
        setFeedPosts(posts);
      } else {
        const results = await postService.search(query, tab);
        if (tab === 'recipes') {
          setRecipeResults(results);
        } else if (tab === 'ingredients') {
          setIngredientResults(results);
        } else if (tab === 'posts') {
          setFeedPosts(results);
        } else if (tab === 'users') {
          setUserResults(results);
        }
      }
    } catch (err) {
      console.log('Lỗi tìm kiếm:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch when tab changes
  useEffect(() => {
    executeSearch(searchQuery, activeTab);
  }, [activeTab, executeSearch]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(text, activeTab);
    }, 350);
  };

  const handleSearchSubmit = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    executeSearch(searchQuery, activeTab);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    executeSearch(searchQuery, activeTab);
    loadSavedRecipes();
    loadMyRecipes();
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const result = await postService.toggleLike(postId);
      setFeedPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked: result.is_liked, like_count: result.like_count }
            : p
        )
      );
      if (selectedDetailPost && selectedDetailPost.id === postId) {
        setSelectedDetailPost((prev) =>
          prev ? { ...prev, is_liked: result.is_liked, like_count: result.like_count } : null
        );
      }
    } catch (err) {
      console.log('Lỗi thích bài viết:', err);
    }
  };

  const handleConfirmReport = async (post: PostItem) => {
    try {
      await postService.reportPost(post.id);
      Alert.alert('Thành công', 'Đã báo cáo bài viết. Bài viết sẽ được tạm ẩn để duyệt.');
      setFeedPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể báo cáo bài viết');
    }
  };

  const displayedRecipes = useMemo(() => {
    if (recipeFilter === 'mine') return myRecipesList || [];
    if (recipeFilter === 'saved') return savedRecipesList || [];
    return recipeResults || [];
  }, [recipeFilter, recipeResults, myRecipesList, savedRecipesList]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Search Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.searchBoxContainer}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'posts' ? 'Hôm nay bạn muốn ăn gì?' : 'Tìm kiếm...'}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              executeSearch('', activeTab);
            }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.cameraScanBtn} onPress={() => router.push('/(tabs)/diary')}>
          <Ionicons name="camera-outline" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* 4 Category Tabs */}
      <View style={styles.tabsRow}>
        {[
          { key: 'recipes', label: 'Công thức' },
          { key: 'ingredients', label: 'Nguyên liệu' },
          { key: 'posts', label: 'Bài viết' },
          { key: 'users', label: 'Người dùng' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => {
                setActiveTab(tab.key as SearchTab);
              }}
            >
              <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#10B981']} />}
      >
        {/* TAB 1: CÔNG THỨC (Recipes Grid Layout) */}
        {activeTab === 'recipes' && (
          <View style={styles.recipesSection}>
            <View style={styles.recipesHeaderRow}>
              <Text style={styles.recipesSectionTitle}>
                {recipeFilter === 'all'
                  ? `Công thức món ngon (${recipeResults?.length || 0})`
                  : recipeFilter === 'mine'
                  ? `Công thức của tôi (${myRecipesList?.length || 0})`
                  : `Công thức đã lưu (${savedRecipesList?.length || 0})`}
              </Text>
              <TouchableOpacity
                style={styles.createRecipeActionBtn}
                onPress={() => router.push('/recipe/create' as any)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.createRecipeActionText}>Tạo công thức</Text>
              </TouchableOpacity>
            </View>

            {/* Sub-filter chips: Tất cả / Của tôi / Đã lưu */}
            <View style={styles.recipeSubFilterRow}>
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'mine', label: 'Của tôi' },
                { key: 'saved', label: 'Đã lưu' },
              ].map((f) => {
                const isActive = recipeFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.subFilterPill, isActive && styles.subFilterPillActive]}
                    onPress={() => {
                      setRecipeFilter(f.key as any);
                      if (f.key === 'mine') loadMyRecipes();
                      if (f.key === 'saved') loadSavedRecipes();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.subFilterText, isActive && styles.subFilterTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 30 }} />
            ) : displayedRecipes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={styles.emptyText}>
                  {recipeFilter === 'mine'
                    ? 'Bạn chưa tạo công thức món ăn nào'
                    : recipeFilter === 'saved'
                    ? 'Bạn chưa lưu công thức nào vào bộ sưu tập'
                    : 'Không tìm thấy công thức phù hợp'}
                </Text>
                <TouchableOpacity
                  style={styles.createRecipeActionBtn}
                  onPress={() => router.push('/recipe/create' as any)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.createRecipeActionText}>Tạo công thức mới ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recipeGridContainer}>
                {displayedRecipes.map((recipe: any) => {
                  const recId = String(recipe.id || recipe._id);
                  const isSaved = savedRecipeIds.has(recId);
                  return (
                    <TouchableOpacity
                      key={recId}
                      style={styles.recipeGridCard}
                      activeOpacity={0.88}
                      onPress={() => router.push(`/recipe/${recId}` as any)}
                    >
                      <View style={styles.recipeGridImageWrapper}>
                        <Image
                          source={{ uri: recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' }}
                          style={styles.recipeGridImage}
                        />
                        <TouchableOpacity
                          style={[styles.bookmarkBadgeBtn, isSaved && { backgroundColor: '#10B981' }]}
                          onPress={(e: any) => {
                            if (e && e.stopPropagation) e.stopPropagation();
                            handleToggleBookmark(recipe);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.recipeGridBody}>
                        <Text style={styles.recipeGridTitle} numberOfLines={1}>
                          {recipe.title}
                        </Text>
                        <View style={styles.recipeGridMetaRow}>
                          <View style={styles.gridMetaItem}>
                            <Ionicons name="time-outline" size={12} color="#64748B" />
                            <Text style={styles.gridMetaText}>
                              {recipe.total_time_minutes || (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} phút
                            </Text>
                          </View>
                          <View style={styles.gridMetaItem}>
                            <Ionicons name="nutrition-outline" size={12} color="#64748B" />
                            <Text style={styles.gridMetaText}>
                              {recipe.ingredients?.length || recipe.ingredient_count || 0} ng liệu
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: NGUYÊN LIỆU (Ingredients List) */}
        {activeTab === 'ingredients' && (
          <View style={styles.ingredientsSection}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 30 }} />
            ) : ingredientResults.length > 0 ? (
              ingredientResults.map((ing) => (
                <TouchableOpacity
                  key={ing.id || ing._id}
                  style={styles.ingredientRowCard}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/ingredient/${ing.id || ing._id}` as any)}
                >
                  <Image
                    source={{ uri: ing.image_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200' }}
                    style={styles.ingredientCircleImage}
                  />
                  <Text style={styles.ingredientRowTitle}>{ing.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Không tìm thấy nguyên liệu phù hợp</Text>
            )}
          </View>
        )}

        {/* TAB 3: BÀI VIẾT (Community Feed) */}
        {activeTab === 'posts' && (
          <View style={styles.postsSection}>
            {/* Top Stories Highlight Carousel */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesCarousel}>
              {/* Add Story / Recipe Card */}
              <TouchableOpacity
                style={styles.addStoryCard}
                onPress={() => router.push('/recipe/create' as any)}
                activeOpacity={0.85}
              >
                <View style={styles.addStoryIconCircle}>
                  <Ionicons name="add-circle" size={24} color="#10B981" />
                </View>
                <Text style={styles.addStoryText}>Chia sẻ công thức của bạn</Text>
              </TouchableOpacity>

              {/* Sample Story Cards */}
              {[
                {
                  id: '6aa80a61f502627b5985d963',
                  name: 'anni',
                  title: 'Gà sốt mật ...',
                  img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400',
                },
                {
                  id: '6aa80a61f502627b5985d965',
                  name: 'hoa ly',
                  title: 'Sữa dừa thạ...',
                  img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400',
                },
                {
                  id: '6aa80a61f502627b5985d95b',
                  name: 'Minh Đỗ',
                  title: 'Thịt rim...',
                  img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
                },
                {
                  id: '6aa810bfa86661d83b07082b',
                  name: 'Sáng Hoàng',
                  title: 'Bò xào ớt chuông',
                  img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
                },
                {
                  id: '6aa811d1a86661d83b07082e',
                  name: 'sanghoang2005',
                  title: 'sang',
                  img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                },
              ].map((story, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.storyCard}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/recipe/${story.id}` as any)}
                >
                  <Image source={{ uri: story.img }} style={styles.storyImage} />
                  <Text style={styles.storyAuthorName}>{story.name}</Text>
                  <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Create Post Input Trigger Box */}
            <TouchableOpacity style={styles.createPostTriggerCard} onPress={() => setShowCreateModal(true)}>
              <View style={styles.myAvatarFallback}>
                <Text style={styles.myAvatarText}>SH</Text>
              </View>
              <Text style={styles.createPostPlaceholder}>Bạn đang nghĩ gì ...?</Text>
            </TouchableOpacity>

            {/* Posts Feed */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 30 }} />
            ) : feedPosts.length > 0 ? (
              feedPosts.map((post) => (
                <PostCard
                  key={post.id || post._id}
                  post={post}
                  onLikeToggle={handleToggleLike}
                  onOpenComment={(p) => setSelectedDetailPost(p)}
                  onOpenReport={(p) => setSelectedReportPost(p)}
                  onPressPost={(p) => setSelectedDetailPost(p)}
                  onPressRecipe={(recId) => router.push(`/recipe/${recId}` as any)}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có bài viết nào trên Bảng tin</Text>
            )}
          </View>
        )}

        {/* TAB 4: NGƯỜI DÙNG (Users List) */}
        {activeTab === 'users' && (
          <View style={styles.usersSection}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 30 }} />
            ) : userResults.length > 0 ? (
              userResults.map((user) => {
                const initials = (user.full_name || 'U').substring(0, 2).toUpperCase();
                return (
                  <View key={user.id || user._id} style={styles.userRowCard}>
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.userAvatarImage} />
                    ) : (
                      <View style={styles.userAvatarFallback}>
                        <Text style={styles.userAvatarText}>{initials}</Text>
                      </View>
                    )}
                    <Text style={styles.userFullName}>{user.full_name}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Không tìm thấy người dùng phù hợp</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={() => executeSearch(searchQuery, activeTab)}
      />

      <PostDetailModal
        visible={Boolean(selectedDetailPost)}
        post={selectedDetailPost}
        onClose={() => setSelectedDetailPost(null)}
        onLikeToggle={handleToggleLike}
        onPressRecipe={(recId) => router.push(`/recipe/${recId}` as any)}
        onReportPost={(p) => {
          setSelectedDetailPost(null);
          setSelectedReportPost(p);
        }}
      />

      <ReportPostModal
        visible={Boolean(selectedReportPost)}
        post={selectedReportPost}
        onClose={() => setSelectedReportPost(null)}
        onConfirmReport={handleConfirmReport}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchBoxContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  cameraScanBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: '#34D399',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 40,
    fontStyle: 'italic',
  },
  /* Tab 1 Recipes Grid */
  recipesSection: {
    flex: 1,
  },
  recipeGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeGridImageWrapper: {
    position: 'relative',
    height: 160,
  },
  recipeGridImage: {
    width: '100%',
    height: '100%',
  },
  bookmarkBadgeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    padding: 6,
  },
  recipeGridBody: {
    padding: 10,
  },
  recipeGridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  recipeGridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  /* Tab 2 Ingredients List */
  ingredientsSection: {
    gap: 8,
  },
  ingredientRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  ingredientCircleImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  ingredientRowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  /* Tab 3 Posts Section & Stories */
  postsSection: {
    gap: 12,
  },
  storiesCarousel: {
    marginBottom: 8,
  },
  addStoryCard: {
    width: 110,
    height: 140,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  addStoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    lineHeight: 18,
  },
  storyCard: {
    position: 'relative',
    width: 110,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 10,
    justifyContent: 'space-between',
    padding: 8,
  },
  storyImage: {
    ...StyleSheet.absoluteFill,
  },
  storyAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  storyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  createPostTriggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  myAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  createPostPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
  },
  /* Tab 4 Users List */
  usersSection: {
    gap: 8,
  },
  userRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  userFullName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  recipesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recipesSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  createRecipeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  createRecipeActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recipeSubFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  subFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  subFilterPillActive: {
    backgroundColor: '#10B981',
  },
  subFilterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  subFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
