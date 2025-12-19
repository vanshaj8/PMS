import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Paper,
  Divider,
  InputAdornment,
  Collapse,
  Card,
  CardContent,
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
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  PersonAdd,
  Refresh,
} from '@mui/icons-material';
import { userManagementService, UserSearchFilters, UserSearchResult } from '../services/userManagementService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User, PIP } from '../types';
import UserProfileDrawer from '../components/UserProfileDrawer';
import { pipService } from '../services/pipService';

export default function UserManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllUsers();
    
    // Handle URL parameters for contextual navigation from dashboard
    const filterParam = searchParams.get('filter');
    const managerIdParam = searchParams.get('managerId');
    
    if (filterParam === 'missingManager') {
      setFilters({ missingManager: true });
      setFiltersExpanded(true);
    } else if (filterParam === 'missingHRBP' || filterParam === 'missingHrbp') {
      setFilters({ missingHrbp: true });
      setFiltersExpanded(true);
    } else if (filterParam === 'circularReporting') {
      // This would need backend support
      setFilters({});
    } else if (filterParam === 'selfReporting') {
      // This would need backend support
      setFilters({});
    } else if (managerIdParam) {
      // Filter by specific manager - would need backend support
      setFilters({});
    }
    
    // Initial search - always perform on mount
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery]);

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
      const searchFilters = { ...filters };
      if (searchQuery && searchQuery.trim()) {
        // Search in name, email, or user ID (backend handles all)
        searchFilters.userName = searchQuery.trim();
      }
      const results = await userManagementService.searchUsers(searchFilters);
      setSearchResults(results || []);
    } catch (error: any) {
      console.error('Search failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Show user-friendly error but don't clear results if it's a network error
      if (error.response?.status === 404 || error.response?.status === 500) {
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
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
    // Navigate to full profile page
    navigate(`/users/${result.user.id}/profile`);
    // Keep drawer as fallback
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

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof UserSearchFilters]).length + (searchQuery ? 1 : 0);

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
    <Box sx={{ pb: 4 }}>
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
          User Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Search, manage, and organize users across your organization
        </Typography>
      </Box>

      {/* Search Bar - Prominent */}
      <ModernCard sx={{ mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            fullWidth
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="medium"
            sx={{ flex: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              handleClearFilters();
              performSearch();
            }}
          >
            Reset
          </Button>
        </Box>
      </ModernCard>

      {/* Filters Section - Highly Visible */}
      <ModernCard 
        sx={{ 
          mb: 3,
          border: '2px solid',
          borderColor: filtersExpanded ? 'primary.main' : 'divider',
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ cursor: 'pointer' }}
          onClick={() => setFiltersExpanded(!filtersExpanded)}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <FilterList color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <IconButton>
            {filtersExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={filtersExpanded}>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            {/* Basic Filters */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                BASIC FILTERS
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="User ID"
                value={filters.userId || ''}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
                size="small"
                placeholder="Enter user ID"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Role"
                value={filters.role || ''}
                onChange={(e) => setFilters({ ...filters, role: e.target.value as any || undefined })}
                size="small"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="hrbp">HRBP</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="executive">Executive</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                size="small"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="on_pip">On PIP</MenuItem>
                <MenuItem value="completed_pip">Completed PIP</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Department"
                value={filters.department || ''}
                onChange={(e) => setFilters({ ...filters, department: e.target.value || undefined })}
                size="small"
                placeholder="Enter department"
              />
            </Grid>

            {/* Relationship Filters */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                RELATIONSHIP FILTERS
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: filters.missingManager ? 'error.light' : 'background.paper',
                  border: filters.missingManager ? '2px solid' : '1px solid',
                  borderColor: filters.missingManager ? 'error.main' : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: filters.missingManager ? 'error.light' : 'action.hover',
                  },
                }}
                onClick={() => setFilters({ ...filters, missingManager: !filters.missingManager })}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.missingManager || false}
                      onChange={(e) => setFilters({ ...filters, missingManager: e.target.checked || undefined })}
                      color="error"
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Missing Manager
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Users without assigned manager
                      </Typography>
                    </Box>
                  }
                />
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: filters.missingHrbp ? 'error.light' : 'background.paper',
                  border: filters.missingHrbp ? '2px solid' : '1px solid',
                  borderColor: filters.missingHrbp ? 'error.main' : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: filters.missingHrbp ? 'error.light' : 'action.hover',
                  },
                }}
                onClick={() => setFilters({ ...filters, missingHrbp: !filters.missingHrbp })}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.missingHrbp || false}
                      onChange={(e) => setFilters({ ...filters, missingHrbp: e.target.checked || undefined })}
                      color="error"
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Missing HRBP
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Users without assigned HRBP
                      </Typography>
                    </Box>
                  }
                />
              </Card>
            </Grid>

            {/* Quick Filter Chips */}
            {activeFiltersCount > 0 && (
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Active filters:
                  </Typography>
                  {filters.role && (
                    <Chip
                      label={`Role: ${filters.role}`}
                      onDelete={() => setFilters({ ...filters, role: undefined })}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {filters.status && (
                    <Chip
                      label={`Status: ${filters.status}`}
                      onDelete={() => setFilters({ ...filters, status: undefined })}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {filters.department && (
                    <Chip
                      label={`Dept: ${filters.department}`}
                      onDelete={() => setFilters({ ...filters, department: undefined })}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {filters.missingManager && (
                    <Chip
                      label="Missing Manager"
                      onDelete={() => setFilters({ ...filters, missingManager: undefined })}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  {filters.missingHrbp && (
                    <Chip
                      label="Missing HRBP"
                      onDelete={() => setFilters({ ...filters, missingHrbp: undefined })}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  {searchQuery && (
                    <Chip
                      label={`Search: ${searchQuery}`}
                      onDelete={() => setSearchQuery('')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={handleClearFilters}
                    sx={{ ml: 'auto' }}
                  >
                    Clear All
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </ModernCard>

      {/* Results Summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Results: {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
        </Typography>
        {loading && <Typography variant="body2" color="text.secondary">Loading...</Typography>}
      </Box>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <ModernCard
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography sx={{ color: 'white', fontWeight: 600 }}>
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<Assignment />}
              onClick={() => handleBulkAction('manager')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              Bulk Assign Manager
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Group />}
              onClick={() => handleBulkAction('hrbp')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              Bulk Assign HRBP
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<PersonRemove />}
              onClick={() => handleBulkAction('deactivate')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
              }}
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
              {searchResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found. Try adjusting your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                searchResults.map((result) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </ModernCard>

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
