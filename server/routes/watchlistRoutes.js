import express from 'express';
import {
  getWatchlists,
  createWatchlist,
  deleteWatchlist,
  addStockToWatchlist,
  removeStockFromWatchlist,
} from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All watchlist routes require authentication

router.get('/', getWatchlists);
router.post('/', createWatchlist);
router.delete('/:id', deleteWatchlist);
router.post('/:id/stocks', addStockToWatchlist);
router.delete('/:id/stocks/:symbol', removeStockFromWatchlist);

export default router;
