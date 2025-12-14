import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Edit, CheckCircle, Delete } from '@mui/icons-material';
import { invalidRecordsService, InvalidRecord } from '../services/invalidRecordsService';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function InvalidRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<InvalidRecord[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InvalidRecord | null>(null);
  const [correctedData, setCorrectedData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadRecords();
  }, [activeTab]);

  const loadRecords = async () => {
    try {
      const status = activeTab === 0 ? 'pending' : activeTab === 1 ? 'corrected' : undefined;
      const data = await invalidRecordsService.getInvalidRecords(undefined, status);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load invalid records:', error);
    }
  };

  const handleEdit = (record: InvalidRecord) => {
    setSelectedRecord(record);
    setCorrectedData(record.data);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedRecord) return;
    try {
      await invalidRecordsService.correctRecord(selectedRecord.id, correctedData);
      setEditDialogOpen(false);
      loadRecords();
    } catch (error) {
      alert('Failed to save corrections');
    }
  };

  const handleProcess = async (recordId: string) => {
    if (!confirm('Process this corrected record?')) return;
    try {
      await invalidRecordsService.processRecord(recordId);
      loadRecords();
    } catch (error) {
      alert('Failed to process record');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Delete this record?')) return;
    try {
      await invalidRecordsService.deleteRecord(recordId);
      loadRecords();
    } catch (error) {
      alert('Failed to delete record');
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
      <Typography variant="h4" gutterBottom>
        Invalid Records Queue
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review and correct records that failed validation during import
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label={`Pending (${records.filter(r => r.status === 'pending').length})`} />
          <Tab label={`Corrected (${records.filter(r => r.status === 'corrected').length})`} />
          <Tab label="All" />
        </Tabs>
      </Paper>

      {records.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Invalid Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All records are valid or have been processed.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Batch ID</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Errors</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.rowNumber}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{record.batchId.slice(0, 8)}</Typography>
                  </TableCell>
                  <TableCell>{record.data.userid || '-'}</TableCell>
                  <TableCell>{record.data.username || '-'}</TableCell>
                  <TableCell>
                    {record.errors.map((error, idx) => (
                      <Chip
                        key={idx}
                        label={`${error.field}: ${error.message}`}
                        size="small"
                        color="error"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.status}
                      color={record.status === 'pending' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {record.status === 'pending' && (
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEdit(record)}
                      >
                        Correct
                      </Button>
                    )}
                    {record.status === 'corrected' && (
                      <Button
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => handleProcess(record.id)}
                      >
                        Process
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(record.id)}
                      sx={{ ml: 1 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Correct Invalid Record</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Errors:</Typography>
                {selectedRecord.errors.map((error, idx) => (
                  <Typography key={idx} variant="body2">
                    • {error.field}: {error.message}
                  </Typography>
                ))}
              </Alert>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Corrected Data:
              </Typography>
              {Object.keys(selectedRecord.data).map((key) => (
                <TextField
                  key={key}
                  fullWidth
                  label={key}
                  value={correctedData[key] || ''}
                  onChange={(e) => setCorrectedData({ ...correctedData, [key]: e.target.value })}
                  margin="normal"
                  size="small"
                  error={selectedRecord.errors.some(e => e.field === key)}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Corrections
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

