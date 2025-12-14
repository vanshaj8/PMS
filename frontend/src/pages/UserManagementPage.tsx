import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Grid,
  IconButton,
  Menu,
  Alert,
  FormControlLabel,
  Switch,
  Avatar,
} from '@mui/material';
import ModernCard from '../components/ModernCard';
import {
  Search,
  Edit,
  MoreVert,
  PersonRemove,
  Assignment,
  Group,
  Visibility,
} from '@mui/icons-material';
import { userManagementService, UserSearchFilters, UserSearchResult } from '../services/userManagementService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User, PIP } from '../types';
import UserProfileDrawer from '../components/UserProfileDrawer';
import { pipService } from '../services/pipService';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<UserSearchFilters>({});
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignType, setAssignType] = useState<'manager' | 'hrbp' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<UserSearchResult | null>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserSearchResult | null>(null);
  const [userPips, setUserPips] = useState<PIP[]>([]);

  useEffect(() => {
    loadAllUsers();
    performSearch();
  }, []);

  const loadAllUsers = async () => {
    try {
      const response = await api.get<{ users: User[] }>('/users');
      setAllUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await userManagementService.searchUsers(filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedUsers(new Set(searchResults.map(r => r.user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleViewProfile = async (result: UserSearchResult) => {
    setSelectedUserForProfile(result);
    try {
      const pips = await pipService.getAllPIPs();
      const userPipsList = pips.filter(p => 
        p.employeeId === result.user.id || 
        p.managerId === result.user.id || 
        p.hrbpId === result.user.id
      );
      setUserPips(userPipsList);
    } catch (error) {
      console.error('Failed to load user PIPs:', error);
    }
    setProfileDrawerOpen(true);
  };

  const handleEdit = (result: UserSearchResult) => {
    setSelectedUser(result);
    setEditFormData({
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      email: result.user.email,
      role: result.user.role,
      department: result.user.department,
      location: result.user.location,
      managerId: result.user.managerId,
      hrbpId: result.user.hrbpId,
      isActive: (result.user as any).isActive,
    });
    setEditDialogOpen(true);
  };

  const handleAssign = (result: UserSearchResult, type: 'manager' | 'hrbp') => {
    setSelectedUser(result);
    setAssignType(type);
    setAssignDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      await userManagementService.updateUserProfile(selectedUser.user.id, editFormData);
      setEditDialogOpen(false);
      performSearch();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleSaveAssign = async () => {
    if (!selectedUser || !assignType) return;
    try {
      const assignId = assignType === 'manager' ? editFormData.managerId : editFormData.hrbpId;
      if (!assignId) return;

      if (assignType === 'manager') {
        await userManagementService.assignManager(selectedUser.user.id, assignId);
      } else {
        await userManagementService.assignHRBP(selectedUser.user.id, assignId);
      }
      setAssignDialogOpen(false);
      performSearch();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign');
    }
  };

  const handleBulkAction = async (action: 'manager' | 'hrbp' | 'deactivate') => {
    if (selectedUsers.size === 0) {
      alert('Please select users first');
      return;
    }

    if (action === 'deactivate') {
      if (!confirm(`Deactivate ${selectedUsers.size} users?`)) return;
      try {
        const result = await userManagementService.bulkDeactivate(Array.from(selectedUsers));
        alert(`Deactivated ${result.succeeded} users. ${result.failed} failed.`);
        setSelectedUsers(new Set());
        performSearch();
      } catch (error) {
        alert('Bulk deactivate failed');
      }
    } else {
      setAssignType(action);
      setAssignDialogOpen(true);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.size === 0 || !assignType) return;
    const assignId = assignType === 'manager' ? editFormData.managerId : editFormData.hrbpId;
    if (!assignId) return;

    try {
      let result;
      if (assignType === 'manager') {
        result = await userManagementService.bulkAssignManager(Array.from(selectedUsers), assignId);
      } else {
        result = await userManagementService.bulkAssignHRBP(Array.from(selectedUsers), assignId);
      }
      alert(`Assigned ${result.succeeded} users. ${result.failed} failed.`);
      setSelectedUsers(new Set());
      setAssignDialogOpen(false);
      performSearch();
    } catch (error) {
      alert('Bulk assign failed');
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

  const managers = allUsers.filter(u => u.role === 'manager' && (u as any).isActive);
  const hrbps = allUsers.filter(u => u.role === 'hrbp' && (u as any).isActive);

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
          User Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Search, manage, and organize users across your organization
        </Typography>
      </Box>

      {/* Search Filters Sidebar */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ModernCard title="Filters" sx={{ position: 'sticky', top: 100 }}>
            <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="User Name"
              value={filters.userName || ''}
              onChange={(e) => setFilters({ ...filters, userName: e.target.value || undefined })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="User ID"
              value={filters.userId || ''}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Role"
              value={filters.role || ''}
              onChange={(e) => setFilters({ ...filters, role: e.target.value as any || undefined })}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="hrbp">HRBP</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="on_pip">On PIP</MenuItem>
              <MenuItem value="completed_pip">Completed PIP</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Department"
              value={filters.department || ''}
              onChange={(e) => setFilters({ ...filters, department: e.target.value || undefined })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.missingManager || false}
                  onChange={(e) => setFilters({ ...filters, missingManager: e.target.checked || undefined })}
                />
              }
              label="Missing Manager"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.missingHrbp || false}
                  onChange={(e) => setFilters({ ...filters, missingHrbp: e.target.checked || undefined })}
                />
              }
              label="Missing HRBP"
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" startIcon={<Search />} onClick={handleSearch}>
              Search
            </Button>
            <Button sx={{ ml: 1 }} onClick={() => {
              setFilters({});
              performSearch();
            }}>
              Clear
            </Button>
          </Grid>
            </Grid>
          </ModernCard>
        </Grid>
        <Grid item xs={12} md={9}>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <ModernCard
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography sx={{ color: 'white', fontWeight: 600 }}>
              {selectedUsers.size} users selected
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleBulkAction('manager')}
            >
              Bulk Assign Manager
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleBulkAction('hrbp')}
            >
              Bulk Assign HRBP
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => handleBulkAction('deactivate')}
            >
              Bulk Deactivate
            </Button>
          </Box>
        </ModernCard>
      )}

          {/* Results Table */}
          <ModernCard>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.size === searchResults.length && searchResults.length > 0}
                        indeterminate={selectedUsers.size > 0 && selectedUsers.size < searchResults.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Manager</TableCell>
                    <TableCell>HRBP</TableCell>
                    <TableCell>PIPs</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((result) => (
                    <TableRow
                      key={result.user.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => handleViewProfile(result)}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUsers.has(result.user.id)}
                          onChange={() => handleSelectUser(result.user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: 16,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                          >
                            {result.user.firstName?.[0]}{result.user.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {result.user.firstName} {result.user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {result.user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{result.user.email}</TableCell>
                      <TableCell>
                        <Chip label={result.user.role} size="small" />
                      </TableCell>
                      <TableCell>
                        {result.manager ? (
                          `${result.manager.firstName} ${result.manager.lastName}`
                        ) : (
                          <Chip label="Missing" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {result.hrbp ? (
                          `${result.hrbp.firstName} ${result.hrbp.lastName}`
                        ) : (
                          <Chip label="Missing" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Total: {result.pipCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Active: {result.activePipCount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(result.user as any).isActive ? 'Active' : 'Inactive'}
                          color={(result.user as any).isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewProfile(result)}
                            title="View Profile"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnchorEl(e.currentTarget);
                              setMenuUser(result);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ModernCard>
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (menuUser) {
            handleEdit(menuUser);
            setAnchorEl(null);
          }
        }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit Profile
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuUser) {
            handleAssign(menuUser, 'manager');
            setAnchorEl(null);
          }
        }}>
          <Assignment fontSize="small" sx={{ mr: 1 }} /> Assign Manager
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuUser) {
            handleAssign(menuUser, 'hrbp');
            setAnchorEl(null);
          }
        }}>
          <Group fontSize="small" sx={{ mr: 1 }} /> Assign HRBP
        </MenuItem>
        <MenuItem onClick={async () => {
          if (menuUser && confirm('Deactivate this user?')) {
            try {
              await userManagementService.deactivateUser(menuUser.user.id);
              performSearch();
            } catch (error) {
              alert('Failed to deactivate user');
            }
            setAnchorEl(null);
          }
        }}>
          <PersonRemove fontSize="small" sx={{ mr: 1 }} /> Deactivate
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editFormData.firstName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editFormData.lastName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Role"
                value={editFormData.role || ''}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="hrbp">HRBP</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="executive">Executive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={editFormData.department || ''}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.isActive ?? true}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>
          {assignType === 'manager' ? 'Assign Manager' : 'Assign HRBP'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label={assignType === 'manager' ? 'Manager' : 'HRBP'}
            value={assignType === 'manager' ? editFormData.managerId || '' : editFormData.hrbpId || ''}
            onChange={(e) => {
              if (assignType === 'manager') {
                setEditFormData({ ...editFormData, managerId: e.target.value });
              } else {
                setEditFormData({ ...editFormData, hrbpId: e.target.value });
              }
            }}
            sx={{ mt: 2, minWidth: 300 }}
          >
            {(assignType === 'manager' ? managers : hrbps).map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </MenuItem>
            ))}
          </TextField>
          {selectedUsers.size > 1 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This will assign to {selectedUsers.size} selected users
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={selectedUsers.size > 1 ? handleBulkAssign : handleSaveAssign}
            variant="contained"
          >
            {selectedUsers.size > 1 ? 'Bulk Assign' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Profile Drawer */}
      <UserProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        user={selectedUserForProfile?.user || null}
        manager={selectedUserForProfile?.manager}
        hrbp={selectedUserForProfile?.hrbp}
        pips={userPips}
        onEdit={() => {
          if (selectedUserForProfile) {
            handleEdit(selectedUserForProfile);
            setProfileDrawerOpen(false);
          }
        }}
        onReassignManager={() => {
          if (selectedUserForProfile) {
            handleAssign(selectedUserForProfile, 'manager');
            setProfileDrawerOpen(false);
          }
        }}
        onReassignHRBP={() => {
          if (selectedUserForProfile) {
            handleAssign(selectedUserForProfile, 'hrbp');
            setProfileDrawerOpen(false);
          }
        }}
      />
    </Box>
  );
}

