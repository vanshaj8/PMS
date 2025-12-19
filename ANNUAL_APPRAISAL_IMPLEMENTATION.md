# Annual Appraisal System - Implementation Summary

## Overview
This document summarizes the implementation of the Annual Appraisal System as a separate module from the PIP (Performance Improvement Plan) system. The appraisal system is designed as a **Cycle Engine** for organization-wide, cyclical performance evaluations.

## Key Differences from PIP

| Aspect | PIP | Annual Appraisal |
|--------|-----|------------------|
| **Scope** | Individual | Organization-wide |
| **Duration** | Short-term (30-90 days) | Long-term (Annual/Semi-annual) |
| **Trigger** | Performance issue | Calendar-based |
| **Outcomes** | Pass/Fail | Rating, Hike, Promotion |
| **Stakeholders** | Employee, Manager, HRBP | Employee, Manager, Skip, HR, Leadership |

## ✅ Completed Backend Implementation

### 1. Data Models (Entities)
All core entities have been created:

- **AppraisalCycle** - Top-level cycle configuration
- **AppraisalParticipant** - Employee participation in a cycle
- **AppraisalGoal** - Goals for each participant
- **ReviewPhase** - Timeline phases (Goal Lock, Self Review, Manager Review, etc.)
- **ReviewForm** - Form templates with sections and questions
- **ReviewResponse** - Submitted review responses
- **Rating** - Ratings from different sources (Self, Manager, Skip, Calibrated, Final)
- **CalibrationSession** - Calibration sessions for rating adjustments
- **CalibrationAdjustment** - Individual rating adjustments
- **AppraisalOutcome** - Final outcomes (rating, promotion, hike, PIP trigger)

### 2. Repositories
All repositories created with appropriate query methods:
- `AppraisalCycleRepository`
- `AppraisalParticipantRepository`
- `AppraisalGoalRepository`
- `ReviewPhaseRepository`
- `ReviewFormRepository`
- `ReviewResponseRepository`
- `RatingRepository`
- `CalibrationSessionRepository`
- `CalibrationAdjustmentRepository`
- `AppraisalOutcomeRepository`

### 3. Services

#### AppraisalCycleService
- Create and manage appraisal cycles
- Eligibility rules evaluation (departments, roles, tenure, exclusions)
- Auto-enrollment of eligible participants
- Phase management
- Goal locking with weightage validation

#### RatingService
- Calculate weighted ratings from review responses
- Section-wise rating calculation
- Rating calibration
- Distribution analysis
- Rating label mapping

#### ReviewFormService
- Form creation and management
- Review response submission (draft/submit)
- Form retrieval by cycle and review type

### 4. API Controller
**AppraisalController** with endpoints for:

#### Cycle Management
- `POST /api/appraisals/cycles` - Create cycle
- `GET /api/appraisals/cycles` - Get all cycles
- `GET /api/appraisals/cycles/active` - Get active cycles
- `GET /api/appraisals/cycles/{cycleId}` - Get cycle details
- `POST /api/appraisals/cycles/{cycleId}/activate` - Activate cycle

#### Participant Management
- `GET /api/appraisals/cycles/{cycleId}/participants` - Get all participants
- `GET /api/appraisals/cycles/{cycleId}/participants/{employeeId}` - Get participant
- `GET /api/appraisals/participants/my-appraisals` - Employee's appraisals
- `GET /api/appraisals/participants/my-team` - Manager's team appraisals

#### Goal Management
- `GET /api/appraisals/participants/{participantId}/goals` - Get goals
- `POST /api/appraisals/participants/{participantId}/goals/lock` - Lock goals

#### Review Forms
- `POST /api/appraisals/forms` - Create form
- `GET /api/appraisals/cycles/{cycleId}/forms` - Get forms by cycle

#### Review Responses
- `POST /api/appraisals/responses` - Submit response
- `GET /api/appraisals/participants/{participantId}/responses` - Get responses

#### Ratings
- `GET /api/appraisals/participants/{participantId}/ratings` - Get ratings
- `POST /api/appraisals/participants/{participantId}/ratings/calibrate` - Calibrate rating
- `GET /api/appraisals/cycles/{cycleId}/distribution` - Get rating distribution

#### Outcomes
- `GET /api/appraisals/participants/{participantId}/outcome` - Get final outcome

#### Dashboard Metrics
- `GET /api/appraisals/cycles/{cycleId}/metrics` - Get cycle metrics

### 5. Database Schema
Complete migration script created: `backend-java/database/migrations/create_appraisal_tables.sql`

