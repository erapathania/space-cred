# Leader Seat Preferences - Soft Constraint System

## Overview

The Space Allocation System now supports **leader seat preferences** as **soft constraints**. This means leaders can express their seating preferences, and the allocation engine will try to satisfy them while **never breaking team/table integrity**.

## Key Principles

### 🎯 Soft Constraints
- Preferences **guide** allocation but don't **override** core rules
- Team integrity is **always maintained** (teams sit together on same table)
- Leaders are allocated **first** (before teams)
- If no suitable seat matches preferences, any available seat is used

### 🏆 Priority Order
1. **Leaders** (with preference scoring)
2. **Teams** (one team → one table)
3. **Special needs** employees (accessible seats)

## Available Preferences

Leaders can select from 5 preference types:

### 1. 🪟 Near Window
- **Description**: Prefer seats with natural light
- **Scoring Logic**: Seats on edges (x < 200 or x > 1800 or y < 200 or y > 1200)
- **Score**: +10 points

### 2. 🚪 Near Entry/Exit
- **Description**: Easy access to doors
- **Scoring Logic**: Seats in top-left quadrant (x < 1000 and y < 700)
- **Score**: +10 points

### 3. 👥 Near Team
- **Description**: Close to team tables
- **Scoring Logic**: Currently placeholder (future enhancement)
- **Score**: +0 points (not yet implemented)

### 4. 🤫 Quiet Zone
- **Description**: Away from high-traffic areas
- **Scoring Logic**: Distance from center > 800 pixels
- **Score**: +10 points

### 5. 📐 Corner/Edge Table
- **Description**: Prefer corner or edge positions
- **Scoring Logic**: Tables at corners (x < 300 or x > 1700) and (y < 300 or y > 1100)
- **Score**: +10 points

## How It Works

### 1. Setting Preferences (FACILITY_USER)

```typescript
// In the FACILITY_USER view, click on a leader button
// This opens the LeaderPreferenceModal

// Select preferences by checking boxes:
const preferences: LeaderPreferences = {
  near_window: true,
  quiet_zone: true,
  corner_edge: false,
  // ... other preferences
};

// Save preferences
handleSaveLeaderPreference(leaderId, preferences);
```

### 2. Allocation Engine Scoring

```typescript
function scoreSeatForLeader(
  seat: ReferenceSeat,
  leader: Leader,
  seats: ReferenceSeat[],
  tables: Table[]
): number {
  let score = 0;
  const prefs = leader.preferences;
  
  // No preferences = all seats equally good (score = 0)
  if (!prefs || Object.keys(prefs).length === 0) {
    return 0;
  }
  
  // Add points for each matching preference
  if (prefs.near_window && isEdgeSeat(seat)) score += 10;
  if (prefs.near_entry && isNearEntry(seat)) score += 10;
  if (prefs.quiet_zone && isQuietZone(seat)) score += 10;
  if (prefs.corner_edge && isCornerTable(seat, tables)) score += 10;
  
  return score;
}
```

### 3. Seat Selection

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
```

## UI Components

### LeaderPreferenceModal
- **Location**: `src/components/LeaderPreferenceModal.tsx`
- **Purpose**: Allow leaders to set their seat preferences
- **Features**:
  - Checkbox-based selection
  - Icons and descriptions for each preference
  - Clear messaging about soft constraints
  - Save/Cancel actions

### Leader Preference Panel (FACILITY_USER)
- **Location**: `src/App.tsx` (FACILITY_USER view)
- **Purpose**: Manage leader preferences
- **Features**:
  - List of leaders with department badges
  - Visual indicator (✓) for leaders with preferences
  - Click to open preference modal

## Example Scenarios

### Scenario 1: Leader with Window Preference
```typescript
const leader = {
  leader_id: 'L001',
  name: 'John Smith',
  department: 'Engineering',
  preferences: {
    near_window: true,
  }
};

// Allocation engine will:
// 1. Score all available seats
// 2. Edge seats get +10 points
// 3. Select highest scoring seat
// 4. Log: "⭐ John Smith (Engineering) → Seat REF-001 ✓ (score: 10)"
```

### Scenario 2: Leader with Multiple Preferences
```typescript
const leader = {
  leader_id: 'L002',
  name: 'Jane Doe',
  department: 'Marketing',
  preferences: {
    near_window: true,
    quiet_zone: true,
    corner_edge: true,
  }
};

