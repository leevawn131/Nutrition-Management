import { API_BASE_URL } from '@/constants/api';
import { mealPlanService } from '@/services/meal_plan.service';
import { getAuthToken } from '@/services/storage.service';
import { MealPlanItem, MealPlanTemplate, MealType, Recipe } from '@/types/plan.types';

export interface MealPlanTemplatesResponse {
  success: boolean;
  data: {
    templates: MealPlanTemplate[];
  };
}

export interface MealPlanTemplateDetailResponse {
  success: boolean;
  data: {
    template: MealPlanTemplate;
  };
}

export interface ApplyTemplateResponse {
  success: boolean;
  message?: string;
  data?: {
    plans: MealPlanItem[];
  };
}

export const FALLBACK_TEMPLATES: MealPlanTemplate[] = [
  {
    _id: 'template-an-dam-9-11',
    name: 'Thực Đơn Ăn Dặm Cho Bé 9-11 Tháng Tuổi',
    duration_days: 1,
    image_url: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42',
    description:
      'Thực Đơn được thiết kế để cung cấp đầy đủ dinh dưỡng và giúp bé làm quen với nhiều loại thực phẩm mới. Thực đơn bao gồm các bữa ăn chính với cháo đặc hoặc cơm mềm kết hợp rau củ nghiền nhuyễn như bí đỏ, cà rốt, khoai lang, kèm nguồn protein từ thịt nạc, cá, trứng, đậu hũ. Trái cây mềm như chuối, lê, táo được cắt nhỏ hoặc nghiền nhuyễn để bé dễ nhai và nuốt. Sữa mẹ hoặc sữa công thức vẫn là nguồn dinh dưỡng chính, đảm bảo đủ năng lượng, vitamin và canxi. Bữa ăn nên chia 3 bữa chính và 1-2 bữa phụ, tăng dần độ thô của thức ăn để rèn luyện khả năng nhai, giúp bé phát triển khẩu vị đa dạng và hình thành thói quen ăn lành mạnh.',
    total_calories: 680,
    total_protein_g: 32.5,
    total_carb_g: 78.0,
    total_fat_g: 24.5,
    items: [
      {
        _id: 'item-ad-1',
        meal_type: 'breakfast',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-bot-ga-carot',
          title: 'Bột thịt gà cà rốt đậu xanh',
          description: 'Món bột ăn dặm thơm ngon, giàu đạm và vitamin A từ ức gà và cà rốt tươi ngon.',
          image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          servings: 1,
          calories_per_serving: 195,
          protein_g: 11.2,
          carb_g: 22.4,
          fat_g: 6.8,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Bột gạo tẻ xay mịn', quantity: 20, unit: 'g' },
            { ingredient_name: 'Thịt ức gà nạc băm', quantity: 30, unit: 'g' },
            { ingredient_name: 'Cà rốt nghiền nhuyễn', quantity: 20, unit: 'g' },
            { ingredient_name: 'Đậu xanh đãi vỏ hấp chín', quantity: 15, unit: 'g' },
            { ingredient_name: 'Dầu ô liu cho bé', quantity: 5, unit: 'ml' },
          ],
        },
      },
      {
        _id: 'item-ad-2',
        meal_type: 'lunch',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-bot-cahoi-caithia',
          title: 'Bột cá hồi cải thìa khoai môn',
          description: 'Cá hồi giàu Omega 3 kết hợp cùng cải thìa và khoai môn bùi ngọt giúp bé phát triển trí não.',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          servings: 1,
          calories_per_serving: 215,
          protein_g: 12.8,
          carb_g: 24.0,
          fat_g: 8.2,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Filet cá hồi tươi phi lê', quantity: 30, unit: 'g' },
            { ingredient_name: 'Cải thìa non băm nhỏ', quantity: 20, unit: 'g' },
            { ingredient_name: 'Khoai môn hấp chín tán mịn', quantity: 25, unit: 'g' },
            { ingredient_name: 'Bột gạo dinh dưỡng', quantity: 20, unit: 'g' },
            { ingredient_name: 'Nước dashi rau củ', quantity: 150, unit: 'ml' },
            { ingredient_name: 'Dầu cá hồi cho bé', quantity: 5, unit: 'ml' },
          ],
        },
      },
      {
        _id: 'item-ad-3',
        meal_type: 'snack',
        day_number: 1,
        quantity_text: '30 g',
        food_item_id: {
          _id: 'food-sua-chua',
          name: 'Sữa chua',
          calories_per_100g: 65,
          protein_per_100g: 3.5,
          carb_per_100g: 8.5,
          fat_per_100g: 2.0,
          image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
        },
        recipe_id: {
          _id: 'recipe-sua-chua-be',
          title: 'Sữa chua',
          description: 'Sữa chua men tự nhiên dịu nhẹ cho hệ tiêu hoá của bé.',
          image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
          servings: 1,
          calories_per_serving: 45,
          protein_g: 2.0,
          carb_g: 5.5,
          fat_g: 1.5,
          prep_time_minutes: 0,
          cook_time_minutes: 0,
          source_type: 'system',
          ingredients: [{ ingredient_name: 'Sữa chua lên men tự nhiên', quantity: 30, unit: 'g' }],
        },
      },
      {
        _id: 'item-ad-4',
        meal_type: 'dinner',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-bot-thit-lon-dau-cove',
          title: 'Bột thịt lợn đậu cô ve',
          description: 'Thịt heo nạc giàu sắt kết hợp đậu cô ve giàu chất xơ giúp bé no bụng và ngủ ngon giấc.',
          image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          prep_time_minutes: 5,
          cook_time_minutes: 10,
          servings: 1,
          calories_per_serving: 225,
          protein_g: 10.5,
          carb_g: 26.1,
          fat_g: 8.0,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Thịt nạc thăn lợn tươi', quantity: 30, unit: 'g' },
            { ingredient_name: 'Đậu cô ve hấp mềm xay nhuyễn', quantity: 20, unit: 'g' },
            { ingredient_name: 'Bột gạo tẻ', quantity: 20, unit: 'g' },
            { ingredient_name: 'Dầu mè tinh khiết', quantity: 5, unit: 'ml' },
          ],
        },
      },
    ],
  },
  {
    _id: 'template-an-dam-6-8',
    name: 'Thực Đơn Ăn Dặm Cho Bé 6-8 Tháng Tuổi',
    duration_days: 1,
    image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033',
    description:
      'Thực Đơn được xây dựng nhằm giúp bé làm quen với thức ăn ngoài sữa, cung cấp đầy đủ dưỡng chất và vitamin từ các loại rau củ nghiền mịn kết hợp nguồn đạm dịu nhẹ như ức gà, lòng đỏ trứng gà.',
    total_calories: 520,
    total_protein_g: 21.0,
    total_carb_g: 65.0,
    total_fat_g: 18.0,
    items: [
      {
        _id: 'item-ad6-1',
        meal_type: 'breakfast',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-chao-sua-bi-do',
          title: 'Cháo sữa bí đỏ hạt sen',
          description: 'Cháo thơm ngậy mùi sữa và ngọt tự nhiên từ bí đỏ cùng hạt sen bùi béo.',
          image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          prep_time_minutes: 5,
          cook_time_minutes: 15,
          servings: 1,
          calories_per_serving: 160,
          protein_g: 5.5,
          carb_g: 28.0,
          fat_g: 3.5,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Bột cháo gạo', quantity: 20, unit: 'g' },
            { ingredient_name: 'Bí đỏ hấp nhuyễn', quantity: 25, unit: 'g' },
            { ingredient_name: 'Hạt sen tươi', quantity: 15, unit: 'g' },
            { ingredient_name: 'Sữa công thức / sữa mẹ', quantity: 60, unit: 'ml' },
          ],
        },
      },
      {
        _id: 'item-ad6-2',
        meal_type: 'lunch',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-bot-trung-raungot',
          title: 'Bột lòng đỏ trứng gà rau ngót',
          description: 'Giàu lecithin và sắt từ lòng đỏ trứng gà kết hợp rau ngót thanh nhiệt.',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          prep_time_minutes: 5,
          cook_time_minutes: 15,
          servings: 1,
          calories_per_serving: 180,
          protein_g: 8.0,
          carb_g: 22.0,
          fat_g: 6.5,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Lòng đỏ trứng gà', quantity: 1, unit: 'quả' },
            { ingredient_name: 'Rau ngót non xay nhuyễn', quantity: 20, unit: 'g' },
            { ingredient_name: 'Bột gạo', quantity: 20, unit: 'g' },
            { ingredient_name: 'Dầu ô liu', quantity: 5, unit: 'ml' },
          ],
        },
      },
      {
        _id: 'item-ad6-3',
        meal_type: 'snack',
        day_number: 1,
        quantity_text: '50 g',
        recipe_id: {
          _id: 'recipe-bo-dam-sua',
          title: 'Bơ dầm sữa mẹ',
          description: 'Quả bơ sáp béo ngậy giàu chất béo tốt cho sự phát triển não bộ của bé.',
          image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578',
          prep_time_minutes: 5,
          cook_time_minutes: 0,
          servings: 1,
          calories_per_serving: 85,
          protein_g: 2.0,
          carb_g: 6.0,
          fat_g: 6.5,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Bơ chín tán nhuyễn', quantity: 40, unit: 'g' },
            { ingredient_name: 'Sữa mẹ / sữa công thức', quantity: 20, unit: 'ml' },
          ],
        },
      },
      {
        _id: 'item-ad6-4',
        meal_type: 'dinner',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-chao-yenmach-chuoi',
          title: 'Cháo yến mạch chuối tiêu',
          description: 'Yến mạch dễ tiêu hóa kết hợp chuối tiêu chín ngọt thanh dịu nhẹ.',
          image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc',
          prep_time_minutes: 5,
          cook_time_minutes: 10,
          servings: 1,
          calories_per_serving: 155,
          protein_g: 5.5,
          carb_g: 29.0,
          fat_g: 2.5,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Yến mạch cán mịn', quantity: 20, unit: 'g' },
            { ingredient_name: 'Chuối tiêu chín nghiền', quantity: 30, unit: 'g' },
            { ingredient_name: 'Nước ấm / sữa mẹ', quantity: 100, unit: 'ml' },
          ],
        },
      },
    ],
  },
  {
    _id: 'template-eatclean-7days',
    name: 'Thực Đơn Eat Clean Giảm Mỡ 7 Ngày',
    duration_days: 7,
    image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
    description:
      'Thực đơn chuẩn cân bằng dinh dưỡng, trung bình 1.500 - 1.700 Calo/ngày giúp giảm mỡ hiệu quả, thanh lọc cơ thể và giữ năng lượng làm việc suốt tuần.',
    total_calories: 1580,
    total_protein_g: 110.0,
    total_carb_g: 145.0,
    total_fat_g: 45.0,
    items: [
      {
        _id: 'item-ec-1',
        meal_type: 'breakfast',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-overnight-oats',
          title: 'Yến mạch ngâm qua đêm chuối hạt chia',
          description: 'Bữa sáng tiện lợi chuẩn bị từ tối hôm trước, dồi dào chất xơ beta-glucan giúp no lâu.',
          image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc',
          prep_time_minutes: 5,
          cook_time_minutes: 0,
          servings: 1,
          calories_per_serving: 310,
          protein_g: 11.5,
          carb_g: 52.0,
          fat_g: 6.2,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Yến mạch cán dẹt', quantity: 40, unit: 'g' },
            { ingredient_name: 'Sữa hạnh nhân không đường', quantity: 120, unit: 'ml' },
            { ingredient_name: 'Hạt chia', quantity: 10, unit: 'g' },
            { ingredient_name: 'Chuối chín', quantity: 1, unit: 'quả' },
          ],
        },
      },
      {
        _id: 'item-ec-2',
        meal_type: 'lunch',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-uc-ga-ap-chao',
          title: 'Ức gà áp chảo sốt chanh leo kèm quinoa',
          description: 'Thịt ức gà mềm ngọt mọng nước cùng hạt diêm mạch giàu đạm thực vật.',
          image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          servings: 1,
          calories_per_serving: 460,
          protein_g: 42.0,
          carb_g: 45.0,
          fat_g: 9.5,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Ức gà phi lê', quantity: 150, unit: 'g' },
            { ingredient_name: 'Hạt quinoa nấu chín', quantity: 100, unit: 'g' },
            { ingredient_name: 'Bông cải xanh luộc', quantity: 100, unit: 'g' },
            { ingredient_name: 'Chanh leo và mật ong', quantity: 1, unit: 'quả' },
          ],
        },
      },
      {
        _id: 'item-ec-3',
        meal_type: 'snack',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-tao-bo-dau-phong',
          title: 'Táo đỏ cắt lát kèm bơ đậu phộng',
          description: 'Món ăn nhẹ giàu chất xơ và chất béo lành mạnh chống đói buổi chiều.',
          image_url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb',
          prep_time_minutes: 5,
          cook_time_minutes: 0,
          servings: 1,
          calories_per_serving: 180,
          protein_g: 4.5,
          carb_g: 22.0,
          fat_g: 8.0,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Táo Envy', quantity: 1, unit: 'quả' },
            { ingredient_name: 'Bơ đậu phộng nguyên chất', quantity: 15, unit: 'g' },
          ],
        },
      },
      {
        _id: 'item-ec-4',
        meal_type: 'dinner',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-salad-ca-hoi',
          title: 'Salad cá hồi sốt mè rang bơ tỏi',
          description: 'Cá hồi tươi áp chảo trên nền rau xanh tươi giòn thanh mát.',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          prep_time_minutes: 10,
          cook_time_minutes: 10,
          servings: 1,
          calories_per_serving: 420,
          protein_g: 28.5,
          carb_g: 16.0,
          fat_g: 24.0,
          source_type: 'system',
          ingredients: [
            { ingredient_name: 'Filet cá hồi tươi', quantity: 120, unit: 'g' },
            { ingredient_name: 'Xà lách Romaine, cà chua bi', quantity: 150, unit: 'g' },
            { ingredient_name: 'Quả bơ cắt lát', quantity: 50, unit: 'g' },
            { ingredient_name: 'Sốt mè rang Kewpie', quantity: 20, unit: 'ml' },
          ],
        },
      },
    ],
  },
  {
    _id: 'template-high-protein',
    name: 'Thực đơn High Protein Tăng Cơ Cho Gymer',
    duration_days: 7,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    description: 'Cung cấp trên 140g đạm mỗi ngày, hỗ trợ phục hồi và phát triển cơ bắp tối ưu cho người tập luyện thể thao.',
    total_calories: 2150,
    total_protein_g: 155.0,
    total_carb_g: 190.0,
    total_fat_g: 58.0,
    items: [
      {
        _id: 'item-hp-1',
        meal_type: 'breakfast',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-overnight-oats',
          title: 'Yến mạch ngâm qua đêm chuối hạt chia',
          calories_per_serving: 310,
          protein_g: 11.5,
          carb_g: 52.0,
          fat_g: 6.2,
          image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc',
          servings: 1,
          source_type: 'system',
          ingredients: [{ ingredient_name: 'Yến mạch', quantity: 50, unit: 'g' }],
        },
      },
      {
        _id: 'item-hp-2',
        meal_type: 'lunch',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-uc-ga-ap-chao',
          title: 'Ức gà áp chảo sốt chanh leo kèm quinoa',
          calories_per_serving: 460,
          protein_g: 42.0,
          carb_g: 45.0,
          fat_g: 9.5,
          image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
          servings: 1,
          source_type: 'system',
          ingredients: [{ ingredient_name: 'Ức gà', quantity: 200, unit: 'g' }],
        },
      },
      {
        _id: 'item-hp-3',
        meal_type: 'dinner',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-bo-bit-tet',
          title: 'Bò bít tết thăn ngoại sốt tiêu đen măng tây',
          calories_per_serving: 520,
          protein_g: 48.0,
          carb_g: 8.0,
          fat_g: 32.0,
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947',
          servings: 1,
          source_type: 'system',
          ingredients: [{ ingredient_name: 'Thăn bò Úc', quantity: 200, unit: 'g' }],
        },
      },
    ],
  },
  {
    _id: 'template-detox',
    name: 'Thực đơn Thanh Lọc Cơ Thể (Detox & Low Sodium)',
    duration_days: 3,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    description: 'Tập trung vào rau củ tươi, rong biển và hạn chế tối đa muối natri giúp cơ thể nhẹ nhàng, thanh thoát.',
    total_calories: 1250,
    total_protein_g: 65.0,
    total_carb_g: 150.0,
    total_fat_g: 28.0,
    items: [
      {
        _id: 'item-dt-1',
        meal_type: 'breakfast',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-overnight-oats',
          title: 'Yến mạch ngâm qua đêm chuối hạt chia',
          calories_per_serving: 310,
          protein_g: 11.5,
          carb_g: 52.0,
          fat_g: 6.2,
          image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc',
          servings: 1,
          source_type: 'system',
          ingredients: [{ ingredient_name: 'Yến mạch', quantity: 40, unit: 'g' }],
        },
      },
      {
        _id: 'item-dt-2',
        meal_type: 'lunch',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-canh-rong-bien',
          title: 'Canh rong biển đậu hũ non thịt bằm',
          calories_per_serving: 140,
          protein_g: 12.0,
          carb_g: 6.0,
          fat_g: 5.5,
          image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554',
          servings: 1,
          source_type: 'system',
          ingredients: [{ ingredient_name: 'Rong biển khô', quantity: 20, unit: 'g' }],
        },
      },
      {
        _id: 'item-dt-3',
        meal_type: 'dinner',
        day_number: 1,
        recipe_id: {
          _id: 'recipe-salad-ca-hoi',
          title: 'Salad cá hồi sốt mè rang bơ tỏi',
          calories_per_serving: 420,
          protein_g: 28.5,
          carb_g: 16.0,
          fat_g: 24.0,
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
          servings: 1,
          source_type: 'system',
          ingredients: [{ ingredient_name: 'Cá hồi', quantity: 120, unit: 'g' }],
        },
      },
    ],
  },
];

