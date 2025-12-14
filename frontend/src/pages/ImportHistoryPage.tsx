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
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { History, Refresh, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { importService, ImportHistory } from '../services/importService';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function ImportHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await importService.getImportHistory();
      setHistory(data.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Failed to load import history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedImport) return;

    setRollbackLoading(true);
    try {
      await importService.rollbackImport(selectedImport.id);
      setRollbackDialogOpen(false);
      setSelectedImport(null);
      await loadHistory();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to rollback import');
    } finally {
      setRollbackLoading(false);
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

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Import History</Typography>
        <Button startIcon={<Refresh />} onClick={loadHistory}>
          Refresh
        </Button>
      </Box>

      {history.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <History sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Import History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import history will appear here after you perform data imports.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Filename</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Errors</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{item.filename}</TableCell>
                  <TableCell>
                    <Chip label={item.mode.toUpperCase()} size="small" />
                  </TableCell>
                  <TableCell>
                    {item.result.success ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Success"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<ErrorIcon />}
                        label="Failed"
                        color="error"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>{item.result.created}</TableCell>
                  <TableCell>{item.result.updated}</TableCell>
                  <TableCell>{item.result.errors}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedImport(item);
                        setRollbackDialogOpen(true);
                      }}
                      disabled={!item.result.success}
                    >
                      Rollback
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Rollback Confirmation Dialog */}
      <Dialog open={rollbackDialogOpen} onClose={() => setRollbackDialogOpen(false)}>
        <DialogTitle>Rollback Import</DialogTitle>
        <DialogContent>
          {selectedImport && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will restore the user data to the state before this import. This action cannot be undone.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Import Date</Typography>
                  <Typography>{format(new Date(selectedImport.timestamp), 'PPpp')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Filename</Typography>
                  <Typography>{selectedImport.filename}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                  <Typography>{selectedImport.result.created} users</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Updated</Typography>
                  <Typography>{selectedImport.result.updated} users</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRollback}
            color="error"
            variant="contained"
            disabled={rollbackLoading}
          >
            {rollbackLoading ? 'Rolling back...' : 'Confirm Rollback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

