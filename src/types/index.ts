/**
 * Type definitions for Space Allocation System V1
 * ROLE-BASED ARCHITECTURE
 */

// User roles
export const UserRole = {
  ADMIN: 'ADMIN',
  FACILITY_USER: 'FACILITY_USER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Seat status types
export const SeatStatus = {
  ASSIGNABLE: 'ASSIGNABLE',
  RESERVED: 'RESERVED',
  BUFFER: 'BUFFER',
} as const;

export type SeatStatus = typeof SeatStatus[keyof typeof SeatStatus];

// Allocation strategies
export const AllocationStrategy = {
  MAX_TEAM_COHESION: 'MAX_TEAM_COHESION',
  MANAGER_PROXIMITY: 'MANAGER_PROXIMITY',
  SPACE_EFFICIENCY: 'SPACE_EFFICIENCY',
} as const;

export type AllocationStrategy = typeof AllocationStrategy[keyof typeof AllocationStrategy];

// NEW: Allocation modes (two distinct approaches)
export const AllocationMode = {
  POD_BASED: 'POD_BASED',           // Allocate entire departments to PODs
  MANAGER_BASED: 'MANAGER_BASED',   // Manager-centric allocation
} as const;

export type AllocationMode = typeof AllocationMode[keyof typeof AllocationMode];

// Table (rectangular block) - ADMIN creates by drawing rectangles
export interface Table {
  table_id: string;
  x: number;  // Top-left corner X
  y: number;  // Top-left corner Y
  width: number;
  height: number;
  capacity: number;  // Max seats this table can hold
  pod_id?: string;  // NEW: POD assignment for clustering
}

// POD (Physical Office Division) - groups of nearby tables
export interface Pod {
  pod_id: string;
  name: string;
  tables: string[];  // table IDs in this POD
  x: number;  // Bounding box
  y: number;
  width: number;
  height: number;
  color?: string;  // Optional color for POD
}

// Seat attributes (for preference matching)
export interface SeatAttributes {
  near_window?: boolean;      // Seat is near a window
  near_entry?: boolean;        // Seat is near entry/exit door
  corner_position?: boolean;   // Seat is in a corner
  quiet_zone?: boolean;        // Seat is in a quiet area
  accessible?: boolean;        // Seat is accessible (for special needs)
  premium?: boolean;           // Premium seat (legacy)
}

// Reference seat (red dot) - ADMIN creates, FACILITY_USER views
export interface ReferenceSeat {
  seat_ref_id: string;
  x: number;  // Raw image pixel coordinate
  y: number;  // Raw image pixel coordinate
  table_id?: string;  // Assigned table (computed after table mapping)
  attributes?: SeatAttributes;  // Seat attributes for preference matching
}

// Allocated seat (green/orange/gray) - computed by allocation logic
export interface AllocatedSeat {
  seat_ref_id: string;
  x: number;  // Raw image pixel coordinate (from reference)
  y: number;  // Raw image pixel coordinate (from reference)
  seat_type: SeatStatus;
  assigned_team?: string;  // team ID
  assigned_manager?: string;  // manager name
}

// Allocation option (multiple strategies)
export interface AllocationOption {
  option_id: string;
  description: string;
  allocations: AllocatedSeat[];
}

// Layout scenario
export interface LayoutScenario {
  scenario_id: string;
  name: string;
  strategy: AllocationStrategy;
  seats: AllocatedSeat[];
  created_at: string;
}

// Seat colors
export const SEAT_COLORS: Record<SeatStatus, string> = {
  [SeatStatus.ASSIGNABLE]: '#4CAF50',  // Green
  [SeatStatus.RESERVED]: '#FF9800',    // Orange
  [SeatStatus.BUFFER]: '#9E9E9E',      // Gray
};

export const REFERENCE_SEAT_COLOR = '#FF0000';  // Red (reference dots)
export const SELECTED_HIGHLIGHT_COLOR = '#2196F3';  // Blue (when selected)

// ============================================================================
// PHASE 1: Enhanced Allocation System Types
// ============================================================================

// Employee roles
export const EmployeeRole = {
  LEADER: 'LEADER',
  MANAGER: 'MANAGER',
  SUB_MANAGER: 'SUB_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type EmployeeRole = typeof EmployeeRole[keyof typeof EmployeeRole];

// Gender
export type Gender = 'M' | 'F';

// Leader preferences (SOFT CONSTRAINTS - allocation tries to satisfy but doesn't guarantee)
export interface LeaderPreferences {
  near_window?: boolean;        // Prefer seats near windows
  near_entry?: boolean;          // Prefer seats near entry/exit
  near_team?: boolean;           // Prefer to sit close to team table
  quiet_zone?: boolean;          // Prefer quieter areas
  corner_edge?: boolean;         // Prefer corner or edge tables
  premium_seat?: boolean;        // Legacy - prefer premium seats
  near_managers?: boolean;       // Legacy - prefer to be near other managers
}

// Leader (top of hierarchy)
export interface Leader {
  leader_id: string;
  name: string;
  department: string;
  preferences: LeaderPreferences;
  color: string;  // Department color
}

// Manager (reports to leader)
export interface Manager {
  manager_id: string;
  name: string;
  leader_id: string;
  department: string;
  team_size: number;  // Including self + direct reports
}

// Sub-Manager (optional, reports to manager)
export interface SubManager {
  sub_manager_id: string;
  name: string;
  manager_id: string;
  department: string;
  team_size: number;  // Including self + direct reports
}

// Employee (reports to sub-manager OR manager)
export interface Employee {
  employee_id: string;
  name: string;
  gender: Gender;
  reports_to: string;  // sub_manager_id OR manager_id
  department: string;
  special_needs: boolean;
  role: EmployeeRole;  // For display purposes
}

// Enhanced Team (formed from hierarchy) - for new allocation system
export interface EnhancedTeam {
  team_id: string;
  team_name: string;
  leader_id: string;
  manager_id?: string;
  sub_manager_id?: string;
  members: Employee[];
  department: string;
  color: string;
}

// Enhanced reference seat (with additional attributes)
export interface EnhancedReferenceSeat extends ReferenceSeat {
  is_premium?: boolean;
  is_window_side?: boolean;
  is_accessible?: boolean;  // For special needs
}

// Enhanced allocated seat (with employee details)
export interface EnhancedAllocatedSeat extends AllocatedSeat {
  employee_id?: string;
  employee_name?: string;
  employee_role?: EmployeeRole;
  employee_gender?: Gender;
  department?: string;
  table_id?: string;
  is_manual_override?: boolean;  // NEW: Track if seat was manually assigned
}

// Manual override action (for undo/redo and persistence)
export interface ManualOverride {
  override_id: string;
  action_type: 'SWAP' | 'MOVE' | 'ASSIGN';
  seat_id: string;
  employee_id: string;
  previous_seat_id?: string;
  previous_employee_id?: string;
  timestamp: number;
}
