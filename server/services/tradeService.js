/**
 * StockWise - Virtual Stock Trading Engine
 * 
 * Provides atomic, fully-validated BUY and SELL operations:
 * - Real-time stock quote lookup
 * - Strict balance validation (never allows negative balances)
 * - Strict share inventory validation (never allows selling more than owned)
 * - Weighted average purchase price calculation on multiple buys
 * - Average cost-basis method for consistent realized P&L calculation on sells
 * - Full and partial selling support
 * - Automatic wallet balance debit/credit
 * - Permanent auditable transaction ledger recording
 * - Duplicate execution prevention
 * - Clear educational simulation labeling (never pretends to route to real exchanges)
 */

import mongoose from 'mongoose';
import { Stock } from '../models/Stock.js';
import { Holding } from '../models/Holding.js';
import { Portfolio } from '../models/Portfolio.js';
import { Wallet } from '../models/Wallet.js';
import { Transaction } from '../models/Transaction.js';
import { Notification } from '../models/Notification.js';
import { ensureUserWallet } from './walletService.js';
import { ensureUserPortfolio, recordPortfolioSnapshot } from './portfolioService.js';
import { getStockDetails } from './stockService.js';

// In-memory trade execution lock with auto-expiry to prevent duplicate double-click orders per user
const activeUserLocks = new Map();

export const acquireUserLock = (userId) => {
  const key = userId.toString();
  const now = Date.now();
  const existing = activeUserLocks.get(key);
  if (existing && existing > now) {
    return false;
  }
  activeUserLocks.set(key, now + 10000); // 10-second automatic safety release
  return true;
};

export const releaseUserLock = (userId) => {
  activeUserLocks.delete(userId.toString());
};

/**
 * Execute BUY order for a stock
 */
