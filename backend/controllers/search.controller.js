const searchService = require('../services/search.service');

class SearchController {
  /**
   * GET /api/search?q=...&tab=recipes|ingredients|posts|users
   */
  async search(req, res) {
    try {
      const q = req.query.q || '';
      const tab = req.query.tab || 'recipes';
      const userId = req.user ? req.user.id || req.user._id : null;

      const results = await searchService.search({ q, tab, userId });
      return res.json({
        success: true,
        data: results,
      });
    } catch (err) {
      console.error('Lỗi searchController:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi tìm kiếm dữ liệu',
      });
    }
  }
}

module.exports = new SearchController();
