# JPA Entity Mapping Examples

This document shows how to properly map Java entities to MySQL tables using JPA/Hibernate annotations.

---

## User Entity (Complete Example)

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_role", columnList = "role"),
    @Index(name = "idx_manager_id", columnList = "manager_id"),
    @Index(name = "idx_hrbp_id", columnList = "hrbp_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "location", length = 100)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", foreignKey = @ForeignKey(name = "fk_user_manager"))
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hrbp_id", foreignKey = @ForeignKey(name = "fk_user_hrbp"))
    private User hrbp;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

---

## PIP Entity (With Relationships)

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pips", indexes = {
    @Index(name = "idx_employee_id", columnList = "employee_id"),
    @Index(name = "idx_manager_id", columnList = "manager_id"),
    @Index(name = "idx_hrbp_id", columnList = "hrbp_id"),
    @Index(name = "idx_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIP {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_pip_employee"))
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_pip_manager"))
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hrbp_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_pip_hrbp"))
    private User hrbp;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "supporting_documents", columnDefinition = "TEXT")
    private String supportingDocuments; // JSON array as string

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Goal> goals;

    @Embedded
    private PIPTimeline timeline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PIPStatus status;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PIPStep> steps;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CheckIn> checkIns;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_outcome", length = 30)
    private FinalOutcome finalOutcome;

    @Column(name = "final_remarks", columnDefinition = "TEXT")
    private String finalRemarks;

    @Column(name = "locked", nullable = false)
    private Boolean locked = false;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        version++;
    }
}
```

---

## Goal Entity (Many-to-One Relationship)

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "goals", indexes = {
    @Index(name = "idx_pip_id", columnList = "pip_id"),
    @Index(name = "idx_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Goal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_goal_pip"))
    @JsonIgnore
    private PIP pip;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "weightage", nullable = false, precision = 5, scale = 2)
    private Double weightage;

    @Column(name = "expected_outcome", columnDefinition = "TEXT")
    private String expectedOutcome;

    @Column(name = "target_timeline", length = 100)
    private String targetTimeline;

    @Column(name = "deadline")
    private java.time.LocalDate deadline;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "employee_attachments", columnDefinition = "TEXT")
    private String employeeAttachments; // JSON array as string

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private GoalStatus status = GoalStatus.NOT_ACHIEVED;

    @Column(name = "manager_comments", columnDefinition = "TEXT")
    private String managerComments;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
```

---

## PIPTimeline (Embeddable)

```java
package com.pip.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIPTimeline {
    
    @Column(name = "employee_acknowledgement_deadline")
    private java.time.LocalDate employeeAcknowledgementDeadline;

    @Column(name = "pip_active_duration")
    private Integer pipActiveDuration; // days

    @Column(name = "employee_self_review_deadline")
    private java.time.LocalDate employeeSelfReviewDeadline;

    @Column(name = "manager_final_review_deadline")
    private java.time.LocalDate managerFinalReviewDeadline;

    @Column(name = "hrbp_final_decision_deadline")
    private java.time.LocalDate hrbpFinalDecisionDeadline;

    @Column(name = "grace_period")
    private Integer gracePeriod; // days
}
```

---

## PIPStep Entity

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "pip_steps", 
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_pip_step", 
                           columnNames = {"pip_id", "step"})
       },
       indexes = {
           @Index(name = "idx_pip_id", columnList = "pip_id"),
           @Index(name = "idx_step", columnList = "step"),
           @Index(name = "idx_status", columnList = "status"),
           @Index(name = "idx_due_date", columnList = "due_date")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PIPStep {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id", nullable = false, insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_step_pip"))
    @JsonIgnore
    private PIP pip;

    @Column(name = "pip_id", nullable = false, length = 36)
    private String pipId;

    @Enumerated(EnumType.STRING)
    @Column(name = "step", nullable = false, length = 30)
    private StepName step;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StepStatus status;

    @Column(name = "due_date", nullable = false)
    private java.time.LocalDate dueDate;

    @Column(name = "completed_date")
    private java.time.LocalDate completedDate;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_by",
                foreignKey = @ForeignKey(name = "fk_step_signed_by"))
    private User signedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
```

---

## CheckIn Entity

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "check_ins", indexes = {
    @Index(name = "idx_pip_id", columnList = "pip_id"),
    @Index(name = "idx_date", columnList = "date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckIn {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id", nullable = false, insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_checkin_pip"))
    @JsonIgnore
    private PIP pip;

    @Column(name = "pip_id", nullable = false, length = 36)
    private String pipId;

    @Column(name = "date", nullable = false)
    private java.time.LocalDate date;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments; // JSON array as string

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
```

---

## Key Annotation Explanations

### @Entity
- Marks class as a JPA entity
- Must have a no-arg constructor
- Should implement Serializable (optional)

### @Table
- Maps entity to database table
- `name`: Table name (defaults to class name)
- `indexes`: Define database indexes
- `uniqueConstraints`: Define unique constraints

### @Id
- Marks field as primary key
- Required for all entities

### @GeneratedValue
- `GenerationType.UUID`: Generate UUID strings
- `GenerationType.IDENTITY`: Auto-increment (for BIGINT)
- `GenerationType.SEQUENCE`: Use database sequence

### @Column
- `name`: Column name (defaults to field name)
- `nullable`: Whether column can be NULL
- `unique`: Whether column is unique
- `length`: Maximum length for VARCHAR
- `precision`, `scale`: For DECIMAL types
- `columnDefinition`: Custom column definition (e.g., "TEXT")

### @ManyToOne
- Many entities reference one entity
- Default fetch: EAGER (change to LAZY for performance)
- `cascade`: Operations to cascade (usually none for ManyToOne)

### @OneToMany
- One entity has many related entities
- `mappedBy`: Field name in the other entity
- `cascade`: Usually ALL for parent-child relationships
- `orphanRemoval`: Remove children when removed from collection

### @Embedded / @Embeddable
- Embed one entity into another
- No separate table for embedded entity
- Columns are in the parent table

### @Enumerated
- `EnumType.STRING`: Store as string (recommended)
- `EnumType.ORDINAL`: Store as number (not recommended)

### @Version
- Optimistic locking
- Automatically incremented on update
- Prevents concurrent modification conflicts

### @PrePersist / @PreUpdate
- Lifecycle callbacks
- Execute before insert/update
- Useful for setting timestamps

---

## Best Practices

1. **Always use LAZY fetching for relationships**
   ```java
   @ManyToOne(fetch = FetchType.LAZY)
   ```

2. **Use @JsonIgnore to prevent circular references**
   ```java
   @ManyToOne(fetch = FetchType.LAZY)
   @JsonIgnore
   private PIP pip;
   ```

3. **Define indexes for frequently queried columns**
   ```java
   @Table(name = "users", indexes = {
       @Index(name = "idx_email", columnList = "email")
   })
   ```

4. **Use appropriate data types**
   - `LocalDate` for dates
   - `LocalDateTime` for timestamps
   - `String` with length for text
   - `TEXT` for long content

5. **Handle cascading carefully**
   - Use `CascadeType.ALL` only for parent-child relationships
   - Avoid cascading on ManyToOne relationships

6. **Use @Version for optimistic locking**
   ```java
   @Version
   private Integer version;
   ```

---

*Last Updated: 2024*
