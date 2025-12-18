-- =====================================================
-- Query to Fetch All Users
-- =====================================================

-- Basic query: Get all users with essential information
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    department,
    location,
    manager_id,
    hrbp_id,
    is_active,
    created_at,
    updated_at
FROM users
ORDER BY role, last_name, first_name;

-- =====================================================
-- Query with Manager and HRBP names (using JOINs)
-- =====================================================
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.department,
    u.location,
    u.manager_id,
    m.email AS manager_email,
    CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
    u.hrbp_id,
    h.email AS hrbp_email,
    CONCAT(h.first_name, ' ', h.last_name) AS hrbp_name,
    u.is_active,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN users h ON u.hrbp_id = h.id
ORDER BY u.role, u.last_name, u.first_name;

-- =====================================================
-- Query grouped by role with counts
-- =====================================================
SELECT 
    role,
    COUNT(*) AS user_count,
    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS active_count
FROM users
GROUP BY role
ORDER BY role;

-- =====================================================
-- Query for specific role (e.g., all employees)
-- =====================================================
SELECT 
    email,
    first_name,
    last_name,
    department,
    location,
    manager_id,
    hrbp_id
FROM users
WHERE role = 'EMPLOYEE'
ORDER BY last_name, first_name;

-- =====================================================
-- Simple query: Just email and name
-- =====================================================
SELECT 
    email,
    CONCAT(first_name, ' ', last_name) AS full_name,
    role
FROM users
ORDER BY role, last_name;

