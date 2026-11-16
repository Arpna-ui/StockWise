import {
  getWalletMetrics,
  creditWallet,
  debitWallet,
  ensureUserWallet,
} from '../services/walletService.js';
import { Transaction } from '../models/Transaction.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get user's live virtual wallet metrics and balances
 * @route   GET /api/wallet
 * @access  Private
 */
export const getWallet = async (req, res, next) => {
  try {
    const metrics = await getWalletMetrics(req.user._id);
    return successResponse(res, metrics, 'Wallet metrics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get audited ledger of wallet transactions (credits, debits, grants)
 * @route   GET /api/wallet/ledger
 * @access  Private
 */
export const getWalletLedger = async (req, res, next) => {
  try {
    await ensureUserWallet(req.user._id);

    const transactions = await Transaction.find({ user: req.user._id });
    const ledger = transactions.filter((t) =>
      ['CREDIT', 'DEBIT', 'BUY', 'SELL'].includes(t.type)
    );

    return successResponse(res, ledger, 'Wallet audit ledger retrieved successfully', 200, {
      count: ledger.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Simulate wallet credit (e.g. simulated capital top-up or dividend payment)
 * @route   POST /api/wallet/credit
 * @access  Private
 */
export const handleCredit = async (req, res, next) => {
  try {
    const { amount, source, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return errorResponse(res, 'Credit amount must be greater than zero.', 400);
    }

    const updatedWallet = await creditWallet(
      req.user._id,
      amount,
      source || 'MANUAL_CREDIT',
      notes
    );
    const metrics = await getWalletMetrics(req.user._id);

    return successResponse(
      res,
      metrics,
      `Successfully credited ₹${Number(amount).toLocaleString('en-IN')} to virtual wallet`
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Simulate wallet debit with strict negative balance prevention
 * @route   POST /api/wallet/debit
 * @access  Private
 */
export const handleDebit = async (req, res, next) => {
  try {
    const { amount, purpose, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return errorResponse(res, 'Debit amount must be greater than zero.', 400);
    }

    const updatedWallet = await debitWallet(
      req.user._id,
      amount,
      purpose || 'MANUAL_DEBIT',
      notes
    );
    const metrics = await getWalletMetrics(req.user._id);

    return successResponse(
      res,
      metrics,
      `Successfully deducted ₹${Number(amount).toLocaleString('en-IN')} from virtual wallet`
    );
  } catch (err) {
    next(err);
  }
};
