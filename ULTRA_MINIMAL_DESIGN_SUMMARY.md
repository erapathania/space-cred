# Ultra-Minimal Product Design Summary

## ✅ COMPLETED: Table-First, Ultra-Minimal UI

### Design Philosophy
The system now uses an **ULTRA-MINIMAL, TABLE-FIRST** design approach:
- **Tables are the primary visual unit** (not seats)
- **Seats are quiet and secondary** (very soft colors)
- **Visual hierarchy is clear**: Tables > Teams > Seats
- **Professional, calm appearance** suitable for leadership demos

---

## 🎨 Visual Hierarchy

### 1. Tables (PRIMARY)
**Always Visible:**
- Subtle background tint (5% opacity)
- Very soft pastel team colors
- 1px border (subtle, #E0E0E0)
- Tables visually "own" the seats inside them

**On Hover:**
- Background opacity increases to 20%
- Border becomes 2px in team color
- Non-highlighted tables fade to 20% opacity

### 2. Teams (SECONDARY)
**Visible on Hover:**
- All seats in team get brighter (50% opacity)
- Thin border appears (1.5px in team color)
- Tables containing team get highlighted
- Other elements fade to 20%

### 3. Seats (TERTIARY)
**Ultra Minimal:**
- Size: 20px × 20px (very small, quiet)
- Icon: 12px × 12px (tiny, centered)
- Color: Department color at 15% opacity (very soft)
- NO borders by default
- Border radius: 2px (almost flat)

---

## 📐 Size Specifications

### Seats
- **Size**: 20px × 20px
- **Icon**: 12px × 12px
- **Border radius**: 2px
- **Hit area**: 36px × 36px (invisible, for reliable hover)

### Reference Seats (Admin)
- **Radius**: 6px (small red dots)
- **Opacity**: 40%

### Tables
- **Border**: 1px (default), 2px (highlighted)
- **Fill opacity**: 5% (default), 20% (highlighted)
- **Stroke opacity**: 50% (default), 100% (highlighted)

---

## 🎨 Color System

### Department-Based Colors
- **Each department** gets ONE base color (soft pastel)
- **Teams within department** use same color, different opacity
- **Maximum 6 visible hues** on screen
- **NO rainbow effect**
- **NO harsh colors**

### Opacity Levels
**Seats:**
- Default: 15% (very soft, quiet)
- Highlighted: 50% (brighter, visible)
- Faded: 3% (20% of 15%, almost invisible)

**Tables:**
- Default: 5% (subtle tint)
- Highlighted: 20% (clear but not loud)
- Faded: 1% (20% of 5%, barely visible)

### Border Rules
**Seats:**
- Default: NO border (transparent)
- Highlighted: 1.5px border in team color

**Tables:**
- Default: 1px border (#E0E0E0)
- Highlighted: 2px border in team color

---

## 🎯 Hover Behavior

### What Happens on Hover
1. **Hovered team seats**:
   - Opacity increases from 15% to 50%
   - 1.5px border appears in team color
   - Remain fully visible

2. **Hovered team tables**:
   - Background opacity increases from 5% to 20%
   - Border becomes 2px in team color
   - Fully visible

3. **Non-highlighted elements**:
   - Fade to 20% opacity
   - Everything fades together (seats + tables)

4. **Tooltip**:
   - Shows: Name, Role, Seat ID, Team, Manager, Table
   - One tooltip at a time
   - Clean, minimal design

---

## 📋 Acceptance Criteria

### Visual Quality
✅ **UI looks calm** - no visual noise
✅ **Tables are obvious** - primary visual unit
✅ **Teams are obvious** - clear on hover
✅ **Seats feel secondary** - quiet, minimal
✅ **Looks demo-ready** - professional appearance
✅ **Clean at 60% zoom** - still readable

### Functional Quality
✅ **Hover works reliably** - 36px hit area
✅ **Team colors consistent** - same color everywhere
✅ **Tables always visible** - not just on hover
✅ **Allocation respects tables** - POD-based clustering
✅ **No overlapping** - seats align to tables

---

## 🏗️ Allocation Logic (Table-Strict)

### Priority Order
1. **Department** → assigned to POD
2. **Team** → assigned to table
3. **Table** → filled sequentially
4. **Seat** → assigned within table

### Hard Constraints
- ✅ Same team MUST sit on SAME TABLE
- ✅ Same department MUST sit in SAME POD
- ✅ Tables filled contiguously (no jumping)
- ✅ POD radius: 400px (better clustering)
- ✅ Leaders sit first (preference scoring)

---

## 🚀 Next Steps (Future Enhancements)

### Manual Seat Swapping (Facility User)
- Click seat → select
- Click another seat → swap occupants
- Drag employee from Seat A → drop on Seat B
- Mark as `manualOverride: true`
- Auto-allocation never overwrites manual changes

### Enhanced Visual Feedback
- Subtle team badge on tables
- POD boundary visualization
- Department color picker
- High contrast mode

### Performance Optimizations
- Precompute team → seats mapping
- Precompute table → seats mapping
- Memoize color calculations
- Virtual scrolling for large floor plans

---

## 📝 Summary

The system now features an **ultra-minimal, table-first design**:

### Visual Hierarchy
1. **Tables** (primary) - always visible, subtle tint
2. **Teams** (secondary) - visible on hover
3. **Seats** (tertiary) - very quiet, minimal

### Key Improvements
- **20px seats** with **12px icons** (ultra small)
- **NO borders** unless highlighted
- **Very soft colors** (15% opacity default)
- **Tables always visible** (primary visual unit)
- **Professional appearance** suitable for leadership demos

### Design Principles
- **If something draws attention, it better be important**
- **Seats are repetitive → visually quiet**
- **Tables and teams carry meaning → stand out**
- **Colors don't scream → calm, professional**

The design prioritizes **clarity, hierarchy, and professionalism** over visual complexity.
