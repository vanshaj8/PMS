# Frontend API Usage Examples

This document provides examples of how to call the backend APIs from the React frontend.

## Configuration

The API base URL is configured via environment variables. Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The API service is already configured in `src/services/api.ts` to use this environment variable.

---

## Example 1: Health Check

```typescript
import api from './services/api';

// Simple health check
const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    console.log('Backend is running:', response.data);
    // Response: { status: "ok", service: "PIP Management Backend" }
  } catch (error) {
    console.error('Backend is not available:', error);
  }
};
```

---

## Example 2: User Login

```typescript
import api from './services/api';

const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    const { token, user } = response.data;
    
    // Store token in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
};

// Usage
const handleLogin = async () => {
  try {
    const { user } = await login('user@example.com', 'password123');
    console.log('Logged in as:', user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## Example 3: Get Current User

```typescript
import api from './services/api';

const getCurrentUser = async () => {
  try {
    // Token is automatically added by the axios interceptor
    const response = await api.get('/auth/me');
    return response.data.user;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

// Usage in React component
const UserProfile = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error);
  }, []);
  
  return user ? <div>Welcome, {user.firstName}!</div> : <div>Loading...</div>;
};
```

---

## Example 4: Get All PIPs

```typescript
import api from './services/api';

const getAllPIPs = async () => {
  try {
    const response = await api.get('/pips');
    return response.data.pips;
  } catch (error) {
    console.error('Failed to fetch PIPs:', error);
    throw error;
  }
};

// Usage in React component
const PIPList = () => {
  const [pips, setPips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getAllPIPs()
      .then(setPips)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {pips.map(pip => (
        <div key={pip.id}>
          <h3>PIP for {pip.employeeId}</h3>
          <p>Status: {pip.status}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## Example 5: Create a PIP

```typescript
import api from './services/api';

const createPIP = async (pipData: {
  employeeId: string;
  hrbpId: string;
  reason: string;
  goals: Array<{
    title: string;
    description: string;
    weightage: number;
    expectedOutcome: string;
    targetTimeline: string;
    deadline: string;
  }>;
  timeline: {
    employeeAcknowledgementDeadline: string;
    pipActiveDuration: number;
    employeeSelfReviewDeadline: string;
    managerFinalReviewDeadline: string;
    hrbpFinalDecisionDeadline: string;
  };
}) => {
  try {
    const response = await api.post('/pips', pipData);
    return response.data.pip;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to create PIPs');
    }
    throw error;
  }
};

// Usage
const handleCreatePIP = async () => {
  try {
    const newPIP = await createPIP({
      employeeId: 'employee-123',
      hrbpId: 'hrbp-456',
      reason: 'Performance improvement needed',
      goals: [
        {
          title: 'Improve code quality',
          description: 'Reduce bugs by 50%',
          weightage: 30.0,
          expectedOutcome: 'Zero critical bugs',
          targetTimeline: '3 months',
          deadline: '2024-12-31'
        }
      ],
      timeline: {
        employeeAcknowledgementDeadline: '2024-01-15',
        pipActiveDuration: 90,
        employeeSelfReviewDeadline: '2024-04-15',
        managerFinalReviewDeadline: '2024-04-30',
        hrbpFinalDecisionDeadline: '2024-05-15'
      }
    });
    console.log('PIP created:', newPIP);
  } catch (error) {
    console.error('Failed to create PIP:', error);
  }
};
```

---

## Example 6: Employee Acknowledges PIP

```typescript
import api from './services/api';

const acknowledgePIP = async (pipId: string, comments: string) => {
  try {
    const response = await api.post(`/pips/${pipId}/acknowledge`, {
      comments
    });
    return response.data.pip;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to acknowledge this PIP');
    }
    throw error;
  }
};

// Usage
const handleAcknowledge = async (pipId: string) => {
  try {
    const updatedPIP = await acknowledgePIP(pipId, 'I acknowledge this PIP');
    console.log('PIP acknowledged:', updatedPIP);
  } catch (error) {
    console.error('Failed to acknowledge PIP:', error);
  }
};
```

---

## Example 7: Get Dashboard Statistics

```typescript
import api from './services/api';

const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data.stats;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    throw error;
  }
};

// Usage in React component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error);
  }, []);
  
  if (!stats) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Dashboard Statistics</h2>
      <p>Total PIPs: {stats.totalPIPs}</p>
      <p>Active PIPs: {stats.activePIPs}</p>
      <p>Pending Action: {stats.pendingAction}</p>
      <p>Success Rate: {stats.successRate}%</p>
    </div>
  );
};
```

---

## Example 8: Error Handling with User Feedback

```typescript
import api from './services/api';
import { useState } from 'react';

const PIPForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/pips', formData);
      // Success - redirect or show success message
    } catch (err: any) {
      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const message = err.response.data?.error || 'An error occurred';
        
        if (status === 401) {
          setError('Your session has expired. Please login again.');
          // Redirect to login
        } else if (status === 403) {
          setError('You do not have permission to perform this action.');
        } else if (status === 400) {
          setError(`Invalid data: ${message}`);
        } else {
          setError(`Server error: ${message}`);
        }
      } else if (err.request) {
        // Request made but no response
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        // Something else happened
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(/* form data */);
    }}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

---

## Example 9: Using React Query (Optional)

If you're using React Query for better data fetching:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './services/api';

// Query hook
const usePIPs = () => {
  return useQuery({
    queryKey: ['pips'],
    queryFn: async () => {
      const response = await api.get('/pips');
      return response.data.pips;
    }
  });
};

// Mutation hook
const useCreatePIP = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pipData: any) => {
      const response = await api.post('/pips', pipData);
      return response.data.pip;
    },
    onSuccess: () => {
      // Invalidate and refetch PIPs list
      queryClient.invalidateQueries({ queryKey: ['pips'] });
    }
  });
};

// Usage in component
const PIPList = () => {
  const { data: pips, isLoading, error } = usePIPs();
  const createPIP = useCreatePIP();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {pips?.map(pip => (
        <div key={pip.id}>{pip.id}</div>
      ))}
    </div>
  );
};
```

---

## Example 10: File Upload (if needed)

```typescript
import api from './services/api';

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Assuming you have a file upload endpoint
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url; // Return the file URL
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};
```

---

## Notes

1. **Automatic Token Injection**: The axios interceptor in `api.ts` automatically adds the JWT token to all requests from localStorage.

2. **Automatic Error Handling**: The interceptor handles 401 errors by clearing tokens and redirecting to login.

3. **CORS**: The backend is configured to accept requests from `http://localhost:5173` (Vite default port).

4. **Environment Variables**: Always use `VITE_` prefix for Vite environment variables. They are available via `import.meta.env.VITE_API_BASE_URL`.

5. **Type Safety**: Consider creating TypeScript interfaces for API request/response types for better type safety.
