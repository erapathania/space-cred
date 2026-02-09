/**
 * FloorPlanViewer Component - TABLE-FIRST ARCHITECTURE
 * 
 * ADMIN: Can create reference seats (red dots) AND draw table rectangles
 * FACILITY_USER: Views colored team allocations
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ReferenceSeat, AllocatedSeat, Table, EnhancedAllocatedSeat } from '../types';
import { REFERENCE_SEAT_COLOR } from '../types';
import './FloorPlanViewer.css';

// Rendering constants - CLEAN, ENTERPRISE-GRADE DESIGN
const REF_SEAT_RADIUS = 12;     // Larger red dots for excellent visibility (upgraded from 9px)
const SEAT_SIZE = 36;           // Very large squares for bigger icons (upgraded from 32px)
const ICON_SIZE = 32;           // Maximum size icons for best clarity (upgraded from 28px)
const BORDER_RADIUS = 4;        // Slightly rounded, modern (upgraded from 2px)
const SEAT_BORDER_WIDTH = 1.5;  // Consistent border
const HOVER_SCALE = 1.05;       // Subtle scale on hover

interface FloorPlanViewerProps {
  imagePath: string;
  referenceSeats: ReferenceSeat[];
  allocatedSeats: AllocatedSeat[];
  enhancedSeats?: EnhancedAllocatedSeat[]; // NEW: Enhanced seat data with employee info
  tables: Table[];
  onDirectClick?: (x: number, y: number) => void;
  onTableDrawn?: (table: Omit<Table, 'table_id'>) => void;
  isReferenceMarkingMode?: boolean;
  isTableDrawingMode?: boolean;
  showTableBoundaries?: boolean;
  isReadOnly?: boolean;
  getTeamColor?: (teamId: string) => string;
  highlightedTeam?: string | null;
  lockedSeats?: Set<string>;  // NEW: Seats that are locked from allocation changes
  onSeatLock?: (seatRefId: string) => void;
  onSeatUnlock?: (seatRefId: string) => void;
  onSeatSwap?: (seatId1: string, seatId2: string) => void;
  manualActionMode?: 'SWAP' | 'ADD' | 'DELETE' | null; // NEW: Manual action mode
  onAddSeat?: (x: number, y: number) => void; // NEW: Add seat handler
  onDeleteSeat?: (seatRefId: string) => void; // NEW: Delete seat handler
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DrawingRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  imagePath,
  referenceSeats,
  allocatedSeats,
  enhancedSeats = [],
  tables,
  onDirectClick,
  onTableDrawn,
  isReferenceMarkingMode = false,
  isTableDrawingMode = false,
  showTableBoundaries = false,
  isReadOnly = false,
  getTeamColor,
  highlightedTeam,
  lockedSeats = new Set(),
  onSeatLock,
  onSeatUnlock,
  onSeatSwap,
  manualActionMode = null,
  onAddSeat,
  onDeleteSeat,
}) => {
  console.log('🔍 FloorPlanViewer render - isReadOnly:', isReadOnly, 'onSeatSwap:', !!onSeatSwap);
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<EnhancedAllocatedSeat | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const [draggedSeat, setDraggedSeat] = useState<AllocatedSeat | null>(null);

  // Use ref to track dragged seat to avoid closure issues
  const draggedSeatRef = useRef<AllocatedSeat | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Load floor plan image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImgW(w);
      setImgH(h);
      setView({ x: 0, y: 0, w, h });
    };
    img.src = imagePath;
  }, [imagePath]);

  // Get SVG coordinates from mouse event
  const getSvgCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.round(cursor.x), y: Math.round(cursor.y) };
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isReadOnly) return;

    const coords = getSvgCoords(e);
    if (!coords) return;

    // Table drawing mode
    if (isTableDrawingMode) {
      setDrawingRect({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });
      return;
    }

    // Don't start panning if we might be dragging a seat
    if (draggedSeat) {
      return; // Let seat handle the drag
    }

    // Pan mode (when not in any special mode)
    if (!isReferenceMarkingMode && e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    // Update drawing rectangle
    if (drawingRect && isTableDrawingMode) {
      const coords = getSvgCoords(e);
      if (coords) {
        setDrawingRect({
          ...drawingRect,
          currentX: coords.x,
          currentY: coords.y,
        });
      }
      return;
    }

    // Pan
    if (isPanning && svgRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      const svg = svgRef.current;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const scale = ctm.a;
        const svgDx = -dx / scale;
        const svgDy = -dy / scale;
        
        setView(v => ({
          x: v.x + svgDx,
          y: v.y + svgDy,
          w: v.w,
          h: v.h,
        }));
        
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  // Handle mouse up
  const handleMouseUp = (_e: React.MouseEvent<SVGSVGElement>) => {
    // Finish drawing table
    if (drawingRect && isTableDrawingMode && onTableDrawn) {
      const x = Math.min(drawingRect.startX, drawingRect.currentX);
      const y = Math.min(drawingRect.startY, drawingRect.currentY);
      const width = Math.abs(drawingRect.currentX - drawingRect.startX);
      const height = Math.abs(drawingRect.currentY - drawingRect.startY);

      // Only create table if rectangle is big enough
      if (width > 20 && height > 20) {
        onTableDrawn({
          x,
          y,
          width,
          height,
          capacity: 10, // Default capacity, can be edited later
        });
      }

      setDrawingRect(null);
      return;
    }

    setIsPanning(false);
  };

  // Handle click (for seat marking)
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // ADMIN: Reference marking mode
    if (isReferenceMarkingMode && onDirectClick) {
      const coords = getSvgCoords(e);
      if (coords) {
        onDirectClick(coords.x, coords.y);
      }
      return;
    }

    // FACILITY_USER: Add seat mode
    if (manualActionMode === 'ADD' && onAddSeat) {
      const coords = getSvgCoords(e);
      if (coords) {
        onAddSeat(coords.x, coords.y);
      }
      return;
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.3, 5);
    const cx = view.x + view.w / 2;
    const cy = view.y + view.h / 2;
    setZoom(newZoom);
    setView({
      x: cx - imgW / (2 * newZoom),
      y: cy - imgH / (2 * newZoom),
      w: imgW / newZoom,
      h: imgH / newZoom,
    });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.3, 0.3);
    const cx = view.x + view.w / 2;
    const cy = view.y + view.h / 2;
    setZoom(newZoom);
    setView({
      x: cx - imgW / (2 * newZoom),
      y: cy - imgH / (2 * newZoom),
      w: imgW / newZoom,
      h: imgH / newZoom,
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setView({ x: 0, y: 0, w: imgW, h: imgH });
  };

  if (!imgW || !imgH) {
    return <div className="floor-plan-loading">Loading floor plan...</div>;
  }

  // Group seats by team for numbering
  const seatsByTeam = new Map<string, AllocatedSeat[]>();
  allocatedSeats.forEach(seat => {
    if (seat.assigned_team) {
      if (!seatsByTeam.has(seat.assigned_team)) {
        seatsByTeam.set(seat.assigned_team, []);
      }
      seatsByTeam.get(seat.assigned_team)!.push(seat);
    }
  });

  // Determine cursor style
  let cursorStyle = 'grab';
  if (isPanning) cursorStyle = 'grabbing';
  else if (isReferenceMarkingMode) cursorStyle = 'crosshair';
  else if (isTableDrawingMode) cursorStyle = 'crosshair';
  else if (draggedSeat) cursorStyle = 'grabbing';

  return (
    <div className="floor-plan-viewer">
      <div className="viewer-header">
        <h2>Aqua 2nd Floor - CRED Office</h2>
        <div className="viewer-info">
          <span className="dimension-badge">{imgW} × {imgH} pixels</span>
          <span className="zoom-badge">{Math.round(zoom * 100)}%</span>
          {isReadOnly && <span className="readonly-badge">READ-ONLY</span>}
          {!isReadOnly && allocatedSeats.length > 0 && <span className="mode-badge" style={{ backgroundColor: '#10B981', color: 'white' }}>✋ DRAG ENABLED</span>}
          {isTableDrawingMode && <span className="mode-badge">DRAWING TABLES</span>}
          {showTableBoundaries && <span className="mode-badge">DEBUG MODE</span>}
        </div>
        <div className="zoom-controls">
          <button onClick={handleZoomIn} className="zoom-btn">+</button>
          <button onClick={handleZoomOut} className="zoom-btn">−</button>
          <button onClick={handleResetView} className="zoom-btn">⟲</button>
        </div>
      </div>

      <div
        className="viewer-canvas"
        style={{ cursor: cursorStyle }}
        onMouseUp={() => {
          // Cancel drag if clicking on empty space
          if (draggedSeat) {
            console.log('❌ CANCEL DRAG (clicked empty space)');
            draggedSeatRef.current = null;
            setDraggedSeat(null);
          }
        }}
      >
        <svg
          ref={svgRef}
          width={imgW}
          height={imgH}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleSvgClick}
          className="floor-plan-svg"
        >
          {/* Floor plan image */}
          <image
            href={imagePath}
            x={0}
            y={0}
            width={imgW}
            height={imgH}
            preserveAspectRatio="none"
          />

          {/* Tables - ALWAYS VISIBLE (primary visual unit) */}
          {tables.map(table => {
            const seatsInTable = referenceSeats.filter(s => s.table_id === table.table_id).length;
            
            // Check if this table contains seats from the hovered/highlighted team
            const activeTeam = hoveredTeam || highlightedTeam;
            const tableSeats = allocatedSeats.filter(s => {
              const refSeat = referenceSeats.find(r => r.seat_ref_id === s.seat_ref_id);
              return refSeat?.table_id === table.table_id;
            });
            const hasActiveTeam = activeTeam && tableSeats.some(s => s.assigned_team === activeTeam);
            const isFaded = activeTeam && !hasActiveTeam;
            
            // Get team color for this table (very soft pastel)
            const tableTeam = tableSeats.find(s => s.assigned_team)?.assigned_team;
            const teamColor = tableTeam && getTeamColor ? getTeamColor(tableTeam) : '#F5F5F5';
            
            return (
              <g key={table.table_id}>
                {/* Table background - subtle tint with team color */}
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  fill={teamColor}
                  fillOpacity={hasActiveTeam ? 0.15 : 0.03}
                  stroke="transparent"
                  strokeWidth={0}
                  rx={8}
                  style={{ pointerEvents: 'none' }}
                />

                {/* Table outline - dashed, subtle (always visible for grouping) */}
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  fill="transparent"
                  stroke={hasActiveTeam ? teamColor : "#C0C0C0"}
                  strokeWidth={hasActiveTeam ? 2 : 1}
                  strokeDasharray="4 4"
                  strokeOpacity={isFaded ? 0.15 : (hasActiveTeam ? 0.8 : 0.3)}
                  rx={8}
                  style={{ pointerEvents: 'none' }}
                />

                {/* Table labels (only in debug/drawing mode) */}
                {(showTableBoundaries || isTableDrawingMode) && (
                  <>
                    <text
                      x={table.x + 10}
                      y={table.y + 20}
                      fill="#999"
                      fontSize="12"
                      fontWeight="normal"
                      opacity={isFaded ? 0.2 : 0.6}
                      style={{ pointerEvents: 'none' }}
                    >
                      {table.table_id}
                    </text>
                    <text
                      x={table.x + 10}
                      y={table.y + 36}
                      fill="#999"
                      fontSize="10"
                      opacity={isFaded ? 0.2 : 0.5}
                      style={{ pointerEvents: 'none' }}
                    >
                      {seatsInTable} seats
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Drawing rectangle (while dragging) */}
          {drawingRect && (
            <rect
              x={Math.min(drawingRect.startX, drawingRect.currentX)}
              y={Math.min(drawingRect.startY, drawingRect.currentY)}
              width={Math.abs(drawingRect.currentX - drawingRect.startX)}
              height={Math.abs(drawingRect.currentY - drawingRect.startY)}
              fill="rgba(192, 192, 192, 0.2)"
              stroke="#C0C0C0"
              strokeWidth={3}
              strokeDasharray="5,5"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Reference seats (RED DOTS) */}
          {referenceSeats.map((refSeat) => (
            <circle
              key={`ref-${refSeat.seat_ref_id}`}
              cx={refSeat.x}
              cy={refSeat.y}
              r={REF_SEAT_RADIUS}
              fill={REFERENCE_SEAT_COLOR}
              fillOpacity={0.4}
              stroke="white"
              strokeWidth={2}
              style={{ pointerEvents: 'none' }}
            />
          ))}

          {/* Drag mode indicator - shows when drag is enabled */}
          {!isReadOnly && onSeatSwap && allocatedSeats.length > 0 && (
            <text
              x={imgW / 2}
              y={30}
              textAnchor="middle"
              fontSize={20}
              fontWeight="bold"
              fill="#10B981"
              stroke="white"
              strokeWidth={3}
              paintOrder="stroke"
              style={{ pointerEvents: 'none' }}
            >
              ✋ DRAG MODE ACTIVE - Click any seat to drag
            </text>
          )}

          {/* Allocated seats (SQUARES WITH IMAGE ICONS - NO EMOJIS) */}
          {allocatedSeats.map((seat) => {
            // Get enhanced data for this seat
            const enhancedSeat = enhancedSeats.find(e => e.seat_ref_id === seat.seat_ref_id);

            // Get team color from parent component - handle undefined/empty
            const assignedTeam = seat.assigned_team || '';
            const teamColor = getTeamColor ? getTeamColor(assignedTeam) : '#C0C0C0';

            // Determine if this seat should be highlighted or faded
            const activeTeam = hoveredTeam || highlightedTeam;
            const isHighlighted = activeTeam && assignedTeam && activeTeam === assignedTeam;
            const isFaded = activeTeam && assignedTeam && activeTeam !== assignedTeam;

            // Check if seat is locked
            const isLocked = lockedSeats.has(seat.seat_ref_id);

            // Check if this is a potential drop target
            const isDragging = draggedSeat?.seat_ref_id === seat.seat_ref_id;
            const isDropTarget = draggedSeat && draggedSeat.seat_ref_id !== seat.seat_ref_id;

            // CLEAN FLAT DESIGN - Strong highlighting for better visibility
            const seatFillColor = isFaded
              ? `${teamColor}30`  // 20% opacity when faded (was 25%)
              : isHighlighted
              ? teamColor  // Full color when highlighted
              : `${teamColor}B0`; // 70% opacity normally (was full)

            const seatBorderColor = isLocked
              ? '#F59E0B'  // Amber border for locked seats
              : isDropTarget
              ? '#10B981'  // Green border for drop targets
              : isHighlighted
              ? '#FFFFFF'  // White border when highlighted (highly visible)
              : isFaded
              ? 'transparent'
              : `${teamColor}C0`; // Subtle border normally

            // Select icon based on gender
            const iconSrc = enhancedSeat?.employee_gender === 'F'
              ? '/assets/icons/female.webp'
              : '/assets/icons/male.jpg';

            return (
              <g key={`alloc-${seat.seat_ref_id}`}>
                {/* Larger invisible hit area for reliable hover AND drag */}
                <rect
                  x={seat.x - SEAT_SIZE / 2 - 8}
                  y={seat.y - SEAT_SIZE / 2 - 8}
                  width={SEAT_SIZE + 16}
                  height={SEAT_SIZE + 16}
                  fill="transparent"
                  onMouseEnter={() => {
                    if (!draggedSeat && seat.assigned_team) {
                      console.log('🎯 Hover on seat:', seat.seat_ref_id, 'Team:', seat.assigned_team);
                      setHoveredTeam(seat.assigned_team);
                      if (enhancedSeat) {
                        setHoveredSeat(enhancedSeat);
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (!draggedSeat) {
                      setHoveredSeat(null);
                      setHoveredTeam(null);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    console.log('🖱️ CLICK on seat:', seat.seat_ref_id);
                    console.log('   manualActionMode:', manualActionMode);

                    // DELETE mode - delete seat
                    if (manualActionMode === 'DELETE' && onDeleteSeat) {
                      console.log('🗑️ DELETE seat:', seat.seat_ref_id);
                      onDeleteSeat(seat.seat_ref_id);
                      return;
                    }

                    // SWAP mode - swap seats
                    console.log('   State draggedSeat:', draggedSeat?.seat_ref_id);
                    console.log('   Ref draggedSeatRef:', draggedSeatRef.current?.seat_ref_id);
                    console.log('   isReadOnly:', isReadOnly, 'onSeatSwap:', !!onSeatSwap);

                    if (isReadOnly || !onSeatSwap || manualActionMode !== 'SWAP') {
                      console.log('⚠️ Cannot interact - blocked');
                      return;
                    }

                    const currentDragged = draggedSeatRef.current;

                    if (!currentDragged) {
                      // Start dragging
                      console.log('🎯 START DRAG:', seat.seat_ref_id);
                      draggedSeatRef.current = seat;
                      setDraggedSeat(seat);
                      setHoveredSeat(null);
                      setHoveredTeam(null);
                    } else if (currentDragged.seat_ref_id === seat.seat_ref_id) {
                      // Cancel drag - clicked same seat
                      console.log('❌ CANCEL DRAG');
                      draggedSeatRef.current = null;
                      setDraggedSeat(null);
                    } else {
                      // Swap seats
                      console.log('✅ EXECUTE SWAP:', currentDragged.seat_ref_id, '↔', seat.seat_ref_id);
                      onSeatSwap(currentDragged.seat_ref_id, seat.seat_ref_id);
                      draggedSeatRef.current = null;
                      setDraggedSeat(null);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isLocked && onSeatUnlock) {
                      onSeatUnlock(seat.seat_ref_id);
                    } else if (!isLocked && onSeatLock) {
                      onSeatLock(seat.seat_ref_id);
                    }
                  }}
                  style={{
                    pointerEvents: 'all',
                    cursor: draggedSeat ? (draggedSeat.seat_ref_id === seat.seat_ref_id ? 'grabbing' : 'pointer') : (isReadOnly ? 'pointer' : 'grab')
                  }}
                />

                {/* Single flat seat square - CLEAN ENTERPRISE DESIGN */}
                <rect
                  x={seat.x - SEAT_SIZE / 2}
                  y={seat.y - SEAT_SIZE / 2}
                  width={SEAT_SIZE}
                  height={SEAT_SIZE}
                  fill={seatFillColor}
                  stroke={seatBorderColor}
                  strokeWidth={isHighlighted ? 3 : (isDropTarget ? 3 : (isLocked ? 2 : SEAT_BORDER_WIDTH))}
                  rx={BORDER_RADIUS}
                  transform={isHighlighted ? `scale(${HOVER_SCALE})` : undefined}
                  style={{
                    transition: 'all 0.15s ease',
                    transformOrigin: `${seat.x}px ${seat.y}px`,
                    pointerEvents: 'none',
                    opacity: isDragging ? 0.4 : 1
                  }}
                />

                {/* Pulsing ring for dragged seat */}
                {isDragging && (
                  <circle
                    cx={seat.x}
                    cy={seat.y}
                    r={SEAT_SIZE / 2 + 6}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={4}
                    style={{ pointerEvents: 'none' }}
                  >
                    <animate
                      attributeName="r"
                      values={`${SEAT_SIZE / 2 + 4};${SEAT_SIZE / 2 + 10};${SEAT_SIZE / 2 + 4}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Icon INSIDE square (centered, 70% opacity for subtlety, mix-blend-mode to remove white bg) */}
                {enhancedSeat && (
                  <image
                    href={iconSrc}
                    x={seat.x - ICON_SIZE / 2}
                    y={seat.y - ICON_SIZE / 2}
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    opacity={isFaded ? 0.3 : 0.85}
                    style={{
                      pointerEvents: 'none',
                      mixBlendMode: 'multiply'
                    }}
                  />
                )}

                {/* Lock icon indicator for locked seats */}
                {isLocked && (
                  <text
                    x={seat.x}
                    y={seat.y + SEAT_SIZE / 2 + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#F59E0B"
                    style={{ pointerEvents: 'none', fontWeight: 'bold' }}
                  >
                    🔒
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip with enhanced info */}
      {hoveredSeat && !draggedSeat && (
        <div className="info-panel">
          {(() => {
            const enhancedSeat = enhancedSeats.find(e => e.seat_ref_id === hoveredSeat.seat_ref_id);
            return (
              <>
                <div><strong>Seat:</strong> {hoveredSeat.seat_ref_id}</div>
                {enhancedSeat && (
                  <>
                    <div><strong>Name:</strong> {enhancedSeat.employee_name}</div>
                    <div><strong>Role:</strong> {enhancedSeat.employee_role}</div>
                    <div><strong>Gender:</strong> {enhancedSeat.employee_gender === 'M' ? 'Male' : 'Female'}</div>
                    <div><strong>Department:</strong> {enhancedSeat.department}</div>
                  </>
                )}
                <div><strong>Type:</strong> {hoveredSeat.seat_type}</div>
                {hoveredSeat.assigned_team && (
                  <>
                    <div><strong>Team:</strong> {hoveredSeat.assigned_team}</div>
                    <div><strong>Manager:</strong> {hoveredSeat.assigned_manager}</div>
                    {enhancedSeat?.table_id && (
                      <div><strong>Table:</strong> {enhancedSeat.table_id}</div>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Dragging indicator */}
      {draggedSeat && (
        <div className="info-panel" style={{
          backgroundColor: '#10B981',
          color: 'white',
          fontWeight: 'bold',
          padding: '16px',
          fontSize: '18px',
          border: '3px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔄 DRAGGING: {draggedSeat.seat_ref_id}</div>
          <div style={{ fontSize: '16px', marginTop: '8px' }}>👉 CLICK ANOTHER SEAT TO SWAP</div>
          <div style={{ fontSize: '14px', marginTop: '6px', opacity: 0.9 }}>Or click same seat to cancel</div>
        </div>
      )}

      {/* Help message when drag is enabled but not dragging */}
      {!isReadOnly && onSeatSwap && allocatedSeats.length > 0 && !draggedSeat && !hoveredSeat && (
        <div className="info-panel" style={{
          backgroundColor: '#3B82F6',
          color: 'white',
          padding: '14px',
          border: '2px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>✋ CLICK TO SWAP MODE ACTIVE</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>1. CLICK any seat (it will highlight)</div>
          <div style={{ fontSize: '13px', marginTop: '2px' }}>2. CLICK another seat to swap</div>
          <div style={{ fontSize: '13px', marginTop: '2px' }}>3. Right-click to lock/unlock seats</div>
        </div>
      )}

      <div className="viewer-instructions">
        <div className="legend-title">Legend:</div>
        <span className="legend-item">
          <span className="dot red"></span> Red circles = Reference seats (ADMIN)
        </span>
        {tables.length > 0 && (
          <span className="legend-item">
            <span className="dot silver"></span> Silver outlines = Tables
          </span>
        )}
        {allocatedSeats.length > 0 && (
          <>
            <span className="legend-item">
              <span className="seat-square"></span> Light gray squares = Assigned seats
            </span>
            <span className="legend-item">
              <span className="icon-male"></span> Male icon / <span className="icon-female"></span> Female icon = Employee gender
            </span>
            <span className="legend-item">
              <span className="leader-outline"></span> Silver outline = Leader seat
            </span>
          </>
        )}
      </div>
    </div>
  );
};
