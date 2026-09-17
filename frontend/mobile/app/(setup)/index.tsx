import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SetupQuickOption() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
        borderWidth: 1.5,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
      }}
      onPress={() => router.push('/goal-setup-chat')}
    >
      <Ionicons name="chatbubbles-outline" size={22} color="#10B981" style={{ marginRight: 8 }} />
      <Text style={{ color: '#047857', fontWeight: '700', fontSize: 15 }}>
        Thiết lập nhanh cùng AI Tri (Khuyên dùng)
      </Text>
    </TouchableOpacity>
  );
}