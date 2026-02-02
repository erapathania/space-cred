/**
 * Table-First Allocation Engine
 * 
 * CRITICAL RULES:
 * 1. Teams sit on SAME table (never split)
 * 2. Department → Zone → Table → Team → Seat hierarchy
 * 3. NO buffer logic
 * 4. Table capacity must be >= team size
 */

import type { ReferenceSeat, AllocatedSeat, Table } from '../types';
import type { Team } from '../data/teams';
import { SeatStatus } from '../types';
import { getSeatsForTable } from './tableMapping';
import { getTeamsByDepartment, getDepartments } from '../data/teams';

interface TableAllocation {
  table_id: string;
  team_id: string;
  seats: ReferenceSeat[];
}

/**
 * Allocate teams to tables (table-first approach)
 */
export function allocateByTables(
  seats: ReferenceSeat[],  // Must have table_id assigned
  tables: Table[],
  teams: Team[]
): AllocatedSeat[] {
  
  const allocatedSeats: AllocatedSeat[] = [];
  const usedTables = new Set<string>();
  const allocations: TableAllocation[] = [];

  // Get all departments
  const departments = getDepartments();
  
  console.log(`🏢 Allocating ${teams.length} teams across ${tables.length} tables`);
  console.log(`📊 Departments: ${departments.join(', ')}`);

  // Process each department
  for (const department of departments) {
    const deptTeams = getTeamsByDepartment(department);
    console.log(`\n🔷 Department: ${department} (${deptTeams.length} teams)`);

    // Process each team in department
    for (const team of deptTeams) {
      console.log(`  👥 Team: ${team.team_name} (size: ${team.team_size})`);

      // Find available table with enough capacity
      let assignedTable: Table | null = null;
      
      for (const table of tables) {
        if (usedTables.has(table.table_id)) continue;

        const tableSeats = getSeatsForTable(seats, table.table_id);
        
        if (tableSeats.length >= team.team_size) {
          assignedTable = table;
          break;
        }
      }

      if (!assignedTable) {
        console.warn(`  ⚠️ No available table for team ${team.team_name}`);
        continue;
      }

      // Get seats for this table
      const tableSeats = getSeatsForTable(seats, assignedTable.table_id);
      const teamSeats = tableSeats.slice(0, team.team_size);

      // Mark table as used
      usedTables.add(assignedTable.table_id);

      // Create allocation
      allocations.push({
        table_id: assignedTable.table_id,
        team_id: team.team_id,
        seats: teamSeats,
      });

      console.log(`  ✅ Assigned to table ${assignedTable.table_id} (${teamSeats.length} seats)`);

      // Convert to AllocatedSeat
      teamSeats.forEach(seat => {
        allocatedSeats.push({
          seat_ref_id: seat.seat_ref_id,
          x: seat.x,
          y: seat.y,
          seat_type: SeatStatus.ASSIGNABLE,
          assigned_team: team.team_id,
          assigned_manager: team.manager,
        });
      });
    }
  }

  console.log(`\n✅ Allocation complete: ${allocatedSeats.length} seats assigned`);
  console.log(`📋 Tables used: ${usedTables.size}/${tables.length}`);

  return allocatedSeats;
}

/**
 * Generate allocation options (simplified - just one strategy now)
 */
export function generateTableBasedOptions(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: Team[]
) {
  const allocations = allocateByTables(seats, tables, teams);

  return [
    {
      option_id: 'A',
      description: 'Table-Based Allocation (Teams sit together)',
      allocations,
    },
  ];
}
