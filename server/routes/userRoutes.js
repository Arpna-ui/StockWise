import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  resetVirtualAccount,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All user profile routes require authentication

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/password', changePassword);
router.post('/reset-account', resetVirtualAccount);

export default router;
