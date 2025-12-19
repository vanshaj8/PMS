# Critical Fixes Implementation Plan

**Date:** December 19, 2025  
**Issues:** 8 Critical + 3 Design Improvements

---

## 🔴 CRITICAL ISSUES

### Issue 2: Mixed Timezones (UTC vs Local)

**Problem:**
- Using `LocalDateTime` and `ISO_LOCAL_DATE_TIME` (no timezone)
- Mixing date-only values (2025-12-26) with timestamps
- Risk of deadline miscalculations across regions

**Fix:**
1. ✅ Created `DateTimeUtil.java` for UTC handling
2. ⏳ Update `DeadlineCalculationService` to use UTC
3. ⏳ Update `PIPService` to store timestamps in UTC
4. ⏳ Update `PIPStep.dueDate` to always include timezone (Z suffix)
5. ⏳ Add timezone conversion for frontend display

**Rule:** Store everything in UTC, render in user timezone

---

### Issue 3: HRBP Review Appears After Completion

**Problem:**
- HRBP_REVIEW step shown in workflow steps even after completion
- Confuses auditors (suggests duplicate lifecycle)

**Fix:**
1. ⏳ Filter out HRBP_REVIEW from active workflow steps display
2. ⏳ Clarify: HRBP_REVIEW = initial approval, HRBP_DECISION = final decision
3. ⏳ Update documentation to distinguish lifecycle steps

---

### Issue 4: "COMPLETED" Status Used for Everything

**Problem:**
- Step status: COMPLETED
- Workflow status: COMPLETED
- Outcome: SUCCESSFUL
- Ambiguous state machine

**Fix:**
1. ⏳ Add CLOSED status to PIPStatus enum
2. ⏳ Use distinct states:
   - Step: COMPLETED
   - Workflow: CLOSED (when PIP is done)
   - Outcome: SUCCESSFUL / UNSUCCESSFUL / EXTENDED / CLOSED_WITHOUT_ACTION
3. ⏳ Update status transitions

---

### Issue 5: Employee Acknowledgement Has No Escalation Evidence

**Problem:**
- No metadata showing escalation tracking
- Auditors expect to see escalation logs

**Fix:**
1. ✅ Created `PIPMetadata` with escalation fields
2. ⏳ Update acknowledgement step to log escalation metadata
3. ⏳ Include in API response

---

### Issue 6: Check-in Dates Ignore Active Period Start

**Problem:**
- No validation shown that check-ins are within active window
- No backdating prevention

**Fix:**
1. ✅ Created `PIPMetadata` with check-in validation fields
2. ⏳ Add validation in `addCheckIn` method
3. ⏳ Log validation results in metadata

---

### Issue 7: Partial Goal Achievement → SUCCESSFUL Outcome

**Problem:**
- One goal PARTIALLY_ACHIEVED, yet outcome is SUCCESSFUL
- No explicit success criteria

**Fix:**
1. ✅ Created `SuccessCriteriaService` for score calculation
2. ⏳ Calculate weighted average score
3. ⏳ Include success criteria in PIP response
4. ⏳ Make success threshold configurable (default 70%)

---

### Issue 8: No Explicit Extension Path in Data

**Problem:**
- Extension policy not visible in PIP data
- No metadata about extension eligibility

**Fix:**
1. ✅ Created `PIPMetadata` with extension policy fields
2. ⏳ Include extension metadata in PIP response
3. ⏳ Show max allowed, used count, eligibility

---

## 🟠 MEDIUM SEVERITY (Should Fix)

All addressed through PIPMetadata model.

---

## 🔵 DESIGN IMPROVEMENTS

### Improvement 1: Timeline Versioning
- ✅ Added to PIPMetadata
- ⏳ Implement version tracking on deadline recalculation

### Improvement 2: SLA Attribution
- ✅ Added to PIPMetadata
- ⏳ Track delay attribution per step

### Improvement 3: Compliance Mode
- ✅ Added to PIPMetadata
- ⏳ Implement compliance mode logic

---

## Implementation Steps

### Phase 1: Core Fixes (Critical)
1. ✅ Create DateTimeUtil for UTC handling
2. ✅ Create SuccessCriteriaService
3. ✅ Create PIPMetadata model
4. ⏳ Update PIP model to include metadata
5. ⏳ Update DeadlineCalculationService to use UTC
6. ⏳ Update PIPService to populate metadata
7. ⏳ Add CLOSED status to PIPStatus
8. ⏳ Filter HRBP_REVIEW from workflow display

### Phase 2: API Updates
1. ⏳ Update PIPController to include metadata in responses
2. ⏳ Add timezone conversion for frontend
3. ⏳ Update documentation

### Phase 3: Database Migration
1. ⏳ Add metadata columns to pips table
2. ⏳ Add CLOSED to status enum

---

## Files to Update

### New Files Created
- ✅ `DateTimeUtil.java` - UTC timezone handling
- ✅ `SuccessCriteriaService.java` - Success score calculation
- ✅ `PIPMetadata.java` - Metadata model

### Files to Update
- ⏳ `PIP.java` - Add metadata field, add CLOSED status
- ⏳ `PIPStatus.java` - Add CLOSED status
- ⏳ `DeadlineCalculationService.java` - Use UTC
- ⏳ `PIPService.java` - Populate metadata, use UTC
- ⏳ `PIPController.java` - Include metadata in responses, filter steps
- ⏳ `PIPStep.java` - Ensure dueDate uses UTC format
- ⏳ Database migration - Add metadata columns

---

**Status:** In Progress  
**Priority:** Critical fixes first, then medium, then design improvements

