# UI Integration Guide - PIP and Appraisal Integration

**Date:** December 19, 2025  
**Status:** ⚠️ **UI Components Need to be Added**

---

## Current Status

The backend integration is complete, but the UI components to display the integration are not yet fully implemented. This guide shows where the integration should appear in the UI.

---

## Where Integration Should Appear

### 1. ✅ PIP Detail Page (`/pips/:id`)

**Location:** `frontend/src/pages/PIPDetailPage.tsx`

**What to Show:**
- Banner/alert if PIP was created from an appraisal
- Appraisal cycle name and details
- Link to view the related appraisal
- Appraisal outcome (rating) that triggered the PIP

**Current Status:** ✅ Basic banner added

**Screenshot Location:**
```
PIP Detail Page
├── Header (with Back button)
├── [NEW] Appraisal Context Banner (if triggeredFromAppraisal = true)
├── Status & Created Date
├── [NEW] Appraisal Reference section (if triggeredFromAppraisal = true)
├── Reason
├── Workflow Progress
└── Tabs (Goals, Timeline, Check-ins, History)
```

### 2. ⚠️ PIP List Page (`/pips`)

**Location:** `frontend/src/pages/PIPListPage.tsx`

**What to Add:**
- Filter: "Show only PIPs from Appraisals"
- Column: "Appraisal Cycle" (if applicable)
- Badge/icon indicating if PIP came from appraisal

**Current Status:** ❌ Not implemented

### 3. ⚠️ User Profile - Performance Tab

**Location:** `frontend/src/pages/UserProfilePage.tsx` → `PerformanceTab`

**Current Code Shows:**
```typescript
<Typography variant="caption" color="text.secondary">Current Appraisal Cycle</Typography>
<Typography variant="body1">-</Typography>  // Currently shows "-"
```

**What to Add:**
- Display active appraisal cycles for the user
- Show appraisal rating/outcome
- Link between appraisal and PIP if one was created

**Current Status:** ❌ Placeholder only (shows "-")

### 4. ❌ Appraisal Detail Page (`/appraisals/:id`)

**Location:** Not yet created

**What to Create:**
- New page to show appraisal participant details
- Show related PIP if one was created (`AppraisalOutcome.pipId`)
- Link to view the PIP
- Display appraisal outcome with PIP trigger status

**Current Status:** ❌ Page doesn't exist yet

### 5. ❌ Appraisal List Page (`/appraisals`)

**Location:** Not yet created

**What to Create:**
- List of appraisal cycles
- Filter by status
- Show which participants have PIPs
- Links to view appraisal details

**Current Status:** ❌ Page doesn't exist yet

---

## Implementation Checklist

### Immediate (Quick Wins)

- [x] Add appraisal context banner to PIP Detail Page
- [ ] Add appraisal reference section to PIP Detail Page
- [ ] Add filter to PIP List Page for "From Appraisals"
- [ ] Add appraisal cycle column/badge to PIP List table

### Short Term

- [ ] Create Appraisal Service (`appraisalService.ts`)
- [ ] Create Appraisal List Page
- [ ] Create Appraisal Detail Page
- [ ] Add routes in `App.tsx` for appraisal pages
- [ ] Update User Profile Performance Tab to show real appraisal data

### Long Term

- [ ] Create unified Performance Review component
- [ ] Add dashboard widget showing PIP-Appraisal correlation
- [ ] Add reports showing appraisal-to-PIP conversion rates
- [ ] Create workflow to trigger PIP from appraisal outcome

---

## Code Examples

### 1. Appraisal Context Component for PIP Detail

```typescript
// Add to PIPDetailPage.tsx
import { Alert, Link, Box } from '@mui/material';
import { Assessment } from '@mui/icons-material';

{/* Appraisal Context */}
{pip.triggeredFromAppraisal && (
  <Alert 
    severity="info" 
    icon={<Assessment />}
    sx={{ mb: 3 }}
    action={
      pip.appraisalCycleId && (
        <Button
          size="small"
          onClick={() => navigate(`/appraisals/${pip.appraisalCycleId}/participants/${pip.appraisalParticipantId}`)}
        >
          View Appraisal
        </Button>
      )
    }
  >
    <Typography variant="subtitle2" gutterBottom>
      Created from Appraisal
    </Typography>
    <Typography variant="body2">
      This PIP was automatically created based on the appraisal outcome.
      {pip.appraisalCycleId && (
        <> View the related appraisal for more context.</>
      )}
    </Typography>
  </Alert>
)}
```

### 2. Appraisal Service (To Create)

