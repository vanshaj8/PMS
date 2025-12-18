# Employee-Manager-HRBP Relationship Mapping

## Complete Relationship Structure for PIP Management

All **11 employees** are now mapped to exactly **one Manager** and **one HRBP** for PIP purposes.

---

## Employee → Manager → HRBP Mappings

| Employee | Manager | HRBP |
|----------|---------|------|
| **Alex Miller** (alex.miller@pip.com) | Sarah Chen | Patricia Martinez |
| **Sam Davis** (sam.davis@pip.com) | Michael Rodriguez | Patricia Martinez |
| **Jordan Garcia** (jordan.garcia@pip.com) | Emily Johnson | Richard Taylor |
| **Taylor Rodriguez** (taylor.rodriguez@pip.com) | David Kumar | Richard Taylor |
| **Riley Martinez** (riley.martinez@pip.com) | Sarah Chen | Susan Thomas |
| **Casey Lopez** (casey.lopez@pip.com) | Jennifer Lee | Susan Thomas |
| **Morgan Gonzalez** (morgan.gonzalez@pip.com) | Emily Johnson | Joseph Jackson |
| **Cameron Lee** (cameron.lee@pip.com) | Michael Rodriguez | Joseph Jackson |
| **Avery Kim** (avery.kim@pip.com) | David Kumar | Jessica White |
| **Quinn Nguyen** (quinn.nguyen@pip.com) | Jennifer Lee | Jessica White |
| **Employee User** (employee@pip.com) | Manager User | HRBP User |

---

## Manager Distribution

| Manager | Number of Employees | Employees |
|---------|-------------------|-----------|
| **Sarah Chen** | 2 | Alex Miller, Riley Martinez |
| **Michael Rodriguez** | 2 | Sam Davis, Cameron Lee |
| **Emily Johnson** | 2 | Jordan Garcia, Morgan Gonzalez |
| **David Kumar** | 2 | Taylor Rodriguez, Avery Kim |
| **Jennifer Lee** | 2 | Casey Lopez, Quinn Nguyen |
| **Manager User** (default) | 1 | Employee User |

---

## HRBP Distribution

| HRBP | Number of Employees | Employees |
|------|-------------------|-----------|
| **Patricia Martinez** | 2 | Alex Miller, Sam Davis |
| **Richard Taylor** | 2 | Jordan Garcia, Taylor Rodriguez |
| **Susan Thomas** | 2 | Riley Martinez, Casey Lopez |
| **Joseph Jackson** | 2 | Morgan Gonzalez, Cameron Lee |
| **Jessica White** | 2 | Avery Kim, Quinn Nguyen |
| **HRBP User** (default) | 1 | Employee User |

---

## SQL Query to View All Relationships

```sql
SELECT 
    u.email as employee_email,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    u.department as employee_department,
    m.email as manager_email,
    CONCAT(m.first_name, ' ', m.last_name) as manager_name,
    h.email as hrbp_email,
    CONCAT(h.first_name, ' ', h.last_name) as hrbp_name
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN users h ON u.hrbp_id = h.id
WHERE u.role = 'EMPLOYEE'
ORDER BY u.last_name;
```

---

## Verification Query

```sql
-- Check that all employees have both manager and HRBP
SELECT 
    COUNT(*) as total_employees,
    COUNT(manager_id) as with_manager,
    COUNT(hrbp_id) as with_hrbp,
    COUNT(CASE WHEN manager_id IS NULL OR hrbp_id IS NULL THEN 1 END) as missing_relationships
FROM users 
WHERE role = 'EMPLOYEE';
```

**Expected Result:** All counts should be 11, with 0 missing relationships.

---

## Notes

- ✅ **100% Coverage**: All 11 employees have both a Manager and HRBP assigned
- ✅ **Balanced Distribution**: Employees are evenly distributed across managers and HRBPs
- ✅ **PIP Ready**: Each employee can now have PIPs created with their assigned Manager and HRBP
- ✅ **Database Integrity**: All foreign key relationships are properly maintained

---

## Last Updated
December 18, 2025

