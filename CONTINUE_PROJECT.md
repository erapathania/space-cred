# Project Continuation Prompt for Claude

## Project Context

You are working on a **Space Allocation System V1** - a React + TypeScript application for office seat allocation with a table-first architecture. The system has two roles: ADMIN (sets up seats and tables) and FACILITY_USER (manages allocations and preferences).

## Current State

### ✅ Completed Features

1. **Core Architecture**
   - Table-first allocation (teams sit together on same table)
   - Role-based UI (ADMIN vs FACILITY_USER)
   - Reference seat system (red dots on floor plan)
   - Table drawing system (gold rectangles)
   - Seat-to-table mapping

2. **Organizational Hierarchy**
   - Leaders → Managers → Sub-Managers → Employees
   - Team formation from hierarchy
   - Department-based organization
   - Gender and role tracking

3. **Leader Preference System (SOFT CONSTRAINTS)**
   - LeaderPreferenceModal component
   - 5 preference types: near_window, near_entry, near_team, quiet_zone, corner_edge
   - Preference scoring system (10 points per match)
   - Console logging of preference satisfaction

4. **Seat Attribute System**
   - SeatAttributeModal component (right-click on seats)
   - 6 attribute types: near_window, near_entry, corner_position, quiet_zone, accessible, premium
   - Explicit attribute tagging by ADMIN
   - Direct attribute-to-preference matching (no coordinate heuristics)

5. **Allocation Engine**
   - Leader-first allocation with preference scoring
   - Team-based allocation (one team → one table)
   - Special needs handling
   - Enhanced seat data with employee details

### 📁 Project Structure

```
space-allocation-v1/
├── src/
│   ├── components/
│   │   ├── FloorPlanViewer.tsx          # Main canvas component
│   │   ├── LeaderPreferenceModal.tsx    # Leader preference UI
│   │   ├── LeaderPreferenceModal.css
│   │   ├── SeatAttributeModal.tsx       # Seat attribute tagging UI
│   │   └── SeatAttributeModal.css
│   ├── data/
│   │   └── organizationData.ts          # Leaders, departments, generators
│   ├── utils/
│   │   ├── enhancedAllocationEngine.ts  # Main allocation logic
│   │   ├── tableMapping.ts              # Seat-to-table mapping
│   │   ├── teamFormation.ts             # Team creation from hierarchy
│   │   └── storage.ts                   # localStorage utilities
│   ├── types/
│   │   └── index.ts                     # All TypeScript types
│   ├── App.tsx                          # Main app component
│   └── App.css                          # Main styles
├── public/
│   └── assets/
│       └── floor-plan.jpg               # Floor plan image
├── LEADER_PREFERENCES.md                # Preference system docs
├── SEAT_ATTRIBUTES_GUIDE.md             # Attribute system docs
└── README.md                            # Project overview
```

### 🔑 Key Technologies

- **React 18** with TypeScript
- **Vite** for build tooling
- **Canvas API** for floor plan rendering
- **localStorage** for data persistence
- **CSS** for styling (no UI library)

### 🎯 Current Limitations & Next Steps

## IMMEDIATE NEXT STEPS

### 1. **Add Right-Click Handler to FloorPlanViewer** (CRITICAL)
**Status**: Modal created but not wired to canvas

**What to do**:
```typescript
// In FloorPlanViewer.tsx, add context menu handler
const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
  e.preventDefault();
  
  // Get click coordinates
  const rect = canvasRef.current?.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Find seat at this position
  const clickedSeat = referenceSeats.find(seat => {
    const distance = Math.sqrt((seat.x - x) ** 2 + (seat.y - y) ** 2);
    return distance < 10; // 10px radius
  });
  
  if (clickedSeat && onSeatRightClick) {
    onSeatRightClick(clickedSeat);
  }
};

// Add to canvas element
<canvas
  ref={canvasRef}
  onContextMenu={handleContextMenu}
  // ... other props
/>
```

**Files to modify**:
- `src/components/FloorPlanViewer.tsx`

### 2. **Add Visual Indicators for Attributed Seats**
**Status**: Attributes stored but not visible on canvas

**What to do**:
- Render small badges/icons on seats with attributes
- Show 🪟 for near_window, 🚪 for near_entry, etc.
- Make attributed seats slightly different color (e.g., red with yellow border)

