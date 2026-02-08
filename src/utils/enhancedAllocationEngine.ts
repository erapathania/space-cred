/**
 * Enhanced Allocation Engine
 *
 * TWO ALLOCATION MODES:
 *
 * MODE A - POD_BASED:
 * - Allocate entire departments to PODs (groups of tables)
 * - Fill tables sequentially within POD
 * - Keep teams intact on same table
 * - Managers sit with their teams
 *
 * MODE B - MANAGER_BASED:
 * - Each manager gets closest possible table
 * - Manager + direct reports sit together
 * - Multiple managers of same department near each other
 *
 * CORE RULES (BOTH MODES):
 * - Leaders allocated FIRST with preference scoring
 * - ONE TEAM → ONE TABLE (never split teams)
 * - Preferences are SOFT (never break team/table integrity)
 * - Special needs employees get accessible seats
 */

import type { ReferenceSeat, EnhancedAllocatedSeat, Table, EnhancedTeam, Leader, AllocationMode, Pod } from '../types';
import { SeatStatus } from '../types';
import { getSeatsForTable } from './tableMapping';
import { LEADERS, DEPARTMENTS } from '../data/organizationData';
import { getTeamsByDepartment } from './teamFormation';
import { groupTablesIntoPods, getTablesInPod } from './podGrouping';

/**
 * Score a seat based on leader preferences (SOFT CONSTRAINTS)
 * Higher score = better match
 * Returns 0 if no preferences, positive score if preferences match
 * 
 * NEW: Uses actual seat attributes instead of coordinate heuristics
 */
function scoreSeatForLeader(
  seat: ReferenceSeat,
  leader: Leader,
  _seats: ReferenceSeat[],
  _tables: Table[]
): number {
  let score = 0;
  const prefs = leader.preferences;
  const attrs = seat.attributes || {};
  
  // No preferences = all seats equally good
  if (!prefs || Object.keys(prefs).length === 0) {
    return 0;
  }
  
  // Match preferences with seat attributes
  // Each matched attribute adds 10 points
  
  if (prefs.near_window && attrs.near_window) {
    score += 10;
  }
  
  if (prefs.near_entry && attrs.near_entry) {
    score += 10;
  }
  
  if (prefs.quiet_zone && attrs.quiet_zone) {
    score += 10;
  }
  
  if (prefs.corner_edge && attrs.corner_position) {
    score += 10;
  }
  
  if (prefs.premium_seat && attrs.premium) {
    score += 5;
  }
  
  // Note: near_team preference requires distance calculation to team tables
  // This is a future enhancement
  
  return score;
}

/**
 * Main allocation function with two modes
 * Returns both allocated seats and PODs
 */
export function allocateWithLeaders(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[],
  mode: AllocationMode = 'POD_BASED'
): { allocatedSeats: EnhancedAllocatedSeat[]; pods: Pod[] } {

  console.log(`\n🚀 Starting Enhanced Allocation - MODE: ${mode}`);
  console.log(`📊 Total: ${seats.length} seats, ${tables.length} tables, ${LEADERS.length} leaders, ${teams.length} teams`);

  // Create PODs for both modes (used for visualization)
  const pods = groupTablesIntoPods(tables, 300);

  if (mode === 'POD_BASED') {
    const allocatedSeats = allocatePodBased(seats, tables, teams);
    return { allocatedSeats, pods };
  } else {
    const allocatedSeats = allocateManagerBased(seats, tables, teams);
    return { allocatedSeats, pods };
  }
}

/**
 * MODE A: POD-BASED ALLOCATION (CLUSTER-FIRST)
 * Allocate entire departments to PODs, fill tables sequentially
 * 
 * STRICT RULES:
 * 1. Same department → same POD (no jumping)
 * 2. Same team → same TABLE (hard constraint)
 * 3. Tables filled contiguously within POD
 * 4. Only overflow when POD capacity exceeded
 */
