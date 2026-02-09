-- ============================================================================
-- SPACE ALLOCATION SYSTEM - MySQL Database Schema
-- For future backend integration
-- ============================================================================

-- This schema is designed to support the space allocation system with:
-- - Organizational hierarchy (Leaders, Managers, Sub-managers, Employees)
-- - Floor plans with tables and seats
-- - Allocation configurations and results
-- - Manual overrides and audit trail

-- ============================================================================
-- 1. USER & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'FACILITY_USER', 'EMPLOYEE') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. ORGANIZATIONAL HIERARCHY
-- ============================================================================

CREATE TABLE leaders (
    leader_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leader_preferences (
    preference_id INT PRIMARY KEY AUTO_INCREMENT,
    leader_id VARCHAR(50) NOT NULL,
    preference_type ENUM('NEAR_WINDOW', 'NEAR_ENTRY', 'QUIET_ZONE', 'CORNER_EDGE', 'NEAR_TEAM', 'PREMIUM_SEAT') NOT NULL,
    priority INT DEFAULT 0, -- Higher = more important
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES leaders(leader_id) ON DELETE CASCADE,
    INDEX idx_leader (leader_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE managers (
    manager_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    leader_id VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    team_size INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES leaders(leader_id) ON DELETE CASCADE,
    INDEX idx_leader (leader_id),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sub_managers (
    sub_manager_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    manager_id VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    team_size INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES managers(manager_id) ON DELETE CASCADE,
    INDEX idx_manager (manager_id),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE employees (
    employee_id VARCHAR(50) PRIMARY KEY,
    user_id INT NULL, -- Links to users table if employee has login
    name VARCHAR(255) NOT NULL,
    gender ENUM('M', 'F', 'OTHER') NOT NULL,
    reports_to VARCHAR(50) NOT NULL, -- manager_id or sub_manager_id
    department VARCHAR(100) NOT NULL,
    role ENUM('LEADER', 'MANAGER', 'SUB_MANAGER', 'EMPLOYEE') NOT NULL,
    special_needs BOOLEAN DEFAULT FALSE,
    special_needs_description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_reports_to (reports_to),
    INDEX idx_department (department),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teams (
    team_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    leader_id VARCHAR(50) NOT NULL,
    manager_id VARCHAR(50) NULL,
    sub_manager_id VARCHAR(50) NULL,
    department VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    member_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES leaders(leader_id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES managers(manager_id) ON DELETE SET NULL,
    FOREIGN KEY (sub_manager_id) REFERENCES sub_managers(sub_manager_id) ON DELETE SET NULL,
    INDEX idx_leader (leader_id),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. FLOOR PLANS & PHYSICAL LAYOUT
-- ============================================================================

CREATE TABLE floor_plans (
    floor_plan_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    floor_number INT NOT NULL,
    building_name VARCHAR(255) NULL,
    image_url VARCHAR(500) NOT NULL,
    image_width INT NOT NULL, -- Original image width in pixels
    image_height INT NOT NULL, -- Original image height in pixels
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_floor (floor_number),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tables (
    table_id VARCHAR(50) PRIMARY KEY,
    floor_plan_id INT NOT NULL,
    pod_id VARCHAR(50) NULL, -- POD assignment for clustering
    x INT NOT NULL, -- Top-left corner X (image pixels)
    y INT NOT NULL, -- Top-left corner Y (image pixels)
    width INT NOT NULL, -- Table width (image pixels)
    height INT NOT NULL, -- Table height (image pixels)
    capacity INT NOT NULL, -- Max seats this table can hold
    table_number VARCHAR(50) NULL, -- Physical table number/label
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(floor_plan_id) ON DELETE CASCADE,
    INDEX idx_floor_plan (floor_plan_id),
    INDEX idx_pod (pod_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pods (
    pod_id VARCHAR(50) PRIMARY KEY,
    floor_plan_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    x INT NOT NULL, -- Bounding box X
    y INT NOT NULL, -- Bounding box Y
    width INT NOT NULL, -- Bounding box width
    height INT NOT NULL, -- Bounding box height
    color VARCHAR(7) NULL, -- Optional POD color
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(floor_plan_id) ON DELETE CASCADE,
    INDEX idx_floor_plan (floor_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reference_seats (
    seat_ref_id VARCHAR(50) PRIMARY KEY,
    floor_plan_id INT NOT NULL,
    table_id VARCHAR(50) NULL, -- Assigned table (computed after table mapping)
    x INT NOT NULL, -- Seat position X (image pixels)
    y INT NOT NULL, -- Seat position Y (image pixels)
    -- Seat attributes for preference matching
    near_window BOOLEAN DEFAULT FALSE,
    near_entry BOOLEAN DEFAULT FALSE,
    corner_position BOOLEAN DEFAULT FALSE,
    quiet_zone BOOLEAN DEFAULT FALSE,
    accessible BOOLEAN DEFAULT FALSE, -- For special needs
    premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(floor_plan_id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(table_id) ON DELETE SET NULL,
    INDEX idx_floor_plan (floor_plan_id),
    INDEX idx_table (table_id),
    INDEX idx_attributes (near_window, near_entry, accessible, premium)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. ALLOCATION CONFIGURATION
-- ============================================================================

CREATE TABLE allocation_configs (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    config_name VARCHAR(255) NOT NULL,

    -- 1. ATTENDANCE & CAPACITY CONTROLS
    attendance_mode ENUM('FULL', 'HYBRID_50', 'HYBRID_75', 'CUSTOM') NOT NULL DEFAULT 'FULL',
    attendance_percentage INT NOT NULL DEFAULT 100, -- 0-100 (for CUSTOM mode)
    overbooking_allowed BOOLEAN DEFAULT FALSE,
    overbooking_percentage INT NOT NULL DEFAULT 100, -- e.g., 110 = allow 10% overbooking

    -- 2. BUFFER STRATEGY
    buffer_enabled BOOLEAN DEFAULT FALSE,
    buffer_percentage INT NOT NULL DEFAULT 0, -- e.g., 10 = 10% of total seats remain unassigned
    buffer_scope ENUM('GLOBAL', 'PER_DEPARTMENT', 'PER_POD', 'PER_TABLE') NOT NULL DEFAULT 'GLOBAL',
    buffer_priority ENUM('DISTRIBUTED', 'END_OF_FLOOR', 'BETWEEN_DEPARTMENTS') NOT NULL DEFAULT 'DISTRIBUTED',

    -- 3. ALLOCATION MODE
    allocation_strategy ENUM('POD_BASED', 'TEAM_COHESION', 'MANAGER_PROXIMITY', 'SPACE_EFFICIENCY') NOT NULL DEFAULT 'POD_BASED',
    strict_table_constraint BOOLEAN DEFAULT TRUE, -- Teams never split across tables
    allow_table_spillover BOOLEAN DEFAULT FALSE, -- Allow large teams to use adjacent tables in same POD
    prioritize_department_clustering BOOLEAN DEFAULT TRUE,

    -- 4. OVERRIDE & LOCKING
    allow_manual_override BOOLEAN DEFAULT TRUE,
    override_role ENUM('ADMIN', 'FACILITY_USER', 'BOTH') NOT NULL DEFAULT 'BOTH',
    lock_after_publish BOOLEAN DEFAULT FALSE, -- Lock allocation after publishing
    preserve_locked_seats_on_regenerate BOOLEAN DEFAULT TRUE,

    -- 5. LEADER/PREMIUM PREFERENCES
    leader_priority_enabled BOOLEAN DEFAULT FALSE,
    max_premium_seats_percent INT NOT NULL DEFAULT 0, -- e.g., 20 = max 20% of seats can be premium
    premium_seat_allocation_priority ENUM('LEADER_FIRST', 'SENIORITY_BASED', 'NONE') NOT NULL DEFAULT 'NONE',

    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Join table for leader preference types (many-to-many)
CREATE TABLE config_leader_preferences (
    config_id INT NOT NULL,
    preference_type ENUM('NEAR_WINDOW', 'NEAR_ENTRY', 'QUIET_ZONE', 'CORNER_EDGE', 'NEAR_TEAM') NOT NULL,
    PRIMARY KEY (config_id, preference_type),
    FOREIGN KEY (config_id) REFERENCES allocation_configs(config_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. ALLOCATION RESULTS
-- ============================================================================

CREATE TABLE allocations (
    allocation_id INT PRIMARY KEY AUTO_INCREMENT,
    floor_plan_id INT NOT NULL,
    config_id INT NOT NULL,
    allocation_name VARCHAR(255) NOT NULL,
    generated_by INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    published_by INT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE, -- Only one active allocation per floor plan
    notes TEXT NULL,
    FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(floor_plan_id) ON DELETE CASCADE,
    FOREIGN KEY (config_id) REFERENCES allocation_configs(config_id) ON DELETE RESTRICT,
    FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (published_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_floor_plan (floor_plan_id),
    INDEX idx_published (is_published),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE allocated_seats (
    allocated_seat_id INT PRIMARY KEY AUTO_INCREMENT,
    allocation_id INT NOT NULL,
    seat_ref_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NULL, -- NULL if unassigned (buffer/reserved)
    team_id VARCHAR(50) NULL,
    table_id VARCHAR(50) NULL,
    seat_type ENUM('ASSIGNABLE', 'RESERVED') NOT NULL,
    department VARCHAR(100) NULL,
    x INT NOT NULL, -- Raw image pixel coordinate (from reference)
    y INT NOT NULL, -- Raw image pixel coordinate (from reference)
    is_manual_override BOOLEAN DEFAULT FALSE, -- Track if seat was manually assigned
    is_locked BOOLEAN DEFAULT FALSE, -- Locked seats preserved on regenerate
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (allocation_id) REFERENCES allocations(allocation_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_ref_id) REFERENCES reference_seats(seat_ref_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES tables(table_id) ON DELETE SET NULL,
    INDEX idx_allocation (allocation_id),
    INDEX idx_employee (employee_id),
    INDEX idx_team (team_id),
    INDEX idx_table (table_id),
    UNIQUE KEY unique_seat_per_allocation (allocation_id, seat_ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. MANUAL OVERRIDES & AUDIT TRAIL
-- ============================================================================

CREATE TABLE manual_overrides (
    override_id INT PRIMARY KEY AUTO_INCREMENT,
    allocation_id INT NOT NULL,
    action_type ENUM('SWAP', 'MOVE', 'ASSIGN', 'ADD', 'DELETE') NOT NULL,
    seat_ref_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NULL,
    previous_seat_ref_id VARCHAR(50) NULL,
    previous_employee_id VARCHAR(50) NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NULL,
    FOREIGN KEY (allocation_id) REFERENCES allocations(allocation_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_ref_id) REFERENCES reference_seats(seat_ref_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (previous_seat_ref_id) REFERENCES reference_seats(seat_ref_id) ON DELETE SET NULL,
    FOREIGN KEY (previous_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_allocation (allocation_id),
    INDEX idx_performed_by (performed_by),
    INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. AUDIT LOG (All system changes)
-- ============================================================================

CREATE TABLE audit_log (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- e.g., 'allocation', 'seat', 'team'
    entity_id VARCHAR(100) NULL,
    details JSON NULL, -- Store detailed change information
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. USEFUL VIEWS
-- ============================================================================

-- View: Current active allocation with employee details
CREATE VIEW v_active_allocation AS
SELECT
    a.allocation_id,
    a.allocation_name,
    a.floor_plan_id,
    fp.name as floor_plan_name,
    aseat.allocated_seat_id,
    aseat.seat_ref_id,
    aseat.x,
    aseat.y,
    aseat.seat_type,
    aseat.is_manual_override,
    aseat.is_locked,
    e.employee_id,
    e.name as employee_name,
    e.gender as employee_gender,
    e.role as employee_role,
    e.department,
    t.team_id,
    t.team_name,
    t.color as team_color,
    tbl.table_id,
    tbl.pod_id
FROM allocations a
JOIN floor_plans fp ON a.floor_plan_id = fp.floor_plan_id
JOIN allocated_seats aseat ON a.allocation_id = aseat.allocation_id
LEFT JOIN employees e ON aseat.employee_id = e.employee_id
LEFT JOIN teams t ON aseat.team_id = t.team_id
LEFT JOIN tables tbl ON aseat.table_id = tbl.table_id
WHERE a.is_active = TRUE;

-- View: Team member count and allocation status
CREATE VIEW v_team_summary AS
SELECT
    t.team_id,
    t.team_name,
    t.department,
    t.member_count as total_members,
    COUNT(DISTINCT aseat.allocated_seat_id) as assigned_seats,
    t.member_count - COUNT(DISTINCT aseat.allocated_seat_id) as unassigned_members
FROM teams t
LEFT JOIN allocated_seats aseat ON t.team_id = aseat.team_id
GROUP BY t.team_id, t.team_name, t.department, t.member_count;

-- ============================================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample admin user (password: 'admin123' - bcrypt hashed)
INSERT INTO users (email, password_hash, role, full_name) VALUES
('admin@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'System Administrator');

-- Insert sample floor plan
INSERT INTO floor_plans (name, floor_number, building_name, image_url, image_width, image_height, created_by) VALUES
('Floor 1 - Main Office', 1, 'Headquarters', '/assets/floor-plan.jpg', 1920, 1080, 1);

-- Insert default allocation config
INSERT INTO allocation_configs (
    config_name,
    attendance_mode,
    strict_table_constraint,
    allocation_strategy,
    created_by
) VALUES (
    'Default Configuration',
    'FULL',
    TRUE,
    'POD_BASED',
    1
);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
