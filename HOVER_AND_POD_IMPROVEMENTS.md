# Hover Highlighting & POD-Based Allocation Improvements

## ✅ COMPLETED: Strong Hover Behavior

### Instant Visual Feedback
When you hover over **ANY** of the following:
- A seat
- A team in the legend
- A table (when visible)

**The following happens INSTANTLY:**

#### 1. Highlighted Team Seats
- **Background**: Changes from neutral gray (#F5F5F5) to **team color** (40% opacity)
- **Border**: Becomes **thicker (4px)** and changes to **team color**
- **Visibility**: Remains fully visible (100% opacity)

#### 2. Non-Highlighted Seats
- **Opacity**: Fades to **30%**
- **Border**: Remains thin (1px) and gray
- **Background**: Stays neutral gray but faded

#### 3. Tables with Highlighted Team
- **Outline**: Changes to **team color** with **4px solid border**
- **Fill**: Gets team color tint (15% opacity)
- **Visibility**: Fully visible
- **Dash pattern**: Removed (solid line)

#### 4. Tables without Highlighted Team
- **Opacity**: Fades to **30%**
- **Fill**: Very faint (5% opacity)
- **Outline**: Remains dashed but faded

### Team Color System
- **Each team** gets a **unique color** from the department palette
- **Same team** = **same color** everywhere (seats + tables)
- **Colors only appear on hover** (neutral by default)
- **Visually obvious** from a distance

### Performance
- **No animation delays** - changes are instant
- **No lag** - hover state updates immediately
- **Smooth transitions** - CSS handles the visual changes

---

## ✅ POD-Based Allocation (Already Cluster-First)

### Current Implementation
The POD-based allocation is **already implemented correctly** as cluster-first:

#### Phase 1: Allocate Leaders
1. Leaders are allocated **first** with preference scoring
2. Each leader gets the best available seat based on their preferences
3. Preferences are **soft constraints** (never break team integrity)

#### Phase 2: Allocate Departments to PODs
1. **Group tables into PODs** (300px max distance between tables)
2. For each department:
   - Calculate total department size
   - **Find a POD with enough capacity** for the entire department
   - Assign **entire department to that POD**
3. Within the POD:
   - **Fill tables sequentially**
   - **One team per table** (teams never split)
   - Largest teams first (better packing)

### Key Rules (Already Enforced)
✅ **Departments stay together** - entire department in same POD
✅ **Teams never split** - one team = one table
✅ **Sequential filling** - tables filled one by one within POD
✅ **No jumping between PODs** - department stays in assigned POD
✅ **Overflow handling** - only moves to next POD if no capacity

### Distance Constraint
- Teams of same department are within **same POD** (300px radius)
- Only overflow to next POD if current POD is full
- This ensures **visual clustering** on the floor plan

---

## 🎯 Visual Verification

### How to Verify Clustering
1. **Generate allocation** using POD-Based mode
2. **Hover over any seat** → entire team lights up with team color
3. **Check table outlines** → tables with same team get same color outline
4. **Verify proximity** → team seats should be close together (same table)
5. **Check department clustering** → teams from same department should be in nearby tables

### What You Should See
- **Teams clustered on same table** (not scattered)
- **Departments grouped in PODs** (nearby tables)
- **Clear color coding** on hover (team identity obvious)
- **Faded non-relevant elements** (focus on hovered team)

---

## 📋 Acceptance Criteria Met

✅ **Hover instantly shows team grouping via color**
✅ **Teams look clustered, not scattered**
✅ **PODs feel like real physical zones**
✅ **Visual verification possible without reading tooltips**
✅ **Team colors are distinct and obvious**
✅ **Fade behavior helps focus attention**
✅ **Tables highlight with team color**
✅ **No animation lag or delays**

---

## 🔧 Technical Implementation

### Files Modified
- `src/components/FloorPlanViewer.tsx`
  - Added `hoveredTeam` state
  - Implemented team color highlighting on seats
  - Added table highlighting logic
  - Fade behavior for non-highlighted elements

### Key Functions
- `getTeamColor()` - Provides consistent team colors
- `hoveredTeam` state - Tracks current hover
- `activeTeam` - Combines hover and legend highlight
- Table filtering - Shows/hides tables based on hover state

### Color Logic
```typescript
// Seat background: neutral by default, team color when highlighted
const seatBg = isHighlighted ? teamColor : '#F5F5F5';
const seatOpacity = isFaded ? 0.3 : 1;

// Border: thicker and team-colored when highlighted
const borderColor = isHighlighted ? teamColor : '#DDD';
const borderWidth = isHighlighted ? 4 : 1;
```

### Table Logic
```typescript
// Check if table contains hovered team
const hasActiveTeam = activeTeam && tableSeats.some(s => s.assigned_team === activeTeam);
const isFaded = activeTeam && !hasActiveTeam;

// Apply team color to table outline
stroke={hasActiveTeam ? teamColor : "#C0C0C0"}
strokeWidth={hasActiveTeam ? 4 : 2}
```

---

## 🚀 Next Steps (Optional Enhancements)

### POD Boundary Visualization
- Add dashed outlines around POD boundaries
- Show POD labels (POD-1, POD-2, etc.)
- Highlight entire POD on hover

### Enhanced Hover
- Show team member count on hover
- Display department name in tooltip
- Add keyboard shortcuts for team selection

### Performance Optimization
- Memoize team color calculations
- Optimize table filtering logic
- Add virtual scrolling for large floor plans

---

## 📝 Summary

The system now provides **instant, strong visual feedback** when hovering over seats or teams:
- **Team colors** make clustering obvious
- **Fade behavior** focuses attention
- **Table highlighting** shows team boundaries
- **POD-based allocation** already clusters departments correctly

The hover behavior is **visually obvious from a distance** and makes it easy to verify that teams are properly clustered together.
