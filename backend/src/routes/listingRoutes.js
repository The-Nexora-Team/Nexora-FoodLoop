import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  sellPortions,
} from '../controllers/listingController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', requireRole('restaurant', 'admin'), createListing);
router.post('/:id/sell', requireRole('restaurant', 'admin'), sellPortions);

export default router;

