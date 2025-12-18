# Test Case: Manager Review Step

## Overview
This test case provides a complete PIP scenario ready for Manager Review testing. The PIP has completed all previous steps and is now waiting for the manager to review and provide feedback.

---

## Test PIP Details

### Basic Information
- **PIP ID**: `9d384ac6-dc3b-11f0-b6ca-5ffbcb09c9d7`
- **Status**: `PENDING_MANAGER_REVIEW`
- **Employee**: Alex Miller (alex.miller@pip.com)
- **Manager**: Sarah Chen (sarah.chen@pip.com) - **This is who will do the review**
- **HRBP**: Patricia Martinez (patricia.martinez@pip.com)

### Timeline
- **Created**: 60 days ago
- **Employee Acknowledged**: 55 days ago ✅
- **Active Period**: 50 days (ended 5 days ago) ✅
- **Employee Self-Review**: Completed 3 days ago ✅
- **Manager Review Due**: 2 days from now ⏳
- **HRBP Decision Due**: 7 days from now

---

## PIP Steps Status

| Step | Status | Due Date | Completed Date | Notes |
|------|--------|----------|----------------|-------|
| **1. Employee Acknowledgement** | ✅ COMPLETED | Oct 24, 2025 | Oct 24, 2025 | Employee acknowledged the PIP |
| **2. Active PIP** | ✅ COMPLETED | Dec 13, 2025 | Dec 13, 2025 | Active period completed |
| **3. Employee Self-Review** | ✅ COMPLETED | Dec 15, 2025 | Dec 15, 2025 | Employee provided detailed responses |
| **4. Manager Review** | ⏳ **PENDING** | **Dec 20, 2025** | **NULL** | **← CURRENT STEP TO TEST** |
| **5. HRBP Decision** | ⏳ PENDING | Dec 25, 2025 | NULL | Waiting for manager review |

---

## Goals (3 Goals with Employee Responses)

### Goal 1: Improve Project Delivery Timeliness
- **Weightage**: 35%
- **Status**: PARTIALLY_ACHIEVED
- **Deadline**: 10 days ago
- **Employee Justification**: 
  - Daily standup meetings with team
  - Use of project management tools for tracking
  - Early escalation of blockers
  - Time management training completed
- **Attachments**: `action_plan.pdf`, `training_certificate.pdf`
- **Manager Comments**: NULL (to be filled during review)

### Goal 2: Enhance Code Quality and Reduce Bugs
- **Weightage**: 30%
- **Status**: ACHIEVED
- **Deadline**: 5 days ago
- **Employee Justification**:
  - Completed code quality training
  - Implemented automated testing framework
  - Code review checklist created
  - Pair programming sessions with senior developers
  - Bug count reduced from 15 to 6
- **Attachments**: `test_coverage_report.pdf`, `code_review_scores.xlsx`
- **Manager Comments**: NULL (to be filled during review)

### Goal 3: Improve Customer Communication and Response Time
- **Weightage**: 35%
- **Status**: ACHIEVED
- **Deadline**: 8 days ago
- **Employee Justification**:
  - Set up email alerts and mobile notifications
  - Created response templates for common inquiries
  - Attended customer service training
  - Response time improved from 6 hours to 1.5 hours
- **Attachments**: `customer_satisfaction_survey.pdf`, `response_time_report.xlsx`
- **Manager Comments**: NULL (to be filled during review)

---

## Check-ins (3 Check-ins During Active Period)

1. **First Check-in** (30 days ago)
   - Employee started implementing action plans
   - Attended time management training
   - Initial progress looks positive

2. **Second Check-in** (20 days ago)
   - Code quality improvements visible
   - Bug count reduced
   - Employee actively seeking feedback

3. **Third Check-in** (10 days ago)
   - Significant improvement across all metrics
   - Customer response time improved
   - Employee showing strong commitment

---

## How to Test Manager Review

### Step 1: Login as Manager
```
Email: sarah.chen@pip.com
Password: password123
```

