const gamificationService = require('../services/gamification.service');

// @desc    Lấy tổng quan Gamification (điểm, rank, streak, nhiệm vụ ngày, huy hiệu, mã giới thiệu)
// @route   GET /api/gamification/overview
// @access  Private
exports.getOverview = async (req, res) => {
  try {
    const data = await gamificationService.getGamificationOverview(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Điểm danh hằng ngày nhận 5 điểm
// @route   POST /api/gamification/check-in
// @access  Private
exports.dailyCheckIn = async (req, res) => {
  try {
    const result = await gamificationService.dailyCheckIn(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Nhận thưởng nhiệm vụ hàng ngày
// @route   POST /api/gamification/claim-mission
// @access  Private
exports.claimMission = async (req, res) => {
  try {
    const { missionId } = req.body;
    if (!missionId) {
      return res.status(400).json({ success: false, message: 'missionId is required' });
    }
    const result = await gamificationService.claimMissionReward(req.user.id, missionId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Mở khoá / nhận thưởng danh hiệu
// @route   POST /api/gamification/claim-badge
// @access  Private
exports.claimBadge = async (req, res) => {
  try {
    const { badgeId } = req.body;
    if (!badgeId) {
      return res.status(400).json({ success: false, message: 'badgeId is required' });
    }
    const result = await gamificationService.claimBadge(req.user.id, badgeId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Nhập mã giới thiệu bạn bè
// @route   POST /api/gamification/referral
// @access  Private
exports.applyReferral = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã giới thiệu' });
    }
    const result = await gamificationService.applyReferralCode(req.user.id, code);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Lịch sử tích lũy / trừ điểm
// @route   GET /api/gamification/point-history
// @access  Private
exports.getPointHistory = async (req, res) => {
  try {
    const logs = await gamificationService.getPointHistory(req.user.id);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
