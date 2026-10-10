import { Router } from 'express';
import {
  getHandovers,
  claimPickup,
  confirmPickup,
  confirmDelivery,
} from '../controllers/handoverController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getHandovers);
router.post('/claim', requireRole('volunteer', 'admin'), claimPickup);
router.patch('/:id/pickup', requireRole('volunteer', 'admin'), confirmPickup);
router.patch('/:id/deliver', requireRole('volunteer', 'admin'), confirmDelivery);

export default router;

