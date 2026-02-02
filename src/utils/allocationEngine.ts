/**
 * Seat Allocation Engine
 * Generates seating layouts for teams using rule-based logic
 * 
 * DO NOT modify reference seat coordinates
 * DO NOT use LLM
 * Keep logic simple and readable
 */

import type { ReferenceSeat, AllocatedSeat, AllocationOption } from '../types';
import { SeatStatus } from '../types';
import type { Team } from '../data/teams';

// Calculate Euclidean distance between two points
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * OPTION A: Team Cohesion
 * Teams sit together in closest possible cluster
 */
export function generateTeamCohesionLayout(
  referenceSeats: ReferenceSeat[],
  teams: Team[]
): AllocationOption {
  const allocations: AllocatedSeat[] = [];
  const availableSeats = [...referenceSeats];
  
  // Sort teams by size (largest first)
  const sortedTeams = [...teams].sort((a, b) => b.team_size - a.team_size);
  
  for (const team of sortedTeams) {
    if (availableSeats.length === 0) break;
    
    // Pick first available seat as anchor
    const anchorSeat = availableSeats.shift()!;
    
    // Assign anchor seat
    allocations.push({
      seat_ref_id: anchorSeat.seat_ref_id,
      x: anchorSeat.x,
      y: anchorSeat.y,
      seat_type: SeatStatus.ASSIGNABLE,
      assigned_team: team.team_id,
      assigned_manager: team.manager,
    });
    
    // Find remaining seats closest to anchor
    for (let i = 1; i < team.team_size; i++) {
      if (availableSeats.length === 0) break;
      
      // Find closest seat to anchor
      let closestSeat = availableSeats[0];
      let minDist = distance(anchorSeat.x, anchorSeat.y, closestSeat.x, closestSeat.y);
      let closestIndex = 0;
      
      for (let j = 1; j < availableSeats.length; j++) {
        const seat = availableSeats[j];
        const dist = distance(anchorSeat.x, anchorSeat.y, seat.x, seat.y);
        if (dist < minDist) {
          minDist = dist;
          closestSeat = seat;
          closestIndex = j;
        }
      }
      
      availableSeats.splice(closestIndex, 1);
      
      allocations.push({
        seat_ref_id: closestSeat.seat_ref_id,
        x: closestSeat.x,
        y: closestSeat.y,
        seat_type: SeatStatus.ASSIGNABLE,
        assigned_team: team.team_id,
        assigned_manager: team.manager,
      });
    }
  }
  
  // Mark remaining seats as BUFFER
  for (const seat of availableSeats) {
    allocations.push({
      seat_ref_id: seat.seat_ref_id,
      x: seat.x,
      y: seat.y,
      seat_type: SeatStatus.BUFFER,
    });
  }
  
  return {
    option_id: 'A',
    description: 'Team Cohesion - Teams sit together in closest clusters',
    allocations,
  };
}

/**
 * OPTION B: Manager Proximity
 * Manager placed centrally, team surrounds manager
 */
