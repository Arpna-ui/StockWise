import express from 'express';
import {
  getPortfolio,
  getAnalytics,
  getHistory,
  createSnapshot,
} from '../controllers/portfolioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPortfolio);
router.get('/analytics', protect, getAnalytics);
router.get('/history', protect, getHistory);
router.post('/snapshot', protect, createSnapshot);

export default router;
