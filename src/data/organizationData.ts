/**
 * Comprehensive Organization Data
 * 10 Departments, 20 Leaders, ~200 Managers, 1000 Employees
 * 
 * NOTE: This file only exports functions and constants.
 * No code is executed on module load to avoid breaking the app.
 */

import type { Leader, Manager, SubManager, Employee, Gender } from '../types';

// Department names
export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Operations',
  'Finance',
  'Risk',
  'Marketing',
  'Data',
  'HR',
  'Legal',
] as const;

// Department colors (color families)
export const DEPARTMENT_COLORS: Record<string, string[]> = {
  Engineering: ['#1976D2', '#2196F3', '#42A5F5', '#64B5F6'],
  Product: ['#7B1FA2', '#9C27B0', '#AB47BC', '#BA68C8'],
  Design: ['#C2185B', '#E91E63', '#F06292', '#F48FB1'],
  Operations: ['#388E3C', '#4CAF50', '#66BB6A', '#81C784'],
  Finance: ['#F57C00', '#FF9800', '#FFB74D', '#FFCC80'],
  Risk: ['#D32F2F', '#F44336', '#EF5350', '#E57373'],
  Marketing: ['#FF6F00', '#FF8F00', '#FFA726', '#FFB74D'],
  Data: ['#0288D1', '#03A9F4', '#29B6F6', '#4FC3F7'],
  HR: ['#5D4037', '#795548', '#8D6E63', '#A1887F'],
  Legal: ['#455A64', '#607D8B', '#78909C', '#90A4AE'],
};

// Indian names pool
const MALE_NAMES = [
  'Aarav', 'Aditya', 'Arjun', 'Aryan', 'Dhruv', 'Ishaan', 'Kabir', 'Krishna', 'Lakshay', 'Manav',
  'Mohit', 'Nakul', 'Nikhil', 'Pranav', 'Rahul', 'Raj', 'Rohan', 'Sahil', 'Shourya', 'Tanmay',
  'Varun', 'Vihaan', 'Vivaan', 'Yash', 'Kunal', 'Aman', 'Ankit', 'Ashish', 'Deepak', 'Gaurav',
  'Harsh', 'Karan', 'Mayank', 'Naman', 'Piyush', 'Ravi', 'Sanjay', 'Sumit', 'Tarun', 'Vikas',
  'Abhishek', 'Ajay', 'Amit', 'Anil', 'Anurag', 'Bharat', 'Chetan', 'Dinesh', 'Gopal', 'Hari',
];

const FEMALE_NAMES = [
  'Aadhya', 'Aanya', 'Aditi', 'Ananya', 'Anjali', 'Apoorva', 'Diya', 'Ishita', 'Jiya', 'Kavya',
  'Khushi', 'Kiara', 'Mira', 'Myra', 'Navya', 'Pari', 'Priya', 'Riya', 'Saanvi', 'Sara',
  'Shanaya', 'Shreya', 'Siya', 'Tara', 'Zara', 'Meera', 'Neha', 'Pooja', 'Preeti', 'Radhika',
  'Rekha', 'Ritu', 'Sakshi', 'Simran', 'Sneha', 'Sonal', 'Swati', 'Tanvi', 'Usha', 'Vidya',
  'Aarti', 'Alka', 'Amrita', 'Ankita', 'Archana', 'Bharti', 'Deepa', 'Geeta', 'Hema', 'Jaya',
];

// Generate unique name
let nameCounter = 0;
function generateName(gender: Gender): string {
  const names = gender === 'M' ? MALE_NAMES : FEMALE_NAMES;
  const name = names[nameCounter % names.length];
  nameCounter++;
  return name;
}

// Leaders (20 total, ~2 per department)
export const LEADERS: Leader[] = [
  // Engineering (2 leaders)
  { leader_id: 'L01', name: 'Iniyan', department: 'Engineering', preferences: { near_window: true, premium_seat: true }, color: DEPARTMENT_COLORS.Engineering[0] },
  { leader_id: 'L02', name: 'Kunal', department: 'Engineering', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Engineering[0] },
  
  // Product (2 leaders)
  { leader_id: 'L03', name: 'Priya', department: 'Product', preferences: { near_window: true }, color: DEPARTMENT_COLORS.Product[0] },
  { leader_id: 'L04', name: 'Rahul', department: 'Product', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Product[0] },
  
  // Design (2 leaders)
  { leader_id: 'L05', name: 'Aditi', department: 'Design', preferences: { near_window: true, premium_seat: true }, color: DEPARTMENT_COLORS.Design[0] },
  { leader_id: 'L06', name: 'Arjun', department: 'Design', preferences: { near_managers: true }, color: DEPARTMENT_COLORS.Design[0] },
  
  // Operations (2 leaders)
  { leader_id: 'L07', name: 'Shourya', department: 'Operations', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Operations[0] },
  { leader_id: 'L08', name: 'Apoorva', department: 'Operations', preferences: { near_window: true }, color: DEPARTMENT_COLORS.Operations[0] },
  
  // Finance (2 leaders)
  { leader_id: 'L09', name: 'Rohan', department: 'Finance', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Finance[0] },
  { leader_id: 'L10', name: 'Kavya', department: 'Finance', preferences: { near_window: true }, color: DEPARTMENT_COLORS.Finance[0] },
  
  // Risk (2 leaders)
  { leader_id: 'L11', name: 'Vivaan', department: 'Risk', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Risk[0] },
  { leader_id: 'L12', name: 'Diya', department: 'Risk', preferences: { near_managers: true }, color: DEPARTMENT_COLORS.Risk[0] },
  
  // Marketing (2 leaders)
  { leader_id: 'L13', name: 'Yash', department: 'Marketing', preferences: { near_window: true }, color: DEPARTMENT_COLORS.Marketing[0] },
  { leader_id: 'L14', name: 'Ananya', department: 'Marketing', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Marketing[0] },
  
  // Data (2 leaders)
  { leader_id: 'L15', name: 'Dhruv', department: 'Data', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Data[0] },
  { leader_id: 'L16', name: 'Ishita', department: 'Data', preferences: { near_window: true }, color: DEPARTMENT_COLORS.Data[0] },
  
  // HR (2 leaders)
  { leader_id: 'L17', name: 'Manav', department: 'HR', preferences: { near_managers: true }, color: DEPARTMENT_COLORS.HR[0] },
  { leader_id: 'L18', name: 'Riya', department: 'HR', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.HR[0] },
  
  // Legal (2 leaders)
  { leader_id: 'L19', name: 'Kabir', department: 'Legal', preferences: { premium_seat: true }, color: DEPARTMENT_COLORS.Legal[0] },
  { leader_id: 'L20', name: 'Saanvi', department: 'Legal', preferences: { near_window: true }, color: DEPARTMENT_COLORS.Legal[0] },
];

