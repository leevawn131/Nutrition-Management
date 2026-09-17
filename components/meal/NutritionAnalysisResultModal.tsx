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
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AIRecognitionResult, MealType, DishItem, DishIngredient, MicronutrientInfo } from '@/types/meal.types';
import { foodService } from '@/services/food.service';
import { FoodItem } from '@/types/food.types';
import {
  getVerifiedFoodNutrition,
  getStandardDishRecipe,
  expandCompoundIngredient,
} from '@/constants/foodDatabase';
import { CalendarDatePickerModal } from '@/components/common/CalendarDatePickerModal';
import { WheelTimePickerModal } from '@/components/common/WheelTimePickerModal';
import { PortionAdjuster } from '@/components/meal/PortionAdjuster';
import { ShareMealModal } from '@/components/meal/ShareMealModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

const normalizeText = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim();

export const distributeIngredientsToDishes = (
  dishes: DishItem[],
  allIngredients: DishIngredient[]
): DishItem[] => {
  if (!dishes || dishes.length === 0) return [];

  // Step 1: Expand any compound parenthetical strings in allIngredients
  const expandedAllIngredients: DishIngredient[] = [];
  (allIngredients || []).forEach(ing => {
    const expanded = expandCompoundIngredient(ing.name, ing.portion_g || 100);
    if (expanded && expanded.length > 0) {
      expandedAllIngredients.push(...expanded);
    } else {
      expandedAllIngredients.push(ing);
    }
  });

  // Step 2: Clone dishes and expand any compound ingredients inside dishes
  const resultDishes: DishItem[] = dishes.map(d => {
    const currentIngs = d.ingredients ? [...d.ingredients] : [];
    const expandedIngs: DishIngredient[] = [];
    currentIngs.forEach(ing => {
      const expanded = expandCompoundIngredient(ing.name, ing.portion_g || 100);
      if (expanded && expanded.length > 0) {
        expandedIngs.push(...expanded);
      } else {
        expandedIngs.push(ing);
      }
    });
    return {
      ...d,
      ingredients: expandedIngs,
    };
  });

  // If only 1 dish and it has no ingredients, all ingredients belong to it
  if (resultDishes.length === 1 && resultDishes[0].ingredients.length === 0) {
    resultDishes[0].ingredients = [...expandedAllIngredients];
  } else if (resultDishes.length > 1) {
    // Multiple dishes: Match ingredients to dishes using keyword scoring
    const unassignedIngs: DishIngredient[] = [];

    expandedAllIngredients.forEach(ing => {
      // Check if ingredient already exists in any dish
      const alreadyInDish = resultDishes.some(d =>
        d.ingredients.some(existing => existing.name.toLowerCase() === ing.name.toLowerCase())
      );
      if (alreadyInDish) return;

      const normIng = normalizeText(ing.name);
      let bestIdx = -1;
      let bestScore = 0;

      resultDishes.forEach((dish, dIdx) => {
        const normDish = normalizeText(dish.name);
        const dishWords = normDish.split(/\s+/).filter(w => w.length > 1);
        const ingWords = normIng.split(/\s+/).filter(w => w.length > 1);

        let score = 0;
        if (normIng.includes(normDish) || normDish.includes(normIng)) score += 10;
        dishWords.forEach(dw => {
          if (normIng.includes(dw)) score += 3;
        });
        ingWords.forEach(iw => {
          if (normDish.includes(iw)) score += 3;
        });

        if (score > bestScore) {
          bestScore = score;
          bestIdx = dIdx;
        }
      });

      if (bestScore > 0 && bestIdx >= 0) {
        resultDishes[bestIdx].ingredients.push(ing);
      } else {
        unassignedIngs.push(ing);
      }
    });

    // If some dishes still have 0 ingredients, distribute any unassigned ingredients
    resultDishes.forEach(d => {
      if (d.ingredients.length === 0 && unassignedIngs.length > 0) {
        d.ingredients.push(unassignedIngs.shift()!);
      }
    });
  }

  // Step 3: For dishes that have 0 ingredients or only generic single-dish-name ingredient,
  // look up the authentic culinary standard recipe from National Institute of Nutrition & USDA
  return resultDishes.map(d => {
    const weightG = d.estimated_weight_g || 150;
    const hasGenericOnly = d.ingredients.length === 1 && (
      d.ingredients[0].name.includes('(Phần chính)') ||
      d.ingredients[0].name.includes('(Thành phần chính)') ||
      d.ingredients[0].name.toLowerCase().trim() === d.name.toLowerCase().trim()
    );

    if (d.ingredients.length === 0 || hasGenericOnly) {
      const standardRecipe = getStandardDishRecipe(d.name, weightG);
      if (standardRecipe && standardRecipe.length > 0) {
        return {
          ...d,
          ingredients: standardRecipe,
        };
      }
    }

    // If still 0 ingredients, lookup verified nutrition from 100g database (NEVER fabricate numbers)
    if (d.ingredients.length === 0) {
      const verified = getVerifiedFoodNutrition(d.name, weightG);
      return {
        ...d,
        ingredients: [
          {
            name: d.name,
            portion_g: weightG,
            calories: verified.is_verified ? verified.calories : (d.calories || 0),
            protein_g: verified.is_verified ? verified.protein_g : (d.protein_g || 0),
            carb_g: verified.is_verified ? verified.carb_g : (d.carb_g || 0),
            fat_g: verified.is_verified ? verified.fat_g : (d.fat_g || 0),
            micronutrients: verified.micronutrients || undefined,
            source: 'visible' as const,
          },
        ],
      };
    }
    return d;
  });
};