function allocatePodBased(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[]
): EnhancedAllocatedSeat[] {

  const allocatedSeats: EnhancedAllocatedSeat[] = [];
  const usedSeats = new Set<string>();
  const usedTables = new Set<string>();

  console.log(`\n📦 MODE A: POD-BASED ALLOCATION (CLUSTER-FIRST - STRICT)`);

  // STEP 1: Group tables into PODs (larger radius for better clustering)
  const pods = groupTablesIntoPods(tables, 400); // 400px max distance for better clustering
  console.log(`\nCreated ${pods.length} PODs`);
  
  // Log POD details
  pods.forEach(pod => {
    const podTables = getTablesInPod(tables, pod.pod_id);
    const totalCapacity = podTables.reduce((sum, t) => {
      const tableSeats = getSeatsForTable(seats, t.table_id);
      return sum + tableSeats.length;
    }, 0);
    console.log(`  ${pod.pod_id}: ${podTables.length} tables, ${totalCapacity} seats capacity`);
  });

  // PHASE 1: Allocate Leaders First (with SOFT CONSTRAINT preferences)
  console.log(`\n👑 PHASE 1: Allocating ${LEADERS.length} Leaders (with preference scoring)`);

  LEADERS.forEach(leader => {
    const availableSeats = seats.filter(s => !usedSeats.has(s.seat_ref_id));

    if (availableSeats.length === 0) {
      console.warn(`  No seats available for ${leader.name}`);
      return;
    }

    // Score each seat based on leader preferences
    const scoredSeats = availableSeats.map(seat => ({
      seat,
      score: scoreSeatForLeader(seat, leader, seats, tables),
    }));

    // Sort by score (highest first)
    scoredSeats.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.seat.seat_ref_id.localeCompare(b.seat.seat_ref_id);
    });

    const leaderSeat = scoredSeats[0].seat;
    const preferenceScore = scoredSeats[0].score;

    // Find leader's team for proper team assignment
    const leaderTeam = teams.find(t => t.leader_id === leader.leader_id);
    const teamId = leaderTeam ? leaderTeam.team_id : `LEADER_${leader.leader_id}`;

    allocatedSeats.push({
      seat_ref_id: leaderSeat.seat_ref_id,
      x: leaderSeat.x,
      y: leaderSeat.y,
      seat_type: SeatStatus.ASSIGNABLE,
      employee_id: leader.leader_id,
      employee_name: leader.name,
      employee_role: 'LEADER',
      employee_gender: 'M', // Default
      department: leader.department,
      table_id: leaderSeat.table_id,
      assigned_team: teamId, // Use actual team ID
      assigned_manager: leader.name,
    });

    usedSeats.add(leaderSeat.seat_ref_id);

    const prefStatus = preferenceScore > 0 ? `(score: ${preferenceScore})` : '(no prefs)';
    console.log(`  ${leader.name} (${leader.department}) -> Seat ${leaderSeat.seat_ref_id} ${prefStatus} [Team: ${teamId}]`);
  });

  // PHASE 2: Allocate Departments to PODs (CLUSTER-FIRST)
  console.log(`\n👥 PHASE 2: Allocating Departments to PODs (CLUSTER-FIRST)`);

  DEPARTMENTS.forEach(department => {
    const deptTeams = getTeamsByDepartment(department, teams);

    if (deptTeams.length === 0) return;

    // Calculate total department size
    const totalSize = deptTeams.reduce((sum, team) => sum + team.members.length, 0);

    console.log(`\n  ${department}: ${deptTeams.length} teams, ${totalSize} people`);

    // Find POD with enough capacity
    let selectedPod: Pod | null = null;
    let selectedPodTables: Table[] = [];

    for (const pod of pods) {
      const podTables = getTablesInPod(tables, pod.pod_id)
        .filter(t => !usedTables.has(t.table_id));

      const availableCapacity = podTables.reduce((sum, t) => {
        const tableSeats = getSeatsForTable(seats, t.table_id);
        const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));
        return sum + availableSeats.length;
      }, 0);

      if (availableCapacity >= totalSize) {
        selectedPod = pod;
        selectedPodTables = podTables;
        console.log(`  ✓ Assigned to ${pod.pod_id} (capacity: ${availableCapacity})`);
        break;
      }
    }

    if (!selectedPod) {
      console.warn(`  ⚠️ No POD with enough capacity for ${department}, using fallback`);
      // Fallback: use any available tables
      selectedPodTables = tables.filter(t => !usedTables.has(t.table_id));
    }

    // Sort teams by size (largest first) for better packing
    const sortedTeams = [...deptTeams].sort((a, b) => b.members.length - a.members.length);

    // Allocate each team to tables within the POD
    sortedTeams.forEach(team => {
      allocateTeamToTableInPod(
        team,
        seats,
        selectedPodTables,
        usedSeats,
        usedTables,
        allocatedSeats
      );
    });
  });

  console.log(`\n✅ POD-BASED Allocation Complete: ${allocatedSeats.length} seats assigned`);
  return allocatedSeats;
}

