# Excel-Based Flat File Data Pipeline - Feature Documentation

## Overview

The PIP Management System now includes a comprehensive Excel/CSV data import pipeline for bulk user and organizational data management. This system supports file upload, validation, transformation, import, and rollback capabilities.

## Features Implemented

### 1️⃣ File Upload & Parsing Utilities

✅ **File Upload UI for Admin**
- Drag-and-drop or click to upload
- Support for `.xlsx`, `.xls`, and `.csv` formats
- File size limit: 10MB
- Automatic header detection
- Column mapping validation
- Multi-sheet support (Excel files)

**Backend Services:**
- `FileParserService` - Handles Excel and CSV parsing
- Automatic header detection
- Row normalization and data cleaning

### 2️⃣ Data Validation Utilities

✅ **Mandatory Fields Validation**
- User ID (required)
- User Name (required)
- Manager ID (required)
- Manager Name (required)
- HRBP ID (required)
- HRBP Name (required)

✅ **Referential Integrity Checks**
- Manager ID exists in file or database
- HRBP ID exists in file or database
- No duplicate User IDs
- User cannot report to themselves

✅ **Format Validation**
- Email format validation (if present)
- No unexpected characters
- Duplicate Manager/HRBP name detection

✅ **Rules Validation**
- Circular reporting detection (Employee → Manager → Employee)
- Max length validation
- Allowed characters check

✅ **Org Structure Mapping**
- Department field support
- Location field support
- Role/Grade detection and mapping

**Backend Services:**
- `DataValidationService` - Comprehensive validation logic
- Row-level error tracking
- Warning generation for non-critical issues

### 3️⃣ Error Handling Utilities

✅ **Error Identification**
- Missing UserID detection
- ManagerID not found warnings
- HRBPID not found warnings
- Duplicate row detection
- Orphan manager detection
- Invalid character encoding handling
- Empty row detection

✅ **Error Reporting**
- Error report summary
- Detailed error file export (Excel format)
- Row-level error highlighting
- Field-specific error messages

**Backend Services:**
- `ErrorReportGenerator` - Generates Excel error reports
- Summary report generation
- Detailed error breakdown

### 4️⃣ Data Transformation Utilities

✅ **Transformations Supported**
- Convert names to proper-case
- Map ManagerID to internal user object
- Generate unique internal identifiers
- Normalize department/location fields
- Convert date strings to timestamps
- Remove leading/trailing spaces
- Resolve hierarchical relationships

**Backend Services:**
- `DataTransformationService` - Data normalization and mapping
- Automatic ID resolution
- Relationship mapping

### 5️⃣ Data Loading Utilities

✅ **Import Modes**

**Full Load**
- Deletes all existing user data
- Replaces with new data from file
- Use with caution - destructive operation

**Delta Load** (Default)
- Updates existing users
- Creates new users
- Preserves existing passwords
- Non-destructive updates

**Append Mode**
- Only adds new users
- Skips existing users
- Safe for incremental imports

✅ **Upsert Logic**
- If user exists → update
- If user doesn't exist → create
- If manager changed → reassign
- If HRBP changed → update PIP routing

**Backend Services:**
- `ImportService` - Handles all import modes
- Upsert logic implementation
- Transaction-like behavior

### 6️⃣ Org Sync Utilities

✅ **Hierarchical Consistency**
- Manager reassignments handled automatically
- HRBP reassignments handled automatically
- Reporting tree rebuild
- Auto-update employee → manager → HRBP maps

✅ **Cascade Changes to PIPs**
- If manager changes → assign new manager to pending steps
- If HRBP changes → assign new HRBP
- Audit history maintained for all changes
- Only affects non-locked PIPs

**Backend Services:**
- `ImportService.updateAffectedPIPs()` - Cascades org changes
- Automatic PIP reassignment

### 7️⃣ PIP System Impact Utilities

✅ **For Active PIPs**
- Reassign pending steps to new manager
- Reassign review steps to new HRBP
- Freeze or unlock steps based on relationships
- Log all changes in audit

✅ **For Completed PIPs**
- Historical data remains unchanged
- Only reference IDs update if necessary

### 8️⃣ Preview & Simulation Utilities

✅ **Preview Screen**
- Display parsed data in tabular format
- Shows first 10 rows for preview
- Headers displayed correctly

✅ **Comparison View**
- Validation results displayed
- Error count and warning count
- Row-by-row validation status

✅ **Simulation Mode**
- Preview import without applying changes
- Shows expected updates
- Identifies inconsistencies
- Generates warnings

**Frontend:**
- `ImportPage` - Full preview and validation UI
- Step-by-step import wizard
- Real-time validation feedback

