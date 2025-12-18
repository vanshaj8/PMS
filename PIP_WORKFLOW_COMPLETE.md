# PIP Management System - Complete Workflow (Start to End)

## Overview

This document describes the complete end-to-end workflow of a Performance Improvement Plan (PIP) from creation to final decision.

---

## ⚠️ Deadline Design Issues & Proposed Fixes

This section documents critical deadline design issues identified in the current system and proposed solutions to ensure fairness, legal compliance, and operational efficiency.

### 🔴 High-Level Deadline Design Issues (Across the System)

#### ❌ Issue A: Deadlines Are Fully Manager-Defined

**Current Problem:**
- Manager sets all deadlines upfront during PIP creation
- No guardrails or policy enforcement
- No validation against company policies

**Risks:**
- Unrealistic timelines set by managers
- Bias across different managers (inconsistent deadlines)
- Legal inconsistency and potential compliance issues
- No standardization across the organization

**✅ Proposed Fix:**
**Introduce Policy-Driven Defaults**

- HR/Admin defines:
  - **Min/Max ranges** for each deadline type
  - **Default durations** by PIP type (e.g., standard PIP, extended PIP)
  - **Business rules** for deadline calculations
- Manager can adjust within bounds only
- System validates against policy before saving
- Audit trail of any deadline overrides

**Implementation:**
```yaml
Policy Configuration:
  employee_acknowledgement:
    min_days: 3
    max_days: 7
    default_days: 5
    business_days_only: true
  
  pip_active_duration:
    min_days: 30
    max_days: 90
    default_days: 50
    business_days_only: false
  
  self_review_buffer:
    min_days: 1
    max_days: 5
    default_days: 3
    business_days_only: true
```

---

#### ❌ Issue B: Absolute Dates + Duration Mixed Incorrectly

**Current Problem:**
- System uses both:
  - `pipActiveDuration` (relative duration in days)
  - Absolute ISO deadline dates (e.g., `employeeSelfReviewDeadline`)
- These are set independently, causing misalignment

**Risks:**
- **Date drift**: If employee acknowledges late, active period still uses original dates
- **Misalignment**: Active period end date doesn't align with self-review deadline
- **Hard to recompute**: Manual date entry makes recalculation difficult
- **Inconsistency**: Different PIPs have inconsistent logic

**✅ Proposed Fix:**
**Use Derived Deadlines, Not Manually Entered Ones**

**New Deadline Calculation Logic:**
```
ack_deadline = created_at + X business days (policy-defined)
active_start = acknowledged_at (actual timestamp)
active_end = active_start + pipActiveDuration (business or calendar days)
self_review_deadline = active_end + Y buffer days (policy-defined)
manager_review_deadline = self_review_deadline + Z buffer days (policy-defined)
hrbp_decision_deadline = manager_review_deadline + W buffer days (policy-defined)
```

**What to Store:**
- ✅ **Durations** (policy-driven, adjustable within bounds)
- ✅ **Business rules** (business days vs calendar days)
- ✅ **Final computed timestamps** (system-calculated, not user-entered)
- ❌ Remove manual absolute date entry for downstream deadlines

**Benefits:**
- Automatic recalculation if any step is delayed
- Consistent logic across all PIPs
- No date drift issues
- Easier to adjust policies centrally

---

#### ❌ Issue C: No Business-Day / Leave Awareness

**Current Problem:**
- All deadlines are calendar-based (including weekends/holidays)
- No awareness of:
  - Employee leave periods
  - Company holidays
  - Business days vs calendar days

**Risks:**
- Employee on leave during critical deadlines
- Deadlines falling on weekends/holidays
- Legal exposure (unfair deadlines)
- Employee claims of insufficient time

**✅ Proposed Fix:**
**Deadline Engine with Business-Day & Leave Awareness**

**Required Features:**
1. **Business Days Calculation**
   - Exclude weekends (Saturday, Sunday)
   - Exclude company holidays (configurable calendar)
   - Support country-specific holiday calendars

2. **Employee Leave Integration**
   - Auto-detect employee leave periods
   - Auto-pause deadlines during leave
   - Extend deadlines by leave duration
   - Notify manager/HRBP of leave overlaps

3. **Deadline Adjustment Rules**
   - If deadline falls on weekend/holiday → move to next business day
   - If employee on leave → extend by leave duration
   - If leave overlaps deadline → auto-extend

**Implementation:**
```yaml
Deadline Engine:
  business_days_calendar: "US" | "UK" | "IN" | "custom"
  exclude_weekends: true
  exclude_holidays: true
  leave_aware: true
  auto_adjust: true
  notification_on_adjustment: true
```

---

### 🟡 Stage-by-Stage Deadline Issues & Fixes

#### Stage 0: PIP Creation & HRBP Review

##### ❌ Issue 1: No HRBP Review Deadline Defined

**Current Problem:**
- No deadline defined for HRBP initial review
- HRBP can take unlimited time to review
- No SLA or escalation

**Risks:**
- PIP stuck indefinitely in `PENDING_HRBP_REVIEW`
- Employee claims procedural unfairness
- No accountability for HRBP delays
- Legal exposure

**✅ Proposed Fix:**
**Add HRBP Initial Review Deadline**

**New Field:**
- `timeline.hrbpInitialReviewDeadline` (system-calculated)

**Default Policy:**
- 2-3 business days from PIP creation
- Configurable by admin

**Behavior:**
- System calculates: `hrbpInitialReviewDeadline = created_at + 2 business days`
- Auto-escalation if deadline missed (notify admin)
- Overdue tracking and metrics

---

##### ❌ Issue 2: HRBP Review Delays Don't Shift Timeline

**Current Problem:**
- If HRBP takes longer to review, employee acknowledgement deadline remains fixed
- Employee gets less time because HRBP delayed

**Risks:**
- Employee gets reduced time for acknowledgement
- Timeline becomes unfair
- Legal disputes

**✅ Proposed Fix:**
**Make All Downstream Deadlines Dependent on Approval Time**

**New Logic:**
```
If HRBP approves late:
  original_ack_deadline = created_at + X days
  actual_approval_time = hrbp_approved_at
  new_ack_deadline = actual_approval_time + X days (recalculate)
  
All subsequent deadlines shift proportionally:
  active_start = acknowledged_at
  active_end = active_start + duration
  self_review = active_end + buffer
  (all recalculated from actual timestamps, not original dates)
```

