/**
 * Main App Component
 * ROLE-BASED ARCHITECTURE
 * 
 * ROLE 1: ADMIN - One-time coordinate setup
 * ROLE 2: FACILITY_USER - Daily seat allocation
 */

import { useState, useEffect } from 'react';
import { FloorPlanViewer } from './components/FloorPlanViewer';
import type { ReferenceSeat, AllocatedSeat, LayoutScenario } from './types';
import { UserRole, SeatStatus, AllocationStrategy } from './types';
import { saveReferenceSeats, loadReferenceSeats, saveLayout, loadLayouts } from './utils/storage';
import './App.css';

function App() {
  // Role management
  const [currentRole, setCurrentRole] = useState<typeof UserRole[keyof typeof UserRole]>(UserRole.ADMIN);
  
  // Reference seats (RED DOTS) - managed by ADMIN
  const [referenceSeats, setReferenceSeats] = useState<ReferenceSeat[]>([]);
  const [isReferenceMarkingMode, setIsReferenceMarkingMode] = useState(false);
  
  // Allocated seats (GREEN/ORANGE/GRAY) - computed for FACILITY_USER
  const [allocatedSeats, setAllocatedSeats] = useState<AllocatedSeat[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<typeof AllocationStrategy[keyof typeof AllocationStrategy]>(AllocationStrategy.MAX_TEAM_COHESION);
  const [layouts, setLayouts] = useState<LayoutScenario[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

  // Load reference seats on mount
  useEffect(() => {
    const loaded = loadReferenceSeats();
    setReferenceSeats(loaded);
    
    const savedLayouts = loadLayouts();
    setLayouts(savedLayouts);
  }, []);

  // Generate unique reference seat ID
  const generateRefSeatId = (): string => {
    const existingIds = new Set(referenceSeats.map(s => s.seat_ref_id));
    let counter = 1;
    let newId = `REF-${counter.toString().padStart(3, '0')}`;
    
    while (existingIds.has(newId)) {
      counter++;
      newId = `REF-${counter.toString().padStart(3, '0')}`;
    }
    
    return newId;
  };

  // ============================================
  // ADMIN ROLE FUNCTIONS
  // ============================================

  // ADMIN: Create reference seat by clicking
  const handleAdminClick = (x: number, y: number) => {
    if (currentRole !== UserRole.ADMIN || !isReferenceMarkingMode) return;

    const newRefSeat: ReferenceSeat = {
      seat_ref_id: generateRefSeatId(),
      x: Math.round(x),
      y: Math.round(y),
    };

    setReferenceSeats(prev => [...prev, newRefSeat]);
    console.log(`✅ Created reference seat: ${newRefSeat.seat_ref_id} at (${newRefSeat.x}, ${newRefSeat.y})`);
  };

  // ADMIN: Save seat map permanently
  const handleSaveSeatMap = () => {
    if (referenceSeats.length === 0) {
      alert('No reference seats to save. Create some first.');
      return;
    }

    try {
      saveReferenceSeats(referenceSeats);
      alert(`✅ Saved ${referenceSeats.length} reference seats successfully!\n\nThese seats are now available for facility users.`);
      setIsReferenceMarkingMode(false);
    } catch (error) {
      alert('Failed to save seat map. Please try again.');
    }
  };

  // ADMIN: Clear all reference seats
  const handleClearReferenceSeats = () => {
    const confirmed = window.confirm(
      'Delete ALL reference seats? This will affect facility users.'
    );

    if (confirmed) {
      setReferenceSeats([]);
      saveReferenceSeats([]);
      console.log(`✅ Cleared all reference seats`);
    }
  };

  // ADMIN: Import reference seats from JSON (optional)
  const handleImportReferenceSeats = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ReferenceSeat[];
      setReferenceSeats(data);
      console.log(`✅ Imported ${data.length} reference seats`);
      alert(`Imported ${data.length} reference seats. Click "Save Seat Map" to persist.`);
    } catch (error) {
      console.error('Failed to import reference seats:', error);
      alert('Failed to import reference seats. Please check the file format.');
    }
    event.target.value = '';
  };

  // ============================================
  // FACILITY USER FUNCTIONS
  // ============================================

  // FACILITY_USER: Generate allocation based on strategy
  const generateAllocation = (strategy: typeof AllocationStrategy[keyof typeof AllocationStrategy]) => {
    if (referenceSeats.length === 0) {
      alert('No reference seats available. Contact admin to set up seat map.');
      return;
    }

    // Simple allocation logic (can be enhanced later)
    const allocated: AllocatedSeat[] = referenceSeats.map((refSeat, index) => {
      let seatType: typeof SeatStatus[keyof typeof SeatStatus];
      
      // Simple distribution based on strategy
      if (strategy === AllocationStrategy.MAX_TEAM_COHESION) {
        seatType = index % 10 === 0 ? SeatStatus.BUFFER : SeatStatus.ASSIGNABLE;
      } else if (strategy === AllocationStrategy.MANAGER_PROXIMITY) {
        seatType = index % 5 === 0 ? SeatStatus.RESERVED : SeatStatus.ASSIGNABLE;
      } else {
        seatType = index % 8 === 0 ? SeatStatus.BUFFER : SeatStatus.ASSIGNABLE;
      }

      return {
        seat_ref_id: refSeat.seat_ref_id,
        x: refSeat.x,
        y: refSeat.y,
        seat_type: seatType,
      };
    });

    setAllocatedSeats(allocated);
    console.log(`✅ Generated allocation with ${strategy}: ${allocated.length} seats`);
  };

  // FACILITY_USER: Apply selected strategy
  const handleApplyStrategy = () => {
    generateAllocation(selectedStrategy);
  };

  // FACILITY_USER: Approve and save layout
  const handleApproveLayout = () => {
    if (allocatedSeats.length === 0) {
      alert('No allocation to approve. Generate a layout first.');
      return;
    }

    const layout: LayoutScenario = {
      scenario_id: `LAYOUT-${Date.now()}`,
      name: `${selectedStrategy} - ${new Date().toLocaleDateString()}`,
      strategy: selectedStrategy,
      seats: allocatedSeats,
      created_at: new Date().toISOString(),
    };

    try {
      saveLayout(layout);
      setLayouts(prev => [...prev.filter(l => l.scenario_id !== layout.scenario_id), layout]);
      setCurrentLayoutId(layout.scenario_id);
      alert(`✅ Layout approved and saved!\n\n${layout.name}`);
    } catch (error) {
      alert('Failed to save layout. Please try again.');
    }
  };

  // FACILITY_USER: Load saved layout
  const handleLoadLayout = (layoutId: string) => {
    const layout = layouts.find(l => l.scenario_id === layoutId);
    if (layout) {
      setAllocatedSeats(layout.seats);
      setSelectedStrategy(layout.strategy);
      setCurrentLayoutId(layoutId);
      console.log(`✅ Loaded layout: ${layout.name}`);
    }
  };

  // Statistics
  const stats = {
    referenceSeats: referenceSeats.length,
    allocatedTotal: allocatedSeats.length,
    assignable: allocatedSeats.filter(s => s.seat_type === SeatStatus.ASSIGNABLE).length,
    reserved: allocatedSeats.filter(s => s.seat_type === SeatStatus.RESERVED).length,
    buffer: allocatedSeats.filter(s => s.seat_type === SeatStatus.BUFFER).length,
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🏢 Space Allocation System V1</h1>
          <p className="subtitle">Role-Based Seat Management</p>
        </div>
        <div className="role-switcher">
          <button
            className={`role-btn ${currentRole === UserRole.ADMIN ? 'active' : ''}`}
            onClick={() => {
              setCurrentRole(UserRole.ADMIN);
              setIsReferenceMarkingMode(false);
            }}
          >
            👤 ADMIN
          </button>
          <button
            className={`role-btn ${currentRole === UserRole.FACILITY_USER ? 'active' : ''}`}
            onClick={() => {
              setCurrentRole(UserRole.FACILITY_USER);
              setIsReferenceMarkingMode(false);
            }}
          >
            👥 FACILITY USER
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="viewer-section">
          <FloorPlanViewer
            imagePath="/assets/floor-plan.jpg"
            referenceSeats={referenceSeats}
            allocatedSeats={allocatedSeats}
            onDirectClick={handleAdminClick}
            isReferenceMarkingMode={isReferenceMarkingMode}
            isReadOnly={currentRole === UserRole.FACILITY_USER}
          />
        </div>

        <aside className="sidebar">
          <div className="panel">
            <h3>📊 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Reference Seats</span>
                <span className="stat-value">{stats.referenceSeats}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Allocated Total</span>
                <span className="stat-value">{stats.allocatedTotal}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Assignable</span>
                <span className="stat-value green">{stats.assignable}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Reserved</span>
                <span className="stat-value orange">{stats.reserved}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Buffer</span>
                <span className="stat-value gray">{stats.buffer}</span>
              </div>
            </div>
          </div>

          {/* ADMIN VIEW */}
          {currentRole === UserRole.ADMIN && (
            <>
              <div className="panel">
                <h3>🔴 Admin: Reference Marking</h3>
                <p className="hint">
                  {isReferenceMarkingMode 
                    ? '✓ Click anywhere to create RED dots' 
                    : 'Mark where seats physically exist on floor plan'}
                </p>
                <button
                  className={`btn ${isReferenceMarkingMode ? 'btn-success' : 'btn-primary'}`}
                  onClick={() => setIsReferenceMarkingMode(!isReferenceMarkingMode)}
                >
                  {isReferenceMarkingMode ? '✓ Marking Mode ON' : 'Enable Marking Mode'}
                </button>
              </div>

              <div className="panel">
                <h3>💾 Save Seat Map</h3>
                <p className="hint">
                  Save reference seats permanently. Facility users will see these seats.
                </p>
                <div className="button-group">
                  <button
                    className="btn btn-success"
                    onClick={handleSaveSeatMap}
                    disabled={referenceSeats.length === 0}
                  >
                    💾 Save Seat Map
                  </button>
                  <label className="btn btn-secondary">
                    📥 Import from JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportReferenceSeats}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    className="btn btn-danger"
                    onClick={handleClearReferenceSeats}
                    disabled={referenceSeats.length === 0}
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
            </>
          )}

          {/* FACILITY USER VIEW */}
          {currentRole === UserRole.FACILITY_USER && (
            <>
              <div className="panel">
                <h3>🎯 Allocation Strategy</h3>
                <p className="hint">
                  {referenceSeats.length === 0
                    ? '⚠️ No reference seats available. Contact admin.'
                    : 'Choose a strategy to generate seat allocation'}
                </p>
                <select
                  className="strategy-select"
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value as typeof AllocationStrategy[keyof typeof AllocationStrategy])}
                  disabled={referenceSeats.length === 0}
                >
                  <option value={AllocationStrategy.MAX_TEAM_COHESION}>Max Team Cohesion</option>
                  <option value={AllocationStrategy.MANAGER_PROXIMITY}>Manager Proximity</option>
                  <option value={AllocationStrategy.SPACE_EFFICIENCY}>Space Efficiency</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={handleApplyStrategy}
                  disabled={referenceSeats.length === 0}
                  style={{ marginTop: '12px' }}
                >
                  🎲 Generate Layout
                </button>
              </div>

              <div className="panel">
                <h3>✅ Approve Layout</h3>
                <p className="hint">
                  Review the generated layout and approve to save it.
                </p>
                <button
                  className="btn btn-success"
                  onClick={handleApproveLayout}
                  disabled={allocatedSeats.length === 0}
                >
                  ✅ Approve & Save Layout
                </button>
              </div>

              {layouts.length > 0 && (
                <div className="panel">
                  <h3>📋 Saved Layouts</h3>
                  <p className="hint">Load previously saved layouts</p>
                  <div className="layout-list">
                    {layouts.map(layout => (
                      <button
                        key={layout.scenario_id}
                        className={`layout-item ${currentLayoutId === layout.scenario_id ? 'active' : ''}`}
                        onClick={() => handleLoadLayout(layout.scenario_id)}
                      >
                        <div className="layout-name">{layout.name}</div>
                        <div className="layout-meta">{layout.seats.length} seats</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </main>

      <footer className="app-footer">
        <p>Space Allocation System V1 | Role: {currentRole} | Pixel-Perfect Coordinate System</p>
      </footer>
    </div>
  );
}

export default App;
