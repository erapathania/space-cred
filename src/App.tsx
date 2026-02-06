/**
 * Main App Component - TABLE-FIRST ARCHITECTURE
 * 
 * ROLE 1: ADMIN - Setup seats AND tables
 * ROLE 2: FACILITY_USER - View table-based allocations
 */

import { useState, useEffect } from 'react';
import { FloorPlanViewer } from './components/FloorPlanViewer';
import type { ReferenceSeat, AllocatedSeat, AllocationOption, Table, EnhancedAllocatedSeat } from './types';
import { UserRole, SeatStatus } from './types';
import { saveReferenceSeats, loadReferenceSeats, saveTables, loadTables } from './utils/storage';
import { mapSeatsToTables } from './utils/tableMapping';
import { generateManagers, generateSubManagers, generateEmployees } from './data/organizationData';
import { formTeams } from './utils/teamFormation';
import { allocateWithLeaders } from './utils/enhancedAllocationEngine';
import './App.css';

function App() {
  // Role management
  const [currentRole, setCurrentRole] = useState<typeof UserRole[keyof typeof UserRole]>(UserRole.ADMIN);
  
  // Reference seats (RED DOTS) - managed by ADMIN
  const [referenceSeats, setReferenceSeats] = useState<ReferenceSeat[]>([]);
  const [isReferenceMarkingMode, setIsReferenceMarkingMode] = useState(false);
  
  // Tables (GOLD RECTANGLES) - managed by ADMIN
  const [tables, setTables] = useState<Table[]>([]);
  const [isTableDrawingMode, setIsTableDrawingMode] = useState(false);
  
  // Debug mode
  const [showTableBoundaries, setShowTableBoundaries] = useState(false);
  
  // Allocation options and current selection
  const [allocationOptions, setAllocationOptions] = useState<AllocationOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [allocatedSeats, setAllocatedSeats] = useState<AllocatedSeat[]>([]);
  
  // Team highlighting
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null);
  
  // Generated teams (for legend display)
  const [generatedTeams, setGeneratedTeams] = useState<any[]>([]);

  // Load reference seats and tables on mount
  useEffect(() => {
    const loadedSeats = loadReferenceSeats();
    const loadedTables = loadTables();
    setReferenceSeats(loadedSeats);
    setTables(loadedTables);
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

  // Generate unique table ID
  const generateTableId = (): string => {
    const existingIds = new Set(tables.map(t => t.table_id));
    let counter = 1;
    let newId = `TABLE-${counter.toString().padStart(3, '0')}`;
    
    while (existingIds.has(newId)) {
      counter++;
      newId = `TABLE-${counter.toString().padStart(3, '0')}`;
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

  // ADMIN: Create table by drawing rectangle
  const handleTableDrawn = (tableData: Omit<Table, 'table_id'>) => {
    const newTable: Table = {
      table_id: generateTableId(),
      ...tableData,
    };

    setTables(prev => [...prev, newTable]);
    console.log(`✅ Created table: ${newTable.table_id} at (${newTable.x}, ${newTable.y}) size ${newTable.width}x${newTable.height}`);
  };

  // ADMIN: Save seat map + tables permanently
  const handleSaveSeatMap = () => {
    if (referenceSeats.length === 0) {
      alert('No reference seats to save. Create some first.');
      return;
    }

    if (tables.length === 0) {
      alert('⚠️ No tables defined!\n\nYou should draw tables first for proper allocation.');
    }

    try {
      // Map seats to tables
      const mappedSeats = mapSeatsToTables(referenceSeats, tables);
      
      saveReferenceSeats(mappedSeats);
      saveTables(tables);
      
      setReferenceSeats(mappedSeats);
      
      alert(`✅ Saved successfully!\n\nSeats: ${mappedSeats.length}\nTables: ${tables.length}\n\nSeats have been mapped to tables.`);
      setIsReferenceMarkingMode(false);
      setIsTableDrawingMode(false);
    } catch (error) {
      alert('Failed to save. Please try again.');
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

  // ADMIN: Clear all tables
  const handleClearTables = () => {
    const confirmed = window.confirm(
      'Delete ALL tables?'
    );

    if (confirmed) {
      setTables([]);
      saveTables([]);
      console.log(`✅ Cleared all tables`);
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

  // FACILITY_USER: Generate enhanced allocation with hierarchy
  const handleGenerateOptions = () => {
    if (referenceSeats.length === 0) {
      alert('No reference seats available. Contact admin to set up seat map.');
      return;
    }

    if (tables.length === 0) {
      alert('⚠️ No tables defined!\n\nContact admin to draw tables first.\n\nTable-based allocation requires tables.');
      return;
    }

    console.log(`🏢 Generating ENHANCED allocation with organizational hierarchy...`);
    
    // Generate organization data
    const managers = generateManagers();
    const subManagers = generateSubManagers(managers);
    const employees = generateEmployees(managers, subManagers);
    
    // Form teams from hierarchy
    const teams = formTeams(managers, subManagers, employees);
    
    // Store teams for legend display
    setGeneratedTeams(teams);
    
    console.log(`📊 Generated: ${managers.length} managers, ${subManagers.length} sub-managers, ${employees.length} employees`);
    console.log(`👥 Formed: ${teams.length} teams`);
    
    // Map seats to tables if not already mapped
    const mappedSeats = referenceSeats.every(s => s.table_id)
      ? referenceSeats
      : mapSeatsToTables(referenceSeats, tables);
    
    // Run enhanced allocation
    const enhancedAllocations = allocateWithLeaders(mappedSeats, tables, teams);
    
    // Convert to AllocatedSeat format for compatibility
    const allocations: AllocatedSeat[] = enhancedAllocations.map(seat => ({
      seat_ref_id: seat.seat_ref_id,
      x: seat.x,
      y: seat.y,
      seat_type: seat.seat_type,
      assigned_team: seat.assigned_team,
      assigned_manager: seat.assigned_manager,
    }));
    
    const options: AllocationOption[] = [{
      option_id: 'ENHANCED',
      description: 'Leader-First Allocation (Hierarchy-based, Teams sit together)',
      allocations,
    }];
    
    setAllocationOptions(options);
    
    // Auto-select first option
    if (options.length > 0) {
      setSelectedOptionId(options[0].option_id);
      setAllocatedSeats(options[0].allocations);
    }

    console.log(`✅ Generated enhanced allocation with ${allocations.length} seats`);
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

  // Helper function to get team color
  const getTeamColor = (teamId: string | undefined): string => {
    if (!teamId) return '#CCCCCC';
    const team = generatedTeams.find(t => t.team_id === teamId);
    return team?.color || '#CCCCCC';
  };

  // Statistics
  const stats = {
    referenceSeats: referenceSeats.length,
    tables: tables.length,
    allocatedTotal: allocatedSeats.length,
    assignable: allocatedSeats.filter(s => s.seat_type === SeatStatus.ASSIGNABLE).length,
    teams: generatedTeams.length,
    totalTeamSize: generatedTeams.reduce((sum: number, team: any) => sum + team.members.length, 0),
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🏢 Space Allocation System V1</h1>
          <p className="subtitle">Table-First Architecture</p>
        </div>
        <div className="role-switcher">
          <button
            className={`role-btn ${currentRole === UserRole.ADMIN ? 'active' : ''}`}
            onClick={() => {
              setCurrentRole(UserRole.ADMIN);
              setIsReferenceMarkingMode(false);
              setIsTableDrawingMode(false);
            }}
          >
            👤 ADMIN
          </button>
          <button
            className={`role-btn ${currentRole === UserRole.FACILITY_USER ? 'active' : ''}`}
            onClick={() => {
              setCurrentRole(UserRole.FACILITY_USER);
              setIsReferenceMarkingMode(false);
              setIsTableDrawingMode(false);
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
            tables={tables}
            onDirectClick={handleAdminClick}
            onTableDrawn={handleTableDrawn}
            isReferenceMarkingMode={isReferenceMarkingMode}
            isTableDrawingMode={isTableDrawingMode}
            showTableBoundaries={showTableBoundaries}
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
              <div className="stat-item">
                <span className="stat-label">Tables</span>
                <span className="stat-value">{stats.tables}</span>
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
                <span className="stat-label">Assigned</span>
                <span className="stat-value green">{stats.assignable}</span>
              </div>
            </div>
          </div>

          {/* ADMIN VIEW */}
          {currentRole === UserRole.ADMIN && (
            <>
              <div className="panel">
                <h3>🔴 Step 1: Mark Seats</h3>
                <p className="hint">
                  {isReferenceMarkingMode 
                    ? '✓ Click anywhere to create RED dots' 
                    : 'Mark where seats physically exist'}
                </p>
                <button
                  className={`btn ${isReferenceMarkingMode ? 'btn-success' : 'btn-primary'}`}
                  onClick={() => {
                    setIsReferenceMarkingMode(!isReferenceMarkingMode);
                    setIsTableDrawingMode(false);
                  }}
                >
                  {isReferenceMarkingMode ? '✓ Marking Seats' : 'Mark Seats'}
                </button>
              </div>

              <div className="panel">
                <h3>🟡 Step 2: Draw Tables</h3>
                <p className="hint">
                  {isTableDrawingMode 
                    ? '✓ Drag to draw table rectangles' 
                    : 'Draw rectangles around table areas'}
                </p>
                <button
                  className={`btn ${isTableDrawingMode ? 'btn-success' : 'btn-primary'}`}
                  onClick={() => {
                    setIsTableDrawingMode(!isTableDrawingMode);
                    setIsReferenceMarkingMode(false);
                  }}
                >
                  {isTableDrawingMode ? '✓ Drawing Tables' : 'Draw Tables'}
                </button>
              </div>

              <div className="panel">
                <h3>🔍 Debug Mode</h3>
                <p className="hint">Show table boundaries and labels</p>
                <button
                  className={`btn ${showTableBoundaries ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setShowTableBoundaries(!showTableBoundaries)}
                >
                  {showTableBoundaries ? '✓ Showing Tables' : 'Show Tables'}
                </button>
              </div>

              <div className="panel">
                <h3>💾 Step 3: Save</h3>
                <p className="hint">
                  Save seats + tables. Seats will be mapped to tables automatically.
                </p>
                <div className="button-group">
                  <button
                    className="btn btn-success"
                    onClick={handleSaveSeatMap}
                    disabled={referenceSeats.length === 0}
                  >
                    💾 Save Seat Map + Tables
                  </button>
                  <label className="btn btn-secondary">
                    📥 Import Seats JSON
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
                    🗑️ Clear Seats
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleClearTables}
                    disabled={tables.length === 0}
                  >
                    🗑️ Clear Tables
                  </button>
                </div>
              </div>
            </>
          )}

          {/* FACILITY USER VIEW */}
          {currentRole === UserRole.FACILITY_USER && (
            <>
              <div className="panel">
                <h3>🔍 Debug Mode</h3>
                <p className="hint">Show table boundaries</p>
                <button
                  className={`btn ${showTableBoundaries ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setShowTableBoundaries(!showTableBoundaries)}
                >
                  {showTableBoundaries ? '✓ Showing Tables' : 'Show Tables'}
                </button>
              </div>

              {allocationOptions.length > 0 && generatedTeams.length > 0 && (
                <div className="panel">
                  <h3>🎨 Team Legend</h3>
                  <p className="hint">Hover to highlight team seats (showing first 20 teams)</p>
                  <div className="team-legend-list">
                    {generatedTeams.slice(0, 20).map((team: any) => {
                      const teamSeats = allocatedSeats.filter(s => s.assigned_team === team.team_id);
                      const seatIds = teamSeats.map(s => s.seat_ref_id).slice(0, 5).join(', ');
                      
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
                                {team.department} | {team.members.length} members | {teamSeats.length} seats
                              </div>
                            </div>
                          </div>
                          {teamSeats.length > 0 && (
                            <div className="team-legend-seats">
                              {seatIds}{teamSeats.length > 5 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {generatedTeams.length > 20 && (
                      <div className="team-legend-more">
                        + {generatedTeams.length - 20} more teams
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="panel">
                <h3>🎲 Generate Allocation</h3>
                <p className="hint">
                  {referenceSeats.length === 0
                    ? '⚠️ No seats available'
                    : tables.length === 0
                    ? '⚠️ No tables defined'
                    : 'Generate table-based allocation'}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateOptions}
                  disabled={referenceSeats.length === 0 || tables.length === 0}
                >
                  🎲 Generate Allocation
                </button>
              </div>

              {allocationOptions.length > 0 && (
                <div className="panel">
                  <h3>📋 Allocation Result</h3>
                  <p className="hint">Table-based allocation (teams sit together)</p>
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
                          {option.allocations.length} seats assigned
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
        <p>Space Allocation System V1 | Role: {currentRole} | Table-First Architecture</p>
      </footer>
    </div>
  );
}

export default App;
