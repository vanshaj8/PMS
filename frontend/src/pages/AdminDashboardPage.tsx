import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Container,
} from '@mui/material';
import {
  People,
  Warning,
  Assignment,
  Upload,
  Search,
  Build,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userManagementService } from '../services/userManagementService';
import api from '../services/api';
import { DashboardStats } from '../types';
import { importService } from '../services/importService';
import StatCard from '../components/StatCard';
import ModernCard from '../components/ModernCard';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hierarchyHealth, setHierarchyHealth] = useState<any>(null);
  const [managerLoad, setManagerLoad] = useState<Array<{ manager: any; employeeCount: number }>>([]);
  const [lastImport, setLastImport] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard stats
      const statsResponse = await api.get<{ stats: DashboardStats }>('/dashboard/stats');
      setStats(statsResponse.data.stats);

      // Load hierarchy health
      const health = await userManagementService.getHierarchyHealth();
      setHierarchyHealth(health);

      // Load manager load distribution
      const distribution = await userManagementService.getManagerLoadDistribution();
      setManagerLoad(distribution.slice(0, 10)); // Top 10

      // Load last import
      const last = await importService.getLastImport();
      setLastImport(last);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
    <Container maxWidth="xl">
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
          Admin Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Comprehensive overview of system health and operations
        </Typography>
      </Box>

      {/* Quick Actions */}
      <ModernCard
        title="Quick Actions"
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
        headerSx={{ color: 'white' }}
      >
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => navigate('/admin')}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Upload File
          </Button>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={() => navigate('/admin/user-management')}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Search Users
          </Button>
          <Button
            variant="contained"
            startIcon={<Build />}
            onClick={() => navigate('/admin/invalid-records')}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Fix Invalid Records
          </Button>
        </Box>
      </ModernCard>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={hierarchyHealth?.totalUsers || 0}
            icon={<People sx={{ fontSize: 32 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Missing Manager"
            value={hierarchyHealth?.missingManager || 0}
            icon={<Warning sx={{ fontSize: 32 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Missing HRBP"
            value={hierarchyHealth?.missingHRBP || 0}
            icon={<Warning sx={{ fontSize: 32 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active PIPs"
            value={stats?.activePIPs || 0}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Hierarchy Health Widget */}
        <Grid item xs={12} md={6}>
          <ModernCard
            title="Hierarchy Health Check"
            subtitle="Organization structure completeness"
          >
            {hierarchyHealth && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Users with Manager</Typography>
                    <Typography variant="body2">
                      {hierarchyHealth.usersWithManager} / {hierarchyHealth.totalUsers}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(hierarchyHealth.usersWithManager / hierarchyHealth.totalUsers) * 100}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Users with HRBP</Typography>
                    <Typography variant="body2">
                      {hierarchyHealth.usersWithHRBP} / {hierarchyHealth.totalUsers}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(hierarchyHealth.usersWithHRBP / hierarchyHealth.totalUsers) * 100}
                    color="secondary"
                  />
                </Box>
                {hierarchyHealth.circularReporting > 0 && (
                  <Chip
                    label={`${hierarchyHealth.circularReporting} Circular Reporting Issues`}
                    color="error"
                    sx={{ mr: 1 }}
                  />
                )}
                {hierarchyHealth.selfReporting > 0 && (
                  <Chip
                    label={`${hierarchyHealth.selfReporting} Self-Reporting Issues`}
                    color="error"
                  />
                )}
              </Box>
            )}
          </ModernCard>
        </Grid>

        {/* Manager Load Distribution */}
        <Grid item xs={12} md={6}>
          <ModernCard
            title="Manager Load Distribution"
            subtitle="Top 10 managers by employee count"
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Manager</TableCell>
                    <TableCell align="right">Employees</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {managerLoad.map((item) => (
                    <TableRow key={item.manager.id}>
                      <TableCell>
                        {item.manager.firstName} {item.manager.lastName}
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={item.employeeCount} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ModernCard>
        </Grid>

        {/* Last Import Status */}
        {lastImport && (
          <Grid item xs={12}>
            <ModernCard
              title="Last Import Status"
              subtitle={`Batch: ${lastImport.id.slice(0, 8)}`}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    File
                  </Typography>
                  <Typography variant="body1">{lastImport.filename}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">{lastImport.result.created}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Updated
                  </Typography>
                  <Typography variant="body1">{lastImport.result.updated}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={lastImport.result.success ? 'Success' : 'Failed'}
                    color={lastImport.result.success ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </ModernCard>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