**Benefits:**
- Fair timeline regardless of HRBP delay
- Employee always gets full allocated time
- Automatic recalculation
- No manual intervention needed

---

#### Stage 1: Employee Acknowledgement

##### ❌ Issue 3: What If Employee Misses Acknowledgement?

**Current Problem:**
- Deadline exists but no defined behavior if missed
- System doesn't handle late/missed acknowledgement

**Risks:**
- Legal gray area
- Workflow stuck
- No escalation path
- Employee claims they never received notification

**✅ Proposed Fix:**
**Define Explicit Behavior for Missed Acknowledgement**

**Escalation Rules:**
1. **Day 1-2 After Deadline**: 
   - Auto-reminder to employee
   - Notify manager

2. **Day 3-5 After Deadline**:
   - Escalate to HRBP
   - Record "Deemed Acknowledged" option (requires HRBP decision)
   - HRBP can:
     - Extend deadline
     - Mark as "Deemed Acknowledged"
     - Escalate to admin

3. **After Grace Period**:
   - Auto-escalate to admin
   - Require HR decision
   - Document in audit trail

**New Status Options:**
- `PENDING_EMPLOYEE_ACKNOWLEDGEMENT` (normal)
- `OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT` (past deadline)
- `DEEMED_ACKNOWLEDGED` (HRBP decision)

---

##### ❌ Issue 4: Acknowledgement Starts Active Period Even if Late

**Current Problem:**
- If employee acknowledges late, active duration still uses original dates
- Active period may have already "started" before acknowledgement

**Risks:**
- Manager-controlled manipulation
- Employee disadvantaged
- Unfair timeline

**✅ Proposed Fix:**
**Active Period Must Always Start at Acknowledgement Timestamp**

**New Logic:**
```
active_start = acknowledgement_timestamp (actual time, not scheduled)
active_end = active_start + pipActiveDuration
```

**Rules:**
- Active period **never** starts before acknowledgement
- If acknowledgement is late, active period starts late (fair to employee)
- All downstream deadlines automatically shift
- System recalculates all dates based on actual timestamps

---

#### Stage 2: Active PIP Period

##### ❌ Issue 5: No Deadline for Check-Ins

**Current Problem:**
- Check-ins are optional with no SLA
- No minimum frequency requirement
- No tracking of missed check-ins

**Risks:**
- Managers don't engage
- Employee later disputes lack of feedback
- No documentation of progress
- Weak PIP defensibility

**✅ Proposed Fix:**
**Introduce Check-In SLA and Tracking**

**New Requirements:**
1. **Expected Check-In Frequency**
   - Policy-defined: e.g., "Minimum 1 check-in every 7 business days"
   - Configurable by admin
   - Tracked automatically

2. **Missed Check-In Tracking**
   - System flags overdue check-ins
   - Notify manager if check-in overdue
   - Escalate to HRBP if pattern of missed check-ins

3. **Check-In Validation**
   - Before marking `ACTIVE_PIP` → `COMPLETED`:
     - Require minimum number of check-ins (e.g., at least 3)
     - OR require HRBP override if insufficient

**New Fields:**
- `expectedCheckInFrequency` (policy: e.g., "every 7 business days")
- `minimumCheckInsRequired` (policy: e.g., 3 minimum)
- `checkInOverdue` (computed flag)

---

##### ❌ Issue 6: Active Period Auto-Completes Without Validation

**Current Problem:**
- Active period completes just because time expired
- No validation of engagement or progress

**Risks:**
- No check-ins recorded
- No engagement documented
- Weak PIP defensibility
- Employee can claim lack of support

**✅ Proposed Fix:**
**Require Validation Before Completing Active Period**

**Validation Rules:**
1. **Minimum Check-Ins Required**
   - Policy: e.g., "At least 3 check-ins required"
   - System blocks completion if insufficient

2. **HR Override Option**
   - If insufficient check-ins, require HRBP override
   - HRBP must provide justification
   - Document in audit trail

3. **Engagement Metrics**
   - Track: number of check-ins, average frequency, last check-in date
   - Display to manager/HRBP before allowing completion

**New Status:**
- `ACTIVE` (normal)
- `ACTIVE_PENDING_VALIDATION` (duration expired but validation pending)
- `ACTIVE_COMPLETED` (validated and completed)

---

#### Stage 3: Employee Self-Review

##### ❌ Issue 7: Self-Review Deadline Is Static

**Current Problem:**
- Employee self-review deadline is fixed even if manager delays earlier steps
- No recalculation based on actual active period end

**Risks:**
- Employee loses time if active period extended
- Appeals and complaints
- Unfair deadlines

**✅ Proposed Fix:**
**Self-Review Deadline Should Be Derived from Active Period End**

**New Logic:**
```
active_end = active_start + pipActiveDuration (actual)
self_review_deadline = active_end + buffer_days (policy-defined, e.g., 3 business days)
```

**Rules:**
- Never use pre-entered absolute date
- Always calculate from actual `active_end` timestamp
- If active period extended, self-review deadline automatically extends
- Buffer days configurable by policy

---

##### ❌ Issue 8: No Grace Period Defined

**Current Problem:**
- What happens if employee submits 1 day late?
- System is overly rigid
- No defined grace period

**Risks:**
- Overly rigid enforcement
- Legal disputes
- Employee claims technical issues

**✅ Proposed Fix:**
**Define Grace Period and Late Submission Handling**

**Grace Period Policy:**
- Default: 2 business days after deadline
- Configurable by admin
- Late submissions tagged but not auto-failed

**Behavior:**
1. **On Time**: Normal processing
2. **Within Grace Period (1-2 days late)**:
   - Accept submission
   - Tag as "Late Submission"
   - Notify manager
   - Continue workflow
3. **After Grace Period**:
   - Still accept submission
   - Tag as "Significantly Late"
   - Require manager/HRBP review
   - Document in audit trail
   - May require justification

**New Fields:**
- `submissionDeadline` (calculated)
- `gracePeriodEnd` (calculated: deadline + grace days)
- `submittedAt` (actual timestamp)
- `isLate` (computed: submittedAt > deadline)
- `lateByDays` (computed)

---

#### Stage 4: Manager Review

##### ❌ Issue 9: No Enforcement for Manager Delay

**Current Problem:**
- Manager deadline exists but no consequence if missed
- No escalation or SLA enforcement

