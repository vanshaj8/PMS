import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Container,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Dashboard,
  People,
  Upload,
  ErrorOutline,
  History,
  Settings,
  Description,
  Add,
} from '@mui/icons-material';
import api from '../services/api';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ImportPage from './ImportPage';
import ImportHistoryPage from './ImportHistoryPage';
import UserManagementPage from './UserManagementPage';
import InvalidRecordsPage from './InvalidRecordsPage';
import AdminDashboardPage from './AdminDashboardPage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'employee',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const response = await api.get<{ users: User[] }>('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/users', formData);
      setDialogOpen(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'employee',
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You must be an admin to access this page.
          </Typography>
        </Box>
      </Container>
    );
  }

  const tabs = [
    { label: 'Dashboard', icon: <Dashboard />, component: <AdminDashboardPage /> },
    { label: 'User Management', icon: <People />, component: <UserManagementPage /> },
    { label: 'Data Import', icon: <Upload />, component: <ImportPage /> },
    { label: 'Invalid Records', icon: <ErrorOutline />, component: <InvalidRecordsPage /> },
    { label: 'Import History', icon: <History />, component: <ImportHistoryPage /> },
    { label: 'Settings', icon: <Settings />, component: <SettingsTabContent /> },
    { label: 'Audit Logs', icon: <Description />, component: <AuditLogsTabContent /> },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
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
          Administration
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Manage users, imports, settings, and system configuration
        </Typography>
      </Box>

      {/* Tabs Container */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Tabs Header - Sticky and Scrollable */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '3px',
            },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleChangeTab}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 72,
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
              '& .MuiTab-root': {
                minHeight: 72,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                px: { xs: 2, sm: 3 },
                py: 2,
                minWidth: { xs: 120, sm: 160 },
                maxWidth: { xs: 200, sm: 240 },
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600,
                },
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                bgcolor: 'primary.main',
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                {...a11yProps(index)}
                sx={{
                  gap: 1.5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  '& .MuiTab-iconWrapper': {
                    marginRight: 1,
                    marginBottom: 0,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box 
          sx={{ 
            bgcolor: 'background.default', 
            minHeight: '60vh',
            '& > div': {
              width: '100%',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={activeTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Box>
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
            margin="normal"
            required
          >
            <MenuItem value="employee">Employee</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="hrbp">HRBP</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="executive">Executive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Settings Tab Content Component
function SettingsTabContent() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          Configuration options will be available here.
        </Typography>
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary">
            Settings panel coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

// Audit Logs Tab Content Component
function AuditLogsTabContent() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Audit Logs
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          View and export audit logs for compliance and tracking.
        </Typography>
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary">
            Audit log viewer coming soon...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
