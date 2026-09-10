import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: number | string | null;
  unit?: string | null;
  category: string;
  image_url?: string;
  checked: boolean;
  recipe_name?: string;
  added_at: string;
}

const GROCERY_STORAGE_KEY = '@nutrition_app:grocery_cart';

export const groceryService = {
  /**
   * Get all items in grocery cart
   */
  async getGroceryItems(): Promise<GroceryItem[]> {
    try {
      const json = await AsyncStorage.getItem(GROCERY_STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.warn('Error reading grocery cart:', error);
      return [];
    }
  },

  /**
   * Add multiple ingredients to grocery cart
   */
  async addIngredients(items: Omit<GroceryItem, 'id' | 'added_at'>[]): Promise<GroceryItem[]> {
    try {
      const existing = await this.getGroceryItems();
      const newItems: GroceryItem[] = items.map((item, index) => ({
        ...item,
        id: `grocery-${Date.now()}-${index}`,
        added_at: new Date().toISOString(),
      }));

      const combined = [...existing, ...newItems];
      await AsyncStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    } catch (error) {
      console.warn('Error adding items to grocery cart:', error);
      return [];
    }
  },

  /**
   * Toggle item checked status
   */
  async toggleItem(id: string): Promise<GroceryItem[]> {
    try {
      const existing = await this.getGroceryItems();
      const updated = existing.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      await AsyncStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.warn('Error toggling grocery item:', error);
      return [];
    }
  },

  /**
   * Remove item from grocery cart
   */
  async removeItem(id: string): Promise<GroceryItem[]> {
    try {
      const existing = await this.getGroceryItems();
      const updated = existing.filter((item) => item.id !== id);
      await AsyncStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.warn('Error removing grocery item:', error);
      return [];
    }
  },

  /**
   * Clear all items in grocery cart
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GROCERY_STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing grocery cart:', error);
    }
  },
};
