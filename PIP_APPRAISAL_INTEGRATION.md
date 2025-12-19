# PIP and Appraisal - Optional Reference (Read-Only Metadata)

**Date:** December 19, 2025  
**Status:** ✅ **Optional Reference Only - No Dependencies**

---

## 🔒 STRICT SEPARATION POLICY

**CRITICAL:** The Appraisal and PIP modules are **STRICTLY SEPARATED**. See `MODULE_SEPARATION_POLICY.md` for mandatory rules.

**Key Rule:** These fields are **OPTIONAL READ-ONLY METADATA** only. They do NOT create dependencies or enable auto-creation.

---

## Overview

The PIP model includes optional fields that allow managers to manually reference an appraisal when creating a PIP. This reference is for context only and does NOT create any dependencies between the modules.

---

## ⚠️ IMPORTANT: What This Is NOT

- ❌ **NOT** an integration or merging of modules
- ❌ **NOT** an auto-creation mechanism
- ❌ **NOT** a dependency or workflow link
- ❌ **NOT** bidirectional linking that affects workflows
- ✅ **IS** optional read-only metadata for manual reference

---

## Optional Reference Fields

### PIP Model Fields

```typescript
interface PIP {
  // ... existing fields ...
  
  // Optional appraisal reference fields (READ-ONLY metadata only)
  appraisalParticipantId?: string; // OPTIONAL: Manager's manual reference
  appraisalCycleId?: string; // OPTIONAL: Manager's manual reference
}
```

**Java (PIP.java):**
```java
// Optional appraisal reference fields (READ-ONLY metadata only)
@Column(name = "appraisal_participant_id", columnDefinition = "CHAR(36)")
private String appraisalParticipantId; // OPTIONAL: Manager's manual reference

@Column(name = "appraisal_cycle_id", columnDefinition = "CHAR(36)")
private String appraisalCycleId; // OPTIONAL: Manager's manual reference
```

### AppraisalOutcome Model

```java
@Column(name = "pip_id", columnDefinition = "CHAR(36)")
private String pipId; // OPTIONAL: If manager created PIP and manually linked it

@Column(name = "pip_triggered")
private Boolean pipTriggered = false; // OPTIONAL: Manager manually created PIP
```

---

## Usage: Manual Reference Only

### Scenario: Manager Creates PIP with Optional Appraisal Reference

```typescript
// Manager manually creates PIP and optionally references an appraisal
const createPIP = async (pipData: CreatePIPRequest) => {
  const pip: PIP = {
    employeeId: pipData.employeeId,
    managerId: pipData.managerId,
    hrbpId: pipData.hrbpId,
    reason: pipData.reason,
    // ... other required fields ...
    
    // OPTIONAL: Manager may include appraisal reference for context
    appraisalCycleId: pipData.appraisalCycleId, // Optional
    appraisalParticipantId: pipData.appraisalParticipantId, // Optional
  };
  
  return await pipService.createPIP(pip);
};
```

**Important:**
- Manager chooses whether to include the reference
- Reference is stored as metadata only
- No workflow dependencies are created
- PIP workflow proceeds independently

---

## Display: Read-Only Context

### PIP Detail Page

Shows appraisal reference as read-only context (if manager included it):

```
┌─────────────────────────────────────┐
│  Appraisal Reference (Optional)     │
│  Manager referenced appraisal cycle │
│  Cycle: xxx-xxx-xxx                 │
│  [View Appraisal] (read-only link)  │
└─────────────────────────────────────┘
```

**UI Message:**
- ✅ "Manager referenced appraisal cycle: [id]"
- ❌ NOT "Created from appraisal" (implies auto-creation)

---

## Database Schema

### Migration
`backend-java/database/migrations/add_appraisal_integration_to_pip.sql`

Adds optional nullable columns:
- `appraisal_participant_id` (CHAR(36), NULL)
- `appraisal_cycle_id` (CHAR(36), NULL)

Foreign keys use `ON DELETE SET NULL` to maintain independence.

---

## API Behavior

### Create PIP Endpoint

```typescript
POST /api/pips
{
  "employeeId": "...",
  "managerId": "...",
  "hrbpId": "...",
  "reason": "...",
  // ... other required fields ...
  
  // OPTIONAL fields (manager may include)
  "appraisalCycleId": "...", // Optional
  "appraisalParticipantId": "..." // Optional
}
```

**Behavior:**
- ✅ Accepts optional appraisal reference fields
- ✅ Stores them as metadata only
- ✅ PIP workflow proceeds independently
- ❌ Does NOT validate appraisal exists or is complete
- ❌ Does NOT create dependencies

---

## Compliance Checklist

- [x] Fields are nullable (optional)
- [x] No auto-creation logic
- [x] No workflow dependencies
- [x] Fields are for read-only reference only
- [x] UI shows as optional context
- [x] Separate workflows maintained
- [x] No shared states or enums

---

## Files Modified

### TypeScript Types
- `shared/types.ts` - Added optional reference fields with clear documentation
- `frontend/src/types/index.ts` - Added optional reference fields

### Java Model
- `backend-java/src/main/java/com/pip/model/PIP.java` - Added optional reference fields

### Database
- `backend-java/database/migrations/add_appraisal_integration_to_pip.sql` - Adds nullable columns

### UI
- `frontend/src/pages/PIPDetailPage.tsx` - Shows optional reference as read-only context

---

## Compliance with Separation Policy

This implementation complies with `MODULE_SEPARATION_POLICY.md`:

- ✅ No auto-creation
- ✅ No workflow dependencies
- ✅ Optional metadata only
- ✅ Read-only references
- ✅ Independent workflows
- ✅ Separate business logic

---

**Status:** ✅ Compliant with strict separation policy. Fields are optional read-only metadata only.
