# Seat Attributes System - Complete Guide

## Overview

The Space Allocation System now uses an **explicit seat attribute system** instead of coordinate heuristics. This provides **accurate, transparent preference matching** for leader seat allocation.

## The Problem We Solved

### ❌ Old Approach (Coordinate Heuristics)
```typescript
// Guessing based on coordinates - INACCURATE!
if (prefs.near_window) {
  const isEdge = seat.x < 200 || seat.x > 1800 || seat.y < 200 || seat.y > 1200;
  if (isEdge) score += 10;  // Assumes edges = windows
}

if (prefs.near_entry) {
  if (seat.x < 1000 && seat.y < 700) score += 10;  // Assumes top-left = entry
}
```

**Problems:**
- ❌ Assumes window/door locations based on coordinates
- ❌ Not accurate for real floor plans
- ❌ Hard to maintain and adjust
- ❌ No way to verify correctness

### ✅ New Approach (Explicit Attributes)
```typescript
// Direct attribute matching - ACCURATE!
if (prefs.near_window && attrs.near_window) {
  score += 10;  // ADMIN explicitly marked this seat as near window
}

if (prefs.near_entry && attrs.near_entry) {
  score += 10;  // ADMIN explicitly marked this seat as near entry
}
```

**Benefits:**
- ✅ ADMIN explicitly defines seat characteristics
- ✅ Accurate for any floor plan layout
- ✅ Easy to verify and adjust
- ✅ Transparent matching logic

## Seat Attributes

### Available Attributes

| Attribute | Icon | Description | Use Case |
|-----------|------|-------------|----------|
| `near_window` | 🪟 | Seat has natural light from window | Leaders who prefer natural light |
| `near_entry` | 🚪 | Seat is close to doors | Leaders who need easy access |
| `corner_position` | 📐 | Seat is in a corner or edge | Leaders who prefer privacy |
| `quiet_zone` | 🤫 | Seat is in a quiet area | Leaders who need focus |
| `accessible` | ♿ | Wheelchair accessible seat | Special needs employees |
| `premium` | ⭐ | High-quality or special seat | VIP seating |

### Type Definition

```typescript
export interface SeatAttributes {
  near_window?: boolean;
  near_entry?: boolean;
  corner_position?: boolean;
  quiet_zone?: boolean;
  accessible?: boolean;
  premium?: boolean;
}

export interface ReferenceSeat {
  seat_ref_id: string;
  x: number;
  y: number;
  table_id?: string;
  attributes?: SeatAttributes;  // NEW!
}
```

## How to Use (ADMIN Workflow)

### Step 1: Mark Seats
1. Switch to **ADMIN** role
2. Click "Mark Seats" button
3. Click on floor plan to create red dots (seats)

### Step 2: Set Seat Attributes
1. **Right-click** on any seat (red dot)
2. SeatAttributeModal opens
3. Check the attributes that apply to this seat:
   - ✅ Near Window (if seat is by a window)
   - ✅ Near Entry (if seat is by a door)
   - ✅ Corner Position (if seat is in a corner)
   - ✅ Quiet Zone (if seat is in a quiet area)
   - ✅ Accessible (if wheelchair accessible)
   - ✅ Premium (if special/VIP seat)
4. Click "Save Attributes"

### Step 3: Draw Tables
1. Click "Draw Tables" button
2. Drag rectangles around table areas

### Step 4: Save
1. Click "Save Seat Map + Tables"
2. Seats with attributes are saved to localStorage

## How It Works (Technical Flow)

### 1. ADMIN Sets Attributes

```typescript
// User right-clicks on seat REF-001
handleSeatRightClick(seat);

// Modal opens, user selects attributes
const attributes: SeatAttributes = {
  near_window: true,
  quiet_zone: true,
};

// Attributes saved to seat
handleSaveSeatAttributes('REF-001', attributes);

// Seat now has attributes
{
  seat_ref_id: 'REF-001',
  x: 150,
  y: 200,
  table_id: 'TABLE-001',
  attributes: {
    near_window: true,
    quiet_zone: true,
  }
}
```

### 2. FACILITY_USER Sets Leader Preferences

```typescript
// User clicks on leader
setSelectedLeader(leader);

// Modal opens, user selects preferences
const preferences: LeaderPreferences = {
  near_window: true,
  quiet_zone: true,
};

// Preferences saved to leader
handleSaveLeaderPreference('L001', preferences);
```

### 3. Allocation Engine Matches

```typescript
function scoreSeatForLeader(
  seat: ReferenceSeat,
  leader: Leader,
  seats: ReferenceSeat[],
  tables: Table[]
): number {
  let score = 0;
  const prefs = leader.preferences;
  const attrs = seat.attributes || {};
  
  // Direct attribute matching
  if (prefs.near_window && attrs.near_window) score += 10;
  if (prefs.near_entry && attrs.near_entry) score += 10;
  if (prefs.quiet_zone && attrs.quiet_zone) score += 10;
  if (prefs.corner_edge && attrs.corner_position) score += 10;
  if (prefs.premium_seat && attrs.premium) score += 5;
  
  return score;
}

// Example scoring:
// Leader wants: near_window + quiet_zone
// Seat has: near_window + quiet_zone
// Score: 10 + 10 = 20 points ✅

// Leader wants: near_window + quiet_zone
// Seat has: near_window only
// Score: 10 points (partial match)

// Leader wants: near_window + quiet_zone
// Seat has: near_entry only
// Score: 0 points (no match)
```

### 4. Best Seat Selected

