import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { recipeService } from '@/services/recipe.service';
import { getAuthToken, getCachedUser } from '@/services/storage.service';
import { userService } from '@/services/user.service';
import { User } from '@/types/auth.types';
import { Recipe } from '@/types/plan.types';

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'recipes' | 'collections' | 'activities'>('collections');
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const cached = await getCachedUser();
      if (cached) {
        setUser(cached);
      }
      const token = await getAuthToken();
      if (token) {
        const freshUser = await userService.getProfile(token);
        if (freshUser) {
          setUser(freshUser);
        }
      }
    }
    loadProfile();
  }, []);

  const loadSavedRecipes = useCallback(async () => {
    setLoadingCollections(true);
    try {
      const list = await recipeService.getSavedRecipes();
      setSavedRecipes(list);
    } catch (error) {
      console.warn('Error loading saved recipes in profile:', error);
    } finally {
      setLoadingCollections(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedRecipes();
    }, [loadSavedRecipes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSavedRecipes();
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return 'VL';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handlePlaceholderAction = (actionName: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    Alert.alert(actionName, `Tính năng "${actionName}" sẽ sớm kết nối trực tiếp với Module cộng đồng!`);
  };

  const handleOpenRecipeDetail = (item: Recipe) => {
    router.push({
      pathname: '/recipe-detail' as any,
      params: {
        id: item._id,
        title: item.title,
        imageUrl: item.image_url || undefined,
        calories: item.calories_per_serving ? String(item.calories_per_serving) : undefined,
        protein: item.protein_g ? String(item.protein_g) : undefined,
        carb: item.carb_g ? String(item.carb_g) : undefined,
        fat: item.fat_g ? String(item.fat_g) : undefined,
      },
    });
  };

  const handleRemoveSaved = async (recipe: Recipe) => {
    const doRemove = async () => {
      const updated = await recipeService.removeSavedRecipe(recipe._id || recipe.title);
      setSavedRecipes(updated);
      if (Platform.OS === 'web') {
        window.alert(`Đã xóa món "${recipe.title}" khỏi bộ sưu tập!`);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc muốn bỏ lưu món "${recipe.title}"?`)) {
        await doRemove();
      }
    } else {
      Alert.alert('Bỏ lưu công thức', `Bạn có chắc muốn xóa món "${recipe.title}" khỏi bộ sưu tập?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* 1. TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circularBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.circularBtn}
            onPress={() => handlePlaceholderAction('Chia sẻ trang cá nhân')}
            activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={18} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circularBtn}
            onPress={() => handlePlaceholderAction('Cài đặt')}
            activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={19} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} tintColor="#10B981" />
        }>
        {/* 2. USER PROFILE HEADER */}
        <View style={styles.userHeader}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarInitials}>
              <Text style={styles.avatarInitialsText}>{getInitials(user?.full_name)}</Text>
            </View>
          )}

          <View style={styles.userInfoWrapper}>
            <Text style={styles.userName}>{user?.full_name || 'Văn Lee'}</Text>
            <View style={styles.followRow}>
              <Text style={styles.followText}>
                <Text style={styles.followCount}>0</Text> followers
              </Text>
              <Text style={styles.followText}>
                <Text style={styles.followCount}>0</Text> đã follow
              </Text>
            </View>
          </View>
        </View>

        {/* 3. JOURNEY / BADGES CARD */}
        <TouchableOpacity
          style={styles.journeyCard}
          onPress={() => handlePlaceholderAction('Hành trình của bạn')}
          activeOpacity={0.88}>
          <View style={styles.journeyHeader}>
            <View>
              <Text style={styles.journeyTitle}>Hành trình của bạn</Text>
              <Text style={styles.journeySubtitle}>Huy hiệu và điểm đã tích luỹ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          <View style={styles.journeyStatsRow}>
            {/* Points Box */}
            <View style={styles.journeyStatBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <FontAwesome6 name="medal" size={16} color="#D97706" />
              </View>
              <View>
                <Text style={styles.journeyStatNumber}>0</Text>
                <Text style={styles.journeyStatLabel}>Điểm</Text>
              </View>
            </View>

            {/* Badges Box */}
            <View style={styles.journeyStatBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="ribbon" size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.journeyStatNumber}>0</Text>
                <Text style={styles.journeyStatLabel}>Huy hiệu</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* 4. SEGMENTED TABS ROW */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]}
            onPress={() => setActiveTab('posts')}>
            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Bài viết</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'recipes' && styles.tabItemActive]}
            onPress={() => setActiveTab('recipes')}>
            <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>Công thức</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'collections' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('collections');
              loadSavedRecipes();
            }}>
            <View style={styles.tabWithBadge}>
              <Text style={[styles.tabText, activeTab === 'collections' && styles.tabTextActive]}>Bộ sưu tập</Text>
              {savedRecipes.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{savedRecipes.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'activities' && styles.tabItemActive]}
            onPress={() => setActiveTab('activities')}>
            <Text style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}>Hoạt động</Text>
          </TouchableOpacity>
        </View>

        {/* 5. TAB CONTENT */}

        {/* TAB A: BỘ SƯU TẬP (COLLECTIONS) */}
        {activeTab === 'collections' && (
          <View style={styles.tabContentContainer}>
            {loadingCollections ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingSubText}>Đang tải bộ sưu tập...</Text>
              </View>
            ) : savedRecipes.length > 0 ? (
              <View>
                <View style={styles.collectionHeaderRow}>
                  <View style={styles.collectionTitleWrap}>
                    <Text style={styles.collectionTitle}>Món ăn yêu thích</Text>
                    <Text style={styles.collectionCountText}>({savedRecipes.length} món đã lưu)</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.exploreMoreBtn}
                    onPress={() => router.push('/recipes')}
                    activeOpacity={0.8}>
                    <Ionicons name="add-circle-outline" size={16} color="#10B981" />
                    <Text style={styles.exploreMoreBtnText}>Thêm món</Text>
                  </TouchableOpacity>
                </View>

                {/* Saved Dishes List */}
                <View style={styles.savedGrid}>
                  {savedRecipes.map((item, idx) => {
                    const cookTime =
                      (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0) || 20;
                    const calories = item.calories_per_serving || 350;

                    return (
                      <TouchableOpacity
                        key={item._id || idx}
                        style={styles.savedCard}
                        activeOpacity={0.88}
                        onPress={() => handleOpenRecipeDetail(item)}>
                        <View style={styles.savedImageWrapper}>
                          <Image
                            source={{
                              uri:
                                item.image_url ||
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
                            }}
                            style={styles.savedImage}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={styles.savedBookmarkBtn}
                            onPress={() => handleRemoveSaved(item)}
                            activeOpacity={0.8}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="bookmark" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.savedCardBody}>
                          <Text style={styles.savedCardTitle} numberOfLines={2}>
                            {item.title}
                          </Text>

                          <View style={styles.savedMetaRow}>
                            <View style={styles.savedMetaItem}>
                              <Ionicons name="time-outline" size={13} color="#64748B" />
                              <Text style={styles.savedMetaText}>{cookTime}p</Text>
                            </View>
                            <Text style={styles.savedMetaDot}>•</Text>
                            <View style={styles.savedMetaItem}>
                              <MaterialCommunityIcons name="fire" size={14} color="#EF4444" />
                              <Text style={styles.savedMetaText}>{Math.round(calories)} kcal</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={styles.cookingPotWrapper}>
                  <MaterialCommunityIcons name="bookmark-multiple-outline" size={64} color="#94A3B8" />
                </View>
                <Text style={styles.emptyStateHeading}>Chưa có món ăn nào trong bộ sưu tập</Text>
                <Text style={styles.emptyStateText}>
                  Hãy khám phá các công thức nấu ăn ngon và nhấn "Lưu lại" để xem lại bất cứ lúc nào!
                </Text>
                <TouchableOpacity
                  style={styles.actionGreenBtn}
                  onPress={() => router.push('/recipes')}
                  activeOpacity={0.88}>
                  <Ionicons name="restaurant-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.actionGreenBtnText}>Khám phá món ngon ngay</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAB B: CÔNG THỨC (RECIPES) */}
        {activeTab === 'recipes' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.emptyStateContainer}>
              <View style={styles.cookingPotWrapper}>
                <MaterialCommunityIcons name="chef-hat" size={64} color="#94A3B8" />
              </View>
              <Text style={styles.emptyStateHeading}>Công thức của bạn</Text>
              <Text style={styles.emptyStateText}>
                Bạn chưa chia sẻ công thức nấu ăn nào. Hãy tạo công thức đầu tiên để chia sẻ với cộng đồng!
              </Text>
              <TouchableOpacity
                style={styles.actionGreenBtn}
                onPress={() => router.push('/recipes')}
                activeOpacity={0.88}>
                <Text style={styles.actionGreenBtnText}>Khám phá công thức mẫu</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB C: BÀI VIẾT (POSTS) */}
        {activeTab === 'posts' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.emptyStateContainer}>
              <View style={styles.cookingPotWrapper}>
                <MaterialCommunityIcons name="pot-steam-outline" size={72} color="#94A3B8" />
              </View>
              <Text style={styles.emptyStateHeading}>Chưa có bài viết nào</Text>
              <Text style={styles.emptyStateText}>Bạn chưa có hoạt động nào trên trang cá nhân</Text>
              <TouchableOpacity
                style={styles.actionGreenBtn}
                onPress={() => handlePlaceholderAction('Tạo bài viết đầu tiên')}
                activeOpacity={0.88}>
                <Text style={styles.actionGreenBtnText}>Tạo bài viết đầu tiên</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB D: HOẠT ĐỘNG (ACTIVITIES) */}
        {activeTab === 'activities' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.emptyStateContainer}>
              <View style={styles.cookingPotWrapper}>
                <MaterialCommunityIcons name="run-fast" size={64} color="#94A3B8" />
              </View>
              <Text style={styles.emptyStateHeading}>Nhật ký vận động</Text>
              <Text style={styles.emptyStateText}>Theo dõi và ghi nhận các bài tập thể thao hàng ngày của bạn.</Text>
              <TouchableOpacity
                style={styles.actionGreenBtn}
                onPress={() => router.push('/activity')}
                activeOpacity={0.88}>
                <Text style={styles.actionGreenBtnText}>Ghi nhận hoạt động</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 6. BOTTOM FLOATING BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => handlePlaceholderAction('Chụp ảnh')}
          activeOpacity={0.8}>
          <Ionicons name="camera" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inputPill}
          onPress={() => handlePlaceholderAction('Đăng bài viết')}
          activeOpacity={0.9}>
          <TextInput
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor="#94A3B8"
            style={styles.fakeInput}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circularBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 16,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  avatarInitials: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D97706',
  },
  userInfoWrapper: {
    flex: 1,
  },
  userName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F2644',
    marginBottom: 4,
  },
  followRow: {
    flexDirection: 'row',
    gap: 14,
  },
  followText: {
    fontSize: 14,
    color: '#64748B',
  },
  followCount: {
    fontWeight: '700',
    color: '#0F172A',
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2644',
  },
  journeySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  journeyStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  journeyStatBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyStatNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  journeyStatLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 20,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContentContainer: {
    minHeight: 280,
  },
  collectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  collectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  collectionTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  collectionCountText: {
    fontSize: 13,
    color: '#64748B',
  },
  exploreMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  exploreMoreBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#10B981',
  },
  savedGrid: {
    gap: 12,
  },
  savedCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  savedImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  savedImage: {
    width: '100%',
    height: '100%',
  },
  savedBookmarkBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  savedCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 20,
  },
  savedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  savedMetaText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  savedMetaDot: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingSubText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  cookingPotWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionGreenBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionGreenBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputPill: {
    flex: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  fakeInput: {
    fontSize: 14,
    color: '#0F172A',
  },
});
