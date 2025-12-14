import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import { Close, Edit, Assignment } from '@mui/icons-material';
import { User, PIP } from '../types';
import { format } from 'date-fns';

interface UserProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  manager?: User;
  hrbp?: User;
  pips?: PIP[];
  onEdit?: () => void;
  onReassignManager?: () => void;
  onReassignHRBP?: () => void;
}

export default function UserProfileDrawer({
  open,
  onClose,
  user,
  manager,
  hrbp,
  pips = [],
  onEdit,
  onReassignManager,
  onReassignHRBP,
}: UserProfileDrawerProps) {
  if (!user) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 500 } },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            User Profile
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: 32,
            }}
          >
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            <Chip label={user.role} size="small" sx={{ mt: 1 }} />
          </Box>
        </Box>

        <Box display="flex" gap={1} mb={3}>
          {onEdit && (
            <Button variant="outlined" startIcon={<Edit />} onClick={onEdit}>
              Edit
            </Button>
          )}
          {onReassignManager && (
            <Button variant="outlined" onClick={onReassignManager}>
              Reassign Manager
            </Button>
          )}
          {onReassignHRBP && (
            <Button variant="outlined" onClick={onReassignHRBP}>
              Reassign HRBP
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              User ID
            </Typography>
            <Typography variant="body1">{user.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Department
            </Typography>
            <Typography variant="body1">{user.department || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Manager
            </Typography>
            <Typography variant="body1">
              {manager ? `${manager.firstName} ${manager.lastName}` : 'Not assigned'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              HRBP
            </Typography>
            <Typography variant="body1">
              {hrbp ? `${hrbp.firstName} ${hrbp.lastName}` : 'Not assigned'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={(user as any).isActive ? 'Active' : 'Inactive'}
              color={(user as any).isActive ? 'success' : 'default'}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">
              {(user as any).createdAt ? format(new Date((user as any).createdAt), 'MMM dd, yyyy') : 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Reporting Chain */}
        <Typography variant="h6" gutterBottom>
          Reporting Chain
        </Typography>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box display="flex" flexDirection="column" gap={1}>
            {hrbp && (
              <Box>
                <Typography variant="caption" color="text.secondary">HRBP</Typography>
                <Typography variant="body2">{hrbp.firstName} {hrbp.lastName}</Typography>
              </Box>
            )}
            {manager && (
              <Box>
                <Typography variant="caption" color="text.secondary">Manager</Typography>
                <Typography variant="body2">{manager.firstName} {manager.lastName}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Employee</Typography>
              <Typography variant="body2">{user.firstName} {user.lastName}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Associated PIPs */}
        <Typography variant="h6" gutterBottom>
          Associated PIPs ({pips.length})
        </Typography>
        <List>
          {pips.length === 0 ? (
            <ListItem>
              <ListItemText primary="No PIPs found" />
            </ListItem>
          ) : (
            pips.map((pip) => (
              <ListItem key={pip.id}>
                <ListItemText
                  primary={`PIP #${pip.id.slice(0, 8)}`}
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        Status: {pip.status.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created: {format(new Date(pip.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Box>
    </Drawer>
  );
}

