import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please provide your email address.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      await resetPassword(email);
      setMessage('A password reset link has been sent to your email address.');
    } catch (err) {
      setError(err.message || 'An error occurred while sending reset link.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', height: 48, paddingLeft: 42, paddingRight: 14,
    fontSize: 14, fontFamily: 'var(--font)',
    color: 'var(--text)', background: 'var(--surface)',
    border: '1.5px solid var(--border-2)', borderRadius: 10,
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f5f3ff 100%)',
      padding: 20, fontFamily: 'var(--font)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, #f8faff 0%, var(--surface) 100%)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Mail size={22} color="var(--accent)" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Recover Password</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Enter your email and we'll send you a reset link</p>
        </div>

        <div style={{ padding: '24px 32px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
          {message && <Alert type="success" message={message} onClose={() => setMessage('')} />}

          {loading ? (
            <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
              <LoadingSpinner size="medium" message="Sending reset link..." />
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="fpEmail" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input id="fpEmail" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    style={inputStyle} placeholder="name@example.com" required
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none'; }} />
                </div>
              </div>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 10, fontWeight: 700, fontSize: 14, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 2px 12px rgba(99,102,241,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
                <Send size={15} /> Send Reset Link
              </button>
              <button type="button" onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, fontWeight: 600, fontSize: 13, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
                <ArrowLeft size={14} /> Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
