import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/services/storage.service';

export interface DailyMission {
  id: string;
  title: string;
  icon: string;
  iconBg: string;
  current: number;
  target: number;
  unit?: string;
  points: number;
  completed: boolean;
  claimed: boolean;
  type: 'action' | 'checkin';
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'Đồng' | 'Bạc' | 'Vàng';
  category: string;
  points: number;
  progress: number;
  maxProgress: number;
  progressText: string;
  unlocked: boolean;
  canClaim?: boolean;
}

export interface StreakDay {
  day: number;
  dateString: string;
  status: 'completed' | 'freeze' | 'missed' | 'today' | 'future';
  isToday: boolean;
  hasMeal: boolean;
}

export interface GamificationOverviewData {
  points: number;
  rank: string;
  current_streak: number;
  longest_streak: number;
  freezes: number;
  referral_code: string;
  missions: DailyMission[];
  badges: BadgeItem[];
  streakCalendar: StreakDay[];
  nextMilestone: {
    target: number;
    daysLeft: number;
  };
}

export interface PointHistoryItem {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface PointHistoryData {
  totalPoints: number;
  logs: PointHistoryItem[];
}

export const gamificationService = {
  /**
   * Lấy toàn bộ tổng quan Gamification
   */
  async getOverview(): Promise<GamificationOverviewData | null> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/gamification/overview`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        return resData.data;
      }
      return null;
    } catch (error) {
      console.warn('Lỗi getGamificationOverview:', error);
      return null;
    }
  },

  /**
   * Điểm danh hôm nay nhận 5 điểm
   */
  async checkInToday(): Promise<{ success: boolean; pointsAwarded?: number; message?: string }> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/gamification/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        const pts = resData.data?.pointsAdded || resData.data?.pointsAwarded || 5;
        return { success: true, pointsAwarded: pts, message: resData.data?.message };
      }
      return { success: false, message: resData.message || 'Điểm danh không thành công' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Nhận thưởng nhiệm vụ ngày
   */
  async claimMissionReward(missionId: string): Promise<{ success: boolean; pointsAwarded?: number; message?: string }> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/gamification/claim-mission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ missionId }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        const pts = resData.data?.reward || resData.data?.pointsAwarded || 10;
        return { success: true, pointsAwarded: pts, message: resData.data?.message };
      }
      return { success: false, message: resData.message || 'Nhận thưởng không thành công' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Mở khoá / Nhận thưởng danh hiệu (claim badge)
   */
  async claimBadge(badgeId: string): Promise<{ success: boolean; pointsAwarded?: number; message?: string }> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/gamification/claim-badge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ badgeId }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        const pts = resData.data?.pointsAdded || 50;
        return { success: true, pointsAwarded: pts, message: resData.data?.message || resData.message };
      }
      return { success: false, message: resData.message || 'Chưa đủ điều kiện mở khoá danh hiệu' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Nhập mã giới thiệu
   */
  async applyReferralCode(code: string): Promise<{ success: boolean; message: string; pointsAwarded?: number }> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/gamification/referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        return { success: true, message: resData.data.message, pointsAwarded: resData.data.pointsAwarded };
      }
      return { success: false, message: resData.message || 'Mã giới thiệu không hợp lệ' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Lấy lịch sử biến động điểm
   */
  async getPointHistory(): Promise<PointHistoryData> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/gamification/point-history`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        if (Array.isArray(resData.data)) {
          return { totalPoints: 0, logs: resData.data };
        }
        return {
          totalPoints: resData.data?.totalPoints ?? 0,
          logs: resData.data?.logs || [],
        };
      }
      return { totalPoints: 0, logs: [] };
    } catch (error) {
      console.warn('Lỗi getPointHistory:', error);
      return { totalPoints: 0, logs: [] };
    }
  },
};
