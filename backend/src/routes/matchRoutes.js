import { Router } from 'express';
import { getMatches, acceptMatch, declineMatch } from '../controllers/matchController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMatches);
router.post('/:id/accept', requireRole('receiver', 'admin'), acceptMatch);
router.post('/:id/decline', requireRole('receiver', 'admin'), declineMatch);

export default router;

