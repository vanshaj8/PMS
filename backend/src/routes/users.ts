import express from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { userService } from '../services/userService.js';
import { db } from '../utils/database.js';
import { User } from '../types/index.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const users = await userService.getAllUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPasswords });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const user = await userService.createUser(req.body);
    const { password, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { password, ...updates } = req.body;
    const user = await userService.updateUser(req.params.id, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get users for PIP creation (Managers can see employees and HRBPs)
router.get('/for-pip-creation', authenticate, requireRole('manager', 'admin'), async (req: AuthRequest, res) => {
  try {
    const allUsers = await userService.getAllUsers();
    const usersWithoutPasswords = allUsers
      .filter(u => u.isActive && (u.role === 'employee' || u.role === 'hrbp'))
      .map(({ password, ...user }) => user);
    
    const employees = usersWithoutPasswords.filter(u => u.role === 'employee');
    const hrbps = usersWithoutPasswords.filter(u => u.role === 'hrbp');
    
    res.json({ employees, hrbps });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

