# TABLE-FIRST ARCHITECTURE IMPLEMENTATION

## ✅ COMPLETED SO FAR

1. **Types Updated** (`src/types/index.ts`)
   - Added `Table` interface with bounding box and capacity
   - Added `table_id` to `ReferenceSeat`

2. **Storage Functions** (`src/utils/storage.ts`)
   - `saveTables()` and `loadTables()` functions added
   - Tables persist in localStorage

3. **Seat→Table Mapping** (`src/utils/tableMapping.ts`)
   - `mapSeatsToTables()` - assigns each seat to nearest table
   - `getSeatsForTable()` - filters seats by table
   - `getTableUsage()` - calculates capacity usage

4. **Team Data with Departments** (`src/data/teams.ts`)
   - Added `department` field to teams
   - 3 departments: Engineering, Product, Data
   - Helper functions: `getTeamsByDepartment()`, `getDepartments()`

5. **Checkpoint Saved**
   - Tag: `topresent` (before table-first refactor)
   - Can restore with: `git checkout topresent`

## 🚧 TODO: REMAINING WORK

### 1. ADMIN UI: Draw Table Rectangles

**File:** `src/components/FloorPlanViewer.tsx`

Add new mode: "Table Drawing Mode"

```typescript
// State
const [isTableDrawingMode, setIsTableDrawingMode] = useState(false);
const [drawingRect, setDrawingRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);

// Mouse handlers
- onMouseDown: Start rectangle
- onMouseMove: Update rectangle size
- onMouseUp: Finish rectangle, create Table object

// Render
- Draw semi-transparent rectangle while dragging
- Show all saved tables as outlined rectangles
```

**File:** `src/App.tsx`

Add admin panel:
```tsx
<button onClick={() => setIsTableDrawingMode(!isTableDrawingMode)}>
  {isTableDrawingMode ? '✓ Drawing Tables' : 'Draw Tables'}
</button>

<button onClick={handleSaveTables}>
  💾 Save Tables
</button>
```

### 2. TABLE-FIRST ALLOCATION ENGINE

**File:** `src/utils/tableAllocationEngine.ts` (NEW)

```typescript
export function allocateByTables(
  seats: ReferenceSeat[],  // with table_id assigned
  tables: Table[],
  teams: Team[]
): AllocatedSeat[] {
  
  // Step 1: Group teams by department
  const deptTeams = groupBy(teams, 'department');
  
  // Step 2: For each department
  for (const [dept, deptTeams] of Object.entries(deptTeams)) {
    
    // Step 3: For each team in department
    for (const team of deptTeams) {
      
      // Step 4: Find unused table with capacity >= team.team_size
      const availableTable = tables.find(t => 
        !isTableUsed(t) && 
        getSeatsForTable(seats, t.table_id).length >= team.team_size
      );
      
      if (!availableTable) {
        console.warn(`No table for team ${team.team_name}`);
        continue;
      }
      
      // Step 5: Assign ENTIRE team to that table
      const tableSeats = getSeatsForTable(seats, availableTable.table_id);
      const assignedSeats = tableSeats.slice(0, team.team_size);
      
      assignedSeats.forEach(seat => {
        seat.assigned_team = team.team_id;
        seat.assigned_manager = team.manager;
        seat.seat_type = SeatStatus.ASSIGNABLE;
      });
      
      markTableAsUsed(availableTable.table_id);
    }
  }
  
  return allocatedSeats;
}
```

**Key Rules:**
- NO seat-by-seat allocation
- Teams sit on SAME table
- Department → Zone → Table → Team → Seat hierarchy
- NO buffer logic

### 3. DEBUG MODE: Show Table Boundaries

**File:** `src/App.tsx`

Add toggle:
```tsx
const [showTableBoundaries, setShowTableBoundaries] = useState(false);

<button onClick={() => setShowTableBoundaries(!showTableBoundaries)}>
  {showTableBoundaries ? '✓ Show Tables' : 'Show Tables'}
</button>
```

**File:** `src/components/FloorPlanViewer.tsx`

Render tables when debug mode ON:
```tsx
{showTableBoundaries && tables.map(table => (
  <g key={table.table_id}>
    <rect
      x={table.x}
      y={table.y}
      width={table.width}
      height={table.height}
      fill="none"
      stroke="#FFD700"
      strokeWidth={3}
      strokeDasharray="10,5"
    />
    <text x={table.x + 10} y={table.y + 20} fill="#FFD700">
      {table.table_id}
    </text>
    <text x={table.x + 10} y={table.y + 40} fill="#FFD700">
      Capacity: {table.capacity}
    </text>
  </g>
))}
```

### 4. UPDATE APP.TSX WORKFLOW

**New Admin Workflow:**
1. Mark seats (existing)
2. **Draw tables** (NEW)
3. **Map seats to tables** (automatic)
4. Save seat map + tables

**New Facility User Workflow:**
1. Load seats + tables
2. Generate allocation (table-first)
3. View colored seats grouped by table

### 5. VISUAL REPRESENTATION

**Seats:**
- Small colored squares (24x24px)
- Color = team color
- Number label = seat order within team

**Tables (Debug Mode):**
- Gold dashed outline
- Label: TABLE-ID, Capacity, Assigned Team

**Hover Tooltip:**
```
Employee: [name]
Team: [team_name]
Department: [department]
Table: [table_id]
```

## 🎯 SUCCESS CRITERIA

✅ Admin can draw table rectangles on floor plan
✅ Seats automatically map to nearest table
✅ Teams sit on SAME table (not scattered)
✅ Departments are visually separated
✅ Debug mode shows table boundaries
✅ Allocation makes sense by eye

## 📝 IMPLEMENTATION ORDER

1. Add table drawing UI to FloorPlanViewer
2. Add admin controls to App.tsx
3. Implement table-first allocation engine
4. Add debug mode toggle
5. Update FloorPlanViewer to show tables
6. Test with real floor plan
7. Verify teams sit together at tables

## 🔄 RESTORE CHECKPOINT

If needed, restore previous state:
```bash
git checkout topresent
```

## 📂 FILES TO MODIFY

- [ ] `src/components/FloorPlanViewer.tsx` - Add table drawing
- [ ] `src/App.tsx` - Add table controls + debug toggle
- [ ] `src/utils/tableAllocationEngine.ts` - NEW FILE
- [ ] `src/utils/allocationEngine.ts` - Replace with table-first logic

## 🚨 CRITICAL RULES

1. **Tables FIRST, seats SECOND**
2. **Teams on SAME table** (never split)
3. **Department → Zone → Table → Team → Seat**
4. **NO buffer logic**
5. **Visual validation via debug mode**
