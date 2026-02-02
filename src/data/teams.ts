/**
 * Dummy Team Data for Allocation Testing
 * DO NOT modify reference seat coordinates
 */

export interface Team {
  team_id: string;
  team_name: string;
  team_size: number;
  manager: string;
  color: string;
}

export const DUMMY_TEAMS: Team[] = [
  {
    team_id: 'TEAM-001',
    team_name: 'Backend Engineering',
    team_size: 8,
    manager: 'Aman',
    color: '#4A90E2', // Blue
  },
  {
    team_id: 'TEAM-002',
    team_name: 'Frontend Engineering',
    team_size: 6,
    manager: 'Neha',
    color: '#9B59B6', // Purple
  },
  {
    team_id: 'TEAM-003',
    team_name: 'Design',
    team_size: 4,
    manager: 'Riya',
    color: '#1ABC9C', // Teal
  },
  {
    team_id: 'TEAM-004',
    team_name: 'Product Management',
    team_size: 5,
    manager: 'Karan',
    color: '#E67E22', // Orange
  },
  {
    team_id: 'TEAM-005',
    team_name: 'Data Science',
    team_size: 7,
    manager: 'Priya',
    color: '#E74C3C', // Red
  },
];

// Helper to get team color by ID
export function getTeamColor(teamId: string): string {
  const team = DUMMY_TEAMS.find(t => t.team_id === teamId);
  return team?.color || '#4CAF50';
}
