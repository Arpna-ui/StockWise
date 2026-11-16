import { Notification } from '../models/Notification.js';
import { ensureUserPortfolio } from '../services/portfolioService.js';
import { getStockDetails } from '../services/stockService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get user's alerts and system notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    await ensureUserPortfolio(req.user._id);

    const { filter = 'all', limit = 50 } = req.query;

    const query = { user: req.user._id };
    if (filter === 'unread') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query);
    const limitNum = Number(limit) || 50;
    const paginated = notifications.slice(0, limitNum);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return successResponse(
      res,
      paginated,
      'Notifications retrieved successfully',
      200,
      {
        count: paginated.length,
        total: notifications.length,
        unreadCount,
      }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return errorResponse(res, 'Notification not found.', 404);
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to modify this notification.', 403);
    }

    notification.isRead = true;
    await notification.save();

    return successResponse(res, notification, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    return successResponse(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a custom watchlist price alert notification
 * @route   POST /api/notifications/alerts
 * @access  Private
 */
export const createPriceAlert = async (req, res, next) => {
  try {
    const { symbol, targetPrice, condition = 'ABOVE' } = req.body;

    if (!symbol || !targetPrice) {
      return errorResponse(res, 'Symbol and targetPrice are required for price alert.', 400);
    }

    const cleanSym = symbol.trim().toUpperCase();
    const stock = await getStockDetails(cleanSym);
    const currentPrice = stock ? stock.price : Number(targetPrice);

    const alertNotif = await Notification.create({
      user: req.user._id,
      title: `Price Alert Configured: ${cleanSym}`,
      message: `Alert set for ${cleanSym} when price goes ${condition === 'ABOVE' ? 'above' : 'below'} ₹${Number(targetPrice).toFixed(2)} (Current price: ₹${Number(currentPrice).toFixed(2)}).`,
      type: 'ALERT',
      link: `/stock/${cleanSym}`,
    });

    return successResponse(res, alertNotif, 'Price alert created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return errorResponse(res, 'Notification not found.', 404);
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to delete this notification.', 403);
    }

    await Notification.findByIdAndDelete(id);

    return successResponse(res, null, 'Notification deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Clear all notifications for user
 * @route   DELETE /api/notifications
 * @access  Private
 */
export const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });

    return successResponse(res, null, 'All notifications cleared successfully');
  } catch (err) {
    next(err);
  }
};
