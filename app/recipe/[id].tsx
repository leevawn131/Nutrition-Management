import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { getAuthToken, getCachedUser } from '@/services/storage.service';
import { API_BASE_URL } from '@/constants/api';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface RecipeDetail {
  _id: string;
  title: string;
  image_url: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  ingredients: any[];
  steps: any[];
  nutrition_facts?: any;
  created_by_user_id?: {
    full_name: string;
    avatar_url: string;
  };
  avg_rating: number;
  comment_count: number;
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // viewMode state: 'overview' | 'detail'
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');
  
  const [activeTab, setActiveTab] = useState<'recipe' | 'nutrition' | 'comments'>('recipe');
  const [currentServings, setCurrentServings] = useState<number>(1);

  // Animation for the overlap card sliding up
  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCachedUser();
      setCurrentUser(user);
    };
    fetchUser();
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (viewMode === 'detail') {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [viewMode]);

  const fetchRecipe = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRecipe(data.recipe);
        setCurrentServings(data.recipe.servings || 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'detail') {
      setViewMode('overview');
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/recipes/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          if (Platform.OS === 'web') {
            window.alert('Đã xóa công thức');
            router.back();
          } else {
            Alert.alert('Thành công', 'Đã xóa công thức', [{ text: 'OK', onPress: () => router.back() }]);
          }
        } else {
          const errData = await res.json();
          if (Platform.OS === 'web') window.alert(errData.error || 'Không thể xóa công thức');
          else Alert.alert('Lỗi', errData.error || 'Không thể xóa công thức');
        }
      } catch(e) {
        if (Platform.OS === 'web') window.alert('Có lỗi xảy ra khi xóa');
        else Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn xóa công thức này không?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Xóa công thức',
        'Bạn có chắc chắn muốn xóa công thức này không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  const handlePlaceholder = (feature: string) => {
    alert(`Tính năng ${feature} sẽ sớm ra mắt!`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy công thức!</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#34D399' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback Mock Nutrition Data (if missing from DB)
  const nutrition = (recipe.nutrition_facts && recipe.nutrition_facts.total_nutrition_per_serving)
    ? recipe.nutrition_facts.total_nutrition_per_serving
    : (recipe.nutrition_facts || {
    energy_kcal: 170,
    protein_g: 14.1,
    carbohydrate_g: 6.3,
    fat_g: 9.9,
    saturated_fat_g: 2.0,
    trans_fat_g: 0.1,
    unsaturated_fat_g: 5.5,
    fiber_g: 0.2,
    cholesterol_mg: 47,
    sodium_mg: 141, // Muối
    glycemic_load: 5,
    vitamin_a_mcg: 13,
    vitamin_c_mg: 7,
    vitamin_e_mg: 1,
    calcium_mg: 42,
    iron_mg: 1,
    magnesium_mg: 25,
    potassium_mg: 264,
    phosphorus_mg: 160,
  });

  // Mock comments
  const mockComments = [
    { id: '1', user: 'Duong.Nguyen Nguyen 68', time: '6 tháng trước', text: 'Thank sốp, món ăn hấp dẫn', likes: 1, replies: 0 }
  ];

  // Calculate macro percentages dynamically
  const pCal = (nutrition.protein_g || 0) * 4;
  const cCal = (nutrition.carbohydrate_g || 0) * 4;
  const fCal = (nutrition.fat_g || 0) * 9;
  const totalMacroCal = pCal + cCal + fCal;
  const pPct = totalMacroCal > 0 ? ((pCal / totalMacroCal) * 100).toFixed(1) : '0.0';
  const cPct = totalMacroCal > 0 ? ((cCal / totalMacroCal) * 100).toFixed(1) : '0.0';
  const fPct = totalMacroCal > 0 ? ((fCal / totalMacroCal) * 100).toFixed(1) : '0.0';

  const renderOverview = () => {
    const isAuthor = currentUser && recipe?.created_by_user_id && (recipe.created_by_user_id as any)._id === (currentUser._id || currentUser.id);
    return (
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.overviewContainer} 
        onPress={() => setViewMode('detail')}
      >
        <SafeAreaView style={styles.overviewSafeArea}>
          
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.overviewBottom}>
            <Text style={styles.overviewTitle}>{recipe.title}</Text>
            <Text style={styles.overviewSubtitle}>Khám phá công thức mới này!</Text>
            
            <View style={styles.tagWrapper}>
              <Text style={styles.tagText}>Món chính</Text>
            </View>

            <View style={styles.macroRow}>
              {/* Fake Ring Chart */}
              <View style={styles.ringWrapper}>
                <View style={styles.ringCircle}>
                  <View style={styles.ringContent}>
                    <Text style={styles.ringVal}>{nutrition.energy_kcal || 170}</Text>
                    <Text style={styles.ringUnit}>Calo</Text>
                  </View>
                </View>
              </View>

              <View style={styles.macroList}>
                <View style={styles.macroItem}>
                  <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.macroText}>Chất đạm: {pPct}% ({nutrition.protein_g}g)</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.macroText}>Tinh bột: {cPct}% ({nutrition.carbohydrate_g}g)</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.macroText}>Chất béo: {fPct}% ({nutrition.fat_g}g)</Text>
                </View>
              </View>
            </View>

            {/* Bottom Info Bar */}
            <View style={styles.overviewFooter}>
              <View style={styles.footerInfoRow}>
                <View style={styles.footerInfoItem}>
                  <MaterialCommunityIcons name="format-list-numbered" size={16} color="#E2E8F0" />
                  <Text style={styles.footerInfoText}>{recipe.steps.length} bước</Text>
                </View>
                <View style={styles.footerInfoItem}>
                  <Ionicons name="time-outline" size={16} color="#E2E8F0" />
                  <Text style={styles.footerInfoText}>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} phút</Text>
                </View>
                <View style={styles.footerInfoItem}>
                  <MaterialCommunityIcons name="food-apple-outline" size={16} color="#E2E8F0" />
                  <Text style={styles.footerInfoText}>{recipe.ingredients.length} nguyên liệu</Text>
                </View>
              </View>
              
              <View style={styles.ratingRow}>
                <View style={styles.stars}>
                  {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={14} color="#F1F5F9" />)}
                </View>
                <Text style={styles.ratingText}>--- (--- đánh giá)</Text>
              </View>
            </View>

          </View>

          {/* Right Action Bar */}
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionItem} onPress={() => handlePlaceholder('Yêu thích')}>
              <Ionicons name="heart" size={28} color="#FFFFFF" />
              <Text style={styles.actionText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => setViewMode('detail')}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
              <Text style={styles.actionText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => handlePlaceholder('Chia sẻ')}>
              <Ionicons name="arrow-redo" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            {isAuthor && (
              <>
                <TouchableOpacity style={[styles.actionItem, { marginTop: 20 }]} onPress={() => router.push(`/recipe/edit/${id}` as any)}>
                  <Feather name="edit-2" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={26} color="#EF4444" />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.actionItem} onPress={() => handlePlaceholder('Thêm')}>
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
              <Text style={styles.actionText}>Thêm</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </TouchableOpacity>
    );
  };

  const renderRecipeTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      
      {/* Time Info */}
      <View style={styles.timeInfoRow}>
        <Ionicons name="time-outline" size={16} color="#475569" />
        <Text style={styles.timeText}>Chuẩn bị: <Text style={{fontWeight: '700'}}>{recipe.prep_time_minutes || 0} min</Text></Text>
        <Text style={styles.timeText}>Thời gian: <Text style={{fontWeight: '700'}}>{recipe.cook_time_minutes || 0} min</Text></Text>
      </View>

      <Text style={styles.sectionTitle}>Nguyên liệu</Text>
      <View style={styles.servingsRow}>
        <TouchableOpacity onPress={() => setCurrentServings(prev => Math.max(1, prev - 1))}>
          <Ionicons name="remove-circle-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.servingsText}>{currentServings} khẩu phần</Text>
        <TouchableOpacity onPress={() => setCurrentServings(prev => prev + 1)}>
          <Ionicons name="add-circle-outline" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Ingredients List */}
      <View style={styles.ingredientsList}>
        {recipe.ingredients.map((ing, idx) => {
          const originalServings = recipe.servings || 1;
          const displayQuantity = ing.quantity 
            ? ((ing.quantity / originalServings) * currentServings).toFixed(1).replace(/\.0$/, '')
            : '';
            
          // Tìm thông tin dinh dưỡng của nguyên liệu này trong breakdown (nếu có)
          const breakdownInfo = recipe.nutrition_facts?.ingredients_breakdown?.find(
            (b: any) => b?.ingredient_name?.trim().toLowerCase() === ing?.ingredient_name?.trim().toLowerCase()
          );
          const calText = breakdownInfo && breakdownInfo.calories 
            ? `${Math.round((breakdownInfo.calories / originalServings) * currentServings)} kcal` 
            : '';

          return (
            <TouchableOpacity 
              key={idx} 
              style={styles.ingredientItem}
              onPress={() => router.push(`/ingredient/${encodeURIComponent(ing.ingredient_name)}` as any)}
            >
              <View style={styles.ingredientIcon} />
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientWeight}>
                  {displayQuantity ? `${displayQuantity} ` : ''}{ing.unit || ''}
                </Text>
                <Text style={styles.ingredientName}>{ing.ingredient_name}</Text>
              </View>
              {calText ? (
                <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '600' }}>{calText}</Text>
              ) : (
                <Ionicons name="alert-circle-outline" size={20} color="#94A3B8" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.addToCartBtn} onPress={() => handlePlaceholder('Thêm vào danh sách mua sắm')}>
        <Ionicons name="cart-outline" size={18} color="#0F2644" />
        <Text style={styles.addToCartText}>Thêm vào danh sách mua sắm</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Hướng dẫn</Text>
      <Text style={styles.subtext}>Bấm nút <Ionicons name="play" size={12}/> bên dưới để nấu theo từng bước nhé</Text>

      <View style={styles.stepsList}>
        {recipe.steps.map((step, idx) => (
          <View key={idx} style={styles.stepItem}>
            <Text style={styles.stepTitle}>Bước {step.step_number || idx + 1}</Text>
            <Text style={styles.stepDesc}>{step.instruction}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderNutritionTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.sectionTitle}>Tổng quan dinh dưỡng</Text>
      <Text style={styles.subtext}>Tỷ lệ phần trăm được tính theo mức năng lượng khuyến nghị riêng của bạn.</Text>

      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={{ fontSize: 13, color: '#64748B' }}>Tổng năng lượng</Text>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>{nutrition.energy_kcal || 170} kcal</Text>
      </View>

      <View style={styles.nutritionRingsRow}>
        <View style={styles.nutriRingCol}>
          <View style={[styles.smallRing, { borderColor: '#34D399' }]}><Text style={styles.smallRingTxt}>{Math.round(parseFloat(pPct))}%</Text></View>
          <Text style={styles.smallRingLabel}>Đạm {nutrition.protein_g}g</Text>
        </View>
        <View style={styles.nutriRingCol}>
          <View style={[styles.smallRing, { borderColor: '#CBD5E1' }]}><Text style={styles.smallRingTxt}>{Math.round(parseFloat(cPct))}%</Text></View>
          <Text style={styles.smallRingLabel}>Tinh bột {nutrition.carbohydrate_g}g</Text>
        </View>
        <View style={styles.nutriRingCol}>
          <View style={[styles.smallRing, { borderColor: '#34D399' }]}><Text style={styles.smallRingTxt}>{Math.round(parseFloat(fPct))}%</Text></View>
          <Text style={styles.smallRingLabel}>Chất béo {nutrition.fat_g}g</Text>
        </View>
      </View>

      <Text style={styles.subTitle}>Chỉ số tải đường huyết (Glycemic Load index): <Text style={{fontWeight:'800', color: '#0F172A'}}>{nutrition.glycemic_load}</Text></Text>
      <View style={styles.glBar}>
        <View style={[styles.glSegment, { backgroundColor: '#34D399', flex: 1 }]} />
        <View style={[styles.glSegment, { backgroundColor: '#FBBF24', flex: 1 }]} />
        <View style={[styles.glSegment, { backgroundColor: '#EF4444', flex: 1 }]} />
        {/* Pointer fake position */}
        <View style={[styles.glPointer, { left: '15%' }]} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 30, marginBottom: 15 }]}>Giá trị dinh dưỡng mỗi khẩu phần</Text>
      
      <View style={styles.nutriTableRow}>
        <Text style={styles.nutriTableLabel}>Năng lượng</Text>
        <Text style={styles.nutriTableValue}>{nutrition.energy_kcal} Calo</Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 15, fontSize: 16 }]}>Chất sinh năng lượng</Text>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Chất đạm</Text><Text style={styles.nutriTableValue}>{nutrition.protein_g} g</Text></View>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Chất béo</Text><Text style={styles.nutriTableValue}>{nutrition.fat_g} g</Text></View>
      
      <View style={[styles.nutriTableRow, styles.nutriSubRow]}><Text style={styles.nutriTableLabelSub}>Chất béo bão hòa</Text><Text style={styles.nutriTableValueSub}>{nutrition.saturated_fat_g} g</Text></View>
      <View style={[styles.nutriTableRow, styles.nutriSubRow]}><Text style={styles.nutriTableLabelSub}>Chất béo chuyển hóa</Text><Text style={styles.nutriTableValueSub}>{nutrition.trans_fat_g} g</Text></View>
      <View style={[styles.nutriTableRow, styles.nutriSubRow]}><Text style={styles.nutriTableLabelSub}>Chất béo không bão hòa</Text><Text style={styles.nutriTableValueSub}>{nutrition.unsaturated_fat_g} g</Text></View>
      
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Chất bột đường</Text><Text style={styles.nutriTableValue}>{nutrition.carbohydrate_g} g</Text></View>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 15, fontSize: 16 }]}>Chất cần theo dõi</Text>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Chất xơ</Text><Text style={styles.nutriTableValue}>{nutrition.fiber_g} g</Text></View>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Cholesterol</Text><Text style={styles.nutriTableValue}>{nutrition.cholesterol_mg} mg</Text></View>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Muối</Text><Text style={styles.nutriTableValue}>{nutrition.sodium_mg} mg</Text></View>
      
      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 15, fontSize: 16 }]}>Vitamin</Text>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Vitamin A</Text><Text style={styles.nutriTableValue}>{nutrition.vitamin_a_mcg} ug</Text></View>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Vitamin C</Text><Text style={styles.nutriTableValue}>{nutrition.vitamin_c_mg} mg</Text></View>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 15, fontSize: 16 }]}>Khoáng chất</Text>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Canxi</Text><Text style={styles.nutriTableValue}>{nutrition.calcium_mg} mg</Text></View>
      <View style={styles.nutriTableRow}><Text style={styles.nutriTableLabel}>Sắt</Text><Text style={styles.nutriTableValue}>{nutrition.iron_mg} mg</Text></View>
    </ScrollView>
  );

  const renderCommentsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      
      <View style={styles.ratingSummary}>
        <Text style={styles.ratingBigNumber}>5</Text>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={16} color="#F59E0B" />)}
        </View>
        <Text style={styles.ratingCount}>2 ratings</Text>
        <View style={styles.ratingTag}><Text style={styles.ratingTagText}>Ngon xuất sắc</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
      <View style={styles.myRatingBox}>
        <View style={styles.myRatingTop}>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={24} color="#CBD5E1" />)}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.circleBtn, { backgroundColor: '#EF4444' }]}><Ionicons name="close" color="#FFF" size={16}/></View>
            <View style={[styles.circleBtn, { backgroundColor: '#10B981' }]}><Ionicons name="checkmark" color="#FFF" size={16}/></View>
          </View>
        </View>
        <View style={styles.tagGrid}>
          {['Ngon xuất sắc', 'Ngọt', 'Cay', 'Nhạt', 'Mềm ẩm', 'Khô', 'Giòn', 'Tươi', 'Dễ làm', 'Phù hợp cho trẻ em', 'Làm dưới 30 phút'].map(t => (
            <View key={t} style={styles.tagItemOutline}><Text style={styles.tagItemText}>{t}</Text></View>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Bình luận</Text>
      <Text style={styles.subtext}>Nhấn nút <Ionicons name="chatbubble" size={12}/> bên dưới để để lại bình luận cho công thức này</Text>

      <View style={styles.commentsList}>
        {mockComments.map(c => (
          <View key={c.id} style={styles.commentItem}>
            <View style={styles.commentAvatar} />
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>{c.user}</Text>
                <Text style={styles.commentTime}>{c.time}</Text>
              </View>
              <Text style={styles.commentText}>{c.text}</Text>
              <View style={styles.commentActions}>
                <Text style={styles.commentActionText}><Ionicons name="heart-outline"/> {c.likes} lượt thích</Text>
                <Text style={styles.commentActionText}><Ionicons name="chatbubble-outline"/> {c.replies} bình luận</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Background Image (Shared across both modes) */}
      <ImageBackground 
        source={{ uri: recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' }}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.darkOverlay} />
      </ImageBackground>

      {/* OVERVIEW LAYER */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: viewMode === 'overview' ? 10 : 0, opacity: viewMode === 'overview' ? 1 : 0 }]} pointerEvents={viewMode === 'overview' ? 'auto' : 'none'}>
        {renderOverview()}
      </View>

      {/* DETAIL OVERLAP CARD LAYER */}
      <Animated.View style={[styles.detailCardContainer, { transform: [{ translateY: slideAnim }], zIndex: 20 }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Top Bar inside detail mode */}
          <View style={styles.topBarDetail}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{recipe.title}</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handlePlaceholder('Chia sẻ')}>
              <Ionicons name="paper-plane-outline" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* White Card overlapping image */}
          <View style={styles.whiteCard}>
            
            {/* Header info overlapping */}
            <View style={styles.authorCard}>
              <View style={styles.tagWrapperSmall}><Text style={styles.tagTextSmall}>Món chính</Text></View>
              <Text style={styles.detailTitle}>{recipe.title}</Text>
              <View style={styles.authorRow}>
                <Text style={styles.authorPrefix}>by</Text>
                <Image source={{ uri: recipe.created_by_user_id?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.authorAvatar} />
                <Text style={styles.authorName}>{recipe.created_by_user_id?.full_name || 'Đầu bếp Vô danh'}</Text>
              </View>
              <View style={styles.authorStats}>
                <Text style={styles.authorStatText}>-- <Ionicons name="star" color="#F59E0B" /> (--)</Text>
                <Text style={styles.authorStatText}><Ionicons name="bookmark" color="#3B82F6" /> (19)</Text>
              </View>
            </View>

            {/* Tabs Row */}
            <View style={styles.tabsRow}>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'recipe' && styles.tabItemActive]} onPress={() => setActiveTab('recipe')}>
                <Text style={[styles.tabText, activeTab === 'recipe' && styles.tabTextActive]}>Công thức</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'nutrition' && styles.tabItemActive]} onPress={() => setActiveTab('nutrition')}>
                <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>Dinh Dưỡng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabItem, activeTab === 'comments' && styles.tabItemActive]} onPress={() => setActiveTab('comments')}>
                <Text style={[styles.tabText, activeTab === 'comments' && styles.tabTextActive]}>Bình luận</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContentContainer}>
              {activeTab === 'recipe' && renderRecipeTab()}
              {activeTab === 'nutrition' && renderNutritionTab()}
              {activeTab === 'comments' && renderCommentsTab()}
            </View>

          </View>
        </SafeAreaView>
      </Animated.View>

      {/* FIXED BOTTOM ACTION BAR (Only visible in Detail mode) */}
      {viewMode === 'detail' && (
        <View style={styles.bottomActionBar}>
          <TouchableOpacity style={[styles.actionBtnRound, { backgroundColor: '#34D399' }]} onPress={() => handlePlaceholder('Giỏ hàng')}>
            <Ionicons name="cart" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtnRound, { backgroundColor: '#3B82F6' }]} onPress={() => handlePlaceholder('Nấu ăn')}>
            <Ionicons name="play" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtnRound, { backgroundColor: '#F59E0B' }]} onPress={() => setActiveTab('comments')}>
            <Ionicons name="chatbubbles" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={() => handlePlaceholder('Lưu công thức')}>
            <Text style={styles.saveBtnText}>Lưu lại</Text>
            <Ionicons name="bookmark" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgImage: { width: '100%', height: '100%', position: 'absolute' },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // OVERVIEW
  overviewContainer: { flex: 1 },
  overviewSafeArea: { flex: 1, justifyContent: 'space-between' },
  topBar: { padding: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  overviewBottom: { paddingHorizontal: 20, paddingBottom: 30, zIndex: 2 },
  overviewTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 },
  overviewSubtitle: { fontSize: 14, color: '#F1F5F9', marginTop: 4, marginBottom: 12 },
  tagWrapper: { backgroundColor: '#34D399', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 20 },
  tagText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 20 },
  
  // Fake Ring
  ringWrapper: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, borderColor: '#F59E0B', borderTopColor: '#3B82F6', borderRightColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  ringCircle: { width: '100%', height: '100%', borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  ringContent: { alignItems: 'center' },
  ringVal: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  ringUnit: { fontSize: 12, color: '#E2E8F0' },
  
  macroList: { flex: 1, gap: 8 },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  macroText: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  
  overviewFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16, gap: 10 },
  footerInfoRow: { flexDirection: 'row', gap: 16 },
  footerInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerInfoText: { color: '#E2E8F0', fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingText: { color: '#E2E8F0', fontSize: 13 },

  rightActions: { position: 'absolute', right: 20, bottom: 80, alignItems: 'center', gap: 24, zIndex: 10 },
  actionItem: { alignItems: 'center', gap: 4 },
  actionText: { color: '#FFF', fontSize: 13, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:0, height:1}, textShadowRadius: 2 },

  // DETAIL CARD
  detailCardContainer: { ...StyleSheet.absoluteFillObject },
  topBarDetail: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  whiteCard: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: 180, overflow: 'hidden' },
  
  // Author Card (overlaps image slightly by negative margin)
  authorCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: -40, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  tagWrapperSmall: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  tagTextSmall: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  authorPrefix: { color: '#64748B', fontStyle: 'italic' },
  authorAvatar: { width: 28, height: 28, borderRadius: 14 },
  authorName: { color: '#0F172A', fontWeight: '500' },
  authorStats: { flexDirection: 'row', gap: 16 },
  authorStatText: { color: '#64748B', fontSize: 13 },

  // Tabs
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginTop: 20, paddingHorizontal: 20 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#34D399' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  tabTextActive: { color: '#0F172A', fontWeight: '700' },
  tabContentContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  tabContent: { flex: 1, padding: 20 },

  // Common Tab elements
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtext: { fontSize: 13, color: '#64748B', marginBottom: 16 },

  // Recipe Tab
  timeInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 },
  timeText: { fontSize: 13, color: '#475569' },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  servingsText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  ingredientsList: { gap: 12, marginBottom: 20 },
  ingredientItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12 },
  ingredientIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDE68A', marginRight: 12 },
  ingredientInfo: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  ingredientWeight: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  ingredientName: { fontSize: 14, color: '#475569' },
  addToCartBtn: { backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  addToCartText: { fontSize: 14, fontWeight: '600', color: '#0F2644' },
  stepsList: { gap: 16, marginTop: 10 },
  stepItem: { borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: '#CBD5E1', paddingBottom: 16 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  stepDesc: { fontSize: 14.5, color: '#334155', lineHeight: 22 },

  // Nutrition Tab
  nutritionRingsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  nutriRingCol: { alignItems: 'center', gap: 8 },
  smallRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  smallRingTxt: { fontSize: 13, fontWeight: '700', color: '#34D399' },
  smallRingLabel: { fontSize: 12, color: '#64748B' },
  subTitle: { fontSize: 14, color: '#475569', marginBottom: 8 },
  glBar: { height: 8, flexDirection: 'row', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  glSegment: { height: '100%' },
  glPointer: { position: 'absolute', top: -4, width: 8, height: 16, backgroundColor: '#0F172A', borderRadius: 4 },
  nutriTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  nutriSubRow: { paddingLeft: 20, borderBottomWidth: 0, paddingVertical: 6 },
  nutriTableLabel: { fontSize: 14.5, color: '#0F172A' },
  nutriTableValue: { fontSize: 14.5, fontWeight: '600', color: '#0F172A' },
  nutriTableLabelSub: { fontSize: 14, color: '#64748B' },
  nutriTableValueSub: { fontSize: 14, color: '#475569' },

  // Comments Tab
  ratingSummary: { alignItems: 'center', marginBottom: 24 },
  ratingBigNumber: { fontSize: 40, fontWeight: '800', color: '#0F172A' },
  starsRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  ratingCount: { fontSize: 13, color: '#64748B', fontStyle: 'italic', marginBottom: 12 },
  ratingTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  ratingTagText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  myRatingBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  myRatingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  circleBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagItemOutline: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  tagItemText: { fontSize: 12, color: '#64748B' },
  commentsList: { gap: 16 },
  commentItem: { flexDirection: 'row', gap: 12 },
  commentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CBD5E1' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentUser: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  commentTime: { fontSize: 12, color: '#94A3B8' },
  commentText: { fontSize: 14, color: '#334155', marginBottom: 8 },
  commentActions: { flexDirection: 'row', gap: 16 },
  commentActionText: { fontSize: 12, color: '#64748B' },

  // Bottom Fixed Bar
  bottomActionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F8FAFC', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', alignItems: 'center', gap: 12 },
  actionBtnRound: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#34D399', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 22, gap: 8 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
