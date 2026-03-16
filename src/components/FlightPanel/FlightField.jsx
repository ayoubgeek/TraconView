/**
 * @file FlightField.jsx
 * @description Single data row for the Flight Panel.
 */

import React, { memo } from 'react';

function FlightField({ label, value, unit = '' }) {
  const displayValue = (value === null || value === undefined) ? '—' : `${value}${unit}`;

  return (
    <div className="flight-field">
      <span className="flight-field-label">{label}</span>
      <span className="flight-field-value">{displayValue}</span>
    </div>
  );
}

export default memo(FlightField);