// Generate Managers (~10 per leader = 200 total)
export function generateManagers(): Manager[] {
  const managers: Manager[] = [];
  let managerIdCounter = 1;
  
  LEADERS.forEach(leader => {
    // Each leader has 8-12 managers
    const numManagers = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numManagers; i++) {
      managers.push({
        manager_id: `M${String(managerIdCounter).padStart(3, '0')}`,
        name: generateName(Math.random() > 0.5 ? 'M' : 'F'),
        leader_id: leader.leader_id,
        department: leader.department,
        team_size: 3 + Math.floor(Math.random() * 5), // 3-7 people per team
      });
      managerIdCounter++;
    }
  });
  
  return managers;
}

// Generate Sub-Managers (optional, ~30% of managers have sub-managers)
export function generateSubManagers(managers: Manager[]): SubManager[] {
  const subManagers: SubManager[] = [];
  let subManagerIdCounter = 1;
  
  // 30% of managers have sub-managers
  const managersWithSubs = managers.filter(() => Math.random() < 0.3);
  
  managersWithSubs.forEach(manager => {
    subManagers.push({
      sub_manager_id: `SM${String(subManagerIdCounter).padStart(3, '0')}`,
      name: generateName(Math.random() > 0.5 ? 'M' : 'F'),
      manager_id: manager.manager_id,
      department: manager.department,
      team_size: 2 + Math.floor(Math.random() * 3), // 2-4 people per sub-team
    });
    subManagerIdCounter++;
  });
  
  return subManagers;
}

// Generate Employees (1000 total)
export function generateEmployees(managers: Manager[], subManagers: SubManager[]): Employee[] {
  const employees: Employee[] = [];
  let employeeIdCounter = 1;
  
  // Create employees for each manager/sub-manager
  managers.forEach(manager => {
    const subManagersForThisManager = subManagers.filter(sm => sm.manager_id === manager.manager_id);
    
    if (subManagersForThisManager.length > 0) {
      // This manager has sub-managers, create employees under sub-managers
      subManagersForThisManager.forEach(subManager => {
        const numEmployees = subManager.team_size - 1; // Excluding sub-manager
        
        for (let i = 0; i < numEmployees; i++) {
          const gender: Gender = Math.random() > 0.5 ? 'M' : 'F';
          employees.push({
            employee_id: `E${String(employeeIdCounter).padStart(4, '0')}`,
            name: generateName(gender),
            gender,
            reports_to: subManager.sub_manager_id,
            department: manager.department,
            special_needs: Math.random() < 0.05, // 5% have special needs
            role: 'EMPLOYEE',
          });
          employeeIdCounter++;
        }
      });
    } else {
      // No sub-managers, employees report directly to manager
      const numEmployees = manager.team_size - 1; // Excluding manager
      
      for (let i = 0; i < numEmployees; i++) {
        const gender: Gender = Math.random() > 0.5 ? 'M' : 'F';
        employees.push({
          employee_id: `E${String(employeeIdCounter).padStart(4, '0')}`,
          name: generateName(gender),
          gender,
          reports_to: manager.manager_id,
          department: manager.department,
          special_needs: Math.random() < 0.05, // 5% have special needs
          role: 'EMPLOYEE',
        });
        employeeIdCounter++;
      }
    }
  });
  
  return employees;
}

// Helper functions
export function getLeadersByDepartment(department: string): Leader[] {
  return LEADERS.filter(l => l.department === department);
}

export function getManagersByLeader(leaderId: string, managers: Manager[]): Manager[] {
  return managers.filter(m => m.leader_id === leaderId);
}

export function getSubManagersByManager(managerId: string, subManagers: SubManager[]): SubManager[] {
  return subManagers.filter(sm => sm.manager_id === managerId);
}

export function getEmployeesByReportsTo(reportsTo: string, employees: Employee[]): Employee[] {
  return employees.filter(e => e.reports_to === reportsTo);
}

// Get all people count
export function getOrganizationStats(managers: Manager[], subManagers: SubManager[], employees: Employee[]) {
  return {
    departments: DEPARTMENTS.length,
    leaders: LEADERS.length,
    managers: managers.length,
    subManagers: subManagers.length,
    employees: employees.length,
    total: LEADERS.length + managers.length + subManagers.length + employees.length,
  };
}