**Risks:**
- Manager delays = employee stuck in limbo
- No accountability
- Employee stress and complaints

**✅ Proposed Fix:**
**Add Auto-Escalation and Manager SLA Metrics**

**Escalation Rules:**
1. **Day 1-2 After Deadline**:
   - Auto-reminder to manager
   - Notify employee of delay

2. **Day 3-5 After Deadline**:
   - Escalate to HRBP
   - HRBP can:
     - Extend deadline
     - Take over review (if authorized)
     - Escalate to admin

3. **After Extended Deadline**:
   - Auto-escalate to admin
   - Lock manager step
   - Allow HRBP to complete review
   - Track in manager SLA metrics

**New Features:**
- Manager SLA tracking (average review time, overdue count)
- Auto-escalation workflow
- HRBP override capability
- Admin dashboard for overdue reviews

---

##### ❌ Issue 10: Manager Can Delay Final Outcome Indefinitely

**Current Problem:**
- If manager delays review, HRBP decision also delayed
- No mechanism to bypass manager delay

**Risks:**
- Legal exposure
- Employee stress
- PIPs stuck for months

**✅ Proposed Fix:**
**HRBP Should Be Able to Take Over Review**

**New Capabilities:**
1. **HRBP Override After X Days Overdue**
   - Policy: e.g., "After 7 days overdue, HRBP can take over"
   - HRBP can complete manager review step
   - Document override in audit trail

2. **Lock Manager Step**
   - After extended deadline, lock manager step
   - Prevent further manager edits
   - Allow HRBP to proceed

3. **Interim Decision Option**
   - HRBP can make decision based on available information
   - Document that manager review was incomplete
   - Continue workflow

**New Status:**
- `PENDING_MANAGER_REVIEW` (normal)
- `OVERDUE_MANAGER_REVIEW` (past deadline)
- `HRBP_OVERRIDE` (HRBP took over)

---

#### Stage 5: HRBP Final Decision

##### ❌ Issue 11: HRBP Deadline Exists But No Enforcement

**Current Problem:**
- Deadline exists but no auto-action if missed
- Same pattern as other stages

**Risks:**
- Open PIPs for months
- Audit red flags
- Employee stuck in limbo

**✅ Proposed Fix:**
**Define Auto-Escalation to Admin**

**Escalation Rules:**
1. **Day 1-3 After Deadline**:
   - Auto-reminder to HRBP
   - Notify admin

2. **Day 4-7 After Deadline**:
   - Escalate to admin
   - Admin can:
     - Extend deadline
     - Force interim decision
     - Assign alternate HRBP

3. **After Extended Deadline**:
   - Auto-close with "PENDING_DECISION" status
   - Require admin intervention
   - Document in audit trail

**New Status:**
- `PENDING_HRBP_DECISION` (normal)
- `OVERDUE_HRBP_DECISION` (past deadline)
- `ADMIN_INTERVENTION_REQUIRED` (escalated)

---

##### ❌ Issue 12: EXTENDED Outcome Has No Deadline Rules

**Current Problem:**
- When HRBP selects `EXTENDED`, no rules on:
  - Max number of extensions
  - New timeline logic
  - Approval requirements

**Risks:**
- Infinite PIPs
- Abuse potential
- No policy enforcement

**✅ Proposed Fix:**
**Extension Policy with Limits**

**Extension Policy:**
1. **Max Extensions**
   - Policy: e.g., "Maximum 1 extension allowed"
   - System enforces limit
   - Requires admin override for additional extensions

2. **Max Total Duration**
   - Policy: e.g., "Maximum 120 days total PIP duration"
   - System calculates: original duration + extension duration
   - Blocks extension if would exceed limit

3. **New Approval Cycle**
   - Extension requires:
     - New timeline definition
     - Manager approval
     - HRBP approval (or admin if already HRBP)
   - Creates new workflow cycle

4. **Extension Documentation**
   - Require justification for extension
   - Document reason
   - Update all deadlines based on new timeline

**New Fields:**
- `extensionCount` (track number of extensions)
- `maxExtensionsAllowed` (policy)
- `maxTotalDuration` (policy)
- `extensionJustification` (required text)
- `extensionApprovedBy` (audit trail)

---

### 📊 Summary of Proposed Deadline System Improvements

| Issue | Current State | Proposed Fix | Priority |
|-------|---------------|--------------|----------|
| Manager-defined deadlines | No guardrails | Policy-driven defaults with min/max | 🔴 High |
| Mixed absolute/relative dates | Date drift | Derived deadlines only | 🔴 High |
| No business-day awareness | Calendar-based | Business-day engine + leave awareness | 🔴 High |
| No HRBP review deadline | Unlimited time | 2-3 business days SLA | 🟡 Medium |
| HRBP delay doesn't shift timeline | Fixed dates | Recalculate from approval time | 🔴 High |
| Missed acknowledgement handling | No process | Escalation + deemed acknowledged | 🟡 Medium |
| Late acknowledgement timing | Uses original dates | Start from actual timestamp | 🔴 High |
| No check-in SLA | Optional | Minimum frequency + tracking | 🟡 Medium |
| Active period auto-completes | No validation | Require minimum check-ins | 🟡 Medium |
| Static self-review deadline | Fixed date | Derived from active_end | 🔴 High |
| No grace period | Rigid | 2 business days grace | 🟡 Medium |
| No manager delay enforcement | No escalation | Auto-escalate to HRBP | 🟡 Medium |
| Manager can delay indefinitely | No override | HRBP can take over | 🔴 High |
| No HRBP deadline enforcement | No escalation | Auto-escalate to admin | 🟡 Medium |
| EXTENDED has no rules | Unlimited | Max extensions + duration limits | 🟡 Medium |

---

**Priority Legend:**
- 🔴 **High**: Critical for legal compliance and fairness
- 🟡 **Medium**: Important for operational efficiency and user experience

---

**Implementation Recommendation:**
1. **Phase 1** (Critical): Issues marked 🔴 High
2. **Phase 2** (Important): Issues marked 🟡 Medium
3. **Phase 3** (Enhancement): Additional policy configurations and reporting

---

## Complete PIP Workflow (6 Stages)

---

## Complete PIP Workflow (6 Stages)

### Stage 0: PIP Creation & Initial HRBP Review

**Status**: `PENDING_HRBP_REVIEW` → `PENDING_EMPLOYEE_ACKNOWLEDGEMENT`

**Who**: Manager creates, HRBP reviews