// Allocation engine will:
// 1. Score all available seats
// 2. Seats matching all 3 preferences get +30 points
// 3. Seats matching 2 preferences get +20 points
// 4. Select highest scoring seat
// 5. Log: "⭐ Jane Doe (Marketing) → Seat REF-015 ✓ (score: 30)"
```

### Scenario 3: Leader with No Preferences
```typescript
const leader = {
  leader_id: 'L003',
  name: 'Bob Johnson',
  department: 'Sales',
  preferences: {}
};

// Allocation engine will:
// 1. All seats score 0 (no preferences)
// 2. Select first available seat
// 3. Log: "⭐ Bob Johnson (Sales) → Seat REF-020 (no prefs)"
```

## Console Logging

The allocation engine logs preference satisfaction:

```
👑 PHASE 1: Allocating 5 Leaders (with preference scoring)
  ⭐ John Smith (Engineering) → Seat REF-001 ✓ (score: 10)
  ⭐ Jane Doe (Marketing) → Seat REF-015 ✓ (score: 30)
  ⭐ Bob Johnson (Sales) → Seat REF-020 (no prefs)
  ⭐ Alice Brown (HR) → Seat REF-005 ✓ (score: 20)
  ⭐ Charlie Wilson (Finance) → Seat REF-012 ✓ (score: 10)
```

## Future Enhancements

### 1. Near Team Preference
- Calculate distance from leader seat to team table centroid
- Score based on proximity

### 2. Custom Preference Weights
- Allow leaders to prioritize preferences (high/medium/low)
- Adjust scoring based on priority

### 3. Preference Satisfaction Report
- Show which preferences were satisfied
- Provide alternative seat suggestions

### 4. Preference Conflicts
- Detect when preferences conflict with available seats
- Suggest compromises

### 5. Historical Preference Learning
- Track which preferences are most commonly satisfied
- Optimize floor plan layout based on patterns

## Technical Details

### Type Definitions
```typescript
// src/types/index.ts

export interface LeaderPreferences {
  near_window?: boolean;
  near_entry?: boolean;
  near_team?: boolean;
  quiet_zone?: boolean;
  corner_edge?: boolean;
  premium_seat?: boolean;  // Legacy
  near_managers?: boolean; // Legacy
}

export interface Leader {
  leader_id: string;
  name: string;
  department: string;
  preferences: LeaderPreferences;
  color: string;
}
```

### Allocation Function
```typescript
// src/utils/enhancedAllocationEngine.ts

export function allocateWithLeaders(
  seats: ReferenceSeat[],
  tables: Table[],
  teams: EnhancedTeam[]
): EnhancedAllocatedSeat[] {
  // Phase 1: Allocate leaders with preference scoring
  // Phase 2: Allocate teams (table-first)
  // Phase 3: Handle special needs
}
```

## Testing

### Manual Testing Steps
1. Switch to FACILITY_USER role
2. Click on a leader in the "Leader Preferences" panel
3. Select preferences in the modal
4. Click "Save Preferences"
5. Click "Generate Allocation"
6. Check console logs for preference satisfaction scores
7. Verify leader is allocated to appropriate seat

### Expected Behavior
- ✅ Modal opens when clicking leader button
- ✅ Preferences are saved when clicking "Save Preferences"
- ✅ Allocation engine uses preferences for scoring
- ✅ Console logs show preference scores
- ✅ Team integrity is maintained (teams still sit together)
- ✅ Leaders are allocated before teams

## Troubleshooting

### Issue: Preferences not being satisfied
**Cause**: Limited seat availability or conflicting constraints
**Solution**: Check console logs for actual scores. If all seats score 0, preferences may not match available seats.

### Issue: Modal not opening
**Cause**: Leader data not loaded or component not imported
**Solution**: Verify LEADERS array is populated and LeaderPreferenceModal is imported in App.tsx

### Issue: Preferences not persisting
**Cause**: In-memory storage only (no backend)
**Solution**: Preferences are session-only. For persistence, implement backend storage.

## Summary

The leader seat preference system provides a flexible, user-friendly way for leaders to express their seating preferences while maintaining the integrity of the table-first allocation architecture. By using a soft constraint approach, the system balances individual preferences with organizational needs, ensuring optimal space utilization and team cohesion.

---

**Version**: 1.0  
**Last Updated**: February 6, 2026  
**Author**: Space Allocation System Team
