import express from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { pipService } from '../services/pipService.js';
import { db } from '../utils/database.js';
import { canAccessPIP } from '../utils/auth.js';
import { PIP, PIPStatus } from '../types/index.js';
import { stepLockingService } from '../services/stepLockingService.js';
import { notificationService } from '../services/notificationService.js';

const router = express.Router();

// Get all PIPs (filtered by role)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let pips = await db.read<PIP>('pips');

    // Filter based on role
    if (user.role === 'admin' || user.role === 'executive') {
      // Admins and executives see all
    } else if (user.role === 'manager') {
      pips = pips.filter(p => p.managerId === user.id);
    } else if (user.role === 'employee') {
      pips = pips.filter(p => p.employeeId === user.id);
    } else if (user.role === 'hrbp') {
      pips = pips.filter(p => p.hrbpId === user.id);
    }

    res.json({ pips });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single PIP
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (!canAccessPIP(req.user!, pip)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ pip });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create PIP (Manager only)
router.post('/', authenticate, requireRole('manager'), async (req: AuthRequest, res) => {
  try {
    const pip = await pipService.createPIP({
      ...req.body,
      managerId: req.user!.id,
    });
    res.status(201).json({ pip });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update PIP goals (Manager or HRBP)
router.put('/:id/goals', authenticate, requireRole('manager', 'hrbp'), async (req: AuthRequest, res) => {
  try {
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (req.user!.role === 'manager' && pip.managerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user!.role === 'hrbp' && pip.hrbpId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await pipService.updateGoals(req.params.id, req.body.goals, req.user!.id);
    res.json({ pip: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// HRBP Review: Approve/Deny/Send Back
router.post('/:id/hrbp-review', authenticate, requireRole('hrbp'), async (req: AuthRequest, res) => {
  try {
    const { action, comments } = req.body; // action: 'approve' | 'deny' | 'send_back'
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (pip.hrbpId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TC22-TC25: Step locking validation
    if (!stepLockingService.canAccessStep(pip, 'hrbp_review', req.user!.id, 'hrbp')) {
      return res.status(403).json({ error: 'Step is locked or not accessible' });
    }

    let newStatus: PIPStatus;
    if (action === 'approve') {
      newStatus = 'pending_employee_acknowledgement';
    } else if (action === 'deny') {
      newStatus = 'denied';
    } else {
      newStatus = 'draft';
    }

    await pipService.updatePIPStatus(req.params.id, newStatus, req.user!.id);
    await pipService.updateStep(req.params.id, 'hrbp_review', {
      status: action === 'approve' ? 'completed' : 'pending',
      comments,
      signedBy: req.user!.id,
    });

    const updated = await db.findById<PIP>('pips', req.params.id);
    res.json({ pip: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Employee Acknowledgement
router.post('/:id/acknowledge', authenticate, requireRole('employee'), async (req: AuthRequest, res) => {
  try {
    const { comments } = req.body;
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (pip.employeeId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TC22-TC25: Step locking validation
    if (!stepLockingService.canCompleteStep(pip, 'employee_acknowledgement', req.user!.id, 'employee')) {
      return res.status(403).json({ error: 'Step is locked or not accessible' });
    }

    await pipService.updatePIPStatus(req.params.id, 'active', req.user!.id);
    await pipService.updateStep(req.params.id, 'employee_acknowledgement', {
      status: 'completed',
      comments,
      signedBy: req.user!.id,
    });

    // Send notification to manager
    await notificationService.notifyPIPAcknowledged(req.params.id, pip.managerId);

    const updated = await db.findById<PIP>('pips', req.params.id);
    res.json({ pip: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add Check-in
router.post('/:id/checkins', authenticate, async (req: AuthRequest, res) => {
  try {
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (!canAccessPIP(req.user!, pip)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checkIn = await pipService.addCheckIn(req.params.id, {
      ...req.body,
      createdBy: req.user!.id,
    });
    res.status(201).json({ checkIn });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Employee Self-Review
router.post('/:id/self-review', authenticate, requireRole('employee'), async (req: AuthRequest, res) => {
  try {
    const { goals } = req.body; // Array of { id, justification, attachments }
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (pip.employeeId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TC22-TC25, TC29: Step locking and deadline validation
    if (!stepLockingService.canCompleteStep(pip, 'employee_self_review', req.user!.id, 'employee')) {
      return res.status(403).json({ error: 'Step is locked or not accessible' });
    }

    // TC63-TC64: Validate all goals have comments
    if (!goals || goals.length === 0) {
      return res.status(400).json({ error: 'At least one goal justification is required' });
    }

    const missingJustifications = goals.filter((g: any) => !g.justification || g.justification.trim() === '');
    if (missingJustifications.length > 0) {
      return res.status(400).json({ error: 'All goals must have justification comments' });
    }

    const updatedGoals = pip.goals.map(goal => {
      const submitted = goals.find((g: any) => g.id === goal.id);
      if (submitted) {
        return {
          ...goal,
          justification: submitted.justification,
          employeeAttachments: submitted.attachments || [],
        };
      }
      return goal;
    });

    await pipService.updateGoals(req.params.id, updatedGoals, req.user!.id);
    await pipService.updatePIPStatus(req.params.id, 'pending_manager_review', req.user!.id);
    await pipService.updateStep(req.params.id, 'employee_self_review', {
      status: 'completed',
      signedBy: req.user!.id,
    });

    const updated = await db.findById<PIP>('pips', req.params.id);
    res.json({ pip: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Manager Final Review
router.post('/:id/manager-review', authenticate, requireRole('manager'), async (req: AuthRequest, res) => {
  try {
    const { goals, comments } = req.body; // goals: Array of { id, status, managerComments }
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (pip.managerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TC22-TC25: Step locking validation
    if (!stepLockingService.canCompleteStep(pip, 'manager_review', req.user!.id, 'manager')) {
      return res.status(403).json({ error: 'Step is locked or not accessible' });
    }

    const updatedGoals = pip.goals.map(goal => {
      const reviewed = goals.find((g: any) => g.id === goal.id);
      if (reviewed) {
        return {
          ...goal,
          status: reviewed.status,
          managerComments: reviewed.managerComments,
        };
      }
      return goal;
    });

    await pipService.updateGoals(req.params.id, updatedGoals, req.user!.id);
    await pipService.updatePIPStatus(req.params.id, 'pending_hrbp_decision', req.user!.id);
    await pipService.updateStep(req.params.id, 'manager_review', {
      status: 'completed',
      comments,
      signedBy: req.user!.id,
    });

    const updated = await db.findById<PIP>('pips', req.params.id);
    res.json({ pip: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// HRBP Final Decision
router.post('/:id/final-decision', authenticate, requireRole('hrbp'), async (req: AuthRequest, res) => {
  try {
    const { outcome, remarks } = req.body; // outcome: 'successful' | 'unsuccessful' | 'extended' | 'closed_without_action'
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    if (pip.hrbpId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TC22-TC25: Step locking validation
    if (!stepLockingService.canCompleteStep(pip, 'hrbp_decision', req.user!.id, 'hrbp')) {
      return res.status(403).json({ error: 'Step is locked or not accessible' });
    }

    await db.update<PIP>('pips', req.params.id, {
      finalOutcome: outcome,
      finalRemarks: remarks,
      status: 'completed',
      locked: true,
    });

    await pipService.updateStep(req.params.id, 'hrbp_decision', {
      status: 'completed',
      comments: remarks,
      signedBy: req.user!.id,
    });

    // TC68-TC70: Send completion notifications
    await notificationService.notifyPIPCompleted(
      req.params.id,
      pip.employeeId,
      pip.managerId,
      pip.hrbpId,
      outcome
    );

    const updated = await db.findById<PIP>('pips', req.params.id);
    res.json({ pip: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Timeline Override (Admin only)
router.post('/:id/timeline-override', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { step, newDueDate, reason } = req.body;
    const updated = await pipService.overrideTimeline(
      req.params.id,
      step,
      newDueDate,
      reason,
      req.user!.id
    );
    res.json({ pip: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

