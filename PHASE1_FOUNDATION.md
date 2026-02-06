# Phase 1: Enhanced Allocation Foundation

## ✅ Status: COMPLETE & SAFE

The app is **fully functional** with Phase 1 foundation added. New code does NOT auto-execute, so it doesn't break existing functionality.

---

## 📦 What Was Added

### 1. Enhanced Type Definitions (`src/types/index.ts`)

**New Types:**
- `EmployeeRole` - LEADER | MANAGER | SUB_MANAGER | EMPLOYEE
- `Gender` - M | F
- `Leader` - Top of hierarchy with preferences
- `Manager` - Reports to leader
- `SubManager` - Optional, reports to manager
- `Employee` - Reports to sub-manager or manager
- `EnhancedTeam` - Team formed from hierarchy
- `EnhancedReferenceSeat` - Seat with premium/window/accessible attributes
- `EnhancedAllocatedSeat` - Allocated seat with employee details

**Key Interfaces:**
```typescript
interface Leader {
  leader_id: string;
  name: string;
  department: string;
  preferences: LeaderPreferences;  // near_window, premium_seat, near_managers
  color: string;
}

interface EnhancedTeam {
  team_id: string;
  team_name: string;
  leader_id: string;
  manager_id?: string;
  sub_manager_id?: string;
  members: Employee[];  // Full employee objects with gender, role, special_needs
  department: string;
  color: string;
}
```

### 2. Organization Data Generator (`src/data/organizationData.ts`)

**Exports:**
- `DEPARTMENTS` - 10 departments (Engineering, Product, Design, etc.)
- `DEPARTMENT_COLORS` - Color families for each department
- `LEADERS` - 20 pre-defined leaders (~2 per department)
- `generateManagers()` - Creates ~200 managers (8-12 per leader)
- `generateSubManagers(managers)` - Creates sub-managers (30% of managers)
- `generateEmployees(managers, subManagers)` - Creates ~1000 employees
- Helper functions for hierarchy queries

**Important:** All functions are **pure** - they don't execute on module load!

---

## 🎯 Current System (Still Working)

The existing allocation system uses:
- Simple `Team` interface from `src/data/teams.ts`
- `DUMMY_TEAMS` with 5 hardcoded teams
- Department-based allocation
- Team color coding

**Nothing changed in the existing system!**

---

## 🚀 How to Use Phase 1 (Future Integration)

### Step 1: Generate Organization Data

```typescript
import { 
  LEADERS, 
  generateManagers, 
  generateSubManagers, 
  generateEmployees 
} from './data/organizationData';

// Generate the full organization
const managers = generateManagers();
const subManagers = generateSubManagers(managers);
const employees = generateEmployees(managers, subManagers);

console.log(`Generated: ${managers.length} managers, ${employees.length} employees`);
```

### Step 2: Form Teams from Hierarchy

Create `src/utils/teamFormation.ts`:

```typescript
import type { EnhancedTeam } from '../types';
import { LEADERS, DEPARTMENT_COLORS } from '../data/organizationData';

export function formTeams(
  managers: Manager[], 
  subManagers: SubManager[], 
  employees: Employee[]
): EnhancedTeam[] {
  const teams: EnhancedTeam[] = [];
  
  // Logic to form teams:
  // - If sub-manager exists: Team = Sub-manager + direct reports
  // - Else: Team = Manager + direct reports
  
  // ... implementation ...
  
  return teams;
}
```

### Step 3: Create Enhanced Allocation Engine

Create `src/utils/enhancedAllocationEngine.ts`:

```typescript
import type { EnhancedTeam, EnhancedAllocatedSeat } from '../types';

export function allocateWithLeaders(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[]
): EnhancedAllocatedSeat[] {
  // PHASE 1: Allocate leaders first (with preferences)
  // PHASE 2: Allocate teams (one team per table)
  // PHASE 3: Handle special needs
  
  // ... implementation ...
}
```

### Step 4: Wire into App.tsx

```typescript
// Option 1: Keep existing system, add new option
import { DUMMY_TEAMS } from './data/teams';  // Existing
import { generateManagers, generateSubManagers, generateEmployees } from './data/organizationData';  // New
import { formTeams } from './utils/teamFormation';  // New

// Generate enhanced teams when needed
const managers = generateManagers();
const subManagers = generateSubManagers(managers);
const employees = generateEmployees(managers, subManagers);
const enhancedTeams = formTeams(managers, subManagers, employees);

// Use DUMMY_TEAMS for existing allocation
// Use enhancedTeams for new enhanced allocation
```

---

## 📊 Organization Structure

```
10 Departments
├── Engineering, Product, Design, Operations, Finance
├── Risk, Marketing, Data, HR, Legal
│
20 Leaders (~2 per department)
├── Each has preferences (window, premium, near managers)
│
~200 Managers (8-12 per leader)
├── Each manages 3-7 people
│
~60 Sub-Managers (30% of managers)
├── Each manages 2-4 people
│
~1000 Employees
└── Report to sub-manager OR manager
    ├── 50% Male, 50% Female
    └── 5% have special needs
```

---

## 🎨 Department Colors

Each department has a **color family** (4 shades) for visual distinction:

- **Engineering:** Blue shades (#1976D2, #2196F3, #42A5F5, #64B5F6)
- **Product:** Purple shades (#7B1FA2, #9C27B0, #AB47BC, #BA68C8)
- **Design:** Pink shades (#C2185B, #E91E63, #F06292, #F48FB1)
- **Operations:** Green shades (#388E3C, #4CAF50, #66BB6A, #81C784)
- **Finance:** Orange shades (#F57C00, #FF9800, #FFB74D, #FFCC80)
- **Risk:** Red shades (#D32F2F, #F44336, #EF5350, #E57373)
- **Marketing:** Amber shades (#FF6F00, #FF8F00, #FFA726, #FFB74D)
- **Data:** Cyan shades (#0288D1, #03A9F4, #29B6F6, #4FC3F7)
- **HR:** Brown shades (#5D4037, #795548, #8D6E63, #A1887F)
- **Legal:** Blue-grey shades (#455A64, #607D8B, #78909C, #90A4AE)

---

## ⚠️ Important Notes

1. **No Auto-Execution:** All new code exports functions/constants only. Nothing runs on module load.

2. **Backward Compatible:** Existing `Team` interface unchanged. New `EnhancedTeam` is separate.

3. **Not Wired Yet:** New types and data exist but aren't used by the app yet. Integration is Phase 2.

4. **Random Generation:** Managers, sub-managers, and employees are randomly generated each time functions are called. For consistency, generate once and reuse.

5. **Testing:** Always test incrementally when integrating. Add one piece at a time.

---

## 🔜 Next Steps (Phase 2)

1. Create `teamFormation.ts` to convert hierarchy → teams
2. Create `enhancedAllocationEngine.ts` for leader-first allocation
3. Add UI enhancements (gender icons, role badges)
4. Wire into App.tsx as a new allocation option
5. Test thoroughly before replacing existing system

---

## 📝 Commit History

- `e6c2c45` - ✅ Phase 1: Add enhanced allocation types and organization data
- `ae8064e` - ✅ CLARIFIED: Hierarchy = Team Grouping (working baseline)

---

**Status:** ✅ Foundation complete, app working, ready for Phase 2 integration
