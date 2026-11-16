import { Watchlist } from '../models/Watchlist.js';
import { Stock } from '../models/Stock.js';
import { ensureUserPortfolio } from '../services/portfolioService.js';
import { getStockDetails } from '../services/stockService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get user's custom watchlists with populated stock quotes
 * @route   GET /api/watchlists
 * @access  Private
 */
export const getWatchlists = async (req, res, next) => {
  try {
    // Ensure default watchlists exist for the user
    await ensureUserPortfolio(req.user._id);

    const userWatchlists = await Watchlist.find({ user: req.user._id });

    // Populate live prices and metrics for each stock symbol in the watchlist
    const populated = await Promise.all(
      userWatchlists.map(async (wl) => {
        const stockItems = await Promise.all(
          (wl.stocks || []).map(async (sym) => {
            const cleanSym = sym.toUpperCase();
            const detail = await getStockDetails(cleanSym);

            if (detail) {
              return {
                symbol: detail.symbol,
                name: detail.name,
                price: Number(detail.price),
                change: Number(detail.change || 0),
                changePercent: Number(detail.changePercent || 0),
                sector: detail.sector || 'Equities',
                exchange: detail.exchange || 'NSE',
                dayHigh: detail.dayHigh || detail.price,
                dayLow: detail.dayLow || detail.price,
                volume: detail.volume || '1.2M',
              };
            }

            const dbStock = await Stock.findOne({ symbol: cleanSym });
            return (
              dbStock || {
                symbol: cleanSym,
                name: cleanSym,
                price: 1000.0,
                change: 0,
                changePercent: 0,
                sector: 'Equities',
                exchange: 'NSE',
                dayHigh: 1000.0,
                dayLow: 1000.0,
                volume: '1M',
              }
            );
          })
        );

        return {
          id: wl._id,
          name: wl.name,
          isDefault: wl.isDefault,
          stocks: stockItems,
        };
      })
    );

    return successResponse(res, populated, 'Watchlists retrieved successfully', 200, {
      count: populated.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new custom watchlist
 * @route   POST /api/watchlists
 * @access  Private
 */
export const createWatchlist = async (req, res, next) => {
  try {
    const { name, stocks } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Watchlist name is required.', 400);
    }

    const existing = await Watchlist.findOne({
      user: req.user._id,
      name: name.trim(),
    });

    if (existing) {
      return errorResponse(res, `A watchlist named "${name}" already exists.`, 400);
    }

    const newWl = await Watchlist.create({
      user: req.user._id,
      name: name.trim(),
      stocks: Array.isArray(stocks) ? stocks.map((s) => s.toUpperCase()) : [],
      isDefault: false,
    });

    return successResponse(res, newWl, 'Watchlist created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a custom watchlist
 * @route   DELETE /api/watchlists/:id
 * @access  Private
 */
export const deleteWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const watchlist = await Watchlist.findById(id);
    if (!watchlist) {
      return errorResponse(res, 'Watchlist not found.', 404);
    }

    // Verify user ownership
    if (watchlist.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to delete this watchlist.', 403);
    }

    // Protect default platform watchlist
    if (watchlist.isDefault) {
      return errorResponse(res, 'Cannot delete the default platform watchlist.', 400);
    }

    if (typeof watchlist.deleteOne === 'function') {
      await watchlist.deleteOne();
    } else {
      await Watchlist.findByIdAndDelete(id);
    }

    return successResponse(
      res,
      null,
      `Watchlist "${watchlist.name}" deleted successfully.`
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add a stock symbol to a specific watchlist
 * @route   POST /api/watchlists/:id/stocks
 * @access  Private
 */
export const addStockToWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { symbol } = req.body;

    if (!symbol) {
      return errorResponse(res, 'Ticker symbol is required.', 400);
    }

    const watchlist = await Watchlist.findById(id);
    if (!watchlist) {
      return errorResponse(res, 'Watchlist not found.', 404);
    }

    // Verify user ownership
    if (watchlist.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to modify this watchlist.', 403);
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    if (!watchlist.stocks.includes(cleanSymbol)) {
      watchlist.stocks.push(cleanSymbol);
      await watchlist.save();
    }

    return successResponse(
      res,
      watchlist,
      `${cleanSymbol} added to watchlist ${watchlist.name}`
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove a stock symbol from a specific watchlist
 * @route   DELETE /api/watchlists/:id/stocks/:symbol
 * @access  Private
 */
export const removeStockFromWatchlist = async (req, res, next) => {
  try {
    const { id, symbol } = req.params;

    const watchlist = await Watchlist.findById(id);
    if (!watchlist) {
      return errorResponse(res, 'Watchlist not found.', 404);
    }

    // Verify user ownership
    if (watchlist.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to modify this watchlist.', 403);
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    watchlist.stocks = watchlist.stocks.filter((s) => s !== cleanSymbol);
    await watchlist.save();

    return successResponse(
      res,
      watchlist,
      `${cleanSymbol} removed from watchlist ${watchlist.name}`
    );
  } catch (err) {
    next(err);
  }
};
