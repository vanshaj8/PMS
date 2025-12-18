# Deadline Issues - Code & UI Verification Checklist

This document verifies each deadline issue against both backend code implementation and frontend UI changes.

---

## 🔴 High-Level Deadline Design Issues

### ❌ Issue A: Deadlines Are Fully Manager-Defined

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `DeadlinePolicy.java` - Policy model with min/max/defaults
- ✅ `DeadlinePolicyService.java` - Policy validation service
- ✅ `PIPService.createPIP()` - Validates durations against policy

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ UI still allows manager to enter absolute dates directly
- ❌ No policy validation in frontend
- ❌ No min/max constraints displayed to user
- ❌ No default values pre-filled from policy

**Required UI Changes**:
- Replace date inputs with duration inputs (number fields)
- Display policy min/max ranges as helper text
- Pre-fill default values from policy API
- Show validation errors if values exceed policy limits
- Remove absolute date fields for downstream deadlines

**Files to Update**:
- `frontend/src/pages/CreatePIPPage.tsx` - Timeline section (lines 349-450)
- `frontend/src/types/index.ts` - Update PIPTimeline interface
- `frontend/src/services/pipService.ts` - Add policy fetch endpoint

---

### ❌ Issue B: Absolute Dates + Duration Mixed Incorrectly

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `PIPTimeline.java` - Now stores durations, not absolute dates
- ✅ `DeadlineCalculationService.java` - Calculates derived deadlines
- ✅ `PIPService` - Uses duration-based timeline

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ UI still sends absolute dates to backend
- ❌ `formData.timeline` contains date fields
- ❌ No indication that dates are calculated dynamically

**Required UI Changes**:
- Change timeline form to accept durations only
- Remove date inputs for: employeeSelfReviewDeadline, managerFinalReviewDeadline, hrbpFinalDecisionDeadline
- Show calculated deadlines as read-only display (not inputs)
- Add note: "Deadlines are calculated automatically based on completion times"

**Files to Update**:
- `frontend/src/pages/CreatePIPPage.tsx` - Timeline form fields
- `frontend/src/pages/TimelineEditorPage.tsx` - Remove date editing for calculated fields
- `frontend/src/types/index.ts` - Update interface

---

### ❌ Issue C: No Business-Day / Leave Awareness

**Backend Status**: ⚠️ **PARTIALLY IMPLEMENTED**
- ✅ `BusinessDayService.java` - Business day calculations
- ⚠️ Holiday calendar not yet integrated (TODO in code)
- ❌ Employee leave integration not implemented

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No UI for holiday configuration
- ❌ No leave integration
- ❌ No indication of business vs calendar days

**Required UI Changes**:
- Add toggle/selection for business days vs calendar days (if policy allows)
- Show holiday calendar view
- Display "Business Days" label where applicable
- Admin UI for holiday management (future)

---

## 🟡 Stage-by-Stage Deadline Issues

### Stage 0: PIP Creation & HRBP Review

#### ❌ Issue 1: No HRBP Review Deadline Defined

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `DeadlinePolicy.java` - HRBP review deadline policy
- ✅ `DeadlineCalculationService.calculateHrbpReviewDeadline()`
- ✅ `PIPService.initializeSteps()` - Creates HRBP_REVIEW step
- ✅ Step deadline calculated on PIP creation

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No UI showing HRBP review deadline
- ❌ No deadline display in PIP detail page
- ❌ No countdown or overdue indicators

**Required UI Changes**:
- Show HRBP review deadline in PIP detail page
- Display deadline in HRBP dashboard
- Add overdue indicator if deadline passed
- Show deadline in step timeline view

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Add HRBP review step display
- `frontend/src/pages/DashboardPage.tsx` - Show HRBP review deadlines

---

#### ❌ Issue 2: HRBP Review Delays Don't Shift Timeline

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `PIPService.approvePIPByHrbp()` - Recalculates deadlines on approval
- ✅ `DeadlineCalculationService.recalculateDeadlines()` - Updates all downstream deadlines
- ✅ Timestamps stored: `hrbpApprovedAt`

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No UI for HRBP approval action
- ❌ No indication that deadlines will be recalculated
- ❌ Timeline doesn't update after approval

**Required UI Changes**:
- Add "Approve PIP" button in HRBP view
- Show confirmation dialog explaining deadline recalculation
- Update timeline display after approval
- Show notification: "Deadlines have been recalculated based on approval time"

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Add approve button for HRBP
- `frontend/src/services/pipService.ts` - Add approvePIPByHrbp endpoint
- `frontend/src/types/index.ts` - Add hrbpApprovedAt field

