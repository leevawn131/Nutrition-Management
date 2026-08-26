// Có thể giữ để tham khảo, hoặc bỏ qua
const RANK_THRESHOLDS = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  Platinum: 600,
  Diamond: 1000
};

function getRank(points) {
  if (points >= RANK_THRESHOLDS.Diamond) return 'Diamond';
  if (points >= RANK_THRESHOLDS.Platinum) return 'Platinum';
  if (points >= RANK_THRESHOLDS.Gold) return 'Gold';
  if (points >= RANK_THRESHOLDS.Silver) return 'Silver';
  return 'Bronze';
}

module.exports = { getRank, RANK_THRESHOLDS };