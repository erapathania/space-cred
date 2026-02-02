/**
 * Team and Department Data
 * TABLE-FIRST ARCHITECTURE
 */

export interface Team {
  team_id: string;
  team_name: string;
  team_size: number;
  manager: string;
  department: string;  // Department grouping
  color: string;
}

export const DUMMY_TEAMS: Team[] = [
  // Engineering Department
  {
    team_id: 'TEAM-001',
    team_name: 'Backend Engineering',
    team_size: 8,
    manager: 'Aman',
    department: 'Engineering',
    color: '#4A90E2', // Blue
  },
  {
    team_id: 'TEAM-002',
    team_name: 'Frontend Engineering',
    team_size: 6,
    manager: 'Neha',
    department: 'Engineering',
    color: '#5BA3F5', // Lighter Blue
  },
  
  // Product Department
  {
    team_id: 'TEAM-003',
    team_name: 'Product Management',
    team_size: 5,
    manager: 'Karan',
    department: 'Product',
    color: '#E67E22', // Orange
  },
  {
    team_id: 'TEAM-004',
    team_name: 'Design',
    team_size: 4,
    manager: 'Riya',
    department: 'Product',
    color: '#F39C12', // Lighter Orange
  },
  
  // Data Department
  {
    team_id: 'TEAM-005',
    team_name: 'Data Science',
    team_size: 7,
    manager: 'Priya',
    department: 'Data',
    color: '#E74C3C', // Red
  },
];

// Get teams by department
export function getTeamsByDepartment(department: string): Team[] {
  return DUMMY_TEAMS.filter(t => t.department === department);
}

// Get all unique departments
export function getDepartments(): string[] {
  return Array.from(new Set(DUMMY_TEAMS.map(t => t.department)));
}

// Helper to get team color by ID
export function getTeamColor(teamId: string): string {
  const team = DUMMY_TEAMS.find(t => t.team_id === teamId);
  return team?.color || '#4CAF50';
}

// Get department color (base color for department zone)
export function getDepartmentColor(department: string): string {
  const teams = getTeamsByDepartment(department);
  return teams[0]?.color || '#4CAF50';
}
