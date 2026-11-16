import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  createPriceAlert,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markNotificationAsRead);
router.post('/alerts', createPriceAlert);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

export default router;
