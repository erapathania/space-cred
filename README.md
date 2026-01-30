# Space Allocation System V1

**Pixel-Perfect Seat Selection Tool for Office Floor Plans**

Built from scratch following strict requirements for accuracy and precision.

---

## 🎯 Core Principle

**Pixels are sacred.** This system behaves exactly like Python's matplotlib:

```python
ax.imshow(img)
ax.plot(x, y, 'ro')
```

If a dot appears at `(x, y)` in Python, it appears at the **exact same pixel** in this UI.

---

## ✅ What This System Does

### V1 Scope (Current)

1. **Load Floor Plan** - Display at native pixel resolution (e.g., 2482×1755)
2. **Import Reference Seats** - Red dots from OCR/AI detection (JSON format)
3. **Manual Seat Selection** - Admin clicks near red dots to snap-select seats
4. **Seat Management** - Change status (Assignable/Reserved/Buffer), delete seats
5. **Export Seats** - Export selected seats as clean JSON for allocation logic

### What V1 Does NOT Do

❌ Auto-generate seat grids  
❌ Create zones (comes in V2)  
❌ Run allocation algorithms  
❌ Normalize coordinates  
❌ Use CSS transforms for zoom/pan  

---

## 🏗️ Architecture

### Three-Layer System

```
Layer 1: Floor Plan Image (PNG/JPG at native resolution)
Layer 2: Reference Seats (RED DOTS - read-only, from detection)
Layer 3: Selected Seats (GREEN/ORANGE/GRAY DOTS - admin-selected)
```

### Coordinate System

- **Origin**: `(0, 0)` = top-left corner of image
- **Units**: Raw image pixels (no normalization)
- **Zoom/Pan**: SVG `viewBox` only (no CSS transforms)
- **Click Detection**: True SVG coordinates via `getScreenCTM().inverse()`

---

## 🚀 Quick Start

### 1. Install & Run

```bash
cd space-allocation-v1
npm install
npm run dev
```

The app will open at `http://localhost:5174` (or next available port).

### 2. Import Reference Seats

1. Click **"📥 Import Reference Seats"** in the sidebar
2. Select a JSON file with this format:

```json
[
  {
    "seat_ref_id": "REF-001",
    "x": 742,
    "y": 318
  },
  {
    "seat_ref_id": "REF-002",
    "x": 780,
    "y": 318
  }
]
```

A sample file is included: `public/sample-reference-seats.json`

### 3. Enable Marking Mode

Click **"Enable Marking Mode"** button. The cursor will change to a crosshair.

### 4. Add Seats

Click near any red dot (within 15 pixels). The system will:
- Find the nearest red dot
- Snap to its exact `(x, y)` position
- Create a green dot (Assignable seat)
- Assign a unique ID (S-001, S-002, etc.)

### 5. Edit Seats

1. Click on green/orange/gray dots to select them (they turn blue)
2. Use the **"Edit Seats"** panel to:
   - Change status (→ Assignable, → Reserved, → Buffer)
   - Delete selected seats

### 6. Export Seats

1. Select seats by clicking them (they turn blue)
2. Click **"📤 Export Selected"**
3. Download JSON file with this format:

```json
[
  {
    "seat_id": "S-001",
    "x": 742,
    "y": 318,
    "seat_type": "ASSIGNABLE"
  }
]
```

---

## 📁 Project Structure

```
space-allocation-v1/
├── public/
│   ├── assets/
│   │   └── floor-plan.jpg          # Your floor plan image
│   └── sample-reference-seats.json # Sample reference data
├── src/
│   ├── components/
│   │   ├── FloorPlanViewer.tsx     # Main viewer component
│   │   └── FloorPlanViewer.css     # Viewer styles
│   ├── types/
│   │   └── index.ts                # TypeScript definitions
│   ├── App.tsx                     # Main app component
│   ├── App.css                     # App styles
│   ├── index.css                   # Global styles
│   └── main.tsx                    # Entry point
└── README.md                       # This file
```

---

## 🎨 Color Legend

- 🔴 **Red Dots** = Reference seats (from detection, read-only)
- 🟢 **Green Dots** = Assignable seats
- 🟠 **Orange Dots** = Reserved seats
- ⚫ **Gray Dots** = Buffer seats
- 🔵 **Blue Dots** = Currently selected seats

---

## 🔧 Technical Details

### Pixel-Perfect Implementation

```typescript
// Load image at native resolution
const img = new Image();
img.onload = () => {
  setImgW(img.naturalWidth);   // e.g., 2482
  setImgH(img.naturalHeight);  // e.g., 1755
};

// SVG matches image dimensions exactly
<svg width={imgW} height={imgH} viewBox={`${x} ${y} ${w} ${h}`}>
  <image href={imagePath} x={0} y={0} width={imgW} height={imgH} />
  <circle cx={seat.x} cy={seat.y} r={7} />
</svg>

// Get true pixel coordinates from clicks
const pt = svg.createSVGPoint();
pt.x = e.clientX;
pt.y = e.clientY;
const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
// cursor.x, cursor.y are TRUE image pixels
```

### Snap-to-Seat Logic

```typescript
const SNAP_THRESHOLD = 15; // pixels

function findNearestReferenceSeat(clickX, clickY) {
  let nearest = null;
  let minDistance = SNAP_THRESHOLD;
  
  for (const refSeat of referenceSeats) {
    const distance = Math.sqrt(
      (refSeat.x - clickX) ** 2 + 
      (refSeat.y - clickY) ** 2
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = refSeat;
    }
  }
  
  return nearest;
}
```

---

## ✅ Acceptance Tests

All tests pass:

- ✅ Dot at `(0, 0)` → top-left pixel
- ✅ Dot at `(imgWidth/2, imgHeight/2)` → exact center
- ✅ Red dots align exactly on seat visuals
- ✅ Green dots snap exactly to red dots
- ✅ Zoom/pan causes no coordinate drift
- ✅ Clicking empty space does nothing
- ✅ Behavior matches Python matplotlib

---

## 🚫 Forbidden Patterns (NOT USED)

This implementation strictly avoids:

- ❌ CSS transforms for zoom/pan
- ❌ Normalized coordinates (0-1 range)
- ❌ Responsive image scaling
- ❌ Auto-generated seat grids
- ❌ Guessing seat positions
- ❌ Zones (V2 feature)

---

## 📊 Export Format

**STRICT**: Only exports admin-selected seats. No reference-only seats, no unselected seats, no zones.

```json
[
  {
    "seat_id": "S-001",
    "x": 742,
    "y": 318,
    "seat_type": "ASSIGNABLE"
  },
  {
    "seat_id": "S-002",
    "x": 780,
    "y": 318,
    "seat_type": "RESERVED"
  }
]
```

---

## 🎯 Next Steps (V2+)

After V1 is complete and validated:

1. Zone creation and management
2. Seat clustering algorithms
3. Team affinity mapping
4. AI-powered allocation recommendations
5. Conflict resolution
6. Reporting and analytics

---

## 🛠️ Development

### Built With

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **SVG** - Pixel-perfect rendering

### Key Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "~5.6.2",
  "vite": "^7.3.1"
}
```

### Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 📝 License

Internal CRED tool - Not for public distribution

---

## 🤝 Support

For issues or questions, contact the Space Allocation team.

---

**Built with precision. No compromises on accuracy.**
