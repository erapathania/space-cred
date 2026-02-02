/**
 * FloorPlanViewer Component - TABLE-FIRST ARCHITECTURE
 * 
 * ADMIN: Can create reference seats (red dots) AND draw table rectangles
 * FACILITY_USER: Views colored team allocations
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ReferenceSeat, AllocatedSeat, Table } from '../types';
import { SEAT_COLORS, REFERENCE_SEAT_COLOR } from '../types';
import './FloorPlanViewer.css';

// Rendering constants
const REF_SEAT_RADIUS = 12;
const ALLOC_SEAT_SIZE = 24;

interface FloorPlanViewerProps {
  imagePath: string;
  referenceSeats: ReferenceSeat[];
  allocatedSeats: AllocatedSeat[];
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
  const [hoveredSeat, setHoveredSeat] = useState<AllocatedSeat | null>(null);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Load image
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
  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
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

          {/* Tables (debug mode or always show in admin) */}
          {(showTableBoundaries || isTableDrawingMode) && tables.map(table => {
            const seatsInTable = referenceSeats.filter(s => s.table_id === table.table_id).length;
            return (
              <g key={table.table_id}>
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  fill="rgba(255, 215, 0, 0.1)"
                  stroke="#FFD700"
                  strokeWidth={2}
                  strokeDasharray="10,5"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={table.x + 10}
                  y={table.y + 20}
                  fill="#FFD700"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {table.table_id}
                </text>
                <text
                  x={table.x + 10}
                  y={table.y + 40}
                  fill="#FFD700"
                  fontSize="12"
                  style={{ pointerEvents: 'none' }}
                >
                  Cap: {table.capacity} | Seats: {seatsInTable}
                </text>
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
              fill="rgba(255, 215, 0, 0.2)"
              stroke="#FFD700"
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

          {/* Allocated seats (COLORED SQUARES WITH LABELS) */}
          {allocatedSeats.map((seat) => {
            const teamSeats = seat.assigned_team ? seatsByTeam.get(seat.assigned_team) || [] : [];
            const seatNumber = teamSeats.indexOf(seat) + 1;
            const color = seat.assigned_team && getTeamColor 
              ? getTeamColor(seat.assigned_team)
              : SEAT_COLORS[seat.seat_type];
            
            const isHighlighted = highlightedTeam === seat.assigned_team;
            const isFaded = highlightedTeam && highlightedTeam !== seat.assigned_team;
            
            return (
              <g key={`alloc-${seat.seat_ref_id}`}>
                <rect
                  x={seat.x - ALLOC_SEAT_SIZE / 2}
                  y={seat.y - ALLOC_SEAT_SIZE / 2}
                  width={ALLOC_SEAT_SIZE}
                  height={ALLOC_SEAT_SIZE}
                  fill={color}
                  fillOpacity={isFaded ? 0.3 : 1}
                  stroke={isHighlighted ? '#FFD700' : 'white'}
                  strokeWidth={isHighlighted ? 3 : 2}
                  rx={2}
                  onMouseEnter={() => setHoveredSeat(seat)}
                  onMouseLeave={() => setHoveredSeat(null)}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                />
                
                {seat.assigned_team && (
                  <text
                    x={seat.x}
                    y={seat.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {seatNumber}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip */}
      {hoveredSeat && (
        <div className="info-panel">
          <div><strong>Seat:</strong> {hoveredSeat.seat_ref_id}</div>
          <div><strong>Type:</strong> {hoveredSeat.seat_type}</div>
          {hoveredSeat.assigned_team && (
            <>
              <div><strong>Team:</strong> {hoveredSeat.assigned_team}</div>
              <div><strong>Manager:</strong> {hoveredSeat.assigned_manager}</div>
            </>
          )}
        </div>
      )}

      <div className="viewer-instructions">
        <span className="legend-item"><span className="dot red"></span> Red = Reference seats</span>
        {tables.length > 0 && <span className="legend-item"><span className="dot gold"></span> Gold = Tables</span>}
        <span className="legend-item">Colored squares = Team assignments</span>
      </div>
    </div>
  );
};