export function generateManagerProximityLayout(
  referenceSeats: ReferenceSeat[],
  teams: Team[]
): AllocationOption {
  const allocations: AllocatedSeat[] = [];
  const availableSeats = [...referenceSeats];
  
  // Sort teams by size (smallest first for better distribution)
  const sortedTeams = [...teams].sort((a, b) => a.team_size - b.team_size);
  
  for (const team of sortedTeams) {
    if (availableSeats.length === 0) break;
    
    // Find center-most available seat for manager
    const centerX = availableSeats.reduce((sum, s) => sum + s.x, 0) / availableSeats.length;
    const centerY = availableSeats.reduce((sum, s) => sum + s.y, 0) / availableSeats.length;
    
    let managerSeat = availableSeats[0];
    let minDistToCenter = distance(managerSeat.x, managerSeat.y, centerX, centerY);
    let managerIndex = 0;
    
    for (let i = 1; i < availableSeats.length; i++) {
      const seat = availableSeats[i];
      const dist = distance(seat.x, seat.y, centerX, centerY);
      if (dist < minDistToCenter) {
        minDistToCenter = dist;
        managerSeat = seat;
        managerIndex = i;
      }
    }
    
    availableSeats.splice(managerIndex, 1);
    
    // Assign manager seat
    allocations.push({
      seat_ref_id: managerSeat.seat_ref_id,
      x: managerSeat.x,
      y: managerSeat.y,
      seat_type: SeatStatus.ASSIGNABLE,
      assigned_team: team.team_id,
      assigned_manager: team.manager,
    });
    
    // Assign team members around manager
    for (let i = 1; i < team.team_size; i++) {
      if (availableSeats.length === 0) break;
      
      // Find closest seat to manager
      let closestSeat = availableSeats[0];
      let minDist = distance(managerSeat.x, managerSeat.y, closestSeat.x, closestSeat.y);
      let closestIndex = 0;
      
      for (let j = 1; j < availableSeats.length; j++) {
        const seat = availableSeats[j];
        const dist = distance(managerSeat.x, managerSeat.y, seat.x, seat.y);
        if (dist < minDist) {
          minDist = dist;
          closestSeat = seat;
          closestIndex = j;
        }
      }
      
      availableSeats.splice(closestIndex, 1);
      
      allocations.push({
        seat_ref_id: closestSeat.seat_ref_id,
        x: closestSeat.x,
        y: closestSeat.y,
        seat_type: SeatStatus.ASSIGNABLE,
        assigned_team: team.team_id,
        assigned_manager: team.manager,
      });
    }
  }
  
  // Mark remaining seats as BUFFER
  for (const seat of availableSeats) {
    allocations.push({
      seat_ref_id: seat.seat_ref_id,
      x: seat.x,
      y: seat.y,
      seat_type: SeatStatus.BUFFER,
    });
  }
  
  return {
    option_id: 'B',
    description: 'Manager Proximity - Managers central, teams surround them',
    allocations,
  };
}

/**
 * OPTION C: Space Efficiency
 * Pack teams tightly, maximize buffer seats
 */
export function generateSpaceEfficiencyLayout(
  referenceSeats: ReferenceSeat[],
  teams: Team[]
): AllocationOption {
  const allocations: AllocatedSeat[] = [];
  
  // Sort seats by position (left to right, top to bottom)
  const sortedSeats = [...referenceSeats].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 50) {
      return a.x - b.x; // Same row, sort by X
    }
    return a.y - b.y; // Different rows, sort by Y
  });
  
  // Sort teams by size (smallest first for tight packing)
  const sortedTeams = [...teams].sort((a, b) => a.team_size - b.team_size);
  
  let seatIndex = 0;
  
  for (const team of sortedTeams) {
    for (let i = 0; i < team.team_size; i++) {
      if (seatIndex >= sortedSeats.length) break;
      
      const seat = sortedSeats[seatIndex];
      allocations.push({
        seat_ref_id: seat.seat_ref_id,
        x: seat.x,
        y: seat.y,
        seat_type: SeatStatus.ASSIGNABLE,
        assigned_team: team.team_id,
        assigned_manager: team.manager,
      });
      
      seatIndex++;
    }
  }
  
  // Mark remaining seats as BUFFER
  for (let i = seatIndex; i < sortedSeats.length; i++) {
    const seat = sortedSeats[i];
    allocations.push({
      seat_ref_id: seat.seat_ref_id,
      x: seat.x,
      y: seat.y,
      seat_type: SeatStatus.BUFFER,
    });
  }
  
  return {
    option_id: 'C',
    description: 'Space Efficiency - Tight packing, maximize buffer seats',
    allocations,
  };
}

/**
 * Generate all allocation options
 */
export function generateAllOptions(
  referenceSeats: ReferenceSeat[],
  teams: Team[]
): AllocationOption[] {
  return [
    generateTeamCohesionLayout(referenceSeats, teams),
    generateManagerProximityLayout(referenceSeats, teams),
    generateSpaceEfficiencyLayout(referenceSeats, teams),
  ];
}
