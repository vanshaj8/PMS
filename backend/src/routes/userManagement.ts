import express from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { userManagementService } from '../services/userManagementService.js';
import { UserSearchFilters } from '../services/userManagementService.js';

const router = express.Router();

// Search users with filters
router.post('/search', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const filters: UserSearchFilters = req.body;
    const results = await userManagementService.searchUsers(filters);
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user with relationships
router.get('/:id/details', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const results = await userManagementService.searchUsers({ userId: req.params.id });
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ result: results[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assign manager
router.post('/:id/assign-manager', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { managerId } = req.body;
    const user = await userManagementService.assignManager(req.params.id, managerId);
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Assign HRBP
router.post('/:id/assign-hrbp', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { hrbpId } = req.body;
    const user = await userManagementService.assignHRBP(req.params.id, hrbpId);
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update user profile
router.put('/:id/profile', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const user = await userManagementService.updateUserProfile(req.params.id, req.body);
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deactivate user
router.post('/:id/deactivate', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const user = await userManagementService.deactivateUser(req.params.id);
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk assign manager
router.post('/bulk/assign-manager', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { userIds, managerId } = req.body;
    const result = await userManagementService.bulkAssignManager(userIds, managerId);
    res.json({ result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk assign HRBP
router.post('/bulk/assign-hrbp', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { userIds, hrbpId } = req.body;
    const result = await userManagementService.bulkAssignHRBP(userIds, hrbpId);
    res.json({ result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk deactivate
router.post('/bulk/deactivate', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { userIds } = req.body;
    const result = await userManagementService.bulkDeactivate(userIds);
    res.json({ result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get manager load distribution
router.get('/manager-load', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const distribution = await userManagementService.getManagerLoadDistribution();
    res.json({ distribution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get hierarchy health
router.get('/hierarchy-health', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const health = await userManagementService.getUserHierarchyHealth();
    res.json({ health });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

