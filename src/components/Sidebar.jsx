import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Calendar,
  LogOut,
  Trophy,
  User,
  CreditCard,
  ChevronRight,
  Sun,
  Moon,
  MessageSquare,
  Award
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { profile, signOut } = useAuth();

  // ── Theme State & Logic ───────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  if (!profile) return null;

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error(err.message); }
  };

  const getNavLinks = () => {
    switch (profile.role) {
      case 'admin':
        return [
          { id: 'overview',   label: 'Dashboard',       icon: <LayoutDashboard size={18} /> },
          { id: 'users',      label: 'User Management',  icon: <Users size={18} /> },
          { id: 'courses',    label: 'Courses',          icon: <BookOpen size={18} /> },
          { id: 'revenue',    label: 'Finance',          icon: <CreditCard size={18} /> },
          { id: 'analytics',  label: 'Analytics',        icon: <ShieldCheck size={18} /> },
          { id: 'settings',   label: 'Settings',         icon: <Settings size={18} /> },
        ];
      case 'teacher':
        return [
          { id: 'home',       label: 'Dashboard',        icon: <LayoutDashboard size={18} /> },
          { id: 'courses',    label: 'My Courses',        icon: <BookOpen size={18} /> },
          { id: 'students',   label: 'Students',          icon: <GraduationCap size={18} /> },
          { id: 'quizzes',    label: 'Quizzes',           icon: <Trophy size={18} /> },
          { id: 'attendance', label: 'Attendance',        icon: <Calendar size={18} /> },
          { id: 'grades',     label: 'Gradebook',         icon: <TrendingUp size={18} /> },
          { id: 'community',  label: 'Discussion Forums', icon: <Users size={18} /> },
          { id: 'chat',       label: 'Student Chat',      icon: <MessageSquare size={18} /> },
        ];
      case 'student':
        return [
          { id: 'home',         label: 'Dashboard',         icon: <LayoutDashboard size={18} /> },
          { id: 'my-courses',   label: 'My Courses',         icon: <BookOpen size={18} /> },
          { id: 'grades',       label: 'My Grades',          icon: <TrendingUp size={18} /> },
          { id: 'quizzes',      label: 'Quizzes',            icon: <Trophy size={18} /> },
          { id: 'attendance',   label: 'Attendance',         icon: <Calendar size={18} /> },
          { id: 'payments',     label: 'Payments',           icon: <CreditCard size={18} /> },
          { id: 'certificates', label: 'Certificates',       icon: <Award size={18} /> },
          { id: 'community',    label: 'Community',          icon: <Users size={18} /> },
          { id: 'achievements', label: 'Achievements',       icon: <Trophy size={18} /> },
          { id: 'chat',         label: 'Student Chat',        icon: <MessageSquare size={18} /> },
        ];
      case 'parent':
        return [
          { id: 'overview',     label: 'Overview',          icon: <LayoutDashboard size={18} /> },
          { id: 'grades',       label: 'Child Grades',       icon: <TrendingUp size={18} /> },
          { id: 'attendance',   label: 'Child Attendance',   icon: <Calendar size={18} /> },
          { id: 'payments',     label: 'Child Payments',     icon: <CreditCard size={18} /> },
          { id: 'progress',     label: 'Child Progress',     icon: <Trophy size={18} /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const roleConfig = {
    admin:   { label: 'Administrator', color: 'chip-indigo' },
    teacher: { label: 'Instructor',    color: 'chip-green'  },
    student: { label: 'Student',       color: 'chip-amber'  },
    parent:  { label: 'Parent/Guardian', color: 'chip-purple' },
  };

  const rc = roleConfig[profile.role] || roleConfig.student;
  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '240px',
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      fontFamily: 'var(--font)',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/logo.png" alt="LMS" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>LMS</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Learning Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }} className="custom-scrollbar">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {link.icon}
              </span>
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Theme Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        
        {/* Theme Mode Toggle Option */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="btn btn-ghost"
          style={{ 
            width: '100%', 
            justifyContent: 'flex-start', 
            gap: 10, 
            fontSize: 13, 
            height: 38,
            color: 'var(--text-2)',
            padding: '0 12px'
          }}
        >
          {isDark ? (
            <>
              <Sun size={18} color="#eab308" style={{ flexShrink: 0 }} />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 10, background: 'var(--surface-2)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent-bg)', color: 'var(--accent-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.full_name}
            </div>
            <div style={{ marginTop: 2 }}>
              <span className={`chip ${rc.color}`}>{rc.label}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', color: 'var(--danger)', justifyContent: 'center' }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