### 9️⃣ Audit & Logging Utilities

✅ **Every Step Recorded**
- File name + timestamp
- User who initiated import
- Rows processed
- Rows failed
- Records updated
- Records deleted
- Error file generated
- Timeline of events

**Backend Services:**
- Import snapshots stored for rollback
- Complete audit trail
- Import history tracking

### 🔟 Reconciliation Utilities

✅ **Post-Import Support**
- Compare imported file vs DB
- Missing users report
- Manager inconsistency report
- HRBP inconsistency report
- Historical vs current org delta report

**Backend Services:**
- Import history with full details
- Comparison capabilities

### 1️⃣1️⃣ Rollback Utilities

✅ **Rollback Capabilities**
- Rollback last import
- Restore previous org structure
- Restore user relationship mapping
- Restore manager & HRBP workflow links

**Backend Services:**
- `ImportService.rollbackImport()` - Full rollback support
- Snapshot-based restoration
- Safe rollback with confirmation

**Frontend:**
- `ImportHistoryPage` - View and rollback imports
- Confirmation dialogs
- Rollback status tracking

### 1️⃣2️⃣ Admin Utility Tools

✅ **Admin Features**
- Status of last import
- Import history list
- Configurable field mapping (via normalization)
- File size limits (10MB)
- Allowed file types (.xlsx, .xls, .csv)
- Required columns validation

**Frontend:**
- Admin-only access
- Import management dashboard
- History viewer
- Rollback interface

## API Endpoints

### Import Endpoints

- `POST /api/import/preview` - Preview and validate file (Admin only)
- `POST /api/import/import` - Import data (Admin only)
- `POST /api/import/error-report` - Download error report
- `GET /api/import/history` - Get import history (Admin only)
- `GET /api/import/last-import` - Get last import status (Admin only)
- `POST /api/import/rollback/:importId` - Rollback import (Admin only)

## File Format Requirements

### Required Columns

The import file must contain these columns (case-insensitive, spaces converted to underscores):

- `userid` or `user_id` or `employee_id` - Unique user identifier
- `username` or `user_name` or `name` - User's full name
- `managerid` or `manager_id` - Manager's user ID
- `managername` or `manager_name` - Manager's name
- `hrbpid` or `hrbp_id` - HRBP's user ID
- `hrbpname` or `hrbp_name` - HRBP's name

### Optional Columns

- `email` - User email address
- `department` - Department name
- `location` - Location/office
- `role` - User role (manager, employee, hrbp, admin, executive)
- `grade` - Job grade/level

### Example File Format

```csv
UserID,UserName,ManagerID,ManagerName,HRBPID,HRBPName,Email,Department
EMP001,John Doe,MGR001,Jane Manager,HRBP001,Sarah HRBP,john.doe@company.com,Engineering
EMP002,Jane Smith,MGR001,Jane Manager,HRBP001,Sarah HRBP,jane.smith@company.com,Engineering
```

## Usage Workflow

1. **Upload File**
   - Admin navigates to Admin → Data Import
   - Selects Excel or CSV file
   - File is validated for format and size

2. **Preview & Validate**
   - System parses file
   - Validates all rows
   - Shows preview with errors/warnings
   - Admin reviews validation results

3. **Fix Errors (if any)**
   - Download error report
   - Fix issues in source file
   - Re-upload corrected file

4. **Import Configuration**
   - Select import mode (Full/Delta/Append)
   - Review warnings
   - Confirm import

5. **Import Execution**
   - System transforms data
   - Imports users
   - Updates PIPs if needed
   - Generates import report

6. **Review Results**
   - View import summary
   - Check created/updated counts
   - Review any errors

7. **Rollback (if needed)**
   - View import history
   - Select import to rollback
   - Confirm rollback
   - System restores previous state

## Security Features

- Admin-only access to import functionality
- File type validation
- File size limits
- Input sanitization
- Audit logging for all operations
- Rollback capability for safety

## Error Handling

- Comprehensive validation before import
- Row-level error tracking
- Detailed error reports
- Warning system for non-critical issues
- Safe import modes (delta/append)

## Best Practices

1. **Always preview before importing** - Use preview mode to catch errors early
2. **Use Delta mode for regular updates** - Safer than full load
3. **Keep import history** - Track all imports for audit purposes
4. **Test with small files first** - Validate format before large imports
5. **Review warnings** - Address warnings before importing if possible
6. **Backup before full load** - Full load deletes existing data

## Future Enhancements

Potential additions:
- Email notifications on import completion
- Scheduled imports
- Column mapping UI
- Advanced filtering
- Bulk PIP creation from import
- Department-level imports
- Import templates

