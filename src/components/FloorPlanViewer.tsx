/**
 * FloorPlanViewer Component
 * ROLE-BASED ARCHITECTURE
 * 
 * ADMIN: Can create reference seats (red dots)
 * FACILITY_USER: Views reference seats + allocated seats (read-only)
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ReferenceSeat, AllocatedSeat } from '../types';
import { SEAT_COLORS, REFERENCE_SEAT_COLOR } from '../types';
import './FloorPlanViewer.css';

interface FloorPlanViewerProps {
  imagePath: string;
  referenceSeats: ReferenceSeat[];
  allocatedSeats: AllocatedSeat[];
  onDirectClick?: (x: number, y: number) => void;
  isReferenceMarkingMode?: boolean;
  isReadOnly?: boolean;
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
}) => {
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredRefSeat, setHoveredRefSeat] = useState<ReferenceSeat | null>(null);
  const [hoveredAllocSeat, setHoveredAllocSeat] = useState<AllocatedSeat | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Load image and get REAL dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImgW(w);
      setImgH(h);
      setView({ x: 0, y: 0, w, h });
      console.log(`✅ Floor plan loaded: ${w}x${h} pixels`);
    };
    img.src = imagePath;
  }, [imagePath]);

  // Handle SVG click - get TRUE SVG coordinates
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || isReadOnly) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    // Get TRUE SVG coordinates (image pixels)
    const cursor = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const clickX = Math.round(cursor.x);
    const clickY = Math.round(cursor.y);

    console.log(`Click at pixel: (${clickX}, ${clickY})`);

    // ADMIN: Create reference seat
    if (isReferenceMarkingMode && onDirectClick) {
      onDirectClick(clickX, clickY);
    }
  };

  // Zoom controls - VIEWBOX ONLY
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

  // Pan controls - VIEWBOX ONLY
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
      
      // Convert screen delta to SVG delta
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
          <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">+</button>
          <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">−</button>
          <button onClick={handleResetView} className="zoom-btn" title="Reset View">⟲</button>
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
          {/* LAYER 1: Floor plan image */}
          <image
            href={imagePath}
            x={0}
            y={0}
            width={imgW}
            height={imgH}
            preserveAspectRatio="none"
          />

          {/* LAYER 2: Reference seats (RED DOTS) - always visible */}
          {referenceSeats.map((refSeat) => (
            <circle
              key={refSeat.seat_ref_id}
              cx={refSeat.x}
              cy={refSeat.y}
              r={5}
              fill={REFERENCE_SEAT_COLOR}
              fillOpacity={0.6}
              stroke="white"
              strokeWidth={1.5}
              onMouseEnter={() => setHoveredRefSeat(refSeat)}
              onMouseLeave={() => setHoveredRefSeat(null)}
              style={{ pointerEvents: 'all' }}
            />
          ))}

          {/* LAYER 3: Allocated seats (GREEN/ORANGE/GRAY) - computed by allocation */}
          {allocatedSeats.map((seat) => (
            <circle
              key={seat.seat_ref_id}
              cx={seat.x}
              cy={seat.y}
              r={7}
              fill={SEAT_COLORS[seat.seat_type]}
              stroke="white"
              strokeWidth={2}
              onMouseEnter={() => setHoveredAllocSeat(seat)}
              onMouseLeave={() => setHoveredAllocSeat(null)}
              style={{ pointerEvents: 'all' }}
            />
          ))}
        </svg>
      </div>

      {/* Info panel */}
      {(hoveredRefSeat || hoveredAllocSeat) && (
        <div className="info-panel">
          {hoveredAllocSeat && (
            <>
              <div><strong>Seat:</strong> {hoveredAllocSeat.seat_ref_id}</div>
              <div><strong>Type:</strong> {hoveredAllocSeat.seat_type}</div>
              <div><strong>Position:</strong> ({hoveredAllocSeat.x}, {hoveredAllocSeat.y})</div>
              {hoveredAllocSeat.assigned_to && (
                <div><strong>Assigned:</strong> {hoveredAllocSeat.assigned_to}</div>
              )}
            </>
          )}
          {hoveredRefSeat && !hoveredAllocSeat && (
            <>
              <div><strong>Reference:</strong> {hoveredRefSeat.seat_ref_id}</div>
              <div><strong>Position:</strong> ({hoveredRefSeat.x}, {hoveredRefSeat.y})</div>
            </>
          )}
        </div>
      )}

      <div className="viewer-instructions">
        <span className="legend-item"><span className="dot red"></span> Red = Reference seats</span>
        <span className="legend-item"><span className="dot green"></span> Green = Assignable</span>
        <span className="legend-item"><span className="dot orange"></span> Orange = Reserved</span>
        <span className="legend-item"><span className="dot gray"></span> Gray = Buffer</span>
      </div>
    </div>
  );
};