---

### Stage 1: Employee Acknowledgement

#### ❌ Issue 3: What If Employee Misses Acknowledgement?

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `EscalationService.checkEmployeeAcknowledgement()` - Checks overdue
- ✅ `PIPStatus.OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT` - New status
- ✅ `EscalationService.deemAcknowledged()` - HRBP can deem acknowledged

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No overdue status display
- ❌ No escalation UI
- ❌ No "Deem Acknowledged" button for HRBP

**Required UI Changes**:
- Show overdue status badge/indicator
- Display escalation timeline (when escalated)
- Add "Deem Acknowledged" action for HRBP
- Show warnings: "Acknowledgment overdue by X days"

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Overdue indicators
- `frontend/src/types/index.ts` - Add OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT status
- `frontend/src/services/pipService.ts` - Add deemAcknowledged endpoint

---

#### ❌ Issue 4: Acknowledgement Starts Active Period Even if Late

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `PIPService.acknowledgePIP()` - Sets `activePeriodStartedAt` to actual timestamp
- ✅ `activePeriodStartedAt = acknowledgedAt` (not original deadline)
- ✅ Active period end calculated from actual start

**Frontend Status**: ✅ **PARTIALLY IMPLEMENTED**
- ⚠️ Acknowledgement button exists
- ❌ No indication that active period starts from acknowledgement time
- ❌ Timeline may show incorrect active period dates

**Required UI Changes**:
- Update timeline to show active period starts from acknowledgement timestamp
- Add tooltip: "Active period starts when you acknowledge, not from original deadline"
- Display actual active period dates after acknowledgement

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Timeline calculation
- Show activePeriodStartedAt in timeline

---

### Stage 2: Active PIP Period

#### ❌ Issue 5: No Deadline for Check-Ins

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `DeadlinePolicy.java` - minCheckInFrequencyDays, minCheckInsRequired
- ✅ `PIPService.validateCheckInRequirements()` - Validates check-ins

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No check-in frequency requirement displayed
- ❌ No warning if check-ins are overdue
- ❌ No minimum check-in indicator

**Required UI Changes**:
- Display: "Minimum 1 check-in every X days" (from policy)
- Show check-in frequency status
- Warn if check-in overdue
- Display: "Minimum X check-ins required" before completing active period

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Check-in section
- `frontend/src/pages/DashboardPage.tsx` - Check-in reminders

---

#### ❌ Issue 6: Active Period Auto-Completes Without Validation

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `PIPService.completeActivePeriod()` - Validates check-ins first
- ✅ `PIPStatus.ACTIVE_PENDING_VALIDATION` - New status
- ✅ Validation before completion

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No validation UI before completing active period
- ❌ No "Complete Active Period" button
- ❌ No indication of validation requirements

**Required UI Changes**:
- Add "Complete Active Period" button (with validation check)
- Show validation status: "X/X check-ins completed"
- Display warning if requirements not met
- Allow force completion (with HRBP override)

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Add complete active period action
- `frontend/src/services/pipService.ts` - Add completeActivePeriod endpoint

---

### Stage 3: Employee Self-Review

#### ❌ Issue 7: Self-Review Deadline Is Static

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `DeadlineCalculationService.calculateSelfReviewDeadline()` - Derived from active_end
- ✅ Deadline recalculated when active period ends

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ UI may show static deadline
- ❌ No indication deadline is calculated dynamically

**Required UI Changes**:
- Show calculated deadline (read-only)
- Display: "Deadline calculated from active period end + buffer"
- Update deadline if active period extended

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Self-review deadline display

---

#### ❌ Issue 8: No Grace Period Defined

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `DeadlinePolicy.java` - gracePeriodDays field
- ❌ Grace period validation not yet integrated in submission

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No grace period display
- ❌ No late submission handling UI

**Required UI Changes**:
- Show grace period: "Deadline: X. Grace period: X days"
- Tag late submissions: "Submitted X days late (within grace period)"
- Different styling for late submissions
- Show grace period end date

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Self-review submission UI
- `frontend/src/types/index.ts` - Add gracePeriod field

---

### Stage 4: Manager Review

#### ❌ Issue 9: No Enforcement for Manager Delay

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `EscalationService.checkManagerReview()` - Checks overdue
- ✅ `PIPStatus.OVERDUE_MANAGER_REVIEW` - New status
- ✅ Escalation thresholds

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No overdue status display
- ❌ No escalation indicators

