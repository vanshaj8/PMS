import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { unreadOnly } = req.query;
    const notifications = await notificationService.getUserNotifications(
      req.user!.id,
      unreadOnly === 'true'
    );
    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.post('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json({ notification });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.post('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

