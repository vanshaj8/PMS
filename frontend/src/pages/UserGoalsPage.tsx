import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Lock,
  History,
  Visibility,
  Assignment,
  CalendarToday,
  CheckCircle,
  Cancel,
  ArrowBack,
  Refresh,
} from '@mui/icons-material';
import ModernCard from '../components/ModernCard';
import { goalService, Goal, GoalWithHistory, CreateGoalRequest, UpdateGoalRequest } from '../services/goalService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserGoalsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalHistory, setGoalHistory] = useState<GoalWithHistory | null>(null);
  const [formData, setFormData] = useState<CreateGoalRequest>({
    employeeId: userId || '',
    title: '',
    description: '',
    weightage: 0,
    goalType: 'BUSINESS_GOAL',
    successCriteria: '',
    targetDate: '',
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (userId) {
      loadGoals();
    }
  }, [userId, filterStatus]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const allGoals = await goalService.getUserGoals(userId!, true);
      
      // Filter by status
      let filtered = allGoals;
      if (filterStatus !== 'all') {
        filtered = allGoals.filter(g => g.status === filterStatus);
      }
      
      // Show only current versions
      filtered = filtered.filter(g => g.isCurrentVersion);
      
      setGoals(filtered);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      const newGoal = await goalService.createGoal(formData);
      setGoals([...goals, newGoal]);
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create goal');
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      const updateRequest: UpdateGoalRequest = {
        title: formData.title || selectedGoal.title,
        description: formData.description,
        weightage: formData.weightage || selectedGoal.weightage,
        successCriteria: formData.successCriteria,
        targetDate: formData.targetDate,
        changeReason: 'Goal updated by user',
      };
      
      const updated = await goalService.updateGoal(selectedGoal.id, updateRequest);
      setGoals(goals.map(g => g.id === updated.id ? updated : g));
      setEditDialogOpen(false);
      setSelectedGoal(null);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update goal');
    }
  };

  const handleLockGoal = async (goal: Goal) => {
    if (!window.confirm('Are you sure you want to lock this goal? Locked goals cannot be modified.')) {
      return;
    }
    
    try {
      const lockReason = prompt('Please provide a reason for locking this goal:');
      if (!lockReason) return;
      
      await goalService.lockGoal(goal.id, lockReason);
      await loadGoals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to lock goal');
    }
  };

  const handleViewHistory = async (goal: Goal) => {
    try {
      const history = await goalService.getGoalHistory(goal.id);
      setGoalHistory(history);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error('Failed to load goal history:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: userId || '',
      title: '',
      description: '',
      weightage: 0,
      goalType: 'BUSINESS_GOAL',
      successCriteria: '',
      targetDate: '',
    });
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'LOCKED': return 'warning';
      case 'ACHIEVED': return 'success';
      case 'PARTIALLY_ACHIEVED': return 'info';
      case 'NOT_ACHIEVED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const getGoalTypeLabel = (type: Goal['goalType']) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const canEditGoal = (goal: Goal) => {
    return !goal.isLocked && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'hrbp');
  };

  const canCreateGoal = () => {
    return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'hrbp';
  };

  const filteredGoals = goals.filter(g => {
    if (filterStatus === 'all') return true;
    return g.status === filterStatus;
  });

  const totalWeightage = filteredGoals.reduce((sum, g) => sum + g.weightage, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 1 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            User Goals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage goals for user: {userId}
          </Typography>
        </Box>
        {canCreateGoal() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setCreateDialogOpen(true);
            }}
          >
            Add Goal
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Goals</Typography>
              <Typography variant="h4">{goals.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Active Goals</Typography>
              <Typography variant="h4" color="success.main">
                {goals.filter(g => g.status === 'ACTIVE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Weightage</Typography>
              <Typography variant="h4">{totalWeightage.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Locked Goals</Typography>
              <Typography variant="h4" color="warning.main">
                {goals.filter(g => g.isLocked).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="All Goals" onClick={() => setFilterStatus('all')} />
          <Tab label="Active" onClick={() => setFilterStatus('ACTIVE')} />
          <Tab label="Locked" onClick={() => setFilterStatus('LOCKED')} />
          <Tab label="Achieved" onClick={() => setFilterStatus('ACHIEVED')} />
        </Tabs>
      </Box>

      {/* Goals Table */}
      <ModernCard title="Goals List" action={<Button startIcon={<Refresh />} onClick={loadGoals}>Refresh</Button>}>
        {loading ? (
          <LinearProgress />
        ) : filteredGoals.length === 0 ? (
          <Alert severity="info">No goals found</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Weightage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Target Date</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGoals.map((goal) => (
                  <TableRow key={goal.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {goal.title}
                      </Typography>
                      {goal.description && (
                        <Typography variant="caption" color="text.secondary">
                          {goal.description.substring(0, 50)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={getGoalTypeLabel(goal.goalType)} size="small" />
                    </TableCell>
                    <TableCell>{goal.weightage}%</TableCell>
                    <TableCell>
                      <Chip
                        label={goal.status}
                        color={getStatusColor(goal.status)}
                        size="small"
                        icon={goal.isLocked ? <Lock fontSize="small" /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={`v${goal.versionNumber}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Tooltip title="View History">
                          <IconButton size="small" onClick={() => handleViewHistory(goal)}>
                            <History fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEditGoal(goal) && (
                          <Tooltip title="Edit Goal">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setFormData({
                                  employeeId: goal.employeeId,
                                  title: goal.title,
                                  description: goal.description || '',
                                  weightage: goal.weightage,
                                  goalType: goal.goalType,
                                  successCriteria: goal.successCriteria || '',
                                  targetDate: goal.targetDate || '',
                                });
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!goal.isLocked && canCreateGoal() && (
                          <Tooltip title="Lock Goal">
                            <IconButton size="small" onClick={() => handleLockGoal(goal)}>
                              <Lock fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </ModernCard>

      {/* Create Goal Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weightage (%)"
                type="number"
                value={formData.weightage}
                onChange={(e) => setFormData({ ...formData, weightage: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Goal Type"
                value={formData.goalType}
                onChange={(e) => setFormData({ ...formData, goalType: e.target.value as Goal['goalType'] })}
                required
              >
                <MenuItem value="BUSINESS_GOAL">Business Goal</MenuItem>
                <MenuItem value="BEHAVIORAL_GOAL">Behavioral Goal</MenuItem>
                <MenuItem value="COMPETENCY_GOAL">Competency Goal</MenuItem>
                <MenuItem value="OKR">OKR</MenuItem>
                <MenuItem value="DEVELOPMENT_GOAL">Development Goal</MenuItem>
                <MenuItem value="PIP_IMPROVEMENT_GOAL">PIP Improvement Goal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Success Criteria"
                value={formData.successCriteria}
                onChange={(e) => setFormData({ ...formData, successCriteria: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGoal} disabled={!formData.title || !formData.weightage}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weightage (%)"
                type="number"
                value={formData.weightage}
                onChange={(e) => setFormData({ ...formData, weightage: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Goal Type"
                value={formData.goalType}
                onChange={(e) => setFormData({ ...formData, goalType: e.target.value as Goal['goalType'] })}
                required
                disabled
              >
                <MenuItem value="BUSINESS_GOAL">Business Goal</MenuItem>
                <MenuItem value="BEHAVIORAL_GOAL">Behavioral Goal</MenuItem>
                <MenuItem value="COMPETENCY_GOAL">Competency Goal</MenuItem>
                <MenuItem value="OKR">OKR</MenuItem>
                <MenuItem value="DEVELOPMENT_GOAL">Development Goal</MenuItem>
                <MenuItem value="PIP_IMPROVEMENT_GOAL">PIP Improvement Goal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Success Criteria"
                value={formData.successCriteria}
                onChange={(e) => setFormData({ ...formData, successCriteria: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateGoal}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goal History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Goal Version History</DialogTitle>
        <DialogContent>
          {goalHistory && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {goalHistory.goal.title}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Version History</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Weightage</TableCell>
                      <TableCell>Changed By</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {goalHistory.versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell>
                          <Chip label={`v${version.versionNumber}`} size="small" />
                        </TableCell>
                        <TableCell>{version.title}</TableCell>
                        <TableCell>{version.weightage}%</TableCell>
                        <TableCell>{version.changedBy}</TableCell>
                        <TableCell>{new Date(version.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {goalHistory.contextLinks.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Used In</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {goalHistory.contextLinks.map((link) => (
                      <Chip
                        key={link.id}
                        label={`${link.context} ${link.isSnapshot ? '(Snapshot)' : ''}`}
                        size="small"
                        color={link.context === 'PIP' ? 'primary' : 'secondary'}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

