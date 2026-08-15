/**
 * CrateStack — the signature visual element.
 * Shows fridge fullness as a literal stack of 5 crate units.
 * filledCount: 0–5 integer
 */
import { useEffect, useRef } from 'react';

export function CrateStack({ filledCount = 0, capacity = 5, className = '' }) {
  const normalized = Math.round((filledCount / capacity) * 5);
  const clampedFilled = Math.max(0, Math.min(5, normalized));

  return (
    <div className={`crate-stack ${className}`} aria-label={`${clampedFilled} of 5 crates filled`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`crate-unit ${i < clampedFilled ? 'crate-unit--filled' : 'crate-unit--empty'}`}
        />
      ))}
    </div>
  );
}
