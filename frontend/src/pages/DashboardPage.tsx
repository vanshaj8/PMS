import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Warning,
  CheckCircle,
  PersonAdd,
  Upload,
  Search,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { DashboardStats, PIP } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ModernCard from '../components/ModernCard';
import { pipService } from '../services/pipService';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pips, setPips] = useState<PIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [managerLoad, setManagerLoad] = useState<Array<{ manager: any; employeeCount: number; pipsCount: number; overdueCount: number }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, pipsData] = await Promise.all([
        api.get<{ stats: DashboardStats }>('/dashboard/stats'),
        pipService.getAllPIPs(),
      ]);
      
      setStats(statsResponse.data.stats);
      setPips(pipsData);
      
      // Calculate manager load
      if (user?.role === 'manager' || user?.role === 'admin') {
        const managerMap = new Map();
        pipsData.forEach(pip => {
          if (!managerMap.has(pip.managerId)) {
            managerMap.set(pip.managerId, {
              managerId: pip.managerId,
              pipsCount: 0,
              overdueCount: 0,
            });
          }
          const mgr = managerMap.get(pip.managerId);
          mgr.pipsCount++;
          if (pip.status === 'overdue') {
            mgr.overdueCount++;
          }
        });
        
        // Get manager details
        const managerLoadData = await Promise.all(
          Array.from(managerMap.entries()).map(async ([managerId, data]) => {
            try {
              const userResponse = await api.get<{ user: any }>(`/users/${managerId}`);
              return {
                manager: userResponse.data.user,
                employeeCount: 0, // Would need to calculate from users
                pipsCount: data.pipsCount,
                overdueCount: data.overdueCount,
              };
            } catch {
              return null;
            }
          })
        );
        
        setManagerLoad(managerLoadData.filter(Boolean) as any);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

  // Calculate chart data for PIPs per month (last 6 months)
  const calculateChartData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: 0,
      });
    }

    pips.forEach(pip => {
      if (pip.createdAt) {
        const pipDate = new Date(pip.createdAt);
        const monthKey = pipDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthData = months.find(m => m.month === monthKey);
        if (monthData) {
          monthData.count++;
        }
      }
    });

    return months;
  };

  const chartData = calculateChartData();

  // Calculate outcome data for pie chart
  const calculateOutcomeData = () => {
    const outcomes = {
      successful: 0,
      unsuccessful: 0,
      inProgress: 0,
    };

    pips.forEach(pip => {
      if (pip.status === 'completed') {
        if (pip.finalOutcome === 'successful') {
          outcomes.successful++;
        } else if (pip.finalOutcome === 'unsuccessful') {
          outcomes.unsuccessful++;
        }
      } else {
        outcomes.inProgress++;
      }
    });

    return [
      { name: 'Successful', value: outcomes.successful, color: '#2e7d32' },
      { name: 'Unsuccessful', value: outcomes.unsuccessful, color: '#d32f2f' },
      { name: 'In Progress', value: outcomes.inProgress, color: '#ed6c02' },
    ].filter(item => item.value > 0);
  };

  const outcomeData = calculateOutcomeData();

  const statCards = [
    {
      title: 'Total PIPs',
      value: stats?.totalPIPs || 0,
      icon: <Assignment sx={{ fontSize: 32 }} />,
      color: '#1976d2',
    },
    {
      title: 'Active PIPs',
      value: stats?.activePIPs || 0,
      icon: <Schedule sx={{ fontSize: 32 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Pending Action',
      value: stats?.pendingAction || 0,
      icon: <Warning sx={{ fontSize: 32 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Overdue',
      value: stats?.overduePIPs || 0,
      icon: <Warning sx={{ fontSize: 32 }} />,
      color: '#d32f2f',
    },
  ];

  if (user?.role === 'admin' || user?.role === 'executive') {
    statCards.push(
      {
        title: 'Success Rate',
        value: `${stats?.successRate || 0}%`,
        icon: <CheckCircle fontSize="large" />,
        color: '#2e7d32',
      },
      {
        title: 'Avg Duration',
        value: `${stats?.averageDuration || 0} days`,
        icon: <Schedule fontSize="large" />,
        color: '#1976d2',
      }
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
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Welcome back, <strong>{user?.firstName}</strong>! Here's an overview of your PIPs.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <ModernCard
        title="Quick Actions"
        sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
        headerSx={{ color: 'white' }}
      >
        <Box display="flex" gap={2} flexWrap="wrap">
          {user?.role === 'manager' && (
            <>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/pips/create')}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                Initiate PIP
              </Button>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => navigate('/admin')}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                Upload User File
              </Button>
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={() => navigate('/admin/user-management')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              Search User
            </Button>
          )}
        </Box>
      </ModernCard>

      <Grid container spacing={3}>
        {/* Bar Chart - PIPs per Month */}
        <Grid item xs={12} md={6}>
          <ModernCard title="PIPs Initiated Per Month" subtitle="Last 6 months">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ModernCard>
        </Grid>

        {/* Pie Chart - PIP Outcomes */}
        <Grid item xs={12} md={6}>
          <ModernCard title="PIP Outcomes" subtitle="Success vs Failure">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ModernCard>
        </Grid>

        {/* Manager Load Table */}
        {(user?.role === 'admin' || user?.role === 'manager') && managerLoad.length > 0 && (
          <Grid item xs={12}>
            <ModernCard
              title="Manager Load Distribution"
              subtitle="Team performance overview"
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Manager Name</TableCell>
                      <TableCell align="right">Total Reports</TableCell>
                      <TableCell align="right">Employees on PIP</TableCell>
                      <TableCell align="right">Overdue Items</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {managerLoad.map((item) => (
                      <TableRow key={item.manager.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            >
                              {item.manager.firstName?.[0]}{item.manager.lastName?.[0]}
                            </Box>
                            {item.manager.firstName} {item.manager.lastName}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={item.employeeCount} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={item.pipsCount} color="primary" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          {item.overdueCount > 0 ? (
                            <Chip label={item.overdueCount} color="error" size="small" />
                          ) : (
                            <Chip label="0" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/admin/user-management?managerId=${item.manager.id}`)}
                          >
                            View Team
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </ModernCard>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

