const mongoose = require('mongoose');
const ChatConversation = require('../models/chat_conversation.model');
const ChatMessage = require('../models/chat_message.model');
const Recipe = require('../models/recipe.model');
const Activity = require('../models/activity.model');
const User = require('../models/user.model');
const recipeService = require('./recipe.service');
const mealPlanService = require('./meal_plan.service');
const groqService = require('./groq.service');
const healthService = require('./health.service');

class ChatWorkflowService {
  constructor() {
    this.workflows = {
      general: this.handleGeneralWorkflow.bind(this),
      recipe: this.handleRecipeWorkflow.bind(this),
      meal_plan: this.handleMealPlanWorkflow.bind(this),
      goal: this.handleGoalWorkflow.bind(this), // Extension point for Quoc
      exercise: this.handleExerciseWorkflow.bind(this), // Extension point for Quoc
      health: this.handleHealthWorkflow.bind(this),
    };

    this.actionHandlers = {
      view_recipe: this.handleViewRecipeAction.bind(this),
      save_recipe: this.handleSaveRecipeAction.bind(this),
      add_to_meal_plan: this.handleAddToMealPlanAction.bind(this),
      refine_recommendation: this.handleRefineRecommendationAction.bind(this),
      confirm_meal_plan: this.handleConfirmMealPlanAction.bind(this),
      // Extension points for Quoc
      save_goal: this.handleQuocGoalAction.bind(this),
      adjust_goal: this.handleQuocGoalAction.bind(this),
      show_exercise_guide: this.handleQuocExerciseAction.bind(this),
      resolve_exercise_video: this.handleQuocExerciseAction.bind(this),
      confirm_activity_plan: this.handleQuocExerciseAction.bind(this),
    };
  }

  /**
   * Main entry point for POST /api/chat/messages
   */
  async processMessage(userId, { conversation_id, client_message_id, input }) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // 1. Idempotency check: if client_message_id already exists for this user, return previous assistant response
    if (client_message_id) {
      const existingUserMsg = await ChatMessage.findOne({ client_message_id }).lean();
      if (existingUserMsg) {
        const nextAssistantMsg = await ChatMessage.findOne({
          conversation_id: existingUserMsg.conversation_id,
          created_at: { $gte: existingUserMsg.created_at },
          sender: 'ai',
        })
          .sort({ created_at: 1 })
          .lean();

        if (nextAssistantMsg) {
          const conversation = await ChatConversation.findById(existingUserMsg.conversation_id).lean();
          return this.formatResponse(conversation, nextAssistantMsg);
        }
      }
    }

    // 2. Find or create conversation
    let conversation;
    if (conversation_id && mongoose.Types.ObjectId.isValid(conversation_id)) {
      conversation = await ChatConversation.findOne({ _id: conversation_id, user_id: userId });
    }

    if (!conversation) {
      conversation = await ChatConversation.create({
        user_id: userId,
        title: 'AI Assistant',
        current_flow: 'general',
        current_step: 'entry',
        status: 'collecting',
        context_data: {},
      });
    }

    // 3. Save User message to chat_messages
    const userContent = this.extractContentFromInput(input);
    await ChatMessage.create({
      conversation_id: conversation._id,
      client_message_id: client_message_id || null,
      sender: 'user',
      role: 'user',
      content: userContent,
      ui_type: this.sanitizeUiType(input?.type) || 'text',
      ui_payload: input?.value || null,
      created_at: new Date(),
    });

    // Auto-update conversation title if it is default
    if (
      (!conversation.title || conversation.title === 'AI Assistant' || conversation.title === 'Cuộc trò chuyện mới') &&
      userContent &&
      !userContent.startsWith('[Action:')
    ) {
      const cleanTitle = userContent.replace(/\s+/g, ' ').trim().slice(0, 45);
      if (cleanTitle) {
        conversation.title = cleanTitle;
        await conversation.save();
      }
    }

    // 4. Handle Actions if input.type === 'action'
    let actionResult = null;
    if (input.type === 'action' && input.value && input.value.action) {
      const actionName = input.value.action;
      const actionData = input.value.data || {};
      const handler = this.actionHandlers[actionName];
      if (handler) {
        actionResult = await handler(userId, conversation, actionData);
        if (actionResult) {
          return this.saveAndFormatAIResponse(conversation, actionResult);
        }
      }
    }

    // 5. Workflow Transitions & AI Intent/Parameter Resolution (Groq GPT-OSS 20B)
    const normalizedText = (typeof input.value === 'string' ? input.value : userContent).toLowerCase().trim();
    let aiResolution = null;

    // Assistant shortcuts always begin a fresh flow, even if an older flow is completed.
    const shortcutFlows = {
      'luyện tập & vận động': 'exercise',
      'luyện tập': 'exercise',
      'lên lịch tập': 'exercise',
      'tìm công thức nấu ăn': 'recipe',
      'tìm công thức': 'recipe',
      'gợi ý món ăn': 'recipe',
      'lập kế hoạch bữa ăn': 'meal_plan',
      'lên kế hoạch': 'meal_plan',
      'lên thực đơn': 'meal_plan',
      'thiết lập mục tiêu dinh dưỡng': 'goal',
      'thiết lập mục tiêu': 'goal',
      'mục tiêu dinh dưỡng': 'goal',
      'tôi muốn hỏi về sức khỏe và dinh dưỡng.': 'health',
      'hỏi về sức khỏe': 'health',
      'tư vấn sức khỏe': 'health',
    };

    const isGreetingOrReset =
      normalizedText.includes('xin chào') ||
      normalizedText.includes('chào miu') ||
      normalizedText.includes('chào tri') ||
      normalizedText.includes('giúp mình những gì') ||
      normalizedText === 'bắt đầu' ||
      normalizedText === 'menu chính' ||
      normalizedText === 'bắt đầu lại' ||
      normalizedText === 'reset' ||
      normalizedText === 'trợ giúp';

    if (isGreetingOrReset) {
      conversation.current_flow = 'general';
      conversation.current_step = 'entry';
      conversation.status = 'collecting';
      conversation.context_data = {};
      await conversation.save();
    } else if (shortcutFlows[normalizedText]) {
      conversation.current_flow = shortcutFlows[normalizedText];
      conversation.current_step = 'entry';
      conversation.status = 'collecting';
      conversation.context_data = {};
      await conversation.save();
    } else if (
      normalizedText.includes('mục tiêu dinh dưỡng') ||
      normalizedText.includes('thiết lập mục tiêu')
    ) {
      conversation.current_flow = 'goal';
      conversation.current_step = 'entry';
      conversation.status = 'collecting';
      conversation.context_data = {};
      await conversation.save();
    } else if (
      normalizedText.includes('công thức nấu ăn') ||
      normalizedText.includes('tìm công thức') ||
      normalizedText.includes('gợi ý món ăn')
    ) {
      conversation.current_flow = 'recipe';
      conversation.current_step = 'entry';
      conversation.status = 'collecting';
      conversation.context_data = {};
      await conversation.save();
    } else if (
      normalizedText.includes('kế hoạch bữa ăn') ||
      normalizedText.includes('lập thực đơn') ||
      normalizedText.includes('lên thực đơn')
    ) {
      conversation.current_flow = 'meal_plan';
      conversation.current_step = 'entry';
      conversation.status = 'collecting';
      conversation.context_data = {};
      await conversation.save();
    } else if (normalizedText.includes('luyện tập') || normalizedText.includes('vận động')) {
      conversation.current_flow = 'exercise';
      conversation.current_step = 'entry';
      conversation.status = 'collecting';
      conversation.context_data = {};
      await conversation.save();
    } else if (normalizedText.includes('hỏi về sức khỏe') || normalizedText.includes('tư vấn sức khỏe')) {
      conversation.current_flow = 'health';
      conversation.current_step = 'entry';
      conversation.status = 'collecting';
      conversation.context_data = {};
      await conversation.save();
    } else if (input.type === 'text' || (!input.type && typeof input.value === 'string')) {
      // User entered natural language: resolve intent and parameters with Groq GPT-OSS 20B
      if (shortcutFlows[normalizedText]) {
        aiResolution = { target_flow: shortcutFlows[normalizedText], parameters: {} };
      } else {
        let userProfile = null;
        try {
          userProfile = await User.findById(userId)
            .select('gender height_cm weight_kg activity_level goal target_calories')
            .lean();
        } catch (e) {
          // Ignore DB error
        }

        aiResolution = await groqService.resolveIntentAndParameters(userContent, {
          current_flow: conversation.current_flow,
          current_step: conversation.current_step,
          user_profile: userProfile,
        });
      }

      // Flow transitions when at top-level 'general'
      if (conversation.current_flow === 'general') {
        if (aiResolution && aiResolution.target_flow && aiResolution.target_flow !== 'general') {
          conversation.current_flow = aiResolution.target_flow;
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = { ...(aiResolution.parameters || {}) };
          await conversation.save();
        }
      } else {
        // Explicit workflow switch commands from user
        if (normalizedText === 'tìm công thức nấu ăn') {
          conversation.current_flow = 'recipe';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        } else if (normalizedText === 'lập kế hoạch bữa ăn') {
          conversation.current_flow = 'meal_plan';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        } else if (normalizedText === 'thiết lập mục tiêu dinh dưỡng') {
          conversation.current_flow = 'goal';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        } else if (normalizedText === 'luyện tập & vận động') {
          conversation.current_flow = 'exercise';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        }
      }
    } else if (input.type === 'choice') {
      // Direct chip click routing
      if (conversation.current_flow === 'general') {
        if (normalizedText.includes('công thức') || normalizedText.includes('recipe')) {
          conversation.current_flow = 'recipe';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        } else if (
          normalizedText.includes('kế hoạch bữa ăn') ||
          normalizedText.includes('thực đơn') ||
          normalizedText.includes('meal plan')
        ) {
          conversation.current_flow = 'meal_plan';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        } else if (normalizedText.includes('mục tiêu') || normalizedText.includes('goal')) {
          conversation.current_flow = 'goal';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        } else if (normalizedText.includes('luyện tập') || normalizedText.includes('exercise')) {
          conversation.current_flow = 'exercise';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        } else if (normalizedText.includes('sức khỏe') || normalizedText.includes('health')) {
          conversation.current_flow = 'health';
          conversation.current_step = 'entry';
          conversation.status = 'collecting';
          conversation.context_data = {};
          await conversation.save();
        }
      }
    }

