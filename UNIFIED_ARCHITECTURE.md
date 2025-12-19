# Unified Performance Management Platform - Architecture

## Overview

This document describes the refactored architecture that unifies PIP and Appraisal modules into a single, scalable Performance Management platform with shared core services and module-specific workflows.

## Architecture Principles

1. **Shared Core Layer**: Common entities and services used by all modules
2. **Module Isolation**: PIP and Appraisal remain separate bounded contexts
3. **Unified Engines**: Workflow, Review, Rating, and Goal engines shared across modules
4. **Strong Auditability**: Field-level tracking, immutable logs, mandatory override reasons
5. **Centralized RBAC**: Permission service enforces access control
6. **Extensibility**: Ready for future modules (OKRs, Promotions)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (React Frontend - Admin Dashboard, PIP UI, Appraisal UI)   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PIPController│  │AppraisalCtrl │  │AdminDashboard│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Module Layer (Bounded Contexts)            │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   PIP Module     │         │  Appraisal Module│          │
│  │                  │         │                  │          │
│  │ - PIPService     │         │ - AppraisalCycle │          │
│  │ - PIPStatus      │         │   Service        │          │
│  │ - PIPWorkflow    │         │ - AppraisalStatus│          │
│  └──────────────────┘         └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Core Layer (Shared)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Workflow     │  │ Review       │  │ Rating       │       │
│  │ Engine       │  │ Engine       │  │ Service      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Goal         │  │ Audit        │  │ Permission   │       │
│  │ Service      │  │ Service      │  │ Service      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Core         │  │ PIP          │  │ Appraisal    │       │
│  │ Repositories │  │ Repositories │  │ Repositories │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Core Tables  │  │ PIP Tables   │  │ Appraisal    │       │
│  │              │  │              │  │ Tables       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Core Layer Components

### 1. Workflow Engine

**Purpose**: Unified workflow management supporting both sequential (PIP) and phase-based (Appraisal) workflows.

**Key Features**:
- Supports `SEQUENTIAL` (PIP) and `PHASE_BASED` (Appraisal) workflow types
- Auto-locking after deadlines
- Prerequisite validation for sequential workflows
- Auto-advancement to next phase
- Role-based phase assignment

**Entities**:
- `WorkflowPhase`: Represents a phase in a workflow
- `WorkflowStep`: Individual steps within a phase
- `WorkflowContext`: PIP, APPRAISAL, OKR, PROMOTION

**Service**: `WorkflowEngine`

### 2. Goal Service

**Purpose**: Unified goal management - goals are appraisal-first, referenced by PIP when triggered.

**Key Features**:
- Goals created in Appraisal context
- PIP can reference existing goals or create new ones
- Versioning for audit trail
- Weightage validation
- Goal locking mechanism

**Entities**:
- `SharedGoal`: Unified goal entity
- `GoalRating`: Ratings for goals
- `GoalType`: Business, Behavioral, Competency, OKR, Development, PIP Improvement

**Service**: `GoalService` (to be created)

### 3. Review Engine

**Purpose**: Unified review management across all contexts.

**Key Features**:
- Context-aware reviews (PIP, Appraisal)
- Role-based review types (Self, Manager, Skip, HRBP, HR, Peer)
- Form-based responses
- Draft/Submit/Lock workflow
- Review locking after deadline

**Entities**:
- `UnifiedReview`: Single review entity for all contexts
- `ReviewType`: Self, Manager, Skip, Peer, HRBP, HR, Calibration
- `ReviewRole`: Employee, Manager, Skip Level Manager, HRBP, HR, Peer, Admin
- `ReviewStatus`: Draft, Submitted, Locked, Amended, Rejected

**Service**: `ReviewEngine` (to be created)

### 4. Rating Service

**Purpose**: Decoupled rating calculation, calibration, and finalization.

**Key Features**:
- Rating calculation from reviews
- Section-wise weighted ratings
- Calibration support
- Override tracking with mandatory reasons
- Final rating determination

**Entities**:
- `GoalRating`: Rating for individual goals
- `RatingSource`: Self, Manager, Skip, Peer, HRBP, HR, Calibrated, Final

**Service**: `RatingService` (existing, to be enhanced)

### 5. Audit Service

**Purpose**: Enhanced audit logging with field-level tracking.

**Key Features**:
- Field-level change tracking
- Immutable audit logs
- Mandatory override reasons
- Context-aware logging
- IP address and user agent tracking

**Entities**:
- `EnhancedAuditLog`: Immutable audit log with field changes

**Service**: `AuditService`

### 6. Permission Service

**Purpose**: Centralized RBAC enforcement.

**Key Features**:
- Role-based permission matrix
- Context-aware permissions
- Action-level authorization
- Access control checks

