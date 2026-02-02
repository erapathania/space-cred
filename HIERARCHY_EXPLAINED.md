# HIERARCHY EXPLAINED

## ⚠️ IMPORTANT: What Hierarchy Means Here

**Hierarchy = Team Grouping (NOT graph traversal)**

Hierarchy is used ONLY to define who sits together. It is NOT a separate allocation system.

## 🎯 Core Concept

### Example Data Structure

```
Department: Operations
Leader: Iniyan

Teams:
├── Shourya (Manager) + 2 interns = 3 people total
├── Apoorva (Manager) + 5 team members = 6 people total
└── Rohan (Manager) + 4 team members = 5 people total
```

**Each manager + their direct reports = ONE TEAM**

## ✅ What We DO with Hierarchy

Hierarchy is used to:
- ✅ Form teams (manager + direct reports)
- ✅ Ensure teams sit together
- ✅ Group teams by department

## ❌ What We DON'T Do with Hierarchy

Hierarchy is NOT used to:
- ❌ Decide seat priority
- ❌ Decide proximity across tables
- ❌ Decide buffer or isolation
- ❌ Create tree traversal logic
- ❌ Introduce levels or recursive allocation

## 🔒 CORE RULES (LOCKED)

### RULE 1: One Team → One Table
A TEAM must be seated on ONE TABLE whenever possible.

### RULE 2: No Splitting
A TEAM must NOT be split across multiple tables unless there is absolutely no table with enough capacity.

### RULE 3: Leaders Are Not Special
Leader (Iniyan) does NOT get a separate table by default. Leaders are just part of the same department pool.

## 📋 Allocation Algorithm (Simple & Clear)

```
For each DEPARTMENT:
  1. Get all TEAMS in that department
  2. Sort teams by size (largest first)
  3. For each team:
     - Find ONE table with capacity >= team size
     - Assign ENTIRE team to that table
     - Assign specific seats inside that table
     - Mark table as used
```

## 🎨 Visual Requirements

When viewing the allocation:

- **Same TEAM** → Same color
- **Same DEPARTMENT** → Same color family
- **Seat labels show:**
  - Employee name
  - Team name
  - Manager name
  - Table ID

## 🚨 Edge Cases (Handle Simply)

### If NO table can fit the full team:

**Option 1 (Preferred):**
- Split the team across MINIMUM number of adjacent tables
- Keep split tables visually grouped (same color)

**Option 2 (Fallback):**
- Warn the user
- Skip the team
- Log the issue

**DO NOT:**
- ❌ Push people to buffer
- ❌ Randomly scatter team members
- ❌ Introduce complex logic

## ✅ Validation Checklist

Allocation is correct ONLY if:

- [ ] Every team can be visually identified
- [ ] All members of a team sit together (or on adjacent tables if split)
- [ ] Tables clearly map to teams
- [ ] No unexplained seat assignments exist
- [ ] Console logs show clear team→table mapping

## 💻 Implementation

See `src/utils/tableAllocationEngine.ts` for the actual implementation.

The algorithm follows these rules exactly:
1. Group teams by department
2. Sort by size (largest first)
3. Assign each team to ONE table
4. No buffer, no levels, no recursion

## 🎯 Success Criteria

You know the allocation is working correctly when:

1. **Visual Test:** You can look at the floor plan and immediately see which seats belong to which team
2. **Console Test:** Logs show clear "Team X → Table Y" assignments
3. **Color Test:** Same team = same color, clearly visible
4. **Grouping Test:** Team members are clustered together, not scattered

---

**Remember:** Hierarchy is just team grouping. Keep it simple!
