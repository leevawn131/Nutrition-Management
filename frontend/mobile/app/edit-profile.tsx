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
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getAuthToken, getCachedUser, setCachedUser } from '@/services/storage.service';
import { userService } from '@/services/user.service';
import { User } from '@/types/auth.types';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Reference-only fields (Visual UI matching reference ~70%, not in DB schema)
  const [bio, setBio] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [youtube, setYoutube] = useState<string>('');
  const [tiktok, setTiktok] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Load current user profile
  useEffect(() => {
    async function loadUserData() {
      try {
        const cached = await getCachedUser();
        if (cached) {
          setCurrentUser(cached);
          setFullName(cached.full_name || '');
          setAvatarUrl(cached.avatar_url || null);
        }

        const token = await getAuthToken();
        if (token) {
          const freshUser = await userService.getProfile(token);
          if (freshUser) {
            setCurrentUser(freshUser);
            setFullName(freshUser.full_name || '');
            setAvatarUrl(freshUser.avatar_url || null);
            await setCachedUser(freshUser);
          }
        }
      } catch (error) {
        console.warn('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleNameChange = (text: string) => {
    setFullName(text);
    setHasChanges(true);
  };

  const handleAvatarEdit = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Đổi ảnh đại diện',
        'Nhập đường dẫn (URL) ảnh đại diện mới của bạn:',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Cập nhật',
            onPress: (url?: string) => {
              if (url && url.trim()) {
                setAvatarUrl(url.trim());
                setHasChanges(true);
              }
            },
          },
        ],
        'plain-text',
        avatarUrl || ''
      );
    } else {
      Alert.alert(
        'Đổi ảnh đại diện',
        'Tính năng chọn ảnh từ thư viện thiết bị sẽ sớm được cập nhật!'
      );
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
      router.replace('/settings' as any);
    }
  };

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert('Lỗi', 'Tên hiển thị không được để trống.');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Lỗi', 'Tên hiển thị không được vượt quá 50 ký tự.');
      return;
    }

    setIsSaving(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      // ONLY submit fields owned by Profile (Module A rules)
      const updatedUser = await userService.updateProfile(token, {
        full_name: trimmedName,
        avatar_url: avatarUrl,
      });

      if (updatedUser) {
        await setCachedUser(updatedUser);
      }

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      Alert.alert('Thành công', 'Cập nhật thông tin hồ sơ thành công!', [
        {
          text: 'Đồng ý',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/settings' as any);
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return 'VL';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 1. TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay lại">
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Hồ sơ</Text>

          <View style={styles.placeholderRight} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* 2. AVATAR SECTION */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(fullName || currentUser?.full_name)}</Text>
                </View>
              )}

              {/* Edit Pencil Icon */}
              <TouchableOpacity
                style={styles.editPencilButton}
                onPress={handleAvatarEdit}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Đổi ảnh đại diện">
                <Ionicons name="pencil" size={14} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. TÊN HIỂN THỊ (Full Name - Supported in DB) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tên hiển thị</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={handleNameChange}
                placeholder="Nhập tên hiển thị"
                placeholderTextColor="#94A3B8"
                maxLength={50}
              />
            </View>
            <Text style={styles.charCounter}>{fullName.length} / 50</Text>
          </View>

          {/* 4. GIỚI THIỆU BẢN THÂN (Bio - Visual Reference Item) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Giới thiệu bản thân</Text>
            <View style={[styles.inputWrapper, styles.multilineWrapper]}>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={bio}
                onChangeText={(text) => {
                  setBio(text);
                  setHasChanges(true);
                }}
                placeholder="Viết một đoạn giới thiệu ngắn về bạn..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={4}
                maxLength={250}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.charCounter}>{bio.length} / 250</Text>
          </View>

          {/* 5. WEBSITE (Visual Reference Item) */}
          <View style={styles.socialRow}>
            <View style={styles.socialLabelContainer}>
              <Ionicons name="globe-outline" size={20} color="#0F172A" />
              <Text style={styles.socialLabel}>Website</Text>
            </View>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialInputWrapper}>
                <TextInput
                  style={styles.socialInput}
                  value={website}
                  onChangeText={(text) => {
                    setWebsite(text);
                    setHasChanges(true);
                  }}
                  placeholder="https://..."
                  placeholderTextColor="#94A3B8"
                  maxLength={50}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.charCounter}>{website.length} / 50</Text>
            </View>
          </View>

          {/* 6. YOUTUBE (Visual Reference Item) */}
          <View style={styles.socialRow}>
            <View style={styles.socialLabelContainer}>
              <Ionicons name="logo-youtube" size={20} color="#EF4444" />
              <Text style={styles.socialLabel}>Youtube</Text>
            </View>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialInputWrapper}>
                <TextInput
                  style={styles.socialInput}
                  value={youtube}
                  onChangeText={(text) => {
                    setYoutube(text);
                    setHasChanges(true);
                  }}
                  placeholder="https://youtube.com/..."
                  placeholderTextColor="#94A3B8"
                  maxLength={50}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.charCounter}>{youtube.length} / 50</Text>
            </View>
          </View>

          {/* 7. TIKTOK (Visual Reference Item) */}
          <View style={styles.socialRow}>
            <View style={styles.socialLabelContainer}>
              <Ionicons name="logo-tiktok" size={20} color="#0F172A" />
              <Text style={styles.socialLabel}>Tiktok</Text>
            </View>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialInputWrapper}>
                <TextInput
                  style={styles.socialInput}
                  value={tiktok}
                  onChangeText={(text) => {
                    setTiktok(text);
                    setHasChanges(true);
                  }}
                  placeholder="@username"
                  placeholderTextColor="#94A3B8"
                  maxLength={50}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.charCounter}>{tiktok.length} / 50</Text>
            </View>
          </View>

          {/* 8. INSTAGRAM (Visual Reference Item) */}
          <View style={styles.socialRow}>
            <View style={styles.socialLabelContainer}>
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />
              <Text style={styles.socialLabel}>Instagram</Text>
            </View>
            <View style={styles.socialInputContainer}>
              <View style={styles.socialInputWrapper}>
                <TextInput
                  style={styles.socialInput}
                  value={instagram}
                  onChangeText={(text) => {
                    setInstagram(text);
                    setHasChanges(true);
                  }}
                  placeholder="@username"
                  placeholderTextColor="#94A3B8"
                  maxLength={50}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.charCounter}>{instagram.length} / 50</Text>
            </View>
          </View>
        </ScrollView>

        {/* 9. FLOATING / BOTTOM-RIGHT SAVE BUTTON */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            activeOpacity={0.88}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={styles.saveIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F2644',
    letterSpacing: -0.3,
  },
  placeholderRight: {
    width: 38,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  editPencilButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2644',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15.5,
    color: '#0F2644',
    fontWeight: '600',
  },
  multilineWrapper: {
    height: 110,
    paddingVertical: 12,
  },
  multilineInput: {
    flex: 1,
    height: '100%',
    fontWeight: '400',
  },
  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 6,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  socialLabelContainer: {
    width: 100,
    paddingTop: 14,
    gap: 4,
  },
  socialLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  socialInputContainer: {
    flex: 1,
  },
  socialInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  socialInput: {
    fontSize: 14,
    color: '#0F2644',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveIcon: {
    marginLeft: 2,
  },
});
