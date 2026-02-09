/**
 * TABLE-STRICT ALLOCATION ENGINE
 *
 * HARD CONSTRAINTS (NEVER VIOLATED):
 * 1. Same team MUST sit on SAME TABLE
 * 2. Teams never split across tables
 * 3. If team doesn't fit on table → fail gracefully or spill to next table in same POD
 * 4. Never split teams across PODs
 *
 * PRIORITY: Department → Team → Table → Seat
 *
 * ALLOCATION FLOW:
 * 1. Group tables into PODs
 * 2. Pre-allocate tables for each team (bin packing)
 * 3. Allocate seats within assigned tables
 * 4. Leaders sit with their teams (not separate)
 */

import type { ReferenceSeat, EnhancedAllocatedSeat, Table, EnhancedTeam, AllocationMode, Pod } from '../types';
import { SeatStatus } from '../types';
import { getSeatsForTable } from './tableMapping';
import { DEPARTMENTS } from '../data/organizationData';
import { groupTablesIntoPods, getTablesInPod } from './podGrouping';

/**
 * Main allocation function - TABLE-STRICT MODE ONLY
 */
export function allocateWithLeaders(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[],
  _mode: AllocationMode = 'POD_BASED'  // Mode parameter kept for compatibility but not used
): { allocatedSeats: EnhancedAllocatedSeat[]; pods: Pod[] } {

  console.log(`\n🚀 Starting TABLE-STRICT Allocation`);
  console.log(`📊 Total: ${seats.length} seats, ${tables.length} tables, ${teams.length} teams`);

  // Create PODs for visualization and grouping
  const pods = groupTablesIntoPods(tables, 300);

  const allocatedSeats = allocateTableStrict(seats, tables, teams, pods);

  return { allocatedSeats, pods };
}

/**
 * TABLE-STRICT ALLOCATION
 * Hard constraint: Same team → Same table (or contiguous tables in same POD)
 */
function allocateTableStrict(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[],
  pods: Pod[]
): EnhancedAllocatedSeat[] {

  const allocatedSeats: EnhancedAllocatedSeat[] = [];
  const usedSeats = new Set<string>();
  const usedTables = new Set<string>();

  console.log(`\n📦 TABLE-STRICT ALLOCATION`);
  console.log(`Created ${pods.length} PODs`);

  // Log POD details
  pods.forEach(pod => {
    const podTables = getTablesInPod(tables, pod.pod_id);
    const totalCapacity = podTables.reduce((sum, t) => {
      const tableSeats = getSeatsForTable(seats, t.table_id);
      return sum + tableSeats.length;
    }, 0);
    console.log(`  ${pod.pod_id}: ${podTables.length} tables, ${totalCapacity} seats capacity`);
  });

  // STEP 1: Sort teams by size (largest first for better bin packing)
  const sortedTeams = [...teams].sort((a, b) => b.members.length - a.members.length);

  // STEP 2: Group teams by department
  const teamsByDepartment = new Map<string, EnhancedTeam[]>();
  DEPARTMENTS.forEach(dept => {
    const deptTeams = sortedTeams.filter(t => t.department === dept);
    if (deptTeams.length > 0) {
      teamsByDepartment.set(dept, deptTeams);
    }
  });

  console.log(`\n👥 Allocating by Department → Team → Table`);

  // STEP 3: Allocate each department to PODs
  DEPARTMENTS.forEach(department => {
    const deptTeams = teamsByDepartment.get(department);
    if (!deptTeams || deptTeams.length === 0) return;

    const totalSize = deptTeams.reduce((sum, team) => sum + team.members.length, 0);
    console.log(`\n  ${department}: ${deptTeams.length} teams, ${totalSize} people`);

    // Find POD with enough capacity for entire department
    const targetPod = findPodForDepartment(pods, tables, seats, usedSeats, usedTables, totalSize);

    if (!targetPod) {
      console.warn(`  ⚠️ No single POD with capacity for ${department}, using fallback allocation`);
    }

    // Allocate each team in this department
    deptTeams.forEach(team => {
      allocateTeamStrict(
        team,
        seats,
        tables,
        targetPod ? getTablesInPod(tables, targetPod.pod_id).filter(t => !usedTables.has(t.table_id)) : tables.filter(t => !usedTables.has(t.table_id)),
        usedSeats,
        usedTables,
        allocatedSeats
      );
    });
  });

  console.log(`\n✅ TABLE-STRICT Allocation Complete: ${allocatedSeats.length} seats assigned`);

  // Validation: Check that no team is split across multiple tables
  validateAllocation(allocatedSeats);

  return allocatedSeats;
}

/**
 * Find POD with enough capacity for a department
 */
function findPodForDepartment(
  pods: Pod[],
  tables: Table[],
  seats: ReferenceSeat[],
  usedSeats: Set<string>,
  usedTables: Set<string>,
  requiredCapacity: number
): Pod | null {
  for (const pod of pods) {
    const podTables = getTablesInPod(tables, pod.pod_id)
      .filter(t => !usedTables.has(t.table_id));

    const availableCapacity = podTables.reduce((sum, t) => {
      const tableSeats = getSeatsForTable(seats, t.table_id);
      const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));
      return sum + availableSeats.length;
    }, 0);

    if (availableCapacity >= requiredCapacity) {
      console.log(`  ✓ Assigned to ${pod.pod_id} (capacity: ${availableCapacity})`);
      return pod;
    }
  }

  return null;
}

/**
 * ROW-AWARE SEAT SORTING
 * Groups seats by rows (Y-coordinate) and sorts for straight-line allocation
 *
 * PREVENTS L-SHAPED SEATING by filling rows completely before moving to next row
 */