**Actions**:
1. **Manager Creates PIP**
   - Selects employee
   - Selects HRBP
   - Enters reason for PIP
   - Adds supporting documents
   - Defines goals (with weightages totaling 100%)
   - Sets timeline deadlines
   - Submits PIP

2. **HRBP Reviews PIP**
   - Reviews PIP details
   - Reviews goals and timeline
   - Can approve or request changes
   - If approved: PIP moves to employee for acknowledgement

**Result**: PIP status changes to `PENDING_EMPLOYEE_ACKNOWLEDGEMENT`

---

#### 📝 **User Input Fields - Stage 0: PIP Creation (Manager)**

**1. Basic PIP Information**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `employeeId` | String (UUID) | ✅ **Required** | The unique identifier of the employee for whom the PIP is being created. Selected from dropdown list of employees. |
| `hrbpId` | String (UUID) | ✅ **Required** | The unique identifier of the HRBP who will review and make final decision. Selected from dropdown list of HRBPs. |
| `reason` | String (TEXT) | ✅ **Required** | Detailed explanation of why the PIP is being created. Should include performance issues, behavioral concerns, or areas requiring improvement. Can be multiple paragraphs. |
| `supportingDocuments` | String (JSON Array) | ⚠️ **Optional** | JSON array of document URLs or file paths. Can include performance reviews, incident reports, emails, or any supporting evidence. Format: `["url1", "url2", ...]` |

**2. Goals Information** (Repeat for each goal - minimum 1 goal required)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `goals[].title` | String | ✅ **Required** | Short, descriptive title for the goal (e.g., "Improve Code Quality", "Enhance Communication Skills"). |
| `goals[].description` | String (TEXT) | ✅ **Required** | Detailed description of what needs to be achieved. Should be specific, measurable, and clear. |
| `goals[].weightage` | Double (0-100) | ✅ **Required** | Percentage weight of this goal. **Total of all goals must equal 100%**. Example: If 3 goals, could be 40%, 35%, 25%. |
| `goals[].expectedOutcome` | String (TEXT) | ⚠️ **Optional** | What success looks like for this goal. Describes the expected result when goal is achieved. |
| `goals[].targetTimeline` | String | ⚠️ **Optional** | Target timeline for achieving this specific goal (e.g., "Within 30 days", "By end of Q2"). |
| `goals[].deadline` | String (ISO DateTime) | ⚠️ **Optional** | Specific deadline date and time for this goal in ISO format: `YYYY-MM-DDTHH:mm:ss` (e.g., "2025-02-15T23:59:59"). |

**⚠️ Validation Rule**: Sum of all `weightage` values must be exactly **100%**. System will reject if total exceeds 100%.

**3. Timeline Information**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `timeline.employeeAcknowledgementDeadline` | String (ISO DateTime) | ✅ **Required** | Deadline for employee to acknowledge the PIP. Format: `YYYY-MM-DDTHH:mm:ss` (e.g., "2025-01-10T23:59:59"). Typically 3-7 days from creation. |
| `timeline.pipActiveDuration` | Integer (days) | ✅ **Required** | Number of days for the active PIP improvement period. Common values: 30, 45, 50, 60, 90 days. This is the period when employee works on goals. |
| `timeline.employeeSelfReviewDeadline` | String (ISO DateTime) | ✅ **Required** | Deadline for employee to submit self-review. Format: `YYYY-MM-DDTHH:mm:ss`. Usually set at end of active period or shortly after. |
| `timeline.managerFinalReviewDeadline` | String (ISO DateTime) | ✅ **Required** | Deadline for manager to complete review after employee self-review. Format: `YYYY-MM-DDTHH:mm:ss`. Typically 3-5 days after self-review deadline. |
| `timeline.hrbpFinalDecisionDeadline` | String (ISO DateTime) | ✅ **Required** | Deadline for HRBP to make final decision. Format: `YYYY-MM-DDTHH:mm:ss`. Typically 3-5 days after manager review deadline. |

**Example Timeline**:
- PIP Created: 2025-01-01
- Employee Acknowledgement Deadline: 2025-01-05 (4 days)
- PIP Active Duration: 50 days
- Employee Self-Review Deadline: 2025-02-25 (after 50 days)
- Manager Review Deadline: 2025-03-01 (5 days after self-review)
- HRBP Decision Deadline: 2025-03-06 (5 days after manager review)

**4. HRBP Review Action** (No user input - HRBP reviews and approves)

HRBP reviews all the above information and can:
- **Approve**: PIP moves to employee for acknowledgement
- **Request Changes**: PIP remains in `PENDING_HRBP_REVIEW` status until manager updates

---

### Stage 1: Employee Acknowledgement

**Step Name**: `EMPLOYEE_ACKNOWLEDGEMENT`  
**Status**: `PENDING_EMPLOYEE_ACKNOWLEDGEMENT` → `ACTIVE`  
**Who**: Employee  
**Due Date**: Set by manager during PIP creation

**Actions**:
1. Employee receives notification about new PIP
2. Employee opens PIP and reviews:
   - All goals and requirements
   - Timeline and deadlines
   - Supporting documents
3. Employee acknowledges:
   - Clicks "Acknowledge" button
   - Optionally adds comments
   - Signs/confirms acknowledgement

**Result**: 
- PIP status changes to `ACTIVE`
- Active improvement period begins
- Step status: `COMPLETED`

---

#### 📝 **User Input Fields - Stage 1: Employee Acknowledgement**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `comments` | String (TEXT) | ⚠️ **Optional** | Employee can add any comments, questions, or concerns while acknowledging the PIP. This is recorded but doesn't prevent acknowledgement. Can be left empty. |

**Note**: The `signedBy` field is automatically set to the employee's user ID when they acknowledge. Employee must click the "Acknowledge" button to proceed. Once acknowledged, the PIP status changes to `ACTIVE` and the improvement period begins.

---

### Stage 2: Active PIP Period

**Step Name**: `ACTIVE_PIP`  
**Status**: `ACTIVE`  
**Who**: Employee, Manager, HRBP  
**Duration**: Set by manager (e.g., 50 days)

**Actions During This Period**:

1. **Employee Works on Goals**
   - Works toward achieving PIP goals
   - Implements improvement plans
   - Documents progress

2. **Regular Check-Ins**
   - Manager and employee conduct check-in meetings
   - Add check-in notes in the system
   - Document progress, challenges, and support needed
   - Upload supporting documents/evidence

