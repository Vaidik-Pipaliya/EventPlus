import * as dashboardService from '../services/dashboard.service.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user._id);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};
