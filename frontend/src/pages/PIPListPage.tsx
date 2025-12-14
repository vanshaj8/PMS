import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import { Visibility, Add, Download } from '@mui/icons-material';
import { pipService } from '../services/pipService';
import { PIP, PIPStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const statusColors: Record<PIPStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  pending_hrbp_review: 'info',
  pending_employee_acknowledgement: 'warning',
  active: 'primary',
  pending_employee_self_review: 'warning',
  pending_manager_review: 'info',
  pending_hrbp_decision: 'warning',
  completed: 'success',
  overdue: 'error',
  denied: 'error',
  closed: 'default',
};

export default function PIPListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pips, setPips] = useState<PIP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPIPs();
  }, []);

  const loadPIPs = async () => {
    try {
      const data = await pipService.getAllPIPs();
      setPips(data);
    } catch (error) {
      console.error('Failed to load PIPs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Performance Improvement Plans</Typography>
        <Box display="flex" gap={1}>
          {(user?.role === 'admin' || user?.role === 'executive' || user?.role === 'hrbp') && (
            <>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => window.open('/api/reports/pips/csv', '_blank')}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => window.open('/api/reports/pips/excel', '_blank')}
              >
                Export Excel
              </Button>
            </>
          )}
          {user?.role === 'manager' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/pips/create')}
            >
              Create PIP
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Goals</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No PIPs found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              pips.map((pip) => (
                <TableRow key={pip.id} hover>
                  <TableCell>
                    <Typography variant="body2">PIP #{pip.id.slice(0, 8)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={pip.status.replace(/_/g, ' ').toUpperCase()}
                      color={statusColors[pip.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{pip.goals.length} goals</TableCell>
                  <TableCell>{format(new Date(pip.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/pips/${pip.id}`)}
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

