/**
 * FloorPlanViewer Component - TABLE-FIRST ARCHITECTURE
 * 
 * ADMIN: Can create reference seats (red dots) AND draw table rectangles
 * FACILITY_USER: Views colored team allocations
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ReferenceSeat, AllocatedSeat, Table, EnhancedAllocatedSeat } from '../types';
import { SEAT_COLORS, REFERENCE_SEAT_COLOR } from '../types';
import './FloorPlanViewer.css';

// Rendering constants
const REF_SEAT_RADIUS = 12;
const ALLOC_SEAT_SIZE = 70; // Increased by 20-30% as per requirements
const ICON_SIZE = ALLOC_SEAT_SIZE * 0.65; // Icon is 65% of seat size

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
}) => {
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<EnhancedAllocatedSeat | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const [maleIcon, setMaleIcon] = useState<HTMLImageElement | null>(null);
  const [femaleIcon, setFemaleIcon] = useState<HTMLImageElement | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Load gender icons
  useEffect(() => {
    const male = new Image();
    male.src = '/assets/icons/male.jpg';
    male.onload = () => setMaleIcon(male);

    const female = new Image();
    female.src = '/assets/icons/female.webp';
    female.onload = () => setFemaleIcon(female);
  }, []);

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
    if (isReferenceMarkingMode && onDirectClick) {
      const coords = getSvgCoords(e);
      if (coords) {
        onDirectClick(coords.x, coords.y);
      }
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

  return (
    <div className="floor-plan-viewer">
      <div className="viewer-header">
        <h2>Aqua 2nd Floor - CRED Office</h2>
        <div className="viewer-info">
          <span className="dimension-badge">{imgW} × {imgH} pixels</span>
          <span className="zoom-badge">{Math.round(zoom * 100)}%</span>
          {isReadOnly && <span className="readonly-badge">READ-ONLY</span>}
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

          {/* Tables - highlight when team is hovered */}
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
            
            // Get team color for this table
            const tableTeam = tableSeats.find(s => s.assigned_team)?.assigned_team;
            const teamColor = tableTeam && getTeamColor ? getTeamColor(tableTeam) : '#C0C0C0';
            
            // Show tables in debug mode OR when there's an active hover/highlight
            const shouldShow = showTableBoundaries || isTableDrawingMode || activeTeam;
            
            if (!shouldShow) return null;
            
            return (
              <g key={table.table_id}>
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  fill={hasActiveTeam ? teamColor : "rgba(192, 192, 192, 0.1)"}
                  fillOpacity={hasActiveTeam ? 0.15 : (isFaded ? 0.05 : 0.1)}
                  stroke={hasActiveTeam ? teamColor : "#C0C0C0"}
                  strokeWidth={hasActiveTeam ? 4 : 2}
                  strokeDasharray={hasActiveTeam ? "none" : "10,5"}
                  strokeOpacity={isFaded ? 0.3 : 1}
                  style={{ pointerEvents: 'none' }}
                />
                {(showTableBoundaries || isTableDrawingMode) && (
                  <>
                    <text
                      x={table.x + 10}
                      y={table.y + 20}
                      fill="#C0C0C0"
                      fontSize="14"
                      fontWeight="bold"
                      opacity={isFaded ? 0.3 : 1}
                      style={{ pointerEvents: 'none' }}
                    >
                      {table.table_id}
                    </text>
                    <text
                      x={table.x + 10}
                      y={table.y + 40}
                      fill="#C0C0C0"
                      fontSize="12"
                      opacity={isFaded ? 0.3 : 1}
                      style={{ pointerEvents: 'none' }}
                    >
                      Cap: {table.capacity} | Seats: {seatsInTable}
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

          {/* Allocated seats (SQUARES WITH IMAGE ICONS - NO EMOJIS) */}
          {allocatedSeats.map((seat) => {
            // Get enhanced data for this seat
            const enhancedSeat = enhancedSeats.find(e => e.seat_ref_id === seat.seat_ref_id);
            
            // Get team color from parent component
            const teamColor = getTeamColor ? getTeamColor(seat.assigned_team || '') : '#C0C0C0';
            
            // Determine if this seat should be highlighted or faded
            const activeTeam = hoveredTeam || highlightedTeam;
            const isHighlighted = activeTeam === seat.assigned_team;
            const isFaded = activeTeam && activeTeam !== seat.assigned_team;
            const isLeader = enhancedSeat?.employee_role === 'LEADER';
            
            // Seat background: neutral by default, team color when highlighted
            const seatBg = isHighlighted ? teamColor : '#F5F5F5';
            const seatOpacity = isFaded ? 0.3 : 1;
            
            // Border: thicker and team-colored when highlighted
            const borderColor = isHighlighted ? teamColor : '#DDD';
            const borderWidth = isHighlighted ? 4 : 1;
            
            // Select icon based on gender
            const iconSrc = enhancedSeat?.employee_gender === 'F' 
              ? '/assets/icons/female.webp' 
              : '/assets/icons/male.jpg';
            
            return (
              <g key={`alloc-${seat.seat_ref_id}`}>
                {/* Leader outline (thin gold border) */}
                {isLeader && (
                  <rect
                    x={seat.x - ALLOC_SEAT_SIZE / 2 - 2}
                    y={seat.y - ALLOC_SEAT_SIZE / 2 - 2}
                    width={ALLOC_SEAT_SIZE + 4}
                    height={ALLOC_SEAT_SIZE + 4}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    rx={6}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                
                {/* Seat square (neutral background, team color on hover) */}
                <rect
                  x={seat.x - ALLOC_SEAT_SIZE / 2}
                  y={seat.y - ALLOC_SEAT_SIZE / 2}
                  width={ALLOC_SEAT_SIZE}
                  height={ALLOC_SEAT_SIZE}
                  fill={seatBg}
                  fillOpacity={isHighlighted ? 0.4 : seatOpacity}
                  stroke={borderColor}
                  strokeWidth={borderWidth}
                  rx={4}
                  onMouseEnter={() => {
                    if (enhancedSeat) {
                      setHoveredSeat(enhancedSeat);
                      setHoveredTeam(seat.assigned_team || null);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredSeat(null);
                    setHoveredTeam(null);
                  }}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                />
                
                {/* Gender icon (image, centered inside seat) */}
                {enhancedSeat && (
                  <image
                    href={iconSrc}
                    x={seat.x - ICON_SIZE / 2}
                    y={seat.y - ICON_SIZE / 2}
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    opacity={seatOpacity * 0.9}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip with enhanced info */}
      {hoveredSeat && (
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
              <span className="leader-outline"></span> Gold outline = Leader seat
            </span>
          </>
        )}
      </div>
    </div>
  );
};
