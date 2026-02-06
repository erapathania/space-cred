/**
 * Seat Attribute Modal
 * ADMIN can tag seats with attributes (window, door, corner, etc.)
 */

import React, { useState } from 'react';
import type { ReferenceSeat, SeatAttributes } from '../types';
import './SeatAttributeModal.css';

interface SeatAttributeModalProps {
  seat: ReferenceSeat;
  onSave: (seatId: string, attributes: SeatAttributes) => void;
  onClose: () => void;
}

export const SeatAttributeModal: React.FC<SeatAttributeModalProps> = ({
  seat,
  onSave,
  onClose,
}) => {
  const [attributes, setAttributes] = useState<SeatAttributes>(seat.attributes || {});

  const handleToggle = (key: keyof SeatAttributes) => {
    setAttributes(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSave(seat.seat_ref_id, attributes);
    onClose();
  };

  const handleClearAll = () => {
    setAttributes({});
  };

  const attributeCount = Object.values(attributes).filter(Boolean).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏷️ Seat Attributes</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="seat-info">
            <strong>{seat.seat_ref_id}</strong>
            <span className="seat-coords">({seat.x}, {seat.y})</span>
            {seat.table_id && (
              <span className="seat-table">{seat.table_id}</span>
            )}
          </div>

          <p className="attribute-note">
            ℹ️ Tag this seat with attributes to help match leader preferences.
            These attributes are used for <strong>soft constraint</strong> matching.
          </p>

          <div className="attribute-list">
            <label className="attribute-item">
              <input
                type="checkbox"
                checked={attributes.near_window || false}
                onChange={() => handleToggle('near_window')}
              />
              <div className="attribute-label">
                <span className="attribute-icon">🪟</span>
                <div>
                  <div className="attribute-title">Near Window</div>
                  <div className="attribute-desc">Seat has natural light from window</div>
                </div>
              </div>
            </label>

            <label className="attribute-item">
              <input
                type="checkbox"
                checked={attributes.near_entry || false}
                onChange={() => handleToggle('near_entry')}
              />
              <div className="attribute-label">
                <span className="attribute-icon">🚪</span>
                <div>
                  <div className="attribute-title">Near Entry/Exit</div>
                  <div className="attribute-desc">Seat is close to doors</div>
                </div>
              </div>
            </label>

            <label className="attribute-item">
              <input
                type="checkbox"
                checked={attributes.corner_position || false}
                onChange={() => handleToggle('corner_position')}
              />
              <div className="attribute-label">
                <span className="attribute-icon">📐</span>
                <div>
                  <div className="attribute-title">Corner Position</div>
                  <div className="attribute-desc">Seat is in a corner or edge</div>
                </div>
              </div>
            </label>

            <label className="attribute-item">
              <input
                type="checkbox"
                checked={attributes.quiet_zone || false}
                onChange={() => handleToggle('quiet_zone')}
              />
              <div className="attribute-label">
                <span className="attribute-icon">🤫</span>
                <div>
                  <div className="attribute-title">Quiet Zone</div>
                  <div className="attribute-desc">Seat is in a quiet area</div>
                </div>
              </div>
            </label>

            <label className="attribute-item">
              <input
                type="checkbox"
                checked={attributes.accessible || false}
                onChange={() => handleToggle('accessible')}
              />
              <div className="attribute-label">
                <span className="attribute-icon">♿</span>
                <div>
                  <div className="attribute-title">Accessible</div>
                  <div className="attribute-desc">Wheelchair accessible seat</div>
                </div>
              </div>
            </label>

            <label className="attribute-item">
              <input
                type="checkbox"
                checked={attributes.premium || false}
                onChange={() => handleToggle('premium')}
              />
              <div className="attribute-label">
                <span className="attribute-icon">⭐</span>
                <div>
                  <div className="attribute-title">Premium Seat</div>
                  <div className="attribute-desc">High-quality or special seat</div>
                </div>
              </div>
            </label>
          </div>

          {attributeCount > 0 && (
            <div className="attribute-summary">
              ✓ {attributeCount} attribute{attributeCount !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClearAll}>
            Clear All
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Save Attributes
          </button>
        </div>
      </div>
    </div>
  );
};
