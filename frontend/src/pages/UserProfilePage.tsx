import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Business,
  People,
  Assessment,
  TrendingUp,
  Assignment,
  Security,
  History,
  School,
  Description,
  CheckCircle,
  Warning,
  ArrowBack,
  Refresh,
} from '@mui/icons-material';
import ModernCard from '../components/ModernCard';
import { useAuth } from '../contexts/AuthContext';
import { userManagementService, UserSearchResult } from '../services/userManagementService';
import { pipService } from '../services/pipService';
import { goalService, Goal } from '../services/goalService';
import { User, PIP } from '../types';
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

interface ExtendedUser extends User {
  preferredName?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  jobTitle?: string;
  businessUnit?: string;
  employmentType?: 'FULL_TIME' | 'CONTRACT' | 'PART_TIME' | 'INTERN';
  dateOfJoining?: string;
  employmentLevel?: string;
  costCenter?: string;
  skipLevelManagerId?: string;
  directReports?: User[];
  lastLogin?: string;
  mfaEnabled?: boolean;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [userData, setUserData] = useState<ExtendedUser | null>(null);
  const [userDetails, setUserDetails] = useState<UserSearchResult | null>(null);
  const [pips, setPips] = useState<PIP[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editFormData, setEditFormData] = useState<Partial<ExtendedUser>>({});
  const [error, setError] = useState<string | null>(null);

