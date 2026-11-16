/**
 * StockWise - Stock & Market Data Controller
 */

import {
  queryStocks,
  getStockDetails,
  getMarketIndices,
  getMarketSectionsSummary,
  getStockHistory,
} from '../services/stockService.js';
import { getIndianMarketStatus } from '../utils/marketHours.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get listed equities with search, section tabs, sector filters, exchange filters, sorting, and pagination
 * @route   GET /api/stocks
 * @access  Public
 */
export const getStocks = async (req, res, next) => {
  try {
    const { search, section, sector, exchange, sort, order, page, limit } = req.query;

    const result = await queryStocks({
      search,
      section,
      sector,
      exchange,
      sort,
      order,
      page,
      limit,
    });

    const meta = {
      pagination: result.pagination,
      marketStatus: result.marketStatus,
      dataSource: result.dataSource,
      dataSourceLabel: result.dataSourceLabel,
    };

    return successResponse(res, result.stocks, 'Stocks retrieved successfully', 200, {
      ...meta,
      meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get curated market sections summary (Top Gainers, Top Losers, Most Active, Sectors, Indices)
 * @route   GET /api/stocks/sections
 * @access  Public
 */
export const getSectionsSummary = async (req, res, next) => {
  try {
    const summary = await getMarketSectionsSummary();
    return successResponse(res, summary, 'Market sections summary retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get major Indian market indices (NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT)
 * @route   GET /api/stocks/indices
 * @access  Public
 */
export const getIndices = async (req, res, next) => {
  try {
    const indices = await getMarketIndices();
    return successResponse(res, indices, 'Market indices retrieved successfully', 200, {
      count: indices.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Indian stock market operating hours & real-time status
 * @route   GET /api/stocks/market-status
 * @access  Public
 */
export const getMarketStatusController = async (req, res, next) => {
  try {
    const status = getIndianMarketStatus();
    return successResponse(res, status, 'Indian market status retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get historical chart price series for specific timeframe (1D, 1W, 1M, 3M, 6M, 1Y)
 * @route   GET /api/stocks/:symbol/history
 * @access  Public
 */
export const getStockHistoryController = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeframe } = req.query;

    const history = await getStockHistory(symbol, timeframe);
    if (!history) {
      return errorResponse(res, `Stock ticker ${symbol.toUpperCase()} not found`, 404);
    }

    return successResponse(res, history, `Historical chart data (${history.timeframe}) retrieved successfully`);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get individual stock details by ticker symbol
 * @route   GET /api/stocks/:symbol
 * @access  Public
 */
export const getStockBySymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const stock = await getStockDetails(symbol);

    if (!stock) {
      return errorResponse(res, `Stock ticker ${symbol.toUpperCase()} not found`, 404);
    }

    return successResponse(res, stock, 'Stock details retrieved successfully');
  } catch (err) {
    next(err);
  }
};