3. **Progress Tracking**
   - System tracks active period duration
   - Deadlines are monitored
   - Notifications sent for approaching deadlines

**Result**: 
- Active period completes when duration expires
- Step status: `COMPLETED`
- PIP remains `ACTIVE` until self-review deadline

---

#### 📝 **User Input Fields - Stage 2: Check-In (Can be added multiple times)**

Check-ins can be added by Manager, Employee, or HRBP during the active PIP period. Multiple check-ins can be created to track progress.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `date` | String (ISO DateTime) | ✅ **Required** | Date and time of the check-in meeting. Format: `YYYY-MM-DDTHH:mm:ss` (e.g., "2025-01-15T14:30:00"). This is when the check-in discussion occurred. |
| `notes` | String (TEXT) | ✅ **Required** | Detailed notes from the check-in meeting. Should include: progress made on goals, challenges faced, support needed, action items, and any other relevant discussion points. Can be multiple paragraphs. |
| `attachments` | String (JSON Array) | ⚠️ **Optional** | JSON array of document URLs or file paths related to this check-in. Can include: progress reports, work samples, meeting notes, screenshots, or any evidence of progress. Format: `["url1", "url2", ...]` |

**Check-In Best Practices**:
- Add check-ins regularly (e.g., weekly or bi-weekly)
- Document both positive progress and areas needing improvement
- Include specific examples and evidence
- Note any support or resources provided
- Record action items and follow-ups

---

### Stage 3: Employee Self-Review

**Step Name**: `EMPLOYEE_SELF_REVIEW`  
**Status**: `PENDING_EMPLOYEE_SELF_REVIEW` → `PENDING_MANAGER_REVIEW`  
**Who**: Employee  
**Due Date**: Set by manager during PIP creation

**Actions**:
1. Employee receives notification about self-review deadline
2. Employee opens PIP and reviews each goal
3. For each goal, employee provides:
   - **Justification**: Explanation of progress made
   - **Evidence**: Supporting documents/attachments
   - **Status Assessment**: Self-evaluation of achievement
4. Employee submits self-review

**Result**: 
- PIP status changes to `PENDING_MANAGER_REVIEW`
- Step status: `COMPLETED`
- Manager receives notification

---

#### 📝 **User Input Fields - Stage 3: Employee Self-Review**

Employee must provide input for **each goal** in the PIP. The system expects an array of goal objects with the following structure:

**For Each Goal** (Array: `goals[]`):

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `goals[].id` | String (UUID) | ✅ **Required** | The unique identifier of the goal being reviewed. This is automatically provided by the system for each goal in the PIP. |
| `goals[].justification` | String (TEXT) | ✅ **Required** | Detailed explanation of the employee's progress on this specific goal. Should include: what was accomplished, how it was achieved, specific examples, metrics or evidence, challenges faced, and how they were addressed. This is the employee's opportunity to demonstrate their improvement. |
| `goals[].attachments` | String (JSON Array) | ⚠️ **Optional** | JSON array of document URLs or file paths providing evidence of progress. Can include: completed work samples, performance metrics, certificates, emails, screenshots, reports, or any documentation proving achievement. Format: `["url1", "url2", ...]` |

**Example Self-Review Structure**:
```json
{
  "goals": [
    {
      "id": "goal-uuid-1",
      "justification": "I have successfully improved my code quality by implementing code reviews, using linting tools, and reducing bugs by 40%. I completed the online course on best practices and applied the learnings to all new code.",
      "attachments": ["https://example.com/certificate.pdf", "https://example.com/code-samples.zip"]
    },
    {
      "id": "goal-uuid-2",
      "justification": "I have enhanced my communication by sending daily status updates, participating in team meetings, and responding to emails within 2 hours. I also completed a communication workshop.",
      "attachments": ["https://example.com/workshop-cert.pdf"]
    }
  ]
}
```

**Important Notes**:
- Employee must provide justification for **all goals** in the PIP
- Justification should be comprehensive and specific
- Attachments are optional but recommended to support claims
- Once submitted, the self-review cannot be edited
- System automatically sets `signedBy` to employee's user ID

---

### Stage 4: Manager Review

**Step Name**: `MANAGER_REVIEW`  
**Status**: `PENDING_MANAGER_REVIEW` → `PENDING_HRBP_DECISION`  
**Who**: Manager  
**Due Date**: Set by manager during PIP creation

**Actions**:
1. Manager receives notification about pending review
2. Manager opens PIP and reviews:
   - Employee's self-review for each goal
   - Employee's justifications and evidence
   - Check-in notes from active period
   - Overall progress
3. Manager assesses each goal:
   - **ACHIEVED**: Goal fully met
   - **PARTIALLY_ACHIEVED**: Some progress but not complete
   - **NOT_ACHIEVED**: Goal not met
   - Adds manager comments for each goal
4. Manager provides overall assessment:
   - Reviews all goals
   - Adds general comments
   - Completes manager review step

**Result**: 
- PIP status changes to `PENDING_HRBP_DECISION`
- Step status: `COMPLETED`
- HRBP receives notification

---

#### 📝 **User Input Fields - Stage 4: Manager Review**

Manager must provide assessment for **each goal** in the PIP. The system expects an array of goal objects with assessment details, plus optional overall comments.

**For Each Goal** (Array: `goals[]`):

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `goals[].id` | String (UUID) | ✅ **Required** | The unique identifier of the goal being assessed. This is automatically provided by the system for each goal in the PIP. |
| `goals[].status` | Enum String | ✅ **Required** | Manager's assessment of goal achievement. Must be one of: **`ACHIEVED`** (goal fully met), **`PARTIALLY_ACHIEVED`** (some progress but not complete), **`NOT_ACHIEVED`** (goal not met). This is a critical field that determines the goal's outcome. |
| `goals[].managerComments` | String (TEXT) | ✅ **Required** | Manager's detailed comments on the employee's performance for this specific goal. Should include: evaluation of employee's justification, assessment of evidence provided, specific examples of achievement or lack thereof, comparison to expected outcomes, and any relevant observations from check-ins. This should be objective and constructive. |

**Overall Comments** (Optional):

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `comments` | String (TEXT) | ⚠️ **Optional** | Manager's overall assessment comments for the entire PIP. Can include: summary of overall performance, general observations, recommendations, or any additional context that applies to the PIP as a whole rather than individual goals. |

