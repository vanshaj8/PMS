import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import ModernCard from '../components/ModernCard';
import StatCard from '../components/StatCard';
import DragDropUpload from '../components/DragDropUpload';
import {
  CloudUpload,
  Preview,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  History,
  Refresh,
  TrendingUp,
} from '@mui/icons-material';
import { importService, PreviewResult, ImportResult } from '../services/importService';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const steps = ['Upload File', 'Preview & Validate', 'Import Data'];

export default function ImportPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importMode, setImportMode] = useState<'full' | 'delta' | 'append'>('delta');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Invalid file type. Please upload .xlsx, .xls, or .csv file.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }

      setSelectedFile(file);
      setError('');
      setActiveStep(1);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      const result = await importService.previewFile(selectedFile);
      setPreviewResult(result);
      setShowPreview(true);
      
      if (result.validation.isValid) {
        setActiveStep(2);
      } else {
        setError(`Validation failed. Found ${result.validation.errors.length} errors. Please review and fix.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      const result = await importService.importFile(selectedFile, importMode);
      setImportResult(result.result);
      setActiveStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import file');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewResult(null);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadErrorReport = async () => {
    if (!previewResult) return;
    
    try {
      const blob = await importService.downloadErrorReport(
        previewResult.preview,
        previewResult.validation
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-errors.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download error report');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Typography variant="h4">Access Denied</Typography>
        <Typography>You must be an admin to access this page.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Data Import
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Upload Excel or CSV files to import user and organizational data
        </Typography>
      </Box>

      <ModernCard sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </ModernCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {activeStep === 0 && (
        <ModernCard sx={{ p: 6, textAlign: 'center' }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <CloudUpload sx={{ fontSize: 64, color: 'white' }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Upload File
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Supported formats: .xlsx, .xls, .csv (Max 10MB)
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
          >
            Select File
          </Button>
          {selectedFile && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Selected: {selectedFile.name}</Typography>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={handlePreview}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                Preview & Validate
              </Button>
            </Box>
          )}
        </ModernCard>
      )}

      {activeStep === 1 && previewResult && (
        <ModernCard title="Preview & Validation">
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button variant="outlined" onClick={() => setShowPreview(true)}>
              View Details
            </Button>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Total Rows"
                value={previewResult.totalRows}
                icon={<CloudUpload sx={{ fontSize: 32 }} />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Errors"
                value={previewResult.validation.errors.length}
                icon={<Warning sx={{ fontSize: 32 }} />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Warnings"
                value={previewResult.validation.warnings.length}
                icon={<Warning sx={{ fontSize: 32 }} />}
                color="warning"
              />
            </Grid>
          </Grid>

          {previewResult.validation.isValid ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Validation passed! Ready to import.
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              Validation failed. Please fix errors before importing.
              <Button
                size="small"
                onClick={downloadErrorReport}
                sx={{ ml: 2 }}
              >
                Download Error Report
              </Button>
            </Alert>
          )}

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={handleReset}>Cancel</Button>
            {previewResult.validation.isValid && (
              <Button variant="contained" onClick={() => setActiveStep(2)}>
                Continue to Import
              </Button>
            )}
          </Box>
        </ModernCard>
      )}

      {activeStep === 2 && (
        <ModernCard title="Import Configuration">

          <TextField
            fullWidth
            select
            label="Import Mode"
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as any)}
            sx={{ mb: 2 }}
            helperText={
              importMode === 'full'
                ? 'Full Load: Deletes all existing data and replaces with new data'
                : importMode === 'delta'
                ? 'Delta Load: Updates existing records and adds new ones'
                : 'Append Mode: Only adds new records, skips existing ones'
            }
          >
            <MenuItem value="full">Full Load</MenuItem>
            <MenuItem value="delta">Delta Load</MenuItem>
            <MenuItem value="append">Append Mode</MenuItem>
          </TextField>

          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will modify user data and may affect active PIPs. Please ensure you have reviewed the preview.
          </Alert>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Importing...' : 'Import Data'}
            </Button>
          </Box>
        </ModernCard>
      )}

      {activeStep === 3 && importResult && (
        <ModernCard>
          <Box display="flex" alignItems="center" gap={2} mb={4}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Import Completed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successfully processed your import file
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Created"
                value={importResult.created}
                icon={<CheckCircle sx={{ fontSize: 32 }} />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Updated"
                value={importResult.updated}
                icon={<TrendingUp sx={{ fontSize: 32 }} />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Errors"
                value={importResult.errors}
                icon={<Warning sx={{ fontSize: 32 }} />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Rows"
                value={importResult.totalRows}
                icon={<CloudUpload sx={{ fontSize: 32 }} />}
                color="primary"
              />
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary">
            Import ID: {importResult.importId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed: {format(new Date(importResult.timestamp), 'PPpp')}
          </Typography>

          <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button onClick={handleReset}>Import Another File</Button>
          </Box>
        </ModernCard>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>File Preview & Validation Details</DialogTitle>
        <DialogContent>
          {previewResult && (
            <Box>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                <Tab label="Preview Data" />
                <Tab label="Errors" />
                <Tab label="Warnings" />
              </Tabs>

              {activeTab === 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {previewResult.headers.map((header) => (
                          <TableCell key={header}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewResult.preview.map((row, index) => (
                        <TableRow key={index}>
                          {previewResult.headers.map((header) => (
                            <TableCell key={header}>{row[header] || '-'}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 1 && (
                <Box>
                  {previewResult.validation.errors.length === 0 ? (
                    <Alert severity="success">No errors found</Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Row</TableCell>
                            <TableCell>Field</TableCell>
                            <TableCell>Error</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewResult.validation.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.rowNumber}</TableCell>
                              <TableCell>{error.field}</TableCell>
                              <TableCell>{error.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  {previewResult.validation.warnings.length === 0 ? (
                    <Alert severity="info">No warnings</Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Row</TableCell>
                            <TableCell>Field</TableCell>
                            <TableCell>Warning</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewResult.validation.warnings.map((warning, index) => (
                            <TableRow key={index}>
                              <TableCell>{warning.rowNumber || 'N/A'}</TableCell>
                              <TableCell>{warning.field}</TableCell>
                              <TableCell>{warning.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          {previewResult && !previewResult.validation.isValid && (
            <Button onClick={downloadErrorReport} variant="outlined">
              Download Error Report
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

