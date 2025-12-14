import express from 'express';
import { userService } from '../services/userService.js';
import { comparePassword, generateToken } from '../utils/auth.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, hasPassword: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      console.error(`Login failed: User not found for email ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      console.error(`Login failed: User ${email} is inactive`);
      return res.status(401).json({ error: 'Account is inactive. Please contact administrator.' });
    }

    if (!user.password) {
      console.error(`Login failed: User ${email} has no password set`);
      return res.status(401).json({ error: 'Account setup incomplete. Please contact administrator.' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      console.error(`Login failed: Invalid password for email ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    console.log(`Login successful: ${email} (${user.role})`);
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