```typescript
// Get all available seats
const availableSeats = seats.filter(s => !usedSeats.has(s.seat_ref_id));

// Score each seat
const scoredSeats = availableSeats.map(seat => ({
  seat,
  score: scoreSeatForLeader(seat, leader, seats, tables),
}));

// Sort by score (highest first)
scoredSeats.sort((a, b) => b.score - a.score);

// Pick the best seat
const leaderSeat = scoredSeats[0].seat;

console.log(`⭐ ${leader.name} → Seat ${leaderSeat.seat_ref_id} ✓ (score: ${scoredSeats[0].score})`);
```

## Example Scenarios

### Scenario 1: Perfect Match

```typescript
// Leader preferences
const leader = {
  name: 'John Smith',
  preferences: {
    near_window: true,
    quiet_zone: true,
  }
};

// Seat attributes
const seat = {
  seat_ref_id: 'REF-015',
  attributes: {
    near_window: true,
    quiet_zone: true,
  }
};

// Scoring
score = 10 (near_window) + 10 (quiet_zone) = 20 points ✅
// Result: Perfect match! Leader gets this seat.
```

### Scenario 2: Partial Match

```typescript
// Leader preferences
const leader = {
  name: 'Jane Doe',
  preferences: {
    near_window: true,
    near_entry: true,
    quiet_zone: true,
  }
};

// Seat attributes
const seat = {
  seat_ref_id: 'REF-020',
  attributes: {
    near_window: true,
    quiet_zone: true,
  }
};

// Scoring
score = 10 (near_window) + 10 (quiet_zone) = 20 points
// Note: near_entry not matched (seat doesn't have it)
// Result: Good match (2 out of 3 preferences satisfied)
```

### Scenario 3: No Match

```typescript
// Leader preferences
const leader = {
  name: 'Bob Johnson',
  preferences: {
    near_window: true,
    corner_position: true,
  }
};

// Seat attributes
const seat = {
  seat_ref_id: 'REF-025',
  attributes: {
    near_entry: true,
    accessible: true,
  }
};

// Scoring
score = 0 (no matching attributes)
// Result: No preference match, but seat still usable
```

## Visual Indicators (Future Enhancement)

To make attributed seats visible, we can add visual indicators:

```typescript
// In FloorPlanViewer, render seat with attribute badges
{seat.attributes?.near_window && <span className="attr-badge">🪟</span>}
{seat.attributes?.near_entry && <span className="attr-badge">🚪</span>}
{seat.attributes?.corner_position && <span className="attr-badge">📐</span>}
{seat.attributes?.quiet_zone && <span className="attr-badge">🤫</span>}
{seat.attributes?.accessible && <span className="attr-badge">♿</span>}
{seat.attributes?.premium && <span className="attr-badge">⭐</span>}
```

## Storage

Seat attributes are stored in localStorage along with seat data:

```json
{
  "referenceSeats": [
    {
      "seat_ref_id": "REF-001",
      "x": 150,
      "y": 200,
      "table_id": "TABLE-001",
      "attributes": {
        "near_window": true,
        "quiet_zone": true
      }
    },
    {
      "seat_ref_id": "REF-002",
      "x": 250,
      "y": 200,
      "table_id": "TABLE-001",
      "attributes": {
        "near_entry": true
      }
    }
  ]
}
```

## Best Practices

### For ADMIN

1. **Be Accurate**: Only mark attributes that truly apply
   - Don't mark "near_window" if seat is far from windows
   - Don't mark "quiet_zone" if area is high-traffic

2. **Be Consistent**: Use same criteria across all seats
   - Define what "near" means (e.g., within 2 meters)
   - Apply consistently to all seats

3. **Document Decisions**: Keep notes on attribute criteria
   - "near_window = within 2m of window"
   - "quiet_zone = away from main walkways"

4. **Review Regularly**: Update attributes when layout changes
   - New windows installed → update near_window
   - Door relocated → update near_entry

### For FACILITY_USER

1. **Set Realistic Preferences**: Don't over-constrain
   - Selecting all preferences may result in no perfect matches
   - Prioritize most important preferences

2. **Understand Soft Constraints**: Preferences are guidelines
   - System tries to satisfy but doesn't guarantee
   - Team integrity always takes priority

3. **Check Console Logs**: See preference satisfaction
   - Look for "✓ (score: X)" in allocation logs
   - Higher scores = better preference match

## Troubleshooting

### Issue: Leader not getting preferred seat

**Possible Causes:**
1. No seats have the required attributes
   - **Solution**: ADMIN needs to mark more seats with attributes

2. Preferred seats already taken by other leaders
   - **Solution**: Increase number of attributed seats

3. Preferred seats on wrong table (team needs that table)
   - **Solution**: This is correct behavior (team integrity > preferences)

### Issue: Attributes not saving

**Possible Causes:**
1. Not clicking "Save Seat Map" after setting attributes
   - **Solution**: Always save after making changes

2. localStorage full or disabled
   - **Solution**: Clear browser data or enable localStorage

### Issue: Modal not opening on right-click

**Possible Causes:**
1. Not in ADMIN role
   - **Solution**: Switch to ADMIN role first

2. Browser blocking context menu
   - **Solution**: Allow context menu in browser settings

## Summary

The seat attribute system provides:

✅ **Accuracy**: ADMIN explicitly defines seat characteristics
✅ **Transparency**: Clear matching between preferences and attributes  
✅ **Flexibility**: Easy to add/remove attributes as needed
✅ **Maintainability**: No hardcoded coordinate logic
✅ **Scalability**: Works for any floor plan layout

This system ensures that leader preferences are matched accurately while maintaining the integrity of the table-first allocation architecture.

---

**Version**: 1.0  
**Last Updated**: February 6, 2026  
**Author**: Space Allocation System Team
