import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AttachedRecipe } from '@/types/post.types';
import { postService } from '@/services/post.service';
import { recipeService } from '@/services/recipe.service';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  userName?: string;
  userAvatar?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
  userName = 'Sáng Hoàng',
  userAvatar,
}) => {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<AttachedRecipe | null>(null);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [recipeList, setRecipeList] = useState<AttachedRecipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = (userName || 'Sáng Hoàng').substring(0, 2).toUpperCase();

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền để chọn ảnh từ thư viện');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setSelectedImages(prev => [...prev, uri]);
      }
    } catch (err) {
      console.log('Lỗi chọn ảnh:', err);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenRecipePicker = async () => {
    setShowRecipePicker(true);
    setIsLoadingRecipes(true);
    try {
      const recipes = await postService.search('', 'recipes');
      if (recipes && recipes.length > 0) {
        setRecipeList(recipes);
      } else {
        const defaultRecipes = await recipeService.getRecipes();
        setRecipeList(defaultRecipes as any);
      }
    } catch (err) {
      console.log('Lỗi lấy danh sách công thức:', err);
      try {
        const defaultRecipes = await recipeService.getRecipes();
        setRecipeList(defaultRecipes as any);
      } catch {}
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const handleSelectRecipe = (recipe: AttachedRecipe) => {
    setSelectedRecipe(recipe);
    setShowRecipePicker(false);
  };

  const handleSubmitPost = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc thêm ảnh bài viết');
      return;
    }

    setIsSubmitting(true);
    try {
      await postService.createPost({
        content: content.trim(),
        recipe_id: selectedRecipe?.id || selectedRecipe?._id,
        images: selectedImages,
      });

      setContent('');
      setSelectedImages([]);
      setSelectedRecipe(null);
      onPostCreated?.();
      onClose();

      if (Platform.OS !== 'web') {
        Alert.alert('Thành công', 'Bài viết đã được đăng lên cộng đồng!');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Không thể đăng bài viết. Vui lòng thử lại.';
      if (Platform.OS === 'web') {
        window.alert('Lỗi: ' + errMsg);
      } else {
        Alert.alert('Lỗi', errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bài viết</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* User Info Row */}
          <View style={styles.userInfoRow}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <Text style={styles.userName}>{userName}</Text>
          </View>

          {/* Post Content Input Area */}
          <TextInput
            style={styles.textArea}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={5000}
            value={content}
            onChangeText={setContent}
          />
          <Text style={styles.charCounter}>{content.length} / 5000</Text>

          {/* Selected Images Preview */}
          {selectedImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreviewScroll}>
              {selectedImages.map((imgUri, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: imgUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageBadge}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* Selected Recipe Chip */}
          {selectedRecipe ? (
            <View style={styles.recipeSelectedChip}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.recipeSelectedText} numberOfLines={1}>
                Đính kèm: {selectedRecipe.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Attachment Action Options */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionRowBtn} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={22} color="#10B981" />
              <Text style={styles.actionRowText}>Thêm ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRowBtn}
              onPress={() => Alert.alert('Thông báo', 'Tính năng thêm bộ sưu tập đang phát triển')}
            >
              <Ionicons name="journal-outline" size={20} color="#F59E0B" />
              <Text style={styles.actionRowText}>Thêm bộ sưu tập</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRowBtn} onPress={handleOpenRecipePicker}>
              <Ionicons name="star-outline" size={20} color="#EAB308" />
              <Text style={styles.actionRowText}>Thêm công thức</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Submit Post Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!content.trim() && selectedImages.length === 0) && styles.submitBtnDisabled,
            ]}
            disabled={(!content.trim() && selectedImages.length === 0) || isSubmitting}
            onPress={handleSubmitPost}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Đăng</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recipe Picker Bottom Sheet */}
        <Modal
          visible={showRecipePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRecipePicker(false)}
        >
          <View style={styles.recipePickerOverlay}>
            <View style={styles.recipePickerContent}>
              <View style={styles.recipePickerHeader}>
                <Text style={styles.recipePickerTitle}>Chọn công thức đính kèm</Text>
                <TouchableOpacity onPress={() => setShowRecipePicker(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.recipePickerCreateNewBtn}
                onPress={() => {
                  setShowRecipePicker(false);
                  onClose();
                  router.push('/recipe/create' as any);
                }}
              >
                <Ionicons name="add-circle" size={22} color="#10B981" />
                <Text style={styles.recipePickerCreateNewText}>+ Tạo công thức món ăn mới</Text>
              </TouchableOpacity>

              {isLoadingRecipes ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 30 }} />
              ) : (
                <ScrollView style={{ maxHeight: 380, marginVertical: 10 }}>
                  {recipeList.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 14 }}>Chưa có công thức món ăn nào</Text>
                    </View>
                  ) : (
                    recipeList.map((rec) => (
                      <TouchableOpacity
                        key={rec.id || rec._id}
                        style={styles.recipePickerItem}
                        onPress={() => handleSelectRecipe(rec)}
                      >
                        <Image
                          source={{ uri: rec.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' }}
                          style={styles.recipePickerThumb}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recipePickerItemTitle}>{rec.title}</Text>
                          <Text style={styles.recipePickerItemSub}>
                            {(rec.prep_time_minutes || 0) + (rec.cook_time_minutes || 0)} phút • {rec.ingredient_count || 0} nguyên liệu
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
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
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  userInfoRow: {
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
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  textArea: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E293B',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: 16,
  },
  imagesPreviewScroll: {
    marginBottom: 16,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  removeImageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
  },
  recipeSelectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  recipeSelectedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  actionsSection: {
    gap: 14,
    marginTop: 10,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  actionRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  submitBtn: {
    backgroundColor: '#475569',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recipePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  recipePickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  recipePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recipePickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  recipePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recipePickerThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  recipePickerItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recipePickerItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  recipePickerCreateNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  recipePickerCreateNewText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
});