**Implementation**:
```typescript
// In FloorPlanViewer.tsx, when rendering reference seats
referenceSeats.forEach(seat => {
  // Draw seat dot
  ctx.fillStyle = seat.attributes ? '#FFD700' : '#FF0000'; // Gold if attributed
  ctx.arc(seat.x, seat.y, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw attribute badges
  if (seat.attributes) {
    let badgeX = seat.x + 8;
    const badgeY = seat.y - 8;
    
    if (seat.attributes.near_window) {
      ctx.fillText('🪟', badgeX, badgeY);
      badgeX += 12;
    }
    if (seat.attributes.near_entry) {
      ctx.fillText('🚪', badgeX, badgeY);
      badgeX += 12;
    }
    // ... other attributes
  }
});
```

### 3. **Add Seat Attribute Statistics Panel**
**Status**: No visibility into how many seats have attributes

**What to do**:
- Add stats panel showing:
  - Total seats with attributes
  - Breakdown by attribute type
  - Percentage of seats attributed

**Implementation**:
```typescript
// In App.tsx, add to statistics
const attributedSeats = referenceSeats.filter(s => s.attributes && Object.keys(s.attributes).length > 0);
const windowSeats = referenceSeats.filter(s => s.attributes?.near_window).length;
const entrySeats = referenceSeats.filter(s => s.attributes?.near_entry).length;
// ... etc
```

### 4. **Improve Preference Satisfaction Reporting**
**Status**: Only console logs, no UI feedback

**What to do**:
- Add preference satisfaction report after allocation
- Show which leaders got their preferences satisfied
- Display preference match percentage

**Implementation**:
```typescript
// Create PreferenceSatisfactionReport component
interface PreferenceReport {
  leader_name: string;
  preferences_requested: string[];
  preferences_satisfied: string[];
  satisfaction_score: number;
  seat_id: string;
}

// Generate report after allocation
const generatePreferenceReport = (leaders, allocatedSeats) => {
  return leaders.map(leader => {
    const seat = allocatedSeats.find(s => s.employee_id === leader.leader_id);
    // Calculate satisfaction...
  });
};
```

## MEDIUM-TERM ENHANCEMENTS

### 5. **Bulk Seat Attribute Assignment**
- Select multiple seats and assign attributes at once
- Draw a region and tag all seats in that region
- Import/export seat attributes as JSON

### 6. **Preference Priority Weighting**
- Allow leaders to rank preferences (high/medium/low priority)
- Adjust scoring based on priority
- Example: high priority = 20 points, medium = 10, low = 5

### 7. **Near Team Preference Implementation**
- Calculate distance from leader seat to team table centroid
- Score based on proximity
- Add visual lines showing leader-to-team connections

### 8. **Allocation Comparison View**
- Generate multiple allocation options
- Side-by-side comparison
- Highlight differences between options

### 9. **Export Functionality**
- Export allocation as PDF with floor plan
- Export as Excel with seat assignments
- Export as JSON for external systems

### 10. **Undo/Redo System**
- Track state changes
- Allow undo/redo for seat marking, table drawing
- Implement with command pattern

## LONG-TERM FEATURES

### 11. **Backend Integration**
- Replace localStorage with REST API
- User authentication and authorization
- Multi-user collaboration
- Real-time updates

### 12. **Advanced Constraints**
- Hard constraints (must be satisfied)
- Constraint conflict detection
- Constraint relaxation suggestions

### 13. **AI-Powered Suggestions**
- ML model to suggest optimal seat attributes
- Predict preference satisfaction
- Recommend table arrangements

### 14. **Mobile Support**
- Responsive design for tablets
- Touch-friendly controls
- Mobile-optimized modals

### 15. **Analytics Dashboard**
- Preference satisfaction trends
- Space utilization metrics
- Team cohesion analysis

## KNOWN ISSUES TO FIX

### Issue 1: Right-Click Not Working
**Problem**: SeatAttributeModal created but not triggered by right-click
**Solution**: Add onContextMenu handler to canvas (see step 1 above)

### Issue 2: No Visual Feedback for Attributes
**Problem**: Can't see which seats have attributes
**Solution**: Add visual indicators (see step 2 above)

