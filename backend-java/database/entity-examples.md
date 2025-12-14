# JPA Entity Mapping Examples

## Overview

This document shows how to properly map Java entities to MySQL tables using JPA/Hibernate annotations.

## Complete Entity Examples

### User Entity (Updated for MySQL)

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

### PIP Entity (Updated for MySQL)

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
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "created_at")
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

### Goal Entity (Updated for MySQL)

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals", indexes = {
    @Index(name = "idx_pip_id", columnList = "pip_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_deadline", columnList = "deadline")
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

    @Column(name = "expected_outcome", length = 500)
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
    @Column(name = "status", length = 30)
    private GoalStatus status = GoalStatus.NOT_ACHIEVED;

    @Column(name = "manager_comments", columnDefinition = "TEXT")
    private String managerComments;

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

### AuditLog Entity (New)

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_action", columnList = "action"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_audit_user"))
    private User user;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "old_values", columnDefinition = "JSON")
    private String oldValues; // JSON string

    @Column(name = "new_values", columnDefinition = "JSON")
    private String newValues; // JSON string

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### Notification Entity (New)

```java
package com.pip.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_read", columnList = "read"),
    @Index(name = "idx_user_read", columnList = "user_id, read"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_notification_user"))
    private User user;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "type", length = 50)
    private String type = "INFO";

    @Column(name = "read", nullable = false)
    private Boolean read = false;

    @Column(name = "action_url", length = 500)
    private String actionUrl;

    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;

    @Column(name = "related_entity_id", length = 36)
    private String relatedEntityId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

## Relationship Annotations Explained

### @OneToMany

```java
@OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Goal> goals;
```

- **mappedBy**: Field in the other entity that owns the relationship
- **cascade**: Operations cascade to related entities
- **orphanRemoval**: Remove related entities when parent is removed

### @ManyToOne

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "pip_id", nullable = false)
private PIP pip;
```

- **fetch = LAZY**: Load related entity only when accessed
- **@JoinColumn**: Specifies the foreign key column

### @Embedded

```java
@Embedded
private PIPTimeline timeline;
```

- Used for value objects that are stored in the same table
- Fields from `PIPTimeline` are stored directly in `pips` table

## Best Practices

1. **Always use @Index** for frequently queried columns
2. **Use LAZY fetching** for @ManyToOne and @OneToMany to avoid N+1 queries
3. **Use @Version** for optimistic locking
4. **Use @PrePersist and @PreUpdate** for automatic timestamp management
5. **Specify column lengths** to match database schema
6. **Use @ForeignKey** to name foreign key constraints
7. **Use @JsonIgnore** on bidirectional relationships to avoid circular references
