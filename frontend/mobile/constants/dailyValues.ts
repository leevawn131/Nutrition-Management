/**
 * Daily Reference Values (DV) based on a 2,000 calorie reference diet
 * Standard FDA / Ministry of Health guidelines
 */
export const DAILY_VALUES: Record<string, { benchmark: number; unit: string; label: string }> = {
  calories: { benchmark: 2000, unit: 'Calo', label: 'Năng lượng' },
  protein_g: { benchmark: 50, unit: 'g', label: 'Chất đạm' },
  carb_g: { benchmark: 275, unit: 'g', label: 'Tinh bột' },
  fat_g: { benchmark: 78, unit: 'g', label: 'Chất béo' },
  saturated_fat_g: { benchmark: 20, unit: 'g', label: 'Chất béo bão hoà' },
  trans_fat_g: { benchmark: 2, unit: 'g', label: 'Chất béo chuyển hoá' },
  unsaturated_fat_g: { benchmark: 50, unit: 'g', label: 'Chất béo không bão hoà' },
  fiber_g: { benchmark: 28, unit: 'g', label: 'Chất xơ' },
  cholesterol_mg: { benchmark: 300, unit: 'mg', label: 'Cholesterol' },
  sodium_mg: { benchmark: 2300, unit: 'mg', label: 'Natri' },
  potassium_mg: { benchmark: 4700, unit: 'mg', label: 'Kali' },
  calcium_mg: { benchmark: 1300, unit: 'mg', label: 'Canxi' },
  iron_mg: { benchmark: 18, unit: 'mg', label: 'Sắt' },
  zinc_mg: { benchmark: 11, unit: 'mg', label: 'Kẽm' },
  magnesium_mg: { benchmark: 420, unit: 'mg', label: 'Magiê' },
  phosphorus_mg: { benchmark: 1250, unit: 'mg', label: 'Phốt pho' },
  vitamin_a_ug: { benchmark: 900, unit: 'ug', label: 'Vitamin A' },
  vitamin_c_mg: { benchmark: 90, unit: 'mg', label: 'Vitamin C' },
  vitamin_b12_ug: { benchmark: 2.4, unit: 'ug', label: 'Vitamin B-12' },
};

/**
 * Calculate Daily Value percentage (%DV)
 * Formula: (Nutrient Value / Benchmark DV) * 100
 */
export function calculateDVPercentage(value: number, key: string): string {
  const item = DAILY_VALUES[key];
  if (!item || item.benchmark === 0 || !value) return '0%';
  const percentage = (value / item.benchmark) * 100;
  return `${percentage.toFixed(1)}%`;
}
