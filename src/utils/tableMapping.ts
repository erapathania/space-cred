/**
 * Table Mapping Utility
 * Maps seats to their nearest table
 */

import type { ReferenceSeat, Table } from '../types';

/**
 * Check if a point is inside a rectangle (with margin)
 */
function isPointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  margin: number = 50
): boolean {
  return (
    px >= rx - margin &&
    px <= rx + rw + margin &&
    py >= ry - margin &&
    py <= ry + rh + margin
  );
}

/**
 * Calculate distance from point to rectangle center
 */
function distanceToRectCenter(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): number {
  const centerX = rx + rw / 2;
  const centerY = ry + rh / 2;
  const dx = px - centerX;
  const dy = py - centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Map each seat to its nearest table
 * Returns seats with table_id assigned
 */
export function mapSeatsToTables(
  seats: ReferenceSeat[],
  tables: Table[]
): ReferenceSeat[] {
  if (tables.length === 0) {
    console.warn('⚠️ No tables defined. Cannot map seats to tables.');
    return seats;
  }

  return seats.map(seat => {
    // Find nearest table
    let nearestTable: Table | null = null;
    let minDistance = Infinity;

    for (const table of tables) {
      // Check if seat is inside table bounds (with margin)
      if (isPointInRect(seat.x, seat.y, table.x, table.y, table.width, table.height, 50)) {
        const distance = distanceToRectCenter(
          seat.x,
          seat.y,
          table.x,
          table.y,
          table.width,
          table.height
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestTable = table;
        }
      }
    }

    // If no table found within margin, find absolute nearest
    if (!nearestTable) {
      for (const table of tables) {
        const distance = distanceToRectCenter(
          seat.x,
          seat.y,
          table.x,
          table.y,
          table.width,
          table.height
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestTable = table;
        }
      }
    }

    return {
      ...seat,
      table_id: nearestTable?.table_id,
    };
  });
}

/**
 * Get seats belonging to a specific table
 */
export function getSeatsForTable(
  seats: ReferenceSeat[],
  tableId: string
): ReferenceSeat[] {
  return seats.filter(seat => seat.table_id === tableId);
}

/**
 * Get table capacity usage
 */
export function getTableUsage(
  seats: ReferenceSeat[],
  tables: Table[]
): Map<string, { used: number; capacity: number }> {
  const usage = new Map<string, { used: number; capacity: number }>();

  tables.forEach(table => {
    const seatsInTable = seats.filter(s => s.table_id === table.table_id);
    usage.set(table.table_id, {
      used: seatsInTable.length,
      capacity: table.capacity,
    });
  });

  return usage;
}