**Goal Status Values**:
- **`ACHIEVED`**: Employee has fully met the goal requirements. All expected outcomes have been demonstrated with evidence.
- **`PARTIALLY_ACHIEVED`**: Employee has made significant progress but has not fully met all goal requirements. Some aspects are achieved, others need more work.
- **`NOT_ACHIEVED`**: Employee has not met the goal requirements. Insufficient progress or evidence to demonstrate achievement.

**Example Manager Review Structure**:
```json
{
  "goals": [
    {
      "id": "goal-uuid-1",
      "status": "ACHIEVED",
      "managerComments": "Employee has demonstrated significant improvement in code quality. The code samples show proper structure, reduced complexity, and implementation of best practices. Bug reduction metrics align with the goal. Well done."
    },
    {
      "id": "goal-uuid-2",
      "status": "PARTIALLY_ACHIEVED",
      "managerComments": "Communication has improved with daily updates, but response times to emails still need work. Team meeting participation is good. More consistency needed in email responsiveness."
    }
  ],
  "comments": "Overall, the employee has shown commitment to improvement. The first goal was fully achieved, while the second needs continued focus. I recommend continued monitoring."
}
```

**Important Notes**:
- Manager must assess **all goals** in the PIP
- Status must be one of the three enum values (case-insensitive)
- Manager comments are required for each goal
- Overall comments are optional but recommended
- System automatically sets `signedBy` to manager's user ID

---

### Stage 5: HRBP Final Decision

**Step Name**: `HRBP_DECISION`  
**Status**: `PENDING_HRBP_DECISION` → `COMPLETED`  
**Who**: HRBP  
**Due Date**: Set by manager during PIP creation

**Actions**:
1. HRBP receives notification about pending decision
2. HRBP opens PIP and reviews:
   - Original PIP goals and requirements
   - Employee's self-review
   - Manager's assessment and comments
   - All check-in notes and evidence
   - Complete PIP history
3. HRBP makes final decision:
   - **SUCCESSFUL**: Employee has met requirements
   - **UNSUCCESSFUL**: Employee has not met requirements
   - **EXTENDED**: PIP period needs extension
   - **CLOSED_WITHOUT_ACTION**: PIP closed for other reasons
4. HRBP adds final remarks:
   - Explains decision rationale
   - Provides context
   - Notes any follow-up actions
5. HRBP submits final decision

**Result**: 
- PIP status changes to `COMPLETED`
- PIP is locked (no further changes allowed)
- Step status: `COMPLETED`
- All parties receive notification of final outcome

---

#### 📝 **User Input Fields - Stage 5: HRBP Final Decision**

HRBP must provide the final outcome and remarks. This is the final step that locks the PIP.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `outcome` | Enum String | ✅ **Required** | The final decision on the PIP. Must be one of: **`SUCCESSFUL`** (employee has met requirements and PIP goals), **`UNSUCCESSFUL`** (employee has not met requirements), **`EXTENDED`** (PIP period needs to be extended for further improvement), **`CLOSED_WITHOUT_ACTION`** (PIP closed for other reasons such as resignation, role change, etc.). This is case-insensitive. |
| `remarks` | String (TEXT) | ✅ **Required** | HRBP's final remarks explaining the decision. Should include: rationale for the outcome, summary of key factors considered, reference to manager's assessment and employee's self-review, any relevant context, follow-up actions required (if any), and any recommendations for the employee's future development. This is a critical document that will be part of the employee's record. |

**Final Outcome Values**:
- **`SUCCESSFUL`**: Employee has successfully met the PIP requirements. Goals have been achieved as assessed by the manager. Employee can continue in their role. This is a positive outcome.
- **`UNSUCCESSFUL`**: Employee has not met the PIP requirements. Despite the improvement period, goals were not achieved. This may lead to further action per company policy.
- **`EXTENDED`**: The PIP period needs to be extended. Employee has shown progress but needs more time to fully meet requirements. A new timeline will be set.
- **`CLOSED_WITHOUT_ACTION`**: PIP is closed without a traditional outcome. Reasons may include: employee resignation, role change, organizational restructuring, or other circumstances that make the PIP no longer applicable.

**Example HRBP Final Decision Structure**:
```json
{
  "outcome": "SUCCESSFUL",
  "remarks": "After thorough review of the PIP, employee self-review, manager assessment, and all check-in notes, I have determined that the employee has successfully met the PIP requirements. The employee demonstrated significant improvement in code quality (Goal 1 - ACHIEVED) and made good progress in communication (Goal 2 - PARTIALLY_ACHIEVED). The manager's assessment was fair and objective. The employee showed commitment throughout the process. I recommend continued monitoring and support. No further action required at this time."
}
```

**Important Notes**:
- This is the **final step** - once submitted, the PIP is **locked** and cannot be modified
- Outcome must be one of the four enum values (case-insensitive)
- Remarks are required and should be comprehensive
- System automatically sets `signedBy` to HRBP's user ID
- All parties (Employee, Manager, HRBP) receive notification of the final outcome
- The PIP status changes to `COMPLETED` and `locked` is set to `true`

---

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PIP WORKFLOW                             │
└─────────────────────────────────────────────────────────────┘

[0] PIP CREATION
    Manager creates PIP
    ↓
    Status: PENDING_HRBP_REVIEW
    ↓
    HRBP reviews and approves
    ↓
    Status: PENDING_EMPLOYEE_ACKNOWLEDGEMENT
    ↓
[1] EMPLOYEE ACKNOWLEDGEMENT
    Employee acknowledges PIP
    ↓
    Status: ACTIVE
    ↓
[2] ACTIVE PIP PERIOD
    Employee works on goals
    Regular check-ins
    Duration: X days
    ↓
    Status: ACTIVE (continues)
    ↓
[3] EMPLOYEE SELF-REVIEW
    Employee submits self-review
    ↓
    Status: PENDING_MANAGER_REVIEW
    ↓
[4] MANAGER REVIEW
    Manager reviews and assesses
    ↓
    Status: PENDING_HRBP_DECISION
    ↓
[5] HRBP FINAL DECISION
    HRBP makes final decision
    ↓
    Status: COMPLETED
    ↓
    PIP LOCKED