All tables include:
- Proper foreign key relationships
- Indexes for performance
- JSON columns for flexible configuration (eligibility rules, rating scales, form structures)
- Audit timestamps (created_at, updated_at)

## 🔄 Pending Frontend Implementation

### 8. Frontend Types & Services
- TypeScript interfaces for all entities
- API service layer for appraisal endpoints
- Error handling and response types

### 9. Employee Dashboard
- View active appraisal cycles
- Submit self-review
- View goals and lock status
- View final outcome (when released)
- Acknowledge outcome

### 10. Manager Dashboard
- Team overview with completion status
- Pending reviews list
- Submit manager reviews
- Rating distribution preview
- Final sign-off

### 11. HR/Admin Dashboard
- Cycle management (create, activate, lock)
- Metrics dashboard:
  - % Reviews completed
  - Overdue reviews
  - Rating distribution
  - Calibration variance
  - High/Low performers
- Bulk operations:
  - Nudge managers
  - Bulk unlock
  - Extend deadlines
  - Force complete

### 12. Review Form Pages
- Dynamic form rendering based on form structure
- Section-wise navigation
- Draft saving
- Validation before submission
- Support for different question types:
  - Rating (scale-based)
  - Text (comments)
  - Dropdown
  - Yes/No

### 13. Calibration Interface
- Team/Department-wise calibration view
- Drag & drop rating adjustments
- Bell curve visualization
- Justification required for overrides
- Distribution analysis
- Audit trail of changes

### 14. Audit Logging
- Integrate with existing audit log system
- Log all appraisal actions:
  - Rating changes
  - Calibration overrides
  - Final outcomes
  - Phase transitions

## Architecture Highlights

### 1. Cycle-Based Design
Each appraisal cycle is independent with its own:
- Configuration (eligibility, review types, rating scale)
- Timeline (phases with start/end dates)
- Participants (auto-enrolled based on eligibility)
- Forms (configurable per cycle)

### 2. Flexible Form Builder
Forms are stored as JSON, allowing:
- Dynamic section creation
- Multiple question types
- Section weightages
- Role/department-specific forms

### 3. Multi-Source Ratings
Ratings can come from:
- Self-review
- Manager review
- Skip-level review
- Peer review
- HR review
- Calibrated (adjusted during calibration)
- Final (post-calibration)

### 4. Calibration Engine
Enterprise-grade calibration with:
- Forced distribution (bell curve)
- Team/department-wise sessions
- Drag & drop adjustments
- Justification tracking
- Audit trail

### 5. Integration Points
- **Goals Module**: Import goals or create during year
- **PIP Module**: Auto-trigger PIP for low performers
- **Org Hierarchy**: Auto-assign managers, skip-level, HRBP
- **Notifications**: Email and in-app notifications

## Next Steps

1. **Run Database Migration**
   ```sql
   source backend-java/database/migrations/create_appraisal_tables.sql
   ```

2. **Test Backend APIs**
   - Create a test cycle
   - Enroll participants
   - Submit reviews
   - Calculate ratings

3. **Implement Frontend**
   - Start with Employee Dashboard
   - Then Manager Dashboard
   - Finally HR/Admin Dashboard

4. **Add Audit Logging**
   - Integrate with existing audit system
   - Log all critical actions

5. **Add Notifications**
   - Phase deadline reminders
   - Review submission notifications
   - Outcome release notifications

## Files Created

### Backend Models
- `AppraisalCycle.java`
- `AppraisalCycleStatus.java`
- `AppraisalParticipant.java`
- `ParticipantStatus.java`
- `ReviewPhase.java`
- `PhaseType.java`
- `AppraisalGoal.java`
- `AppraisalGoalType.java`
- `AppraisalGoalStatus.java`
- `ReviewForm.java`
- `ReviewType.java`
- `ReviewResponse.java`
- `ResponseStatus.java`
- `Rating.java`
- `RatingSource.java`
- `CalibrationSession.java`
- `CalibrationStatus.java`
- `CalibrationAdjustment.java`
- `AppraisalOutcome.java`

### Backend Repositories
- All 10 repositories as listed above

### Backend Services
- `AppraisalCycleService.java`
- `RatingService.java`
- `ReviewFormService.java`

### Backend Controller
- `AppraisalController.java`

### Database
- `create_appraisal_tables.sql`

## Notes

- All timestamps are stored in UTC (following existing pattern)
- JSON columns are used for flexible configuration
- Foreign keys ensure data integrity
- Indexes optimize query performance
- Role-based access control via `@PreAuthorize` annotations

