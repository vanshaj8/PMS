import { Box, Typography, Paper, Container } from '@mui/material';
import { Assessment } from '@mui/icons-material';

export default function AppraisalListPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Annual Appraisals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage annual performance review cycles
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Appraisal Module
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Appraisal management interface coming soon.
        </Typography>
      </Paper>
    </Container>
  );
}

