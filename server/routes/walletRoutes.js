import express from 'express';
import {
  getWallet,
  getWalletLedger,
  handleCredit,
  handleDebit,
} from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All wallet endpoints require authenticated user

router.get('/', getWallet);
router.get('/ledger', getWalletLedger);
router.post('/credit', handleCredit);
router.post('/debit', handleDebit);

export default router;
