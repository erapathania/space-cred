/**
 * Team Formation Logic
 * Converts organizational hierarchy into teams for allocation
 * 
 * TEAM DEFINITION:
 * - If sub-manager exists: Team = Sub-manager + direct reports
 * - Else: Team = Manager + direct reports
 */

import type { EnhancedTeam, Leader, Manager, SubManager, Employee } from '../types';
import {
  LEADERS,
  DEPARTMENT_COLORS,
  getManagersByLeader,
  getSubManagersByManager,
  getEmployeesByReportsTo,
} from '../data/organizationData';

/**
 * Form teams from organizational hierarchy
 */
export function formTeams(
  managers: Manager[],
  subManagers: SubManager[],
  employees: Employee[]
): EnhancedTeam[] {
  const teams: EnhancedTeam[] = [];
  let teamIdCounter = 1;
  
  // Process each manager
  managers.forEach((manager, managerIndex) => {
    const subManagersForManager = getSubManagersByManager(manager.manager_id, subManagers);
    const leader = LEADERS.find(l => l.leader_id === manager.leader_id)!;
    
    // Get color from department color family
    const deptColors = DEPARTMENT_COLORS[manager.department];
    const colorIndex = managerIndex % deptColors.length;
    const teamColor = deptColors[colorIndex];
    
    if (subManagersForManager.length > 0) {
      // Manager has sub-managers: Create team for each sub-manager
      subManagersForManager.forEach(subManager => {
        const teamEmployees = getEmployeesByReportsTo(subManager.sub_manager_id, employees);
        
        // Add sub-manager as employee in the team
        const subManagerAsEmployee: Employee = {
          employee_id: subManager.sub_manager_id,
          name: subManager.name,
          gender: 'M', // Default
          reports_to: manager.manager_id,
          department: subManager.department,
          special_needs: false,
          role: 'SUB_MANAGER',
        };
        
        teams.push({
          team_id: `T${String(teamIdCounter).padStart(3, '0')}`,
          team_name: `${subManager.name}'s Team`,
          leader_id: leader.leader_id,
          manager_id: manager.manager_id,
          sub_manager_id: subManager.sub_manager_id,
          members: [subManagerAsEmployee, ...teamEmployees],
          department: subManager.department,
          color: teamColor,
        });
        
        teamIdCounter++;
      });
    } else {
      // No sub-managers: Create team with manager + direct reports
      const teamEmployees = getEmployeesByReportsTo(manager.manager_id, employees);
      
      // Add manager as employee in the team
      const managerAsEmployee: Employee = {
        employee_id: manager.manager_id,
        name: manager.name,
        gender: 'M', // Default
        reports_to: leader.leader_id,
        department: manager.department,
        special_needs: false,
        role: 'MANAGER',
      };
      
      teams.push({
        team_id: `T${String(teamIdCounter).padStart(3, '0')}`,
        team_name: `${manager.name}'s Team`,
        leader_id: leader.leader_id,
        manager_id: manager.manager_id,
        members: [managerAsEmployee, ...teamEmployees],
        department: manager.department,
        color: teamColor,
      });
      
      teamIdCounter++;
    }
  });
  
  console.log(`✅ Formed ${teams.length} teams from organizational hierarchy`);
  return teams;
}

/**
 * Get teams by department
 */
export function getTeamsByDepartment(department: string, teams: EnhancedTeam[]): EnhancedTeam[] {
  return teams.filter(t => t.department === department);
}

/**
 * Get teams by leader
 */
export function getTeamsByLeader(leaderId: string, teams: EnhancedTeam[]): EnhancedTeam[] {
  return teams.filter(t => t.leader_id === leaderId);
}
