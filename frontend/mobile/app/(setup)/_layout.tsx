import React from 'react';
import { Stack } from 'expo-router';
import { SetupProvider } from '@/context/setup-context';

export default function SetupLayout() {
  return (
    <SetupProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="step-1" options={{ headerShown: false }} />
        <Stack.Screen name="step-2" options={{ headerShown: false }} />
        <Stack.Screen name="step-3" options={{ headerShown: false }} />
        <Stack.Screen name="step-4" options={{ headerShown: false }} />
        <Stack.Screen name="step-5" options={{ headerShown: false }} />
        <Stack.Screen name="step-6" options={{ headerShown: false }} />
        <Stack.Screen name="step-7" options={{ headerShown: false }} />
        <Stack.Screen name="step-8" options={{ headerShown: false }} />
        <Stack.Screen name="step-9" options={{ headerShown: false }} />
        <Stack.Screen name="step-10" options={{ headerShown: false }} />
        <Stack.Screen name="step-11" options={{ headerShown: false }} />
        <Stack.Screen name="step-12" options={{ headerShown: false }} />
      </Stack>
    </SetupProvider>
  );
}
