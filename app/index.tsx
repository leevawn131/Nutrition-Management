import { getAuthToken, isOnboardingCompleted } from '@/services/storage.service';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasAuthToken, setHasAuthToken] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      const [completed, token] = await Promise.all([isOnboardingCompleted(), getAuthToken()]);
      if (isMounted) {
        setHasCompletedOnboarding(completed);
        setHasAuthToken(Boolean(token));
        setIsLoading(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  if (hasCompletedOnboarding && hasAuthToken) {
    return <Redirect href="/(tabs)" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
