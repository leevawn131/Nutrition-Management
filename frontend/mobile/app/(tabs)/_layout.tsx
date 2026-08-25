import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { QuickActionsModal } from '@/components/home/quick-actions-modal';

export default function TabLayout() {
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  const handleOpenQuickActions = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    setQuickActionsVisible(true);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10B981', // Nutrition green
          tabBarInactiveTintColor: '#94A3B8', // Slate grey
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}>
        
        {/* Tab 1: Trang chủ */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 2: Sức khỏe */}
        <Tabs.Screen
          name="health"
          options={{
            title: 'Sức khỏe',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'pulse' : 'pulse-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 3 (Center Action Button): Quick Actions */}
        <Tabs.Screen
          name="quick-actions-stub"
          options={{
            title: '',
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.centerButtonContainer}
                onPress={handleOpenQuickActions}
                activeOpacity={0.88}
                accessibilityLabel="Mở tác vụ nhanh">
                <View style={styles.centerButton}>
                  <MaterialCommunityIcons name="grid-large" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation
              e.preventDefault();
              handleOpenQuickActions();
            },
          }}
        />

        {/* Tab 4: Nhật ký */}
        <Tabs.Screen
          name="diary"
          options={{
            title: 'Nhật ký',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 5: Khám phá */}
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Khám phá',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* QUICK ACTIONS BOTTOM SHEET MODAL */}
      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 86 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  centerButtonContainer: {
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