    // 6. Route to active workflow handler
    const workflowHandler = this.workflows[conversation.current_flow] || this.workflows.general;
    const aiOutput = await workflowHandler(userId, conversation, input, normalizedText, aiResolution);

    return this.saveAndFormatAIResponse(conversation, aiOutput);
  }

  // =========================================================================
  // WORKFLOW: GENERAL (Default Greeting & Routing)
  // =========================================================================
  async handleGeneralWorkflow(userId, conversation, input, normalizedText, aiResolution = null) {
    let nameDisplay = '';
    if (userId) {
      try {
        const user = await User.findById(userId).select('full_name').lean();
        if (user && user.full_name) {
          nameDisplay = ` ${user.full_name}`;
        }
      } catch (err) {}
    }

    if (normalizedText.includes('trò chuyện chung') || normalizedText === 'trò chuyện') {
      return {
        message:
          'Tri luôn sẵn sàng giải đáp và đồng hành cùng bạn! Bạn có thể hỏi bất cứ điều gì về dinh dưỡng, tính calo thực phẩm, thói quen ăn uống lành mạnh hay tập luyện. Dưới đây là một số chủ đề phổ biến bạn có thể thử hỏi:',
        ui: {
          type: 'choice',
          payload: {
            title: 'Gợi ý câu hỏi nhanh:',
            choices: [
              { label: '💧 Mỗi ngày nên uống bao nhiêu nước?', value: 'Mỗi ngày nên uống bao nhiêu nước?' },
              { label: '🥗 Làm sao để giảm mỡ bụng an toàn?', value: 'Làm sao để giảm mỡ bụng an toàn?' },
              { label: '🥩 Những thực phẩm nào giàu protein?', value: 'Những thực phẩm nào giàu protein?' },
              { label: '📊 Chỉ số BMI và TDEE của mình?', value: 'Tôi muốn hỏi về sức khỏe và dinh dưỡng.' },
              { label: '🏠 Quay lại danh sách tính năng', value: 'bắt đầu lại' },
            ],
          },
        },
        state: { flow: 'general', step: 'qa_prompt', status: 'collecting' },
      };
    }

    const defaultGreeting = `Chào${nameDisplay}! Mình là Tri, trợ lý dinh dưỡng và sức khoẻ của The Nutri. Mình có thể tính mục tiêu calo, lên thực đơn, gợi ý món ăn, theo dõi vận động, hoặc trả lời câu hỏi về dinh dưỡng và chỉ số của bạn. Bạn chọn một việc bên dưới, hoặc cứ hỏi mình bất cứ điều gì nhé.`;

    if (
      input.type === 'text' &&
      normalizedText.length > 0 &&
      !normalizedText.includes('xin chào') &&
      !normalizedText.includes('giúp mình những gì')
    ) {
      const history = await ChatMessage.find({ conversation_id: conversation._id })
        .sort({ created_at: -1 })
        .limit(12)
        .lean();
      const conversationalResponse = await groqService.generateChatResponse(
        String(input.value),
        history.reverse().slice(0, -1),
        { flow: conversation.current_flow, step: conversation.current_step }
      );

      if (conversationalResponse) {
        return {
          message: conversationalResponse.reply,
          ui: conversationalResponse.choices.length > 0
            ? { type: 'choice', payload: { title: 'Gợi ý lựa chọn:', choices: conversationalResponse.choices } }
            : null,
          state: { flow: 'general', step: 'chatting', status: 'collecting' },
        };
      }
    }

    const message =
      aiResolution && aiResolution.intent === 'general_qa' && aiResolution.natural_response && !normalizedText.includes('xin chào') && !normalizedText.includes('giúp mình những gì')
        ? aiResolution.natural_response
        : defaultGreeting;

    return {
      message,
      ui: {
        type: 'choice',
        payload: {
          title: 'Chọn tác vụ bạn cần:',
          choices: [
            {
              label: '💬 Trò chuyện chung',
              value: 'Trò chuyện chung',
              description: 'Trò chuyện, hỏi đáp về dinh dưỡng và sức khỏe',
              icon: '💬',
            },
            {
              label: '🍲 Tìm công thức',
              value: 'Tìm công thức nấu ăn',
              description: 'Tìm món ăn từ nguyên liệu hoặc khám phá món mới',
              icon: '🍲',
            },
            {
              label: '📅 Lập kế hoạch bữa ăn',
              value: 'Lập kế hoạch bữa ăn',
              description: 'Lên thực đơn 1-7 ngày cá nhân hóa theo mục tiêu',
              icon: '📅',
            },
            {
              label: '🎯 Thiết lập mục tiêu',
              value: 'Thiết lập mục tiêu dinh dưỡng',
              description: 'Tính BMR, TDEE, calo thâm hụt/thặng dư và tỷ lệ macro chuẩn',
              icon: '🎯',
            },
            {
              label: '🏃 Luyện tập & vận động',
              value: 'Luyện tập & vận động',
              description: 'Lên lịch bài tập và hướng dẫn vận động khoa học',
              icon: '🏃',
            },
          ],
        },
      },
      state: {
        flow: 'general',
        step: 'entry',
        status: 'collecting',
      },
    };
  }

  // =========================================================================
  // WORKFLOW A: RECIPE SEARCH (Tìm công thức nấu ăn)
  // =========================================================================
  async handleRecipeWorkflow(userId, conversation, input, normalizedText, aiResolution = null) {
    const context = conversation.context_data || {};
    const params = aiResolution?.parameters || {};

    const hasCriteria =
      params.meal_type ||
      params.high_protein ||
      params.low_calorie ||
      params.keyword ||
      normalizedText.includes('bữa') ||
      normalizedText.includes('sáng') ||
      normalizedText.includes('trưa') ||
      normalizedText.includes('tối') ||
      normalizedText.includes('calo') ||
      normalizedText.includes('đạm') ||
      normalizedText.includes('protein');

    // 1. Nếu đang ở entry và KHÔNG có tiêu chí cụ thể nào -> hiển thị quick chips
    if (conversation.current_step === 'entry' && !hasCriteria) {
      conversation.current_step = 'show_recipes';
      await conversation.save();

      return {
        message: 'Xin chào! Bạn muốn tìm công thức món ăn gì cho hôm nay?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Gợi ý nhanh cho bạn:',
            choices: [
              { label: '🌅 Bữa sáng', value: 'Bữa sáng' },
              { label: '☀️ Bữa trưa', value: 'Bữa trưa' },
              { label: '🌙 Bữa tối', value: 'Bữa tối' },
              { label: '🥗 Món ít calo', value: 'Món ít calo' },
              { label: '🥩 Giàu protein', value: 'Giàu protein' },
              { label: '🍲 Xem tất cả', value: 'Tất cả món' },
            ],
          },
        },
        state: {
          flow: 'recipe',
          step: 'ask_preference',
          status: 'collecting',
        },
      };
    }

    // 2. Xử lý yêu cầu tìm món từ database với tham số bóc tách từ Groq AI
    let queryFilter = { status: 'approved' };
    let promptTitle = 'Các món ăn phù hợp';

    const mealType = params.meal_type || context.meal_type;

    if (mealType === 'breakfast' || normalizedText.includes('bữa sáng') || normalizedText.includes('sáng')) {
      context.meal_type = 'breakfast';
      queryFilter.$or = [
        { title: /sáng|yến mạch|bánh mì|trứng|oat|salad/i },
        { description: /sáng|yến mạch|bánh mì|trứng|oat|salad/i },
      ];
      promptTitle = 'Các công thức bữa sáng gợi ý:';
    } else if (mealType === 'lunch' || normalizedText.includes('bữa trưa') || normalizedText.includes('trưa')) {
      context.meal_type = 'lunch';
      queryFilter.$or = [
        { title: /trưa|cơm|bún|thịt|gà|bò|canh|cá|salad/i },
        { description: /trưa|cơm|bún|thịt|gà|bò|canh|cá|salad/i },
      ];
      promptTitle = 'Các công thức bữa trưa đầy năng lượng:';
    } else if (mealType === 'dinner' || normalizedText.includes('bữa tối') || normalizedText.includes('tối')) {
      context.meal_type = 'dinner';
      queryFilter.$or = [
        { title: /tối|canh|salad|hấp|luộc|bít tết|cá hồi|gà/i },
        { description: /tối|canh|salad|hấp|luộc|bít tết|cá hồi|gà/i },
      ];
      promptTitle = 'Các công thức bữa tối nhẹ nhàng:';
    } else if (mealType === 'snack' || normalizedText.includes('bữa phụ') || normalizedText.includes('phụ')) {
      context.meal_type = 'snack';
      queryFilter.$or = [
        { title: /phụ|snack|sữa chua|trái cây|hạt|yến mạch/i },
        { description: /phụ|snack|sữa chua|trái cây|hạt|yến mạch/i },
      ];
      promptTitle = 'Các món ăn nhẹ / bữa phụ gợi ý:';
    }

    if (params.low_calorie || normalizedText.includes('ít calo') || normalizedText.includes('low calo')) {
      queryFilter.calories_per_serving = { $lte: 400 };
      promptTitle += ' (Ít calo)';
    }
    if (
      params.high_protein ||
      normalizedText.includes('giàu protein') ||
      normalizedText.includes('protein') ||
      normalizedText.includes('đạm')
    ) {
      queryFilter.protein_g = { $gte: 20 };
      promptTitle += ' (Giàu protein)';
    }

    if (params.keyword) {
      const kw = params.keyword.trim();
      const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      queryFilter.$or = [{ title: kwRegex }, { description: kwRegex }];
      promptTitle = `Các món "${kw}" phù hợp:`;
    } else if (
      typeof input.value === 'string' &&
      input.value.trim().length > 1 &&
      !mealType &&
      !params.low_calorie &&
      !params.high_protein &&
      !normalizedText.includes('tất cả') &&
      !normalizedText.includes('tìm lại')
    ) {
      const kw = input.value.trim();
      const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      queryFilter.$or = [{ title: kwRegex }, { description: kwRegex }];
      promptTitle = `Kết quả tìm kiếm cho "${kw}":`;
    }

    let recipes = await Recipe.find(queryFilter).sort({ created_at: -1 }).limit(5).lean();

    // Fallback nếu filter không có món nào
    if (!recipes || recipes.length === 0) {
      recipes = await Recipe.find({ status: 'approved' }).sort({ created_at: -1 }).limit(5).lean();
      promptTitle = 'Không tìm thấy món đúng tiêu chí, gợi ý các món nổi bật:';
    }

    conversation.context_data = context;
    conversation.current_step = 'recipe_action';
    conversation.status = 'collecting';
    await conversation.save();

    const formattedList = recipes.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      description: r.description || '',
      image_url: r.image_url,
      calories: r.calories_per_serving || 0,
      protein: r.protein_g || 0,
      carbs: r.carb_g || 0,
      fat: r.fat_g || 0,
      cook_time_minutes: r.cook_time_minutes || 15,
      prep_time_minutes: r.prep_time_minutes || 10,
      servings: r.servings || 1,
      meal_type: context.meal_type || 'lunch',
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      actions: [
        { label: 'Lưu món', action: 'save_recipe', data: { recipe_id: r._id.toString(), title: r.title } },
        {
          label: '+ Thêm vào kế hoạch',
          action: 'add_to_meal_plan',
          data: { recipe_id: r._id.toString(), title: r.title, meal_type: context.meal_type || 'lunch' },
        },
      ],
    }));

    return {
      message: `Đã tìm thấy ${formattedList.length} công thức cho bạn. Bạn có thể xem chi tiết, lưu lại hoặc thêm trực tiếp vào kế hoạch ăn uống nhé!`,
      ui: {
        type: 'recipe_list',
        payload: {
          title: promptTitle,
          recipes: formattedList,
        },
      },
      state: {
        flow: 'recipe',
        step: 'show_recipes',
        status: 'collecting',
      },
    };
  }

  // =========================================================================
  // WORKFLOW B: MEAL PLANNING (Lập kế hoạch bữa ăn)
  // =========================================================================
  async handleMealPlanWorkflow(userId, conversation, input, normalizedText, aiResolution = null) {
    const context = conversation.context_data || {};
    if (aiResolution?.parameters && conversation.current_step === 'entry') {
      if (aiResolution.parameters.days_count) context.days_count = aiResolution.parameters.days_count;
      if (aiResolution.parameters.meals_per_day) context.meals_per_day = aiResolution.parameters.meals_per_day;
      if (aiResolution.parameters.low_calorie || aiResolution.parameters.low_carb || aiResolution.parameters.vegetarian) {
        context.constraints = {
          ...(context.constraints || {}),
          ...(aiResolution.parameters.low_calorie ? { low_calorie: true } : {}),
          ...(aiResolution.parameters.low_carb ? { low_carb: true } : {}),
          ...(aiResolution.parameters.vegetarian ? { vegetarian: true } : {}),
        };
      }
    }

    // Step 1: Entry -> Hỏi nhu cầu
    if (conversation.current_step === 'entry') {
      conversation.current_step = 'ask_need';
      conversation.status = 'collecting';
      conversation.context_data = context;
      await conversation.save();

      return {
        message:
          'Chào bạn! Để xây dựng kế hoạch ăn uống hiệu quả và cá nhân hóa nhất, bạn muốn lập thực đơn theo nhu cầu nào?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Chọn nhu cầu của bạn:',
            choices: [
              { label: '🎯 Theo mục tiêu cá nhân (Hồ sơ)', value: 'need_profile_goal' },
              { label: '🥗 Ăn kiêng & Giảm mỡ', value: 'need_weight_loss' },
              { label: '💪 Tăng cơ & Giàu đạm', value: 'need_muscle_gain' },
              { label: '🌿 Ăn chay / Thanh đạm', value: 'need_vegetarian' },
              { label: '⚡ Nhanh gọn & Tiết kiệm', value: 'need_budget_quick' },
            ],
          },
        },
        state: {
          flow: 'meal_plan',
          step: 'ask_need',
          status: 'collecting',
        },
      };
    }

    // Step 2: Handle Need -> Kiểm tra mục tiêu (nếu nhu cầu liên quan đến mục tiêu cá nhân)
    if (conversation.current_step === 'ask_need') {
      const isProfileGoal =
        normalizedText.includes('mục tiêu') ||
        normalizedText.includes('hồ sơ') ||
        normalizedText.includes('cá nhân') ||
        normalizedText === 'need_profile_goal';

      if (isProfileGoal) {
        const user = await User.findById(userId).lean();
        const targetCal = user?.target_calories || 0;
        const targetProt = user?.target_protein_g || 0;
        const goal = user?.goal || 'maintain';
        const goalLabel =
          goal === 'lose' ? 'Giảm mỡ / Giảm cân' : goal === 'gain' ? 'Tăng cơ / Tăng cân' : 'Duy trì vóc dáng';

        context.health_consent = true;
        context.need = 'profile_goal';

        if (targetCal > 0) {
          context.target_calories = targetCal;
          context.target_protein_g = targetProt;
          context.goal = goal;
          conversation.current_step = 'confirm_goal';
          conversation.context_data = context;
          await conversation.save();

          return {
            message: `Hồ sơ sức khỏe của bạn hiện đang có mục tiêu: **${goalLabel}**\n• Năng lượng khuyến nghị: **${targetCal} kcal/ngày**\n• Đạm mục tiêu: **${targetProt}g/ngày**\n\nBạn có muốn áp dụng mức calo này cho kế hoạch không?`,
            ui: {
              type: 'choice',
              payload: {
                title: 'Xác nhận mức năng lượng:',
                choices: [
                  { label: `✅ Dùng mục tiêu ${targetCal} kcal/ngày`, value: 'confirm_profile_goal' },
                  { label: '✏️ Chọn mức calo khác', value: 'custom_calories' },
                ],
              },
            },
            state: {
              flow: 'meal_plan',
              step: 'confirm_goal',
              status: 'collecting',
            },
          };
        } else {
          // Chưa có calo mục tiêu trong profile
          context.target_calories = 1800;
          conversation.current_step = 'confirm_goal';
          conversation.context_data = context;
          await conversation.save();

          return {
            message:
              'Hồ sơ của bạn hiện chưa cài đặt mức calo mục tiêu cụ thể. Bạn muốn thực đơn trung bình khoảng bao nhiêu calo mỗi ngày?',
            ui: {
              type: 'choice',
              payload: {
                title: 'Chọn mức calo mỗi ngày:',
                choices: [
                  { label: '🔥 1,500 kcal (Giảm mỡ)', value: '1500' },
                  { label: '⚖️ 1,800 kcal (Duy trì cân bằng)', value: '1800' },
                  { label: '💪 2,200 kcal (Tăng cơ / Tăng cân)', value: '2200' },
                ],
              },
            },
            state: {
              flow: 'meal_plan',
              step: 'confirm_goal',
              status: 'collecting',
            },
          };
        }
      }

      // Nhu cầu khác: thiết lập ràng buộc và chuyển sang hỏi số bữa ăn
      if (normalizedText.includes('giảm') || normalizedText === 'need_weight_loss') {
        context.constraints = { lower_calories: true };
        context.target_calories = 1600;
        context.need = 'weight_loss';
      } else if (normalizedText.includes('tăng cơ') || normalizedText.includes('đạm') || normalizedText === 'need_muscle_gain') {
        context.constraints = { higher_protein: true };
        context.target_calories = 2200;
        context.need = 'muscle_gain';
      } else if (normalizedText.includes('chay') || normalizedText === 'need_vegetarian') {
        context.constraints = { vegetarian: true };
        context.target_calories = 1800;
        context.need = 'vegetarian';
      } else {
        context.constraints = { quick_cook: true };
        context.target_calories = 1900;
        context.need = 'budget_quick';
      }

      conversation.current_step = 'ask_meals_per_day';
      conversation.context_data = context;
      await conversation.save();

      return {
        message: 'Ghi nhận nhu cầu của bạn! Tiếp theo, bạn muốn phân bổ thực đơn thành bao nhiêu bữa mỗi ngày?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Số bữa ăn trong ngày:',
            choices: [
              { label: '☀️🌙 2 bữa (Trưa, Tối - Nhịn 16:8)', value: '2' },
              { label: '🌅☀️🌙 3 bữa (Sáng, Trưa, Tối)', value: '3' },
              { label: '🌅☀️🌙🍎 4 bữa (Sáng, Trưa, Tối, Phụ)', value: '4' },
            ],
          },
        },
        state: {
          flow: 'meal_plan',
          step: 'ask_meals_per_day',
          status: 'collecting',
        },
      };
    }

    // Step 3: Handle Goal Confirmation -> Hỏi số bữa ăn (ask_meals_per_day)
    if (conversation.current_step === 'confirm_goal') {
      const matchNum = normalizedText.match(/\d{3,4}/);
      if (matchNum) {
        context.target_calories = parseInt(matchNum[0], 10);
      } else if (normalizedText.includes('khác') || normalizedText === 'custom_calories') {
        return {
          message: 'Vui lòng chọn hoặc nhập số calo mục tiêu mỗi ngày bạn mong muốn (ví dụ: 1700):',
          ui: {
            type: 'choice',
            payload: {
              choices: [
                { label: '🔥 1,500 kcal', value: '1500' },
                { label: '⚖️ 1,800 kcal', value: '1800' },
                { label: '💪 2,000 kcal', value: '2000' },
                { label: '⚡ 2,300 kcal', value: '2300' },
              ],
            },
          },
          state: {
            flow: 'meal_plan',
            step: 'confirm_goal',
            status: 'collecting',
          },
        };
      }

      conversation.current_step = 'ask_meals_per_day';
      conversation.context_data = context;
      await conversation.save();

      return {
        message: `Đã thiết lập mức năng lượng ~**${context.target_calories || 2000} kcal/ngày**.\n\nTiếp theo, bạn muốn phân bổ thực đơn thành bao nhiêu bữa mỗi ngày?`,
        ui: {
          type: 'choice',
          payload: {
            title: 'Số bữa ăn trong ngày:',
            choices: [
              { label: '☀️🌙 2 bữa (Trưa, Tối - Nhịn 16:8)', value: '2' },
              { label: '🌅☀️🌙 3 bữa (Sáng, Trưa, Tối)', value: '3' },
              { label: '🌅☀️🌙🍎 4 bữa (Sáng, Trưa, Tối, Phụ)', value: '4' },
            ],
          },
        },
        state: {
          flow: 'meal_plan',
          step: 'ask_meals_per_day',
          status: 'collecting',
        },
      };
    }

    // Step 4: Handle meals per day -> Hỏi thực đơn cho mấy ngày (ask_plan_days)
    if (conversation.current_step === 'ask_meals_per_day') {
      let mealsPerDay = 3;
      if (normalizedText.includes('2')) mealsPerDay = 2;
      else if (normalizedText.includes('4')) mealsPerDay = 4;
      context.meals_per_day = mealsPerDay;

      conversation.current_step = 'ask_plan_days';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();

      return {
        message: 'Tuyệt vời! Bạn muốn lên kế hoạch thực đơn cho mấy ngày?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Chọn số ngày thực đơn:',
            choices: [
              { label: '📅 1 ngày (Hôm nay / Ngày mai)', value: '1 ngày' },
              { label: '📆 3 ngày (3 ngày tới)', value: '3 ngày' },
              { label: '🗓️ 7 ngày (1 tuần hoàn chỉnh)', value: '7 ngày' },
            ],
          },
        },
        state: {
          flow: 'meal_plan',
          step: 'ask_plan_days',
          status: 'collecting',
        },
      };
    }

    // Step 5: Handle plan days -> Generate Preview
    if (conversation.current_step === 'ask_plan_days') {
      let daysCount = 3;

      // Ưu tiên trích xuất số ngày chính xác (1, 3, 7)
      const digitMatch = normalizedText.match(/\b([137])\b/) || normalizedText.match(/([137])\s*ngày/);
      if (digitMatch) {
        daysCount = parseInt(digitMatch[1], 10);
      } else if (
        normalizedText.includes('3') ||
        normalizedText.includes('ba ngày') ||
        normalizedText.includes('nửa tuần')
      ) {
        daysCount = 3;
      } else if (
        normalizedText.includes('1') ||
        normalizedText.includes('một ngày') ||
        normalizedText.includes('hôm nay') ||
        normalizedText.includes('ngày mai')
      ) {
        daysCount = 1;
      } else if (
        normalizedText.includes('7') ||
        normalizedText.includes('bảy ngày') ||
        normalizedText.includes('cả tuần') ||
        normalizedText.includes('một tuần') ||
        normalizedText.includes('1 tuần') ||
        (normalizedText.includes('tuần') && !normalizedText.includes('nửa'))
      ) {
        daysCount = 7;
      }
      context.days_count = daysCount;

      const preview = await this.generateMealPlanPreviewData(
        context.meals_per_day || 3,
        context.target_calories || 2000,
        context.constraints || {},
        daysCount
      );
      context.preview = preview;

      conversation.current_step = 'waiting_confirmation';
      conversation.status = 'waiting_confirmation';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();

      return {
        message: `Đã hoàn tất đề xuất thực đơn **${daysCount} ngày** (trung bình ~${preview.average_calories} kcal/ngày, phân bổ ${context.meals_per_day || 3} bữa/ngày).\n\nBạn có thể **bấm chọn từng ngày** bên dưới để xem chi tiết thực đơn các bữa ăn nhé!`,
        ui: {
          type: 'meal_plan_preview',
          payload: preview,
        },
        state: {
          flow: 'meal_plan',
          step: 'waiting_confirmation',
          status: 'waiting_confirmation',
        },
      };
    }

    // Step 6: Handle waiting_confirmation (Refine or Confirm)
    if (conversation.current_step === 'waiting_confirmation') {
      const isDirectRefine =
        normalizedText.includes('protein') ||
        normalizedText.includes('đạm') ||
        normalizedText.includes('ít calo') ||
        normalizedText.includes('giảm calo') ||
        normalizedText.includes('bớt calo') ||
        normalizedText.includes('đổi món') ||
        normalizedText.includes('nhanh');

      if (isDirectRefine) {
        // Chuyển trực tiếp sang xử lý điều chỉnh ở Step 7
        conversation.current_step = 'refine_feedback';
      } else if (
        normalizedText.includes('chỉnh sửa') ||
        normalizedText.includes('điều chỉnh') ||
        normalizedText.includes('edit')
      ) {
        conversation.current_step = 'refine_feedback';
        conversation.status = 'collecting';
        conversation.markModified('context_data');
        await conversation.save();

        return {
          message: 'Bạn muốn điều chỉnh yếu tố nào trong thực đơn này?',
          ui: {
            type: 'choice',
            payload: {
              title: 'Chọn tiêu chí bạn muốn điều chỉnh:',
              choices: [
                { label: '📉 Giảm bớt calo (Thực đơn nhẹ hơn)', value: 'ít calo hơn' },
                { label: '💪 Tăng thêm đạm (+Protein)', value: 'tăng protein' },
                { label: '🔄 Đổi thực đơn món khác (Gợi ý lại)', value: 'đổi món khác' },
                { label: '⏱️ Món nấu nhanh gọn (<20 phút)', value: 'nhanh gọn' },
              ],
            },
          },
          state: {
            flow: 'meal_plan',
            step: 'refine_feedback',
            status: 'collecting',
          },
        };
      }

      if (normalizedText.includes('đồng ý') || normalizedText.includes('lưu') || normalizedText === 'confirm') {
        return await this.handleConfirmMealPlanAction(userId, conversation, {});
      }
    }

    // Step 7: Handle Refine feedback -> regenerate preview
    if (conversation.current_step === 'refine_feedback') {
      context.constraints = context.constraints || {};

      if (
        normalizedText.includes('protein') ||
        normalizedText.includes('đạm') ||
        normalizedText.includes('thịt')
      ) {
        context.constraints.higher_protein = true;
      } else if (
        normalizedText.includes('ít calo') ||
        normalizedText.includes('giảm calo') ||
        normalizedText.includes('bớt calo')
      ) {
        context.constraints.lower_calories = true;
      } else if (normalizedText.includes('nhanh') || normalizedText.includes('gọn')) {
        context.constraints.quick_cook = true;
      } else {
        context.constraints.shuffle = true;
      }

      // Giữ NGUYÊN số ngày hiện tại (1 ngày, 3 ngày, hoặc 7 ngày), KHÔNG tự ý đổi thành 3
      const currentDaysCount =
        Number(context.days_count) ||
        Number(context.preview?.days_count) ||
        (Array.isArray(context.preview?.days) ? context.preview.days.length : 0) ||
        1;

      // Nếu người dùng chủ động nói muốn đổi số ngày (ví dụ: "đổi thành 7 ngày")
      const changeDaysMatch = normalizedText.match(/(\b[137]\b)\s*ngày/);
      let targetDays = currentDaysCount;
      if (changeDaysMatch) {
        targetDays = parseInt(changeDaysMatch[1], 10);
      }
      context.days_count = targetDays;

      const preview = await this.generateMealPlanPreviewData(
        context.meals_per_day || 3,
        context.target_calories || 2000,
        context.constraints,
        targetDays
      );
      context.preview = preview;

      conversation.current_step = 'waiting_confirmation';
      conversation.status = 'waiting_confirmation';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();

      return {
        message: `Đã điều chỉnh lại thực đơn **${targetDays} ngày** theo yêu cầu của bạn (ưu tiên ${
          context.constraints.higher_protein
            ? 'giàu đạm/protein'
            : context.constraints.lower_calories
            ? 'ít calo'
            : context.constraints.quick_cook
            ? 'nấu nhanh'
            : 'đổi món mới'
        }). Bạn hãy xem chi tiết bên dưới nhé:`,
        ui: {
          type: 'meal_plan_preview',
          payload: preview,
        },
        state: {
          flow: 'meal_plan',
          step: 'waiting_confirmation',
          status: 'waiting_confirmation',
        },
      };
    }

    // Default fallback
    return {
      message: 'Đang ở chế độ Lập kế hoạch bữa ăn. Bạn có thể bấm xác nhận hoặc chọn chỉnh sửa thực đơn nhé.',
      ui: {
        type: 'choice',
        payload: {
          choices: [
            { label: '✅ Đồng ý, lưu kế hoạch', value: 'confirm' },
            { label: '✏️ Chỉnh sửa', value: 'edit' },
          ],
        },
      },
      state: {
        flow: 'meal_plan',
        step: conversation.current_step,
        status: conversation.status,
      },
    };
  }

  // Helper sinh preview dữ liệu nhiều ngày (1, 3, hoặc 7 ngày)
  async generateMealPlanPreviewData(mealsPerDay, targetCalories, constraints = {}, daysCount = 3) {
    let allRecipes = await Recipe.find({ status: 'approved' }).sort({ created_at: -1 }).limit(25).lean();

    if (constraints.shuffle) {
      allRecipes = allRecipes.sort(() => Math.random() - 0.5);
    } else if (constraints.lower_calories) {
      allRecipes = allRecipes.sort((a, b) => (a.calories_per_serving || 400) - (b.calories_per_serving || 400));
    } else if (constraints.higher_protein) {
      allRecipes = allRecipes.sort((a, b) => (b.protein_g || 20) - (a.protein_g || 20));
    }

    const recipePool =
      allRecipes.length > 0
        ? allRecipes
        : [{ _id: null, title: 'Món ăn dinh dưỡng', calories_per_serving: 500, protein_g: 25, carb_g: 45, fat_g: 15 }];

    const mealTypes =
      mealsPerDay === 2
        ? ['lunch', 'dinner']
        : mealsPerDay === 4
        ? ['breakfast', 'lunch', 'dinner', 'snack']
        : ['breakfast', 'lunch', 'dinner'];
    const days = [];
    const today = new Date();
    let totalCalories = 0;
    let totalAllProtein = 0;
    let totalAllCarbs = 0;
    let totalAllFat = 0;

    const count = Number(daysCount) || 3;

    for (let dayOffset = 0; dayOffset < count; dayOffset++) {
      const planDate = new Date();
      planDate.setDate(today.getDate() + dayOffset + 1);
      const dateStr = planDate.toISOString().split('T')[0];

      const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][planDate.getDay()];
      const formattedDate = `${String(planDate.getDate()).padStart(2, '0')}/${String(planDate.getMonth() + 1).padStart(2, '0')}`;
      const dayLabel = `Ngày ${dayOffset + 1} • ${dayOfWeek} (${formattedDate})`;

      const dayMeals = [];
      let dayCalories = 0;
      let dayProtein = 0;
      let dayCarbs = 0;
      let dayFat = 0;

      for (let i = 0; i < mealTypes.length; i++) {
        const mealType = mealTypes[i];
        const picked = recipePool[(dayOffset * mealTypes.length + i) % recipePool.length];
        const cal = picked.calories_per_serving || 450;
        const prot = picked.protein_g || 20;
        const carb = picked.carb_g || picked.carbs_g || 40;
        const fat = picked.fat_g || 15;

        dayCalories += cal;
        dayProtein += prot;
        dayCarbs += carb;
        dayFat += fat;

        dayMeals.push({
          meal_type: mealType,
          recipe_id: picked._id ? picked._id.toString() : null,
          title: picked.title,
          description: picked.description || '',
          calories: cal,
          protein_g: prot,
          carbs_g: carb,
          fat_g: fat,
          image_url: picked.image_url,
          ingredients: picked.ingredients || [],
          steps: picked.steps || [],
          prep_time_minutes: picked.prep_time_minutes || 10,
          cook_time_minutes: picked.cook_time_minutes || 15,
          servings: picked.servings || 1,
        });
      }

      totalCalories += dayCalories;
      totalAllProtein += dayProtein;
      totalAllCarbs += dayCarbs;
      totalAllFat += dayFat;

      days.push({
        date: dateStr,
        day_label: dayLabel,
        day_calories: dayCalories,
        day_protein_g: Math.round(dayProtein),
        day_carbs_g: Math.round(dayCarbs),
        day_fat_g: Math.round(dayFat),
        meals: dayMeals,
      });
    }

    const avgCal = Math.round(totalCalories / count);
    const avgProt = Math.round(totalAllProtein / count);
    const avgCarb = Math.round(totalAllCarbs / count);
    const avgFat = Math.round(totalAllFat / count);

    const protKcal = avgProt * 4;
    const carbKcal = avgCarb * 4;
    const fatKcal = avgFat * 9;
    const totalMacroKcal = protKcal + carbKcal + fatKcal || 1;

    const protPct = Math.round((protKcal / totalMacroKcal) * 100);
    const carbPct = Math.round((carbKcal / totalMacroKcal) * 100);
    const fatPct = Math.max(0, 100 - protPct - carbPct);

    let explanation = '';
    if (constraints.lower_calories || targetCalories < 1700) {
      explanation = `Thực đơn ${count} ngày được thiết kế thâm hụt calo an toàn (~${avgCal} kcal/ngày), tối ưu đạm (${protPct}%) để bảo toàn khối cơ và hạn chế mỡ thừa. Tỷ lệ chất xơ cao giúp bạn no lâu và tràn đầy sức sống.`;
    } else if (constraints.higher_protein || targetCalories >= 2100) {
      explanation = `Kế hoạch tập trung xây dựng cơ bắp và phục hồi thể lực với mức năng lượng dồi dào (~${avgCal} kcal/ngày) và lượng đạm vượt trội (${avgProt}g/ngày, chiếm ${protPct}% năng lượng). Phân bổ dinh dưỡng tối ưu sau các buổi tập luyện.`;
    } else {
      explanation = `Thực đơn ${count} ngày được cân bằng khoa học theo chuẩn Eat Clean (~${avgCal} kcal/ngày) với tỷ lệ vàng ${protPct}% Đạm - ${carbPct}% Carb - ${fatPct}% Béo lành mạnh. Thực đơn giúp ổn định đường huyết, hỗ trợ tiêu hóa và duy trì thể trạng săn chắc.`;
    }

    return {
      plan_period: `${count} ngày`,
      days_count: count,
      target_calories_per_day: targetCalories,
      average_calories: avgCal,
      explanation,
      nutrition_summary: {
        avg_calories: avgCal,
        target_calories: targetCalories,
        avg_protein_g: avgProt,
        avg_carbs_g: avgCarb,
        avg_fat_g: avgFat,
        protein_pct: protPct,
        carb_pct: carbPct,
        fat_pct: fatPct,
        water_liters: '2.0 - 2.5L',
        fiber_g: '25 - 30g',
      },
      days,
    };
  }

  // =========================================================================
  // WORKFLOW C: GOAL (Extension Point for Quoc)
  // =========================================================================
  async handleGoalWorkflow(userId, conversation, input, normalizedText, aiResolution = null) {
    const context = conversation.context_data || {};
    const saveStep = async (step) => {
      conversation.current_step = step;
      conversation.status = 'collecting';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();
    };

    if (conversation.current_step === 'entry') {
      await saveStep('ask_goal_type');
      return {
        message:
          '🎯 Mình sẽ hỗ trợ bạn thiết lập mục tiêu calo và tỷ lệ dinh dưỡng phù hợp nhất cho cơ thể.\n\nMục tiêu chính hiện tại của bạn là gì?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Chọn mục tiêu của bạn:',
            choices: [
              { label: '🔥 Giảm mỡ / Giảm cân', value: 'goal_lose' },
              { label: '💪 Tăng cơ / Tăng cân', value: 'goal_gain' },
              { label: '⚖️ Duy trì cân nặng', value: 'goal_maintain' },
              { label: '🥗 Cải thiện sức khỏe tổng thể', value: 'goal_health' },
            ],
          },
        },
        state: { flow: 'goal', step: 'ask_goal_type', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'ask_goal_type') {
      let goalType = 'maintain';
      let goalLabel = 'Duy trì cân nặng';
      if (normalizedText.includes('giảm') || normalizedText.includes('lose')) {
        goalType = 'lose';
        goalLabel = 'Giảm mỡ / Giảm cân';
      } else if (normalizedText.includes('tăng') || normalizedText.includes('gain')) {
        goalType = 'gain';
        goalLabel = 'Tăng cơ / Tăng cân';
      } else if (normalizedText.includes('sức khỏe') || normalizedText.includes('health')) {
        goalType = 'improve';
        goalLabel = 'Cải thiện sức khỏe';
      }

      context.goalType = goalType;

      // Tính toán dựa trên hồ sơ người dùng
      let user = null;
      try {
        user = await User.findById(userId).lean();
      } catch (e) {}

      const height_cm = user?.height_cm || 170;
      const weight_kg = user?.weight_kg || 65;
      const gender = user?.gender || 'male';
      const activity_level = user?.activity_level || 'moderate';

      let bmr = 1600;
      let tdee = 2200;
      try {
        let age = 25;
        if (user?.date_of_birth) {
          age = healthService.calculateAge(user.date_of_birth);
        }
        bmr = healthService.calculateBMR({ gender, height_cm, weight_kg, age });
        tdee = healthService.calculateTDEE(bmr, activity_level);
      } catch (e) {
        tdee = user?.target_calories || 2000;
      }

      let targetCal = Math.round(tdee);
      if (goalType === 'lose') {
        targetCal = Math.max(1200, Math.round(tdee - 400));
      } else if (goalType === 'gain') {
        targetCal = Math.round(tdee + 350);
      }

      // Macro calculation: 25% Protein, 50% Carbs, 25% Fat
      const protein_g = Math.round((targetCal * 0.25) / 4);
      const carbs_g = Math.round((targetCal * 0.5) / 4);
      const fat_g = Math.round((targetCal * 0.25) / 9);

      context.target_calories = targetCal;
      context.target_protein_g = protein_g;
      context.target_carb_g = carbs_g;
      context.target_fat_g = fat_g;

      await saveStep('confirm_goal');

      return {
        message:
          `Mình đã ghi nhận mục tiêu **${goalLabel}**. Để tư vấn chính xác theo hồ sơ và thói quen của bạn, hãy tiếp tục trò chuyện với Tri hoặc chọn một thao tác bên dưới.`,
        ui: {
          type: 'choice',
          payload: {
            title: 'Lựa chọn thao tác:',
            choices: [
              { label: '💾 Lưu mục tiêu vào hồ sơ', value: 'save_goal_confirm' },
              { label: '🔄 Chọn lại mục tiêu khác', value: 'thiết lập mục tiêu dinh dưỡng' },
              { label: '🏠 Quay lại menu chính', value: 'menu chính' },
            ],
          },
        },
        state: { flow: 'goal', step: 'confirm_goal', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'confirm_goal') {
      if (normalizedText.includes('lưu') || normalizedText.includes('save') || normalizedText.includes('đồng ý') || normalizedText === 'save_goal_confirm') {
        try {
          await User.findByIdAndUpdate(userId, {
            target_calories: context.target_calories,
            target_protein_g: context.target_protein_g,
            target_carb_g: context.target_carb_g,
            target_fat_g: context.target_fat_g,
            goal: context.goalType,
          });
        } catch (e) {}

        conversation.current_step = 'completed';
        conversation.status = 'completed';
        await conversation.save();

        return {
          message:
            `Đã lưu thành công mục tiêu **${context.target_calories} kcal/ngày** vào hồ sơ cá nhân của bạn! 🎉\n\n` +
            `Trang chủ và nhật ký dinh dưỡng đã được đồng bộ với mục tiêu mới này. Bây giờ bạn muốn làm gì tiếp theo?`,
          ui: {
            type: 'choice',
            payload: {
              title: 'Hành động tiếp theo:',
              choices: [
                { label: '📅 Lên thực đơn theo mục tiêu mới', value: 'Lập kế hoạch bữa ăn' },
                { label: '🍲 Tìm món ăn phù hợp', value: 'Tìm công thức nấu ăn' },
                { label: '🏃 Xem lịch tập vận động', value: 'Luyện tập & vận động' },
                { label: '🏠 Quay lại menu chính', value: 'menu chính' },
              ],
            },
          },
          state: { flow: 'goal', step: 'completed', status: 'completed' },
        };
      }
    }

    return {
      message: 'Bạn có thể bắt đầu thiết lập mục tiêu mới bất cứ lúc nào.',
      ui: null,
      state: { flow: 'goal', step: 'completed', status: 'completed' },
    };
  }

  // =========================================================================
  // WORKFLOW C2: HEALTH (Hỏi về sức khỏe)
  // =========================================================================
  async handleHealthWorkflow(userId, conversation, input, normalizedText) {
    const context = conversation.context_data || {};
    const saveStep = async (step) => {
      conversation.current_step = step;
      conversation.status = 'collecting';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();
    };

    if (conversation.current_step === 'entry') {
      await saveStep('ask_topic');
      return {
        message: 'Mình có thể tư vấn tham khảo về nhiều chủ đề. Bạn đang quan tâm điều gì?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Chọn chủ đề sức khỏe:',
            choices: [
              { label: 'Dinh dưỡng và calo', value: 'health_nutrition' },
              { label: 'Giấc ngủ và phục hồi', value: 'health_sleep' },
              { label: 'Vận động an toàn', value: 'health_exercise' },
              { label: 'Cân nặng và vóc dáng', value: 'health_weight' },
              { label: 'Đường huyết và thói quen ăn uống', value: 'health_glucose' },
              { label: 'Một vấn đề khác', value: 'health_other' },
            ],
          },
        },
        state: { flow: 'health', step: 'ask_topic', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'ask_topic') {
      context.health_topic = normalizedText;
      await saveStep('ask_profile_consent');
      return {
        message: 'Bạn có muốn mình tham khảo dữ liệu hồ sơ để câu trả lời phù hợp hơn không?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Sử dụng dữ liệu hồ sơ?',
            choices: [
              { label: 'Có, dùng dữ liệu của tôi', value: 'health_consent_yes' },
              { label: 'Không cần', value: 'health_consent_no' },
            ],
          },
        },
        state: { flow: 'health', step: 'ask_profile_consent', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'ask_profile_consent') {
      context.profile_consent = normalizedText.includes('có');
      const topic = context.health_topic;
      let advice = 'Hãy duy trì bữa ăn cân bằng, uống đủ nước và theo dõi phản ứng của cơ thể mỗi ngày.';
      if (topic.includes('giấc ngủ')) {
        advice = 'Ưu tiên lịch ngủ đều đặn, hạn chế caffeine sau buổi chiều và giảm màn hình trước khi ngủ 30-60 phút.';
      } else if (topic.includes('vận động')) {
        advice = 'Bắt đầu với cường độ vừa phải, khởi động trước khi tập và dừng lại nếu thấy đau ngực, khó thở hoặc chóng mặt.';
      } else if (topic.includes('cân nặng')) {
        advice = 'Theo dõi xu hướng cân nặng theo tuần, ưu tiên thay đổi nhỏ và bền vững thay vì nhịn ăn hoặc giảm quá nhanh.';
      } else if (topic.includes('đường huyết')) {
        advice = 'Ưu tiên rau, đạm và tinh bột hấp thu chậm; đi bộ nhẹ sau bữa ăn có thể hỗ trợ thói quen kiểm soát đường huyết.';
      }

      conversation.current_step = 'completed';
      conversation.status = 'completed';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();

      return {
        message: `Đây là gợi ý tham khảo cho chủ đề bạn chọn:\n\n${advice}\n\nThông tin này không thay thế chẩn đoán hoặc tư vấn y tế chuyên nghiệp. Nếu bạn có triệu chứng bất thường, hãy liên hệ nhân viên y tế.`,
        ui: {
          type: 'choice',
          payload: {
            title: 'Bạn muốn làm gì tiếp?',
            choices: [
              { label: 'Hỏi chủ đề khác', value: 'Tôi muốn hỏi về sức khỏe và dinh dưỡng.' },
              { label: 'Quay lại menu chính', value: 'menu chính' },
            ],
          },
        },
        state: { flow: 'health', step: 'completed', status: 'completed' },
      };
    }

    return {
      message: 'Bạn có thể bắt đầu một câu hỏi sức khỏe mới bất cứ lúc nào.',
      ui: null,
      state: { flow: 'health', step: 'completed', status: 'completed' },
    };
  }

  // =========================================================================
  // WORKFLOW D: EXERCISE (Extension Point for Quoc)
  // =========================================================================
  async handleExerciseWorkflow(userId, conversation, input, normalizedText, aiResolution = null) {
    const context = conversation.context_data || {};
    const saveStep = async (step) => {
      conversation.current_step = step;
      conversation.status = 'collecting';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();
    };

    if (conversation.current_step === 'entry') {
      await saveStep('ask_goal');
      return {
        message: 'Mình sẽ giúp bạn tạo lịch tập phù hợp. Mục tiêu vận động của bạn là gì?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Mục tiêu vận động của bạn là gì?',
            choices: [
              { label: 'Tăng sức mạnh / cơ bắp', value: 'exercise_strength' },
              { label: 'Giảm cân', value: 'exercise_weight_loss' },
              { label: 'Tăng sức bền (cardio)', value: 'exercise_cardio' },
              { label: 'Duy trì thể lực', value: 'exercise_fitness' },
              { label: 'Sức khỏe tổng thể', value: 'exercise_health' },
              { label: 'Một đáp án khác', value: 'exercise_other' },
            ],
          },
        },
        state: { flow: 'exercise', step: 'ask_goal', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'ask_goal') {
      context.exercise_goal = normalizedText;
      await saveStep('ask_period');
      return {
        message: 'Bạn muốn bắt đầu lịch tập vào thời gian nào?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Chọn thời gian bắt đầu:',
            choices: [
              { label: 'Hôm nay', value: 'exercise_today' },
              { label: 'Ngày mai', value: 'exercise_tomorrow' },
              { label: 'Tuần này', value: 'exercise_this_week' },
              { label: 'Tuần sau', value: 'exercise_next_week' },
              { label: '7 ngày tới', value: 'exercise_next_7_days' },
              { label: 'Một đáp án khác', value: 'exercise_custom_period' },
            ],
          },
        },
        state: { flow: 'exercise', step: 'ask_period', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'ask_period') {
      context.exercise_period = normalizedText;
      await saveStep('ask_frequency');
      return {
        message: 'Bạn muốn tập luyện bao nhiêu buổi mỗi tuần?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Số buổi tập mỗi tuần:',
            choices: [1, 2, 3, 4, 5, 6].map((count) => ({
              label: `${count} buổi/tuần`,
              value: `exercise_${count}_days`,
            })),
          },
        },
        state: { flow: 'exercise', step: 'ask_frequency', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'ask_frequency') {
      context.exercise_frequency = normalizedText;
      await saveStep('ask_health_consent');
      return {
        message:
          'Mình có thể dùng dữ liệu sức khỏe gần đây để giảm cường độ vào những ngày bạn chưa hồi phục tốt. Bạn có đồng ý không?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Dùng dữ liệu sức khỏe?',
            choices: [
              { label: 'Có, sử dụng dữ liệu', value: 'exercise_consent_yes' },
              { label: 'Không cần', value: 'exercise_consent_no' },
              { label: 'Một đáp án khác', value: 'exercise_consent_custom' },
            ],
          },
        },
        state: { flow: 'exercise', step: 'ask_health_consent', status: 'collecting' },
      };
    }

    if (conversation.current_step === 'ask_health_consent') {
      context.health_consent = normalizedText.includes('có') || normalizedText.includes('yes');
      const days = Number((context.exercise_frequency.match(/[1-6]/) || ['3'])[0]);
      const startDate = new Date();
      if (context.exercise_period.includes('ngày mai')) startDate.setDate(startDate.getDate() + 1);
      if (context.exercise_period.includes('tuần sau')) startDate.setDate(startDate.getDate() + 7);

      const goalPlan = context.exercise_goal.includes('giảm cân')
        ? {
            name: 'Cardio đốt mỡ',
            exercises: ['Đi bộ nhanh hoặc đạp xe', 'Squat trọng lượng cơ thể', 'Mountain climber'],
          }
        : context.exercise_goal.includes('sức bền')
          ? {
              name: 'Cardio tăng sức bền',
              exercises: ['Khởi động cardio nhẹ', 'Chạy/đạp xe theo nhịp vừa', 'Interval nhanh - chậm'],
            }
          : context.exercise_goal.includes('sức mạnh') || context.exercise_goal.includes('cơ bắp')
            ? {
                name: 'Sức mạnh toàn thân',
                exercises: ['Squat', 'Chống đẩy', 'Kéo dây hoặc chèo tạ', 'Plank'],
              }
            : {
                name: 'Vận động toàn thân',
                exercises: ['Đi bộ nhẹ', 'Squat', 'Giãn cơ chủ động', 'Plank cơ bản'],
              };
      const activityCatalog = await Activity.find({}).sort({ category: 1, name: 1 }).lean();
      const catalogMatches = context.exercise_goal.includes('giảm cân') || context.exercise_goal.includes('sức bền')
        ? activityCatalog.filter((activity) => activity.category.includes('Cardio'))
        : context.exercise_goal.includes('sức mạnh') || context.exercise_goal.includes('cơ bắp')
          ? activityCatalog.filter((activity) => activity.category.includes('Kháng lực'))
          : activityCatalog;
      const selectedActivities = (catalogMatches.length > 0 ? catalogMatches : activityCatalog).slice(0, 4);

        let profileSnapshot = null;
        let missingProfileFields = [];
        if (context.health_consent) {
          const user = await User.findById(userId)
            .select('gender date_of_birth height_cm weight_kg activity_level goal')
            .lean();
          if (user) {
            profileSnapshot = {
              gender: user.gender || null,
              height_cm: user.height_cm || null,
              weight_kg: user.weight_kg || null,
              activity_level: user.activity_level || null,
              goal: user.goal || null,
            };
            if (!user.gender) missingProfileFields.push('giới tính');
            if (!user.date_of_birth) missingProfileFields.push('ngày sinh');
            if (!user.height_cm) missingProfileFields.push('chiều cao');
            if (!user.weight_kg) missingProfileFields.push('cân nặng');
            if (!user.activity_level) missingProfileFields.push('mức vận động');
            if (missingProfileFields.length === 0) {
              profileSnapshot.metrics = healthService.calculateHealthMetrics(user);
            }
          }
        }

      const sessions = Array.from({ length: days }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index * Math.max(1, Math.floor(7 / days)));
        const catalogActivity = selectedActivities[index % selectedActivities.length];
        return {
          date: date.toISOString().split('T')[0],
          session: index + 1,
          activity: catalogActivity?.name || goalPlan.name,
          activity_id: catalogActivity?._id?.toString() || null,
          met_value: catalogActivity?.met_value || null,
          exercises: catalogActivity ? [] : goalPlan.exercises,
          source: catalogActivity ? 'database' : 'fallback_template',
          warmup: 'Khởi động 5 phút',
          cooldown: 'Thả lỏng và giãn cơ 5 phút',
          intensity: context.health_consent ? 'Vừa phải' : 'Vừa đến khá',
          duration_minutes: context.health_consent
            ? profileSnapshot?.metrics?.bmi >= 30 || profileSnapshot?.activity_level === 'sedentary'
              ? 25
              : 30
            : 40,
        };
      });
      context.exercise_plan = sessions;
      conversation.current_step = 'completed';
      conversation.status = 'completed';
      conversation.context_data = context;
      conversation.markModified('context_data');
      await conversation.save();

      const profileNote = context.health_consent
        ? profileSnapshot?.metrics
          ? 'Mình đã dùng hồ sơ và các chỉ số sức khỏe có thể tính được của bạn.'
          : profileSnapshot
            ? `Mình đã dùng các dữ liệu hồ sơ đang có. Còn thiếu: ${missingProfileFields.join(', ')} nên chưa thể tính BMI/BMR/TDEE.`
            : 'Database chưa có dữ liệu hồ sơ sức khỏe của bạn, nên mình dùng lịch cơ bản an toàn.'
        : 'Mình không sử dụng dữ liệu hồ sơ của bạn.';

      return {
        message: `Đã tạo lịch tập cá nhân hóa cho bạn. ${profileNote} Hãy bắt đầu nhẹ nhàng và điều chỉnh nếu thấy mệt.`,
        ui: {
          type: 'result',
          payload: {
            exercise_guide: {
              activity_name: 'Lịch tập cá nhân hóa',
              goal: context.exercise_goal,
              frequency: `${days} buổi/tuần`,
              health_consent: context.health_consent,
              profile_snapshot: profileSnapshot,
              sessions,
            },
          },
        },
        state: { flow: 'exercise', step: 'completed', status: 'completed' },
      };
    }

    return {
      message: 'Lịch tập của bạn đã được tạo. Bạn có thể bắt đầu lại để lập lịch mới.',
      ui: { type: 'choice', payload: { title: 'Bạn muốn làm gì tiếp?', choices: [{ label: 'Lập lịch mới', value: 'Luyện tập & vận động' }, { label: 'Quay lại menu chính', value: 'menu chính' }] } },
      state: { flow: 'exercise', step: 'completed', status: 'completed' },
    };
  }

  // =========================================================================
  // ACTION HANDLERS
  // =========================================================================

  // Action: view_recipe -> Mở chi tiết recipe (Không đổi DB)
  async handleViewRecipeAction(userId, conversation, data) {
    const { recipe_id } = data;
    if (!recipe_id) return null;

    const recipe = await Recipe.findById(recipe_id).lean();
    if (!recipe) {
      return {
        message: 'Rất tiếc, không tìm thấy công thức này.',
        ui: null,
        state: { flow: 'recipe', step: 'recipe_action', status: 'collecting' },
      };
    }

    return {
      message: `Đây là chi tiết công thức món "${recipe.title}". Bạn có thể xem nguyên liệu và các bước làm bên dưới:`,
      ui: {
        type: 'recipe_detail',
        payload: {
          recipe: {
            id: recipe._id.toString(),
            title: recipe.title,
            description: recipe.description,
            image_url: recipe.image_url,
            calories: recipe.calories_per_serving,
            protein: recipe.protein_g,
            carbs: recipe.carbs_g,
            fat: recipe.fat_g,
            cook_time_minutes: recipe.cook_time_minutes,
            prep_time_minutes: recipe.prep_time_minutes,
            servings: recipe.servings,
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
          },
        },
      },
      state: {
        flow: 'recipe',
        step: 'recipe_detail',
        status: 'collecting',
      },
    };
  }

  // Action: save_recipe -> Lưu vào bộ sưu tập cá nhân
  async handleSaveRecipeAction(userId, conversation, data) {
    const { recipe_id, collection_name } = data;
    if (!recipe_id) return null;

    const result = await recipeService.toggleSaveRecipe(userId, recipe_id, collection_name || 'Món ăn yêu thích');
    const msg = result.isSaved
      ? 'Đã lưu món ăn vào bộ sưu tập của bạn thành công! ⭐'
      : 'Đã bỏ lưu món ăn khỏi bộ sưu tập.';

    return {
      message: msg,
      ui: null,
      state: {
        flow: conversation.current_flow,
        step: conversation.current_step,
        status: 'collecting',
      },
    };
  }

  // Action: add_to_meal_plan -> Thêm 1 recipe vào 1 ngày/bữa cụ thể
  async handleAddToMealPlanAction(userId, conversation, data) {
    const { recipe_id, plan_date, meal_type } = data;
    if (!recipe_id) return null;

    const dateToUse = plan_date || new Date().toISOString().split('T')[0];
    const mealTypeToUse = meal_type || 'lunch';

    const newPlan = await mealPlanService.addMealPlanItem(userId, {
      plan_date: dateToUse,
      meal_type: mealTypeToUse,
      recipe_id,
      source: 'recipe',
    });

    const recipe = await Recipe.findById(recipe_id).select('title').lean();
    const recipeTitle = recipe ? `"${recipe.title}"` : 'Món ăn';

    return {
      message: `Tuyệt vời! Đã thêm ${recipeTitle} vào bữa ${mealTypeToUse} ngày ${dateToUse} trong kế hoạch ăn uống của bạn.`,
      ui: null,
      state: {
        flow: 'recipe',
        step: 'recipe_action',
        status: 'completed',
      },
    };
  }

  // Action: refine_recommendation -> Điều chỉnh tiêu chí lập kế hoạch
  async handleRefineRecommendationAction(userId, conversation, data) {
    const context = conversation.context_data || {};

    // Nếu người dùng bấm nút "Chỉnh sửa" mà chưa chỉ định tiêu chí, hiển thị các lựa chọn điều chỉnh
    if (!data || !data.constraints || Object.keys(data.constraints).length === 0) {
      conversation.current_step = 'refine_feedback';
      conversation.status = 'collecting';
      conversation.markModified('context_data');
      await conversation.save();

      return {
        message: 'Bạn muốn điều chỉnh yếu tố nào trong thực đơn này?',
        ui: {
          type: 'choice',
          payload: {
            title: 'Chọn tiêu chí bạn muốn điều chỉnh:',
            choices: [
              { label: '📉 Giảm bớt calo (Thực đơn nhẹ hơn)', value: 'ít calo hơn' },
              { label: '💪 Tăng thêm đạm (+Protein)', value: 'tăng protein' },
              { label: '🔄 Đổi thực đơn món khác (Gợi ý lại)', value: 'đổi món khác' },
              { label: '⏱️ Món nấu nhanh gọn (<20 phút)', value: 'nhanh gọn' },
            ],
          },
        },
        state: {
          flow: 'meal_plan',
          step: 'refine_feedback',
          status: 'collecting',
        },
      };
    }

    context.constraints = { ...(context.constraints || {}), ...(data.constraints || {}) };

    const currentDaysCount =
      Number(context.days_count) ||
      Number(context.preview?.days_count) ||
      (Array.isArray(context.preview?.days) ? context.preview.days.length : 0) ||
      1;
    context.days_count = currentDaysCount;

    const preview = await this.generateMealPlanPreviewData(
      context.meals_per_day || 3,
      context.target_calories || 2000,
      context.constraints,
      currentDaysCount
    );
    context.preview = preview;

    conversation.context_data = context;
    conversation.markModified('context_data');
    await conversation.save();

    return {
      message: 'Đã cập nhật lại thực đơn đề xuất theo yêu cầu của bạn:',
      ui: {
        type: 'meal_plan_preview',
        payload: preview,
      },
      state: {
        flow: 'meal_plan',
        step: 'waiting_confirmation',
        status: 'waiting_confirmation',
      },
    };
  }

  // Action: confirm_meal_plan -> Xác nhận và Bulk Insert vào MongoDB meal_plans
  async handleConfirmMealPlanAction(userId, conversation, data) {
    const context = conversation.context_data || {};
    const preview = context.preview;

    if (!preview || !preview.days || preview.days.length === 0) {
      return {
        message: 'Hiện chưa có thực đơn đề xuất để lưu. Bạn hãy bắt đầu chọn "Lập kế hoạch bữa ăn" nhé.',
        ui: null,
        state: { flow: 'meal_plan', step: 'entry', status: 'collecting' },
      };
    }

    // Biến đổi các bữa từ preview thành flat list để bulk insert
    const itemsToInsert = [];
    for (const day of preview.days) {
      for (const meal of day.meals) {
        if (meal.recipe_id) {
          itemsToInsert.push({
            plan_date: day.date,
            meal_type: meal.meal_type,
            recipe_id: meal.recipe_id,
            source: 'recipe',
          });
        }
      }
    }

    // Bulk save qua MealPlanService
    const createdPlans = await mealPlanService.bulkAddMealPlanItems(userId, itemsToInsert);

    // Cập nhật trạng thái conversation sang completed
    conversation.current_step = 'completed';
    conversation.status = 'completed';
    conversation.context_data = { ...context, saved_plan_count: createdPlans.length };
    await conversation.save();

    return {
      message: `🎉 Chúc mừng bạn! Đã lưu thành công toàn bộ thực đơn gồm ${createdPlans.length} bữa ăn vào mục Kế hoạch (Meal Plan) của bạn.\n\nBạn có thể mở tab "Kế hoạch" bất cứ lúc nào để theo dõi và nấu ăn nhé!`,
      ui: {
        type: 'confirm',
        payload: {
          success: true,
          saved_count: createdPlans.length,
          period: preview.plan_period,
        },
      },
      state: {
        flow: 'meal_plan',
        step: 'completed',
        status: 'completed',
      },
    };
  }

  // Placeholder action cho Quoc
  async handleQuocGoalAction(userId, conversation, data) {
    return {
      message: 'Tính năng thiết lập mục tiêu chi tiết đang được Quoc kết nối.',
      ui: null,
      state: { flow: 'goal', step: 'waiting_confirmation', status: 'collecting' },
    };
  }

  // Placeholder action cho Quoc
  async handleQuocExerciseAction(userId, conversation, data) {
    return {
      message: 'Tính năng bài tập & video đang được Quoc kết nối.',
      ui: null,
      state: { flow: 'exercise', step: 'waiting_confirmation', status: 'collecting' },
    };
  }

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================

  sanitizeUiType(rawType) {
    const validUiTypes = [
      'text',
      'choice',
      'number',
      'confirm',
      'action',
      'recipe_list',
      'recipe_detail',
      'meal_plan_preview',
      'result',
    ];
    if (typeof rawType === 'string' && validUiTypes.includes(rawType.toLowerCase())) {
      return rawType.toLowerCase();
    }
    return null;
  }

  extractContentFromInput(input) {
    if (!input) return '';
    if (input.type === 'text') return String(input.value || '');
    if (input.type === 'choice') return String(input.value || '');
    if (input.type === 'number') return `Số lượng: ${input.value}`;
    if (input.type === 'confirm') return input.value ? 'Đồng ý' : 'Hủy bỏ';
    if (input.type === 'action') {
      const actionName = input.value?.action;
      const title = input.value?.data?.title;
      if (actionName === 'save_recipe') return title ? `⭐ Lưu món: ${title}` : '⭐ Lưu món vào bộ sưu tập';
      if (actionName === 'add_to_meal_plan') return title ? `📅 Thêm vào kế hoạch: ${title}` : '📅 Thêm vào kế hoạch';
      return `[Action: ${actionName || 'Thao tác'}]`;
    }
    return JSON.stringify(input.value);
  }

  async saveAndFormatAIResponse(conversation, aiOutput) {
    const safeUiType = this.sanitizeUiType(aiOutput.ui?.type);
    const aiMsg = await ChatMessage.create({
      conversation_id: conversation._id,
      sender: 'ai',
      role: 'assistant',
      content: aiOutput.message,
      ui_type: safeUiType,
      ui_payload: safeUiType ? aiOutput.ui?.payload || null : null,
      created_at: new Date(),
    });

    return {
      success: true,
      data: {
        conversation_id: conversation._id.toString(),
        message: {
          id: aiMsg._id.toString(),
          role: 'assistant',
          content: aiMsg.content,
          created_at: aiMsg.created_at.toISOString(),
        },
        ui: aiOutput.ui || null,
        state: aiOutput.state || {
          flow: conversation.current_flow,
          step: conversation.current_step,
          status: conversation.status,
        },
      },
    };
  }

  formatResponse(conversation, assistantMessage) {
    return {
      success: true,
      data: {
        conversation_id: conversation._id.toString(),
        message: {
          id: assistantMessage._id.toString(),
          role: 'assistant',
          content: assistantMessage.content,
          created_at: new Date(assistantMessage.created_at).toISOString(),
        },
        ui: assistantMessage.ui_type
          ? {
              type: assistantMessage.ui_type,
              payload: assistantMessage.ui_payload,
            }
          : null,
        state: {
          flow: conversation.current_flow,
          step: conversation.current_step,
          status: conversation.status,
        },
      },
    };
  }
}

module.exports = new ChatWorkflowService();
