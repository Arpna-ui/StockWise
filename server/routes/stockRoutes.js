import express from 'express';
import {
  getStocks,
  getSectionsSummary,
  getIndices,
  getMarketStatusController,
  getStockHistoryController,
  getStockBySymbol,
} from '../controllers/stockController.js';

const router = express.Router();

router.get('/', getStocks);
router.get('/sections', getSectionsSummary);
router.get('/indices', getIndices);
router.get('/market-status', getMarketStatusController);
router.get('/:symbol/history', getStockHistoryController);
router.get('/:symbol', getStockBySymbol);

export default router;