function sortSeatsRowFirst(seats: ReferenceSeat[]): ReferenceSeat[] {
  // Define row tolerance (seats within 20px Y are considered same row)
  const ROW_TOLERANCE = 20;

  // Group seats into rows by Y-coordinate
  const rows = new Map<number, ReferenceSeat[]>();

  seats.forEach(seat => {
    // Round Y to nearest ROW_TOLERANCE to group nearby seats
    const rowKey = Math.round(seat.y / ROW_TOLERANCE) * ROW_TOLERANCE;

    if (!rows.has(rowKey)) {
      rows.set(rowKey, []);
    }
    rows.get(rowKey)!.push(seat);
  });

  // Sort rows by Y-coordinate (top to bottom)
  const sortedRows = Array.from(rows.entries())
    .sort((a, b) => a[0] - b[0]); // Sort by rowKey (Y-coordinate)

  // Within each row, sort seats by X-coordinate (left to right)
  const result: ReferenceSeat[] = [];
  sortedRows.forEach(([_rowKey, rowSeats]) => {
    const sortedRowSeats = rowSeats.sort((a, b) => a.x - b.x);
    result.push(...sortedRowSeats);
  });

  console.log(`    📐 Row-first sorting: ${rows.size} rows detected, ${result.length} seats total`);

  return result;
}

/**
 * Allocate a team to a table (HARD CONSTRAINT: never split team)
 */
function allocateTeamStrict(
  team: EnhancedTeam,
  seats: ReferenceSeat[],
  _tables: Table[],
  availableTables: Table[],
  usedSeats: Set<string>,
  usedTables: Set<string>,
  allocatedSeats: EnhancedAllocatedSeat[]
): void {

  const teamSize = team.members.length;
  console.log(`    ${team.team_name}: ${teamSize} members`);

  // CRITICAL: Find table with enough capacity for ENTIRE team
  let assignedTable: Table | null = null;

  for (const table of availableTables) {
    const tableSeats = getSeatsForTable(seats, table.table_id);
    const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));

    if (availableSeats.length >= teamSize) {
      assignedTable = table;
      break;
    }
  }

  // HARD CONSTRAINT: Never split team
  if (!assignedTable) {
    console.error(`    ❌ CANNOT FIT TEAM ${team.team_name} (${teamSize} members) - NO TABLE WITH CAPACITY`);
    console.error(`       Available tables:`, availableTables.map(t => {
      const tableSeats = getSeatsForTable(seats, t.table_id);
      const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));
      return `${t.table_id}(${availableSeats.length} seats)`;
    }).join(', '));
    return;  // Fail gracefully - don't allocate this team
  }

  // Priority order: LEADER → MANAGER → SUB_MANAGER → EMPLOYEE
  const orderedMembers = [
    ...team.members.filter(m => m.role === 'LEADER'),
    ...team.members.filter(m => m.role === 'MANAGER'),
    ...team.members.filter(m => m.role === 'SUB_MANAGER'),
    ...team.members.filter(m => m.role === 'EMPLOYEE'),
  ];

  // Get available seats on this table
  const tableSeats = getSeatsForTable(seats, assignedTable.table_id);
  const availableSeatsRaw = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));

  // ✅ ROW-AWARE SORTING: Fill rows completely before moving to next row
  // This PREVENTS L-SHAPED SEATING
  const availableSeats = sortSeatsRowFirst(availableSeatsRaw);

  // Allocate all team members to this table
  orderedMembers.forEach((member, index) => {
    if (index >= availableSeats.length) {
      console.error(`    ⚠️ Not enough seats on table ${assignedTable!.table_id} for all team members`);
      return;
    }

    const seat = availableSeats[index];

    allocatedSeats.push({
      seat_ref_id: seat.seat_ref_id,
      x: seat.x,
      y: seat.y,
      seat_type: SeatStatus.ASSIGNABLE,
      employee_id: member.employee_id,
      employee_name: member.name,
      employee_role: member.role,
      employee_gender: member.gender,
      department: team.department,
      table_id: seat.table_id,
      assigned_team: team.team_id,
      assigned_manager: team.team_name,
    });

    usedSeats.add(seat.seat_ref_id);
  });

  // Mark table as used
  usedTables.add(assignedTable.table_id);
  console.log(`    ✅ Assigned to table ${assignedTable.table_id} (${assignedTable.pod_id || 'no-pod'})`);
}

/**
 * Validate that allocation follows TABLE-STRICT rules
 */
function validateAllocation(allocatedSeats: EnhancedAllocatedSeat[]): void {
  console.log(`\n🔍 Validating TABLE-STRICT constraints...`);

  // Group seats by team
  const seatsByTeam = new Map<string, EnhancedAllocatedSeat[]>();
  allocatedSeats.forEach(seat => {
    const teamId = seat.assigned_team;
    if (teamId) {
      if (!seatsByTeam.has(teamId)) {
        seatsByTeam.set(teamId, []);
      }
      seatsByTeam.get(teamId)!.push(seat);
    }
  });

  let violations = 0;

  // Check each team sits on same table
  seatsByTeam.forEach((seats, teamId) => {
    const tableIds = new Set(seats.map(s => s.table_id).filter((id): id is string => id !== undefined));

    if (tableIds.size > 1) {
      violations++;
      console.error(`  ❌ VIOLATION: Team ${teamId} split across ${tableIds.size} tables: ${Array.from(tableIds).join(', ')}`);
    }
  });

  if (violations === 0) {
    console.log(`  ✅ All teams on single tables (no violations)`);
  } else {
    console.error(`  ❌ ${violations} TABLE-STRICT violations found!`);
  }
}
