const mongoose = require('mongoose');
const Recipe = require('../models/recipe.model');

class AdminRecipeService {
  /**
   * Lấy danh sách công thức phân trang, tìm kiếm và lọc
   */
  async listRecipes({ page = 1, limit = 10, search = '', source_type = 'all', status = 'all' }) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      const error = new Error('Tham số page phải là số nguyên dương >= 1.');
      error.statusCode = 400;
      throw error;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      const error = new Error('Tham số limit phải là số nguyên trong khoảng từ 1 đến 100.');
      error.statusCode = 400;
      throw error;
    }

    const query = {};

    // Tìm kiếm theo tên công thức (title)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.title = searchRegex;
    }

    // Lọc theo source_type (system / community)
    if (source_type && source_type !== 'all') {
      if (!['system', 'community'].includes(source_type)) {
        const error = new Error('Tham số source_type không hợp lệ. Chỉ chấp nhận system hoặc community.');
        error.statusCode = 400;
        throw error;
      }
      query.source_type = source_type;
    }

    // Lọc theo status (pending / approved / rejected)
    if (status && status !== 'all') {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        const error = new Error('Tham số status không hợp lệ. Chỉ chấp nhận pending, approved hoặc rejected.');
        error.statusCode = 400;
        throw error;
      }
      query.status = status;
    }

    const total = await Recipe.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;

    const recipes = await Recipe.find(query)
      .populate('created_by_user_id', 'full_name email role')
      .sort({ created_at: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      recipes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * Lấy chi tiết công thức theo ID
   */
  async getRecipeById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID công thức không hợp lệ.');
      error.statusCode = 400;
      throw error;
    }

    const recipe = await Recipe.findById(id)
      .populate('created_by_user_id', 'full_name email role')
      .lean();

    if (!recipe) {
      const error = new Error('Không tìm thấy công thức với ID đã cung cấp.');
      error.statusCode = 404;
      throw error;
    }

    return recipe;
  }

  /**
   * Tạo công thức chuẩn hệ thống (System Recipe)
   */
  async createRecipe(recipeData, adminId) {
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      const error = new Error('ID người tạo (Admin) không hợp lệ.');
      error.statusCode = 400;
      throw error;
    }

    // Validate bắt buộc
    if (!recipeData.title || typeof recipeData.title !== 'string' || !recipeData.title.trim()) {
      const error = new Error('Tên công thức (title) là bắt buộc và không được để trống.');
      error.statusCode = 400;
      throw error;
    }

    if (recipeData.servings === undefined || recipeData.servings === null || isNaN(Number(recipeData.servings)) || Number(recipeData.servings) <= 0) {
      const error = new Error('Khẩu phần (servings) là bắt buộc và phải là số > 0.');
      error.statusCode = 400;
      throw error;
    }

    // Validate số lượng calo & macro nếu có
    const numericFields = ['prep_time_minutes', 'cook_time_minutes', 'calories_per_serving', 'protein_g', 'carb_g', 'fat_g'];
    for (const field of numericFields) {
      if (recipeData[field] !== undefined && recipeData[field] !== null && recipeData[field] !== '') {
        if (isNaN(Number(recipeData[field])) || Number(recipeData[field]) < 0) {
          const error = new Error(`Trường ${field} phải là số không âm (>= 0).`);
          error.statusCode = 400;
          throw error;
        }
      }
    }

    // Validate danh sách nguyên liệu
    let ingredients = [];
    if (recipeData.ingredients !== undefined && recipeData.ingredients !== null) {
      if (!Array.isArray(recipeData.ingredients)) {
        const error = new Error('Danh sách nguyên liệu (ingredients) phải là một mảng.');
        error.statusCode = 400;
        throw error;
      }
      for (let i = 0; i < recipeData.ingredients.length; i++) {
        const ing = recipeData.ingredients[i];
        if (!ing || typeof ing !== 'object' || !ing.ingredient_name || typeof ing.ingredient_name !== 'string' || !ing.ingredient_name.trim()) {
          const error = new Error(`Nguyên liệu thứ ${i + 1} phải có tên (ingredient_name) hợp lệ.`);
          error.statusCode = 400;
          throw error;
        }
        if (ing.quantity !== undefined && ing.quantity !== null && (isNaN(Number(ing.quantity)) || Number(ing.quantity) < 0)) {
          const error = new Error(`Định lượng nguyên liệu ${ing.ingredient_name} phải là số >= 0.`);
          error.statusCode = 400;
          throw error;
        }
        ingredients.push({
          ingredient_name: ing.ingredient_name.trim(),
          quantity: ing.quantity !== undefined && ing.quantity !== null && ing.quantity !== '' ? Number(ing.quantity) : null,
          unit: ing.unit && typeof ing.unit === 'string' && ing.unit.trim() ? ing.unit.trim() : null,
        });
      }
    }

    // Validate danh sách các bước nấu
    let steps = [];
    if (recipeData.steps !== undefined && recipeData.steps !== null) {
      if (!Array.isArray(recipeData.steps)) {
        const error = new Error('Các bước thực hiện (steps) phải là một mảng.');
        error.statusCode = 400;
        throw error;
      }
      for (let i = 0; i < recipeData.steps.length; i++) {
        const st = recipeData.steps[i];
        if (!st || typeof st !== 'object' || !st.instruction || typeof st.instruction !== 'string' || !st.instruction.trim()) {
          const error = new Error(`Bước thứ ${i + 1} phải có nội dung hướng dẫn (instruction).`);
          error.statusCode = 400;
          throw error;
        }
        const stepNum = st.step_number ? parseInt(st.step_number, 10) : i + 1;
        if (isNaN(stepNum) || stepNum < 1) {
          const error = new Error(`Thứ tự bước thứ ${i + 1} (step_number) phải là số nguyên >= 1.`);
          error.statusCode = 400;
          throw error;
        }
        steps.push({
          step_number: stepNum,
          instruction: st.instruction.trim(),
        });
      }
    }

    // Validate nutrition_facts nếu có
    let nutrition_facts = null;
    if (recipeData.nutrition_facts && typeof recipeData.nutrition_facts === 'object') {
      nutrition_facts = {};
      const nfFields = [
        'energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g', 'fiber_g',
        'saturated_fat_g', 'trans_fat_g', 'unsaturated_fat_g', 'cholesterol_mg',
        'salt_g', 'sodium_mg', 'glycemic_load', 'vitamin_a_mcg', 'vitamin_d_mcg',
        'vitamin_e_mg', 'vitamin_k_mcg', 'vitamin_c_mg', 'vitamin_b12_mcg',
        'folic_acid_mcg', 'calcium_mg', 'iron_mg', 'zinc_mg', 'magnesium_mg',
        'potassium_mg', 'phosphorus_mg'
      ];
      for (const f of nfFields) {
        if (recipeData.nutrition_facts[f] !== undefined && recipeData.nutrition_facts[f] !== null && recipeData.nutrition_facts[f] !== '') {
          if (isNaN(Number(recipeData.nutrition_facts[f])) || Number(recipeData.nutrition_facts[f]) < 0) {
            const error = new Error(`Chỉ số vi chất ${f} phải là số không âm (>= 0).`);
            error.statusCode = 400;
            throw error;
          }
          nutrition_facts[f] = Number(recipeData.nutrition_facts[f]);
        } else {
          nutrition_facts[f] = null;
        }
      }
      nutrition_facts.updated_at = new Date();
    }

    // Tự động gán quyền sở hữu hệ thống
    const newRecipe = new Recipe({
      title: recipeData.title.trim(),
      description: recipeData.description && typeof recipeData.description === 'string' ? recipeData.description.trim() : null,
      image_url: recipeData.image_url && typeof recipeData.image_url === 'string' ? recipeData.image_url.trim() : null,
      prep_time_minutes: recipeData.prep_time_minutes !== undefined && recipeData.prep_time_minutes !== null && recipeData.prep_time_minutes !== '' ? Number(recipeData.prep_time_minutes) : null,
      cook_time_minutes: recipeData.cook_time_minutes !== undefined && recipeData.cook_time_minutes !== null && recipeData.cook_time_minutes !== '' ? Number(recipeData.cook_time_minutes) : null,
      servings: Number(recipeData.servings),
      calories_per_serving: recipeData.calories_per_serving !== undefined && recipeData.calories_per_serving !== null && recipeData.calories_per_serving !== '' ? Number(recipeData.calories_per_serving) : null,
      protein_g: recipeData.protein_g !== undefined && recipeData.protein_g !== null && recipeData.protein_g !== '' ? Number(recipeData.protein_g) : null,
      carb_g: recipeData.carb_g !== undefined && recipeData.carb_g !== null && recipeData.carb_g !== '' ? Number(recipeData.carb_g) : null,
      fat_g: recipeData.fat_g !== undefined && recipeData.fat_g !== null && recipeData.fat_g !== '' ? Number(recipeData.fat_g) : null,
      avg_rating: 0,
      comment_count: 0,
      source_type: 'system',
      created_by_user_id: new mongoose.Types.ObjectId(adminId),
      status: 'approved',
      created_at: new Date(),
      ingredients,
      steps,
      nutrition_facts,
    });

    const savedRecipe = await newRecipe.save();
    return savedRecipe.toObject();
  }

  /**
   * Cập nhật công thức món ăn
   */
  async updateRecipe(id, updateData) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID công thức không hợp lệ.');
      error.statusCode = 400;
      throw error;
    }

    // Không cho phép sửa các trường bảo mật/chủ sở hữu
    if (updateData._id !== undefined && updateData._id.toString() !== id.toString()) {
      const error = new Error('Không được phép thay đổi _id của công thức.');
      error.statusCode = 400;
      throw error;
    }

    if (updateData.created_by_user_id !== undefined) {
      const error = new Error('Không được phép thay đổi người tạo (created_by_user_id).');
      error.statusCode = 400;
      throw error;
    }

    if (updateData.created_at !== undefined) {
      const error = new Error('Không được phép thay đổi thời điểm tạo (created_at).');
      error.statusCode = 400;
      throw error;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      const error = new Error('Không tìm thấy công thức với ID đã cung cấp.');
      error.statusCode = 404;
      throw error;
    }

    const updates = {};

    if (updateData.title !== undefined) {
      if (!updateData.title || typeof updateData.title !== 'string' || !updateData.title.trim()) {
        const error = new Error('Tên công thức không được để trống.');
        error.statusCode = 400;
        throw error;
      }
      updates.title = updateData.title.trim();
    }

    if (updateData.description !== undefined) {
      updates.description = updateData.description && typeof updateData.description === 'string' ? updateData.description.trim() : null;
    }

    if (updateData.image_url !== undefined) {
      updates.image_url = updateData.image_url && typeof updateData.image_url === 'string' ? updateData.image_url.trim() : null;
    }

    if (updateData.servings !== undefined) {
      if (isNaN(Number(updateData.servings)) || Number(updateData.servings) <= 0) {
        const error = new Error('Khẩu phần (servings) phải là số > 0.');
        error.statusCode = 400;
        throw error;
      }
      updates.servings = Number(updateData.servings);
    }

    const numericFields = ['prep_time_minutes', 'cook_time_minutes', 'calories_per_serving', 'protein_g', 'carb_g', 'fat_g'];
    for (const field of numericFields) {
      if (updateData[field] !== undefined) {
        if (updateData[field] === null || updateData[field] === '') {
          updates[field] = null;
        } else {
          if (isNaN(Number(updateData[field])) || Number(updateData[field]) < 0) {
            const error = new Error(`Trường ${field} phải là số không âm (>= 0).`);
            error.statusCode = 400;
            throw error;
          }
          updates[field] = Number(updateData[field]);
        }
      }
    }

    if (updateData.ingredients !== undefined) {
      if (!Array.isArray(updateData.ingredients)) {
        const error = new Error('Danh sách nguyên liệu phải là một mảng.');
        error.statusCode = 400;
        throw error;
      }
      const ingredients = [];
      for (let i = 0; i < updateData.ingredients.length; i++) {
        const ing = updateData.ingredients[i];
        if (!ing || typeof ing !== 'object' || !ing.ingredient_name || typeof ing.ingredient_name !== 'string' || !ing.ingredient_name.trim()) {
          const error = new Error(`Nguyên liệu thứ ${i + 1} phải có tên hợp lệ.`);
          error.statusCode = 400;
          throw error;
        }
        ingredients.push({
          ingredient_name: ing.ingredient_name.trim(),
          quantity: ing.quantity !== undefined && ing.quantity !== null && ing.quantity !== '' ? Number(ing.quantity) : null,
          unit: ing.unit && typeof ing.unit === 'string' && ing.unit.trim() ? ing.unit.trim() : null,
        });
      }
      updates.ingredients = ingredients;
    }

    if (updateData.steps !== undefined) {
      if (!Array.isArray(updateData.steps)) {
        const error = new Error('Các bước thực hiện phải là một mảng.');
        error.statusCode = 400;
        throw error;
      }
      const steps = [];
      for (let i = 0; i < updateData.steps.length; i++) {
        const st = updateData.steps[i];
        if (!st || typeof st !== 'object' || !st.instruction || typeof st.instruction !== 'string' || !st.instruction.trim()) {
          const error = new Error(`Bước thứ ${i + 1} phải có nội dung hướng dẫn.`);
          error.statusCode = 400;
          throw error;
        }
        steps.push({
          step_number: st.step_number ? parseInt(st.step_number, 10) : i + 1,
          instruction: st.instruction.trim(),
        });
      }
      updates.steps = steps;
    }

    if (updateData.nutrition_facts !== undefined) {
      if (updateData.nutrition_facts === null) {
        updates.nutrition_facts = null;
      } else if (typeof updateData.nutrition_facts === 'object') {
        const nf = {};
        const nfFields = [
          'energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g', 'fiber_g',
          'saturated_fat_g', 'trans_fat_g', 'unsaturated_fat_g', 'cholesterol_mg',
          'salt_g', 'sodium_mg', 'glycemic_load', 'vitamin_a_mcg', 'vitamin_d_mcg',
          'vitamin_e_mg', 'vitamin_k_mcg', 'vitamin_c_mg', 'vitamin_b12_mcg',
          'folic_acid_mcg', 'calcium_mg', 'iron_mg', 'zinc_mg', 'magnesium_mg',
          'potassium_mg', 'phosphorus_mg'
        ];
        for (const f of nfFields) {
          if (updateData.nutrition_facts[f] !== undefined && updateData.nutrition_facts[f] !== null && updateData.nutrition_facts[f] !== '') {
            nf[f] = Number(updateData.nutrition_facts[f]);
          } else {
            nf[f] = null;
          }
        }
        nf.updated_at = new Date();
        updates.nutrition_facts = nf;
      }
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('created_by_user_id', 'full_name email role')
      .lean();

    return updatedRecipe;
  }

  /**
   * Cập nhật trạng thái duyệt công thức (Approve / Reject)
   */
  async updateRecipeStatus(id, status) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID công thức không hợp lệ.');
      error.statusCode = 400;
      throw error;
    }

    if (!['approved', 'rejected'].includes(status)) {
      const error = new Error('Trạng thái duyệt chỉ có thể là approved hoặc rejected.');
      error.statusCode = 400;
      throw error;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      const error = new Error('Không tìm thấy công thức với ID đã cung cấp.');
      error.statusCode = 404;
      throw error;
    }

    recipe.status = status;
    await recipe.save();

    return recipe.toObject();
  }

  /**
   * Xóa cứng công thức (kèm kiểm tra ràng buộc toàn vẹn)
   */
  async deleteRecipe(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID công thức không hợp lệ.');
      error.statusCode = 400;
      throw error;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      const error = new Error('Không tìm thấy công thức với ID đã cung cấp.');
      error.statusCode = 404;
      throw error;
    }

    const recipeObjId = new mongoose.Types.ObjectId(id);

    // Kiểm tra ràng buộc tham chiếu sang meal_plan_templates và meal_plans
    const [templateCount, mealPlanCount] = await Promise.all([
      mongoose.connection.collection('meal_plan_templates').countDocuments({ 'items.recipe_id': recipeObjId }),
      mongoose.connection.collection('meal_plans').countDocuments({ recipe_id: recipeObjId }),
    ]);

    if (templateCount > 0 || mealPlanCount > 0) {
      const reasons = [];
      if (templateCount > 0) reasons.push(`${templateCount} thực đơn mẫu (meal_plan_templates)`);
      if (mealPlanCount > 0) reasons.push(`${mealPlanCount} kế hoạch bữa ăn người dùng (meal_plans)`);

      const error = new Error(
        `Không thể xóa công thức này vì đang được liên kết với: ${reasons.join(', ')}. Vui lòng gỡ công thức khỏi các thực đơn liên quan trước khi xóa.`
      );
      error.statusCode = 400;
      throw error;
    }

    await Recipe.findByIdAndDelete(id);

    return {
      success: true,
      message: `Đã xóa công thức "${recipe.title}" thành công.`,
    };
  }
}

module.exports = new AdminRecipeService();
