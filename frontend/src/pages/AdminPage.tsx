import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../services/api';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ImportPage from './ImportPage';
import ImportHistoryPage from './ImportHistoryPage';
import UserManagementPage from './UserManagementPage';
import InvalidRecordsPage from './InvalidRecordsPage';
import AdminDashboardPage from './AdminDashboardPage';

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

  if (user?.role !== 'admin') {
    return (
      <Box>
        <Typography variant="h4">Access Denied</Typography>
        <Typography>You must be an admin to access this page.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administration
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Dashboard" />
          <Tab label="User Management" />
          <Tab label="Data Import" />
          <Tab label="Invalid Records" />
          <Tab label="Import History" />
          <Tab label="Settings" />
          <Tab label="Audit Logs" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 0 }}>
            <AdminDashboardPage />
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 0 }}>
            <UserManagementPage />
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: 0 }}>
            <ImportPage />
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ p: 0 }}>
            <InvalidRecordsPage />
          </Box>
        )}

        {activeTab === 4 && (
          <Box sx={{ p: 0 }}>
            <ImportHistoryPage />
          </Box>
        )}

        {activeTab === 5 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">System Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Configuration options will be available here.
            </Typography>
          </Box>
        )}

        {activeTab === 6 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">Audit Logs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Audit log viewer will be available here.
            </Typography>
          </Box>
        )}
      </Paper>

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
    </Box>
  );
}

