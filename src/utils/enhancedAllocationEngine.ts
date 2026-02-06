/**
 * Enhanced Allocation Engine
 * 
 * ALLOCATION PRIORITY:
 * 1. Leaders (with SOFT CONSTRAINT preferences)
 * 2. Teams (ONE TEAM → ONE TABLE, table-first)
 * 3. Special needs employees (accessible seats)
 * 
 * RULES:
 * - Leaders allocated FIRST with preference scoring
 * - Preferences are SOFT - never break team/table integrity
 * - Teams sit together on same table
 * - Department zones maintained
 * - Gender and role tracked for UI
 */

import type { ReferenceSeat, EnhancedAllocatedSeat, Table, EnhancedTeam, Leader, Employee, LeaderPreferences } from '../types';
import { SeatStatus } from '../types';
import { getSeatsForTable } from './tableMapping';
import { LEADERS, DEPARTMENTS } from '../data/organizationData';
import { getTeamsByDepartment } from './teamFormation';

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
  seats: ReferenceSeat[],
  tables: Table[]
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
 * Main allocation function with leader-first approach
 */
export function allocateWithLeaders(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[]
): EnhancedAllocatedSeat[] {
  
  const allocatedSeats: EnhancedAllocatedSeat[] = [];
  const usedSeats = new Set<string>();
  const usedTables = new Set<string>();
  
  console.log(`\n🚀 Starting Enhanced Allocation`);
  console.log(`📊 Total: ${seats.length} seats, ${tables.length} tables, ${LEADERS.length} leaders, ${teams.length} teams`);
  
  // PHASE 1: Allocate Leaders First (with SOFT CONSTRAINT preferences)
  console.log(`\n👑 PHASE 1: Allocating ${LEADERS.length} Leaders (with preference scoring)`);
  
  LEADERS.forEach(leader => {
    // Get all available seats
    const availableSeats = seats.filter(s => !usedSeats.has(s.seat_ref_id));
    
    if (availableSeats.length === 0) {
      console.warn(`  ⚠️ No seats available for ${leader.name}`);
      return;
    }
    
    // Score each seat based on leader preferences
    const scoredSeats = availableSeats.map(seat => ({
      seat,
      score: scoreSeatForLeader(seat, leader, seats, tables),
    }));
    
    // Sort by score (highest first), then by seat_ref_id for consistency
    scoredSeats.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.seat.seat_ref_id.localeCompare(b.seat.seat_ref_id);
    });
    
    // Pick the best seat
    const leaderSeat = scoredSeats[0].seat;
    const preferenceScore = scoredSeats[0].score;
    
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
      assigned_team: `LEADER_${leader.leader_id}`,
      assigned_manager: leader.name,
    });
    
    usedSeats.add(leaderSeat.seat_ref_id);
    
    const prefStatus = preferenceScore > 0 ? `✓ (score: ${preferenceScore})` : '(no prefs)';
    console.log(`  ⭐ ${leader.name} (${leader.department}) → Seat ${leaderSeat.seat_ref_id} ${prefStatus}`);
  });
  
  // PHASE 2: Allocate Teams (table-first, sorted by size)
  console.log(`\n👥 PHASE 2: Allocating ${teams.length} Teams`);
  
  DEPARTMENTS.forEach(department => {
    const deptTeams = getTeamsByDepartment(department, teams);
    
    // Sort teams by size (largest first)
    const sortedTeams = [...deptTeams].sort((a, b) => b.members.length - a.members.length);
    
    console.log(`\n  🔷 ${department}: ${sortedTeams.length} teams`);
    
    sortedTeams.forEach(team => {
      // Special needs employees first
      const specialNeedsMembers = team.members.filter(m => m.special_needs);
      const regularMembers = team.members.filter(m => !m.special_needs);
      const orderedMembers = [...specialNeedsMembers, ...regularMembers];
      
      console.log(`    📋 ${team.team_name}: ${team.members.length} members`);
      
      // Find table with enough capacity
      let assignedTable: Table | null = null;
      
      for (const table of tables) {
        if (usedTables.has(table.table_id)) continue;
        
        const tableSeats = getSeatsForTable(seats, table.table_id);
        const availableSeats = tableSeats.filter(s => !usedSeats.has(s.seat_ref_id));
        
        if (availableSeats.length >= team.members.length) {
          assignedTable = table;
          break;
        }
      }
      
      if (!assignedTable) {
        console.warn(`    ⚠️ No table with capacity for ${team.team_name}, using fallback`);
        
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
    });
  });
  
  console.log(`\n✅ Allocation Complete: ${allocatedSeats.length} seats assigned`);
  console.log(`📊 Leaders: ${LEADERS.length}, Team Members: ${allocatedSeats.length - LEADERS.length}`);
  
  return allocatedSeats;
}
