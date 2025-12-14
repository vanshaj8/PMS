import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Warning,
  Edit,
  Download,
  NoteAdd,
} from '@mui/icons-material';
import { pipService } from '../services/pipService';
import { PIP, Goal } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import ModernCard from '../components/ModernCard';

export default function PIPDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pip, setPip] = useState<PIP | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'acknowledge' | 'self-review' | 'manager-review' | 'hrbp-review' | 'final-decision' | 'checkin' | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (id) {
      loadPIP();
    }
  }, [id]);

  const loadPIP = async () => {
    try {
      if (!id) return;
      const data = await pipService.getPIP(id);
      setPip(data);
    } catch (error) {
      console.error('Failed to load PIP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!pip || !id) return;

    try {
      if (dialogType === 'acknowledge') {
        await pipService.acknowledgePIP(id, formData.comments);
      } else if (dialogType === 'self-review') {
        await pipService.submitSelfReview(id, formData.goals);
      } else if (dialogType === 'manager-review') {
        await pipService.submitManagerReview(id, formData.goals, formData.comments);
      } else if (dialogType === 'hrbp-review') {
        await pipService.hrbpReview(id, formData.action, formData.comments);
      } else if (dialogType === 'final-decision') {
        await pipService.submitFinalDecision(id, formData.outcome, formData.remarks);
      } else if (dialogType === 'checkin') {
        await pipService.addCheckIn(id, formData.notes, formData.attachments);
      }
      setDialogOpen(false);
      await loadPIP();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const openDialog = (type: typeof dialogType) => {
    setDialogType(type);
    if (type === 'self-review') {
      setFormData({ goals: pip?.goals.map(g => ({ id: g.id, justification: g.justification || '', attachments: [] })) });
    } else if (type === 'manager-review') {
      setFormData({ goals: pip?.goals.map(g => ({ id: g.id, status: g.status || 'not_achieved', managerComments: g.managerComments || '' })), comments: '' });
    } else {
      setFormData({});
    }
    setDialogOpen(true);
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!pip) {
    return <Box>PIP not found</Box>;
  }

  const steps = [
    'Employee Acknowledgement',
    'Active PIP Period',
    'Employee Self-Review',
    'Manager Review',
    'HRBP Final Decision',
  ];

  const currentStep = pip.steps.findIndex(s => s.status !== 'completed');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">PIP Details</Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<Download />}
            onClick={() => window.open(`/api/reports/pip/${id}/pdf`, '_blank')}
          >
            Export PDF
          </Button>
          <Button onClick={() => navigate('/pips')}>Back to List</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip label={pip.status.replace(/_/g, ' ').toUpperCase()} color={pip.status === 'completed' ? 'success' : 'primary'} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Created</Typography>
            <Typography>{format(new Date(pip.createdAt), 'MMM dd, yyyy')}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Reason</Typography>
            <Typography>{pip.reason}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Workflow Progress</Typography>
        <Stepper activeStep={currentStep >= 0 ? currentStep : steps.length}>
          {steps.map((label, index) => (
            <Step key={label} completed={index < currentStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Goals" />
          <Tab label="Timeline" />
          <Tab label="Check-ins" />
          <Tab label="History" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {pip.goals.map((goal, index) => (
              <Card key={goal.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{goal.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Weightage: {goal.weightage}%
                  </Typography>
                  <Typography variant="body2" gutterBottom>{goal.description}</Typography>
                  <Typography variant="body2"><strong>Expected Outcome:</strong> {goal.expectedOutcome}</Typography>
                  {goal.justification && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100' }}>
                      <Typography variant="subtitle2">Employee Justification:</Typography>
                      <Typography variant="body2">{goal.justification}</Typography>
                    </Box>
                  )}
                  {goal.managerComments && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'blue.50' }}>
                      <Typography variant="subtitle2">Manager Comments:</Typography>
                      <Typography variant="body2">{goal.managerComments}</Typography>
                      {goal.status && (
                        <Chip label={goal.status.replace(/_/g, ' ').toUpperCase()} size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {pip.steps.map((step, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">{step.step.replace(/_/g, ' ').toUpperCase()}</Typography>
                  <Chip
                    label={step.status.replace(/_/g, ' ').toUpperCase()}
                    color={step.status === 'completed' ? 'success' : step.status === 'overdue' ? 'error' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Due: {format(new Date(step.dueDate), 'MMM dd, yyyy')}
                </Typography>
                {step.completedDate && (
                  <Typography variant="body2" color="text.secondary">
                    Completed: {format(new Date(step.completedDate), 'MMM dd, yyyy')}
                  </Typography>
                )}
                {step.comments && (
                  <Typography variant="body2" sx={{ mt: 1 }}>{step.comments}</Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Check-ins</Typography>
              {pip.status === 'active' && (
                <Button
                  startIcon={<NoteAdd />}
                  variant="outlined"
                  onClick={() => {
                    setFormData({ notes: '', attachments: [] });
                    setDialogType('checkin');
                    setDialogOpen(true);
                  }}
                >
                  Add Check-in
                </Button>
              )}
            </Box>
            {pip.checkIns.length === 0 ? (
              <Typography color="text.secondary">No check-ins yet</Typography>
            ) : (
              <List>
                {pip.checkIns.map((checkIn) => (
                  <ListItem key={checkIn.id}>
                    <ListItemText
                      primary={format(new Date(checkIn.date), 'MMM dd, yyyy')}
                      secondary={checkIn.notes}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Paper>

      {/* Action Buttons */}
      {user?.role === 'employee' && pip.status === 'pending_employee_acknowledgement' && (
        <ModernCard
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              ⚠️ Please review and acknowledge this PIP
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => openDialog('acknowledge')}
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              }}
            >
              Acknowledge PIP
            </Button>
          </Box>
        </ModernCard>
      )}

      {user?.role === 'employee' && pip.status === 'pending_employee_self_review' && (
        <ModernCard
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Self-Assessment Required
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide justification for each goal and submit your self-review.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => openDialog('self-review')}
          >
            Submit Self-Review
          </Button>
        </ModernCard>
      )}

      {user?.role === 'manager' && pip.status === 'pending_manager_review' && (
        <ModernCard
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            border: '2px solid #6366f1',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Manager Final Review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review employee's self-assessment and evaluate each goal.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => openDialog('manager-review')}
          >
            Submit Manager Review
          </Button>
        </ModernCard>
      )}

      {user?.role === 'hrbp' && pip.status === 'pending_hrbp_review' && (
        <ModernCard
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '2px solid #0ea5e9',
          }}
        >
          <Typography variant="h6" gutterBottom>
            HRBP Review Required
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review the PIP and choose an action:
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                flex: 1,
                minWidth: 150,
              }}
              onClick={() => {
                setFormData({ action: 'approve', comments: '' });
                setDialogType('hrbp-review');
                setDialogOpen(true);
              }}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                flex: 1,
                minWidth: 150,
              }}
              onClick={() => {
                setFormData({ action: 'deny', comments: '' });
                setDialogType('hrbp-review');
                setDialogOpen(true);
              }}
            >
              Deny
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ flex: 1, minWidth: 150 }}
              onClick={() => {
                setFormData({ action: 'send_back', comments: '' });
                setDialogType('hrbp-review');
                setDialogOpen(true);
              }}
            >
              Send Back
            </Button>
          </Box>
        </ModernCard>
      )}

      {user?.role === 'hrbp' && pip.status === 'pending_hrbp_decision' && (
        <ModernCard
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
            border: '2px solid #ec4899',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Final Decision Required
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review the complete PIP and make your final decision.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => openDialog('final-decision')}
            sx={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            }}
          >
            Make Final Decision
          </Button>
        </ModernCard>
      )}

      {/* Action Dialogs */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'acknowledge' && 'Acknowledge PIP'}
          {dialogType === 'self-review' && 'Submit Self-Review'}
          {dialogType === 'manager-review' && 'Submit Manager Review'}
          {dialogType === 'hrbp-review' && 'HRBP Review'}
          {dialogType === 'final-decision' && 'Final Decision'}
          {dialogType === 'checkin' && 'Add Check-in'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'acknowledge' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comments (optional)"
              value={formData.comments || ''}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          {dialogType === 'self-review' && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Provide justification for each goal. All fields are required.
              </Typography>
              {pip?.goals.map((goal, index) => (
                <Card key={goal.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Goal {index + 1}: {goal.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Expected Outcome: {goal.expectedOutcome}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Your Justification *"
                      placeholder="Explain how you have met or worked towards this goal..."
                      value={formData.goals?.find((g: any) => g.id === goal.id)?.justification || ''}
                      onChange={(e) => {
                        const updated = formData.goals.map((g: any) =>
                          g.id === goal.id ? { ...g, justification: e.target.value } : g
                        );
                        setFormData({ ...formData, goals: updated });
                      }}
                      sx={{ mt: 1 }}
                      required
                      error={
                        !formData.goals?.find((g: any) => g.id === goal.id)?.justification ||
                        formData.goals?.find((g: any) => g.id === goal.id)?.justification?.trim() === ''
                      }
                      helperText={
                        !formData.goals?.find((g: any) => g.id === goal.id)?.justification
                          ? 'This field is required'
                          : 'Provide detailed justification for this goal'
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {dialogType === 'manager-review' && (
            <Box>
              {pip?.goals.map((goal) => (
                <Card key={goal.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">{goal.title}</Typography>
                    <TextField
                      fullWidth
                      select
                      label="Status"
                      value={formData.goals?.find((g: any) => g.id === goal.id)?.status || 'not_achieved'}
                      onChange={(e) => {
                        const updated = formData.goals.map((g: any) =>
                          g.id === goal.id ? { ...g, status: e.target.value } : g
                        );
                        setFormData({ ...formData, goals: updated });
                      }}
                      sx={{ mt: 1, mb: 1 }}
                    >
                      <MenuItem value="achieved">Achieved</MenuItem>
                      <MenuItem value="partially_achieved">Partially Achieved</MenuItem>
                      <MenuItem value="not_achieved">Not Achieved</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Comments"
                      value={formData.goals?.find((g: any) => g.id === goal.id)?.managerComments || ''}
                      onChange={(e) => {
                        const updated = formData.goals.map((g: any) =>
                          g.id === goal.id ? { ...g, managerComments: e.target.value } : g
                        );
                        setFormData({ ...formData, goals: updated });
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Overall Comments"
                value={formData.comments || ''}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {dialogType === 'hrbp-review' && (
            <Box>
              <TextField
                fullWidth
                select
                label="Action"
                value={formData.action || ''}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                sx={{ mt: 2 }}
                required
              >
                <MenuItem value="approve">Approve</MenuItem>
                <MenuItem value="deny">Deny</MenuItem>
                <MenuItem value="send_back">Send Back to Manager</MenuItem>
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comments"
                value={formData.comments || ''}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {dialogType === 'final-decision' && (
            <Box>
              <TextField
                fullWidth
                select
                label="Outcome"
                value={formData.outcome || ''}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                sx={{ mt: 2 }}
              >
                <MenuItem value="successful">Successful PIP</MenuItem>
                <MenuItem value="unsuccessful">Unsuccessful PIP</MenuItem>
                <MenuItem value="extended">Extend PIP</MenuItem>
                <MenuItem value="closed_without_action">Close without Action</MenuItem>
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Final Remarks"
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                sx={{ mt: 2 }}
                required
              />
            </Box>
          )}

          {dialogType === 'checkin' && (
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Check-in Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={{ mt: 2 }}
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAction} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

