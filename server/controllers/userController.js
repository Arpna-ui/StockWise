import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { Portfolio } from '../models/Portfolio.js';
import { Holding } from '../models/Holding.js';
import { Transaction } from '../models/Transaction.js';
import { Notification } from '../models/Notification.js';
import { ensureUserWallet } from '../services/walletService.js';
import { ensureUserPortfolio } from '../services/portfolioService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get authenticated user profile details
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return errorResponse(res, 'User profile not found.', 404);
    }

    const wallet = await ensureUserWallet(req.user._id);
    const portfolio = await ensureUserPortfolio(req.user._id);

    // Compute user initials for avatar fallback (e.g. "Aarav Sharma" -> "AS")
    const names = (user.fullName || 'User').trim().split(/\s+/);
    const initials = names.length >= 2
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0].slice(0, 2).toUpperCase();

    const profileObj = {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone || '+91 98765 43210',
      bio: user.bio || 'Virtual Equity Trader & Financial Enthusiast',
      avatar: user.avatar || '',
      initials,
      virtualInitialCapital: user.virtualInitialCapital || 100000.00,
      availableBalance: Number(wallet.availableBalance || 100000.00),
      portfolioValue: Number((wallet.availableBalance + (portfolio.investedAmount || 0)).toFixed(2)),
      investedBalance: Number(portfolio.investedAmount || 0.00),
      kycStatus: user.kycStatus || 'Verified Virtual Trader',
      createdAt: user.createdAt,
      preferences: user.preferences || {
        defaultOrderType: 'MARKET',
        defaultQuantity: 1,
        notifyTrades: true,
        notifyPriceAlerts: true,
        notifyDigest: false,
      },
    };

    return successResponse(
      res,
      profileObj,
      'User profile retrieved successfully',
      200,
      { user: profileObj }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile details (name, username, phone, bio, avatar, preferences)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { fullName, username, phone, bio, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    if (fullName) user.fullName = fullName.trim();
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      // Check if username is taken by another user
      const existing = await User.findOne({ username: cleanUsername });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return errorResponse(res, 'Username already taken by another account.', 400);
      }
      user.username = cleanUsername;
    }
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (preferences) {
      user.preferences = {
        ...(user.preferences || {}),
        ...preferences,
      };
    }

    await user.save();

    // Recompute initials
    const names = (user.fullName || 'User').trim().split(/\s+/);
    const initials = names.length >= 2
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0].slice(0, 2).toUpperCase();

    const updatedObj = {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      avatar: user.avatar,
      initials,
      kycStatus: user.kycStatus,
      preferences: user.preferences,
    };

    return successResponse(
      res,
      updatedObj,
      'Profile updated successfully',
      200,
      { user: updatedObj }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Please provide both current and new password.', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters long.', 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return errorResponse(res, 'New password and confirmation do not match.', 400);
    }

    // Must select password explicitly
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password incorrect. Please try again.', 401);
    }

    // Update password (model save middleware hashes it)
    user.password = newPassword;
    await user.save();

    // Create security notification
    await Notification.create({
      user: user._id,
      title: 'Security Alert: Password Updated',
      message: 'Your StockWise account password was updated successfully. If this wasn’t you, contact support immediately.',
      type: 'INFO',
      link: '/settings',
    });

    return successResponse(res, null, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset virtual portfolio holdings and restore ₹1,00,000 cash balance
 * @route   POST /api/users/reset-account
 * @access  Private
 */
export const resetVirtualAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Clear all active holdings
    if (typeof Holding.deleteMany === 'function') {
      await Holding.deleteMany({ user: userId });
    }

    // 2. Reset wallet balance to ₹1,00,000
    const wallet = await ensureUserWallet(userId);
    wallet.availableBalance = 100000.00;
    wallet.totalAccountValue = 100000.00;
    wallet.lastTransactionAt = new Date();
    await wallet.save();

    // 3. Reset portfolio summary
    const portfolio = await ensureUserPortfolio(userId);
    portfolio.cashBalance = 100000.00;
    portfolio.investedAmount = 0.00;
    portfolio.unrealizedPnL = 0.00;
    portfolio.realizedPnL = 0.00;
    portfolio.totalValue = 100000.00;
    await portfolio.save();

    // 4. Record audit ledger entry
    await Transaction.create({
      user: userId,
      portfolio: portfolio._id,
      symbol: 'ACCOUNT_RESET',
      companyName: 'Virtual Account Capital Reset',
      type: 'CREDIT',
      orderType: 'SYSTEM_GRANT',
      quantity: 1,
      price: 100000.00,
      totalAmount: 100000.00,
      status: 'COMPLETED',
      notes: 'Virtual demo portfolio reset: active positions cleared and virtual balance restored to ₹1,00,000.',
    });

    // 5. Notify user
    await Notification.create({
      user: userId,
      title: 'Virtual Portfolio Reset Complete',
      message: 'Your demo account has been reset. Active positions cleared and ₹1,00,000 virtual balance restored.',
      type: 'SUCCESS',
      link: '/portfolio',
    });

    return successResponse(
      res,
      {
        availableBalance: 100000.00,
        totalAccountValue: 100000.00,
        holdingsCount: 0,
      },
      'Virtual demo portfolio reset successfully'
    );
  } catch (err) {
    next(err);
  }
};