  const canEdit = () => {
    if (!currentUser || !userId) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'hrbp') return true;
    if (currentUser.role === 'manager' && userId !== currentUser.id) return true;
    if (userId === currentUser.id) return true; // Users can edit their own basic info
    return false;
  };

  const canViewSection = (section: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'hrbp') return true;
    if (section === 'security') return currentUser.role === 'admin';
    return true;
  };

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user details
      const details = await userManagementService.getUserDetails(userId!);
      setUserDetails(details);
      setUserData(details.user as ExtendedUser);

      // Load PIPs from backend (user-specific endpoint)
      try {
        const response = await api.get<{ pips: PIP[] }>(`/user-management/${userId}/pips`);
        setPips(response.data.pips || []);
      } catch (err) {
        console.error('Failed to load PIPs:', err);
        // Fallback: try general endpoint
        try {
          const pipList = await pipService.getPIPs();
          const userPips = pipList.filter(pip => pip.employeeId === userId);
          setPips(userPips);
        } catch (fallbackErr) {
          console.error('Fallback PIP load also failed:', fallbackErr);
        }
      }

      // Load goals
      try {
        const userGoals = await goalService.getUserGoals(userId!);
        setGoals(userGoals);
      } catch (err) {
        console.error('Failed to load goals:', err);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: string) => {
    setEditSection(section);
    setEditFormData(userData || {});
    setEditing(true);
  };

  const handleSave = async () => {
    if (!userId || !editSection) return;

    try {
      const updated = await userManagementService.updateUserProfile(userId, editFormData);
      setUserData(updated as ExtendedUser);
      setEditing(false);
      setEditSection(null);
      await loadUserData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditSection(null);
    setEditFormData({});
  };

  const activePip = pips.find(pip => ['active', 'pending_employee_self_review', 'pending_manager_review'].includes(pip.status));
  const completedPips = pips.filter(pip => pip.status === 'completed');
  const activeGoals = goals.filter(g => g.status === 'ACTIVE' && g.isCurrentVersion);
  const overdueGoals = activeGoals.filter(g => g.targetDate && new Date(g.targetDate) < new Date());

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading user profile...</Typography>
      </Box>
    );
  }

  if (error || !userData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'User not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
            src={userData.profilePhoto}
          >
            {userData.firstName?.[0]}{userData.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {userData.preferredName || `${userData.firstName} ${userData.lastName}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData.jobTitle || 'Employee'} • {userData.department || 'No Department'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label={userData.role.toUpperCase()}
                size="small"
                color={userData.role === 'admin' ? 'error' : userData.role === 'manager' ? 'primary' : 'default'}
              />
              <Chip
                label={userData.isActive ? 'Active' : 'Inactive'}
                size="small"
                color={userData.isActive ? 'success' : 'default'}
              />
            </Box>
          </Box>
        </Box>
        <Button startIcon={<Refresh />} onClick={loadUserData}>
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<Person />} label="Overview" />
          <Tab icon={<Business />} label="Organization" />
          <Tab icon={<People />} label="Reporting" />
          <Tab icon={<TrendingUp />} label="Performance" />
          <Tab icon={<Assignment />} label="Goals" />
          {canViewSection('security') && <Tab icon={<Security />} label="Security" />}
          <Tab icon={<History />} label="History" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <OverviewTab
          user={userData}
          canEdit={canEdit()}
          editing={editing && editSection === 'overview'}
          onEdit={() => handleEdit('overview')}
          onSave={handleSave}
          onCancel={handleCancel}
          formData={editFormData}
          onFormDataChange={setEditFormData}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <OrganizationTab
          user={userData}
          canEdit={canEdit()}
          editing={editing && editSection === 'organization'}
          onEdit={() => handleEdit('organization')}
          onSave={handleSave}
          onCancel={handleCancel}
          formData={editFormData}
          onFormDataChange={setEditFormData}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ReportingTab
          user={userData}
          userDetails={userDetails}
          canEdit={canEdit()}
          onRefresh={loadUserData}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <PerformanceTab
          user={userData}
          pips={pips}
          activePip={activePip}
          completedPips={completedPips}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <GoalsTab
          user={userData}
          goals={goals}
          activeGoals={activeGoals}
          overdueGoals={overdueGoals}
          onNavigateToGoals={() => navigate(`/goals/users/${userId}`)}
        />
      </TabPanel>

      {canViewSection('security') && (
        <TabPanel value={tabValue} index={5}>
          <SecurityTab user={userData} canEdit={canEdit()} />
        </TabPanel>
      )}

      <TabPanel value={tabValue} index={canViewSection('security') ? 6 : 5}>
        <HistoryTab user={userData} pips={pips} />
      </TabPanel>
    </Box>
  );
}

// Overview Tab Component
function OverviewTab({
  user,
  canEdit,
  editing,
  onEdit,
  onSave,
  onCancel,
  formData,
  onFormDataChange,
}: {
  user: ExtendedUser;
  canEdit: boolean;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  formData: Partial<ExtendedUser>;
  onFormDataChange: (data: Partial<ExtendedUser>) => void;
}) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ModernCard
          title="Basic Identity"
          action={canEdit && !editing && <Button startIcon={<Edit />} onClick={onEdit}>Edit</Button>}
        >
          {editing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="First Name"
                value={formData.firstName || user.firstName}
                onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={formData.lastName || user.lastName}
                onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Preferred Name"
                value={formData.preferredName || user.preferredName || ''}
                onChange={(e) => onFormDataChange({ ...formData, preferredName: e.target.value })}
                fullWidth
              />
              <TextField
                label="Work Email"
                value={formData.email || user.email}
                onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                type="email"
                required
                fullWidth
              />
              <TextField
                label="Phone Number"
                value={formData.phoneNumber || user.phoneNumber || ''}
                onChange={(e) => onFormDataChange({ ...formData, phoneNumber: e.target.value })}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<Save />} onClick={onSave}>
                  Save
                </Button>
                <Button startIcon={<Cancel />} onClick={onCancel}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Employee ID</Typography>
                <Typography variant="body1">{user.id}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body1">
                  {user.preferredName || `${user.firstName} ${user.lastName}`}
                </Typography>
                {user.preferredName && (
                  <Typography variant="body2" color="text.secondary">
                    {user.firstName} {user.lastName}
                  </Typography>
                )}
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Work Email</Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Box>
              {user.phoneNumber && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body1">{user.phoneNumber}</Typography>
                  </Box>
                </>
              )}
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip
                  label={user.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  color={user.isActive ? 'success' : 'default'}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
          )}
        </ModernCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <ModernCard title="Quick Stats">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Active Goals</Typography>
              <Typography variant="body1" fontWeight={600}>-</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Active PIPs</Typography>
              <Typography variant="body1" fontWeight={600}>-</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Completed PIPs</Typography>
              <Typography variant="body1" fontWeight={600}>-</Typography>
            </Box>
          </Box>
        </ModernCard>
      </Grid>
    </Grid>
  );
}

// Organization Tab Component
function OrganizationTab({
  user,
  canEdit,
  editing,
  onEdit,
  onSave,
  onCancel,
  formData,
  onFormDataChange,
}: {
  user: ExtendedUser;
  canEdit: boolean;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  formData: Partial<ExtendedUser>;
  onFormDataChange: (data: Partial<ExtendedUser>) => void;
}) {
  return (
    <ModernCard
      title="Organizational Information"
      action={canEdit && !editing && <Button startIcon={<Edit />} onClick={onEdit}>Edit</Button>}
    >
      {editing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Job Title"
            value={formData.jobTitle || user.jobTitle || ''}
            onChange={(e) => onFormDataChange({ ...formData, jobTitle: e.target.value })}
            fullWidth
          />
          <TextField
            label="Department"
            value={formData.department || user.department || ''}
            onChange={(e) => onFormDataChange({ ...formData, department: e.target.value })}
            fullWidth
            select
          >
            <MenuItem value="Engineering">Engineering</MenuItem>
            <MenuItem value="Product">Product</MenuItem>
            <MenuItem value="Sales">Sales</MenuItem>
            <MenuItem value="Marketing">Marketing</MenuItem>
            <MenuItem value="HR">HR</MenuItem>
            <MenuItem value="Finance">Finance</MenuItem>
          </TextField>
          <TextField
            label="Business Unit / Division"
            value={formData.businessUnit || user.businessUnit || ''}
            onChange={(e) => onFormDataChange({ ...formData, businessUnit: e.target.value })}
            fullWidth
          />
          <TextField
            label="Location"
            value={formData.location || user.location || ''}
            onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
            fullWidth
          />
          <TextField
            label="Employment Type"
            value={formData.employmentType || user.employmentType || 'FULL_TIME'}
            onChange={(e) => onFormDataChange({ ...formData, employmentType: e.target.value as any })}
            fullWidth
            select
          >
            <MenuItem value="FULL_TIME">Full-time</MenuItem>
            <MenuItem value="CONTRACT">Contract</MenuItem>
            <MenuItem value="PART_TIME">Part-time</MenuItem>
            <MenuItem value="INTERN">Intern</MenuItem>
          </TextField>
          <TextField
            label="Date of Joining"
            type="date"
            value={formData.dateOfJoining || user.dateOfJoining || ''}
            onChange={(e) => onFormDataChange({ ...formData, dateOfJoining: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Employment Level / Grade"
            value={formData.employmentLevel || user.employmentLevel || ''}
            onChange={(e) => onFormDataChange({ ...formData, employmentLevel: e.target.value })}
            fullWidth
          />
          <TextField
            label="Cost Center"
            value={formData.costCenter || user.costCenter || ''}
            onChange={(e) => onFormDataChange({ ...formData, costCenter: e.target.value })}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" startIcon={<Save />} onClick={onSave}>
              Save
            </Button>
            <Button startIcon={<Cancel />} onClick={onCancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Job Title</Typography>
            <Typography variant="body1">{user.jobTitle || 'Not set'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Department</Typography>
            <Typography variant="body1">{user.department || 'Not set'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Business Unit</Typography>
            <Typography variant="body1">{user.businessUnit || 'Not set'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Location</Typography>
            <Typography variant="body1">{user.location || 'Not set'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Employment Type</Typography>
            <Typography variant="body1">{user.employmentType || 'Not set'}</Typography>
          </Box>
          {user.dateOfJoining && (
            <>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Date of Joining</Typography>
                <Typography variant="body1">{new Date(user.dateOfJoining).toLocaleDateString()}</Typography>
              </Box>
            </>
          )}
        </Box>
      )}
    </ModernCard>
  );
}

// Reporting Tab Component
function ReportingTab({
  user,
  userDetails,
  canEdit,
  onRefresh,
}: {
  user: ExtendedUser;
  userDetails: UserSearchResult | null;
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignType, setAssignType] = useState<'manager' | 'hrbp' | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleAssign = async () => {
    if (!user.id || !selectedUserId || !assignType) return;

    try {
      if (assignType === 'manager') {
        await userManagementService.assignManager(user.id, selectedUserId);
      } else {
        await userManagementService.assignHRBP(user.id, selectedUserId);
      }
      setAssignDialogOpen(false);
      setAssignType(null);
      setSelectedUserId('');
      onRefresh();
    } catch (err) {
      console.error('Failed to assign:', err);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ModernCard
          title="Reporting Structure"
          action={canEdit && <Button startIcon={<Edit />} onClick={() => { setAssignType('manager'); setAssignDialogOpen(true); }}>Edit</Button>}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Manager</Typography>
              <Typography variant="body1">
                {userDetails?.manager ? `${userDetails.manager.firstName} ${userDetails.manager.lastName}` : 'Not assigned'}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">HRBP</Typography>
              <Typography variant="body1">
                {userDetails?.hrbp ? `${userDetails.hrbp.firstName} ${userDetails.hrbp.lastName}` : 'Not assigned'}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Skip-Level Manager</Typography>
              <Typography variant="body1">
                {user.skipLevelManagerId ? 'Auto-derived' : 'Not available'}
              </Typography>
            </Box>
          </Box>
        </ModernCard>
      </Grid>

      {user.role === 'manager' && (
        <Grid item xs={12} md={6}>
          <ModernCard title="Direct Reports">
            <Typography variant="body2" color="text.secondary">
              {userDetails?.user ? 'View in User Management' : 'No direct reports'}
            </Typography>
          </ModernCard>
        </Grid>
      )}

      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign {assignType === 'manager' ? 'Manager' : 'HRBP'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="User ID"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

// Performance Tab Component
function PerformanceTab({
  user,
  pips,
  activePip,
  completedPips,
}: {
  user: ExtendedUser;
  pips: PIP[];
  activePip?: PIP;
  completedPips: PIP[];
}) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ModernCard title="Performance Snapshot">
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Current Appraisal Cycle</Typography>
                <Typography variant="body1">-</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Latest Rating</Typography>
                <Typography variant="body1">-</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Rating Trend</Typography>
                <Typography variant="body1">-</Typography>
              </Box>
            </Grid>
            <Divider sx={{ my: 2, width: '100%' }} />
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">Active PIP</Typography>
                {activePip ? (
                  <Chip label="Active" color="warning" size="small" sx={{ mt: 0.5 }} />
                ) : (
                  <Typography variant="body1">None</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">PIP History</Typography>
                <Typography variant="body1">{completedPips.length} completed</Typography>
              </Box>
            </Grid>
          </Grid>
        </ModernCard>
      </Grid>

      {activePip && (
        <Grid item xs={12}>
          <ModernCard title="Active PIP Details">
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip label={activePip.status} size="small" sx={{ mt: 0.5 }} />
            </Box>
          </ModernCard>
        </Grid>
      )}
    </Grid>
  );
}

// Goals Tab Component
function GoalsTab({
  user,
  goals,
  activeGoals,
  overdueGoals,
  onNavigateToGoals,
}: {
  user: ExtendedUser;
  goals: Goal[];
  activeGoals: Goal[];
  overdueGoals: Goal[];
  onNavigateToGoals: () => void;
}) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ModernCard
          title="Goals Summary"
          action={<Button onClick={onNavigateToGoals}>View All Goals</Button>}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Active Goals</Typography>
              <Typography variant="body1" fontWeight={600}>{activeGoals.length}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Overdue Goals</Typography>
              <Typography variant="body1" fontWeight={600} color={overdueGoals.length > 0 ? 'error.main' : 'text.primary'}>
                {overdueGoals.length}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Total Goals</Typography>
              <Typography variant="body1" fontWeight={600}>{goals.length}</Typography>
            </Box>
          </Box>
        </ModernCard>
      </Grid>

      {overdueGoals.length > 0 && (
        <Grid item xs={12}>
          <Alert severity="warning">
            {overdueGoals.length} goal(s) are overdue. Please review and update.
          </Alert>
        </Grid>
      )}
    </Grid>
  );
}

// Security Tab Component
function SecurityTab({ user, canEdit }: { user: ExtendedUser; canEdit: boolean }) {
  return (
    <ModernCard title="Security & Access">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">User Role</Typography>
          <Chip label={user.role.toUpperCase()} size="small" sx={{ mt: 0.5 }} />
        </Box>
        <Divider />
        <Box>
          <Typography variant="caption" color="text.secondary">Account Status</Typography>
          <Chip
            label={user.isActive ? 'Active' : 'Locked'}
            size="small"
            color={user.isActive ? 'success' : 'error'}
            sx={{ mt: 0.5 }}
          />
        </Box>
        <Divider />
        <Box>
          <Typography variant="caption" color="text.secondary">Last Login</Typography>
          <Typography variant="body1">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</Typography>
        </Box>
        <Divider />
        <Box>
          <Typography variant="caption" color="text.secondary">MFA Enabled</Typography>
          <Chip
            label={user.mfaEnabled ? 'Yes' : 'No'}
            size="small"
            color={user.mfaEnabled ? 'success' : 'default'}
            sx={{ mt: 0.5 }}
          />
        </Box>
      </Box>
    </ModernCard>
  );
}

// History Tab Component
function HistoryTab({ user, pips }: { user: ExtendedUser; pips: PIP[] }) {
  return (
    <ModernCard title="Employment History">
      <Typography variant="body2" color="text.secondary">
        History tracking coming soon...
      </Typography>
      {pips.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>PIP History</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Outcome</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pips.map((pip) => (
                  <TableRow key={pip.id}>
                    <TableCell>{new Date(pip.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={pip.status} size="small" />
                    </TableCell>
                    <TableCell>{pip.finalOutcome || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </ModernCard>
  );
}

