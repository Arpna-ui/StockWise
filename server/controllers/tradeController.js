/**
 * StockWise - Virtual Stock Trading Controller
 */

import { executeBuyOrder, executeSellOrder, getUserHoldingForStock } from '../services/tradeService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Execute BUY order for a stock
 * @route   POST /api/trade/buy
 * @access  Private
 */
export const handleBuyOrder = async (req, res, next) => {
  try {
    const { symbol, quantity, orderType, limitPrice } = req.body;

    const receipt = await executeBuyOrder({
      userId: req.user._id,
      symbol,
      quantity,
      orderType,
      limitPrice,
    });

    return successResponse(
      res,
      receipt,
      `Buy order executed successfully: ${receipt.quantity} shares of ${receipt.symbol} @ ₹${receipt.executionPrice.toFixed(2)}`,
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 400);
  }
};

/**
 * @desc    Execute SELL order for an owned stock
 * @route   POST /api/trade/sell
 * @access  Private
 */
export const handleSellOrder = async (req, res, next) => {
  try {
    const { symbol, quantity, orderType, limitPrice } = req.body;

    const receipt = await executeSellOrder({
      userId: req.user._id,
      symbol,
      quantity,
      orderType,
      limitPrice,
    });

    return successResponse(
      res,
      receipt,
      `Sell order executed successfully: ${receipt.quantity} shares of ${receipt.symbol} @ ₹${receipt.executionPrice.toFixed(2)}`,
      200
    );
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 400);
  }
};

/**
 * @desc    Get current user's holding information for a specific stock ticker
 * @route   GET /api/trade/holding/:symbol
 * @access  Private
 */
export const getUserHolding = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const holding = await getUserHoldingForStock(req.user._id, symbol);

    return successResponse(res, holding, 'Holding information retrieved successfully');
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 400);
  }
};
