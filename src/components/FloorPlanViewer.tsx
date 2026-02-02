/**
 * FloorPlanViewer Component - WITH TEAM COLOR CODING
 * 
 * ADMIN: Can create reference seats (red dots)
 * FACILITY_USER: Views colored team allocations
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ReferenceSeat, AllocatedSeat } from '../types';
import { SEAT_COLORS, REFERENCE_SEAT_COLOR } from '../types';
import './FloorPlanViewer.css';

// Seat rendering constants
const REF_SEAT_RADIUS = 12; // Larger reference seats
const ALLOC_SEAT_SIZE = 24; // Square allocated seats (easier to see labels)

interface FloorPlanViewerProps {
  imagePath: string;
  referenceSeats: ReferenceSeat[];
  allocatedSeats: AllocatedSeat[];
  onDirectClick?: (x: number, y: number) => void;
  isReferenceMarkingMode?: boolean;
  isReadOnly?: boolean;
  currentOptionDescription?: string;
  getEmployeeNames?: (teamId: string) => string[];
  getTeamName?: (teamId: string) => string;
  getTeamColor?: (teamId: string) => string;
  highlightedTeam?: string | null;
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  imagePath,
  referenceSeats,
  allocatedSeats,
  onDirectClick,
  isReferenceMarkingMode = false,
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

  // Handle SVG click
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || isReadOnly) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const cursor = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const clickX = Math.round(cursor.x);
    const clickY = Math.round(cursor.y);

    if (isReferenceMarkingMode && onDirectClick) {
      onDirectClick(clickX, clickY);
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

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isReferenceMarkingMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  const handleMouseUp = () => {
    setIsPanning(false);
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

  return (
    <div className="floor-plan-viewer">
      <div className="viewer-header">
        <h2>Aqua 2nd Floor - CRED Office</h2>
        <div className="viewer-info">
          <span className="dimension-badge">{imgW} × {imgH} pixels</span>
          <span className="zoom-badge">{Math.round(zoom * 100)}%</span>
          {isReadOnly && <span className="readonly-badge">READ-ONLY</span>}
        </div>
        <div className="zoom-controls">
          <button onClick={handleZoomIn} className="zoom-btn">+</button>
          <button onClick={handleZoomOut} className="zoom-btn">−</button>
          <button onClick={handleResetView} className="zoom-btn">⟲</button>
        </div>
      </div>

      <div 
        className="viewer-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : isReferenceMarkingMode ? 'crosshair' : 'grab' }}
      >
        <svg
          ref={svgRef}
          width={imgW}
          height={imgH}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
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
          {allocatedSeats.map((seat, index) => {
            const teamSeats = seat.assigned_team ? seatsByTeam.get(seat.assigned_team) || [] : [];
            const seatNumber = teamSeats.indexOf(seat) + 1;
            const color = seat.assigned_team && getTeamColor 
              ? getTeamColor(seat.assigned_team)
              : SEAT_COLORS[seat.seat_type];
            
            const isHighlighted = highlightedTeam === seat.assigned_team;
            const isFaded = highlightedTeam && highlightedTeam !== seat.assigned_team;
            
            return (
              <g key={`alloc-${seat.seat_ref_id}`}>
                {/* Square seat */}
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
                
                {/* Seat number label */}
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
        <span className="legend-item">Colored squares = Team assignments</span>
        <span className="legend-item">Numbers = Seat order within team</span>
      </div>
    </div>
  );
};
