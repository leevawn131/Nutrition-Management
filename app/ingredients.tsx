import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IngredientsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={24} color="#10294B" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm nguyên liệu</Text>
        <TouchableOpacity style={styles.headerAction} accessibilityLabel="Lọc nguyên liệu">
          <Ionicons name="options-outline" size={23} color="#49C99B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={25} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm nguyên liệu"
            placeholderTextColor="#A1A8B2"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="food-apple-outline" size={48} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>{search ? 'Không tìm thấy nguyên liệu' : 'Chưa có nguyên liệu nào'}</Text>
          <Text style={styles.emptyText}>Chọn nguyên liệu để thêm vào bữa ăn của bạn.</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <MaterialCommunityIcons name="shopping-outline" size={25} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Thêm 0 nguyên liệu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 82, borderBottomWidth: 1, borderBottomColor: '#F0F1F3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 18 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 25, fontWeight: '500', color: '#10294B' },
  headerAction: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#DCE2E7', alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, padding: 32, paddingBottom: 120 },
  searchBox: { height: 64, borderWidth: 1, borderColor: '#D8DCE1', borderRadius: 18, backgroundColor: '#FAFAFB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  searchInput: { flex: 1, fontSize: 19, color: '#10294B' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 150 },
  emptyIcon: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emptyTitle: { fontSize: 21, fontWeight: '800', color: '#10294B', textAlign: 'center', marginBottom: 8 },
  emptyText: { maxWidth: 280, fontSize: 16, lineHeight: 23, color: '#A1A8B2', textAlign: 'center' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: 32, paddingVertical: 17 },
  addButton: { height: 64, borderRadius: 32, backgroundColor: '#49C99B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  addButtonText: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
});
