# Complete PIP Workflow Documentation

**PIP ID:** 33e58684-15a1-4d51-be4c-9dff32dbb517  
**Start Time:** 2025-12-18T19:50:59.091Z  
**End Time:** 2025-12-18T19:51:20.859Z  
**Duration:** 22 seconds  
**Final Status:** COMPLETED  
**Final Outcome:** SUCCESSFUL

---

## Overview

This document provides a complete walkthrough of a PIP (Performance Improvement Plan) workflow from creation to final decision. All steps were executed programmatically and documented in real-time.

---

## Timeline

| Event | Timestamp |
|-------|-----------|
| PIP Created | 2025-12-19T01:21:05.54181 |
| HRBP Approved | 2025-12-19T01:21:08 |
| Employee Acknowledged | 2025-12-19T01:21:10 |
| Active Period Started | 2025-12-19T01:21:10 |
| Active Period Ended | 2025-12-19T01:21:15 |
| Self-Review Submitted | 2025-12-19T01:21:17 |
| Manager Review Completed | 2025-12-19T01:21:19 |
| Workflow Completed | 2025-12-18T19:51:20.850Z |

---

## Step-by-Step Process

### Step 1: User Authentication

**Timestamp:** 2025-12-18T19:51:05.497Z

**Details:**
```json
{
  "manager": "manager@pip.com",
  "employee": "employee@pip.com",
  "hrbp": "hrbp@pip.com"
}
```

**Result:** All users authenticated successfully

---

### Step 2: User ID Retrieval

**Timestamp:** 2025-12-18T19:51:05.517Z

