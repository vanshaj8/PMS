import express from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { slaTrackingService } from '../services/slaTrackingService.js';
import { db } from '../utils/database.js';
import { PIP } from '../types/index.js';

const router = express.Router();

// Get SLA metrics for a PIP
router.get('/pip/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    const metrics = slaTrackingService.calculateSLA(pip);
    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get average step completion times
router.get('/averages', authenticate, requireRole('admin', 'executive'), async (req: AuthRequest, res) => {
  try {
    const pips = await db.read<PIP>('pips');
    const averages = slaTrackingService.getAverageStepCompletionTime(pips);
    res.json({ averages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get SLA compliance rates
router.get('/compliance', authenticate, requireRole('admin', 'executive'), async (req: AuthRequest, res) => {
  try {
    const pips = await db.read<PIP>('pips');
    const compliance = slaTrackingService.getSLAComplianceRate(pips);
    res.json({ compliance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