/**
 * Helper: Allocate a team to a table within a POD
 */
function allocateTeamToTableInPod(
  team: EnhancedTeam,
  seats: ReferenceSeat[],
  podTables: Table[],
  usedSeats: Set<string>,
  usedTables: Set<string>,
  allocatedSeats: EnhancedAllocatedSeat[]
): void {

  // Filter out leaders (already allocated in PHASE 1)
  const membersToAllocate = team.members.filter(m => m.role !== 'LEADER');

  // Special needs employees first
  const specialNeedsMembers = membersToAllocate.filter(m => m.special_needs);
  const regularMembers = membersToAllocate.filter(m => !m.special_needs);
  const orderedMembers = [...specialNeedsMembers, ...regularMembers];

  console.log(`    ${team.team_name}: ${membersToAllocate.length} members (excl. leader)`);

  // Find table with enough capacity within this POD
  let assignedTable: Table | null = null;

  for (const table of podTables) {
    if (usedTables.has(table.table_id)) continue;

    const tableSeats = getSeatsForTable(seats, table.table_id);
    const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));

    if (availableSeats.length >= membersToAllocate.length) {
      assignedTable = table;
      break;
    }
  }

  if (!assignedTable) {
    console.warn(`    ⚠️ No table in POD with capacity for ${team.team_name}`);
    return;
  }

  // Assign team to table
  const tableSeats = getSeatsForTable(seats, assignedTable.table_id);
  const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));

  orderedMembers.forEach((member, index) => {
    if (index >= availableSeats.length) return;

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

  usedTables.add(assignedTable.table_id);
  console.log(`    ✅ Assigned to table ${assignedTable.table_id} in ${assignedTable.pod_id} [Team: ${team.team_id}]`);
}

/**
 * MODE B: MANAGER-BASED ALLOCATION
 * Each manager gets closest possible table, managers of same department near each other
 */
function allocateManagerBased(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[]
): EnhancedAllocatedSeat[] {

  const allocatedSeats: EnhancedAllocatedSeat[] = [];
  const usedSeats = new Set<string>();
  const usedTables = new Set<string>();

  console.log(`\n👔 MODE B: MANAGER-BASED ALLOCATION`);

  // PHASE 1: Allocate Leaders First (same as POD-based)
  console.log(`\n👑 PHASE 1: Allocating ${LEADERS.length} Leaders (with preference scoring)`);

  LEADERS.forEach(leader => {
    const availableSeats = seats.filter(s => !usedSeats.has(s.seat_ref_id));

    if (availableSeats.length === 0) {
      console.warn(`  No seats available for ${leader.name}`);
      return;
    }

    const scoredSeats = availableSeats.map(seat => ({
      seat,
      score: scoreSeatForLeader(seat, leader, seats, tables),
    }));

    scoredSeats.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.seat.seat_ref_id.localeCompare(b.seat.seat_ref_id);
    });

    const leaderSeat = scoredSeats[0].seat;
    const preferenceScore = scoredSeats[0].score;

    // Find leader's team for proper team assignment
    const leaderTeam = teams.find(t => t.leader_id === leader.leader_id);
    const teamId = leaderTeam ? leaderTeam.team_id : `LEADER_${leader.leader_id}`;

    allocatedSeats.push({
      seat_ref_id: leaderSeat.seat_ref_id,
      x: leaderSeat.x,
      y: leaderSeat.y,
      seat_type: SeatStatus.ASSIGNABLE,
      employee_id: leader.leader_id,
      employee_name: leader.name,
      employee_role: 'LEADER',
      employee_gender: 'M',
      department: leader.department,
      table_id: leaderSeat.table_id,
      assigned_team: teamId, // Use actual team ID
      assigned_manager: leader.name,
    });

    usedSeats.add(leaderSeat.seat_ref_id);

    const prefStatus = preferenceScore > 0 ? `(score: ${preferenceScore})` : '(no prefs)';
    console.log(`  ${leader.name} (${leader.department}) -> Seat ${leaderSeat.seat_ref_id} ${prefStatus} [Team: ${teamId}]`);
  });

  // PHASE 2: Allocate Teams by Manager Proximity
  console.log(`\n👥 PHASE 2: Allocating Teams by Manager Proximity`);

  // Group teams by department
  DEPARTMENTS.forEach(department => {
    const deptTeams = getTeamsByDepartment(department, teams);
    console.log(`\n  ${department}: ${deptTeams.length} teams`);

    deptTeams.forEach(team => {
      allocateTeamToTable(team, seats, tables, usedSeats, usedTables, allocatedSeats);
    });
  });

  console.log(`\n✅ MANAGER-BASED Allocation Complete: ${allocatedSeats.length} seats assigned`);
  return allocatedSeats;
}