```

---

## Detailed Step-by-Step Flow

### Phase 1: Initiation (Manager + HRBP)

1. **Manager Creates PIP**
   - Navigates to "Create PIP"
   - Selects employee from dropdown
   - Selects HRBP from dropdown
   - Enters reason for PIP
   - Uploads supporting documents
   - Adds goals:
     - Title, Description, Weightage
     - Expected Outcome, Target Timeline, Deadline
   - Sets timeline:
     - Employee Acknowledgement Deadline
     - PIP Active Duration (days)
     - Employee Self-Review Deadline
     - Manager Final Review Deadline
     - HRBP Final Decision Deadline
   - Submits PIP

2. **System Creates PIP**
   - PIP created with status: `PENDING_HRBP_REVIEW`
   - 5 workflow steps initialized (all PENDING)
   - HRBP receives notification

3. **HRBP Reviews**
   - Opens PIP
   - Reviews all information
   - Approves or requests changes
   - If approved: Status → `PENDING_EMPLOYEE_ACKNOWLEDGEMENT`

---

### Phase 2: Acknowledgement (Employee)

4. **Employee Receives Notification**
   - Notification: "New PIP created for you"
   - Employee opens PIP

5. **Employee Reviews PIP**
   - Reads all goals
   - Reviews timeline
   - Checks supporting documents
   - Understands requirements

6. **Employee Acknowledges**
   - Clicks "Acknowledge" button
   - Optionally adds comments
   - Confirms acknowledgement
   - Status → `ACTIVE`
   - Step 1: `EMPLOYEE_ACKNOWLEDGEMENT` → `COMPLETED`

---

### Phase 3: Active Improvement Period (All Parties)

7. **Active Period Begins**
   - Status: `ACTIVE`
   - Step 2: `ACTIVE_PIP` status: `PENDING`
   - Employee starts working on goals

8. **Regular Check-Ins**
   - Manager and employee meet regularly
   - Add check-in notes:
     - Date of check-in
     - Notes about progress
     - Upload attachments/evidence
   - Multiple check-ins can be added

9. **Active Period Ends**
   - When active duration expires
   - Step 2: `ACTIVE_PIP` → `COMPLETED`
   - Status remains `ACTIVE` until self-review

---

### Phase 4: Self-Review (Employee)

10. **Self-Review Deadline Approaches**
    - Employee receives notification
    - Status: `PENDING_EMPLOYEE_SELF_REVIEW`
    - Step 3: `EMPLOYEE_SELF_REVIEW` status: `PENDING`

11. **Employee Submits Self-Review**
    - For each goal:
      - Provides justification
      - Uploads evidence/attachments
      - Self-assesses achievement level
    - Reviews all responses
    - Submits self-review
    - Status → `PENDING_MANAGER_REVIEW`
    - Step 3: `EMPLOYEE_SELF_REVIEW` → `COMPLETED`

---

### Phase 5: Manager Review (Manager)

12. **Manager Receives Notification**
    - Notification: "Employee self-review submitted"
    - Manager opens PIP

13. **Manager Reviews Employee's Self-Review**
    - Reads employee's justifications
    - Reviews evidence/attachments
    - Considers check-in notes
    - Evaluates progress objectively

14. **Manager Assesses Each Goal**
    - For each goal:
      - Selects status: ACHIEVED / PARTIALLY_ACHIEVED / NOT_ACHIEVED
      - Adds manager comments
    - Provides overall assessment
    - Completes manager review
    - Status → `PENDING_HRBP_DECISION`
    - Step 4: `MANAGER_REVIEW` → `COMPLETED`

---

### Phase 6: Final Decision (HRBP)

15. **HRBP Receives Notification**
    - Notification: "Manager review completed"
    - HRBP opens PIP

16. **HRBP Reviews Everything**
    - Original PIP goals
    - Employee's self-review
    - Manager's assessment
    - All check-in notes
    - Complete history

17. **HRBP Makes Final Decision**
    - Selects final outcome:
      - **SUCCESSFUL**: Requirements met
      - **UNSUCCESSFUL**: Requirements not met
      - **EXTENDED**: Needs extension
      - **CLOSED_WITHOUT_ACTION**: Closed for other reasons
    - Adds final remarks
    - Submits decision
    - Status → `COMPLETED`
    - Step 5: `HRBP_DECISION` → `COMPLETED`
    - PIP is locked

18. **All Parties Notified**
    - Employee, Manager, HRBP receive notification
    - Final outcome is recorded
    - PIP cannot be modified

---

## Status Transitions

```
DRAFT
  ↓
PENDING_HRBP_REVIEW (Manager creates)
  ↓
PENDING_EMPLOYEE_ACKNOWLEDGEMENT (HRBP approves)
  ↓
ACTIVE (Employee acknowledges)
  ↓
PENDING_EMPLOYEE_SELF_REVIEW (Active period ends)
  ↓
PENDING_MANAGER_REVIEW (Employee submits self-review)
  ↓
PENDING_HRBP_DECISION (Manager completes review)
  ↓
COMPLETED (HRBP makes final decision)
  ↓
