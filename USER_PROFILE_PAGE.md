# User Profile Page — SaaS Standard Design

## Overview

A comprehensive User Profile Page following SaaS design standards with role-based visibility, tabbed layout, and full CRUD capabilities.

## Features Implemented

### ✅ 1. Basic Identity (Required)
- Employee ID (immutable, read-only)
- First Name (editable)
- Last Name (editable)
- Preferred Name (optional, editable)
- Work Email (editable)
- Phone Number (optional, editable)
- Profile Photo (placeholder - ready for upload)
- Status (Active/Inactive)

### ✅ 2. Organizational Information
- Job Title
- Department (dropdown)
- Business Unit / Division
- Location
- Employment Type (Full-time, Contract, Part-time, Intern)
- Date of Joining
- Employment Level / Grade
- Cost Center

### ✅ 3. Reporting & Ownership
- Manager (with assignment capability)
- HRBP (with assignment capability)
- Skip-Level Manager (auto-derived, read-only)
- Direct Reports (for managers)

### ✅ 4. Performance Snapshot
- Current Appraisal Cycle (placeholder - ready for Appraisal integration)
- Latest Rating
- Rating Trend (last 3 cycles)
- Active PIP (real-time)
- PIP History (completed PIPs count)

### ✅ 5. Goals Summary
- Active Goals Count
- Overdue Goals (highlighted)
- Total Goals
- Navigation to full Goals Page

### ✅ 6. Security & Access (Admin-only)
- User Role
- Account Status
- Last Login
- MFA Enabled status

### ✅ 7. Employment History
- PIP History table
- Ready for expansion (role changes, manager history, department transfers)

## Tab Structure

```
Profile
├── Overview (Basic Identity + Quick Stats)
├── Organization (Org Information)
├── Reporting (Manager/HRBP structure)
├── Performance (Performance Snapshot)
├── Goals (Goals Summary)
├── Security (Admin-only)
└── History (Employment History)
```

## Role-Based Visibility Matrix

| Section | Employee | Manager | HR | Admin |
|---------|----------|---------|----|----|
| Basic Info | View/Edit Own | View/Edit Team | View/Edit | View/Edit |
| Org Info | View | View | Edit | Edit |
| Reporting | View | View | Edit | Edit |
| Performance | View | View | View | View |
| Goals | View | View | View | View |
| Security | ❌ | ❌ | ❌ | Edit |
| History | View | View | View | View |

## Implementation Details

### Component Structure

1. **Main Component**: `UserProfilePage.tsx`
   - Handles routing, data loading, and state management
   - Manages tab navigation
   - Controls edit mode

2. **Tab Components**:
   - `OverviewTab` - Basic identity and quick stats
   - `OrganizationTab` - Organizational information
   - `ReportingTab` - Reporting structure
   - `PerformanceTab` - Performance snapshot
   - `GoalsTab` - Goals summary
   - `SecurityTab` - Security and access (admin-only)
   - `HistoryTab` - Employment history

### Data Integration

- **User Data**: `userManagementService.getUserDetails()`
- **PIP Data**: `pipService.getPIPs()` (filtered by employeeId)
- **Goals Data**: `goalService.getUserGoals()`
- **Updates**: `userManagementService.updateUserProfile()`

### Edit Capabilities

- **Inline Editing**: Edit button opens form within the card
- **Section-based**: Each section can be edited independently
- **Save/Cancel**: Clear save/cancel actions
- **Validation**: Form validation (required fields)

### Navigation

- Route: `/users/:userId/profile`
- Accessible from:
  - User Management page (click on user)
  - Dashboard (click on user name/avatar)
  - Anywhere user is displayed

## Design Principles Followed

✅ **Single Source of Truth**: All user data comes from centralized services  
✅ **Read vs Edit Separated**: Clear distinction between view and edit modes  
✅ **Role-based Visibility**: Sections shown/hidden based on user role  
✅ **Audit-safe**: All changes go through proper API endpoints  
✅ **Expandable**: Easy to add new sections/tabs

## Future Enhancements

### Phase 2
- [ ] Skills & Competencies tab
- [ ] Documents tab (offer letters, appraisal letters, PIP letters)
- [ ] Profile photo upload
- [ ] Employment history tracking (role changes, transfers)
- [ ] Manager history visualization
- [ ] Department history

### Phase 3
- [ ] Performance trends chart
- [ ] Goal completion visualization
- [ ] Rating history timeline
- [ ] Export profile as PDF
- [ ] Activity feed

## API Endpoints Used

- `GET /api/user-management/:userId/details` - Get user details
- `PUT /api/user-management/:userId/profile` - Update user profile
- `POST /api/user-management/:userId/assign-manager` - Assign manager
- `POST /api/user-management/:userId/assign-hrbp` - Assign HRBP
- `GET /api/pips` - Get PIPs (filtered client-side)
- `GET /api/goals/users/:userId` - Get user goals

## Usage

```tsx
// Navigate to user profile
navigate(`/users/${userId}/profile`);

// From User Management page
<Button onClick={() => navigate(`/users/${user.id}/profile`)}>
  View Profile
</Button>
```

## Notes

- The page is fully responsive and works on mobile/tablet/desktop
- All sections use ModernCard component for consistent styling
- Error handling is implemented for all API calls
- Loading states are shown during data fetch
- Edit mode is section-based to prevent accidental changes

---

**Status**: ✅ Fully Implemented and Ready for Use

