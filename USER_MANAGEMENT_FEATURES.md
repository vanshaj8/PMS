# User & Manager Management Features - Complete Documentation

## Overview

The PIP Management System now includes comprehensive user and manager management capabilities with a flat-file driven approach, advanced search, bulk operations, and hierarchy management.

## Features Implemented

### 1️⃣ User Creation & Profile Management

✅ **Excel/Flat File Ingestion**
- Users created via Excel/CSV import
- Required fields: User Name, User ID, Manager Name, Manager ID, HRBP Name, HRBP ID
- Optional fields: Department, Role, Location, Email
- Auto-mapping of reporting hierarchy (User → Manager → HRBP)

✅ **Invalid Records Queue**
- Records with missing or invalid hierarchy data are flagged
- Stored in "Invalid User Data" queue for admin correction
- Admin can manually edit hierarchy before finalizing user creation
- Status tracking: Pending → Corrected → Processed

✅ **Profile Management**
- Edit user name, email, role, department, location
- Update manager and HRBP assignments
- Activate/deactivate users
- Password management

**Backend Services:**
- `InvalidRecordsService` - Manages invalid records queue
- `UserManagementService` - Profile management operations

**Frontend:**
- `InvalidRecordsPage` - Queue management UI
- `UserManagementPage` - Profile editing UI

### 2️⃣ Manager Assignment & Editing

✅ **Admin Capabilities**

**Manager Assignment:**
- Assign Manager to any user from platform UI
- Search from all existing managers & assign
- Reassign manager if reporting structure changes
- Bulk manager assignment

**HRBP Assignment:**
- Edit HRBP assignment
- Reassign HRBP
- Bulk HRBP assignment

**User Profile Editing:**
- User name
- Email
- Role/Position
- Department
- Status (active/inactive)
- Manager
- HRBP

**User Deletion:**
- Soft delete (deactivate) instead of hard delete
- Preserves historical data

✅ **Validation Rules**
- ✅ Prevent circular reporting (A → B cannot report to A)
- ✅ Prevent self-assignment (User cannot be their own manager)
- ✅ Manager must be an active user in the system
- ✅ Each User must have exactly 1 Manager and 1 HRBP (enforced during import)

**API Endpoints:**
- `POST /api/user-management/:id/assign-manager`
- `POST /api/user-management/:id/assign-hrbp`
- `PUT /api/user-management/:id/profile`
- `POST /api/user-management/:id/deactivate`

### 3️⃣ Admin User Search Panel (Advanced Filters)

✅ **Search Filters**

- ✅ User Name
- ✅ User ID
- ✅ Manager Name / Manager ID
- ✅ HRBP Name / HRBP ID
- ✅ Department
- ✅ Role
- ✅ Status (Active / Inactive / On PIP / Completed PIP)
- ✅ Date of Creation
- ✅ Missing Manager assignments
- ✅ Missing HRBP assignments
- ✅ Excel Upload Batch ID (via import history)
- ✅ Error/Invalid Records

✅ **Search Results Display**

- ✅ Full user profile summary
- ✅ Manager → HRBP reporting chain
- ✅ Count of PIP processes linked to the user
- ✅ Quick actions (Edit / Reassign Manager / Reassign HRBP / Deactivate User)

✅ **Bulk Actions**

- ✅ Bulk Manager Reassignment
- ✅ Bulk HRBP Reassignment
- ✅ Bulk Deactivate
- ✅ Bulk Download User Data (via export functionality)

**Frontend:**
- `UserManagementPage` - Advanced search with filters
- Multi-select for bulk operations
- Context menu for quick actions

**API Endpoints:**
- `POST /api/user-management/search` - Advanced search
- `POST /api/user-management/bulk/assign-manager`
- `POST /api/user-management/bulk/assign-hrbp`
- `POST /api/user-management/bulk/deactivate`

### 4️⃣ Utility Tasks for Flat-File Approach

✅ **A. File Upload & Parsing**
- ✅ Validate file format (Excel .xlsx or .csv)
- ✅ Validate required columns present
- ✅ Validate duplicate entries
- ✅ Validate blank required fields

✅ **B. Data Mapping & Verification**
- ✅ Ensure UserID uniqueness
- ✅ Validate Manager & HRBP relationships
- ✅ Check if provided ManagerIDs exist in batch or system
- ✅ Auto-create manager/HRBP if marked as "new" in file (via transformation)

✅ **C. Error Handling & Logging**
- ✅ Exportable error log with:
  - Row number
  - Column name
  - Error description
- ✅ Store failed rows for admin correction
- ✅ Allow admin to correct errors in UI and reprocess

✅ **D. Preview & Confirmation Step**
- ✅ Before final import, admin can preview:
  - Total rows
  - New users count
  - Updated users count
  - Users with missing fields
  - Hierarchy summary
  - Conflicts detected

✅ **E. Historical Upload Tracking**
- ✅ Maintain upload logs:
  - Batch ID
  - Uploaded by
  - Timestamp
  - Number of created/updated users
  - Success/Failure counts
  - Download error report

### 5️⃣ Integration With PIP Workflow

✅ **Hierarchy Determines PIP Flow**
- ✅ PIP initiator = Manager (from user hierarchy)
- ✅ HRBP auto-linked using hierarchy
- ✅ Routing of each step based on assigned hierarchy
- ✅ Reporting/dashboard metrics use hierarchy