LOCKED (No further changes)
```

---

## Step Status Values

Each step can have these statuses:
- **PENDING**: Not yet started
- **DUE_SOON**: Deadline approaching
- **OVERDUE**: Deadline has passed
- **COMPLETED**: Step is finished

---

## Timeline Example

**PIP Created**: Day 0  
**Employee Acknowledgement Deadline**: Day 5  
**PIP Active Duration**: 50 days  
**Employee Self-Review Deadline**: Day 55  
**Manager Review Deadline**: Day 60  
**HRBP Decision Deadline**: Day 65  

**Timeline**:
- Day 0-5: HRBP review and employee acknowledgement
- Day 5-55: Active PIP period (50 days)
- Day 55: Employee self-review due
- Day 60: Manager review due
- Day 65: HRBP final decision due
- Day 65+: PIP completed and locked

---

## Roles and Responsibilities

### Manager
- Creates PIP
- Sets goals and timeline
- Conducts check-ins during active period
- Reviews employee self-review
- Provides assessment

### Employee
- Acknowledges PIP
- Works on goals during active period
- Participates in check-ins
- Submits self-review
- Receives final outcome

### HRBP
- Reviews and approves initial PIP
- Makes final decision
- Can override timeline (if admin)

### Admin
- Can override timelines
- Can view all PIPs
- Manages users
- Views audit logs

---

## Key Features

✅ **Sequential Workflow**: Each step must be completed before next begins  
✅ **Deadline Tracking**: System tracks all deadlines  
✅ **Notifications**: All parties notified at each stage  
✅ **Audit Trail**: All actions are logged  
✅ **Documentation**: All documents and evidence stored  
✅ **Locking**: Completed PIPs cannot be modified  
✅ **Check-Ins**: Progress tracked during active period  

---

## Summary

**Total Stages**: 6 (including initial HRBP review)  
**Workflow Steps**: 5 (after HRBP approval)  
**Key Milestones**: 
1. PIP Creation
2. Employee Acknowledgement
3. Active Period Completion
4. Self-Review Submission
5. Manager Review Completion
6. Final Decision

**Average Duration**: 60-90 days (depending on timeline settings)

---

## 📋 Quick Reference: All User Input Fields by Stage

### Stage 0: PIP Creation (Manager)

| Field | Type | Required | Stage |
|-------|------|----------|-------|
| `employeeId` | UUID | ✅ | 0 |
| `hrbpId` | UUID | ✅ | 0 |
| `reason` | TEXT | ✅ | 0 |
| `supportingDocuments` | JSON Array | ⚠️ | 0 |
| `goals[].title` | String | ✅ | 0 |
| `goals[].description` | TEXT | ✅ | 0 |
| `goals[].weightage` | Double (0-100) | ✅ | 0 |
| `goals[].expectedOutcome` | TEXT | ⚠️ | 0 |
| `goals[].targetTimeline` | String | ⚠️ | 0 |
| `goals[].deadline` | ISO DateTime | ⚠️ | 0 |
| `timeline.employeeAcknowledgementDeadline` | ISO DateTime | ✅ | 0 |
| `timeline.pipActiveDuration` | Integer (days) | ✅ | 0 |
| `timeline.employeeSelfReviewDeadline` | ISO DateTime | ✅ | 0 |
| `timeline.managerFinalReviewDeadline` | ISO DateTime | ✅ | 0 |
| `timeline.hrbpFinalDecisionDeadline` | ISO DateTime | ✅ | 0 |

### Stage 1: Employee Acknowledgement

| Field | Type | Required | Stage |
|-------|------|----------|-------|
| `comments` | TEXT | ⚠️ | 1 |

### Stage 2: Check-In (Multiple times during Active Period)

| Field | Type | Required | Stage |
|-------|------|----------|-------|
| `date` | ISO DateTime | ✅ | 2 |
| `notes` | TEXT | ✅ | 2 |
| `attachments` | JSON Array | ⚠️ | 2 |

### Stage 3: Employee Self-Review

| Field | Type | Required | Stage |
|-------|------|----------|-------|
| `goals[].id` | UUID | ✅ | 3 |
| `goals[].justification` | TEXT | ✅ | 3 |
| `goals[].attachments` | JSON Array | ⚠️ | 3 |

### Stage 4: Manager Review

| Field | Type | Required | Stage |
|-------|------|----------|-------|
| `goals[].id` | UUID | ✅ | 4 |
| `goals[].status` | Enum (ACHIEVED/PARTIALLY_ACHIEVED/NOT_ACHIEVED) | ✅ | 4 |
| `goals[].managerComments` | TEXT | ✅ | 4 |
| `comments` | TEXT | ⚠️ | 4 |

### Stage 5: HRBP Final Decision

| Field | Type | Required | Stage |
|-------|------|----------|-------|
| `outcome` | Enum (SUCCESSFUL/UNSUCCESSFUL/EXTENDED/CLOSED_WITHOUT_ACTION) | ✅ | 5 |
| `remarks` | TEXT | ✅ | 5 |

---

## 🔑 Field Type Definitions

### Data Types

- **UUID**: Universally Unique Identifier (36-character string, e.g., "550e8400-e29b-41d4-a716-446655440000")
- **TEXT**: Multi-line text field, can contain paragraphs
- **String**: Single-line text field
- **Integer**: Whole number (e.g., 30, 50, 90)
- **Double**: Decimal number (e.g., 25.5, 40.0)
- **ISO DateTime**: Date and time in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss` (e.g., "2025-01-15T14:30:00")
- **JSON Array**: Array of strings in JSON format: `["value1", "value2", ...]`
- **Enum**: Predefined set of values (must match exactly, case-insensitive)

### Required vs Optional

- ✅ **Required**: Field must be provided, cannot be empty/null
- ⚠️ **Optional**: Field can be omitted or left empty

---

## 📝 Field Validation Rules

### Stage 0 (PIP Creation)
- **Goals Weightage**: Sum of all `goals[].weightage` must equal exactly **100%**
- **Timeline Dates**: All deadline dates must be in the future relative to PIP creation
- **Timeline Order**: Deadlines must be in chronological order:
  1. Employee Acknowledgement Deadline
  2. Employee Self-Review Deadline (after active period)
  3. Manager Review Deadline (after self-review)
  4. HRBP Decision Deadline (after manager review)

### Stage 3 (Employee Self-Review)
- **All Goals**: Must provide justification for **every goal** in the PIP
- **Goal IDs**: All `goals[].id` values must match existing goal IDs in the PIP

### Stage 4 (Manager Review)
- **Goal Status**: Must be exactly one of: `ACHIEVED`, `PARTIALLY_ACHIEVED`, `NOT_ACHIEVED` (case-insensitive)
- **All Goals**: Must assess **every goal** in the PIP
- **Goal IDs**: All `goals[].id` values must match existing goal IDs in the PIP

### Stage 5 (HRBP Final Decision)
- **Outcome**: Must be exactly one of: `SUCCESSFUL`, `UNSUCCESSFUL`, `EXTENDED`, `CLOSED_WITHOUT_ACTION` (case-insensitive)

---

## 💡 Best Practices for Field Input

### For Managers (Stage 0)
- Be specific and detailed in `reason` field
- Ensure goal weightages total exactly 100%
- Set realistic timelines with buffer time
- Include all relevant supporting documents

### For Employees (Stages 1, 2, 3)
- Provide comprehensive justifications with specific examples
- Include evidence/attachments to support claims
- Be honest and objective in self-assessment
- Document progress regularly in check-ins

### For Managers (Stage 4)
- Be objective and fair in assessments
- Provide constructive feedback in comments
- Reference specific examples from check-ins
- Consider both progress and final outcomes

### For HRBP (Stage 5)
- Review all information comprehensively
- Provide clear rationale for decision
- Document any follow-up actions needed
- Be clear and professional in remarks

---

**Last Updated**: December 2025

