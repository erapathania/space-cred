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

// Reference seat (red dot) - ADMIN creates, FACILITY_USER views
export interface ReferenceSeat {
  seat_ref_id: string;
  x: number;  // Raw image pixel coordinate
  y: number;  // Raw image pixel coordinate
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
