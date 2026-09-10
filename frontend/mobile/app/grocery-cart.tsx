import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroceryItem, groceryService } from '@/services/grocery.service';

const INITIAL_GROCERY_DATA: Omit<GroceryItem, 'id' | 'added_at'>[] = [
  {
    name: 'Bánh đa nem',
    quantity: '100',
    unit: 'g',
    category: 'Ngũ cốc',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=160',
    checked: false,
    recipe_name: 'Nem rán Hà Nội',
  },
  {
    name: 'Cá rô phi',
    quantity: '500',
    unit: 'g',
    category: 'Cá và hải sản',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=160',
    checked: false,
    recipe_name: 'Lẩu cá tôm',
  },
  {
    name: 'Tôm sú',
    quantity: '300',
    unit: 'g',
    category: 'Cá và hải sản',
    image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=160',
    checked: false,
    recipe_name: 'Lẩu cá tôm',
  },
  {
    name: 'Dầu ăn',
    quantity: '1',
    unit: 'thìa canh',
    category: 'Chất béo',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=160',
    checked: false,
    recipe_name: 'Lẩu cá tôm',
  },
  {
    name: 'Cà chua',
    quantity: '2',
    unit: 'quả (vừa)',
    category: 'Củ',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=160',
    checked: false,
    recipe_name: 'Lẩu cá tôm',
  },
  {
    name: 'Hành khô (hành tím)',
    quantity: '3',
    unit: 'muỗng canh băm',
    category: 'Củ',
    image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=160',
    checked: false,
    recipe_name: 'Lẩu cá tôm',
  },
  {
    name: 'Rau muống',
    quantity: '300',
    unit: 'g',
    category: 'Rau và gia vị',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160',
    checked: false,
    recipe_name: 'Lẩu cá tôm',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Ngũ cốc': '#FFEDD5',
  'Cá và hải sản': '#E0F2FE',
  'Chất béo': '#FEF9C3',
  'Củ': '#FCE7F3',
  'Rau và gia vị': '#DCFCE7',
  'Thịt': '#FEE2E2',
  'Trứng và sữa': '#FEF3C7',
  'KHÁC': '#F1F5F9',
};

export default function GroceryCartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [displayMode, setDisplayMode] = useState<'category' | 'recipe'>('category');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addCategory, setAddCategory] = useState('Ngũ cốc');

  const loadCartItems = async () => {
    const loaded = await groceryService.getGroceryItems();
    if (loaded.length === 0) {
      const seeded = await groceryService.addIngredients(INITIAL_GROCERY_DATA);
      setItems(seeded);
    } else {
      setItems(loaded);
    }
  };

  useEffect(() => {
    loadCartItems();
  }, []);

  const handleToggle = async (id: string) => {
    const updated = await groceryService.toggleItem(id);
    setItems(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = await groceryService.removeItem(id);
    setItems(updated);
  };

  const handleShareList = async () => {
    if (items.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Giỏ đi chợ của bạn đang trống!');
      } else {
        Alert.alert('Giỏ đi chợ', 'Giỏ đi chợ của bạn đang trống!');
      }
      return;
    }

    const textList = items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name} - ${it.quantity || ''} ${it.unit || ''} [${it.checked ? 'Đã mua' : 'Chưa mua'}]`
      )
      .join('\n');

    const shareContent = `🛒 DANH SÁCH ĐI CHỢ CỦA BẠN (${items.length} nguyên liệu):\n\n${textList}\n\nĐược tạo từ ứng dụng Nutrition Management!`;

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareContent);
          window.alert('Đã sao chép danh sách đi chợ vào clipboard!');
        } else {
          window.alert(shareContent);
        }
      } else {
        await Share.share({
          message: shareContent,
          title: 'Danh sách đi chợ của bạn',
        });
      }
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleClearAll = async () => {
    const confirmClear = async () => {
      await groceryService.clearAll();
      setItems([]);
      setShowOptionsMenu(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ đi chợ?')) {
        await confirmClear();
      }
    } else {
      Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa toàn bộ giỏ đi chợ?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa hết', style: 'destructive', onPress: confirmClear },
      ]);
    }
  };

  const handleClearCompleted = async () => {
    for (const item of items) {
      if (item.checked) {
        await groceryService.removeItem(item.id);
      }
    }
    const updated = await groceryService.getGroceryItems();
    setItems(updated);
    setShowOptionsMenu(false);
  };

  const handleSaveNewItem = async () => {
    if (!addName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Vui lòng nhập tên nguyên liệu!');
      } else {
        Alert.alert('Thông báo', 'Vui lòng nhập tên nguyên liệu!');
      }
      return;
    }

    await groceryService.addIngredients([
      {
        name: addName.trim(),
        quantity: addQty.trim() || null,
        category: addCategory,
        checked: false,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160',
      },
    ]);

    setAddName('');
    setAddQty('');
    setShowAddModal(false);
    await loadCartItems();
  };

  const groupedKeys =
    displayMode === 'category'
      ? Array.from(new Set(items.map((i) => i.category || 'Ngũ cốc')))
      : Array.from(new Set(items.map((i) => i.recipe_name || 'Tự thêm')));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* TOP HEADER MATCHING SCREENSHOT */}
      <View style={styles.headerRow}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.headerCircleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={20} color="#10294B" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.headerTitle}>Giỏ đi chợ của bạn!</Text>

        {/* Right Action Icons */}
        <View style={styles.headerRightActions}>
          {/* Share button */}
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={handleShareList}
            activeOpacity={0.8}
            accessibilityLabel="Chia sẻ danh sách đi chợ">
            <Ionicons name="paper-plane-outline" size={18} color="#10294B" />
          </TouchableOpacity>

          {/* Menu / More button */}
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={() => setShowOptionsMenu((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityLabel="Tùy chọn">
            <MaterialCommunityIcons name="dots-grid" size={20} color="#10294B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Dropdown Menu */}
      {showOptionsMenu && (
        <View style={styles.optionsDropdown}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              setDisplayMode((prev) => (prev === 'category' ? 'recipe' : 'category'));
              setShowOptionsMenu(false);
            }}>
            <Ionicons name="swap-horizontal" size={18} color="#10294B" />
            <Text style={styles.optionItemText}>
              Đổi chế độ: {displayMode === 'category' ? 'Theo món ăn' : 'Theo nhóm nguyên liệu'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={handleClearCompleted}>
            <Ionicons name="checkmark-done" size={18} color="#059669" />
            <Text style={styles.optionItemText}>Dọn các món đã mua</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.optionItemText, { color: '#EF4444' }]}>Xóa toàn bộ giỏ</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* "+ Thêm nguyên liệu" White Pill Button matching screenshot */}
        <TouchableOpacity
          style={styles.addPillButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}>
          <Ionicons name="add-circle" size={20} color="#10294B" style={styles.addIcon} />
          <Text style={styles.addPillButtonText}>Thêm nguyên liệu</Text>
        </TouchableOpacity>

        {/* "Hiển thị theo: [Nhóm nguyên liệu]" Row matching screenshot */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Hiển thị theo:</Text>

          <TouchableOpacity
            style={styles.filterSelectorPill}
            onPress={() =>
              setDisplayMode((prev) => (prev === 'category' ? 'recipe' : 'category'))
            }
            activeOpacity={0.8}>
            <Text style={styles.filterSelectorText}>
              {displayMode === 'category' ? 'Nhóm nguyên liệu' : 'Theo món ăn'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grouped Ingredients Sections matching screenshot */}
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Giỏ đi chợ của bạn đang trống</Text>
            <Text style={styles.emptySubtitle}>
              Bấm nút "+ Thêm nguyên liệu" ở trên để thêm đồ cần mua!
            </Text>
          </View>
        ) : (
          groupedKeys.map((groupKey) => {
            const groupItems = items.filter((it) =>
              displayMode === 'category'
                ? (it.category || 'Ngũ cốc') === groupKey
                : (it.recipe_name || 'Tự thêm') === groupKey
            );

            if (groupItems.length === 0) return null;

            return (
              <View key={groupKey} style={styles.groupSection}>
                {/* Category Title matching "Ngũ cốc" in screenshot */}
                <Text style={styles.groupHeading}>{groupKey}</Text>

                {/* List of Item Cards in this group */}
                <View style={styles.cardsList}>
                  {groupItems.map((item) => {
                    const circleBg =
                      CATEGORY_COLORS[item.category || 'Ngũ cốc'] || '#FFEDD5';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.ingredientCard,
                          item.checked && styles.ingredientCardChecked,
                        ]}
                        onPress={() => handleToggle(item.id)}
                        activeOpacity={0.85}>
                        {/* Circular pastel badge with food thumbnail */}
                        <View
                          style={[
                            styles.foodCircleBadge,
                            { backgroundColor: circleBg },
                          ]}>
                          {item.image_url ? (
                            <Image
                              source={{ uri: item.image_url }}
                              style={styles.foodThumbImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons name="nutrition" size={24} color="#EA580C" />
                          )}
                        </View>

                        {/* Food Name & Quantity matching screenshot */}
                        <View style={styles.foodInfo}>
                          <Text
                            style={[
                              styles.foodTitle,
                              item.checked && styles.foodTitleChecked,
                            ]}
                            numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.foodQty}>
                            {item.quantity ? `${item.quantity} ` : ''}
                            {item.unit || ''}
                          </Text>
                        </View>

                        {/* Checked indicator / Delete */}
                        {item.checked ? (
                          <View style={styles.checkedBadge}>
                            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(item.id)}
                            activeOpacity={0.7}>
                            <Ionicons name="close" size={18} color="#94A3B8" />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ADD INGREDIENT MODAL */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.addModalBox}>
            <Text style={styles.addModalTitle}>Thêm nguyên liệu vào giỏ</Text>

            <Text style={styles.inputLabel}>Tên nguyên liệu *</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="VD: Bánh đa nem, Sữa chua, Trứng gà..."
              placeholderTextColor="#94A3B8"
              value={addName}
              onChangeText={setAddName}
              autoFocus
            />

            <Text style={styles.inputLabel}>Số lượng & Đơn vị</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="VD: 100 g, 2 quả, 1 hộp..."
              placeholderTextColor="#94A3B8"
              value={addQty}
              onChangeText={setAddQty}
            />

            <Text style={styles.inputLabel}>Nhóm thực phẩm</Text>
            <View style={styles.categoryChipsRow}>
              {['Ngũ cốc', 'Cá và hải sản', 'Chất béo', 'Củ', 'Rau và gia vị', 'Thịt'].map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      addCategory === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setAddCategory(cat)}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        addCategory === cat && styles.categoryChipTextActive,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveNewItem}>
                <Text style={styles.modalSubmitBtnText}>Thêm vào giỏ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10294B',
    flex: 1,
    marginLeft: 14,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionsDropdown: {
    position: 'absolute',
    top: 65,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10294B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // "+ Thêm nguyên liệu" Pill Button matching screenshot
  addPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 26,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  addIcon: {
    marginRight: 2,
  },
  addPillButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10294B',
  },

  // "Hiển thị theo:" Row matching screenshot
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14.5,
    color: '#64748B',
    fontWeight: '500',
  },
  filterSelectorPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  filterSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },

  // Group Heading matching "Ngũ cốc"
  groupSection: {
    marginBottom: 22,
  },
  groupHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 12,
  },
  cardsList: {
    gap: 12,
  },

  // Ingredient Card matching screenshot
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ingredientCardChecked: {
    opacity: 0.65,
    backgroundColor: '#FAFAFC',
  },
  foodCircleBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  foodThumbImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 4,
  },
  foodTitleChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  foodQty: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  checkedBadge: {
    padding: 4,
  },
  deleteBtn: {
    padding: 8,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10294B',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  addModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10294B',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#10294B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  categoryChipActive: {
    backgroundColor: '#10294B',
  },
  categoryChipText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#49C99B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#49C99B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
