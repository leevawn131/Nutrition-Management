import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppLogo } from '@/components/ui/app-logo';
import { authService } from '@/services/auth.service';
import { setAuthToken, setCachedUser } from '@/services/storage.service';

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!confirmPassword) {
      setErrorMessage('Vui lòng xác nhận lại mật khẩu.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
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

      const response = await authService.register(email.trim(), password);

      if (response && response.success) {
        // Auto-login to persist session for setup wizard
        try {
          const loginRes = await authService.login(email.trim(), password);
          if (loginRes && loginRes.success) {
            if (loginRes.data.accessToken) await setAuthToken(loginRes.data.accessToken);
            if (loginRes.data.user) await setCachedUser(loginRes.data.user);
          }
        } catch {}

        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }
        router.replace('/(setup)/step-1');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Đăng ký không thành công. Vui lòng thử lại sau.');
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

  const handleNavigateToLogin = () => {
    router.replace('/(auth)/login');
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
            <Text style={styles.sectionTitle}>Đăng ký bằng email</Text>
          </View>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Inputs (3 fields) */}
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

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* Primary Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Switch to Login Link */}
          <View style={styles.bottomLinkContainer}>
            <Text style={styles.bottomPromptText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={handleNavigateToLogin} activeOpacity={0.7}>
              <Text style={styles.bottomActionText}>Đăng nhập</Text>
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
  registerButton: {
    height: 54,
    backgroundColor: '#34D399',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
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
