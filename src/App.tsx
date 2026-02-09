/**
 * Main App Component - TABLE-FIRST ARCHITECTURE
 *
 * ROLE 1: ADMIN - Setup seats AND tables
 * ROLE 2: FACILITY_USER - View table-based allocations
 */

import { useState, useEffect } from 'react';
import { FloorPlanViewer } from './components/FloorPlanViewer';
import { LeaderPreferenceModal } from './components/LeaderPreferenceModal';
import { SeatAttributeModal } from './components/SeatAttributeModal';
import { AdminConfigPanel } from './components/AdminConfigPanel';
import type { ReferenceSeat, AllocatedSeat, AllocationOption, Table, EnhancedAllocatedSeat, Leader, LeaderPreferences, SeatAttributes, AllocationMode, AllocationConfig } from './types';
import { UserRole, SeatStatus, DEFAULT_ALLOCATION_CONFIG } from './types';
import { saveReferenceSeats, loadReferenceSeats, saveTables, loadTables } from './utils/storage';
import { mapSeatsToTables } from './utils/tableMapping';
import { generateManagers, generateSubManagers, generateEmployees, LEADERS } from './data/organizationData';
import { formTeams } from './utils/teamFormation';
import { allocateWithLeaders } from './utils/enhancedAllocationEngine';
import './App.css';

