import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/app-logo';
import { authService } from '@/services/auth.service';
import { setAuthToken, setCachedUser } from '@/services/storage.service';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Địa chỉ email không đúng định dạng.');
      return false;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }

      const response = await authService.login(email.trim(), password);

      if (response && response.success) {
        if (response.data.accessToken) {
          await setAuthToken(response.data.accessToken);
        }
        if (response.data.user) {
          await setCachedUser(response.data.user);
        }

        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }
        // Navigate immediately to avoid being blocked by platform-specific Alert behavior.
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToOnboarding = () => {
    router.replace('/onboarding');
  };

  const handleNavigateToRegister = () => {
    router.replace('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Top Bar with Circular Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToOnboarding}
              activeOpacity={0.7}
              accessibilityLabel="Quay lại Onboarding">
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Logo & Header Section */}
          <View style={styles.headerSection}>
            <AppLogo size="large" />
            <Text style={styles.sectionTitle}>Đăng nhập</Text>
          </View>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Mật khẩu"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Helper Link */}
            <View style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotText}>Quên mật khẩu? </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Khôi phục mật khẩu', 'Tính năng đặt lại mật khẩu sẽ sớm có mặt!')}
                activeOpacity={0.7}>
                <Text style={styles.recoveryLink}>Khôi phục</Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Privacy Disclaimer */}
            <Text style={styles.disclaimerText}>
              Khi sử dụng Nutrition Management, đồng nghĩa với việc bạn đã chấp thuận{' '}
              <Text style={styles.policyHighlight}>Điều khoản</Text> và{' '}
              <Text style={styles.policyHighlight}>Chính sách quyền riêng tư</Text> của chúng tôi
            </Text>

            {/* Primary Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Switch to Register Link */}
          <View style={styles.bottomLinkContainer}>
            <Text style={styles.bottomPromptText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={handleNavigateToRegister} activeOpacity={0.7}>
              <Text style={styles.bottomActionText}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topBar: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
    letterSpacing: -0.2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13.5,
    color: '#B91C1C',
    fontWeight: '500',
  },
  formContainer: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15.5,
    color: '#0F172A',
  },
  passwordInput: {
    paddingRight: 10,
  },
  eyeButton: {
    padding: 6,
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#64748B',
  },
  recoveryLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  disclaimerText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  policyHighlight: {
    color: '#34D399',
    fontWeight: '600',
  },
  loginButton: {
    height: 54,
    backgroundColor: '#34D399',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  bottomLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  bottomPromptText: {
    fontSize: 14.5,
    color: '#64748B',
  },
  bottomActionText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#10B981',
  },
});
