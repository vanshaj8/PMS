import express from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { db } from '../utils/database.js';
import { AuditLog } from '../types/index.js';

const router = express.Router();

// Get audit logs (Admin, HRBP, Executive)
router.get('/', authenticate, requireRole('admin', 'hrbp', 'executive'), async (req: AuthRequest, res) => {
  try {
    const { pipId, userId, limit = 100 } = req.query;
    let logs = await db.read<AuditLog>('auditLogs');

    if (pipId) {
      logs = logs.filter(l => l.pipId === pipId);
    }
    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }

    logs = logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, Number(limit));

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

