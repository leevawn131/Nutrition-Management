import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getAuthToken, getCachedUser } from '@/services/storage.service';
import { userService } from '@/services/user.service';
import { User } from '@/types/auth.types';
import { API_BASE_URL } from '@/constants/api';

interface Recipe {
  _id: string;
  title: string;
  image_url: string;
  created_at: string;
  status: string;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'recipes' | 'collections' | 'activities'>('posts');
  
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'recipes') {
      fetchMyRecipes();
    }
  }, [activeTab]);

  const fetchMyRecipes = async () => {
    setIsLoadingRecipes(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/recipes/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.recipes) {
        setMyRecipes(data.recipes);
      }
    } catch (error) {
      console.error('Failed to fetch recipes', error);
    } finally {
      setIsLoadingRecipes(false);
    }
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
        showsVerticalScrollIndicator={false}>
        
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
            onPress={() => setActiveTab('collections')}>
            <Text style={[styles.tabText, activeTab === 'collections' && styles.tabTextActive]}>Bộ sưu tập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'activities' && styles.tabItemActive]}
            onPress={() => setActiveTab('activities')}>
            <Text style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}>Hoạt động</Text>
          </TouchableOpacity>
        </View>

        {/* 5. CONTENT SECTION BASED ON TAB */}
        {activeTab === 'posts' && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.cookingPotWrapper}>
              <MaterialCommunityIcons name="pot-steam-outline" size={72} color="#94A3B8" />
            </View>

            <Text style={styles.emptyStateText}>Bạn chưa có hoạt động nào trên trang cá nhân</Text>

            <TouchableOpacity
              style={styles.createPostBtn}
              onPress={() => handlePlaceholderAction('Tạo bài viết đầu tiên')}
              activeOpacity={0.88}>
              <Text style={styles.createPostBtnText}>Tạo bài viết đầu tiên</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'recipes' && (
          <View style={styles.recipesTabContainer}>
            <View style={styles.recipesHeaderRow}>
              <Text style={styles.recipesSectionTitle}>Các công thức của bạn:</Text>
              <TouchableOpacity style={styles.filterBtn}>
                <Text style={styles.filterBtnText}>Chế độ công khai</Text>
                <Ionicons name="options-outline" size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            {isLoadingRecipes ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải công thức...</Text>
              </View>
            ) : myRecipes.length > 0 ? (
              <View style={styles.recipeGrid}>
                {myRecipes.map((recipe) => (
                  <TouchableOpacity 
                    key={recipe._id} 
                    style={styles.recipeCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/recipe/${recipe._id}` as any)}
                  >
                    <Image 
                      source={{ uri: recipe.image_url || 'https://via.placeholder.com/150' }} 
                      style={styles.recipeCardImg} 
                    />
                    <View style={styles.recipeCardBody}>
                      <Text style={styles.recipeCardTitle} numberOfLines={2}>{recipe.title}</Text>
                      <Text style={styles.recipeCardDate}>
                        {new Date(recipe.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyRecipeIconWrapper}>
                  <MaterialCommunityIcons name="pot" size={80} color="#CBD5E1" />
                  <MaterialCommunityIcons name="pot-steam" size={40} color="#94A3B8" style={styles.emptyRecipeLid} />
                </View>

                <Text style={styles.emptyStateText}>Bạn chưa có công thức công khai nào</Text>

                <TouchableOpacity
                  style={styles.createRecipeBtn}
                  onPress={() => router.push('/recipe/create')}
                  activeOpacity={0.88}>
                  <Text style={styles.createRecipeBtnText}>Tạo công thức đầu tiên</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 6. BOTTOM FLOATING BAR OR FAB */}
      {activeTab === 'recipes' ? (
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={styles.fabBtn} 
            onPress={() => router.push('/recipe/create')}
            activeOpacity={0.9}>
            <Text style={styles.fabBtnText}>Tạo công thức</Text>
            <View style={styles.fabIconCircle}>
              <Ionicons name="add" size={16} color="#34D399" />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
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
      )}
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
    marginBottom: 32,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  cookingPotWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 18,
  },
  createPostBtn: {
    backgroundColor: '#34D399',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  createPostBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recipesTabContainer: {
    flex: 1,
  },
  recipesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  recipesSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  filterBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  emptyRecipeIconWrapper: {
    position: 'relative',
    height: 100,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyRecipeLid: {
    position: 'absolute',
    top: 0,
    left: 10,
    transform: [{ rotate: '-15deg' }],
  },
  createRecipeBtn: {
    backgroundColor: '#34D399',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createRecipeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  recipeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  recipeCardImg: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  recipeCardBody: {
    padding: 12,
  },
  recipeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  recipeCardDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 100,
  },
  fabBtn: {
    backgroundColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fabBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  fabIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
