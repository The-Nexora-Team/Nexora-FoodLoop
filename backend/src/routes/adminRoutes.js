import { Router } from 'express';
import {
  getPlatformStats,
  getAllUsers,
  updateUser,
  deleteUser,
  setClockSpeed,
  triggerDemoScenario,
  resetDemoState,
  getSystemInspection,
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes with authentication and admin role guard
router.use(requireAuth);
router.use(requireRole('admin'));

// Platform Analytics & Stats
router.get('/stats', getPlatformStats);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Demo & Hackathon Controls
router.post('/clock/speed', setClockSpeed);
router.post('/demo/trigger-scenario', triggerDemoScenario);
router.post('/demo/reset', resetDemoState);

// Raw Inspection
router.get('/inspection', getSystemInspection);

export default router;

