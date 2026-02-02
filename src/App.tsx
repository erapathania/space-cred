/**
 * Main App Component
 * ROLE-BASED ARCHITECTURE
 * 
 * ROLE 1: ADMIN - One-time coordinate setup
 * ROLE 2: FACILITY_USER - Daily seat allocation
 */

import { useState, useEffect } from 'react';
import { FloorPlanViewer } from './components/FloorPlanViewer';
import type { ReferenceSeat, AllocatedSeat, AllocationOption } from './types';
import { UserRole, SeatStatus } from './types';
import { saveReferenceSeats, loadReferenceSeats } from './utils/storage';
import { generateAllOptions } from './utils/allocationEngine';
import { DUMMY_TEAMS, getTeamColor } from './data/teams';
import './App.css';

function App() {
  // Role management
  const [currentRole, setCurrentRole] = useState<typeof UserRole[keyof typeof UserRole]>(UserRole.ADMIN);
  
  // Reference seats (RED DOTS) - managed by ADMIN
  const [referenceSeats, setReferenceSeats] = useState<ReferenceSeat[]>([]);
  const [isReferenceMarkingMode, setIsReferenceMarkingMode] = useState(false);
  
  // Allocation options and current selection
  const [allocationOptions, setAllocationOptions] = useState<AllocationOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [allocatedSeats, setAllocatedSeats] = useState<AllocatedSeat[]>([]);
  
  // Team highlighting
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null);

  // Load reference seats on mount
  useEffect(() => {
    const loaded = loadReferenceSeats();
    setReferenceSeats(loaded);
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

  // ADMIN: Import reference seats from JSON
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

  // FACILITY_USER: Generate all allocation options
  const handleGenerateOptions = () => {
    if (referenceSeats.length === 0) {
      alert('No reference seats available. Contact admin to set up seat map.');
      return;
    }

    const totalSeatsNeeded = DUMMY_TEAMS.reduce((sum, team) => sum + team.team_size, 0);
    if (totalSeatsNeeded > referenceSeats.length) {
      alert(`⚠️ Not enough seats!\n\nTeams need: ${totalSeatsNeeded} seats\nAvailable: ${referenceSeats.length} seats`);
      return;
    }

    console.log(`🎲 Generating allocation options for ${DUMMY_TEAMS.length} teams...`);
    const options = generateAllOptions(referenceSeats, DUMMY_TEAMS);
    setAllocationOptions(options);
    
    // Auto-select first option
    if (options.length > 0) {
      setSelectedOptionId(options[0].option_id);
      setAllocatedSeats(options[0].allocations);
    }

    console.log(`✅ Generated ${options.length} allocation options`);
  };

  // FACILITY_USER: Switch between options
  const handleSelectOption = (optionId: string) => {
    const option = allocationOptions.find(opt => opt.option_id === optionId);
    if (option) {
      setSelectedOptionId(optionId);
      setAllocatedSeats(option.allocations);
      console.log(`✅ Switched to Option ${optionId}: ${option.description}`);
    }
  };

  // Statistics
  const stats = {
    referenceSeats: referenceSeats.length,
    allocatedTotal: allocatedSeats.length,
    assignable: allocatedSeats.filter(s => s.seat_type === SeatStatus.ASSIGNABLE).length,
    reserved: allocatedSeats.filter(s => s.seat_type === SeatStatus.RESERVED).length,
    buffer: allocatedSeats.filter(s => s.seat_type === SeatStatus.BUFFER).length,
    teams: DUMMY_TEAMS.length,
    totalTeamSize: DUMMY_TEAMS.reduce((sum, team) => sum + team.team_size, 0),
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
            getTeamColor={getTeamColor}
            highlightedTeam={highlightedTeam}
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
              {currentRole === UserRole.FACILITY_USER && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Teams</span>
                    <span className="stat-value">{stats.teams}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Team Size</span>
                    <span className="stat-value">{stats.totalTeamSize}</span>
                  </div>
                </>
              )}
              <div className="stat-item">
                <span className="stat-label">Assignable</span>
                <span className="stat-value green">{stats.assignable}</span>
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
              {allocationOptions.length > 0 && (
                <div className="panel">
                  <h3>🎨 Team Legend</h3>
                  <p className="hint">Hover over a team to highlight its seats on the floor plan</p>
                  <div className="team-legend-list">
                    {DUMMY_TEAMS.map(team => {
                      const teamSeats = allocatedSeats.filter(s => s.assigned_team === team.team_id);
                      const seatIds = teamSeats.map(s => s.seat_ref_id).join(', ');
                      
                      return (
                        <div
                          key={team.team_id}
                          className={`team-legend-item ${highlightedTeam === team.team_id ? 'highlighted' : ''}`}
                          onMouseEnter={() => setHighlightedTeam(team.team_id)}
                          onMouseLeave={() => setHighlightedTeam(null)}
                        >
                          <div className="team-legend-header">
                            <div 
                              className="team-color-indicator" 
                              style={{ backgroundColor: team.color }}
                            />
                            <div className="team-legend-info">
                              <div className="team-legend-name">{team.team_name}</div>
                              <div className="team-legend-meta">
                                Manager: {team.manager} | {teamSeats.length} seats
                              </div>
                            </div>
                          </div>
                          {teamSeats.length > 0 && (
                            <div className="team-legend-seats">
                              Seats: {seatIds}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="panel">
                <h3>🎲 Generate Allocations</h3>
                <p className="hint">
                  {referenceSeats.length === 0
                    ? '⚠️ No reference seats available. Contact admin.'
                    : 'Generate 3 allocation options using different strategies'}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateOptions}
                  disabled={referenceSeats.length === 0}
                >
                  🎲 Generate Options
                </button>
              </div>

              {allocationOptions.length > 0 && (
                <div className="panel">
                  <h3>📋 Allocation Options</h3>
                  <p className="hint">Switch between different allocation strategies</p>
                  <div className="option-list">
                    {allocationOptions.map(option => (
                      <button
                        key={option.option_id}
                        className={`option-item ${selectedOptionId === option.option_id ? 'active' : ''}`}
                        onClick={() => handleSelectOption(option.option_id)}
                      >
                        <div className="option-id">Option {option.option_id}</div>
                        <div className="option-desc">{option.description}</div>
                        <div className="option-stats">
                          {option.allocations.filter(s => s.seat_type === SeatStatus.ASSIGNABLE).length} assigned, {' '}
                          {option.allocations.filter(s => s.seat_type === SeatStatus.BUFFER).length} buffer
                        </div>
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