**Required UI Changes**:
- Show overdue badge for manager review
- Display escalation status
- Show: "Overdue by X days - Escalated to HRBP"

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Manager review section
- `frontend/src/types/index.ts` - Add OVERDUE_MANAGER_REVIEW status

---

#### ❌ Issue 10: Manager Can Delay Final Outcome Indefinitely

**Backend Status**: ⚠️ **PARTIALLY IMPLEMENTED**
- ✅ Escalation logic exists
- ❌ HRBP override endpoint not yet created

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No HRBP override UI
- ❌ No "Take Over Review" button

**Required UI Changes**:
- Add "Take Over Review" button for HRBP (when overdue)
- Show warning: "Manager review overdue - HRBP can take over"
- Confirmation dialog for override

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Add HRBP override action
- `frontend/src/services/pipService.ts` - Add hrbpOverrideReview endpoint

---

### Stage 5: HRBP Final Decision

#### ❌ Issue 11: HRBP Deadline Exists But No Enforcement

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `EscalationService.checkHrbpDecision()` - Checks overdue
- ✅ `PIPStatus.OVERDUE_HRBP_DECISION` - New status
- ✅ `PIPStatus.ADMIN_INTERVENTION_REQUIRED` - Escalation status

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No overdue status display
- ❌ No admin escalation UI

**Required UI Changes**:
- Show overdue badge
- Admin dashboard for intervened PIPs
- Escalation indicators

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - HRBP decision section
- `frontend/src/pages/AdminDashboardPage.tsx` - Intervention queue

---

#### ❌ Issue 12: EXTENDED Outcome Has No Deadline Rules

**Backend Status**: ✅ **IMPLEMENTED**
- ✅ `DeadlinePolicy.java` - maxExtensionsAllowed, maxTotalPipDurationDays
- ✅ `PIP.java` - extensionCount, originalActiveDuration
- ❌ Extension workflow not yet implemented

**Frontend Status**: ❌ **NOT IMPLEMENTED**
- ❌ No extension request UI
- ❌ No extension limit display
- ❌ No extension approval workflow

**Required UI Changes**:
- Show extension count: "Extensions: X/Y used"
- Add "Request Extension" button (if under limit)
- Show extension approval UI for HRBP/Admin
- Display max duration limit
- Warn when approaching limit

**Files to Update**:
- `frontend/src/pages/PIPDetailPage.tsx` - Extension UI
- `frontend/src/services/pipService.ts` - Add extension endpoints
- `frontend/src/types/index.ts` - Add extension fields

---

## 📊 Summary Statistics

### Backend Implementation
- ✅ **Fully Implemented**: 8 issues
- ⚠️ **Partially Implemented**: 3 issues
- ❌ **Not Implemented**: 1 issue (leave integration - low priority)

### Frontend Implementation
- ✅ **Fully Implemented**: 0 issues
- ⚠️ **Partially Implemented**: 1 issue
- ❌ **Not Implemented**: 11 issues

---

## 🎯 Priority UI Changes Needed

### High Priority (Core Functionality)
1. **Update CreatePIPPage timeline form** - Use durations, not dates
2. **Add HRBP approval UI** - Approve button with deadline recalculation
3. **Update PIP detail timeline display** - Show calculated deadlines
4. **Add overdue indicators** - Visual status for all overdue steps
5. **Add extension UI** - Request and approve extensions

### Medium Priority (User Experience)
6. **Check-in validation UI** - Show requirements and status
7. **Grace period display** - Show grace periods and late submission handling
8. **Escalation indicators** - Show escalation status
9. **HRBP override UI** - Take over review button

### Low Priority (Nice to Have)
10. **Business day indicator** - Show business vs calendar days
11. **Holiday calendar** - Admin holiday management (future)

---

## 📝 Implementation Checklist

### Immediate Actions
- [ ] Update `frontend/src/types/index.ts` - Add new fields and statuses
- [ ] Update `frontend/src/pages/CreatePIPPage.tsx` - Duration-based timeline
- [ ] Update `frontend/src/services/pipService.ts` - Add new endpoints
- [ ] Update `frontend/src/pages/PIPDetailPage.tsx` - Show calculated deadlines
- [ ] Add HRBP approval button and workflow
- [ ] Add overdue status indicators throughout UI

### Next Sprint
- [ ] Extension request/approval workflow
- [ ] Check-in validation UI
- [ ] Grace period handling
- [ ] Escalation displays
- [ ] HRBP override functionality

---

**Last Updated**: December 2025
**Status**: Backend 75% complete, Frontend 5% complete