**Service**: `PermissionService`

## Module Layer

### PIP Module

**Status**: Uses unified engines, maintains PIP-specific logic

**Key Components**:
- `PIPService`: Orchestrates PIP workflow using WorkflowEngine
- `PIPStatus`: PIP-specific status enum
- `PIPController`: API endpoints

**Workflow Type**: `SEQUENTIAL`

**Phases**:
1. HRBP_REVIEW
2. EMPLOYEE_ACKNOWLEDGEMENT
3. ACTIVE_PIP
4. EMPLOYEE_SELF_REVIEW
5. MANAGER_REVIEW
6. HRBP_DECISION

### Appraisal Module

**Status**: Uses unified engines, maintains Appraisal-specific logic

**Key Components**:
- `AppraisalCycleService`: Manages cycles using WorkflowEngine
- `AppraisalCycleStatus`: Appraisal-specific status enum
- `AppraisalController`: API endpoints

**Workflow Type**: `PHASE_BASED`

**Phases**:
1. GOAL_LOCK
2. SELF_REVIEW
3. MANAGER_REVIEW
4. SKIP_REVIEW
5. CALIBRATION
6. HR_FINALIZATION
7. EMPLOYEE_ACKNOWLEDGEMENT

## Data Model Relationships

```
User
  ├─→ SharedGoal (employee_id)
  ├─→ UnifiedReview (reviewer_id, reviewee_id)
  └─→ EnhancedAuditLog (user_id)

SharedGoal
  ├─→ GoalRating (goal_id)
  └─→ WorkflowPhase (referenced in metadata)

WorkflowPhase
  ├─→ WorkflowStep (phase_id)
  └─→ UnifiedReview (referenced in metadata)

UnifiedReview
  └─→ Rating (calculated from review)

EnhancedAuditLog
  └─→ References all entities via context_id, entity_id
```

## API Contracts

### Admin Dashboard

```
GET /api/admin/dashboard/overview
  → Returns: Global KPIs, Risk Alerts, Module Snapshots

GET /api/admin/dashboard/pip
  → Returns: PIP-specific metrics and breakdowns

GET /api/admin/dashboard/appraisal
  → Returns: Appraisal-specific metrics and breakdowns
```

### Workflow Engine

```
POST /api/core/workflow/initialize
  → Initialize workflow with phases

POST /api/core/workflow/complete-phase
  → Complete a workflow phase

GET /api/core/workflow/{workflowId}/phases
  → Get all phases for a workflow
```

### Goal Service

```
POST /api/core/goals
  → Create a shared goal

GET /api/core/goals/{goalId}
  → Get goal with version history

PUT /api/core/goals/{goalId}
  → Update goal (creates new version)

POST /api/core/goals/{goalId}/lock
  → Lock goal
```

### Review Engine

```
POST /api/core/reviews
  → Submit a review

GET /api/core/reviews/{reviewId}
  → Get review details

PUT /api/core/reviews/{reviewId}
  → Update draft review

POST /api/core/reviews/{reviewId}/submit
  → Submit review
```

## Migration Strategy

### Phase 1: Core Layer (Current)
- ✅ Create core models
- ✅ Create unified engines
- ✅ Create audit and permission services

### Phase 2: Refactor PIP Module
- Migrate PIP to use WorkflowEngine
- Migrate PIP goals to SharedGoal
- Migrate PIP reviews to UnifiedReview
- Update PIPService to use unified services

### Phase 3: Refactor Appraisal Module
- Migrate Appraisal to use WorkflowEngine
- Migrate Appraisal goals to SharedGoal
- Migrate Appraisal reviews to UnifiedReview
- Update AppraisalCycleService to use unified services

### Phase 4: Database Migration
- Create core tables (workflow_phases, workflow_steps, shared_goals, unified_reviews, enhanced_audit_logs)
- Migrate existing data
- Add foreign key relationships

### Phase 5: Testing & Validation
- Unit tests for unified engines
- Integration tests for modules
- End-to-end workflow tests
- Performance testing

## Benefits

1. **Code Reuse**: Shared engines eliminate duplication
2. **Consistency**: Unified workflows ensure consistent behavior
3. **Auditability**: Enhanced audit logs provide complete traceability
4. **Extensibility**: Easy to add new modules (OKRs, Promotions)
5. **Maintainability**: Clear separation of concerns
6. **Scalability**: Modular architecture supports growth

## Next Steps

1. Complete core service implementations
2. Create database migration scripts
3. Refactor PIP module to use unified engines
4. Refactor Appraisal module to use unified engines
5. Update Admin Dashboard to use unified services
6. Comprehensive testing
7. Documentation updates

