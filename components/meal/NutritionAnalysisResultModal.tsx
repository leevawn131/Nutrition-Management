import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AIRecognitionResult, MealType, DishItem, DishIngredient, MicronutrientInfo } from '@/types/meal.types';
import { foodService } from '@/services/food.service';
import { FoodItem } from '@/types/food.types';

export const calculateIngredientMicronutrients = (ingName: string, portionG: number): MicronutrientInfo => {
  const nameLower = (ingName || '').toLowerCase();
  const ratio = portionG / 100;

  let baseFiber = 1.2;
  let baseSodium = 350;
  let basePotassium = 220;
  let baseCalcium = 25;
  let baseIron = 1.2;
  let baseVitA = 40;
  let baseVitC = 8;
  let baseVitD = 0.2;
  let baseZinc = 0.8;

  if (
    nameLower.includes('rau') ||
    nameLower.includes('củ') ||
    nameLower.includes('canh') ||
    nameLower.includes('xào') ||
    nameLower.includes('salad') ||
    nameLower.includes('nộm') ||
    nameLower.includes('cải') ||
    nameLower.includes('cà rốt') ||
    nameLower.includes('cà chua')
  ) {
    baseFiber = 2.8;
    baseVitC = 25;
    baseVitA = 180;
    basePotassium = 320;
    baseCalcium = 45;
  }

  if (
    nameLower.includes('thịt') ||
    nameLower.includes('bò') ||
    nameLower.includes('lợn') ||
    nameLower.includes('gà') ||
    nameLower.includes('sườn') ||
    nameLower.includes('heo')
  ) {
    baseIron = 2.5;
    baseZinc = 3.2;
    basePotassium = 280;
    baseSodium = 420;
    baseVitD = 0.4;
  }

  if (
    nameLower.includes('cá') ||
    nameLower.includes('tôm') ||
    nameLower.includes('hải sản') ||
    nameLower.includes('mực') ||
    nameLower.includes('cua') ||
    nameLower.includes('ngao') ||
    nameLower.includes('sò')
  ) {
    baseVitD = 2.5;
    baseCalcium = 65;
    baseZinc = 2.1;
    baseSodium = 480;
    baseVitA = 60;
  }

  if (nameLower.includes('trứng') || nameLower.includes('opla')) {
    baseVitA = 140;
    baseVitD = 1.8;
    baseCalcium = 50;
    baseIron = 1.8;
  }

  if (nameLower.includes('nấm')) {
    baseVitD = 3.5;
    basePotassium = 350;
    baseFiber = 2.2;
  }

  return {
    fiber_g: Number((baseFiber * ratio).toFixed(1)),
    sodium_mg: Math.round(baseSodium * ratio),
    potassium_mg: Math.round(basePotassium * ratio),
    calcium_mg: Math.round(baseCalcium * ratio),
    iron_mg: Number((baseIron * ratio).toFixed(1)),
    vitamin_a_mcg: Math.round(baseVitA * ratio),
    vitamin_c_mg: Math.round(baseVitC * ratio),
    vitamin_d_mcg: Number((baseVitD * ratio).toFixed(1)),
    zinc_mg: Number((baseZinc * ratio).toFixed(1)),
  };
};

export const calculateDishMicronutrients = (
  dish: DishItem,
  scale: number = 1.0,
  dIdx?: number,
  excludedIngKeys: string[] = []
) => {
  let fiberG = 0;
  let sodiumMg = 0;
  let potassiumMg = 0;
  let calciumMg = 0;
  let ironMg = 0;
  let vitAMcg = 0;
  let vitCMg = 0;
  let vitDMcg = 0;
  let zincMg = 0;

  const activeIngs = (dish.ingredients || []).filter((_, iIdx) => {
    if (dIdx !== undefined) {
      return !excludedIngKeys.includes(`${dIdx}_${iIdx}`);
    }
    return true;
  });

  if (activeIngs.length > 0) {
    activeIngs.forEach(ing => {
      const ingPortion = (ing.portion_g || ing.estimated_weight_g || 50) * scale;
      if (ing.micronutrients) {
        const ratio = ingPortion / (ing.portion_g || 50);
        fiberG += (ing.micronutrients.fiber_g || 0) * ratio;
        sodiumMg += (ing.micronutrients.sodium_mg || 0) * ratio;
        potassiumMg += (ing.micronutrients.potassium_mg || 0) * ratio;
        calciumMg += (ing.micronutrients.calcium_mg || 0) * ratio;
        ironMg += (ing.micronutrients.iron_mg || 0) * ratio;
        vitAMcg += (ing.micronutrients.vitamin_a_mcg || 0) * ratio;
        vitCMg += (ing.micronutrients.vitamin_c_mg || 0) * ratio;
        vitDMcg += (ing.micronutrients.vitamin_d_mcg || 0) * ratio;
        zincMg += (ing.micronutrients.zinc_mg || 0) * ratio;
      } else {
        const ingMicro = calculateIngredientMicronutrients(ing.name, ingPortion);
        fiberG += ingMicro.fiber_g || 0;
        sodiumMg += ingMicro.sodium_mg || 0;
        potassiumMg += ingMicro.potassium_mg || 0;
        calciumMg += ingMicro.calcium_mg || 0;
        ironMg += ingMicro.iron_mg || 0;
        vitAMcg += ingMicro.vitamin_a_mcg || 0;
        vitCMg += ingMicro.vitamin_c_mg || 0;
        vitDMcg += ingMicro.vitamin_d_mcg || 0;
        zincMg += ingMicro.zinc_mg || 0;
      }
    });
  } else {
    const dishPortion = (dish.estimated_weight_g || 150) * scale;
    const dishMicro = calculateIngredientMicronutrients(dish.name, dishPortion);
    fiberG = dishMicro.fiber_g || 0;
    sodiumMg = dishMicro.sodium_mg || 0;
    potassiumMg = dishMicro.potassium_mg || 0;
    calciumMg = dishMicro.calcium_mg || 0;
    ironMg = dishMicro.iron_mg || 0;
    vitAMcg = dishMicro.vitamin_a_mcg || 0;
    vitCMg = dishMicro.vitamin_c_mg || 0;
    vitDMcg = dishMicro.vitamin_d_mcg || 0;
    zincMg = dishMicro.zinc_mg || 0;
  }

  return {
    fiberG: Number(fiberG.toFixed(1)),
    sodiumMg: Math.round(sodiumMg),
    potassiumMg: Math.round(potassiumMg),
    calciumMg: Math.round(calciumMg),
    ironMg: Number(ironMg.toFixed(1)),
    vitAMcg: Math.round(vitAMcg),
    vitCMg: Math.round(vitCMg),
    vitDMcg: Number(vitDMcg.toFixed(1)),
    zincMg: Number(zincMg.toFixed(1)),
  };
};

interface NutritionAnalysisResultModalProps {
  visible: boolean;
  imageUri?: string | null;
  result?: AIRecognitionResult | null;
  onClose: () => void;
  onConfirmSave: (data: {
    food_name: string;
    portion_grams: number;
    calories: number;
    protein_g: number;
    carb_g: number;
    fat_g: number;
    meal_type: MealType;
    recognition_id?: string;
    logged_at?: string;
  }) => void;
}

