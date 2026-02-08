# Clean Minimal Design - Flight Booking Style

## ✅ COMPLETED: Clean Minimal Seat Design

### Design Philosophy
The system now uses a **CLEAN, MINIMAL, FLIGHT-SEAT-BOOKING STYLE** UI:
- Small, uniform squares (24px)
- No visual clutter
- No shadows, layers, or thick borders
- Single flat square per seat
- Professional, enterprise-grade appearance

---

## 🎨 Seat Design Specifications

### Size & Shape
- **Seat size**: 24px × 24px (small, clean squares)
- **Icon size**: 16px × 16px (centered inside square)
- **Border radius**: 4px (minimal rounding)
- **Hit area**: 40px × 40px (invisible, for reliable hover)

### Visual Elements
**REMOVED:**
- ❌ Emojis
- ❌ Overlapping white cards
- ❌ Thick borders (4px+)
- ❌ Shadows
- ❌ Multiple layers per seat
- ❌ Leader gold outline (too cluttered)

**KEPT:**
- ✅ Single flat square
- ✅ Minimal border (1px default, 2px on hover)
- ✅ Clean icons (male/female images)
- ✅ Department-based colors

### Color System
**Base State:**
- Background: Light gray (#F5F5F5)
- Border: Light gray (#DDD)
- Icon opacity: 90%

**Highlighted State (on hover):**
- Background: Team color (70% opacity)
- Border: Team color (2px)
- Icon opacity: 90%

**Faded State (non-highlighted):**
- Overall opacity: 30%
- Everything fades together

---

## 🎯 Hover Behavior (Clean & Consistent)

### What Happens on Hover
1. **Highlighted team seats**:
   - Get team color background (70% opacity)
   - Get thicker border (2px) in team color
   - Remain fully visible

2. **Non-highlighted seats**:
   - Fade to 30% opacity
   - No other changes

3. **Tables**:
   - Tables with highlighted team get team color outline
   - Other tables fade to low opacity

### Tooltip
- **One tooltip at a time**
- **Follows cursor** (not fixed position)
- **Shows**: Name, Role, Seat ID, Team, Manager, Table
- **Clean design**: No popups on canvas

---

## 📐 Table-First Visual Grouping

### Table Visualization
- **Subtle outlines**: Very light stroke (1-2px)
- **Same table**: Same background tone
- **Different tables**: Slight spacing gap
- **No overlapping**: Seats align perfectly to table geometry

### Rules
- Seats must align to table boundaries
- No overlapping even on zoom
- Tables group seats visually
- Clear separation between tables

---

## 🎨 Color System (Simplified)

### Department-Based Colors
- **Each department** gets a base color (soft pastel)
- **Teams within department** get different shades
- **Leaders**: Darker shade
- **Managers**: Mid shade
- **ICs**: Light shade

### Color Constraints
- **Maximum 8 visible hues** on screen
- **No rainbow** effect
- **No harsh colors**
- **Soft, professional palette**

---

## 🏗️ Allocation Logic (Table-Strict)

### Priority Order
1. **Department**
2. **Team**
3. **Table**
4. **Seat**

### Hard Constraints
- ✅ **Same team MUST sit on SAME TABLE**
- ✅ **If table capacity < team size** → spill to NEXT table (same POD)
- ✅ **Never split team across PODs**
- ✅ **Leaders sit first**
- ✅ **Managers sit adjacent** to their team (same or next table)

### POD-Based Allocation
- **POD radius**: 400px (better clustering)
- **Department-to-POD**: Entire department in same POD
- **Sequential filling**: Tables filled one by one
- **No jumping**: Department stays in assigned POD

---

## 🔧 Performance Optimizations

### Precomputed Mappings
- **Team → Seats**: Computed once, reused on hover
- **Table → Seats**: Computed once, reused on hover
- **Department → PODs**: Computed during allocation

### Hover Performance
- **No re-render** on hover
- **Instant visual feedback**
- **No lag or delays**
- **Smooth transitions**

---

## 📋 Acceptance Criteria

### Visual Quality
✅ **Seats look clean** at first glance
✅ **No overlapping icons**
✅ **Same team grouping** is visually obvious
✅ **Looks like real enterprise product**
✅ **Can demo without explaining**

### Functional Quality
✅ **Hover works every time**
✅ **Team colors are consistent**
✅ **Tables highlight correctly**
✅ **Allocation respects table boundaries**
✅ **No visual noise or clutter**

---

## 🚀 Next Steps (Future Enhancements)

### Manual Override (Admin)
- Drag seat to seat
- Swap two seats
- Lock a seat
- Allocation engine respects locked seats

### Enhanced Color System
- Department color picker
- Team shade generator
- Color accessibility checks
- High contrast mode

### Advanced Hover
- Show team member count
- Display department name
- Keyboard shortcuts for team selection
- Multi-team selection

---

## 📝 Summary

The system now features a **clean, minimal, flight-booking-style UI**:
- **24px squares** with **16px icons**
- **No visual clutter** (no shadows, layers, thick borders)
- **Department-based colors** with team shades
- **Table-first grouping** with clear boundaries
- **Reliable hover** with instant feedback
- **Professional appearance** suitable for enterprise use

The design prioritizes **clarity, simplicity, and usability** over visual complexity.
