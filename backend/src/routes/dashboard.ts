import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { db } from '../utils/database.js';
import { PIP, DashboardStats } from '../types/index.js';

const router = express.Router();

router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let pips = await db.read<PIP>('pips');

    // Filter based on role
    if (user.role === 'manager') {
      pips = pips.filter(p => p.managerId === user.id);
    } else if (user.role === 'employee') {
      pips = pips.filter(p => p.employeeId === user.id);
    } else if (user.role === 'hrbp') {
      pips = pips.filter(p => p.hrbpId === user.id);
    }
    // Admin and Executive see all

    const totalPIPs = pips.length;
    const activePIPs = pips.filter(p => p.status === 'active').length;
    const pendingAction = pips.filter(p => 
      p.status === 'pending_hrbp_review' ||
      p.status === 'pending_employee_acknowledgement' ||
      p.status === 'pending_manager_review' ||
      p.status === 'pending_hrbp_decision'
    ).length;
    const overduePIPs = pips.filter(p => p.status === 'overdue').length;
    
    const completedPIPs = pips.filter(p => p.status === 'completed');
    const successfulPIPs = completedPIPs.filter(p => p.finalOutcome === 'successful').length;
    const successRate = completedPIPs.length > 0 
      ? (successfulPIPs / completedPIPs.length) * 100 
      : 0;

    // Calculate average duration
    const durations = completedPIPs.map(pip => {
      const start = new Date(pip.createdAt);
      const end = new Date(pip.updatedAt);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const stats: DashboardStats = {
      totalPIPs,
      activePIPs,
      pendingAction,
      overduePIPs,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration * 100) / 100,
    };

    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pips-by-status', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let pips = await db.read<PIP>('pips');

    if (user.role === 'manager') {
      pips = pips.filter(p => p.managerId === user.id);
    } else if (user.role === 'employee') {
      pips = pips.filter(p => p.employeeId === user.id);
    } else if (user.role === 'hrbp') {
      pips = pips.filter(p => p.hrbpId === user.id);
    }

    const byStatus: Record<string, number> = {};
    pips.forEach(pip => {
      byStatus[pip.status] = (byStatus[pip.status] || 0) + 1;
    });

    res.json({ byStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/overdue-pips', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let pips = await db.read<PIP>('pips');

    if (user.role === 'manager') {
      pips = pips.filter(p => p.managerId === user.id);
    } else if (user.role === 'employee') {
      pips = pips.filter(p => p.employeeId === user.id);
    } else if (user.role === 'hrbp') {
      pips = pips.filter(p => p.hrbpId === user.id);
    }

    const overdue = pips.filter(p => 
      p.status === 'overdue' || 
      p.steps.some(s => s.status === 'overdue')
    );

    res.json({ pips: overdue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