✅ **Dynamic Hierarchy Updates**
- ✅ Admin can correct hierarchy at any time
- ✅ All future PIP tasks reflect updated hierarchy
- ✅ Active PIPs are updated when manager/HRBP changes
- ✅ Completed PIPs preserve historical data

**Backend:**
- `ImportService.updateAffectedPIPs()` - Cascades org changes to PIPs
- Automatic PIP reassignment on hierarchy changes

### 6️⃣ Admin Dashboard

✅ **Dashboard Widgets**

- ✅ Total users
- ✅ Users missing manager/HRBP
- ✅ Pending PIP processes
- ✅ Delayed PIP steps
- ✅ Manager load distribution (how many employees under each manager)
- ✅ Upload history
- ✅ User hierarchy health check widget

✅ **Quick Actions**

- ✅ Upload file
- ✅ Search users
- ✅ Fix invalid rows
- ✅ Bulk manager/HRBP update

**Frontend:**
- `AdminDashboardPage` - Comprehensive admin dashboard
- Hierarchy health visualization
- Manager load distribution table
- Last import status
- Quick action buttons

**API Endpoints:**
- `GET /api/user-management/manager-load` - Manager distribution
- `GET /api/user-management/hierarchy-health` - Health metrics

## User Interface Components

### Admin Dashboard (`AdminDashboardPage`)
- Overview statistics
- Hierarchy health check widget
- Manager load distribution
- Last import status
- Quick action buttons

### User Management (`UserManagementPage`)
- Advanced search panel with multiple filters
- User results table with relationships
- Bulk selection and operations
- Individual user actions (edit, assign, deactivate)
- Profile editing dialog
- Manager/HRBP assignment dialog

### Invalid Records Queue (`InvalidRecordsPage`)
- List of invalid records from imports
- Status filtering (Pending, Corrected, All)
- Record correction interface
- Process corrected records
- Delete records

### Data Import (`ImportPage`)
- File upload interface
- Preview and validation
- Import mode selection
- Results display

### Import History (`ImportHistoryPage`)
- Historical import list
- Import details
- Rollback functionality

## API Reference

### User Management Endpoints

```
POST   /api/user-management/search              # Search users with filters
GET    /api/user-management/:id/details         # Get user with relationships
POST   /api/user-management/:id/assign-manager  # Assign manager
POST   /api/user-management/:id/assign-hrbp     # Assign HRBP
PUT    /api/user-management/:id/profile         # Update user profile
POST   /api/user-management/:id/deactivate      # Deactivate user
POST   /api/user-management/bulk/assign-manager # Bulk assign manager
POST   /api/user-management/bulk/assign-hrbp    # Bulk assign HRBP
POST   /api/user-management/bulk/deactivate     # Bulk deactivate
GET    /api/user-management/manager-load        # Manager load distribution
GET    /api/user-management/hierarchy-health    # Hierarchy health metrics
```

### Invalid Records Endpoints

```
GET    /api/invalid-records                     # Get invalid records
PUT    /api/invalid-records/:id/correct         # Correct record
POST   /api/invalid-records/:id/process         # Process corrected record
DELETE /api/invalid-records/:id                 # Delete record
```

## Workflow Examples

### 1. Import Users with Invalid Records

1. Admin uploads Excel file via Admin → Data Import
2. System validates and identifies invalid records
3. Invalid records saved to queue
4. Admin reviews invalid records in Admin → Invalid Records
5. Admin corrects each record manually
6. Admin processes corrected records
7. Records are imported into system

### 2. Assign Manager to User

1. Admin navigates to Admin → User Management
2. Searches for user
3. Clicks actions menu → Assign Manager
4. Selects manager from dropdown
5. System validates (no circular reporting, manager is active)
6. Manager assigned and PIPs updated if needed

### 3. Bulk Manager Reassignment

1. Admin searches for users (e.g., by department)
2. Selects multiple users using checkboxes
3. Clicks "Bulk Assign Manager"
4. Selects new manager
5. System processes all assignments
6. Shows success/failure summary

### 4. Hierarchy Health Check

1. Admin views Admin Dashboard
2. Sees hierarchy health widget
3. Identifies users missing manager/HRBP
4. Uses search filters to find missing assignments
5. Bulk assigns manager/HRBP to fix issues

## Validation Rules

### Manager Assignment
- ✅ Manager must exist in system
- ✅ Manager must be active
- ✅ User cannot be their own manager
- ✅ No circular reporting (A → B → A)
- ✅ Manager must have 'manager' role

### HRBP Assignment
- ✅ HRBP must exist in system
- ✅ HRBP must be active
- ✅ HRBP must have 'hrbp' role

### User Profile
- ✅ Email must be valid format
- ✅ Role must be valid (employee, manager, hrbp, admin, executive)
- ✅ Required fields cannot be empty

## Best Practices

1. **Always validate before import** - Use preview mode to catch errors early
2. **Fix invalid records promptly** - Use invalid records queue to correct issues
3. **Monitor hierarchy health** - Check dashboard regularly for missing assignments
4. **Use bulk operations wisely** - Verify selections before bulk actions
5. **Maintain hierarchy integrity** - Ensure all users have manager and HRBP
6. **Review manager load** - Distribute employees evenly across managers

## Future Enhancements

Potential additions:
- Email notifications on hierarchy changes
- Automated hierarchy validation schedules
- Advanced hierarchy visualization (org chart)
- Import templates with pre-filled mappings
- Role-based hierarchy rules
- Historical hierarchy tracking
- Export user data with hierarchy

