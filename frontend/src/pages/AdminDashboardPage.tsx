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
  IconButton,
  Link,
  Divider,
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
  Visibility,
  AutoFixHigh,
  Refresh,
  ArrowForward,
  Error as ErrorIcon,
  Schedule,
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

  // Calculate severity based on count and thresholds
  const getSeverity = (count: number, threshold: { low: number; medium: number; high: number }) => {
    if (count >= threshold.high) return 'critical';
    if (count >= threshold.medium) return 'high';
    if (count >= threshold.low) return 'medium';
    return 'low';
  };

  // Calculate if urgent (needs immediate attention)
  const isUrgent = (count: number, threshold: number) => count > threshold;

  // Calculate trend (mock for now - would come from backend)
  const getTrend = (current: number, previous?: number) => {
    if (!previous) return undefined;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Typography variant="h4">Access Denied</Typography>
        <Typography>You must be an admin to access this page.</Typography>
      </Box>
    );
  }

  const missingManagerCount = hierarchyHealth?.missingManager || 0;
  const missingHRBPCount = hierarchyHealth?.missingHRBP || 0;
  const activePIPsCount = stats?.activePIPs || 0;
  const overduePIPsCount = stats?.overduePIPs || 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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

      {/* Stats Cards - Now Clickable with Contextual Navigation */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ height: '100%' }}>
            <StatCard
              title="Total Users"
              value={hierarchyHealth?.totalUsers || 0}
              icon={<People sx={{ fontSize: 32 }} />}
              color="primary"
              onClick={() => navigate('/admin/user-management')}
              tooltip="Click to view all users"
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ height: '100%' }}>
            <StatCard
              title="Missing Manager"
              value={missingManagerCount}
              icon={<Warning sx={{ fontSize: 32 }} />}
              severity={getSeverity(missingManagerCount, { low: 1, medium: 5, high: 10 })}
              isUrgent={isUrgent(missingManagerCount, 5)}
              onClick={() => navigate('/admin/user-management?filter=missingManager')}
              tooltip="Click to view and fix users without managers"
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ height: '100%' }}>
            <StatCard
              title="Missing HRBP"
              value={missingHRBPCount}
              icon={<Warning sx={{ fontSize: 32 }} />}
              severity={getSeverity(missingHRBPCount, { low: 1, medium: 5, high: 10 })}
              isUrgent={isUrgent(missingHRBPCount, 5)}
              onClick={() => navigate('/admin/user-management?filter=missingHRBP')}
              tooltip="Click to view and fix users without HRBP"
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ height: '100%' }}>
            <StatCard
              title="Active PIPs"
              value={activePIPsCount}
              icon={<Assignment sx={{ fontSize: 32 }} />}
              color="info"
              onClick={() => navigate('/pips?status=active')}
              tooltip="Click to view all active PIPs"
            />
          </Box>
        </Grid>
        {/* Additional Critical Metrics - Inline with other cards */}
        {overduePIPsCount > 0 && (
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ height: '100%' }}>
              <StatCard
                title="Overdue PIPs"
                value={overduePIPsCount}
                icon={<ErrorIcon sx={{ fontSize: 32 }} />}
                severity="critical"
                isUrgent={true}
                onClick={() => navigate('/pips?status=overdue')}
                tooltip="Click to view and resolve overdue PIPs"
              />
            </Box>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Hierarchy Health Widget - Now with Remediation Actions */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%' }}>
            <ModernCard
              title="Hierarchy Health Check"
              subtitle="Organization structure completeness"
              action={
                <Button
                  size="small"
                  startIcon={<AutoFixHigh />}
                  onClick={() => navigate('/admin/user-management?action=bulkFix')}
                  variant="outlined"
                >
                  Bulk Fix
                </Button>
              }
            >
            {hierarchyHealth && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Users with Manager</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {hierarchyHealth.usersWithManager} / {hierarchyHealth.totalUsers}
                      </Typography>
                      {hierarchyHealth.missingManager > 0 && (
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate('/admin/user-management?filter=missingManager')}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(hierarchyHealth.usersWithManager / hierarchyHealth.totalUsers) * 100}
                    color={
                      (hierarchyHealth.usersWithManager / hierarchyHealth.totalUsers) * 100 < 90
                        ? 'error'
                        : (hierarchyHealth.usersWithManager / hierarchyHealth.totalUsers) * 100 < 95
                        ? 'warning'
                        : 'success'
                    }
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Users with HRBP</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {hierarchyHealth.usersWithHRBP} / {hierarchyHealth.totalUsers}
                      </Typography>
                      {hierarchyHealth.missingHRBP > 0 && (
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate('/admin/user-management?filter=missingHRBP')}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(hierarchyHealth.usersWithHRBP / hierarchyHealth.totalUsers) * 100}
                    color={
                      (hierarchyHealth.usersWithHRBP / hierarchyHealth.totalUsers) * 100 < 90
                        ? 'error'
                        : (hierarchyHealth.usersWithHRBP / hierarchyHealth.totalUsers) * 100 < 95
                        ? 'warning'
                        : 'success'
                    }
                  />
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {hierarchyHealth.circularReporting > 0 && (
                    <Chip
                      icon={<ErrorIcon />}
                      label={`${hierarchyHealth.circularReporting} Circular Reporting Issues`}
                      color="error"
                      onClick={() => navigate('/admin/user-management?filter=circularReporting')}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                  {hierarchyHealth.selfReporting > 0 && (
                    <Chip
                      icon={<ErrorIcon />}
                      label={`${hierarchyHealth.selfReporting} Self-Reporting Issues`}
                      color="error"
                      onClick={() => navigate('/admin/user-management?filter=selfReporting')}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                </Box>
              </Box>
            )}
            </ModernCard>
          </Box>
        </Grid>

        {/* Manager Load Distribution - Now with Risk Indicators */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%' }}>
            <ModernCard
              title="Manager Load Distribution"
              subtitle="Top 10 managers by employee count"
              action={
                <Button
                  size="small"
                  startIcon={<TrendingUp />}
                  onClick={() => navigate('/admin/user-management?view=managerLoad')}
                  variant="outlined"
                >
                  View All
                </Button>
              }
            >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Manager</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {managerLoad.map((item) => {
                    const isOverloaded = item.employeeCount > 15;
                    const isAtRisk = item.employeeCount > 10;
                    return (
                      <TableRow key={item.manager.id} hover>
                        <TableCell>
                          {item.manager.firstName} {item.manager.lastName}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.employeeCount}
                            size="small"
                            color={isOverloaded ? 'error' : isAtRisk ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {isOverloaded ? (
                            <Chip label="Overloaded" color="error" size="small" />
                          ) : isAtRisk ? (
                            <Chip label="At Risk" color="warning" size="small" />
                          ) : (
                            <Chip label="Normal" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/user-management?managerId=${item.manager.id}`)}
                          >
                            <ArrowForward fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            </ModernCard>
          </Box>
        </Grid>

        {/* Last Import Status - Now with Actionable Details */}
        {lastImport && (
          <Grid item xs={12}>
            <ModernCard
              title="Last Import Status"
              subtitle={`Batch: ${lastImport.id.slice(0, 8)} • ${new Date(lastImport.createdAt).toLocaleString()}`}
              action={
                <Box display="flex" gap={1}>
                  {!lastImport.result.success && (
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate('/admin/invalid-records')}
                      variant="outlined"
                      color="error"
                    >
                      View Errors
                    </Button>
                  )}
                  <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={() => navigate('/admin?tab=dataImport')}
                    variant="outlined"
                  >
                    New Import
                  </Button>
                </Box>
              }
            >
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    File
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {lastImport.filename}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">{lastImport.result.created}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Updated
                  </Typography>
                  <Typography variant="body1">{lastImport.result.updated}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Errors
                  </Typography>
                  <Typography variant="body1" color={lastImport.result.errors > 0 ? 'error' : 'text.primary'}>
                    {lastImport.result.errors || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={lastImport.result.success ? 'Success' : 'Failed'}
                    color={lastImport.result.success ? 'success' : 'error'}
                    size="small"
                    icon={lastImport.result.success ? <CheckCircle /> : <ErrorIcon />}
                  />
                </Grid>
              </Grid>
              {lastImport.result.errors > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="error">
                        {lastImport.result.errors} records failed validation
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click "View Errors" to see details and fix issues
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Build />}
                      onClick={() => navigate('/admin/invalid-records')}
                    >
                      Fix Now
                    </Button>
                  </Box>
                </>
              )}
            </ModernCard>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
