import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PIPListPage from './pages/PIPListPage';
import PIPDetailPage from './pages/PIPDetailPage';
import CreatePIPPage from './pages/CreatePIPPage';
import AdminPage from './pages/AdminPage';
import TimelineEditorPage from './pages/TimelineEditorPage';
import ImportPage from './pages/ImportPage';
import ImportHistoryPage from './pages/ImportHistoryPage';
import UserManagementPage from './pages/UserManagementPage';
import InvalidRecordsPage from './pages/InvalidRecordsPage';
import UserGoalsPage from './pages/UserGoalsPage';
import UserProfilePage from './pages/UserProfilePage';
import Layout from './components/Layout';
import { CircularProgress, Box } from '@mui/material';
import { ToastProvider } from './components/ToastContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { user } = useAuth();

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pips" element={<PIPListPage />} />
          <Route path="pips/create" element={<CreatePIPPage />} />
          <Route path="pips/:id" element={<PIPDetailPage />} />
          <Route path="pips/:id/timeline" element={<TimelineEditorPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/user-management" element={<UserManagementPage />} />
          <Route path="admin/invalid-records" element={<InvalidRecordsPage />} />
          <Route path="goals/users/:userId" element={<UserGoalsPage />} />
          <Route path="users/:userId/profile" element={<UserProfilePage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="import/history" element={<ImportHistoryPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;