### Issue 3: Preference Satisfaction Hidden
**Problem**: Only visible in console logs
**Solution**: Add UI report (see step 4 above)

### Issue 4: No Attribute Validation
**Problem**: Can save empty attributes
**Solution**: Add validation in SeatAttributeModal

### Issue 5: No Bulk Operations
**Problem**: Must tag seats one by one
**Solution**: Add multi-select and bulk assignment (see step 5)

## TESTING CHECKLIST

When continuing, test these scenarios:

### ADMIN Role Tests
- [ ] Mark seats on floor plan
- [ ] Right-click on seat opens SeatAttributeModal
- [ ] Set multiple attributes on a seat
- [ ] Save attributes and verify in localStorage
- [ ] Draw tables around seats
- [ ] Save seat map with attributes
- [ ] Clear seats and tables
- [ ] Import seats from JSON

### FACILITY_USER Role Tests
- [ ] Click on leader opens LeaderPreferenceModal
- [ ] Set multiple preferences for a leader
- [ ] Save preferences
- [ ] Generate allocation
- [ ] Verify leaders get seats matching preferences
- [ ] Check console logs for preference scores
- [ ] Hover over teams in legend to highlight
- [ ] Switch between allocation options

### Integration Tests
- [ ] ADMIN sets attributes → FACILITY_USER sees them in allocation
- [ ] Leader preferences match seat attributes correctly
- [ ] Team integrity maintained (teams sit together)
- [ ] Special needs employees get accessible seats
- [ ] Preference scoring works correctly (10 points per match)

## CODE QUALITY GUIDELINES

When continuing this project:

1. **TypeScript**: Use strict typing, no `any` types
2. **Comments**: Add JSDoc comments for complex functions
3. **Naming**: Use descriptive names (e.g., `handleSaveSeatAttributes` not `save`)
4. **Error Handling**: Add try-catch blocks and user-friendly error messages
5. **Console Logging**: Use emoji prefixes (✅, ⚠️, 🚀) for clarity
6. **Git Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

## USEFUL COMMANDS

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint

# View git log
git log --oneline --graph --all

# Check current branch
git branch

# View uncommitted changes
git status
```

## DOCUMENTATION TO READ

Before continuing, read these files:
1. `README.md` - Project overview
2. `LEADER_PREFERENCES.md` - Preference system details
3. `SEAT_ATTRIBUTES_GUIDE.md` - Attribute system details
4. `src/types/index.ts` - All type definitions

## EXAMPLE PROMPT TO START

Here's what you can say to Claude to continue:

---

**"I'm continuing work on the Space Allocation System V1 project. I've read the CONTINUE_PROJECT.md file. The immediate priority is to add the right-click handler to FloorPlanViewer so that ADMIN can right-click on seats to open the SeatAttributeModal. The modal component is already created at src/components/SeatAttributeModal.tsx, but it's not wired to the canvas yet. Can you help me implement the onContextMenu handler in FloorPlanViewer.tsx?"**

---

Or for a different task:

---

**"I'm continuing the Space Allocation System project. I want to add visual indicators on the floor plan to show which seats have attributes. Currently, attributed seats are stored but not visually different from regular seats. Can you help me modify FloorPlanViewer.tsx to render small emoji badges (🪟, 🚪, etc.) next to seats that have attributes?"**

---

## PROJECT GOALS REMINDER

The ultimate goal is to create a production-ready space allocation system that:
- ✅ Accurately matches leader preferences with seat attributes
- ✅ Maintains team integrity (teams sit together)
- ✅ Provides transparent, explainable allocations
- ✅ Offers intuitive UI for both ADMIN and FACILITY_USER
- ✅ Scales to large organizations (100+ employees)
- ✅ Supports multiple floor plans and buildings

## CONTACT & RESOURCES

- **Project Location**: `/Users/erapathania/space-allocation-v1`
- **Dev Server**: `http://localhost:5173/`
- **Git Repository**: Local (not pushed to remote yet)
- **Node Version**: Check with `node --version`
- **Package Manager**: npm

---

**Good luck continuing this project! Start with the immediate next steps and work your way through the enhancements. The foundation is solid, and the architecture is clean. You're in a great position to add powerful features!** 🚀
