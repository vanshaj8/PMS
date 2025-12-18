import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { pipService } from '../services/pipService';
import { PIP } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ModernCard from '../components/ModernCard';
import { format } from 'date-fns';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useToast } from '../components/ToastContext';

export default function TimelineEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pip, setPip] = useState<PIP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalTimeline, setOriginalTimeline] = useState<any>(null);
  const [editedTimeline, setEditedTimeline] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadPIP();
    }
  }, [id]);

  const loadPIP = async () => {
    try {
      const data = await pipService.getPIP(id!);
      setPip(data);
      
      // Use durations from timeline, calculated deadlines from steps
      const ackStep = data.steps.find(s => s.step === 'employee_acknowledgement');
      const selfReviewStep = data.steps.find(s => s.step === 'employee_self_review');
      const managerStep = data.steps.find(s => s.step === 'manager_review');
      const hrbpStep = data.steps.find(s => s.step === 'hrbp_decision');
      
      setOriginalTimeline({
        employeeAcknowledgementDuration: data.timeline.employeeAcknowledgementDuration || 5,
        pipActiveDuration: data.timeline.pipActiveDuration,
        selfReviewBufferDuration: data.timeline.selfReviewBufferDuration || 3,
        managerReviewBufferDuration: data.timeline.managerReviewBufferDuration || 5,
        hrbpDecisionBufferDuration: data.timeline.hrbpDecisionBufferDuration || 5,
        // Calculated deadlines (read-only)
        employeeAcknowledgementDeadline: ackStep?.dueDate || data.timeline.employeeAcknowledgementDeadline,
        employeeSelfReviewDeadline: selfReviewStep?.dueDate || data.timeline.employeeSelfReviewDeadline,
        managerFinalReviewDeadline: managerStep?.dueDate || data.timeline.managerFinalReviewDeadline,
        hrbpFinalDecisionDeadline: hrbpStep?.dueDate || data.timeline.hrbpFinalDecisionDeadline,
      });
      setEditedTimeline({
        employeeAcknowledgementDuration: data.timeline.employeeAcknowledgementDuration || 5,
        pipActiveDuration: data.timeline.pipActiveDuration,
        selfReviewBufferDuration: data.timeline.selfReviewBufferDuration || 3,
        managerReviewBufferDuration: data.timeline.managerReviewBufferDuration || 5,
        hrbpDecisionBufferDuration: data.timeline.hrbpDecisionBufferDuration || 5,
        // Calculated deadlines (read-only)
        employeeAcknowledgementDeadline: ackStep?.dueDate || data.timeline.employeeAcknowledgementDeadline,
        employeeSelfReviewDeadline: selfReviewStep?.dueDate || data.timeline.employeeSelfReviewDeadline,
        managerFinalReviewDeadline: managerStep?.dueDate || data.timeline.managerFinalReviewDeadline,
        hrbpFinalDecisionDeadline: hrbpStep?.dueDate || data.timeline.hrbpFinalDecisionDeadline,
      });
    } catch (error) {
      console.error('Failed to load PIP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!reason.trim()) {
      showToast('Reason for change is required', 'error');
      return;
    }

    if (!id || !editedTimeline || !pip) return;

    setSaving(true);
    try {
      // Update timeline durations - backend will recalculate deadlines
      const updatedTimeline = {
        employeeAcknowledgementDuration: editedTimeline.employeeAcknowledgementDuration,
        pipActiveDuration: editedTimeline.pipActiveDuration,
        selfReviewBufferDuration: editedTimeline.selfReviewBufferDuration,
        managerReviewBufferDuration: editedTimeline.managerReviewBufferDuration,
        hrbpDecisionBufferDuration: editedTimeline.hrbpDecisionBufferDuration,
      };

      // Use override timeline endpoint with reason
      // Note: Backend should update durations and recalculate deadlines
      await pipService.overrideTimeline(id, 'timeline', JSON.stringify(updatedTimeline), reason);

      showToast('Timeline durations updated successfully. Deadlines will be recalculated.', 'success');
      navigate(`/pips/${id}`);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update timeline', 'error');
    } finally {
      setSaving(false);
      setConfirmDialogOpen(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Typography variant="h4">Access Denied</Typography>
        <Typography>Only admins can edit timelines.</Typography>
      </Box>
    );
  }

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!pip) {
    return <Box>PIP not found</Box>;
  }

  const hasChanges = JSON.stringify(originalTimeline) !== JSON.stringify(editedTimeline);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/pips/${id}`)}>
          Back
        </Button>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Timeline Editor
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Admin Override:</strong> You are modifying the timeline for this PIP. All changes will be logged and require a reason.
      </Alert>
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Note:</strong> Deadlines are calculated automatically from durations. You can only modify durations. Calculated deadlines are shown for reference only.
      </Alert>

      <Grid container spacing={3}>
        {/* Original Timeline (Read-only) */}
        <Grid item xs={12} md={6}>
          <ModernCard title="Current Timeline" subtitle="Calculated Deadlines (Read-only)">
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Employee Acknowledgement Duration</Typography>
                  <Typography variant="body1">{originalTimeline.employeeAcknowledgementDuration || 5} days</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Calculated Deadline: {originalTimeline.employeeAcknowledgementDeadline ? format(new Date(originalTimeline.employeeAcknowledgementDeadline), 'MMM dd, yyyy') : 'Not calculated'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">PIP Active Duration</Typography>
                  <Typography variant="body1">{originalTimeline.pipActiveDuration} days</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Self-Review Buffer</Typography>
                  <Typography variant="body1">{originalTimeline.selfReviewBufferDuration || 3} days</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Calculated Deadline: {originalTimeline.employeeSelfReviewDeadline ? format(new Date(originalTimeline.employeeSelfReviewDeadline), 'MMM dd, yyyy') : 'Not calculated'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Manager Review Buffer</Typography>
                  <Typography variant="body1">{originalTimeline.managerReviewBufferDuration || 5} days</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Calculated Deadline: {originalTimeline.managerFinalReviewDeadline ? format(new Date(originalTimeline.managerFinalReviewDeadline), 'MMM dd, yyyy') : 'Not calculated'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">HRBP Decision Buffer</Typography>
                  <Typography variant="body1">{originalTimeline.hrbpDecisionBufferDuration || 5} days</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Calculated Deadline: {originalTimeline.hrbpFinalDecisionDeadline ? format(new Date(originalTimeline.hrbpFinalDecisionDeadline), 'MMM dd, yyyy') : 'Not calculated'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </ModernCard>
        </Grid>

        {/* Editable Timeline - Durations Only */}
        <Grid item xs={12} md={6}>
          <ModernCard title="Edit Durations" subtitle="Modify durations (deadlines recalculate automatically)">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Employee Acknowledgement Duration (days)"
                  value={editedTimeline.employeeAcknowledgementDuration}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      employeeAcknowledgementDuration: parseInt(e.target.value) || 5,
                    })
                  }
                  inputProps={{ min: 3, max: 7 }}
                  helperText="Days from HRBP approval (3-7 days)"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Calculated Deadline: {editedTimeline.employeeAcknowledgementDeadline ? format(new Date(editedTimeline.employeeAcknowledgementDeadline), 'MMM dd, yyyy') : 'Will be calculated'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="PIP Active Duration (days)"
                  value={editedTimeline.pipActiveDuration}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      pipActiveDuration: parseInt(e.target.value) || 50,
                    })
                  }
                  inputProps={{ min: 30, max: 90 }}
                  helperText="Days from employee acknowledgement (30-90 days)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Self-Review Buffer Duration (days)"
                  value={editedTimeline.selfReviewBufferDuration}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      selfReviewBufferDuration: parseInt(e.target.value) || 3,
                    })
                  }
                  inputProps={{ min: 1, max: 5 }}
                  helperText="Days after active period ends (1-5 days)"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Calculated Deadline: {editedTimeline.employeeSelfReviewDeadline ? format(new Date(editedTimeline.employeeSelfReviewDeadline), 'MMM dd, yyyy') : 'Will be calculated'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Manager Review Buffer Duration (days)"
                  value={editedTimeline.managerReviewBufferDuration}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      managerReviewBufferDuration: parseInt(e.target.value) || 5,
                    })
                  }
                  inputProps={{ min: 3, max: 7 }}
                  helperText="Days after self-review submission (3-7 days)"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Calculated Deadline: {editedTimeline.managerFinalReviewDeadline ? format(new Date(editedTimeline.managerFinalReviewDeadline), 'MMM dd, yyyy') : 'Will be calculated'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="HRBP Decision Buffer Duration (days)"
                  value={editedTimeline.hrbpDecisionBufferDuration}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      hrbpDecisionBufferDuration: parseInt(e.target.value) || 5,
                    })
                  }
                  inputProps={{ min: 3, max: 7 }}
                  helperText="Days after manager review completion (3-7 days)"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Calculated Deadline: {editedTimeline.hrbpFinalDecisionDeadline ? format(new Date(editedTimeline.hrbpFinalDecisionDeadline), 'MMM dd, yyyy') : 'Will be calculated'}
                </Typography>
              </Grid>
            </Grid>
          </ModernCard>
        </Grid>

        {/* Change Summary */}
        {hasChanges && (
          <Grid item xs={12}>
            <ModernCard title="Change Summary">
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Changes Detected:
                </Typography>
                {Object.keys(editedTimeline).map((key) => {
                  if (originalTimeline[key] !== editedTimeline[key]) {
                    return (
                      <Typography key={key} variant="body2" sx={{ mb: 1 }}>
                        <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                        {key.includes('Deadline') || key.includes('deadline')
                          ? `${format(new Date(originalTimeline[key]), 'MMM dd, yyyy')} → ${format(new Date(editedTimeline[key]), 'MMM dd, yyyy')}`
                          : `${originalTimeline[key]} → ${editedTimeline[key]}`}
                      </Typography>
                    );
                  }
                  return null;
                })}
              </Box>
            </ModernCard>
          </Grid>
        )}

        {/* Reason for Change */}
        <Grid item xs={12}>
          <ModernCard title="Reason for Change" subtitle="Mandatory - Explain why timeline is being modified">
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason *"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Employee requested extension due to medical leave..."
              required
              error={!reason.trim()}
              helperText={!reason.trim() ? 'Reason is required' : 'Provide detailed explanation for timeline changes'}
            />
          </ModernCard>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={() => navigate(`/pips/${id}`)}>Cancel</Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!hasChanges || !reason.trim() || saving}
            >
              Save Timeline Update
            </Button>
          </Box>
        </Grid>
      </Grid>

      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Confirm Timeline Update"
        message={`You are about to modify the timeline for this PIP. This action will be logged and cannot be undone easily. Are you sure you want to proceed?`}
        confirmText="Yes, Update Timeline"
        cancelText="Cancel"
        onConfirm={handleSave}
        onCancel={() => setConfirmDialogOpen(false)}
        severity="warning"
      />
    </Box>
  );
}