function App() {
  // Role management
  const [currentRole, setCurrentRole] = useState<typeof UserRole[keyof typeof UserRole]>(UserRole.ADMIN);

  // Manual edit mode for FACILITY_USER
  const [isManualEditMode, setIsManualEditMode] = useState(false);

  // Locked seats (manual overrides that should not be changed by allocation)
  const [lockedSeats, setLockedSeats] = useState<Set<string>>(new Set());

  // Reference seats (RED DOTS) - managed by ADMIN
  const [referenceSeats, setReferenceSeats] = useState<ReferenceSeat[]>([]);
  const [isReferenceMarkingMode, setIsReferenceMarkingMode] = useState(false);
  
  // Tables (SILVER RECTANGLES) - managed by ADMIN
  const [tables, setTables] = useState<Table[]>([]);
  const [isTableDrawingMode, setIsTableDrawingMode] = useState(false);
  
  // Debug mode
  const [showTableBoundaries, setShowTableBoundaries] = useState(false);
  
  // Allocation options and current selection
  const [allocationOptions, setAllocationOptions] = useState<AllocationOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [allocatedSeats, setAllocatedSeats] = useState<AllocatedSeat[]>([]);
  
  // Enhanced allocated seats (with employee data for UI)
  const [enhancedSeats, setEnhancedSeats] = useState<EnhancedAllocatedSeat[]>([]);
  
  // Team highlighting
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null);
  
  // Generated teams (for legend display)
  const [generatedTeams, setGeneratedTeams] = useState<any[]>([]);

  // Performance: Precomputed mappings (currently unused, reserved for future optimizations)
  const [_teamToSeats, _setTeamToSeats] = useState<Map<string, EnhancedAllocatedSeat[]>>(new Map());
  const [_tableToSeats, _setTableToSeats] = useState<Map<string, EnhancedAllocatedSeat[]>>(new Map());
  
  // Leader preference management
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [_leaderPreferences, setLeaderPreferences] = useState<Map<string, LeaderPreferences>>(new Map());
  
  // Seat attribute management (ADMIN)
  const [selectedSeatForAttributes, setSelectedSeatForAttributes] = useState<ReferenceSeat | null>(null);

  // Allocation mode (POD_BASED or MANAGER_BASED)
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('POD_BASED');

  // Allocation configuration (ADMIN VARIABLES)
  const [allocationConfig, setAllocationConfig] = useState<AllocationConfig>(DEFAULT_ALLOCATION_CONFIG);

  // Manual action modes for FACILITY_USER
  type ManualActionMode = 'SWAP' | 'ADD' | 'DELETE' | null;
  const [manualActionMode, setManualActionMode] = useState<ManualActionMode>(null);

  // Load reference seats and tables on mount
  useEffect(() => {
    const loadedSeats = loadReferenceSeats();
    const loadedTables = loadTables();
    setReferenceSeats(loadedSeats);
    setTables(loadedTables);
  }, []);

  // Precompute team and table mappings for performance
  useEffect(() => {
    // Precompute team → seats mapping
    const teamMap = new Map<string, EnhancedAllocatedSeat[]>();
    enhancedSeats.forEach(seat => {
      const teamId = seat.assigned_team;
      if (teamId) {
        if (!teamMap.has(teamId)) {
          teamMap.set(teamId, []);
        }
        teamMap.get(teamId)!.push(seat);
      }
    });
    _setTeamToSeats(teamMap);

    // Precompute table → seats mapping
    const tableMap = new Map<string, EnhancedAllocatedSeat[]>();
    enhancedSeats.forEach(seat => {
      if (seat.table_id) {
        if (!tableMap.has(seat.table_id)) {
          tableMap.set(seat.table_id, []);
        }
        tableMap.get(seat.table_id)!.push(seat);
      }
    });
    _setTableToSeats(tableMap);
  }, [enhancedSeats]);

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
    const teams = formTeams(managers, subManagers, employees, tables);
    
    // Store teams for legend display
    setGeneratedTeams(teams);
    
    console.log(`📊 Generated: ${managers.length} managers, ${subManagers.length} sub-managers, ${employees.length} employees`);
    console.log(`👥 Formed: ${teams.length} teams`);
    
    // Map seats to tables if not already mapped
    const mappedSeats = referenceSeats.every(s => s.table_id)
      ? referenceSeats
      : mapSeatsToTables(referenceSeats, tables);
    
    // Run enhanced allocation with selected mode
    const { allocatedSeats: enhancedAllocations, pods: _pods } = allocateWithLeaders(mappedSeats, tables, teams, allocationMode);

    // Store enhanced seats for UI display
    setEnhancedSeats(enhancedAllocations);

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

  // FACILITY_USER: Handle leader preference save
  const handleSaveLeaderPreference = (leaderId: string, preferences: LeaderPreferences) => {
    setLeaderPreferences(prev => {
      const updated = new Map(prev);
      updated.set(leaderId, preferences);
      return updated;
    });
    
    // Update the leader in LEADERS array (in-memory only for this session)
    const leader = LEADERS.find(l => l.leader_id === leaderId);
    if (leader) {
      leader.preferences = preferences;
      console.log(`✅ Updated preferences for ${leader.name}:`, preferences);
    }
  };

  // ADMIN: Handle seat attribute save
  const handleSaveSeatAttributes = (seatId: string, attributes: SeatAttributes) => {
    setReferenceSeats(prev =>
      prev.map(seat =>
        seat.seat_ref_id === seatId
          ? { ...seat, attributes }
          : seat
      )
    );
    console.log(`✅ Updated attributes for ${seatId}:`, attributes);
  };

  // FACILITY_USER: Lock/unlock seat for manual override
  const handleSeatLock = (seatRefId: string) => {
    setLockedSeats(prev => new Set(prev).add(seatRefId));
    console.log(`🔒 Locked seat ${seatRefId}`);
  };

  const handleSeatUnlock = (seatRefId: string) => {
    setLockedSeats(prev => {
      const updated = new Set(prev);
      updated.delete(seatRefId);
      return updated;
    });
    console.log(`🔓 Unlocked seat ${seatRefId}`);
  };

  // FACILITY_USER: Swap two seats (manual override)
  const handleSeatSwap = (seatId1: string, seatId2: string) => {
    setAllocatedSeats(prev => {
      const seat1 = prev.find(s => s.seat_ref_id === seatId1);
      const seat2 = prev.find(s => s.seat_ref_id === seatId2);

      if (!seat1 || !seat2) return prev;

      return prev.map(seat => {
        if (seat.seat_ref_id === seatId1) {
          return { ...seat2, seat_ref_id: seatId1, x: seat.x, y: seat.y };
        }
        if (seat.seat_ref_id === seatId2) {
          return { ...seat1, seat_ref_id: seatId2, x: seat.x, y: seat.y };
        }
        return seat;
      });
    });

    // Lock both seats after swap
    handleSeatLock(seatId1);
    handleSeatLock(seatId2);

    console.log(`🔄 Swapped seats ${seatId1} ↔ ${seatId2}`);
  };

  // Helper function to get team color - DEPARTMENT-BASED PALETTE (max 8 hues)
  const DEPARTMENT_COLORS: Record<string, string> = {
    Engineering: '#3B82F6',      // Blue
    Design: '#8B5CF6',          // Purple
    Marketing: '#EC4899',       // Pink
    Sales: '#EF4444',           // Red
    Operations: '#F59E0B',      // Amber
    HR: '#10B981',              // Green
    Finance: '#06B6D4',         // Cyan
    Legal: '#6366F1',           // Indigo
  };

  const getTeamColor = (teamId: string | undefined): string => {
    if (!teamId) return '#CCCCCC';
    const team = generatedTeams.find(t => t.team_id === teamId);

    if (!team) return '#CCCCCC';

    // Get base department color
    const baseColor = DEPARTMENT_COLORS[team.department] || '#CCCCCC';

    // Use base color directly - all teams in same department get same color
    // (shading by role happens in the UI via opacity/lightness adjustments)
    return baseColor;
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

  // Debug logging for manual edit mode
  useEffect(() => {
    const isReadOnlyValue = currentRole === UserRole.FACILITY_USER ? !isManualEditMode : false;
    console.log('🔍 App state - currentRole:', currentRole, 'isManualEditMode:', isManualEditMode, 'isReadOnly:', isReadOnlyValue);
  }, [currentRole, isManualEditMode]);

  // ============================================
  // ADMIN CONFIG HANDLERS
  // ============================================

  const handleConfigChange = (config: AllocationConfig) => {
    setAllocationConfig(config);
    console.log('🔧 Config updated:', config);
  };

  const handleApplyConfig = () => {
    // Save config to localStorage for persistence
    localStorage.setItem('space_allocation_config', JSON.stringify(allocationConfig));
    alert('✅ Configuration saved successfully!\n\nChanges will apply to the next allocation generation.');
    console.log('💾 Config saved to localStorage:', allocationConfig);
  };

  // ============================================
  // MANUAL ACTION HANDLERS (FACILITY_USER)
  // ============================================

  const handleManualActionSelect = (mode: ManualActionMode) => {
    if (manualActionMode === mode) {
      // Toggle off if clicking same mode
      setManualActionMode(null);
      setIsManualEditMode(false);
      console.log('🔄 Manual action mode disabled');
    } else {
      setManualActionMode(mode);
      setIsManualEditMode(true);
      console.log(`🔄 Manual action mode: ${mode}`);
    }
  };

  const handleAddSeat = (x: number, y: number) => {
    if (manualActionMode !== 'ADD') return;

    // Find the table at this location
    const table = tables.find(t =>
      x >= t.x && x <= t.x + t.width &&
      y >= t.y && y <= t.y + t.height
    );

    if (!table) {
      alert('⚠️ Cannot add seat here.\n\nSeats must be placed within a table boundary.');
      return;
    }

    // Create new reference seat
    const newRefSeat: ReferenceSeat = {
      seat_ref_id: generateRefSeatId(),
      x: Math.round(x),
      y: Math.round(y),
      table_id: table.table_id,
    };

    setReferenceSeats(prev => [...prev, newRefSeat]);
    saveReferenceSeats([...referenceSeats, newRefSeat]);

    // Create allocated seat (unassigned)
    const newAllocatedSeat: EnhancedAllocatedSeat = {
      seat_ref_id: newRefSeat.seat_ref_id,
      x: newRefSeat.x,
      y: newRefSeat.y,
      seat_type: SeatStatus.RESERVED,
      table_id: table.table_id,
    };

    setEnhancedSeats(prev => [...prev, newAllocatedSeat]);
    setAllocatedSeats(prev => [...prev, newAllocatedSeat]);

    console.log(`✅ Added seat ${newRefSeat.seat_ref_id} at (${x}, ${y}) on table ${table.table_id}`);
  };

  const handleDeleteSeat = (seatRefId: string) => {
    if (manualActionMode !== 'DELETE') return;

    const confirmed = window.confirm(
      `Delete seat ${seatRefId}?\n\nThis will remove the seat permanently.`
    );

    if (!confirmed) return;

    // Remove from reference seats
    const updatedRefSeats = referenceSeats.filter(s => s.seat_ref_id !== seatRefId);
    setReferenceSeats(updatedRefSeats);
    saveReferenceSeats(updatedRefSeats);

    // Remove from allocated seats
    setEnhancedSeats(prev => prev.filter(s => s.seat_ref_id !== seatRefId));
    setAllocatedSeats(prev => prev.filter(s => s.seat_ref_id !== seatRefId));

    // Remove from locked seats
    if (lockedSeats.has(seatRefId)) {
      const updatedLocked = new Set(lockedSeats);
      updatedLocked.delete(seatRefId);
      setLockedSeats(updatedLocked);
    }

    console.log(`🗑️ Deleted seat ${seatRefId}`);
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
            enhancedSeats={enhancedSeats}
            tables={tables}
            onDirectClick={handleAdminClick}
            onTableDrawn={handleTableDrawn}
            isReferenceMarkingMode={isReferenceMarkingMode}
            isTableDrawingMode={isTableDrawingMode}
            showTableBoundaries={showTableBoundaries}
            isReadOnly={currentRole === UserRole.FACILITY_USER ? !isManualEditMode : false}
            getTeamColor={getTeamColor}
            highlightedTeam={highlightedTeam}
            lockedSeats={lockedSeats}
            onSeatLock={handleSeatLock}
            onSeatUnlock={handleSeatUnlock}
            onSeatSwap={handleSeatSwap}
            manualActionMode={manualActionMode}
            onAddSeat={handleAddSeat}
            onDeleteSeat={handleDeleteSeat}
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
                <p className="hint" style={{ marginTop: '12px', fontSize: '12px' }}>
                  💡 <strong>Tip:</strong> Right-click on any seat to set attributes (window, door, corner, etc.)
                </p>
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

              <div className="panel">
                <h3>⚙️ Allocation Configuration</h3>
                <p className="hint">Configure global allocation variables and behavior</p>
                <AdminConfigPanel
                  config={allocationConfig}
                  onConfigChange={handleConfigChange}
                  onApplyConfig={handleApplyConfig}
                />
              </div>
            </>
          )}

          {/* FACILITY USER VIEW */}
          {currentRole === UserRole.FACILITY_USER && (
            <>
              <div className="panel">
                <h3>⭐ Leader Preferences</h3>
                <p className="hint">Set seat preferences for leaders (soft constraints)</p>
                <div className="leader-preference-list">
                  {LEADERS.slice(0, 5).map(leader => (
                    <button
                      key={leader.leader_id}
                      className="leader-preference-btn"
                      onClick={() => setSelectedLeader(leader)}
                    >
                      <span className="leader-name">{leader.name}</span>
                      <span className="leader-dept-badge">{leader.department}</span>
                      {Object.keys(leader.preferences).length > 0 && (
                        <span className="leader-has-prefs">✓</span>
                      )}
                    </button>
                  ))}
                  {LEADERS.length > 5 && (
                    <div className="leader-more-hint">
                      + {LEADERS.length - 5} more leaders (click to expand)
                    </div>
                  )}
                </div>
              </div>

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

              {allocatedSeats.length > 0 && (
                <div className="panel">
                  <h3>✏️ Manual Seat Adjustment</h3>
                  <p className="hint">
                    {isManualEditMode
                      ? 'Drag and drop seats to manually adjust positions'
                      : 'Enable manual edit mode to modify seat allocations'}
                  </p>
                  <button
                    className={`btn ${isManualEditMode ? 'btn-warning' : 'btn-secondary'}`}
                    onClick={() => {
                      const newMode = !isManualEditMode;
                      console.log('🔄 Manual Edit Mode toggled:', newMode);
                      setIsManualEditMode(newMode);
                    }}
                    style={isManualEditMode ? {
                      border: '2px solid var(--silver)',
                      boxShadow: '0 0 12px var(--silver-glow)'
                    } : {}}
                  >
                    {isManualEditMode ? '✓ Manual Edit Mode: ON' : 'Enable Manual Edit'}
                  </button>
                  {isManualEditMode && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: 'rgba(192, 192, 192, 0.1)',
                      border: '1px solid var(--silver)',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: 'var(--text-primary)'
                    }}>
                      💡 Tip: Click and drag seats on the floor plan to reposition them
                    </div>
                  )}

                  {isManualEditMode && (
                    <div className="manual-options-panel" style={{ marginTop: '20px' }}>
                      <h4>🔧 Manual Actions</h4>
                      <div className="manual-actions-grid">
                        <button
                          className={`manual-action-btn ${manualActionMode === 'SWAP' ? 'active' : ''}`}
                          onClick={() => handleManualActionSelect('SWAP')}
                        >
                          <div className="manual-action-icon">🔄</div>
                          <div className="manual-action-label">Swap Seats</div>
                        </button>
                        <button
                          className={`manual-action-btn ${manualActionMode === 'ADD' ? 'active' : ''}`}
                          onClick={() => handleManualActionSelect('ADD')}
                        >
                          <div className="manual-action-icon">➕</div>
                          <div className="manual-action-label">Add Seat</div>
                        </button>
                        <button
                          className={`manual-action-btn ${manualActionMode === 'DELETE' ? 'active' : ''}`}
                          onClick={() => handleManualActionSelect('DELETE')}
                        >
                          <div className="manual-action-icon">🗑️</div>
                          <div className="manual-action-label">Delete Seat</div>
                        </button>
                      </div>
                      {manualActionMode === 'SWAP' && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          background: 'rgba(127, 169, 155, 0.15)',
                          border: '1px solid var(--accent-green)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: 'var(--cream)'
                        }}>
                          Click first seat, then click second seat to swap
                        </div>
                      )}
                      {manualActionMode === 'ADD' && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          background: 'rgba(127, 169, 155, 0.15)',
                          border: '1px solid var(--accent-green)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: 'var(--cream)'
                        }}>
                          Click on the floor plan (within a table) to add a new seat
                        </div>
                      )}
                      {manualActionMode === 'DELETE' && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          background: 'rgba(166, 89, 89, 0.15)',
                          border: '1px solid #A65959',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: 'var(--cream)'
                        }}>
                          Click on any seat to delete it permanently
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                <h3>🎯 Allocation Mode</h3>
                <p className="hint">Choose allocation strategy</p>
                <div className="mode-toggle-group">
                  <button
                    className={`mode-toggle-btn ${allocationMode === 'POD_BASED' ? 'active' : ''}`}
                    onClick={() => setAllocationMode('POD_BASED')}
                  >
                    <div className="mode-title">POD-Based</div>
                    <div className="mode-desc">Departments → PODs → Tables</div>
                  </button>
                  <button
                    className={`mode-toggle-btn ${allocationMode === 'MANAGER_BASED' ? 'active' : ''}`}
                    onClick={() => setAllocationMode('MANAGER_BASED')}
                  >
                    <div className="mode-title">Manager-Based</div>
                    <div className="mode-desc">Managers → Closest Tables</div>
                  </button>
                </div>
              </div>

              <div className="panel">
                <h3>🎲 Generate Allocation</h3>
                <p className="hint">
                  {referenceSeats.length === 0
                    ? '⚠️ No seats available'
                    : tables.length === 0
                    ? '⚠️ No tables defined'
                    : `Using ${allocationMode === 'POD_BASED' ? 'POD-Based' : 'Manager-Based'} mode`}
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

      {/* Leader Preference Modal */}
      {selectedLeader && (
        <LeaderPreferenceModal
          leader={selectedLeader}
          onSave={handleSaveLeaderPreference}
          onClose={() => setSelectedLeader(null)}
        />
      )}

      {/* Seat Attribute Modal (ADMIN) */}
      {selectedSeatForAttributes && (
        <SeatAttributeModal
          seat={selectedSeatForAttributes}
          onSave={handleSaveSeatAttributes}
          onClose={() => setSelectedSeatForAttributes(null)}
        />
      )}
    </div>
  );
}

export default App;
