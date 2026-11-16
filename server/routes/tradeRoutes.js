import express from 'express';
import { handleBuyOrder, handleSellOrder, getUserHolding } from '../controllers/tradeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All trade endpoints require active user authentication
router.post('/buy', protect, handleBuyOrder);
router.post('/sell', protect, handleSellOrder);
router.get('/holding/:symbol', protect, getUserHolding);

export default router;
