/**
 * POD Grouping Utility
 *
 * Groups tables into PODs (Physical Office Divisions) based on proximity.
 * PODs are clusters of nearby tables that should be allocated together.
 */

import type { Table, Pod } from '../types';

/**
 * Calculate distance between two tables (center-to-center)
 */
function calculateTableDistance(table1: Table, table2: Table): number {
  const center1X = table1.x + table1.width / 2;
  const center1Y = table1.y + table1.height / 2;
  const center2X = table2.x + table2.width / 2;
  const center2Y = table2.y + table2.height / 2;

  return Math.sqrt(
    Math.pow(center2X - center1X, 2) +
    Math.pow(center2Y - center1Y, 2)
  );
}

/**
 * Group tables into PODs using clustering algorithm
 * Tables within MAX_POD_DISTANCE are grouped together
 */
export function groupTablesIntoPods(tables: Table[], maxPodDistance: number = 300): Pod[] {
  if (tables.length === 0) return [];

  const pods: Pod[] = [];
  const assignedTables = new Set<string>();
  let podCounter = 1;

  tables.forEach(seedTable => {
    if (assignedTables.has(seedTable.table_id)) return;

    // Start new POD with this seed table
    const podTables: Table[] = [seedTable];
    assignedTables.add(seedTable.table_id);

    // Find all tables within distance from any table in current POD
    let changed = true;
    while (changed) {
      changed = false;

      for (const table of tables) {
        if (assignedTables.has(table.table_id)) continue;

        // Check if this table is close to any table in current POD
        for (const podTable of podTables) {
          const distance = calculateTableDistance(table, podTable);

          if (distance <= maxPodDistance) {
            podTables.push(table);
            assignedTables.add(table.table_id);
            changed = true;
            break;
          }
        }
      }
    }

    // Calculate POD bounding box
    const minX = Math.min(...podTables.map(t => t.x));
    const minY = Math.min(...podTables.map(t => t.y));
    const maxX = Math.max(...podTables.map(t => t.x + t.width));
    const maxY = Math.max(...podTables.map(t => t.y + t.height));

    // Create POD
    const pod: Pod = {
      pod_id: `POD-${podCounter.toString().padStart(2, '0')}`,
      name: `Pod ${podCounter}`,
      tables: podTables.map(t => t.table_id),
      x: minX - 20,  // Add padding
      y: minY - 20,
      width: maxX - minX + 40,
      height: maxY - minY + 40,
    };

    pods.push(pod);
    podCounter++;
  });

  // Assign pod_id to tables
  pods.forEach(pod => {
    pod.tables.forEach(tableId => {
      const table = tables.find(t => t.table_id === tableId);
      if (table) {
        table.pod_id = pod.pod_id;
      }
    });
  });

  console.log(`Created ${pods.length} PODs from ${tables.length} tables`);
  pods.forEach(pod => {
    console.log(`  ${pod.pod_id}: ${pod.tables.length} tables`);
  });

  return pods;
}

/**
 * Get tables in a specific POD
 */
export function getTablesInPod(tables: Table[], podId: string): Table[] {
  return tables.filter(t => t.pod_id === podId);
}

/**
 * Calculate total capacity of a POD
 */
export function getPodCapacity(tables: Table[], podId: string): number {
  return getTablesInPod(tables, podId)
    .reduce((sum, table) => sum + table.capacity, 0);
}