```typescript
// frontend/src/services/appraisalService.ts
import api from './api';
import { AppraisalCycle, AppraisalParticipant, AppraisalOutcome } from '../types';

export const appraisalService = {
  async getCycles(): Promise<AppraisalCycle[]> {
    const response = await api.get<AppraisalCycle[]>('/appraisals/cycles');
    return response.data;
  },

  async getCycle(id: string): Promise<AppraisalCycle> {
    const response = await api.get<AppraisalCycle>(`/appraisals/cycles/${id}`);
    return response.data;
  },

  async getParticipant(id: string): Promise<AppraisalParticipant> {
    const response = await api.get<AppraisalParticipant>(`/appraisals/participants/${id}`);
    return response.data;
  },

  async getOutcome(participantId: string): Promise<AppraisalOutcome | null> {
    try {
      const response = await api.get<AppraisalOutcome>(`/appraisals/participants/${participantId}/outcome`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getParticipantWithPIP(participantId: string) {
    const participant = await this.getParticipant(participantId);
    const outcome = await this.getOutcome(participantId);
    let pip = null;
    
    if (outcome?.pipId) {
      // Import pipService
      const { pipService } = await import('./pipService');
      pip = await pipService.getPIP(outcome.pipId);
    }
    
    return { participant, outcome, pip };
  },
};
```

### 3. PIP List with Appraisal Badge

```typescript
// Add to PIPListPage.tsx table
<TableCell>
  {pip.triggeredFromAppraisal && (
    <Chip 
      label="From Appraisal" 
      size="small" 
      color="info"
      icon={<Assessment />}
    />
  )}
</TableCell>
```

### 4. User Profile Performance Tab Update

```typescript
// Update PerformanceTab in UserProfilePage.tsx
const [appraisalData, setAppraisalData] = useState<any>(null);

useEffect(() => {
  loadAppraisalData();
}, [user.id]);

const loadAppraisalData = async () => {
  try {
    // Fetch user's appraisal data
    const cycles = await appraisalService.getCycles();
    const activeCycle = cycles.find(c => c.status === 'ACTIVE');
    
    if (activeCycle) {
      const participants = await appraisalService.getCycleParticipants(activeCycle.id);
      const userParticipant = participants.find(p => p.employeeId === user.id);
      
      if (userParticipant) {
        const outcome = await appraisalService.getOutcome(userParticipant.id);
        setAppraisalData({ cycle: activeCycle, participant: userParticipant, outcome });
      }
    }
  } catch (error) {
    console.error('Failed to load appraisal data:', error);
  }
};

// Then display:
<Typography variant="caption" color="text.secondary">Current Appraisal Cycle</Typography>
<Typography variant="body1">
  {appraisalData?.cycle?.cycleName || 'None'}
</Typography>
```

---

## Navigation Structure (Recommended)

```
App Navigation
├── Dashboard
├── PIPs
│   ├── All PIPs (/pips)
│   ├── Create PIP (/pips/create)
│   └── PIP Detail (/pips/:id)
│       └── [Shows appraisal context if applicable]
├── Appraisals (NEW)
│   ├── All Cycles (/appraisals)
│   ├── Cycle Detail (/appraisals/cycles/:id)
│   └── Participant Detail (/appraisals/participants/:id)
│       └── [Shows linked PIP if applicable]
├── Goals
├── Users
│   └── Profile (/users/:userId/profile)
│       └── Performance Tab
│           ├── Shows Current Appraisal
│           └── Shows Active PIPs
└── Admin
```

---

## Visual Design Recommendations

### Color Coding
- **Appraisal-triggered PIP**: Use info/blue color scheme
- **Regular PIP**: Use default/warning color scheme
- **Link badges**: Small, subtle chips or icons

### Icons
- Use `Assessment` icon for appraisals
- Use `TrendingUp` or `Assignment` for PIPs
- Use `Link` icon to show relationships

### Layout
- Use Alert component for context banners
- Use Cards for related information
- Use horizontal dividers to separate sections

---

## Current File Locations

### PIP Pages
- `frontend/src/pages/PIPListPage.tsx`
- `frontend/src/pages/PIPDetailPage.tsx` ✅ **Partially updated**

### User Profile
- `frontend/src/pages/UserProfilePage.tsx` ⚠️ **Performance tab needs update**

### Services
- `frontend/src/services/pipService.ts` ✅ Exists
- `frontend/src/services/appraisalService.ts` ❌ **Needs to be created**

### Types
- `shared/types.ts` ✅ **Appraisal types added**
- `frontend/src/types/index.ts` ✅ **PIP integration fields added**

---

## Next Steps

1. **Create Appraisal Service** - Build the service layer for API calls
2. **Update PIP Detail Page** - Add full appraisal context display
3. **Update PIP List Page** - Add filters and badges
4. **Create Appraisal Pages** - Build list and detail pages
5. **Update User Profile** - Show real appraisal data
6. **Add Navigation** - Add appraisal routes to main navigation

---

**Status:** Backend integration complete ✅ | UI integration in progress ⚠️

