import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Card,
  CardContent,
  Alert,
  MenuItem,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { pipService } from '../services/pipService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User, Goal } from '../types';
import ModernCard from '../components/ModernCard';

export default function CreatePIPPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [hrbps, setHrbps] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    hrbpId: '',
    reason: '',
    supportingDocuments: [] as string[],
    goals: [] as Omit<Goal, 'id'>[],
    timeline: {
      // Use durations instead of absolute dates
      employeeAcknowledgementDuration: 5, // days from HRBP approval (default)
      pipActiveDuration: 50, // days from acknowledgement (default)
      selfReviewBufferDuration: 3, // days after active period ends (default)
      managerReviewBufferDuration: 5, // days after self-review (default)
      hrbpDecisionBufferDuration: 5, // days after manager review (default)
      // Legacy fields kept for backward compatibility but not used
      employeeAcknowledgementDeadline: '',
      employeeSelfReviewDeadline: '',
      managerFinalReviewDeadline: '',
      hrbpFinalDecisionDeadline: '',
    },
  });

  const [deadlinePolicy, setDeadlinePolicy] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Use the new endpoint for managers to get employees and HRBPs
      const response = await api.get<{ employees: User[]; hrbps: User[] }>('/users/for-pip-creation');
      setEmployees(response.data.employees || []);
      setHrbps(response.data.hrbps || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback: try to load all users if user is admin
      if (user?.role === 'admin') {
        try {
          const fallbackResponse = await api.get<{ users: User[] }>('/users');
          const users = fallbackResponse.data.users;
          setEmployees(users.filter(u => u.role === 'employee'));
          setHrbps(users.filter(u => u.role === 'hrbp'));
        } catch (fallbackError) {
          console.error('Fallback load also failed:', fallbackError);
        }
      }
    }
  };

  const addGoal = () => {
    setFormData({
      ...formData,
      goals: [
        ...formData.goals,
        {
          title: '',
          description: '',
          weightage: 0,
          expectedOutcome: '',
          targetTimeline: '',
        },
      ],
    });
  };

  const updateGoal = (index: number, field: keyof Goal, value: any) => {
    const updatedGoals = [...formData.goals];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setFormData({ ...formData, goals: updatedGoals });
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    });
  };

  const calculateTotalWeightage = () => {
    return formData.goals.reduce((sum, goal) => sum + goal.weightage, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (calculateTotalWeightage() > 100) {
      setError('Total weightage cannot exceed 100%');
      return;
    }

    if (formData.goals.length === 0) {
      setError('At least one goal is required');
      return;
    }

    setLoading(true);
    try {
      await pipService.createPIP(formData);
      navigate('/pips');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create PIP');
    } finally {
      setLoading(false);
    }
  };

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
          Create Performance Improvement Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Step-by-step PIP creation wizard
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Reason for PIP */}
        <ModernCard
          title="Step 1: Reason for PIP"
          subtitle="Provide the reason and context for this Performance Improvement Plan"
          sx={{ mb: 3 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Employee"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
              >
                {employees.length === 0 ? (
                  <MenuItem disabled>No employees available</MenuItem>
                ) : (
                  employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.email})
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="HRBP"
                value={formData.hrbpId}
                onChange={(e) => setFormData({ ...formData, hrbpId: e.target.value })}
                required
              >
                {hrbps.length === 0 ? (
                  <MenuItem disabled>No HRBPs available</MenuItem>
                ) : (
                  hrbps.map((hrbp) => (
                    <MenuItem key={hrbp.id} value={hrbp.id}>
                      {hrbp.firstName} {hrbp.lastName} ({hrbp.email})
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Reason for PIP"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                helperText={`${formData.reason.length} characters`}
                required
              />
            </Grid>
          </Grid>
        </ModernCard>

        {/* Step 2: Add Goals */}
        <ModernCard
          title="Step 2: Add Goals"
          subtitle="Define specific, measurable goals for improvement"
          sx={{ mb: 3 }}
          action={
            <Button startIcon={<Add />} onClick={addGoal} variant="contained">
              Add Goal
            </Button>
          }
        >

          {formData.goals.map((goal, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="subtitle1">Goal {index + 1}</Typography>
                  <IconButton size="small" onClick={() => removeGoal(index)}>
                    <Delete />
                  </IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={goal.title}
                      onChange={(e) => updateGoal(index, 'title', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Description"
                      value={goal.description}
                      onChange={(e) => updateGoal(index, 'description', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Weightage %"
                      value={goal.weightage}
                      onChange={(e) => updateGoal(index, 'weightage', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Expected Outcome"
                      value={goal.expectedOutcome}
                      onChange={(e) => updateGoal(index, 'expectedOutcome', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Target Timeline"
                      value={goal.targetTimeline}
                      onChange={(e) => updateGoal(index, 'targetTimeline', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Goal Deadline (Optional)"
                      value={(goal as any).deadline || ''}
                      onChange={(e) => {
                        const updatedGoals = [...formData.goals];
                        updatedGoals[index] = { ...updatedGoals[index], deadline: e.target.value || undefined } as any;
                        setFormData({ ...formData, goals: updatedGoals });
                      }}
                      InputLabelProps={{ shrink: true }}
                      helperText="Optional: Set specific deadline for this goal"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          {formData.goals.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Total Weightage</Typography>
                <Typography
                  variant="h6"
                  color={calculateTotalWeightage() > 100 ? 'error.main' : 'primary.main'}
                  sx={{ fontWeight: 700 }}
                >
                  {calculateTotalWeightage().toFixed(1)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${Math.min(calculateTotalWeightage(), 100)}%`,
                    bgcolor: calculateTotalWeightage() > 100 ? 'error.main' : 'primary.main',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              {calculateTotalWeightage() > 100 && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Total weightage cannot exceed 100%
                </Alert>
              )}
            </Box>
          )}
        </ModernCard>

        {/* Step 3: Timeline Setup */}
        <ModernCard
          title="Step 3: Timeline Setup"
          subtitle="Set durations for each step (deadlines are calculated automatically)"
          sx={{ mb: 3 }}
        >
          <Alert severity="info" sx={{ mb: 2 }}>
            Deadlines are calculated automatically based on completion times. You only need to set durations.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Employee Acknowledgement Duration (days)"
                value={formData.timeline.employeeAcknowledgementDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const min = deadlinePolicy?.employeeAckMinDays || 3;
                  const max = deadlinePolicy?.employeeAckMaxDays || 7;
                  if (value < min || value > max) {
                    setError(`Duration must be between ${min} and ${max} days`);
                    return;
                  }
                  setFormData({
                    ...formData,
                    timeline: {
                      ...formData.timeline,
                      employeeAcknowledgementDuration: value,
                    },
                  });
                }}
                inputProps={{ 
                  min: deadlinePolicy?.employeeAckMinDays || 3, 
                  max: deadlinePolicy?.employeeAckMaxDays || 7 
                }}
                helperText={`Days from HRBP approval (${deadlinePolicy?.employeeAckMinDays || 3}-${deadlinePolicy?.employeeAckMaxDays || 7} days)`}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="PIP Active Duration (days)"
                value={formData.timeline.pipActiveDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const min = deadlinePolicy?.activeDurationMinDays || 30;
                  const max = deadlinePolicy?.activeDurationMaxDays || 90;
                  if (value < min || value > max) {
                    setError(`Duration must be between ${min} and ${max} days`);
                    return;
                  }
                  setFormData({
                    ...formData,
                    timeline: {
                      ...formData.timeline,
                      pipActiveDuration: value,
                    },
                  });
                }}
                inputProps={{ 
                  min: deadlinePolicy?.activeDurationMinDays || 30, 
                  max: deadlinePolicy?.activeDurationMaxDays || 90 
                }}
                helperText={`Days from employee acknowledgement (${deadlinePolicy?.activeDurationMinDays || 30}-${deadlinePolicy?.activeDurationMaxDays || 90} days)`}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Quick Select Active Duration"
                value=""
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  if (days) {
                    setFormData({
                      ...formData,
                      timeline: {
                        ...formData.timeline,
                        pipActiveDuration: days,
                      },
                    });
                  }
                }}
              >
                <MenuItem value="30">30 days</MenuItem>
                <MenuItem value="45">45 days</MenuItem>
                <MenuItem value="50">50 days</MenuItem>
                <MenuItem value="60">60 days</MenuItem>
                <MenuItem value="90">90 days</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Self-Review Buffer Duration (days)"
                value={formData.timeline.selfReviewBufferDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const min = deadlinePolicy?.selfReviewBufferMinDays || 1;
                  const max = deadlinePolicy?.selfReviewBufferMaxDays || 5;
                  if (value < min || value > max) {
                    setError(`Buffer must be between ${min} and ${max} days`);
                    return;
                  }
                  setFormData({
                    ...formData,
                    timeline: {
                      ...formData.timeline,
                      selfReviewBufferDuration: value,
                    },
                  });
                }}
                inputProps={{ 
                  min: deadlinePolicy?.selfReviewBufferMinDays || 1, 
                  max: deadlinePolicy?.selfReviewBufferMaxDays || 5 
                }}
                helperText={`Days after active period ends (${deadlinePolicy?.selfReviewBufferMinDays || 1}-${deadlinePolicy?.selfReviewBufferMaxDays || 5} days)`}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Manager Review Buffer Duration (days)"
                value={formData.timeline.managerReviewBufferDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const min = deadlinePolicy?.managerReviewBufferMinDays || 3;
                  const max = deadlinePolicy?.managerReviewBufferMaxDays || 7;
                  if (value < min || value > max) {
                    setError(`Buffer must be between ${min} and ${max} days`);
                    return;
                  }
                  setFormData({
                    ...formData,
                    timeline: {
                      ...formData.timeline,
                      managerReviewBufferDuration: value,
                    },
                  });
                }}
                inputProps={{ 
                  min: deadlinePolicy?.managerReviewBufferMinDays || 3, 
                  max: deadlinePolicy?.managerReviewBufferMaxDays || 7 
                }}
                helperText={`Days after self-review submission (${deadlinePolicy?.managerReviewBufferMinDays || 3}-${deadlinePolicy?.managerReviewBufferMaxDays || 7} days)`}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="HRBP Decision Buffer Duration (days)"
                value={formData.timeline.hrbpDecisionBufferDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const min = deadlinePolicy?.hrbpDecisionBufferMinDays || 3;
                  const max = deadlinePolicy?.hrbpDecisionBufferMaxDays || 7;
                  if (value < min || value > max) {
                    setError(`Buffer must be between ${min} and ${max} days`);
                    return;
                  }
                  setFormData({
                    ...formData,
                    timeline: {
                      ...formData.timeline,
                      hrbpDecisionBufferDuration: value,
                    },
                  });
                }}
                inputProps={{ 
                  min: deadlinePolicy?.hrbpDecisionBufferMinDays || 3, 
                  max: deadlinePolicy?.hrbpDecisionBufferMaxDays || 7 
                }}
                helperText={`Days after manager review completion (${deadlinePolicy?.hrbpDecisionBufferMinDays || 3}-${deadlinePolicy?.hrbpDecisionBufferMaxDays || 7} days)`}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Note: All deadlines are calculated automatically based on:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                  <li>Employee acknowledgement deadline = HRBP approval time + acknowledgement duration</li>
                  <li>Active period end = Acknowledgement time + active duration</li>
                  <li>Self-review deadline = Active period end + buffer</li>
                  <li>Manager review deadline = Self-review submission + buffer</li>
                  <li>HRBP decision deadline = Manager review completion + buffer</li>
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </ModernCard>

        {/* Step 4: Manager Sign-Off */}
        <ModernCard
          title="Step 4: Manager Sign-Off"
          subtitle="Review and submit to HRBP"
          sx={{ mb: 3 }}
        >
          <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              By submitting this PIP, you acknowledge that:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mt: 1 }}>
              <li>All information provided is accurate</li>
              <li>Goals are specific and measurable</li>
              <li>Timelines are reasonable and achievable</li>
              <li>You will be responsible for monitoring progress</li>
            </Typography>
          </Box>
        </ModernCard>

        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button onClick={() => navigate('/pips')} size="large">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || calculateTotalWeightage() > 100}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {loading ? 'Creating...' : 'Submit to HRBP'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}

