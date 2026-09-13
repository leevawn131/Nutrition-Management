const express = require('express');
const router = express.Router();
const multer = require('multer');
const mealController = require('../controllers/meal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Configure multer in-memory storage for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận tệp định dạng hình ảnh!'), false);
    }
  },
});

// All meal routes require authentication
router.use(authMiddleware);

// AI Vision analyze image
router.post('/analyze-image', upload.single('image'), mealController.analyzeImage);

// AI Vision analyze text description
router.post('/analyze-text', mealController.analyzeText);

// Calculate ingredients nutrition
router.post('/calculate-ingredients', mealController.calculateIngredients);

// Create meal log
router.post('/', mealController.createMealLog);

// Get user meal logs
router.get('/', mealController.getMealLogs);

module.exports = router;
