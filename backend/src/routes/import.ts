import express from 'express';
import multer from 'multer';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { fileParserService } from '../services/fileParserService.js';
import { dataValidationService } from '../services/dataValidationService.js';
import { dataTransformationService } from '../services/dataTransformationService.js';
import { importService, ImportMode } from '../services/importService.js';
import { errorReportGenerator } from '../utils/errorReportGenerator.js';
import { invalidRecordsService } from '../services/invalidRecordsService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are allowed.'));
    }
  },
});

// Parse and validate file (preview mode)
router.post('/preview', authenticate, requireRole('admin'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const isCSV = filename.endsWith('.csv');

    // Parse file
    const parseResult = isCSV
      ? await fileParserService.parseCSV(buffer)
      : await fileParserService.parseExcel(buffer, filename);

    // Validate
    const validationResult = await dataValidationService.validateRows(parseResult.rows);
    const dbValidationResult = await dataValidationService.validateAgainstDatabase(parseResult.rows);

    // Combine validation results
    const combinedValidation = {
      isValid: validationResult.isValid && dbValidationResult.errors.length === 0,
      errors: [...validationResult.errors, ...dbValidationResult.errors],
      warnings: [...validationResult.warnings, ...dbValidationResult.warnings],
    };

    // Transform (for preview)
    const transformedData = await dataTransformationService.transformRows(parseResult.rows);

    res.json({
      filename,
      headers: parseResult.headers,
      totalRows: parseResult.totalRows,
      validation: combinedValidation,
      preview: transformedData.users.slice(0, 10), // First 10 rows for preview
      transformedCount: transformedData.users.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Import data
router.post('/import', authenticate, requireRole('admin'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mode = 'delta' } = req.body; // full, delta, or append
    const buffer = req.file.buffer;
    const filename = req.file.originalname;
    const isCSV = filename.endsWith('.csv');

    // Parse file
    const parseResult = isCSV
      ? await fileParserService.parseCSV(buffer)
      : await fileParserService.parseExcel(buffer, filename);

    // Validate
    const validationResult = await dataValidationService.validateRows(parseResult.rows);
    const dbValidationResult = await dataValidationService.validateAgainstDatabase(parseResult.rows);

    const combinedValidation = {
      isValid: validationResult.isValid && dbValidationResult.errors.length === 0,
      errors: [...validationResult.errors, ...dbValidationResult.errors],
      warnings: [...validationResult.warnings, ...dbValidationResult.warnings],
    };

    // Save invalid records to queue
    const batchId = uuidv4();
    if (!combinedValidation.isValid) {
      await invalidRecordsService.saveInvalidRecords(
        batchId,
        parseResult.rows,
        combinedValidation.errors
      );
    }

    // If validation fails, return error report
    if (!combinedValidation.isValid) {
      const errorReport = errorReportGenerator.generateErrorReport(
        parseResult.rows,
        combinedValidation
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=import-errors.xlsx');
      return res.send(errorReport);
    }

    // Transform
    const transformedData = await dataTransformationService.transformRows(parseResult.rows);

    // Import
    const importResult = await importService.importUsers(
      transformedData,
      mode as ImportMode,
      req.user!.id,
      filename
    );

    res.json({
      success: true,
      result: importResult,
      warnings: combinedValidation.warnings.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download error report
router.post('/error-report', authenticate, requireRole('admin'), express.json(), async (req: AuthRequest, res) => {
  try {
    const { rows, validation } = req.body;
    const errorReport = errorReportGenerator.generateErrorReport(rows, validation);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=import-errors.xlsx');
    res.send(errorReport);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get import history
router.get('/history', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const history = await importService.getImportHistory();
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get last import status
router.get('/last-import', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const lastImport = await importService.getLastImport();
    res.json({ lastImport });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rollback import
router.post('/rollback/:importId', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const success = await importService.rollbackImport(req.params.importId);
    res.json({ success, message: 'Import rolled back successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

