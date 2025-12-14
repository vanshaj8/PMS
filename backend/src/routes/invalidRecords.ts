import express from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { invalidRecordsService } from '../services/invalidRecordsService.js';

const router = express.Router();

// Get invalid records
router.get('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { batchId, status } = req.query;
    const records = await invalidRecordsService.getInvalidRecords(
      batchId as string,
      status as any
    );
    res.json({ records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Correct invalid record
router.put('/:id/correct', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { correctedData } = req.body;
    const record = await invalidRecordsService.correctRecord(
      req.params.id,
      correctedData,
      req.user!.id
    );
    res.json({ record });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Process corrected record
router.post('/:id/process', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const record = await invalidRecordsService.processCorrectedRecord(req.params.id);
    res.json({ record });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete invalid record
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const success = await invalidRecordsService.deleteRecord(req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