export const checkIsIngredientVerified = (ingName: string): boolean => {
  return getVerifiedFoodNutrition(ingName, 100).is_verified;
};

export const calculateIngredientMicronutrients = (
  ingName: string,
  portionG: number
): MicronutrientInfo => {
  const verified = getVerifiedFoodNutrition(ingName, portionG);
  if (verified.is_verified && verified.micronutrients) {
    return verified.micronutrients;
  }
  return {
    fiber_g: 0,
    sodium_mg: 0,
    potassium_mg: 0,
    calcium_mg: 0,
    iron_mg: 0,
    vitamin_a_mcg: 0,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 0,
    zinc_mg: 0,
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

  const unverifiedItems: string[] = [];
  let hasVerifiedData = false;

  if (activeIngs.length > 0) {
    activeIngs.forEach((ing) => {
      const ingPortion = (ing.portion_g || ing.estimated_weight_g || 50) * scale;
      if (ing.micronutrients && ing.micronutrients.fiber_g !== undefined) {
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
        hasVerifiedData = true;
      } else {
        const isVer = checkIsIngredientVerified(ing.name);
        if (isVer) {
          const micro = calculateIngredientMicronutrients(ing.name, ingPortion);
          fiberG += micro.fiber_g || 0;
          sodiumMg += micro.sodium_mg || 0;
          potassiumMg += micro.potassium_mg || 0;
          calciumMg += micro.calcium_mg || 0;
          ironMg += micro.iron_mg || 0;
          vitAMcg += micro.vitamin_a_mcg || 0;
          vitCMg += micro.vitamin_c_mg || 0;
          vitDMcg += micro.vitamin_d_mcg || 0;
          zincMg += micro.zinc_mg || 0;
          hasVerifiedData = true;
        } else {
          unverifiedItems.push(ing.name);
        }
      }
    });
  } else {
    const dishPortion = (dish.estimated_weight_g || 150) * scale;
    const isVer = checkIsIngredientVerified(dish.name);
    if (isVer) {
      const micro = calculateIngredientMicronutrients(dish.name, dishPortion);
      fiberG = micro.fiber_g || 0;
      sodiumMg = micro.sodium_mg || 0;
      potassiumMg = micro.potassium_mg || 0;
      calciumMg = micro.calcium_mg || 0;
      ironMg = micro.iron_mg || 0;
      vitAMcg = micro.vitamin_a_mcg || 0;
      vitCMg = micro.vitamin_c_mg || 0;
      vitDMcg = micro.vitamin_d_mcg || 0;
      zincMg = micro.zinc_mg || 0;
      hasVerifiedData = true;
    } else {
      unverifiedItems.push(dish.name);
    }
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
    unverifiedItems,
    hasVerifiedData,
  };
};

interface NutritionAnalysisResultModalProps {
  visible: boolean;
  imageUri?: string | null;
  imageUris?: string[] | null;
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
  imageUris,
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

  // Quick edit ingredient weight modal state
  const [editingIngWeightTarget, setEditingIngWeightTarget] = useState<{
    dIdx: number;
    iIdx: number;
    name: string;
    currentGrams: number;
  } | null>(null);
  const [customIngWeightInput, setCustomIngWeightInput] = useState<string>('');

  const toggleExpandIngName = (dIdx: number, iIdx: number) => {
    const key = `${dIdx}_${iIdx}`;
    setExpandedIngKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Interactive 1-Touch controls for real-world edge cases
  const [icePercentage, setIcePercentage] = useState<number>(0);
  const [eatenRatio, setEatenRatio] = useState<number>(1.0);
  const [deductBones, setDeductBones] = useState<boolean>(false);

  // Date picker state
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0); // 0 = Hôm nay, -1 = Hôm qua, -2 = 2 ngày trước
  const [showCalendarPickerModal, setShowCalendarPickerModal] = useState<boolean>(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

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
      const populatedDishes = distributeIngredientsToDishes(initialDishes, result.ingredients || []);
      setDishesList(populatedDishes);
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

  // Set explicit ingredient portion weight (g)
  const handleSetIngredientWeight = (dIdx: number, iIdx: number, targetGrams: number) => {
    const newPortion = Math.max(5, targetGrams);
    setDishesList(prev =>
      prev.map((dish, dIndex) => {
        if (dIndex === dIdx) {
          const updatedIngs = (dish.ingredients || []).map((ing, iIndex) => {
            if (iIndex === iIdx) {
              const currentPortion = ing.portion_g || ing.estimated_weight_g || 50;
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
    // 1. Try authentic standard culinary recipe first
    const recipe = getStandardDishRecipe(foodName, portionG);
    if (recipe && recipe.length > 0) {
      return recipe.map(r => ({
        ...r,
        micronutrients: calculateIngredientMicronutrients(r.name, r.portion_g),
      }));
    }

    // 2. Beverage recipe checks
    const nameLower = foodName.toLowerCase();
    if (
      nameLower.includes('cacao') ||
      nameLower.includes('cocoa') ||
      nameLower.includes('chocolate') ||
      nameLower.includes('socola')
    ) {
      const wCacao = Math.max(10, Math.round(portionG * 0.15));
      const wMilk = Math.max(50, Math.round(portionG * 0.65));
      const wSugar = Math.max(10, Math.round(portionG * 0.2));
      return [
        {
          name: 'Bột cacao nguyên chất',
          portion_g: wCacao,
          calories: Math.round(wCacao * 3.5),
          protein_g: Number((wCacao * 0.2).toFixed(1)),
          carb_g: Number((wCacao * 0.55).toFixed(1)),
          fat_g: Number((wCacao * 0.14).toFixed(1)),
          micronutrients: calculateIngredientMicronutrients('Bột cacao nguyên chất', wCacao),
          source: 'inferred',
        },
        {
          name: 'Sữa tươi đánh nóng',
          portion_g: wMilk,
          calories: Math.round(wMilk * 0.65),
          protein_g: Number((wMilk * 0.032).toFixed(1)),
          carb_g: Number((wMilk * 0.048).toFixed(1)),
          fat_g: Number((wMilk * 0.036).toFixed(1)),
          micronutrients: calculateIngredientMicronutrients('Sữa tươi thanh trùng', wMilk),
          source: 'inferred',
        },
        {
          name: 'Sữa đặc có đường',
          portion_g: wSugar,
          calories: Math.round(wSugar * 3.25),
          protein_g: Number((wSugar * 0.08).toFixed(1)),
          carb_g: Number((wSugar * 0.55).toFixed(1)),
          fat_g: Number((wSugar * 0.085).toFixed(1)),
          micronutrients: calculateIngredientMicronutrients('Sữa đặc có đường', wSugar),
          source: 'inferred',
        },
      ];
    }

    // 3. Fallback to verified food nutrition from National Institute of Nutrition / USDA (NO arbitrary fake numbers)
    const verified = getVerifiedFoodNutrition(foodName, portionG);
    return [
      {
        name: foodName,
        portion_g: portionG,
        calories: verified.calories,
        protein_g: verified.protein_g,
        carb_g: verified.carb_g,
        fat_g: verified.fat_g,
        micronutrients: (verified.micronutrients || calculateIngredientMicronutrients(foodName, portionG)) || undefined,
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
          <TouchableOpacity style={styles.headerShareBtn} onPress={() => setShowShareModal(true)}>
            <Ionicons name="paper-plane-outline" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Top Banner Image(s) */}
          {imageUris && imageUris.length > 1 ? (
            <View style={styles.multiBannerContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.multiBannerScroll}
              >
                {imageUris.map((uri, idx) => (
                  <View key={idx} style={[styles.multiBannerSlide, { width: BANNER_WIDTH }]}>
                    <Image source={{ uri }} style={styles.bannerImage} resizeMode="cover" />
                    <View style={styles.multiBannerBadge}>
                      <Ionicons name="images" size={12} color="#FFFFFF" />
                      <Text style={styles.multiBannerBadgeText}>
                        {idx + 1}/{imageUris.length}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (imageUris && imageUris.length === 1) || imageUri ? (
            <View style={styles.bannerImageContainer}>
              <Image
                source={{ uri: (imageUris && imageUris[0]) || imageUri! }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          ) : null}

          {/* Voice Transcript Banner */}
          {result?.transcription ? (
            <View style={styles.voiceTranscriptCard}>
              <View style={styles.voiceTranscriptHeader}>
                <View style={styles.voiceBadge}>
                  <Ionicons name="mic" size={14} color="#059669" />
                  <Text style={styles.voiceBadgeText}>Ghi âm giọng nói</Text>
                </View>
                <Text style={styles.voiceHintText}>Lời nói được nhận diện</Text>
              </View>
              <Text style={styles.voiceTranscriptQuote}>"{result.transcription}"</Text>
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
            <Text style={[styles.pickerSubLabel, { marginTop: 14 }]}>2. Ngày ghi nhận (Lịch chọn trực quan):</Text>
            <View style={styles.inputWithShortcutsRow}>
              <TouchableOpacity
                style={styles.datePickerDisplayCard}
                onPress={() => setShowCalendarPickerModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={18} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.datePickerDisplayText}>{manualDateStr}</Text>
                <View style={styles.pickerTapBadge}>
                  <Text style={styles.pickerTapBadgeText}>Xem lịch 📅</Text>
                </View>
              </TouchableOpacity>
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
            <Text style={[styles.pickerSubLabel, { marginTop: 14 }]}>3. Giờ ăn (Cuộn dạng báo thức):</Text>
            <View style={styles.inputWithShortcutsRow}>
              <TouchableOpacity
                style={styles.datePickerDisplayCard}
                onPress={() => setShowTimePickerModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time" size={18} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.datePickerDisplayText}>{manualTimeStr}</Text>
                <View style={styles.pickerTapBadge}>
                  <Text style={styles.pickerTapBadgeText}>Cuộn giờ ⏰</Text>
                </View>
              </TouchableOpacity>
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
                    <Text style={styles.dishPortionLabel}>
                      Khẩu phần (Bấm +/- 1g, giữ chạy liên tục hoặc gõ tay):
                    </Text>
                    <View style={styles.portionAdjusterRow}>
                      <PortionAdjuster
                        weight={dishWeight}
                        onChangeWeight={(newW) => {
                          const delta = newW - dishWeight;
                          handleAdjustDishWeight(dIdx, delta);
                        }}
                        step={1}
                        min={1}
                        max={5000}
                      />
                      <View style={styles.quickStepBtnRow}>
                        <TouchableOpacity
                          style={styles.dishStepBtn}
                          onPress={() => handleAdjustDishWeight(dIdx, -50)}
                        >
                          <Text style={styles.dishStepBtnText}>-50g</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dishStepBtn}
                          onPress={() => handleAdjustDishWeight(dIdx, 50)}
                        >
                          <Text style={styles.dishStepBtnText}>+50g</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Header & Vertical List for Ingredients of this specific Dish Frame */}
                {!isDishExcluded && (
                  <View style={styles.dishIngSectionContainer}>
                    <View style={styles.dishIngSubHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#059669" />
                        <Text style={styles.dishIngSubHeader}>
                          Nguyên liệu Món {dIdx + 1} ({dish.ingredients?.length || 0}):
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addIngToDishBtn}
                        onPress={() => {
                          setTargetDishIndex(dIdx);
                          setShowAddIngModal(true);
                        }}
                      >
                        <Ionicons name="add-circle" size={15} color="#059669" />
                        <Text style={styles.addIngToDishBtnText}>Thêm nguyên liệu</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Vertical List of Ingredients */}
                    <View style={styles.dishIngredientsVerticalList}>
                      {dish.ingredients && dish.ingredients.length > 0 ? (
                        dish.ingredients.map((ing, iIdx) => {
                          const isIngExcluded = excludedIngKeys.includes(`${dIdx}_${iIdx}`);
                          const ingPortion = Math.round(
                            (ing.portion_g || ing.estimated_weight_g || 50) * totalScale
                          );
                          const ingCal = Math.round((ing.calories || 0) * totalScale);
                          const ingProtein = Number(((ing.protein_g || 0) * totalScale).toFixed(1));
                          const ingCarb = Number(((ing.carb_g || 0) * totalScale).toFixed(1));
                          const ingFat = Number(((ing.fat_g || 0) * totalScale).toFixed(1));
                          const isInf = ing.source === 'inferred';
                          const isUser = ing.source === 'user_added';

                          return (
                            <View
                              key={iIdx}
                              style={[
                                styles.verticalIngCard,
                                isIngExcluded && styles.verticalIngCardExcluded,
                              ]}
                            >
                              {/* Row 1: Icon, Full Name, Source Badge, Delete/Restore Button */}
                              <View style={styles.verticalIngHeaderRow}>
                                <View style={styles.verticalIngIconWrap}>
                                  <MaterialCommunityIcons
                                    name="food-apple-outline"
                                    size={18}
                                    color={isIngExcluded ? '#94A3B8' : '#10B981'}
                                  />
                                </View>
                                <View style={styles.verticalIngNameCol}>
                                  <Text
                                    style={[
                                      styles.verticalIngName,
                                      isIngExcluded && styles.verticalIngNameExcluded,
                                    ]}
                                  >
                                    {ing.name}
                                  </Text>
                                  <View style={styles.verticalIngMetaRow}>
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
                                        {isUser ? '🔵 Tự thêm' : isInf ? '🟡 Ước lượng' : '🟢 Thấy rõ'}
                                      </Text>
                                    </View>
                                    {isIngExcluded && (
                                      <View style={styles.excludedStatusBadge}>
                                        <Text style={styles.excludedStatusBadgeText}>Đã loại trừ</Text>
                                      </View>
                                    )}
                                  </View>
                                </View>

                                {/* Exclude / Restore Button */}
                                <TouchableOpacity
                                  style={[
                                    styles.verticalIngActionBtn,
                                    isIngExcluded && styles.verticalIngRestoreBtn,
                                  ]}
                                  onPress={() => toggleExcludeIngredient(dIdx, iIdx)}
                                >
                                  <Ionicons
                                    name={isIngExcluded ? 'refresh-circle' : 'trash-outline'}
                                    size={isIngExcluded ? 18 : 16}
                                    color={isIngExcluded ? '#059669' : '#EF4444'}
                                  />
                                  {isIngExcluded && (
                                    <Text style={styles.restoreBtnText}>Khôi phục</Text>
                                  )}
                                </TouchableOpacity>
                              </View>

                              {/* Row 2: Macros & Calories Pill */}
                              {!isIngExcluded && (
                                <View style={styles.verticalIngMacrosRow}>
                                  <View style={styles.verticalIngCalBadge}>
                                    <Ionicons name="flame" size={13} color="#D97706" />
                                    <Text style={styles.verticalIngCalText}>{ingCal} kcal</Text>
                                  </View>
                                  <View style={styles.verticalIngMacroPill}>
                                    <Text style={styles.macroPillLabel}>Đạm:</Text>
                                    <Text style={styles.macroPillValue}>{ingProtein}g</Text>
                                  </View>
                                  <View style={styles.verticalIngMacroPill}>
                                    <Text style={styles.macroPillLabel}>Carb:</Text>
                                    <Text style={styles.macroPillValue}>{ingCarb}g</Text>
                                  </View>
                                  <View style={styles.verticalIngMacroPill}>
                                    <Text style={styles.macroPillLabel}>Béo:</Text>
                                    <Text style={styles.macroPillValue}>{ingFat}g</Text>
                                  </View>
                                </View>
                              )}

                              {/* Row 3: Touch-friendly Controls: Steppers, Tappable Weight Badge, Quick Presets */}
                              {!isIngExcluded && (
                                <View style={styles.verticalIngControlsRow}>
                                  {/* Stepper with Tappable Weight Badge */}
                                  <View style={styles.verticalIngStepperBox}>
                                    <TouchableOpacity
                                      style={styles.verticalIngStepBtn}
                                      onPress={() => handleAdjustIngredientWeight(dIdx, iIdx, -10)}
                                    >
                                      <Ionicons name="remove" size={16} color="#334155" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={styles.verticalIngWeightPill}
                                      onPress={() => {
                                        setEditingIngWeightTarget({
                                          dIdx,
                                          iIdx,
                                          name: ing.name,
                                          currentGrams: ingPortion,
                                        });
                                        setCustomIngWeightInput(String(ingPortion));
                                      }}
                                    >
                                      <Text style={styles.verticalIngWeightText}>{ingPortion}g</Text>
                                      <Ionicons
                                        name="pencil"
                                        size={11}
                                        color="#64748B"
                                        style={{ marginLeft: 3 }}
                                      />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={styles.verticalIngStepBtn}
                                      onPress={() => handleAdjustIngredientWeight(dIdx, iIdx, 10)}
                                    >
                                      <Ionicons name="add" size={16} color="#334155" />
                                    </TouchableOpacity>
                                  </View>

                                  {/* Quick Preset Buttons */}
                                  <View style={styles.verticalIngQuickPresets}>
                                    <TouchableOpacity
                                      style={styles.verticalIngQuickBtn}
                                      onPress={() => handleAdjustIngredientWeight(dIdx, iIdx, 25)}
                                    >
                                      <Text style={styles.verticalIngQuickBtnText}>+25g</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.verticalIngQuickBtn}
                                      onPress={() => handleAdjustIngredientWeight(dIdx, iIdx, 50)}
                                    >
                                      <Text style={styles.verticalIngQuickBtnText}>+50g</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })
                      ) : (
                        <View style={styles.verticalIngEmptyCard}>
                          <Text style={styles.verticalIngEmptyText}>
                            Chưa có nguyên liệu chi tiết cho món này.
                          </Text>
                        </View>
                      )}

                      {/* Prominent Wide Add Ingredient Button at the bottom of the list */}
                      <TouchableOpacity
                        style={styles.addIngToDishWideBtn}
                        onPress={() => {
                          setTargetDishIndex(dIdx);
                          setShowAddIngModal(true);
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={18} color="#059669" />
                        <Text style={styles.addIngToDishWideBtnText}>
                          + Thêm nguyên liệu vào {dish.name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Floating Save & Share Buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.shareQuickBtn}
            onPress={() => setShowShareModal(true)}
          >
            <Ionicons name="share-social" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.shareQuickBtnText}>Chia sẻ MXH</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="bookmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>Lưu bữa ăn</Text>
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

        {/* Calendar Picker Modal */}
        <CalendarDatePickerModal
          visible={showCalendarPickerModal}
          currentDateStr={manualDateStr}
          onClose={() => setShowCalendarPickerModal(false)}
          onSelectDate={(newDate) => {
            setManualDateStr(newDate);
          }}
        />

        {/* Wheel Scroll Time Picker Modal (Báo thức) */}
        <WheelTimePickerModal
          visible={showTimePickerModal}
          currentTimeStr={manualTimeStr}
          onClose={() => setShowTimePickerModal(false)}
          onSelectTime={(newTime) => {
            setManualTimeStr(newTime);
          }}
        />

        {/* Share Meal to Social Feed Modal */}
        <ShareMealModal
          visible={showShareModal}
          meal={{
            foodName: editedFoodName || result?.food_name || 'Bữa ăn',
            calories,
            protein_g: proteinG,
            carb_g: carbG,
            fat_g: fatG,
            source_image_url: imageUri || undefined,
            meal_type: mealType,
          }}
          onClose={() => setShowShareModal(false)}
        />

        {/* Quick Edit Ingredient Weight Modal */}
        <Modal
          visible={!!editingIngWeightTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingIngWeightTarget(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.editWeightModalContent}>
              <View style={styles.addIngModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addIngModalTitle}>Chỉnh trọng lượng</Text>
                  <Text style={styles.editWeightSubtitle} numberOfLines={1}>
                    {editingIngWeightTarget?.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditingIngWeightTarget(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.editWeightInputRow}>
                <TextInput
                  style={styles.editWeightInput}
                  keyboardType="numeric"
                  value={customIngWeightInput}
                  onChangeText={setCustomIngWeightInput}
                  selectTextOnFocus
                  autoFocus
                />
                <Text style={styles.editWeightUnit}>gam (g)</Text>
              </View>

              {/* Quick Preset Chips */}
              <View style={styles.editWeightPresetsRow}>
                {[20, 50, 100, 150, 200, 300].map(preset => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.editWeightPresetChip,
                      customIngWeightInput === String(preset) && styles.editWeightPresetChipActive,
                    ]}
                    onPress={() => setCustomIngWeightInput(String(preset))}
                  >
                    <Text
                      style={[
                        styles.editWeightPresetText,
                        customIngWeightInput === String(preset) && styles.editWeightPresetTextActive,
                      ]}
                    >
                      {preset}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editWeightActionsRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setEditingIngWeightTarget(null)}
                >
                  <Text style={styles.cancelModalBtnText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveWeightModalBtn}
                  onPress={() => {
                    if (!editingIngWeightTarget) return;
                    const parsed = parseInt(customIngWeightInput, 10);
                    if (isNaN(parsed) || parsed <= 0) {
                      Alert.alert('Thông báo', 'Vui lòng nhập số gram hợp lệ (> 0)');
                      return;
                    }
                    handleSetIngredientWeight(
                      editingIngWeightTarget.dIdx,
                      editingIngWeightTarget.iIdx,
                      parsed
                    );
                    setEditingIngWeightTarget(null);
                  }}
                >
                  <Text style={styles.saveWeightModalBtnText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
  multiBannerContainer: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#0F172A',
  },
  multiBannerScroll: {
    flex: 1,
  },
  multiBannerSlide: {
    height: 150,
    position: 'relative',
  },
  multiBannerBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  multiBannerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
  // Dish Ingredients Vertical Layout Styles
  dishIngSectionContainer: {
    marginTop: 12,
  },
  dishIngSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dishIngSubHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  dishIngredientsVerticalList: {
    gap: 10,
  },
  verticalIngCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  verticalIngCardExcluded: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.6,
  },
  verticalIngHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalIngIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  verticalIngNameCol: {
    flex: 1,
    marginRight: 8,
  },
  verticalIngName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  verticalIngNameExcluded: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  verticalIngMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  excludedStatusBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  excludedStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  verticalIngActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalIngRestoreBtn: {
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  restoreBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  verticalIngMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  verticalIngCalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  verticalIngCalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  verticalIngMacroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  macroPillLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  macroPillValue: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '700',
  },
  verticalIngControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  verticalIngStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  verticalIngStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  verticalIngWeightPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalIngWeightText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  verticalIngQuickPresets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verticalIngQuickBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verticalIngQuickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  verticalIngEmptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  verticalIngEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  addIngToDishWideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 4,
    gap: 6,
  },
  addIngToDishWideBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  datePickerDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 160,
  },
  datePickerDisplayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  pickerTapBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  pickerTapBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  portionAdjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  quickStepBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  // Quick Edit Weight Modal Styles
  editWeightModalContent: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  editWeightSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  editWeightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 16,
  },
  editWeightInput: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    minWidth: 80,
    padding: 0,
  },
  editWeightUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  editWeightPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 18,
  },
  editWeightPresetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editWeightPresetChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  editWeightPresetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  editWeightPresetTextActive: {
    color: '#059669',
  },
  editWeightActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveWeightModalBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveWeightModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareQuickBtn: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  shareQuickBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  voiceTranscriptCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  voiceTranscriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  voiceBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  voiceHintText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '500',
  },
  voiceTranscriptQuote: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
