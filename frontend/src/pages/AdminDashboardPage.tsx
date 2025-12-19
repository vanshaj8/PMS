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
  Container,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  People,
  Warning,
  Assignment,
  CalendarToday,
  Schedule,
  TrendingUp,
  CheckCircle,
  Error as ErrorIcon,
  ArrowForward,
  Refresh,
  Notifications,
  Assessment,
  BarChart as BarChartIcon,
  Group,
  Build,
  Visibility,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';
import ModernCard from '../components/ModernCard';
import {
  adminDashboardService,
  AdminDashboardData,
  RiskAlert,
  RatingDistribution,
  PerformanceTrend,
  ManagerRatingVariance,
  HighLowPerformers,
} from '../services/adminDashboardService';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution | null>(null);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [managerVariance, setManagerVariance] = useState<ManagerRatingVariance[]>([]);
  const [performers, setPerformers] = useState<HighLowPerformers | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [data, ratingDist, trends, variance, highLow] = await Promise.all([
        adminDashboardService.getAllDashboardData(),
        adminDashboardService.getRatingDistribution(),
        adminDashboardService.getPerformanceTrends(),
        adminDashboardService.getManagerRatingVariance(),
        adminDashboardService.getHighLowPerformers(),
      ]);
      setDashboardData(data);
      setRatingDistribution(ratingDist);
      setPerformanceTrends(trends);
      setManagerVariance(variance);
      setPerformers(highLow);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'RED': return 'error';
      case 'ORANGE': return 'warning';
      case 'GREEN': return 'success';
      default: return 'info';
    }
  };

  const handleAlertAction = (alert: RiskAlert) => {
    switch (alert.action) {
      case 'VIEW_PIPS':
        navigate('/pips?status=overdue');
        break;
      case 'VIEW_REVIEWS':
        navigate('/appraisals?filter=overdue');
        break;
      case 'VIEW_ANALYTICS':
        navigate('/admin/analytics');
        break;
      case 'FIX_NOW':
        navigate('/admin/user-management?filter=missingHierarchy');
        break;
      default:
        break;
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'hrbp') {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          You must be an admin or HRBP to access this page.
        </Alert>
      </Container>
    );
  }

  if (loading || !dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  const { globalKPIs, riskAlerts, pipSnapshot, appraisalSnapshot, orgHealth } = dashboardData;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
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
            Performix Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Operational cockpit for PIP & Appraisal cycles
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={loadDashboardData}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* 1. Global KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Employees"
            value={globalKPIs.totalEmployees}
            icon={<People sx={{ fontSize: 32, color: 'white' }} />}
            color="primary"
            onClick={() => navigate('/admin/user-management')}
            tooltip="Click to view all users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Active PIPs"
            value={globalKPIs.activePIPs}
            icon={<Assignment sx={{ fontSize: 32, color: 'white' }} />}
            color="info"
            onClick={() => navigate('/pips?status=active')}
            tooltip="Click to view active PIPs"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Appraisal Cycles"
            value={globalKPIs.appraisalCycles}
            icon={<CalendarToday sx={{ fontSize: 32, color: 'white' }} />}
            color="success"
            onClick={() => navigate('/appraisals/cycles')}
            tooltip="Click to view cycles"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Reviews Pending"
            value={globalKPIs.reviewsPending}
            icon={<Schedule sx={{ fontSize: 32, color: 'white' }} />}
            color="warning"
            onClick={() => navigate('/appraisals?filter=pending')}
            tooltip="Click to view pending reviews"
            isUrgent={globalKPIs.reviewsPending > 50}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Overdue Actions"
            value={globalKPIs.overdueActions}
            icon={<ErrorIcon sx={{ fontSize: 32, color: 'white' }} />}
            severity={globalKPIs.overdueActions > 20 ? 'critical' : globalKPIs.overdueActions > 10 ? 'high' : 'medium'}
            isUrgent={globalKPIs.overdueActions > 0}
            onClick={() => navigate('/admin?view=overdue')}
            tooltip="Click to view overdue items"
          />
        </Grid>
      </Grid>

      {/* 2. Risk & Attention Required */}
      {riskAlerts.length > 0 && (
        <ModernCard
          title="🚨 Risk & Attention Required"
          subtitle="High priority alerts requiring immediate action"
          sx={{ mb: 4 }}
        >
          <Grid container spacing={2}>
            {riskAlerts.map((alert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Alert
                  severity={getSeverityColor(alert.severity)}
                  action={
                    <Button
                      size="small"
                      onClick={() => handleAlertAction(alert)}
                      endIcon={<ArrowForward />}
                    >
                      {alert.action === 'FIX_NOW' ? 'Fix Now' : 'View'}
                    </Button>
                  }
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleAlertAction(alert)}
                >
                  <AlertTitle>{alert.title}</AlertTitle>
                  {alert.description}
                  {alert.count > 0 && (
                    <Chip
                      label={alert.count}
                      size="small"
                      sx={{ ml: 1, mt: 0.5 }}
                      color={getSeverityColor(alert.severity)}
                    />
                  )}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </ModernCard>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 3. PIP Module Snapshot */}
        <Grid item xs={12} md={6}>
          <ModernCard
            title="PIP Module Snapshot"
            subtitle="Performance Improvement Plan overview"
            action={
              <Button
                size="small"
                startIcon={<Visibility />}
                onClick={() => navigate('/pips')}
                variant="outlined"
              >
                View All
              </Button>
            }
          >
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Active PIPs</Typography>
                <Typography variant="h5">{pipSnapshot.activePIPs}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">New This Month</Typography>
                <Typography variant="h5">{pipSnapshot.newPIPsThisMonth}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                <Typography variant="h5" color="success.main">{pipSnapshot.successRate.toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Avg Duration</Typography>
                <Typography variant="h5">{pipSnapshot.avgDuration.toFixed(0)} days</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>By Department</Typography>
              {Object.entries(pipSnapshot.byDepartment).slice(0, 5).map(([dept, count]) => (
                <Box key={dept} display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">{dept}</Typography>
                  <Chip label={count} size="small" />
                </Box>
              ))}
            </Box>

            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                size="small"
                startIcon={<Assignment />}
                onClick={() => navigate('/pips?status=active')}
                variant="outlined"
              >
                Active PIPs
              </Button>
              <Button
                size="small"
                startIcon={<ErrorIcon />}
                onClick={() => navigate('/pips?status=overdue')}
                variant="outlined"
                color="error"
              >
                Overdue
              </Button>
            </Box>
          </ModernCard>
        </Grid>

        {/* 4. Appraisal Module Snapshot */}
        <Grid item xs={12} md={6}>
          <ModernCard
            title="Appraisal Module Snapshot"
            subtitle="Annual appraisal cycle status"
            action={
              <Button
                size="small"
                startIcon={<CalendarToday />}
                onClick={() => navigate('/appraisals/cycles')}
                variant="outlined"
              >
                View Cycles
              </Button>
            }
          >
            {/* Cycle Status Table */}
            {appraisalSnapshot.cycleStatus.length > 0 && (
              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cycle</TableCell>
                      <TableCell align="right">Status</TableCell>
                      <TableCell align="right">Completion</TableCell>
                      <TableCell align="right">Overdue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appraisalSnapshot.cycleStatus.map((cycle) => (
                      <TableRow key={cycle.cycleId} hover>
                        <TableCell>{cycle.cycleName}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={cycle.status}
                            size="small"
                            color={cycle.status === 'ACTIVE' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={cycle.completion}
                              sx={{ width: 60, height: 8, borderRadius: 1 }}
                            />
                            <Typography variant="body2">{cycle.completion.toFixed(0)}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {cycle.overdue > 0 ? (
                            <Chip label={cycle.overdue} size="small" color="error" />
                          ) : (
                            <CheckCircle color="success" fontSize="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Self Reviews</Typography>
                <Typography variant="h6">{appraisalSnapshot.selfReviewsPending}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Manager Reviews</Typography>
                <Typography variant="h6">{appraisalSnapshot.managerReviewsPending}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Calibration</Typography>
                <Typography variant="h6">{appraisalSnapshot.calibrationPending}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Finalized</Typography>
                <Typography variant="h6" color="success.main">
                  {appraisalSnapshot.finalizedPercent.toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>

            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                size="small"
                startIcon={<Notifications />}
                onClick={() => navigate('/appraisals?action=nudge')}
                variant="outlined"
              >
                Nudge Managers
              </Button>
              <Button
                size="small"
                startIcon={<Schedule />}
                onClick={() => navigate('/appraisals?action=extend')}
                variant="outlined"
              >
                Extend Deadlines
              </Button>
            </Box>
          </ModernCard>
        </Grid>

        {/* 5. Organization Health & Load */}
        <Grid item xs={12}>
          <ModernCard
            title="Organization Health & Load"
            subtitle="Manager distribution and hierarchy completeness"
            action={
              <Button
                size="small"
                startIcon={<Build />}
                onClick={() => navigate('/admin/user-management?view=health')}
                variant="outlined"
              >
                Fix Issues
              </Button>
            }
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Manager Load Distribution</Typography>
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
                      {orgHealth.managerLoad.slice(0, 10).map((load) => (
                        <TableRow key={load.managerId} hover>
                          <TableCell>{load.managerName}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={load.employeeCount}
                              size="small"
                              color={
                                load.status === 'OVERLOADED' ? 'error' :
                                load.status === 'AT_RISK' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={load.status.replace('_', ' ')}
                              size="small"
                              color={
                                load.status === 'OVERLOADED' ? 'error' :
                                load.status === 'AT_RISK' ? 'warning' : 'success'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/user-management?managerId=${load.managerId}`)}
                            >
                              <ArrowForward fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Hierarchy Health</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Users with Manager</Typography>
                    <Typography variant="body2">
                      {orgHealth.totalUsers - orgHealth.missingManagers} / {orgHealth.totalUsers}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((orgHealth.totalUsers - orgHealth.missingManagers) / orgHealth.totalUsers) * 100}
                    color={
                      orgHealth.missingManagers > 10 ? 'error' :
                      orgHealth.missingManagers > 5 ? 'warning' : 'success'
                    }
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Users with HRBP</Typography>
                    <Typography variant="body2">
                      {orgHealth.totalUsers - orgHealth.missingHRBPs} / {orgHealth.totalUsers}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((orgHealth.totalUsers - orgHealth.missingHRBPs) / orgHealth.totalUsers) * 100}
                    color={
                      orgHealth.missingHRBPs > 10 ? 'error' :
                      orgHealth.missingHRBPs > 5 ? 'warning' : 'success'
                    }
                  />
                </Box>

                {(orgHealth.missingManagers > 0 || orgHealth.missingHRBPs > 0) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <AlertTitle>Action Required</AlertTitle>
                    {orgHealth.missingManagers} missing managers, {orgHealth.missingHRBPs} missing HRBPs
                    <Button
                      size="small"
                      startIcon={<Build />}
                      onClick={() => navigate('/admin/user-management?filter=missingHierarchy')}
                      sx={{ ml: 2 }}
                    >
                      Fix Now
                    </Button>
                  </Alert>
                )}
              </Grid>
            </Grid>
          </ModernCard>
        </Grid>
      </Grid>

      {/* 6. Rating & Performance Analytics */}
      <ModernCard
        title="Rating & Performance Analytics"
        subtitle="Visual insights into performance metrics"
        sx={{ mb: 4 }}
        action={
          <Button
            size="small"
            startIcon={<BarChartIcon />}
            onClick={() => navigate('/admin/analytics')}
            variant="outlined"
          >
            View Detailed Analytics
          </Button>
        }
      >
        <Grid container spacing={3}>
          {/* Rating Distribution */}
          {ratingDistribution && ratingDistribution.total > 0 && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Rating Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(ratingDistribution.distribution).map(([name, value]) => ({
                    name,
                    value: Number(value),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#667eea" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          )}

          {/* High/Mid/Low Performers */}
          {performers && performers.total > 0 && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Performance Categories
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'High Performers', value: performers.high, color: '#4caf50' },
                      { name: 'Mid Performers', value: performers.mid, color: '#ff9800' },
                      { name: 'Low Performers', value: performers.low, color: '#f44336' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'High Performers', value: performers.high, color: '#4caf50' },
                      { name: 'Mid Performers', value: performers.mid, color: '#ff9800' },
                      { name: 'Low Performers', value: performers.low, color: '#f44336' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" justifyContent="center" gap={2} mt={2}>
                <Chip label={`High: ${performers.high}`} color="success" size="small" />
                <Chip label={`Mid: ${performers.mid}`} color="warning" size="small" />
                <Chip label={`Low: ${performers.low}`} color="error" size="small" />
              </Box>
            </Grid>
          )}

          {/* Performance Trends */}
          {performanceTrends.length > 0 && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Performance Trends (Last 6 Months)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pips"
                    stroke="#667eea"
                    strokeWidth={2}
                    name="PIPs"
                  />
                  <Line
                    type="monotone"
                    dataKey="appraisals"
                    stroke="#764ba2"
                    strokeWidth={2}
                    name="Appraisals"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Grid>
          )}

          {/* Manager Rating Variance */}
          {managerVariance.length > 0 && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Manager Rating Variance (Top 10)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={managerVariance.map((m) => ({
                    name: m.managerName.length > 15 ? m.managerName.substring(0, 15) + '...' : m.managerName,
                    variance: m.variance,
                    avgRating: m.avgRating,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="variance" fill="#f44336" name="Variance" />
                  <Bar dataKey="avgRating" fill="#667eea" name="Avg Rating" />
                </BarChart>
              </ResponsiveContainer>
              <Alert severity="info" sx={{ mt: 2 }}>
                Higher variance indicates inconsistent rating patterns. Consider calibration.
              </Alert>
            </Grid>
          )}
        </Grid>
      </ModernCard>
    </Container>
  );
}
