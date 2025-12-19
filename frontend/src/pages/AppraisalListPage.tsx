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
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Visibility, Assessment } from '@mui/icons-material';
import { appraisalService } from '../services/appraisalService';
import { AppraisalCycle, AppraisalCycleStatus } from '../../shared/types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const statusColors: Record<AppraisalCycleStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  DRAFT: 'default',
  ACTIVE: 'primary',
  LOCKED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

export default function AppraisalListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      const data = await appraisalService.getCycles();
      setCycles(data);
    } catch (error) {
      console.error('Failed to load appraisal cycles:', error);
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

  const activeCycles = cycles.filter(c => c.status === 'ACTIVE');
  const completedCycles = cycles.filter(c => c.status === 'COMPLETED');
  const draftCycles = cycles.filter(c => c.status === 'DRAFT');

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Annual Appraisals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage annual performance review cycles
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Cycles
              </Typography>
              <Typography variant="h4">{activeCycles.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Completed Cycles
              </Typography>
              <Typography variant="h4">{completedCycles.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Draft Cycles
              </Typography>
              <Typography variant="h4">{draftCycles.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cycles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Cycle Name</strong></TableCell>
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell><strong>End Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cycles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No appraisal cycles found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cycles.map((cycle) => (
                <TableRow key={cycle.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight={500}>
                      {cycle.cycleName}
                    </Typography>
                    {cycle.description && (
                      <Typography variant="caption" color="text.secondary">
                        {cycle.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(cycle.startDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(cycle.endDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cycle.status}
                      color={statusColors[cycle.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(cycle.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        // TODO: Navigate to cycle detail page when created
                        // navigate(`/appraisals/cycles/${cycle.id}`);
                        console.log('View cycle:', cycle.id);
                      }}
                      title="View Details"
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
