const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const jwt = require('jsonwebtoken');

// Optional auth helper: if token provided, set req.user
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        req.user = { id: decoded.id };
      }
    } catch (e) {
      // ignore invalid token
    }
  }
  next();
};

// GET /api/activities - List standard activities
router.get('/', activityController.getActivities);

// GET /api/activities/logs - Get activity logs for date
router.get('/logs', optionalAuth, activityController.getActivityLogs);

// POST /api/activities/logs - Add an activity log
router.post('/logs', optionalAuth, activityController.addActivityLog);

// DELETE /api/activities/logs/:id - Delete an activity log
router.delete('/logs/:id', optionalAuth, activityController.deleteActivityLog);

module.exports = router;
