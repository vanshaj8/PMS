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
      setOriginalTimeline({
        employeeAcknowledgementDeadline: data.timeline.employeeAcknowledgementDeadline,
        pipActiveDuration: data.timeline.pipActiveDuration,
        employeeSelfReviewDeadline: data.timeline.employeeSelfReviewDeadline,
        managerFinalReviewDeadline: data.timeline.managerFinalReviewDeadline,
        hrbpFinalDecisionDeadline: data.timeline.hrbpFinalDecisionDeadline,
      });
      setEditedTimeline({
        employeeAcknowledgementDeadline: data.timeline.employeeAcknowledgementDeadline,
        pipActiveDuration: data.timeline.pipActiveDuration,
        employeeSelfReviewDeadline: data.timeline.employeeSelfReviewDeadline,
        managerFinalReviewDeadline: data.timeline.managerFinalReviewDeadline,
        hrbpFinalDecisionDeadline: data.timeline.hrbpFinalDecisionDeadline,
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

    if (!id || !editedTimeline) return;

    setSaving(true);
    try {
      // Update each step timeline
      for (const step of pip?.steps || []) {
        let newDueDate: string | undefined;
        
        if (step.step === 'employee_acknowledgement') {
          newDueDate = editedTimeline.employeeAcknowledgementDeadline;
        } else if (step.step === 'employee_self_review') {
          newDueDate = editedTimeline.employeeSelfReviewDeadline;
        } else if (step.step === 'manager_review') {
          newDueDate = editedTimeline.managerFinalReviewDeadline;
        } else if (step.step === 'hrbp_decision') {
          newDueDate = editedTimeline.hrbpFinalDecisionDeadline;
        }

        if (newDueDate && newDueDate !== step.dueDate) {
          await pipService.overrideTimeline(id, step.step, newDueDate, reason);
        }
      }

      showToast('Timeline updated successfully', 'success');
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

      <Grid container spacing={3}>
        {/* Original Timeline (Read-only) */}
        <Grid item xs={12} md={6}>
          <ModernCard title="Original Timeline" subtitle="Locked - Cannot be modified">
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Employee Acknowledgement</Typography>
                  <Typography variant="body1">
                    {format(new Date(originalTimeline.employeeAcknowledgementDeadline), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">PIP Duration</Typography>
                  <Typography variant="body1">{originalTimeline.pipActiveDuration} days</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Employee Self-Review</Typography>
                  <Typography variant="body1">
                    {format(new Date(originalTimeline.employeeSelfReviewDeadline), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Manager Review</Typography>
                  <Typography variant="body1">
                    {format(new Date(originalTimeline.managerFinalReviewDeadline), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">HRBP Decision</Typography>
                  <Typography variant="body1">
                    {format(new Date(originalTimeline.hrbpFinalDecisionDeadline), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </ModernCard>
        </Grid>

        {/* Editable Timeline */}
        <Grid item xs={12} md={6}>
          <ModernCard title="Edited Timeline" subtitle="Modify dates as needed">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Employee Acknowledgement Deadline"
                  value={editedTimeline.employeeAcknowledgementDeadline}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      employeeAcknowledgementDeadline: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
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
                      pipActiveDuration: parseInt(e.target.value) || 30,
                    })
                  }
                  inputProps={{ min: 1, max: 365 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Employee Self-Review Deadline"
                  value={editedTimeline.employeeSelfReviewDeadline}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      employeeSelfReviewDeadline: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Manager Review Deadline"
                  value={editedTimeline.managerFinalReviewDeadline}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      managerFinalReviewDeadline: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="HRBP Decision Deadline"
                  value={editedTimeline.hrbpFinalDecisionDeadline}
                  onChange={(e) =>
                    setEditedTimeline({
                      ...editedTimeline,
                      hrbpFinalDecisionDeadline: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
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

