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

// Configure multer in-memory storage for handling audio uploads
const audioUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'video/mp4' ||
      file.originalname.match(/\.(m4a|mp3|wav|webm|ogg|aac|mp4)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận tệp định dạng âm thanh (audio)!'), false);
    }
  },
});

// All meal routes require authentication
router.use(authMiddleware);

// AI Vision analyze image(s) (supports single or multiple images)
router.post('/analyze-image', upload.any(), mealController.analyzeImage);

// AI Vision analyze text description
router.post('/analyze-text', mealController.analyzeText);

// AI analyze voice audio or transcript
router.post('/analyze-voice', audioUpload.single('audio'), mealController.analyzeVoice);

// AI transcribe voice audio to text
router.post('/transcribe-voice', audioUpload.single('audio'), mealController.transcribeVoice);

// Calculate ingredients nutrition
router.post('/calculate-ingredients', mealController.calculateIngredients);

// Create meal log
router.post('/', mealController.createMealLog);

// Get user meal logs
router.get('/', mealController.getMealLogs);

// Update meal log portion and macros
router.put('/:id', mealController.updateMealLog);

// Delete meal log
router.delete('/:id', mealController.deleteMealLog);

module.exports = router;
