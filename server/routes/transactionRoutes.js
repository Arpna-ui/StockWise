import express from 'express';
import {
  getTransactions,
  getTransactionById,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All transaction routes require authentication

router.get('/', getTransactions);
router.get('/:id', getTransactionById);

export default router;