### Step 2: Navigate to PIP
- Go to PIP List or Dashboard
- Find the PIP for "Alex Miller"
- Status should show: "PENDING_MANAGER_REVIEW"

### Step 3: Review Employee Self-Review
- View all 3 goals with employee justifications
- Review employee attachments
- Check check-in notes

### Step 4: Manager Actions to Test
1. **Add Manager Comments** to each goal
2. **Update Goal Status** if needed (ACHIEVED, PARTIALLY_ACHIEVED, NOT_ACHIEVED)
3. **Complete Manager Review Step**
   - Add comments
   - Sign/complete the step
   - This should move PIP to `PENDING_HRBP_DECISION` status

### Step 5: Verify Status Change
- PIP status should change from `PENDING_MANAGER_REVIEW` to `PENDING_HRBP_DECISION`
- Manager Review step should show as `COMPLETED`
- HRBP Decision step should now be the current pending step

---

## API Endpoints to Test

### Get PIP Details
```bash
GET /api/pips/{pip_id}
Authorization: Bearer {manager_token}
```

### Update Manager Review Step
```bash
PUT /api/pips/{pip_id}/steps/MANAGER_REVIEW
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "status": "COMPLETED",
  "comments": "Manager review completed. Employee has shown significant improvement in all areas. Goals 2 and 3 fully achieved. Goal 1 partially achieved but showing good progress.",
  "signedBy": "{manager_user_id}"
}
```

### Update Goal with Manager Comments
```bash
PUT /api/pips/{pip_id}/goals/{goal_id}
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "status": "ACHIEVED",
  "managerComments": "Excellent work on code quality improvements. The reduction in bugs and implementation of testing framework shows strong commitment to improvement."
}
```

---

## Expected Test Results

### Before Manager Review
- ✅ PIP Status: `PENDING_MANAGER_REVIEW`
- ✅ Manager Review Step: `PENDING`
- ✅ All goals have employee justifications
- ✅ Manager comments: NULL

### After Manager Review
- ✅ PIP Status: `PENDING_HRBP_DECISION`
- ✅ Manager Review Step: `COMPLETED`
- ✅ Manager comments added to goals
- ✅ Manager Review step has comments and signed_by
- ✅ HRBP Decision step is now the current pending step

---

## SQL Queries for Verification

### Check PIP Status
```sql
SELECT 
    p.id,
    p.status,
    CONCAT(e.first_name, ' ', e.last_name) as employee,
    CONCAT(m.first_name, ' ', m.last_name) as manager
FROM pips p
JOIN users e ON p.employee_id = e.id
JOIN users m ON p.manager_id = m.id
WHERE p.status = 'PENDING_MANAGER_REVIEW';
```

### Check Step Status
```sql
SELECT 
    step,
    status,
    due_date,
    completed_date,
    comments,
    signed_by
FROM pip_steps
WHERE pip_id = '9d384ac6-dc3b-11f0-b6ca-5ffbcb09c9d7'
ORDER BY CASE step 
    WHEN 'EMPLOYEE_ACKNOWLEDGEMENT' THEN 1
    WHEN 'ACTIVE_PIP' THEN 2
    WHEN 'EMPLOYEE_SELF_REVIEW' THEN 3
    WHEN 'MANAGER_REVIEW' THEN 4
    WHEN 'HRBP_DECISION' THEN 5
END;
```

### Check Goals
```sql
SELECT 
    title,
    weightage,
    status,
    manager_comments,
    employee_attachments
FROM goals
WHERE pip_id = '9d384ac6-dc3b-11f0-b6ca-5ffbcb09c9d7'
ORDER BY weightage DESC;
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Manager** (Reviewer) | sarah.chen@pip.com | password123 |
| Employee | alex.miller@pip.com | password123 |
| HRBP | patricia.martinez@pip.com | password123 |

---

## Notes

- This PIP is fully set up with realistic data
- All previous steps are completed
- Employee has provided detailed justifications for all goals
- Check-ins show progressive improvement
- Manager can now review and provide feedback
- After manager review, PIP will move to HRBP Decision step

---

**Last Updated**: December 18, 2025

