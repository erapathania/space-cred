/**
 * Storage utility for persisting reference seats
 * ADMIN saves reference seats here (one-time setup)
 * FACILITY_USER loads from here (read-only)
 */

import type { ReferenceSeat, LayoutScenario, Table } from '../types';

const REFERENCE_SEATS_KEY = 'space_allocation_reference_seats';
const TABLES_KEY = 'space_allocation_tables';
const LAYOUTS_KEY = 'space_allocation_layouts';

// Save reference seats (ADMIN only)
export const saveReferenceSeats = (seats: ReferenceSeat[]): void => {
  try {
    localStorage.setItem(REFERENCE_SEATS_KEY, JSON.stringify(seats));
    console.log(`✅ Saved ${seats.length} reference seats to storage`);
  } catch (error) {
    console.error('Failed to save reference seats:', error);
    throw new Error('Failed to save seat map');
  }
};

// Load reference seats (both roles)
export const loadReferenceSeats = (): ReferenceSeat[] => {
  try {
    const data = localStorage.getItem(REFERENCE_SEATS_KEY);
    if (!data) return [];
    
    const seats = JSON.parse(data) as ReferenceSeat[];
    console.log(`✅ Loaded ${seats.length} reference seats from storage`);
    return seats;
  } catch (error) {
    console.error('Failed to load reference seats:', error);
    return [];
  }
};

// Save layout scenario (FACILITY_USER)
export const saveLayout = (layout: LayoutScenario): void => {
  try {
    const existing = loadLayouts();
    const updated = [...existing.filter(l => l.scenario_id !== layout.scenario_id), layout];
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(updated));
    console.log(`✅ Saved layout: ${layout.name}`);
  } catch (error) {
    console.error('Failed to save layout:', error);
    throw new Error('Failed to save layout');
  }
};

// Load all layouts (FACILITY_USER)
export const loadLayouts = (): LayoutScenario[] => {
  try {
    const data = localStorage.getItem(LAYOUTS_KEY);
    if (!data) return [];
    
    return JSON.parse(data) as LayoutScenario[];
  } catch (error) {
    console.error('Failed to load layouts:', error);
    return [];
  }
};

// Save tables (ADMIN only)
export const saveTables = (tables: Table[]): void => {
  try {
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    console.log(`✅ Saved ${tables.length} tables to storage`);
  } catch (error) {
    console.error('Failed to save tables:', error);
    throw new Error('Failed to save tables');
  }
};

// Load tables (both roles)
export const loadTables = (): Table[] => {
  try {
    const data = localStorage.getItem(TABLES_KEY);
    if (!data) return [];
    
    const tables = JSON.parse(data) as Table[];
    console.log(`✅ Loaded ${tables.length} tables from storage`);
    return tables;
  } catch (error) {
    console.error('Failed to load tables:', error);
    return [];
  }
};

// Clear all data (for testing)
export const clearAllData = (): void => {
  localStorage.removeItem(REFERENCE_SEATS_KEY);
  localStorage.removeItem(TABLES_KEY);
  localStorage.removeItem(LAYOUTS_KEY);
  console.log('✅ Cleared all storage');
};
