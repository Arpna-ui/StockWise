/**
 * StockWise - Portfolio & Analytics Controller
 */

import {
  getUserPortfolioDetails,
  getPortfolioAnalytics,
  getPortfolioHistory,
  recordPortfolioSnapshot,
} from '../services/portfolioService.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get user's complete virtual portfolio, active holdings, and sector breakdown
 * @route   GET /api/portfolio
 * @access  Private
 */
export const getPortfolio = async (req, res, next) => {
  try {
    const portfolioDetails = await getUserPortfolioDetails(req.user._id);

    return successResponse(
      res,
      portfolioDetails,
      'Portfolio details retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get advanced portfolio analytics (best/worst performers, distribution, concentration)
 * @route   GET /api/portfolio/analytics
 * @access  Private
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getPortfolioAnalytics(req.user._id);

    return successResponse(
      res,
      analytics,
      'Portfolio analytics retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get historical portfolio performance curve (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
 * @route   GET /api/portfolio/history
 * @access  Private
 */
export const getHistory = async (req, res, next) => {
  try {
    const { timeframe } = req.query;
    const history = await getPortfolioHistory(req.user._id, timeframe);

    return successResponse(
      res,
      history,
      `Portfolio performance history (${history.timeframe}) retrieved successfully`
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create an on-demand snapshot of user's portfolio
 * @route   POST /api/portfolio/snapshot
 * @access  Private
 */
export const createSnapshot = async (req, res, next) => {
  try {
    const snapshot = await recordPortfolioSnapshot(req.user._id);

    return successResponse(
      res,
      snapshot,
      'Portfolio snapshot captured successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};