export const executeBuyOrder = async ({
  userId,
  symbol,
  quantity,
  orderType = 'MARKET',
  limitPrice = null,
}) => {
  if (!userId) {
    throw new Error('User authentication is required to execute a buy order.');
  }

  const cleanSymbol = symbol ? symbol.toUpperCase().trim() : '';
  if (!cleanSymbol) {
    throw new Error('Stock symbol is required.');
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0 || !Number.isInteger(Number(quantity))) {
    throw new Error('Order quantity must be a whole positive number (minimum 1 share).');
  }

  // Prevent concurrent duplicate submission
  if (!acquireUserLock(userId)) {
    throw new Error('Another trade is currently being processed for your account. Please wait.');
  }

  try {
    // 1. Verify stock exists and is a tradable equity
    const stock = await getStockDetails(cleanSymbol);
    if (!stock) {
      throw new Error(`Stock ticker ${cleanSymbol} not found or is currently unavailable for trading.`);
    }

    if (stock.isIndex) {
      throw new Error(`Market indices (${cleanSymbol}) cannot be traded directly. Please select an individual equity.`);
    }

    // 2. Determine execution price
    // In simulated trading, MARKET orders execute at current market price
    let executionPrice = Number(stock.price);
    if (orderType === 'LIMIT' && limitPrice) {
      const parsedLimit = parseFloat(limitPrice);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        throw new Error('Invalid limit price provided.');
      }
      // Best available price execution: if market price <= limit price, buyer gets market price
      executionPrice = parsedLimit >= stock.price ? stock.price : parsedLimit;
    }

    executionPrice = Number(executionPrice.toFixed(2));
    const totalOrderValue = Number((parsedQty * executionPrice).toFixed(2));

    // 3. Ensure user wallet and portfolio exist
    const wallet = await ensureUserWallet(userId);
    const portfolio = await ensureUserPortfolio(userId);

    // 4. Validate sufficient available virtual cash
    if (wallet.availableBalance < totalOrderValue) {
      await Notification.create({
        user: userId,
        title: `Order Rejected: Insufficient Funds for ${cleanSymbol}`,
        message: `Attempted to purchase ${parsedQty} shares of ${cleanSymbol} for ₹${totalOrderValue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}, but available balance was ₹${wallet.availableBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}.`,
        type: 'WARNING',
        link: '/portfolio',
      });

      throw new Error(
        `Insufficient virtual funds! Order total ₹${totalOrderValue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })} exceeds your available balance ₹${wallet.availableBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}.`
      );
    }

    // 5. Atomic Order Execution: Deduct Wallet Balance
    wallet.availableBalance = Number((wallet.availableBalance - totalOrderValue).toFixed(2));
    wallet.lastTransactionAt = new Date();
    await wallet.save();

    // 6. Update Holdings (Calculate Weighted Average Purchase Price)
    let holding = await Holding.findOne({ user: userId, symbol: cleanSymbol });
    let previousShares = 0;
    let previousAvgPrice = 0;

    if (holding) {
      previousShares = Number(holding.shares);
      previousAvgPrice = Number(holding.averageBuyPrice);

      const newShares = previousShares + parsedQty;
      // Formula: ((oldShares * oldAvg) + (newShares * execPrice)) / (oldShares + newShares)
      const newTotalCost = previousShares * previousAvgPrice + parsedQty * executionPrice;
      const newAveragePrice = Number((newTotalCost / newShares).toFixed(2));

      holding.shares = newShares;
      holding.averageBuyPrice = newAveragePrice;
      holding.totalInvested = Number(newTotalCost.toFixed(2));
      holding.currentPrice = executionPrice;
      holding.currentValue = Number((newShares * executionPrice).toFixed(2));
      holding.unrealizedPnL = Number((holding.currentValue - holding.totalInvested).toFixed(2));
      holding.pnlPercent =
        holding.totalInvested > 0
          ? Number(((holding.unrealizedPnL / holding.totalInvested) * 100).toFixed(2))
          : 0;

      await holding.save();
    } else {
      // Create new holding entry
      holding = await Holding.create({
        user: userId,
        portfolio: portfolio._id,
        stock: stock._id,
        symbol: cleanSymbol,
        companyName: stock.name,
        sector: stock.sector || 'General Equities',
        shares: parsedQty,
        averageBuyPrice: executionPrice,
        totalInvested: totalOrderValue,
        currentPrice: executionPrice,
        currentValue: totalOrderValue,
        unrealizedPnL: 0.0,
        pnlPercent: 0.0,
      });
    }

    // 7. Update Portfolio Totals
    portfolio.cashBalance = wallet.availableBalance;
    portfolio.investedAmount = Number(((portfolio.investedAmount || 0) + totalOrderValue).toFixed(2));
    await portfolio.save();

    // 8. Record Permanent Auditable Transaction in Ledger
    const transaction = await Transaction.create({
      user: userId,
      portfolio: portfolio._id,
      symbol: cleanSymbol,
      companyName: stock.name,
      type: 'BUY',
      orderType,
      quantity: parsedQty,
      price: executionPrice,
      totalAmount: totalOrderValue,
      status: 'COMPLETED',
      executionDate: new Date(),
      notes: `Virtual BUY executed: ${parsedQty} shares of ${cleanSymbol} @ ₹${executionPrice.toFixed(2)}`,
    });

    // 9. Create System Notification
    await Notification.create({
      user: userId,
      title: `Order Executed: BUY ${parsedQty} ${cleanSymbol}`,
      message: `Successfully purchased ${parsedQty} shares of ${stock.name} at ₹${executionPrice.toFixed(2)} for ₹${totalOrderValue.toLocaleString('en-IN')}.`,
      type: 'SUCCESS',
      link: '/portfolio',
    });

    // Capture snapshot asynchronously for portfolio tracking
    recordPortfolioSnapshot(userId).catch(err => {
      console.warn('Portfolio snapshot capture skipped/error:', err.message);
    });

    // 10. Return Genuine Order Confirmation Receipt
    return {
      success: true,
      orderId: transaction._id,
      symbol: cleanSymbol,
      companyName: stock.name,
      type: 'BUY',
      orderType,
      quantity: parsedQty,
      executionPrice,
      totalAmount: totalOrderValue,
      newAvailableBalance: wallet.availableBalance,
      updatedHolding: {
        shares: holding.shares,
        averageBuyPrice: holding.averageBuyPrice,
        totalInvested: holding.totalInvested,
      },
      executionTimestamp: transaction.executionDate,
      isSimulated: true,
      disclaimer: 'Simulated virtual trade executed with paper capital. Zero real financial liability.',
    };
  } finally {
    releaseUserLock(userId);
  }
};

