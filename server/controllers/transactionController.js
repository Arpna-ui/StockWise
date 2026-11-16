import { Transaction } from '../models/Transaction.js';
import { ensureUserPortfolio } from '../services/portfolioService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get user's transaction history with search, type filters, date filters, sorting, and pagination
 * @route   GET /api/transactions
 * @access  Private
 */
export const getTransactions = async (req, res, next) => {
  try {
    // Ensure initial welcome capital credit exists
    await ensureUserPortfolio(req.user._id);

    const {
      type,
      search,
      startDate,
      endDate,
      dateRange,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    // Base query scoped strictly to authenticated user
    const query = { user: req.user._id };

    // Fetch all user transactions from repository
    let allUserTxns = await Transaction.find(query);

    // 1. Filter by Action Type (BUY, SELL, CREDIT, DEBIT)
    if (type && type !== 'ALL') {
      const cleanType = type.toUpperCase();
      allUserTxns = allUserTxns.filter((t) => t.type === cleanType);
    }

    // 2. Filter by Search Keyword (Symbol, Company Name, Order ID, or Notes)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allUserTxns = allUserTxns.filter((t) => {
        const idStr = t._id ? t._id.toString().toLowerCase() : '';
        const symStr = t.symbol ? t.symbol.toLowerCase() : '';
        const compStr = t.companyName ? t.companyName.toLowerCase() : '';
        const notesStr = t.notes ? t.notes.toLowerCase() : '';
        return (
          idStr.includes(q) ||
          symStr.includes(q) ||
          compStr.includes(q) ||
          notesStr.includes(q)
        );
      });
    }

    // 3. Filter by Date Range Preset or Custom Start/End Dates
    const now = new Date();
    let filterStart = null;
    let filterEnd = null;

    if (dateRange && dateRange !== 'all') {
      if (dateRange === 'today') {
        filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === '7d') {
        filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        filterStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '90d') {
        filterStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
    }

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) filterStart = parsedStart;
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) {
        // Set to end of the day 23:59:59.999
        parsedEnd.setHours(23, 59, 59, 999);
        filterEnd = parsedEnd;
      }
    }

    if (filterStart) {
      allUserTxns = allUserTxns.filter((t) => {
        const tDate = new Date(t.executionDate || t.createdAt);
        return tDate >= filterStart;
      });
    }

    if (filterEnd) {
      allUserTxns = allUserTxns.filter((t) => {
        const tDate = new Date(t.executionDate || t.createdAt);
        return tDate <= filterEnd;
      });
    }

    // 4. Sorting
    allUserTxns.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'totalAmount') {
        valA = Number(a.totalAmount) || 0;
        valB = Number(b.totalAmount) || 0;
      } else if (sortBy === 'quantity') {
        valA = Number(a.quantity) || 0;
        valB = Number(b.quantity) || 0;
      } else if (sortBy === 'price') {
        valA = Number(a.price) || 0;
        valB = Number(b.price) || 0;
      } else if (sortBy === 'symbol') {
        valA = a.symbol || '';
        valB = b.symbol || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        // Default sort by date
        valA = new Date(a.executionDate || a.createdAt).getTime();
        valB = new Date(b.executionDate || b.createdAt).getTime();
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    // 5. Ledger Turnover Summaries (calculated over all matched records)
    let totalBuyTurnover = 0;
    let totalSellTurnover = 0;
    allUserTxns.forEach((t) => {
      if (t.type === 'BUY') totalBuyTurnover += Number(t.totalAmount || 0);
      if (t.type === 'SELL') totalSellTurnover += Number(t.totalAmount || 0);
    });

    // 6. Pagination
    const totalCount = allUserTxns.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = allUserTxns.slice(startIndex, startIndex + limitNum);

    return successResponse(
      res,
      paginatedItems,
      'Transactions ledger retrieved successfully',
      200,
      {
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
        summary: {
          totalCompletedOrders: totalCount,
          buyTurnover: Number(totalBuyTurnover.toFixed(2)),
          sellTurnover: Number(totalSellTurnover.toFixed(2)),
        },
      }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get detailed receipt for a specific transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return errorResponse(res, 'Transaction not found.', 404);
    }

    // Verify user ownership
    if (transaction.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to view this transaction.', 403);
    }

    return successResponse(
      res,
      {
        ...transaction,
        isSimulated: true,
        brokerageFee: 0.0,
        exchangeTurnoverFee: 0.0,
        sebiTurnoverCharges: 0.0,
        stampDuty: 0.0,
        disclaimer: 'Virtual trade ledger record executed with simulated paper currency. Zero real-world financial liability.',
      },
      'Transaction details retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};
