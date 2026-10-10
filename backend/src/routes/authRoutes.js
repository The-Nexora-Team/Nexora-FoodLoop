import { Router } from 'express';
import { login, register, getMe, getDemoAccounts } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.get('/demo-accounts', getDemoAccounts);

// Protected routes
router.get('/me', requireAuth, getMe);

export default router;

