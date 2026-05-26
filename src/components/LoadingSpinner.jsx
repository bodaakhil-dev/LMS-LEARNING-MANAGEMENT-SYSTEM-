import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'primary', message = '' }) => {
  const sizes = { small: 24, medium: 40, large: 56 };
  const border = { small: 2, medium: 3, large: 4 };
  const px = sizes[size] || sizes.medium;
  const bx = border[size] || border.medium;

  const colors = {
    primary: { track: '#e2e8f0', spin: '#6366f1' },
    white:   { track: 'rgba(255,255,255,0.3)', spin: '#fff' },
    accent:  { track: '#d1fae5', spin: '#10b981' },
  };
  const c = colors[color] || colors.primary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, fontFamily: 'var(--font)' }}>
      <div style={{ position: 'relative', width: px, height: px }}>
        <svg viewBox={`0 0 ${px} ${px}`} style={{ position: 'absolute', top: 0, left: 0, width: px, height: px, transform: 'rotate(-90deg)' }}>
          <circle
            cx={px / 2} cy={px / 2} r={(px - bx * 2) / 2}
            fill="none" stroke={c.track} strokeWidth={bx}
          />
          <circle
            cx={px / 2} cy={px / 2} r={(px - bx * 2) / 2}
            fill="none" stroke={c.spin} strokeWidth={bx}
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * (px - bx * 2) * 0.65} ${Math.PI * (px - bx * 2)}`}
            style={{ animation: 'spin 0.8s linear infinite' }}
          />
        </svg>
      </div>
      {message && (
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>
          {message}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(270deg); } }`}</style>
    </div>
  );
};

export default LoadingSpinner;
