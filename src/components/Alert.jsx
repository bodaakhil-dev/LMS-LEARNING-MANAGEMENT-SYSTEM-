import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => { onClose(); }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const config = {
    success: { bg: 'var(--success-bg)', border: '#6ee7b7', color: '#065f46', icon: <CheckCircle2 size={16} /> },
    error:   { bg: 'var(--danger-bg)',  border: '#fca5a5', color: '#991b1b', icon: <AlertCircle  size={16} /> },
    warning: { bg: 'var(--warning-bg)', border: '#fcd34d', color: '#92400e', icon: <AlertTriangle size={16} /> },
    info:    { bg: 'var(--info-bg)',    border: '#93c5fd', color: '#1e40af', icon: <Info           size={16} /> },
  };

  const c = config[type] || config.info;

  return (
    <div
      className="animate-slide-in"
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        padding: '12px 16px',
        background: c.bg,
        border: '1px solid ' + c.border,
        borderLeft: '4px solid ' + c.border,
        borderRadius: 10,
        fontFamily: 'var(--font)',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: c.color, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: c.color, lineHeight: 1.5 }}>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6,
            background: 'transparent', border: 'none',
            cursor: 'pointer', color: c.color, opacity: 0.7,
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Alert;