export const mealPlanTemplateService = {
  /**
   * Lấy danh sách thực đơn mẫu
   */
  async getTemplates(search?: string): Promise<MealPlanTemplate[]> {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams();
      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const url = `${API_BASE_URL}/meal-plan-templates?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData: MealPlanTemplatesResponse = await response.json();
      if (response.ok && resData.success && Array.isArray(resData.data?.templates) && resData.data.templates.length > 0) {
        return resData.data.templates;
      }
    } catch (error) {
      console.warn('Error fetching meal plan templates, using fallback:', error);
    }

    // Fallback search
    if (search && search.trim()) {
      const query = search.trim().toLowerCase();
      return FALLBACK_TEMPLATES.filter(
        (t) => t.name.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query))
      );
    }
    return FALLBACK_TEMPLATES;
  },

  /**
   * Lấy chi tiết thực đơn mẫu theo ID
   */
  async getTemplateById(id: string): Promise<MealPlanTemplate | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/meal-plan-templates/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const resData: MealPlanTemplateDetailResponse = await response.json();
      if (response.ok && resData.success && resData.data?.template) {
        return resData.data.template;
      }
    } catch (error) {
      console.warn(`Error fetching template ${id}, using fallback:`, error);
    }

    const fallback = FALLBACK_TEMPLATES.find((t) => t._id === id);
    return fallback || FALLBACK_TEMPLATES[0];
  },

  /**
   * Áp dụng thực đơn mẫu vào lịch của người dùng
   */
  async applyTemplate(templateId: string, targetDate: string): Promise<boolean> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/meal-plan-templates/${templateId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ targetDate }),
      });

      const resData: ApplyTemplateResponse = await response.json();
      if (response.ok && resData.success) {
        return true;
      }
    } catch (error) {
      console.warn(`Error applying template ${templateId} via API, attempting local fallback:`, error);
    }

    // Fallback: apply each item via mealPlanService.addMealPlanItem
    const template = FALLBACK_TEMPLATES.find((t) => t._id === templateId) || FALLBACK_TEMPLATES[0];
    if (template && Array.isArray(template.items)) {
      for (const item of template.items) {
        const recipe = typeof item.recipe_id === 'object' ? item.recipe_id : null;
        const food = typeof item.food_item_id === 'object' ? item.food_item_id : null;

        await mealPlanService.addMealPlanItem({
          plan_date: targetDate,
          meal_type: item.meal_type,
          recipe_id: recipe?._id || (typeof item.recipe_id === 'string' ? item.recipe_id : undefined),
          food_item_id: food?._id || (typeof item.food_item_id === 'string' ? item.food_item_id : undefined),
          source: 'template',
        });
      }
      return true;
    }

    return false;
  },
};
