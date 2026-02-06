/**
 * Leader Preference Modal
 * Simple UI for leaders to express seat preferences (SOFT CONSTRAINTS)
 */

import React, { useState } from 'react';
import type { Leader, LeaderPreferences } from '../types';
import './LeaderPreferenceModal.css';

interface LeaderPreferenceModalProps {
  leader: Leader;
  onSave: (leaderId: string, preferences: LeaderPreferences) => void;
  onClose: () => void;
}

export const LeaderPreferenceModal: React.FC<LeaderPreferenceModalProps> = ({
  leader,
  onSave,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<LeaderPreferences>(leader.preferences || {});

  const handleToggle = (key: keyof LeaderPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSave(leader.leader_id, preferences);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⭐ Leader Seat Preferences</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="leader-info">
            <strong>{leader.name}</strong>
            <span className="leader-dept">{leader.department}</span>
          </div>

          <p className="preference-note">
            ℹ️ These are <strong>soft preferences</strong>. The system will try to satisfy them
            but won't break team/table integrity.
          </p>

          <div className="preference-list">
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.near_window || false}
                onChange={() => handleToggle('near_window')}
              />
              <div className="preference-label">
                <span className="preference-icon">🪟</span>
                <div>
                  <div className="preference-title">Near Window</div>
                  <div className="preference-desc">Prefer seats with natural light</div>
                </div>
              </div>
            </label>

            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.near_entry || false}
                onChange={() => handleToggle('near_entry')}
              />
              <div className="preference-label">
                <span className="preference-icon">🚪</span>
                <div>
                  <div className="preference-title">Near Entry/Exit</div>
                  <div className="preference-desc">Easy access to doors</div>
                </div>
              </div>
            </label>

            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.near_team || false}
                onChange={() => handleToggle('near_team')}
              />
              <div className="preference-label">
                <span className="preference-icon">👥</span>
                <div>
                  <div className="preference-title">Near Team</div>
                  <div className="preference-desc">Close to team tables</div>
                </div>
              </div>
            </label>

            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.quiet_zone || false}
                onChange={() => handleToggle('quiet_zone')}
              />
              <div className="preference-label">
                <span className="preference-icon">🤫</span>
                <div>
                  <div className="preference-title">Quiet Zone</div>
                  <div className="preference-desc">Away from high-traffic areas</div>
                </div>
              </div>
            </label>

            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.corner_edge || false}
                onChange={() => handleToggle('corner_edge')}
              />
              <div className="preference-label">
                <span className="preference-icon">📐</span>
                <div>
                  <div className="preference-title">Corner/Edge Table</div>
                  <div className="preference-desc">Prefer corner or edge positions</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
