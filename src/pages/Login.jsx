import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupRole, setSignupRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all required fields.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isSignUp) {
        if (!fullName) { setError('Please enter your full name.'); setLoading(false); return; }
        await signUp(email, password, fullName, signupRole);
        setSuccess('Registration successful! Signing you in...');
        const res = await signIn(email, password);
        navigate(`/${res.profile.role}`);
      } else {
        const res = await signIn(email, password);
        navigate(`/${res.profile.role}`);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp); setError(''); setSuccess('');
    setEmail(''); setPassword(''); setFullName('');
  };

  const inputStyle = {
    width: '100%', height: 48, paddingLeft: 42, paddingRight: 14,
    fontSize: 14, fontFamily: 'var(--font)',
    color: 'var(--text)', background: 'var(--surface)',
    border: '1.5px solid var(--border-2)', borderRadius: 10,
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  const handleInputFocus = (e) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
  };
  const handleInputBlur = (e) => {
    e.target.style.borderColor = 'var(--border-2)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f5f3ff 100%)',
      padding: 20, fontFamily: 'var(--font)',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, #f8faff 0%, var(--surface) 100%)' }}>
          <img src="/logo.png" alt="LMS" style={{ display: 'block', margin: '0 auto 12px', width: 64, height: 64, objectFit: 'contain' }} />
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create Account' : 'Welcome back'}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
            {isSignUp ? 'Join our learning community today' : 'Sign in to your LMS account'}
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 32px 28px' }}>
          {error   && <div style={{ marginBottom: 16 }}><Alert type="error"   message={error}   onClose={() => setError('')} /></div>}
          {success && <div style={{ marginBottom: 16 }}><Alert type="success" message={success} /></div>}

          {loading ? (
            <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
              <LoadingSpinner size="medium" message={isSignUp ? 'Creating your account...' : 'Signing you in...'} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {isSignUp && (
                <div>
                  <label htmlFor="nameInput" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.02em' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                    <input id="nameInput" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      style={inputStyle} placeholder="John Doe" required={isSignUp}
                      onFocus={handleInputFocus} onBlur={handleInputBlur} />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="emailInput" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.02em' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input id="emailInput" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    style={inputStyle} placeholder="name@school.com" required
                    onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label htmlFor="passInput" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.02em' }}>Password</label>
                  {!isSignUp && (
                    <button type="button" onClick={() => navigate('/forgot-password')}
                      style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input id="passInput" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 42 }} placeholder="••••••••" required
                    onFocus={handleInputFocus} onBlur={handleInputBlur} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 4 }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="roleSelect" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.02em' }}>Account Type</label>
                  <select id="roleSelect" value={signupRole} onChange={e => setSignupRole(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 14, appearance: 'none', cursor: 'pointer' }}
                    onFocus={handleInputFocus} onBlur={handleInputBlur}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Instructor</option>
                    <option value="parent">Parent / Guardian</option>
                  </select>
                </div>
              )}

              <button type="submit" style={{
                marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 48, borderRadius: 10, fontWeight: 700, fontSize: 15,
                background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font)', transition: 'background 0.15s, transform 0.1s',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-h)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={toggleMode}
                style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)' }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
