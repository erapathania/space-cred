/**
 * AdminConfigPanel - Configuration Panel for Allocation Variables
 * Only visible to ADMIN users
 */

import React from 'react';
import type {
  AllocationConfig,
  AttendanceMode,
  BufferScope,
  BufferPriority,
  AllocationStrategyType,
  LeaderPreferenceType
} from '../types';

interface AdminConfigPanelProps {
  config: AllocationConfig;
  onConfigChange: (config: AllocationConfig) => void;
  onApplyConfig: () => void;
}

export const AdminConfigPanel: React.FC<AdminConfigPanelProps> = ({
  config,
  onConfigChange,
  onApplyConfig,
}) => {

  const updateConfig = (updates: Partial<AllocationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="admin-config-panel">
      <h2>🔧 Allocation Configuration</h2>
      <p className="config-description">
        Configure global allocation behavior. Changes apply to next allocation generation.
      </p>

      {/* 1. ATTENDANCE & CAPACITY CONTROLS */}
      <section className="config-section">
        <h3>1️⃣ Attendance & Capacity Controls</h3>

        <div className="config-row">
          <label>Attendance Mode:</label>
          <select
            value={config.attendance_mode}
            onChange={(e) => updateConfig({ attendance_mode: e.target.value as AttendanceMode })}
          >
            <option value="FULL">Full Office (100%)</option>
            <option value="HYBRID_50">Hybrid 50%</option>
            <option value="HYBRID_75">Hybrid 75%</option>
            <option value="CUSTOM">Custom Percentage</option>
          </select>
        </div>

        {config.attendance_mode === 'CUSTOM' && (
          <div className="config-row">
            <label>Custom Attendance %:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.attendance_percentage}
              onChange={(e) => updateConfig({ attendance_percentage: parseInt(e.target.value) || 0 })}
            />
          </div>
        )}

        <div className="config-row">
          <label>Allow Overbooking:</label>
          <input
            type="checkbox"
            checked={config.overbooking_allowed}
            onChange={(e) => updateConfig({ overbooking_allowed: e.target.checked })}
          />
        </div>

        {config.overbooking_allowed && (
          <div className="config-row">
            <label>Overbooking % (110 = +10%):</label>
            <input
              type="number"
              min="100"
              max="150"
              value={config.overbooking_percentage}
              onChange={(e) => updateConfig({ overbooking_percentage: parseInt(e.target.value) || 100 })}
            />
          </div>
        )}
      </section>

      {/* 2. BUFFER STRATEGY */}
      <section className="config-section">
        <h3>2️⃣ Buffer Strategy</h3>

        <div className="config-row">
          <label>Enable Buffer Seats:</label>
          <input
            type="checkbox"
            checked={config.buffer_enabled}
            onChange={(e) => updateConfig({ buffer_enabled: e.target.checked })}
          />
        </div>

        {config.buffer_enabled && (
          <>
            <div className="config-row">
              <label>Buffer Percentage:</label>
              <input
                type="number"
                min="0"
                max="50"
                value={config.buffer_percentage}
                onChange={(e) => updateConfig({ buffer_percentage: parseInt(e.target.value) || 0 })}
              />
              <span className="help-text">% of total seats to keep unassigned</span>
            </div>

            <div className="config-row">
              <label>Buffer Scope:</label>
              <select
                value={config.buffer_scope}
                onChange={(e) => updateConfig({ buffer_scope: e.target.value as BufferScope })}
              >
                <option value="GLOBAL">Global (entire floor)</option>
                <option value="PER_DEPARTMENT">Per Department</option>
                <option value="PER_POD">Per POD</option>
                <option value="PER_TABLE">Per Table</option>
              </select>
            </div>

            <div className="config-row">
              <label>Buffer Priority:</label>
              <select
                value={config.buffer_priority}
                onChange={(e) => updateConfig({ buffer_priority: e.target.value as BufferPriority })}
              >
                <option value="DISTRIBUTED">Distributed Evenly</option>
                <option value="END_OF_FLOOR">End of Floor</option>
                <option value="BETWEEN_DEPARTMENTS">Between Departments</option>
              </select>
            </div>
          </>
        )}
      </section>

      {/* 3. ALLOCATION MODE */}
      <section className="config-section">
        <h3>3️⃣ Allocation Strategy</h3>

        <div className="config-row">
          <label>Allocation Strategy:</label>
          <select
            value={config.allocation_strategy}
            onChange={(e) => updateConfig({ allocation_strategy: e.target.value as AllocationStrategyType })}
          >
            <option value="POD_BASED">POD-Based (Department Clustering)</option>
            <option value="TEAM_COHESION">Team Cohesion</option>
            <option value="MANAGER_PROXIMITY">Manager Proximity</option>
            <option value="SPACE_EFFICIENCY">Space Efficiency</option>
          </select>
        </div>

        <div className="config-row">
          <label>Strict Table Constraint:</label>
          <input
            type="checkbox"
            checked={config.strict_table_constraint}
            onChange={(e) => updateConfig({ strict_table_constraint: e.target.checked })}
          />
          <span className="help-text">Teams never split across tables</span>
        </div>

        <div className="config-row">
          <label>Allow Table Spillover:</label>
          <input
            type="checkbox"
            checked={config.allow_table_spillover}
            onChange={(e) => updateConfig({ allow_table_spillover: e.target.checked })}
          />
          <span className="help-text">Large teams can use adjacent tables in same POD</span>
        </div>

        <div className="config-row">
          <label>Prioritize Department Clustering:</label>
          <input
            type="checkbox"
            checked={config.prioritize_department_clustering}
            onChange={(e) => updateConfig({ prioritize_department_clustering: e.target.checked })}
          />
        </div>
      </section>

      {/* 4. OVERRIDE & LOCKING */}
      <section className="config-section">
        <h3>4️⃣ Override & Locking</h3>

        <div className="config-row">
          <label>Allow Manual Override:</label>
          <input
            type="checkbox"
            checked={config.allow_manual_override}
            onChange={(e) => updateConfig({ allow_manual_override: e.target.checked })}
          />
        </div>

        {config.allow_manual_override && (
          <div className="config-row">
            <label>Override Role:</label>
            <select
              value={config.override_role}
              onChange={(e) => updateConfig({ override_role: e.target.value as 'ADMIN' | 'FACILITY_USER' | 'BOTH' })}
            >
              <option value="ADMIN">Admin Only</option>
              <option value="FACILITY_USER">Facility User Only</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
        )}

        <div className="config-row">
          <label>Lock After Publish:</label>
          <input
            type="checkbox"
            checked={config.lock_after_publish}
            onChange={(e) => updateConfig({ lock_after_publish: e.target.checked })}
          />
          <span className="help-text">Prevent changes after publishing</span>
        </div>

        <div className="config-row">
          <label>Preserve Locked Seats on Regenerate:</label>
          <input
            type="checkbox"
            checked={config.preserve_locked_seats_on_regenerate}
            onChange={(e) => updateConfig({ preserve_locked_seats_on_regenerate: e.target.checked })}
          />
        </div>
      </section>

      {/* 5. LEADER/PREMIUM PREFERENCES */}
      <section className="config-section">
        <h3>5️⃣ Leader/Premium Preferences</h3>

        <div className="config-row">
          <label>Enable Leader Priority:</label>
          <input
            type="checkbox"
            checked={config.leader_priority_enabled}
            onChange={(e) => updateConfig({ leader_priority_enabled: e.target.checked })}
          />
        </div>

        {config.leader_priority_enabled && (
          <>
            <div className="config-row">
              <label>Leader Preferences (select multiple):</label>
              <div className="checkbox-group">
                {(['NEAR_WINDOW', 'NEAR_ENTRY', 'QUIET_ZONE', 'CORNER_EDGE', 'NEAR_TEAM'] as LeaderPreferenceType[]).map((pref) => (
                  <label key={pref} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.leader_preference_types.includes(pref)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...config.leader_preference_types, pref]
                          : config.leader_preference_types.filter(p => p !== pref);
                        updateConfig({ leader_preference_types: updated });
                      }}
                    />
                    {pref.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="config-row">
              <label>Max Premium Seats %:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.max_premium_seats_percent}
                onChange={(e) => updateConfig({ max_premium_seats_percent: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="config-row">
              <label>Premium Seat Priority:</label>
              <select
                value={config.premium_seat_allocation_priority}
                onChange={(e) => updateConfig({
                  premium_seat_allocation_priority: e.target.value as 'LEADER_FIRST' | 'SENIORITY_BASED' | 'NONE'
                })}
              >
                <option value="LEADER_FIRST">Leader First</option>
                <option value="SENIORITY_BASED">Seniority Based</option>
                <option value="NONE">None</option>
              </select>
            </div>
          </>
        )}
      </section>

      {/* APPLY BUTTON */}
      <div className="config-actions">
        <button className="btn-primary" onClick={onApplyConfig}>
          💾 Apply Configuration
        </button>
        <p className="help-text">
          Configuration will be saved and applied to the next allocation generation.
        </p>
      </div>
    </div>
  );
};