/**
 * Helper: Allocate a team to a table (used by both modes)
 */
function allocateTeamToTable(
  team: EnhancedTeam,
  seats: ReferenceSeat[],
  tables: Table[],
  usedSeats: Set<string>,
  usedTables: Set<string>,
  allocatedSeats: EnhancedAllocatedSeat[]
): void {

  // Filter out leaders (already allocated in PHASE 1)
  const membersToAllocate = team.members.filter(m => m.role !== 'LEADER');

  // Special needs employees first
  const specialNeedsMembers = membersToAllocate.filter(m => m.special_needs);
  const regularMembers = membersToAllocate.filter(m => !m.special_needs);
  const orderedMembers = [...specialNeedsMembers, ...regularMembers];

  console.log(`    ${team.team_name}: ${membersToAllocate.length} members (excl. leader)`);

  // Find table with enough capacity
  let assignedTable: Table | null = null;

  for (const table of tables) {
    if (usedTables.has(table.table_id)) continue;

    const tableSeats = getSeatsForTable(seats, table.table_id);
    const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));

    if (availableSeats.length >= membersToAllocate.length) {
      assignedTable = table;
      break;
    }
  }

  if (!assignedTable) {
    console.warn(`    ⚠️ No table with capacity for ${team.team_name}`);

    // Fallback: Assign to any available seats
    orderedMembers.forEach(member => {
      const seat = seats.find(s => !usedSeats.has(s.seat_ref_id));

      if (seat) {
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
      }
    });

    return;
  }

  // Assign team to table
  const tableSeats = getSeatsForTable(seats, assignedTable.table_id);
  const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));

  orderedMembers.forEach((member, index) => {
    if (index >= availableSeats.length) return;

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

  usedTables.add(assignedTable.table_id);
  console.log(`    ✅ Assigned to table ${assignedTable.table_id}`);
}
