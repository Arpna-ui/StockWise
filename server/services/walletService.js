import { Wallet } from '../models/Wallet.js';
import { Transaction } from '../models/Transaction.js';
import { Holding } from '../models/Holding.js';
import { Stock } from '../models/Stock.js';
import { Portfolio } from '../models/Portfolio.js';

export const VIRTUAL_MONEY_DISCLAIMER =
  'All balances and transactions are simulated virtual paper money for educational purposes. No real currency is involved.';

/**
 * Ensures user has an initialized virtual wallet.
 * Core rule: Every new user receives exactly ₹1,00,000 virtual starting capital only once.
 * Existing balances are NEVER reset.
 */
export const ensureUserWallet = async (userId) => {
  if (!userId) throw new Error('User ID is required to access wallet.');

  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    // 1. Initialize Wallet with exactly ₹1,00,000 virtual starting balance
    wallet = await Wallet.create({
      user: userId,
      availableBalance: 100000.00,
      lockedBalance: 0.00,
      initialGrantAmount: 100000.00,
      isInitialGrantCredited: true,
      currency: 'INR',
      currencySymbol: '₹',
      isVirtual: true,
    });

    // 2. Create permanent auditable ledger transaction record
    await Transaction.create({
      user: userId,
      symbol: 'VIRTUAL_GRANT',
      companyName: 'StockWise Virtual Capital Welcome Grant',
      type: 'CREDIT',
      orderType: 'SYSTEM_GRANT',
      quantity: 1,
      price: 100000.00,
      totalAmount: 100000.00,
      status: 'COMPLETED',
      notes: 'Initial educational virtual trading grant of ₹1,00,000 credited once upon account creation.',
    });
  }

  return wallet;
};

/**
 * Calculates live wallet metrics, active holding values, and total account equity
 */
export const getWalletMetrics = async (userId) => {
  const wallet = await ensureUserWallet(userId);
  const holdings = await Holding.find({ user: userId });
  const portfolio = await Portfolio.findOne({ user: userId });

  // Calculate market value of all held stocks
  let currentHoldingsValue = 0;
  let totalInvested = 0;

  for (const h of holdings) {
    const stock = await Stock.findOne({ symbol: h.symbol });
    const currentPrice = stock ? stock.price : Number(h.currentPrice || h.averageBuyPrice);
    const holdingMarketValue = Number(h.shares) * currentPrice;
    const holdingCostBasis = Number(h.shares) * Number(h.averageBuyPrice);

    currentHoldingsValue += holdingMarketValue;
    totalInvested += holdingCostBasis;
  }

  const availableBalance = Number(wallet.availableBalance);
  const lockedBalance = Number(wallet.lockedBalance || 0);
  const totalAccountValue = availableBalance + lockedBalance + currentHoldingsValue;
  const realizedPnL = portfolio ? Number(portfolio.realizedPnL || 0) : 0;
  const unrealizedPnL = currentHoldingsValue - totalInvested;
  const totalPnL = unrealizedPnL + realizedPnL;
  const pnlPercentage = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

  return {
    availableBalance,
    lockedBalance,
    totalInvested,
    currentHoldingsValue,
    totalAccountValue,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
    pnlPercentage,
    initialCapitalGrant: Number(wallet.initialGrantAmount || 100000.00),
    currency: wallet.currency || 'INR',
    currencySymbol: wallet.currencySymbol || '₹',
    isVirtual: true,
    disclaimer: VIRTUAL_MONEY_DISCLAIMER,
    lastTransactionAt: wallet.lastTransactionAt,
  };
};

/**
 * Credits virtual funds to user wallet with backend validation & ledger record
 */
export const creditWallet = async (userId, amount, source = 'PROFIT_REALIZATION', notes = '') => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Credit amount must be a positive number greater than zero.');
  }

  const wallet = await ensureUserWallet(userId);
  wallet.availableBalance += numAmount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();

  // Create auditable ledger record
  await Transaction.create({
    user: userId,
    symbol: 'WALLET_CREDIT',
    companyName: 'Virtual Wallet Credit',
    type: 'CREDIT',
    orderType: 'MARKET',
    quantity: 1,
    price: numAmount,
    totalAmount: numAmount,
    status: 'COMPLETED',
    notes: notes || `Credited ₹${numAmount.toLocaleString('en-IN')} via ${source}`,
  });

  return wallet;
};

/**
 * Debits virtual funds from user wallet with strict backend negative balance prevention
 */
export const debitWallet = async (userId, amount, purpose = 'STOCK_PURCHASE', notes = '') => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Debit amount must be a positive number greater than zero.');
  }

  const wallet = await ensureUserWallet(userId);

  // Strict balance check to prevent negative balances
  if (wallet.availableBalance < numAmount) {
    throw new Error(
      `Insufficient virtual balance. Required ₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, but available is ₹${wallet.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`
    );
  }

  wallet.availableBalance -= numAmount;
  wallet.lastTransactionAt = new Date();
  await wallet.save();

  // Create auditable ledger record
  await Transaction.create({
    user: userId,
    symbol: 'WALLET_DEBIT',
    companyName: 'Virtual Wallet Deduction',
    type: 'DEBIT',
    orderType: 'MARKET',
    quantity: 1,
    price: numAmount,
    totalAmount: numAmount,
    status: 'COMPLETED',
    notes: notes || `Deducted ₹${numAmount.toLocaleString('en-IN')} for ${purpose}`,
  });

  return wallet;
};