export const NutritionAnalysisResultModal: React.FC<NutritionAnalysisResultModalProps> = ({
  visible,
  imageUri,
  result,
  onClose,
  onConfirmSave,
}) => {
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [manualDateStr, setManualDateStr] = useState<string>('');
  const [manualTimeStr, setManualTimeStr] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [editedFoodName, setEditedFoodName] = useState('');
  const [editedPortionGrams, setEditedPortionGrams] = useState(200);
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Hierarchical Dishes & Ingredients state
  const [dishesList, setDishesList] = useState<DishItem[]>([]);
  const [excludedDishIndexes, setExcludedDishIndexes] = useState<number[]>([]);
  const [excludedIngKeys, setExcludedIngKeys] = useState<string[]>([]);
  const [targetDishIndex, setTargetDishIndex] = useState<number>(0);

  // Full ingredients list modal & inline expansion state
  const [showFullIngredientsModal, setShowFullIngredientsModal] = useState<boolean>(false);
  const [expandedIngKeys, setExpandedIngKeys] = useState<string[]>([]);
  const [expandedDishMicroIndexes, setExpandedDishMicroIndexes] = useState<number[]>([]);

  const toggleExpandIngName = (dIdx: number, iIdx: number) => {
    const key = `${dIdx}_${iIdx}`;
    setExpandedIngKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleExpandDishMicro = (dIdx: number) => {
    setExpandedDishMicroIndexes(prev =>
      prev.includes(dIdx) ? prev.filter(i => i !== dIdx) : [...prev, dIdx]
    );
  };

  // Interactive 1-Touch controls for real-world edge cases
  const [icePercentage, setIcePercentage] = useState<number>(0);
  const [eatenRatio, setEatenRatio] = useState<number>(1.0);
  const [deductBones, setDeductBones] = useState<boolean>(false);

  // Date picker state
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0); // 0 = Hôm nay, -1 = Hôm qua, -2 = 2 ngày trước

  // Add custom ingredient modal state
  const [showAddIngModal, setShowAddIngModal] = useState<boolean>(false);
  const [newIngName, setNewIngName] = useState<string>('');
  const [newIngWeight, setNewIngWeight] = useState<string>('50');
  const [newIngCal, setNewIngCal] = useState<string>('');

  // Database ingredients search state
  const [dbSearchResults, setDbSearchResults] = useState<FoodItem[]>([]);
  const [selectedDbFood, setSelectedDbFood] = useState<FoodItem | null>(null);
  const [isSearchingDb, setIsSearchingDb] = useState<boolean>(false);

  useEffect(() => {
    if (!showAddIngModal) return;
    let isMounted = true;
    setIsSearchingDb(true);
    foodService
      .searchFoods(newIngName, 'ingredient', 1, 10)
      .then(res => {
        if (isMounted && res && res.data) {
          setDbSearchResults(res.data);
        }
      })
      .catch(err => {
        console.log('Lỗi tìm kiếm nguyên liệu DB:', err);
      })
      .finally(() => {
        if (isMounted) setIsSearchingDb(false);
      });
    return () => {
      isMounted = false;
    };
  }, [showAddIngModal, newIngName]);

  useEffect(() => {
    if (result) {
      setEditedFoodName(result.food_name || 'Bữa ăn');
      setEditedPortionGrams(result.estimated_weight_g || 200);
      
      let initialDishes: DishItem[] = [];
      if (result.dishes && result.dishes.length > 0) {
        initialDishes = result.dishes;
      } else {
        initialDishes = [
          {
            id: 'dish_0',
            name: result.food_name || 'Món ăn',
            estimated_weight_g: result.estimated_weight_g || 200,
            calories: result.calories || 0,
            protein_g: result.protein_g || 0,
            carb_g: result.carb_g || 0,
            fat_g: result.fat_g || 0,
            ingredients: result.ingredients || [],
          },
        ];
      }
      setDishesList(initialDishes);
      setIcePercentage(result.is_beverage ? 50 : 0);
      setDeductBones(Boolean(result.has_bones));
      setEatenRatio(1.0);
      setExcludedDishIndexes([]);
      setExcludedIngKeys([]);
      setSelectedDateOffset(0);
    }
  }, [result, visible]);

  useEffect(() => {
    if (visible) {
      const now = new Date();
      now.setDate(now.getDate() + selectedDateOffset);
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');

      setManualDateStr(`${yyyy}-${mm}-${dd}`);
      setManualTimeStr(`${hh}:${min}`);

      // Auto select meal type based on hour
      const hour = now.getHours();
      if (hour >= 5 && hour < 11) setMealType('breakfast');
      else if (hour >= 11 && hour < 15) setMealType('lunch');
      else if (hour >= 15 && hour < 21) setMealType('dinner');
      else setMealType('snack');
    }
  }, [visible]);

  if (!visible || !result) return null;

  // Base portion scale
  const baseWeight = result.estimated_weight_g || 200;
  const portionScale = editedPortionGrams > 0 && baseWeight > 0 ? editedPortionGrams / baseWeight : 1;

  // Real-world edge case multipliers
  const iceScale = result.is_beverage || icePercentage > 0 ? Math.max(0.2, (100 - icePercentage) / 50) : 1;
  const boneScale = deductBones ? 0.7 : 1.0;
  const eatenScale = eatenRatio;

  const totalScale = portionScale * iceScale * boneScale * eatenScale;

  // Dynamically calculate total nutrition across all active dishes & active ingredients
  let calories = 0;
  let proteinG = 0;
  let carbG = 0;
  let fatG = 0;

  dishesList.forEach((dish, dIdx) => {
    if (excludedDishIndexes.includes(dIdx)) return;

    const activeIngs = (dish.ingredients || []).filter(
      (_, iIdx) => !excludedIngKeys.includes(`${dIdx}_${iIdx}`)
    );

    if (activeIngs.length > 0) {
      activeIngs.forEach(ing => {
        calories += Math.round((ing.calories || 0) * totalScale);
        proteinG += Math.round((ing.protein_g || 0) * totalScale);
        carbG += Math.round((ing.carb_g || 0) * totalScale);
        fatG += Math.round((ing.fat_g || 0) * totalScale);
      });
    } else {
      calories += Math.round((dish.calories || 0) * totalScale);
      proteinG += Math.round((dish.protein_g || 0) * totalScale);
      carbG += Math.round((dish.carb_g || 0) * totalScale);
      fatG += Math.round((dish.fat_g || 0) * totalScale);
    }
  });

  const totalMacroG = proteinG + carbG + fatG || 1;
  const carbPct = Math.round((carbG / totalMacroG) * 100);
  const proteinPct = Math.round((proteinG / totalMacroG) * 100);
  const fatPct = Math.round((fatG / totalMacroG) * 100);

  const rawGL = result.glycemic_load !== undefined && result.glycemic_load !== null
    ? result.glycemic_load
    : ((carbG || 0) * 55) / 100;
  const glycemicLoad = Math.round(rawGL * totalScale * 10) / 10;
  const glPositionPct = Math.min(100, Math.max(0, (glycemicLoad / 30) * 100));

  const isLowConfidence = (result.confidence || 1) < 0.6;
  const warningMsg = result.quality_warning || (isLowConfidence ? 'Ảnh có thể thiếu ánh sáng hoặc mờ. Vui lòng kiểm tra lại định lượng.' : '');

  const handleAdjustPortion = (deltaGrams: number) => {
    setEditedPortionGrams(prev => Math.max(20, prev + deltaGrams));
  };

  // Adjust individual ingredient portion weight (g) inside a specific dish
  const handleAdjustIngredientWeight = (dIdx: number, iIdx: number, deltaGrams: number) => {
    setDishesList(prev =>
      prev.map((dish, dIndex) => {
        if (dIndex === dIdx) {
          const updatedIngs = dish.ingredients.map((ing, iIndex) => {
            if (iIndex === iIdx) {
              const currentPortion = ing.portion_g || ing.estimated_weight_g || 50;
              const newPortion = Math.max(5, currentPortion + deltaGrams);
              const ratio = currentPortion > 0 ? newPortion / currentPortion : 1;
              return {
                ...ing,
                portion_g: newPortion,
                calories: Math.round((ing.calories || 0) * ratio),
                protein_g: Number(((ing.protein_g || 0) * ratio).toFixed(1)),
                carb_g: Number(((ing.carb_g || 0) * ratio).toFixed(1)),
                fat_g: Number(((ing.fat_g || 0) * ratio).toFixed(1)),
              };
            }
            return ing;
          });
          return { ...dish, ingredients: updatedIngs };
        }
        return dish;
      })
    );
  };

  const setShortcutDate = (offsetDays: number) => {
    setSelectedDateOffset(offsetDays);
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setManualDateStr(`${yyyy}-${mm}-${dd}`);
  };

  const adjustTimeMinutes = (deltaMinutes: number) => {
    let [h, m] = manualTimeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) {
      const now = new Date();
      h = now.getHours();
      m = now.getMinutes();
    }
    let totalMinutes = h * 60 + m + deltaMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    totalMinutes = totalMinutes % (24 * 60);

    const newH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const newM = String(totalMinutes % 60).padStart(2, '0');
    setManualTimeStr(`${newH}:${newM}`);
  };

  const setCurrentTimeNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    setManualTimeStr(`${hh}:${min}`);
  };

  const toggleExcludeDish = (dIdx: number) => {
    setExcludedDishIndexes(prev =>
      prev.includes(dIdx) ? prev.filter(i => i !== dIdx) : [...prev, dIdx]
    );
  };

  const handleAdjustDishWeight = (dIdx: number, deltaGrams: number) => {
    setDishesList(prev =>
      prev.map((dish, i) => {
        if (i === dIdx) {
          const currentWeight = dish.estimated_weight_g || 150;
          const newWeight = Math.max(20, currentWeight + deltaGrams);
          const ratio = currentWeight > 0 ? newWeight / currentWeight : 1;
          const updatedIngredients = (dish.ingredients || []).map(ing => {
            const ingPortion = ing.portion_g || ing.estimated_weight_g || 50;
            const newIngPortion = Math.max(5, Math.round(ingPortion * ratio));
            return {
              ...ing,
              portion_g: newIngPortion,
              calories: Math.round((ing.calories || 0) * ratio),
              protein_g: Number(((ing.protein_g || 0) * ratio).toFixed(1)),
              carb_g: Number(((ing.carb_g || 0) * ratio).toFixed(1)),
              fat_g: Number(((ing.fat_g || 0) * ratio).toFixed(1)),
            };
          });
          return {
            ...dish,
            estimated_weight_g: newWeight,
            calories: Math.round((dish.calories || 0) * ratio),
            protein_g: Number(((dish.protein_g || 0) * ratio).toFixed(1)),
            carb_g: Number(((dish.carb_g || 0) * ratio).toFixed(1)),
            fat_g: Number(((dish.fat_g || 0) * ratio).toFixed(1)),
            ingredients: updatedIngredients,
          };
        }
        return dish;
      })
    );
  };

  const toggleExcludeIngredient = (dIdx: number, iIdx: number) => {
    const key = `${dIdx}_${iIdx}`;
    setExcludedIngKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectDbIngredient = (food: FoodItem) => {
    setSelectedDbFood(food);
    setNewIngName(food.name);
    const weightG = parseInt(newIngWeight) || 50;
    const computedCal = Math.round((food.calories_per_100g * weightG) / 100);
    setNewIngCal(computedCal.toString());
  };

  const handleAddCustomIngredient = () => {
    if (!newIngName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng chọn hoặc nhập tên nguyên liệu');
      return;
    }
    const weightG = Math.max(5, parseInt(newIngWeight) || 50);
    let cal = parseInt(newIngCal);
    let proteinG = 0;
    let carbG = 0;
    let fatG = 0;

    if (selectedDbFood && selectedDbFood.name === newIngName.trim()) {
      cal = Math.round((selectedDbFood.calories_per_100g * weightG) / 100);
      proteinG = Number((((selectedDbFood.protein_per_100g || 0) * weightG) / 100).toFixed(1));
      carbG = Number((((selectedDbFood.carb_per_100g || 0) * weightG) / 100).toFixed(1));
      fatG = Number((((selectedDbFood.fat_per_100g || 0) * weightG) / 100).toFixed(1));
    } else {
      if (isNaN(cal) || cal <= 0) {
        cal = Math.round(weightG * 1.5);
      }
      proteinG = Number(((cal * 0.15) / 4).toFixed(1));
      carbG = Number(((cal * 0.50) / 4).toFixed(1));
      fatG = Number(((cal * 0.35) / 9).toFixed(1));
    }

    const newIng = {
      food_item_id: selectedDbFood?._id,
      name: newIngName.trim(),
      portion_g: weightG,
      calories: cal,
      protein_g: proteinG,
      carb_g: carbG,
      fat_g: fatG,
      source: 'user_added' as const,
    };

    setDishesList(prev =>
      prev.map((dish, dIndex) => {
        if (dIndex === targetDishIndex) {
          return {
            ...dish,
            ingredients: [...(dish.ingredients || []), newIng],
          };
        }
        return dish;
      })
    );

    setNewIngName('');
    setNewIngWeight('50');
    setNewIngCal('');
    setSelectedDbFood(null);
    setShowAddIngModal(false);
  };

  const generatePresetIngredientsForDish = (foodName: string, portionG: number): DishIngredient[] => {
    const nameLower = foodName.toLowerCase();

    if (
      nameLower.includes('cacao') ||
      nameLower.includes('cocoa') ||
      nameLower.includes('chocolate') ||
      nameLower.includes('socola')
    ) {
      return [
        {
          name: 'Bột cacao nguyên chất',
          portion_g: Math.max(10, Math.round(portionG * 0.15)),
          calories: 90,
          protein_g: 4.5,
          carb_g: 12,
          fat_g: 3.0,
          micronutrients: calculateIngredientMicronutrients('Bột cacao nguyên chất', Math.max(10, Math.round(portionG * 0.15))),
          source: 'inferred',
        },
        {
          name: 'Sữa tươi đánh nóng',
          portion_g: Math.max(50, Math.round(portionG * 0.65)),
          calories: 85,
          protein_g: 4.2,
          carb_g: 6.5,
          fat_g: 4.5,
          micronutrients: calculateIngredientMicronutrients('Sữa tươi đánh nóng', Math.max(50, Math.round(portionG * 0.65))),
          source: 'inferred',
        },
        {
          name: 'Sữa đặc / Đường',
          portion_g: Math.max(15, Math.round(portionG * 0.2)),
          calories: 65,
          protein_g: 1.0,
          carb_g: 15,
          fat_g: 0.5,
          micronutrients: calculateIngredientMicronutrients('Sữa đặc / Đường', Math.max(15, Math.round(portionG * 0.2))),
          source: 'inferred',
        },
      ];
    }

    if (nameLower.includes('bạc xỉu') || nameLower.includes('bac xiu')) {
      return [
        {
          name: 'Sữa đặc có đường',
          portion_g: Math.max(20, Math.round(portionG * 0.25)),
          calories: 120,
          protein_g: 2.5,
          carb_g: 20,
          fat_g: 3.2,
          micronutrients: calculateIngredientMicronutrients('Sữa đặc có đường', Math.max(20, Math.round(portionG * 0.25))),
          source: 'inferred',
        },
        {
          name: 'Sữa tươi thanh trùng',
          portion_g: Math.max(50, Math.round(portionG * 0.55)),
          calories: 70,
          protein_g: 3.5,
          carb_g: 5.5,
          fat_g: 3.8,
          micronutrients: calculateIngredientMicronutrients('Sữa tươi thanh trùng', Math.max(50, Math.round(portionG * 0.55))),
          source: 'inferred',
        },
        {
          name: 'Cà phê nguyên chất',
          portion_g: Math.max(20, Math.round(portionG * 0.2)),
          calories: 10,
          protein_g: 0.5,
          carb_g: 1.2,
          fat_g: 0.1,
          micronutrients: calculateIngredientMicronutrients('Cà phê nguyên chất', Math.max(20, Math.round(portionG * 0.2))),
          source: 'inferred',
        },
      ];
    }

    if (nameLower.includes('cappuccino') || nameLower.includes('latte') || nameLower.includes('espresso')) {
      return [
        {
          name: 'Cà phê Espresso',
          portion_g: Math.max(20, Math.round(portionG * 0.25)),
          calories: 10,
          protein_g: 0.6,
          carb_g: 1.5,
          fat_g: 0.1,
          micronutrients: calculateIngredientMicronutrients('Cà phê Espresso', Math.max(20, Math.round(portionG * 0.25))),
          source: 'inferred',
        },
        {
          name: 'Sữa tươi đánh bọt',
          portion_g: Math.max(60, Math.round(portionG * 0.6)),
          calories: 75,
          protein_g: 4.0,
          carb_g: 6.0,
          fat_g: 3.8,
          micronutrients: calculateIngredientMicronutrients('Sữa tươi đánh bọt', Math.max(60, Math.round(portionG * 0.6))),
          source: 'inferred',
        },
        {
          name: 'Bọt sữa & Đường nhẹ',
          portion_g: Math.max(10, Math.round(portionG * 0.15)),
          calories: 35,
          protein_g: 0.5,
          carb_g: 8.0,
          fat_g: 0.2,
          micronutrients: calculateIngredientMicronutrients('Bọt sữa & Đường nhẹ', Math.max(10, Math.round(portionG * 0.15))),
          source: 'inferred',
        },
      ];
    }

    if (nameLower.includes('trà sữa') || nameLower.includes('milk tea')) {
      return [
        {
          name: 'Cốt trà đen / Oolong',
          portion_g: Math.max(50, Math.round(portionG * 0.5)),
          calories: 15,
          protein_g: 0.5,
          carb_g: 3.0,
          fat_g: 0.1,
          micronutrients: calculateIngredientMicronutrients('Cốt trà đen / Oolong', Math.max(50, Math.round(portionG * 0.5))),
          source: 'inferred',
        },
        {
          name: 'Bột béo / Sữa tươi',
          portion_g: Math.max(30, Math.round(portionG * 0.3)),
          calories: 140,
          protein_g: 2.0,
          carb_g: 12.0,
          fat_g: 9.5,
          micronutrients: calculateIngredientMicronutrients('Bột béo / Sữa tươi', Math.max(30, Math.round(portionG * 0.3))),
          source: 'inferred',
        },
        {
          name: 'Trân châu / Topping',
          portion_g: Math.max(20, Math.round(portionG * 0.2)),
          calories: 90,
          protein_g: 0.3,
          carb_g: 22.0,
          fat_g: 0.1,
          micronutrients: calculateIngredientMicronutrients('Trân châu / Topping', Math.max(20, Math.round(portionG * 0.2))),
          source: 'inferred',
        },
      ];
    }

    return [
      {
        name: `${foodName} (Thành phần chính)`,
        portion_g: Math.max(50, Math.round(portionG * 0.8)),
        calories: 160,
        protein_g: 5.0,
        carb_g: 20.0,
        fat_g: 6.0,
        micronutrients: calculateIngredientMicronutrients(foodName, Math.max(50, Math.round(portionG * 0.8))),
        source: 'inferred',
      },
      {
        name: 'Gia vị & Phụ gia kèm theo',
        portion_g: Math.max(10, Math.round(portionG * 0.2)),
        calories: 40,
        protein_g: 1.0,
        carb_g: 5.0,
        fat_g: 2.0,
        micronutrients: calculateIngredientMicronutrients('Gia vị', Math.max(10, Math.round(portionG * 0.2))),
        source: 'inferred',
      },
    ];
  };

  const handleSelectAlternativeDish = (altName: string) => {
    setEditedFoodName(altName);

    setDishesList(prev => {
      if (!prev || prev.length === 0) {
        return [
          {
            id: 'dish_0',
            name: altName,
            estimated_weight_g: editedPortionGrams || 200,
            ingredients: generatePresetIngredientsForDish(altName, editedPortionGrams || 200),
          },
        ];
      }

      const updated = [...prev];
      const targetWeight = updated[0].estimated_weight_g || editedPortionGrams || 200;
      const newIngredients = generatePresetIngredientsForDish(altName, targetWeight);

      updated[0] = {
        ...updated[0],
        name: altName,
        ingredients: newIngredients,
      };
      return updated;
    });
  };

  const handleAddNewDish = () => {
    const newDish: DishItem = {
      id: `dish_${dishesList.length}_${Date.now()}`,
      name: `Món ăn ${dishesList.length + 1}`,
      estimated_weight_g: 150,
      calories: 200,
      protein_g: 10,
      carb_g: 20,
      fat_g: 8,
      ingredients: [],
    };
    setDishesList(prev => [...prev, newDish]);
  };

  const handleSave = () => {
    let loggedAtISO: string | undefined = undefined;
    if (manualDateStr.trim() && manualTimeStr.trim()) {
      try {
        const [year, month, day] = manualDateStr.trim().split('-').map(Number);
        const [hour, minute] = manualTimeStr.trim().split(':').map(Number);
        if (year && month && day && hour !== undefined && minute !== undefined) {
          const d = new Date(year, month - 1, day, hour, minute);
          if (!isNaN(d.getTime())) {
            loggedAtISO = d.toISOString();
          }
        }
      } catch (e) {
        console.log('Lỗi tạo ngày ghi nhận:', e);
      }
    }

    const totalDishWeightGrams = dishesList.reduce((sum, dish, idx) => {
      if (excludedDishIndexes.includes(idx)) return sum;
      return sum + (dish.estimated_weight_g || 150);
    }, 0);

    onConfirmSave({
      food_name: editedFoodName.trim() || result.food_name || 'Bữa ăn',
      portion_grams: Math.round((totalDishWeightGrams || editedPortionGrams) * boneScale * eatenScale),
      calories,
      protein_g: proteinG,
      carb_g: carbG,
      fat_g: fatG,
      meal_type: mealType,
      recognition_id: result.recognition_id,
      logged_at: loggedAtISO,
    });
  };

  const getMealTypeLabel = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return 'Bữa sáng';
      case 'lunch':
        return 'Bữa trưa';
      case 'dinner':
        return 'Bữa tối';
      case 'snack':
        return 'Bữa phụ';
      default:
        return 'Bữa ăn';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
            <Ionicons name="close" size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phân tích dinh dưỡng</Text>
          <TouchableOpacity style={styles.headerShareBtn}>
            <Ionicons name="paper-plane-outline" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Top Banner Image */}
          {imageUri ? (
            <View style={styles.bannerImageContainer}>
              <Image source={{ uri: imageUri }} style={styles.bannerImage} resizeMode="cover" />
            </View>
          ) : null}

          {/* Low Light / Quality Warning Banner */}
          {warningMsg ? (
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={20} color="#D97706" />
              <Text style={styles.warningText}>{warningMsg}</Text>
            </View>
          ) : null}

          {/* Section Title & Editable Dish Name */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Bữa ăn nhận diện:</Text>
            <TouchableOpacity onPress={() => setIsEditingName(!isEditingName)} style={styles.editIconBtn}>
              <Ionicons name="create-outline" size={18} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.dishNameContainer}>
            <Text style={styles.editableDishTitle}>{editedFoodName}</Text>
          </View>

          {/* 1-Touch Quick Controls for Real-world Edge Cases */}
          <View style={styles.edgeCaseControlsSection}>
            <Text style={styles.edgeCaseHeader}>Tùy chỉnh bối cảnh thực tế (1-Touch):</Text>

            {/* Eating State Selector (Món ăn dở) */}
            <View style={styles.edgeCaseRow}>
              <Text style={styles.edgeCaseLabel}>Trạng thái ăn:</Text>
              <View style={styles.buttonGroup}>
                {[
                  { label: 'Nguyên phần', ratio: 1.0 },
                  { label: 'Ăn 1/3', ratio: 0.7 },
                  { label: 'Ăn 1/2', ratio: 0.5 },
                  { label: 'Còn 1/3', ratio: 0.35 },
                ].map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.groupBtn, eatenRatio === opt.ratio && styles.groupBtnActive]}
                    onPress={() => setEatenRatio(opt.ratio)}
                  >
                    <Text style={[styles.groupBtnText, eatenRatio === opt.ratio && styles.groupBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ice Deduction for Beverage (Đồ uống có đá) */}
            {(result.is_beverage || icePercentage > 0) && (
              <View style={[styles.edgeCaseRow, { marginTop: 10 }]}>
                <Text style={styles.edgeCaseLabel}>Tỷ lệ đá lạnh:</Text>
                <View style={styles.buttonGroup}>
                  {[0, 30, 50, 70].map(pct => (
                    <TouchableOpacity
                      key={pct}
                      style={[styles.groupBtn, icePercentage === pct && styles.groupBtnActive]}
                      onPress={() => setIcePercentage(pct)}
                    >
                      <Text style={[styles.groupBtnText, icePercentage === pct && styles.groupBtnTextActive]}>
                        {pct === 0 ? 'Không đá' : `${pct}% đá`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Bone Deduction Toggle (Món có xương) */}
            <View style={[styles.edgeCaseRow, { marginTop: 10 }]}>
              <Text style={styles.edgeCaseLabel}>Phần bỏ đi / Xương:</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, deductBones && styles.toggleBtnActive]}
                onPress={() => setDeductBones(!deductBones)}
              >
                <Ionicons
                  name={deductBones ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={deductBones ? '#10B981' : '#64748B'}
                />
                <Text style={[styles.toggleBtnText, deductBones && styles.toggleBtnTextActive]}>
                  Trừ 30% trọng lượng xương
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Donut Macro Breakdown Card */}
          <View style={styles.macroCard}>
            {/* Donut Chart */}
            <View style={styles.donutContainer}>
              <View style={styles.donutOuter}>
                <View style={styles.donutInner}>
                  <Text style={styles.donutCalorieNum}>{calories}</Text>
                  <Text style={styles.donutCalorieLabel}>kCal</Text>
                </View>
              </View>
            </View>

            {/* Macro Stats Legend */}
            <View style={styles.macroLegendColumn}>
              {/* Carbs */}
              <View style={styles.macroLegendRow}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.macroName}>Tinh bột</Text>
                <Text style={styles.macroPct}>{carbPct}%</Text>
                <Text style={styles.macroGrams}>({carbG})g</Text>
              </View>

              {/* Protein */}
              <View style={styles.macroLegendRow}>
                <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.macroName}>Chất đạm</Text>
                <Text style={styles.macroPct}>{proteinPct}%</Text>
                <Text style={styles.macroGrams}>({proteinG})g</Text>
              </View>

              {/* Fat */}
              <View style={styles.macroLegendRow}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.macroName}>Chất béo</Text>
                <Text style={styles.macroPct}>{fatPct}%</Text>
                <Text style={styles.macroGrams}>({fatG})g</Text>
              </View>
            </View>
          </View>

          {/* Glycemic Load (GL) Gauge */}
          <View style={styles.glContainer}>
            <Text style={styles.glText}>
              Chỉ số tải đường huyết (Glycemic Load):{' '}
              <Text style={styles.glValue}>{glycemicLoad}</Text>
            </Text>

            {/* Scale Bar */}
            <View style={styles.glBarContainer}>
              <View style={styles.glBarBackground} />
              {/* Pointer indicator */}
              <View style={[styles.glPointer, { left: `${glPositionPct}%` }]}>
                <View style={styles.glPointerTriangle} />
              </View>
            </View>
            <View style={styles.glScaleLabels}>
              <Text style={styles.glScaleNum}>10</Text>
              <Text style={styles.glScaleNum}>20</Text>
            </View>
          </View>

          {/* Editable Date, Time & Meal Type Section */}
          <View style={styles.pickerSection}>
            <Text style={styles.pickerSectionHeader}>Chỉnh sửa thời gian & Loại bữa ăn:</Text>
            
            {/* 1. Meal Type Selector (Loại bữa) */}
            <Text style={styles.pickerSubLabel}>1. Loại bữa ăn:</Text>
            <View style={styles.mealTypeButtonGroup}>
              {[
                { type: 'breakfast' as MealType, label: 'Bữa sáng', icon: 'sunny-outline' },
                { type: 'lunch' as MealType, label: 'Bữa trưa', icon: 'restaurant-outline' },
                { type: 'dinner' as MealType, label: 'Bữa tối', icon: 'moon-outline' },
                { type: 'snack' as MealType, label: 'Bữa phụ', icon: 'cafe-outline' },
              ].map(item => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.mealTypeBtn,
                    mealType === item.type && styles.mealTypeBtnActive,
                  ]}
                  onPress={() => setMealType(item.type)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color={mealType === item.type ? '#FFFFFF' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.mealTypeBtnText,
                      mealType === item.type && styles.mealTypeBtnTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. Logged Date (Ngày ghi nhận) */}
            <Text style={[styles.pickerSubLabel, { marginTop: 14 }]}>2. Ngày ghi nhận (YYYY-MM-DD):</Text>
            <View style={styles.inputWithShortcutsRow}>
              <View style={styles.manualTextInputBox}>
                <Ionicons name="calendar-outline" size={18} color="#10B981" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.manualTextInput}
                  value={manualDateStr}
                  onChangeText={setManualDateStr}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutPillsRow}>
                {[
                  { label: 'Hôm nay', offset: 0 },
                  { label: 'Hôm qua', offset: -1 },
                  { label: '-2 ngày', offset: -2 },
                  { label: '-3 ngày', offset: -3 },
                ].map(sc => (
                  <TouchableOpacity
                    key={sc.offset}
                    style={[
                      styles.shortcutPill,
                      selectedDateOffset === sc.offset && styles.shortcutPillActive,
                    ]}
                    onPress={() => setShortcutDate(sc.offset)}
                  >
                    <Text
                      style={[
                        styles.shortcutPillText,
                        selectedDateOffset === sc.offset && styles.shortcutPillTextActive,
                      ]}
                    >
                      {sc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. Meal Time (Giờ ăn) */}
            <Text style={[styles.pickerSubLabel, { marginTop: 14 }]}>3. Giờ ăn (HH:mm):</Text>
            <View style={styles.inputWithShortcutsRow}>
              <View style={styles.manualTextInputBox}>
                <Ionicons name="time-outline" size={18} color="#10B981" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.manualTextInput}
                  value={manualTimeStr}
                  onChangeText={setManualTimeStr}
                  placeholder="HH:mm"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutPillsRow}>
                <TouchableOpacity style={styles.shortcutPill} onPress={setCurrentTimeNow}>
                  <Text style={styles.shortcutPillText}>Bây giờ</Text>
                </TouchableOpacity>
                {[-30, -15, 15, 30].map(mins => (
                  <TouchableOpacity
                    key={mins}
                    style={styles.shortcutPill}
                    onPress={() => adjustTimeMinutes(mins)}
                  >
                    <Text style={styles.shortcutPillText}>{mins > 0 ? `+${mins}p` : `${mins}p`}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Alternatives Candidate Badges (Level 3 Uncertain state) */}
          {result.alternatives && result.alternatives.length > 0 ? (
            <View style={styles.alternativesSection}>
              <Text style={styles.alternativesTitle}>Món ăn có thể là (Bấm để chọn món đúng):</Text>
              <View style={styles.alternativesRow}>
                {result.alternatives.map((alt, i) => {
                  const isSelected = editedFoodName.toLowerCase() === alt.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.altBadge, isSelected && styles.altBadgeActive]}
                      onPress={() => handleSelectAlternativeDish(alt.name)}
                    >
                      <Text style={[styles.altBadgeText, isSelected && styles.altBadgeTextActive]}>
                        {alt.name} ({Math.round(alt.confidence * 100)}%)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Detailed Multi-Dish Breakdown & Ingredients */}
          <View style={styles.dishesSectionHeaderRow}>
            <Text style={styles.ingredientsHeader}>
              Danh sách các món & Nguyên liệu ({dishesList.length} món):
            </Text>
            <TouchableOpacity style={styles.addDishHeaderBtn} onPress={handleAddNewDish}>
              <Ionicons name="add-circle" size={16} color="#10B981" />
              <Text style={styles.addDishHeaderBtnText}>Thêm món ăn mới</Text>
            </TouchableOpacity>
          </View>

          {dishesList.map((dish, dIdx) => {
            const isDishExcluded = excludedDishIndexes.includes(dIdx);

            const activeIngs = (dish.ingredients || []).filter(
              (_, iIdx) => !excludedIngKeys.includes(`${dIdx}_${iIdx}`)
            );

            let dishCal = 0;
            let dishWeight = 0;
            if (activeIngs.length > 0) {
              dishCal = Math.round(
                activeIngs.reduce((sum, ing) => sum + (ing.calories || 0), 0) * totalScale
              );
              dishWeight = Math.round(
                activeIngs.reduce(
                  (sum, ing) => sum + (ing.portion_g || ing.estimated_weight_g || 50),
                  0
                ) * totalScale
              );
            } else {
              dishCal = Math.round((dish.calories || 0) * totalScale);
              dishWeight = Math.round((dish.estimated_weight_g || 150) * totalScale);
            }

            return (
              <View
                key={dIdx}
                style={[
                  styles.dishCardContainer,
                  isDishExcluded && styles.dishCardContainerExcluded,
                ]}
              >
                {/* Dish Card Frame Header */}
                <View style={styles.dishFrameHeader}>
                  <View style={styles.dishBadge}>
                    <Text style={styles.dishBadgeText}>MÓN {dIdx + 1}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeDishBtn}
                    onPress={() => toggleExcludeDish(dIdx)}
                  >
                    <Ionicons
                      name={isDishExcluded ? 'add-circle' : 'trash-outline'}
                      size={18}
                      color={isDishExcluded ? '#10B981' : '#EF4444'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.dishTitleRow}>
                  <Text
                    style={[
                      styles.dishCardTitle,
                      isDishExcluded && styles.dishCardTitleExcluded,
                    ]}
                  >
                    {dish.name}
                  </Text>
                  <Text style={styles.dishCardCaloriePill}>{dishCal} kCal</Text>
                </View>

                {/* Per-Dish Portion Control Bar */}
                {!isDishExcluded && (
                  <View style={styles.dishPortionControlBar}>
                    <Text style={styles.dishPortionLabel}>Khẩu phần ước tính tổng lượng bữa ăn (gram):</Text>
                    <View style={styles.dishPortionStepRow}>
                      <TouchableOpacity
                        style={styles.dishStepBtn}
                        onPress={() => handleAdjustDishWeight(dIdx, -50)}
                      >
                        <Text style={styles.dishStepBtnText}>-50g</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dishStepBtn}
                        onPress={() => handleAdjustDishWeight(dIdx, -10)}
                      >
                        <Text style={styles.dishStepBtnText}>-10g</Text>
                      </TouchableOpacity>

                      <View style={styles.dishPortionBadge}>
                        <Text style={styles.dishPortionBadgeText}>{dishWeight}g</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.dishStepBtn}
                        onPress={() => handleAdjustDishWeight(dIdx, 10)}
                      >
                        <Text style={styles.dishStepBtnText}>+10g</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dishStepBtn}
                        onPress={() => handleAdjustDishWeight(dIdx, 50)}
                      >
                        <Text style={styles.dishStepBtnText}>+50g</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Vitamin & Mineral Micronutrient Breakdown for this Dish */}
                {!isDishExcluded && (() => {
                  const dishMicro = calculateDishMicronutrients(dish, totalScale, dIdx, excludedIngKeys);
                  const isMicroExpanded = expandedDishMicroIndexes.includes(dIdx);
                  return (
                    <View style={styles.dishMicroContainer}>
                      <TouchableOpacity
                        style={styles.microHeaderToggle}
                        onPress={() => toggleExpandDishMicro(dIdx)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="sparkles" size={15} color="#8B5CF6" />
                          <Text style={styles.dishMicroHeaderTitle}>
                            Chi tiết Vitamin & Khoáng chất theo dõi:
                          </Text>
                        </View>
                        <Ionicons
                          name={isMicroExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#64748B"
                        />
                      </TouchableOpacity>

                      <View style={styles.microGridRow}>
                        <View style={styles.microBadgePill}>
                          <Text style={styles.microBadgeLabel}>🥬 Chất xơ:</Text>
                          <Text style={styles.microBadgeValue}>{dishMicro.fiberG}g</Text>
                        </View>
                        <View style={styles.microBadgePill}>
                          <Text style={styles.microBadgeLabel}>🧂 Natri:</Text>
                          <Text style={styles.microBadgeValue}>{dishMicro.sodiumMg}mg</Text>
                        </View>
                        <View style={styles.microBadgePill}>
                          <Text style={styles.microBadgeLabel}>🍌 Kali:</Text>
                          <Text style={styles.microBadgeValue}>{dishMicro.potassiumMg}mg</Text>
                        </View>
                        <View style={styles.microBadgePill}>
                          <Text style={styles.microBadgeLabel}>🥛 Canxi:</Text>
                          <Text style={styles.microBadgeValue}>{dishMicro.calciumMg}mg</Text>
                        </View>
                        <View style={styles.microBadgePill}>
                          <Text style={styles.microBadgeLabel}>🥩 Sắt:</Text>
                          <Text style={styles.microBadgeValue}>{dishMicro.ironMg}mg</Text>
                        </View>

                        {isMicroExpanded && (
                          <>
                            <View style={styles.microBadgePill}>
                              <Text style={styles.microBadgeLabel}>🥕 Vit A:</Text>
                              <Text style={styles.microBadgeValue}>{dishMicro.vitAMcg}µg</Text>
                            </View>
                            <View style={styles.microBadgePill}>
                              <Text style={styles.microBadgeLabel}>🍊 Vit C:</Text>
                              <Text style={styles.microBadgeValue}>{dishMicro.vitCMg}mg</Text>
                            </View>
                            <View style={styles.microBadgePill}>
                              <Text style={styles.microBadgeLabel}>☀️ Vit D:</Text>
                              <Text style={styles.microBadgeValue}>{dishMicro.vitDMcg}µg</Text>
                            </View>
                            <View style={styles.microBadgePill}>
                              <Text style={styles.microBadgeLabel}>🛡️ Kẽm:</Text>
                              <Text style={styles.microBadgeValue}>{dishMicro.zincMg}mg</Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* Header for Ingredients of this specific Dish Frame */}
                {!isDishExcluded && (
                  <View style={styles.dishIngSubHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.dishIngSubHeader}>
                        Nguyên liệu Món {dIdx + 1}:
                      </Text>
                      <TouchableOpacity
                        style={styles.ellipsisBtn}
                        onPress={() => setShowFullIngredientsModal(true)}
                      >
                        <Ionicons name="ellipsis-horizontal-circle" size={20} color="#10B981" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.addIngToDishBtn}
                      onPress={() => {
                        setTargetDishIndex(dIdx);
                        setShowAddIngModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={14} color="#059669" />
                      <Text style={styles.addIngToDishBtnText}>Thêm nguyên liệu</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Horizontal Scroll of Ingredients belonging to THIS DISH */}
                {!isDishExcluded && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.ingredientsScroll}
                  >
                    {dish.ingredients && dish.ingredients.length > 0 ? (
                      dish.ingredients.map((ing, iIdx) => {
                        const isIngExcluded = excludedIngKeys.includes(`${dIdx}_${iIdx}`);
                        const isIngExpanded = expandedIngKeys.includes(`${dIdx}_${iIdx}`);
                        const ingPortion = Math.round(
                          (ing.portion_g || ing.estimated_weight_g || 50) * totalScale
                        );
                        const ingCal = Math.round((ing.calories || 0) * totalScale);
                        const isInf = ing.source === 'inferred';
                        const isUser = ing.source === 'user_added';
                        return (
                          <View
                            key={iIdx}
                            style={[
                              styles.ingredientCard,
                              isIngExcluded && styles.ingredientCardExcluded,
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.removeIngBtn}
                              onPress={() => toggleExcludeIngredient(dIdx, iIdx)}
                            >
                              <Ionicons
                                name={isIngExcluded ? 'add-circle' : 'remove-circle'}
                                size={18}
                                color={isIngExcluded ? '#10B981' : '#EF4444'}
                              />
                            </TouchableOpacity>

                            <View style={styles.ingredientImagePlaceholder}>
                              <MaterialCommunityIcons
                                name="silverware-fork-knife"
                                size={18}
                                color="#D97706"
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() => toggleExpandIngName(dIdx, iIdx)}
                              style={styles.ingNameTouchRow}
                            >
                              <Text
                                style={[
                                  styles.ingredientName,
                                  isIngExcluded && styles.ingredientNameExcluded,
                                ]}
                                numberOfLines={isIngExpanded ? undefined : 1}
                              >
                                {ing.name}
                              </Text>
                              {!isIngExpanded && (
                                <Ionicons name="ellipsis-horizontal" size={10} color="#94A3B8" />
                              )}
                            </TouchableOpacity>

                            {/* Step buttons for individual ingredient portion adjustment */}
                            <View style={styles.ingPortionAdjustRow}>
                              <TouchableOpacity
                                style={styles.ingStepBtn}
                                onPress={() =>
                                  handleAdjustIngredientWeight(dIdx, iIdx, -10)
                                }
                                disabled={isIngExcluded}
                              >
                                <Text style={styles.ingStepBtnText}>-</Text>
                              </TouchableOpacity>
                              <Text style={styles.ingredientWeight}>{ingPortion}g</Text>
                              <TouchableOpacity
                                style={styles.ingStepBtn}
                                onPress={() => handleAdjustIngredientWeight(dIdx, iIdx, 10)}
                                disabled={isIngExcluded}
                              >
                                <Text style={styles.ingStepBtnText}>+</Text>
                              </TouchableOpacity>
                            </View>

                            {ingCal > 0 ? (
                              <Text style={styles.ingredientCalText}>{ingCal} kcal</Text>
                            ) : null}

                            <View
                              style={[
                                styles.sourceBadge,
                                isUser
                                  ? styles.sourceUserAdded
                                  : isInf
                                  ? styles.sourceInferred
                                  : styles.sourceVisible,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.sourceBadgeText,
                                  isUser
                                    ? styles.sourceUserAddedText
                                    : isInf
                                    ? styles.sourceInferredText
                                    : styles.sourceVisibleText,
                                ]}
                              >
                                {isUser ? '🔵 Tự thêm' : isInf ? '🟡 Suy luận' : '🟢 Thấy rõ'}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.ingredientCardSingle}>
                        <Text style={styles.ingredientName}>{dish.name}</Text>
                        <Text style={styles.ingredientWeight}>
                          {dishWeight}g - {dishCal} kCal
                        </Text>
                      </View>
                    )}

                    {/* Card to Add Ingredient into this dish */}
                    <TouchableOpacity
                      style={styles.addIngredientCard}
                      onPress={() => {
                        setTargetDishIndex(dIdx);
                        setShowAddIngModal(true);
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#10B981" />
                      <Text style={styles.addIngredientCardText}>Thêm vị</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Floating Save Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="bookmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>Lưu vào nhật ký bữa ăn</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Ingredient Add Modal */}
        <Modal
          visible={showAddIngModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddIngModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.addIngModalContent}>
              <View style={styles.addIngModalHeader}>
                <Text style={styles.addIngModalTitle}>Thêm nguyên liệu tùy ý</Text>
                <TouchableOpacity onPress={() => setShowAddIngModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Tên nguyên liệu hoặc tìm trong cơ sở dữ liệu:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Nhập hoặc chọn bên dưới (Ví dụ: Ức gà, Bánh phở...)"
                placeholderTextColor="#94A3B8"
                value={newIngName}
                onChangeText={(text) => {
                  setNewIngName(text);
                  if (selectedDbFood && selectedDbFood.name !== text) {
                    setSelectedDbFood(null);
                  }
                }}
              />

              {/* DB Ingredients Suggestions */}
              <Text style={styles.dbSuggestTitle}>Gợi ý từ cơ sở dữ liệu ({dbSearchResults.length}):</Text>
              {isSearchingDb ? (
                <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 8 }} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dbChipsScroll}>
                  {dbSearchResults.map((food) => {
                    const isSelected = selectedDbFood?._id === food._id;
                    return (
                      <TouchableOpacity
                        key={food._id}
                        style={[styles.dbChip, isSelected && styles.dbChipSelected]}
                        onPress={() => handleSelectDbIngredient(food)}
                      >
                        <Text style={[styles.dbChipText, isSelected && styles.dbChipTextSelected]}>
                          {food.name} ({food.calories_per_100g} kcal/100g)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <Text style={styles.inputLabel}>Khối lượng (gram):</Text>
              <TextInput
                style={styles.inputField}
                placeholder="50"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newIngWeight}
                onChangeText={(text) => {
                  setNewIngWeight(text);
                  if (selectedDbFood) {
                    const w = parseInt(text) || 0;
                    const computed = Math.round((selectedDbFood.calories_per_100g * w) / 100);
                    setNewIngCal(computed.toString());
                  }
                }}
              />

              <Text style={styles.inputLabel}>Năng lượng (kCal - tự tính nếu chọn từ DB):</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Tự động ước tính"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newIngCal}
                onChangeText={setNewIngCal}
              />

              <View style={styles.addIngModalActions}>
                <TouchableOpacity
                  style={styles.cancelIngBtn}
                  onPress={() => setShowAddIngModal(false)}
                >
                  <Text style={styles.cancelIngBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmAddIngBtn}
                  onPress={handleAddCustomIngredient}
                >
                  <Text style={styles.confirmAddIngBtnText}>Thêm vào bữa ăn</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Full Ingredients List Modal when 3 dots button is pressed */}
        <Modal
          visible={showFullIngredientsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFullIngredientsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.fullIngModalContent}>
              <View style={styles.addIngModalHeader}>
                <Text style={styles.addIngModalTitle}>Tất cả tên nguyên liệu đầy đủ</Text>
                <TouchableOpacity onPress={() => setShowFullIngredientsModal(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380, marginVertical: 10 }}>
                {dishesList.map((dish, dIdx) => (
                  <View key={dIdx} style={styles.fullIngDishGroup}>
                    <Text style={styles.fullIngDishTitle}>
                      MÓN {dIdx + 1}: {dish.name}
                    </Text>
                    {dish.ingredients && dish.ingredients.length > 0 ? (
                      dish.ingredients.map((ing, iIdx) => {
                        const ingPortion = Math.round(
                          (ing.portion_g || ing.estimated_weight_g || 50) * totalScale
                        );
                        const ingCal = Math.round((ing.calories || 0) * totalScale);
                        return (
                          <View key={iIdx} style={styles.fullIngRow}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 6, marginTop: 2 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.fullIngName}>{ing.name}</Text>
                              <Text style={styles.fullIngDetails}>
                                {ingPortion}g • {ingCal} kcal (Đạm: {ing.protein_g || 0}g, Carb: {ing.carb_g || 0}g, Béo: {ing.fat_g || 0}g)
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.fullIngEmpty}>Không có danh sách chi tiết</Text>
                    )}
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.confirmAddIngBtn}
                onPress={() => setShowFullIngredientsModal(false)}
              >
                <Text style={styles.confirmAddIngBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerShareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  bannerImageContainer: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  donutContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: '#10B981',
    borderTopColor: '#3B82F6',
    borderRightColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCalorieNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  donutCalorieLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  macroLegendColumn: {
    flex: 1,
    marginLeft: 16,
    gap: 10,
  },
  macroLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  macroName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  macroPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 4,
  },
  macroGrams: {
    fontSize: 12,
    color: '#94A3B8',
  },
  glContainer: {
    marginBottom: 20,
  },
  glText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  glValue: {
    color: '#EF4444',
    fontWeight: '800',
  },
  glBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'visible',
    marginVertical: 4,
  },
  glBarBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  glPointer: {
    position: 'absolute',
    top: 8,
    marginLeft: -6,
  },
  glPointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  glScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '30%',
    marginTop: 12,
  },
  glScaleNum: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  pickerSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  pickerSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  mealTypeButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mealTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  mealTypeBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  mealTypeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  mealTypeBtnTextActive: {
    color: '#FFFFFF',
  },
  inputWithShortcutsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  manualTextInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  manualTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  shortcutPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shortcutPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  shortcutPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  shortcutPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  shortcutPillTextActive: {
    color: '#059669',
  },
  ingredientsHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  dishSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dishTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  dishCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  ingredientsScroll: {
    flexDirection: 'row',
  },
  ingredientCard: {
    width: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ingredientImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
    textAlign: 'center',
  },
  ingredientWeight: {
    fontSize: 11,
    color: '#64748B',
  },
  ingredientCardSingle: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
  },
  editIconBtn: {
    padding: 4,
  },
  dishNameContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  editableDishTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  portionAdjustContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  portionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  portionControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portionStepBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  portionStepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  portionBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  portionBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ingredientCalText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  edgeCaseControlsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  edgeCaseHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  edgeCaseRow: {
    flexDirection: 'column',
    gap: 6,
  },
  edgeCaseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  groupBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  groupBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  groupBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  groupBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
    alignSelf: 'flex-start',
  },
  toggleBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  toggleBtnTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  alternativesSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alternativesTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  alternativesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  altBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  altBadgeActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  altBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  altBadgeTextActive: {
    color: '#FFFFFF',
  },
  sourceBadge: {
    marginTop: 4,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceInferred: {
    backgroundColor: '#FEF3C7',
  },
  sourceVisible: {
    backgroundColor: '#D1FAE5',
  },
  sourceBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  sourceInferredText: {
    color: '#B45309',
  },
  sourceVisibleText: {
    color: '#065F46',
  },
  sourceUserAdded: {
    backgroundColor: '#DBEAFE',
  },
  sourceUserAddedText: {
    color: '#1E40AF',
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addIngredientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addIngredientBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  addIngredientCard: {
    width: 90,
    height: 120,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
    gap: 6,
  },
  addIngredientCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  addIngModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  addIngModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addIngModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  addIngModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelIngBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelIngBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmAddIngBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAddIngBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dbSuggestTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
    marginTop: 8,
    marginBottom: 4,
  },
  dbChipsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
    maxHeight: 38,
  },
  dbChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dbChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dbChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  dbChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ingredientCardExcluded: {
    opacity: 0.4,
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  ingredientNameExcluded: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  removeIngBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  ingPortionAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 4,
  },
  ingStepBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingStepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 16,
  },
  dishesSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  addDishHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addDishHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  dishCardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dishCardContainerExcluded: {
    opacity: 0.4,
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  dishFrameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dishBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dishBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  removeDishBtn: {
    padding: 2,
  },
  dishTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dishCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  dishCardTitleExcluded: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  dishCardCaloriePill: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dishPortionControlBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dishPortionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  dishPortionStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dishStepBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dishStepBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  dishPortionBadge: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dishPortionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dishIngSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  dishIngSubHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  addIngToDishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 3,
  },
  addIngToDishBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  ellipsisBtn: {
    padding: 2,
  },
  ingNameTouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 2,
  },
  fullIngModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  fullIngDishGroup: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fullIngDishTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 8,
  },
  fullIngRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  fullIngName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  fullIngDetails: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  fullIngEmpty: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  dishMicroContainer: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  microHeaderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dishMicroHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B21A8',
  },
  microGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  microBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 4,
  },
  microBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#581C87',
  },
  microBadgeValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E22CE',
  },
});
