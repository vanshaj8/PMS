# Module Separation Policy - Appraisal & PIP

**Date:** December 19, 2025  
**Status:** ✅ **ACTIVE POLICY**

---

## 🔒 Core Principle: STRICT SEPARATION

The Annual Appraisal Module and Performance Improvement Plan (PIP) Module are **TWO INDEPENDENT SYSTEMS** that must remain completely separate.

---

## 🚫 MANDATORY RULES

### 1. No Auto-Creation
- ❌ Appraisal completion must **NOT** automatically create PIPs
- ❌ Low appraisal ratings must **NOT** trigger PIP creation
- ❌ PIP completion must **NOT** update appraisal scores
- ✅ Managers may **manually** create PIPs and optionally reference an appraisal

### 2. No Workflow Dependencies
- ❌ Appraisal workflows must **NOT** depend on PIP status
- ❌ PIP workflows must **NOT** depend on appraisal status
- ✅ Each module has its own independent workflow states

### 3. Separate Data Models
- ✅ Use separate database tables/schemas
- ✅ Separate status enums (no shared values)
- ✅ Separate deadline/SLA calculations
- ✅ Separate business logic

### 4. Optional Reference Only (Read-Only Metadata)
- ✅ Manager may **optionally** add an appraisal reference when creating a PIP
- ✅ This reference is **read-only metadata** for context only
- ❌ This reference must **NOT** create any dependencies
- ❌ This reference must **NOT** affect workflows

---

## 📊 Data Model Compliance

### PIP Model Fields (Optional Metadata Only)

```java
// ✅ ALLOWED: Optional read-only reference fields
@Column(name = "appraisal_cycle_id", columnDefinition = "CHAR(36)")
private String appraisalCycleId; // OPTIONAL: Manager may reference appraisal cycle

@Column(name = "appraisal_participant_id", columnDefinition = "CHAR(36)")
private String appraisalParticipantId; // OPTIONAL: Manager may reference participant

// ❌ WRONG: Do NOT use "triggeredFromAppraisal" - implies auto-creation
// ✅ CORRECT: Use descriptive field names that don't imply dependencies
```

### AppraisalOutcome Model

```java
// ✅ ALLOWED: Optional reference for read-only context
@Column(name = "pip_id", columnDefinition = "CHAR(36)")
private String pipId; // OPTIONAL: If manager created PIP and linked it

@Column(name = "pip_triggered")
private Boolean pipTriggered = false; // OPTIONAL: Manager manually created PIP
```

**Note:** These fields exist for **manual linking by managers only**, not auto-creation.

---

## 🔄 Workflow Isolation

### Appraisal Workflow (Independent)
```
DRAFT → ACTIVE → SELF_REVIEW → MANAGER_REVIEW → HRBP_REVIEW → COMPLETED
```

### PIP Workflow (Independent)
```
DRAFT → HRBP_APPROVAL → EMPLOYEE_ACK → ACTIVE → SELF_REVIEW → MANAGER_REVIEW → HRBP_DECISION → CLOSED
```

**Rules:**
- ❌ No overlapping states
- ❌ No shared transitions
- ❌ No cross-module state dependencies

---

## 🎯 Goals Handling

### Central Goals Service
- ✅ Both modules consume from `goals` (master table)
- ✅ Each module creates its own snapshot:
  - `appraisal_goal_snapshots` (for appraisals)
  - `pip_goal_snapshots` (for PIPs)

### Rules
- ❌ Do NOT update master goals from PIP/Appraisal directly
- ❌ Do NOT assume same weightage or success criteria
- ✅ Each module manages its own goal snapshots independently

---

## 🔐 API & Service Rules

### ❌ FORBIDDEN Endpoints
- `POST /api/appraisals/:id/auto-create-pip` ❌
- `POST /api/appraisals/:outcome/create-pip` ❌
- `GET /api/pips?autoFromAppraisal=true` ❌

### ✅ ALLOWED Endpoints
- `POST /api/pips` - Create PIP (manager may optionally include appraisal reference)
- `GET /api/pips/:id` - Get PIP (may include optional appraisal reference metadata)
- `GET /api/appraisals/:id` - Get Appraisal (independent of PIP)

### Service Layer Rules
- ✅ PIPService.createPIP() - Accepts optional `appraisalCycleId` and `appraisalParticipantId` as metadata
- ❌ PIPService.createPIPFromAppraisal() - DO NOT create
- ❌ AppraisalService.autoCreatePIP() - DO NOT create

---

## 🖥️ UI Rules

### Separate UI Components
- ✅ Appraisal UI: Annual review language, rating scales, compensation context
- ✅ PIP UI: Improvement language, check-ins, acknowledgements, legal audit trail
- ❌ No shared UI components unless explicitly marked `@shared-ui`

### Dashboard Rules
- ✅ Separate dashboard metrics:
  - "Active Appraisals" widget
  - "Active PIPs" widget
- ❌ Filters must NOT cross:
  - Appraisal filters → appraisal list only
  - PIP filters → PIP list only

### Display Rules for Optional Reference
- ✅ Show appraisal reference in PIP detail page as **read-only context**
- ✅ Show PIP reference in appraisal outcome as **read-only context**
- ❌ Do NOT show "Auto-created from appraisal" messaging
- ✅ Show "Manager referenced appraisal: [cycle name]" if reference exists

---

## 🧪 Testing Rules

### Independent Test Suites
- ✅ Write separate test suites for Appraisal module
- ✅ Write separate test suites for PIP module
- ❌ No test should assume:
  - Appraisal completion impacts PIP
  - PIP closure impacts appraisal
  - Auto-creation scenarios

---

## 🧠 AI & Recommendations (Read-Only)

### ✅ AI May:
- Suggest improvement areas
- Highlight patterns
- Show historical context

### ❌ AI Must NOT:
- Auto-create PIPs
- Auto-fail appraisals
- Enforce decisions
- Link modules automatically

---

## 🔍 Code Review Checklist

When reviewing code, check:

- [ ] Does this code assume appraisal completion triggers PIP?
- [ ] Does this code share workflow states between modules?
- [ ] Does this code create dependencies between modules?
- [ ] Are the fields truly optional metadata (nullable)?
- [ ] Is there any auto-creation logic?
- [ ] Are workflows completely independent?

If **ANY** answer is "yes" → **STOP and refactor**

---

## 📝 Field Naming Convention

### ✅ CORRECT Field Names (Optional Metadata)
- `appraisalCycleId` - Reference to cycle (optional)
- `appraisalParticipantId` - Reference to participant (optional)
- `relatedAppraisalCycleId` - Alternative naming
- `referencedAppraisalId` - Alternative naming

### ❌ WRONG Field Names (Implies Dependencies)
- `triggeredFromAppraisal` - Implies auto-creation
- `autoCreatedFromAppraisal` - Implies auto-creation
- `dependentOnAppraisal` - Implies dependency
- `appraisalTriggered` - Implies trigger mechanism

---

## ✅ Compliance Status

### Current Implementation
- ✅ Fields added are optional (nullable)
- ✅ No auto-creation logic found
- ⚠️ Field naming needs update (`triggeredFromAppraisal` → better name)
- ⚠️ Documentation needs update to clarify read-only nature
- ✅ UI shows as optional reference context

### Required Updates
1. Rename `triggeredFromAppraisal` to `appraisalReference` or similar
2. Update documentation to remove auto-creation suggestions
3. Ensure all references are clearly marked as optional metadata
4. Review all service methods to ensure no cross-module dependencies

---

**This policy is MANDATORY. All code must comply.**