**Details:**
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440003",
  "employeeEmail": "employee@pip.com",
  "hrbpId": "550e8400-e29b-41d4-a716-446655440004",
  "hrbpEmail": "hrbp@pip.com"
}
```

**Result:** User IDs retrieved successfully

---

### Step 3: PIP Creation

**Timestamp:** 2025-12-18T19:51:05.589Z

**Details:**
```json
{
  "pipId": "33e58684-15a1-4d51-be4c-9dff32dbb517",
  "employeeId": "550e8400-e29b-41d4-a716-446655440003",
  "hrbpId": "550e8400-e29b-41d4-a716-446655440004",
  "reason": "Performance improvement needed in code quality and communication skills. Employee has shown decline in code review participation and response times to team communications.",
  "goalsCount": 2,
  "goals": [
    {
      "id": "d11d9b85-bf81-4edd-a3c4-d8227c444ad1",
      "title": "Improve Code Quality",
      "weightage": 50
    },
    {
      "id": "9038f727-267b-47ca-bcb6-56785910a5ce",
      "title": "Enhance Communication",
      "weightage": 50
    }
  ],
  "timeline": {
    "employeeAcknowledgementDuration": 5,
    "pipActiveDuration": 50,
    "selfReviewBufferDuration": 3,
    "managerReviewBufferDuration": 5,
    "hrbpDecisionBufferDuration": 5
  },
  "status": "PENDING_HRBP_REVIEW"
}
```

**Result:** PIP created successfully

---

### Step 4: HRBP Approval

**Timestamp:** 2025-12-18T19:51:07.626Z

**Details:**
```json
{
  "status": "PENDING_EMPLOYEE_ACKNOWLEDGEMENT",
  "hrbpApprovedAt": "2025-12-19T01:21:07.605276",
  "employeeAckDeadline": "2025-12-26"
}
```

**Result:** PIP approved by HRBP, deadlines recalculated

---

### Step 5: Employee Acknowledgement

**Timestamp:** 2025-12-18T19:51:09.645Z

**Details:**
```json
{
  "status": "ACTIVE",
  "acknowledgedAt": "2025-12-19T01:21:09.638981",
  "activePeriodStartedAt": "2025-12-19T01:21:09.638981",
  "activePeriodEndDeadline": "2026-02-07T01:21:09.638981",
  "comments": "Employee acknowledged and committed to improvement"
}
```

**Result:** PIP acknowledged, active period started

---

### Step 6: Check-ins Added

**Timestamp:** 2025-12-18T19:51:12.699Z

**Details:**
```json
{
  "checkInsCount": 3,
  "checkIns": [
    {
      "id": "391475f7-dee5-4a90-9565-61e509050f37",
      "date": "2025-12-25",
      "notes": "Check-in #1: Employee showing good progress. Code quality improvements visible with increased partic..."
    },
    {
      "id": "1bcfc771-21e9-4e17-8449-23a452ebf6c1",
      "date": "2026-01-01",
      "notes": "Check-in #2: Employee showing good progress. Code quality improvements visible with increased partic..."
    },
    {
      "id": "3948b792-acd8-4fc5-be10-8f420bb41243",
      "date": "2026-01-08",
      "notes": "Check-in #3: Employee showing good progress. Code quality improvements visible with increased partic..."
    }
  ]
}
```

**Result:** Three check-ins added during active period

---

### Step 7: Active Period Completion

**Timestamp:** 2025-12-18T19:51:14.722Z

**Details:**
```json
{
  "status": "PENDING_EMPLOYEE_SELF_REVIEW",
  "activePeriodEndedAt": "2025-12-19T01:21:14.71195",
  "selfReviewDeadline": "2025-12-24T01:21:14.71195",
  "checkInsValidated": true
}
```

**Result:** Active period completed, self-review deadline set

---

### Step 8: Employee Self-Review

**Timestamp:** 2025-12-18T19:51:16.770Z

**Details:**
```json
{
  "status": "PENDING_MANAGER_REVIEW",
  "submittedAt": "2025-12-19T01:21:16.760462",
  "managerReviewDeadline": "2025-12-26T01:21:16.760462",
  "goalsReviewed": 2
}
```

**Result:** Employee submitted self-review for all goals

---

### Step 9: Manager Review

**Timestamp:** 2025-12-18T19:51:18.816Z

**Details:**
```json
{
  "status": "PENDING_HRBP_DECISION",
  "completedAt": "2025-12-19T01:21:18.807309",
  "hrbpDecisionDeadline": "2025-12-26T01:21:18.807309",
  "goalAssessments": [
    {
      "goalId": "9038f727-267b-47ca-bcb6-56785910a5ce",
      "status": "partially_achieved"
    },
    {
      "goalId": "d11d9b85-bf81-4edd-a3c4-d8227c444ad1",
      "status": "achieved"
    }
  ]
}
```

**Result:** Manager completed review, HRBP decision pending

---

### Step 10: HRBP Final Decision

**Timestamp:** 2025-12-18T19:51:20.850Z

**Details:**
```json
{
  "status": "COMPLETED",
  "finalOutcome": "SUCCESSFUL",
  "finalRemarks": "After thorough review of the PIP, employee self-review, manager assessment, and all check-in notes, I have determined that the employee has successfully met the PIP requirements.\n\nKey Achievements:\n- ...",
  "locked": true
}
```

**Result:** HRBP made final decision: SUCCESSFUL

---

## Final PIP Details

**Status:** COMPLETED  
**Final Outcome:** SUCCESSFUL  
**Total Goals:** 2  
**Total Check-ins:** 3

### Goals

- **Enhance Communication** (50% weightage)
  - Status: PARTIALLY_ACHIEVED
  - ID: 9038f727-267b-47ca-bcb6-56785910a5ce

- **Improve Code Quality** (50% weightage)
  - Status: ACHIEVED
  - ID: d11d9b85-bf81-4edd-a3c4-d8227c444ad1

### Workflow Steps

- **EMPLOYEE_ACKNOWLEDGEMENT**
  - Status: COMPLETED
  - Due Date: 2025-12-26
  - Completed: 2025-12-19

- **ACTIVE_PIP**
  - Status: COMPLETED
  - Due Date: 2026-02-07
  - Completed: 2025-12-19

- **EMPLOYEE_SELF_REVIEW**
  - Status: COMPLETED
  - Due Date: 2025-12-24
  - Completed: 2025-12-19

- **MANAGER_REVIEW**
  - Status: COMPLETED
  - Due Date: 2025-12-26
  - Completed: 2025-12-19

- **HRBP_DECISION**
  - Status: COMPLETED
  - Due Date: 2025-12-26
  - Completed: 2025-12-19

- **HRBP_REVIEW**
  - Status: COMPLETED
  - Due Date: 2025-12-24
  - Completed: 2025-12-19

---

## Key Learnings

1. **Deadline Calculation:** All deadlines are calculated based on actual timestamps, not pre-computed dates
2. **Check-in Validation:** System requires minimum check-ins before completing active period
3. **Status Transitions:** Each step triggers automatic status updates and deadline recalculations
4. **Workflow Integrity:** All steps are validated and locked appropriately

---

**Documentation Generated:** 2025-12-18T19:51:20.861Z
