import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userService } from './services/userService.js';
import { pipService } from './services/pipService.js';

// Routes
import authRoutes from './routes/auth.js';
import pipRoutes from './routes/pips.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';
import reportRoutes from './routes/reports.js';
import importRoutes from './routes/import.js';
import userManagementRoutes from './routes/userManagement.js';
import invalidRecordsRoutes from './routes/invalidRecords.js';
import notificationRoutes from './routes/notifications.js';
import slaRoutes from './routes/sla.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize default data
async function initialize() {
  try {
    await userService.initializeDefaultUsers();
    console.log('Default users initialized');
    
    // Update timeline statuses every minute (TC26, TC27)
    setInterval(() => {
      pipService.updateTimelineStatuses().catch(console.error);
    }, 60000);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pips', pipRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/invalid-records', invalidRecordsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sla', slaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initialize();
  console.log('Server initialization complete');
});