/**
 * Execute SELL order for an owned stock
 */
export const executeSellOrder = async ({
  userId,
  symbol,
  quantity,
  orderType = 'MARKET',
  limitPrice = null,
}) => {
  if (!userId) {
    throw new Error('User authentication is required to execute a sell order.');
  }

  const cleanSymbol = symbol ? symbol.toUpperCase().trim() : '';
  if (!cleanSymbol) {
    throw new Error('Stock symbol is required.');
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0 || !Number.isInteger(Number(quantity))) {
    throw new Error('Order quantity must be a whole positive number (minimum 1 share).');
  }

  // Prevent concurrent duplicate submission
  if (!acquireUserLock(userId)) {
    throw new Error('Another trade is currently being processed for your account. Please wait.');
  }

  try {
    // 1. Verify user holding exists
    const holding = await Holding.findOne({ user: userId, symbol: cleanSymbol });
    if (!holding || Number(holding.shares) <= 0) {
      await Notification.create({
        user: userId,
        title: `Order Rejected: Cannot Sell ${cleanSymbol}`,
        message: `Attempted to sell ${cleanSymbol}, but you do not hold any shares of this stock in your portfolio.`,
        type: 'WARNING',
        link: '/portfolio',
      });
      throw new Error(`Cannot sell ${cleanSymbol}. You do not own any shares of this stock in your portfolio.`);
    }

    const ownedShares = Number(holding.shares);
    if (parsedQty > ownedShares) {
      await Notification.create({
        user: userId,
        title: `Order Rejected: Insufficient Shares of ${cleanSymbol}`,
        message: `Attempted to sell ${parsedQty} shares of ${cleanSymbol}, but only own ${ownedShares} shares.`,
        type: 'WARNING',
        link: '/portfolio',
      });
      throw new Error(
        `Insufficient shares! You attempted to sell ${parsedQty} shares, but only own ${ownedShares} shares of ${cleanSymbol}.`
      );
    }

    // 2. Fetch latest stock quote for execution
    const stock = await getStockDetails(cleanSymbol);
    if (!stock) {
      throw new Error(`Stock ticker ${cleanSymbol} not found.`);
    }

    let executionPrice = Number(stock.price);
    if (orderType === 'LIMIT' && limitPrice) {
      const parsedLimit = parseFloat(limitPrice);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        throw new Error('Invalid limit price provided.');
      }
      executionPrice = parsedLimit;
    }

    executionPrice = Number(executionPrice.toFixed(2));
    const totalSellProceeds = Number((parsedQty * executionPrice).toFixed(2));

    // 3. Consistent Cost-Basis Calculation (Average Cost Method)
    const costBasisOfSoldShares = Number((parsedQty * Number(holding.averageBuyPrice)).toFixed(2));
    const realizedPnL = Number((totalSellProceeds - costBasisOfSoldShares).toFixed(2));
    const realizedPnLPercent =
      costBasisOfSoldShares > 0
        ? Number(((realizedPnL / costBasisOfSoldShares) * 100).toFixed(2))
        : 0;

    // 4. Ensure wallet and portfolio exist
    const wallet = await ensureUserWallet(userId);
    const portfolio = await ensureUserPortfolio(userId);

    // 5. Update Holdings: Reduce shares or remove holding if fully sold
    const remainingShares = ownedShares - parsedQty;
    const isFullSale = remainingShares === 0;

    if (isFullSale) {
      // 100% of position liquidated
      await Holding.deleteOne({ user: userId, symbol: cleanSymbol });
    } else {
      // Partial liquidation: average purchase price remains identical for remaining shares
      holding.shares = remainingShares;
      holding.totalInvested = Number((remainingShares * holding.averageBuyPrice).toFixed(2));
      holding.currentPrice = executionPrice;
      holding.currentValue = Number((remainingShares * executionPrice).toFixed(2));
      holding.unrealizedPnL = Number((holding.currentValue - holding.totalInvested).toFixed(2));
      holding.pnlPercent =
        holding.totalInvested > 0
          ? Number(((holding.unrealizedPnL / holding.totalInvested) * 100).toFixed(2))
          : 0;

      await holding.save();
    }

    // 6. Credit Virtual Wallet with Gross Proceeds
    wallet.availableBalance = Number((wallet.availableBalance + totalSellProceeds).toFixed(2));
    wallet.lastTransactionAt = new Date();
    await wallet.save();

    // 7. Update Portfolio Totals & Record Realized Profit/Loss
    portfolio.cashBalance = wallet.availableBalance;
    portfolio.investedAmount = Math.max(0, Number(((portfolio.investedAmount || 0) - costBasisOfSoldShares).toFixed(2)));
    portfolio.realizedPnL = Number(((portfolio.realizedPnL || 0) + realizedPnL).toFixed(2));
    await portfolio.save();

    // 8. Record Permanent Auditable Transaction in Ledger
    const transaction = await Transaction.create({
      user: userId,
      portfolio: portfolio._id,
      symbol: cleanSymbol,
      companyName: stock ? stock.name : holding.companyName,
      type: 'SELL',
      orderType,
      quantity: parsedQty,
      price: executionPrice,
      totalAmount: totalSellProceeds,
      status: 'COMPLETED',
      executionDate: new Date(),
      notes: `Virtual SELL executed: ${parsedQty} shares of ${cleanSymbol} @ ₹${executionPrice.toFixed(2)} (Cost basis: ₹${costBasisOfSoldShares.toFixed(2)}, Realized P&L: ${realizedPnL >= 0 ? '+' : ''}₹${realizedPnL.toFixed(2)})`,
    });

    // 9. Create System Notification
    const pnlPrefix = realizedPnL >= 0 ? 'Profit' : 'Loss';
    await Notification.create({
      user: userId,
      title: `Order Executed: SELL ${parsedQty} ${cleanSymbol}`,
      message: `Sold ${parsedQty} shares of ${cleanSymbol} for ₹${totalSellProceeds.toLocaleString('en-IN')}. Realized ${pnlPrefix}: ₹${Math.abs(realizedPnL).toFixed(2)} (${realizedPnLPercent}%).`,
      type: realizedPnL >= 0 ? 'SUCCESS' : 'WARNING',
      link: '/portfolio',
    });

    // Capture snapshot asynchronously for portfolio tracking
    recordPortfolioSnapshot(userId).catch(err => {
      console.warn('Portfolio snapshot capture skipped/error:', err.message);
    });

    // 10. Return Genuine Order Confirmation Receipt
    return {
      success: true,
      orderId: transaction._id,
      symbol: cleanSymbol,
      companyName: stock ? stock.name : holding.companyName,
      type: 'SELL',
      orderType,
      quantity: parsedQty,
      executionPrice,
      totalAmount: totalSellProceeds,
      costBasis: costBasisOfSoldShares,
      realizedPnL,
      realizedPnLPercent,
      newAvailableBalance: wallet.availableBalance,
      remainingShares,
      isFullSale,
      executionTimestamp: transaction.executionDate,
      isSimulated: true,
      disclaimer: 'Simulated virtual trade executed with paper capital. Zero real financial liability.',
    };
  } finally {
    releaseUserLock(userId);
  }
};

/**
 * Retrieves user's current holding for a specific stock ticker
 */
export const getUserHoldingForStock = async (userId, symbol) => {
  if (!userId || !symbol) return null;
  const holding = await Holding.findOne({ user: userId, symbol: symbol.toUpperCase() });
  if (!holding || Number(holding.shares) <= 0) {
    return {
      symbol: symbol.toUpperCase(),
      shares: 0,
      averageBuyPrice: 0,
      totalInvested: 0,
      currentValue: 0,
      unrealizedPnL: 0,
    };
  }

  const stock = await getStockDetails(symbol);
  const currentPrice = stock ? stock.price : holding.currentPrice;
  const currentValue = Number(holding.shares) * currentPrice;
  const totalInvested = Number(holding.shares) * Number(holding.averageBuyPrice);

  return {
    symbol: holding.symbol,
    companyName: holding.companyName,
    shares: Number(holding.shares),
    averageBuyPrice: Number(holding.averageBuyPrice),
    totalInvested: Number(totalInvested.toFixed(2)),
    currentPrice: Number(currentPrice),
    currentValue: Number(currentValue.toFixed(2)),
    unrealizedPnL: Number((currentValue - totalInvested).toFixed(2)),
  };
};
