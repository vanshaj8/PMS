import express from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { db } from '../utils/database.js';
import { PIP } from '../types/index.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';

const router = express.Router();

// Export PIP to PDF
router.get('/pip/:id/pdf', authenticate, async (req: AuthRequest, res) => {
  try {
    const pip = await db.findById<PIP>('pips', req.params.id);
    if (!pip) {
      return res.status(404).json({ error: 'PIP not found' });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 750;
    const lineHeight = 20;

    const addText = (text: string, x: number, size: number = 12, isBold: boolean = false) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    };

    addText('Performance Improvement Plan', 50, 18, true);
    y -= 10;
    addText(`PIP ID: ${pip.id.slice(0, 8)}`, 50);
    addText(`Status: ${pip.status}`, 50);
    addText(`Created: ${new Date(pip.createdAt).toLocaleDateString()}`, 50);
    y -= 20;

    addText('Reason for PIP:', 50, 14, true);
    y -= 5;
    const reasonLines = pip.reason.match(/.{1,80}/g) || [];
    reasonLines.forEach(line => {
      addText(line, 50);
    });
    y -= 10;

    addText('Goals:', 50, 14, true);
    y -= 5;
    pip.goals.forEach((goal, index) => {
      addText(`Goal ${index + 1}: ${goal.title}`, 50, 12, true);
      addText(`Weightage: ${goal.weightage}%`, 70);
      addText(`Description: ${goal.description}`, 70);
      addText(`Expected Outcome: ${goal.expectedOutcome}`, 70);
      if (goal.status) {
        addText(`Status: ${goal.status}`, 70);
      }
      y -= 10;
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pip-${pip.id.slice(0, 8)}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export PIPs to CSV
router.get('/pips/csv', authenticate, requireRole('admin', 'hrbp', 'executive'), async (req: AuthRequest, res) => {
  try {
    const pips = await db.read<PIP>('pips');
    const csvRows = [
      ['PIP ID', 'Employee ID', 'Manager ID', 'Status', 'Created', 'Goals Count', 'Final Outcome'],
    ];

    pips.forEach(pip => {
      csvRows.push([
        pip.id.slice(0, 8),
        pip.employeeId,
        pip.managerId,
        pip.status,
        new Date(pip.createdAt).toLocaleDateString(),
        pip.goals.length.toString(),
        pip.finalOutcome || 'N/A',
      ]);
    });

    const csv = csvRows.map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pips-export.csv');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export PIPs to Excel
router.get('/pips/excel', authenticate, requireRole('admin', 'hrbp', 'executive'), async (req: AuthRequest, res) => {
  try {
    const pips = await db.read<PIP>('pips');
    const data = pips.map(pip => ({
      'PIP ID': pip.id.slice(0, 8),
      'Employee ID': pip.employeeId,
      'Manager ID': pip.managerId,
      'HRBP ID': pip.hrbpId,
      'Status': pip.status,
      'Created': new Date(pip.createdAt).toLocaleDateString(),
      'Goals Count': pip.goals.length,
      'Final Outcome': pip.finalOutcome || 'N/A',
      'Success': pip.finalOutcome === 'successful' ? 'Yes' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PIPs');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=pips-export.xlsx');
    res.send(excelBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

