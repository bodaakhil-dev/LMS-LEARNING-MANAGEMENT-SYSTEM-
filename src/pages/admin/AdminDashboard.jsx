import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Activity,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Clock,
  Laptop,
  Globe,
  Ban,
  ShieldCheck,
  UserCog,
  Power,
  BookOpen,
  FileText,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';

const AdminDashboard = ({ activeTab }) => {
  const { profile } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [activities, setActivities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // ── Coaching Centers & Cohorts Management ──────────────────────────────────
  const [centersList, setCentersList] = useState([]);
  const [cohortsList, setCohortsList] = useState([]);
  const [courseSubTab, setCourseSubTab] = useState('syllabus');

  // Form hooks
  const [newCenterName, setNewCenterName] = useState('');
  const [newCenterLocation, setNewCenterLocation] = useState('');
  const [newCenterEmail, setNewCenterEmail] = useState('');

  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortCourseId, setNewCohortCourseId] = useState('');
  const [newCohortCenterId, setNewCohortCenterId] = useState('');
  const [newCohortStartDate, setNewCohortStartDate] = useState('');
  const [newCohortEndDate, setNewCohortEndDate] = useState('');

  // ── Load Admin Data ────────────────────────────────────────────────────────
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      if (usersError) throw usersError;
      setUsersList(usersData || []);

      // 2. Fetch Activity Logs
      const { data: actData, error: actError } = await supabase
        .from('login_activity')
        .select('*')
        .order('login_time', { ascending: false });
      if (actError) throw actError;
      setActivities(actData || []);

      // 3. Fetch Courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*, teacher:users(*)');
      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // 4. Fetch Assignments
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*, course:courses(*)');
      if (assignError) throw assignError;
      setAssignments(assignData || []);

      // 5. Fetch Enrollments
      const { data: enrollData, error: enrollError } = await supabase
        .from('enrollments')
        .select('*, course:courses(*), student:users(*)');
      if (enrollError) throw enrollError;
      setEnrollments(enrollData || []);

      // 6. Fetch Quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*, course:courses(*)');
      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);

      // 7. Fetch Attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*, student:users(*), quiz:quizzes(*)');
      if (attemptsError) throw attemptsError;
      setQuizAttempts(attemptsData || []);

      // 8. Fetch Attendance
      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select('*, course:courses(*), student:users(*)');
      if (attError) throw attError;
      setAttendance(attData || []);

      // 9. Fetch Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, course:courses(*), student:users(*)');
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // 10. Fetch Coaching Centers / Training Organizations
      const { data: centersData, error: centersError } = await supabase
        .from('training_centers')
        .select('*');
      if (centersError) throw centersError;
      setCentersList(centersData || []);

      // 11. Fetch Cohort-Based Programs
      const { data: cohortsData, error: cohortsError } = await supabase
        .from('cohorts')
        .select('*, course:courses(*), center:training_centers(*)');
      if (cohortsError) throw cohortsError;
      setCohortsList(cohortsData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err.message);
      setAlert({ type: 'error', message: `Database load error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Update a user's role or status
  const handleUpdateUser = async (userId, fieldsToUpdate) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(fieldsToUpdate)
        .eq('id', userId);

      if (error) throw error;

      // Update state locally
      setUsersList((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, ...fieldsToUpdate } : user))
      );
      setAlert({ type: 'success', message: 'User profile successfully modified.' });
    } catch (err) {
      setAlert({ type: 'error', message: `Update failed: ${err.message}` });
    }
  };

  // Delete a user permanently
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account? This will remove all their enrollments, grades, and records from Supabase, and cannot be undone.")) {
      return;
    }
    try {
      // 1. Attempt delete via SQL RPC (elevated privileges to remove from auth.users)
      const { error: rpcError } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
      
      // If RPC fails (e.g. function doesn't exist yet, or mock mode), do a direct table delete fallback
      if (rpcError) {
        console.warn('RPC delete failed, falling back to direct table deletion:', rpcError.message);
        const { error: directError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);
        if (directError) throw directError;
      }

      // Update state locally
      setUsersList((prev) => prev.filter((user) => user.id !== userId));
      setAlert({ type: 'success', message: 'User account has been permanently deleted.' });
    } catch (err) {
      setAlert({ type: 'error', message: `Deletion failed: ${err.message}` });
    }
  };

  // Add Coaching Center
  const handleAddCenter = async (e) => {
    e.preventDefault();
    if (!newCenterName.trim()) return;
    try {
      const { error } = await supabase.from('training_centers').insert({
        name: newCenterName.trim(),
        location: newCenterLocation.trim() || 'Virtual',
        contact_email: newCenterEmail.trim() || null
      });
      if (error) throw error;
      setAlert({ type: 'success', message: `Coaching Center "${newCenterName}" successfully added!` });
      setNewCenterName(''); setNewCenterLocation(''); setNewCenterEmail('');
      // Reload centers
      const { data: updatedCenters } = await supabase.from('training_centers').select('*');
      setCentersList(updatedCenters || []);
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to add center: ${err.message}` });
    }
  };

  // Create Cohort Group
  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!newCohortName.trim() || !newCohortCourseId) return;
    try {
      const { error } = await supabase.from('cohorts').insert({
        name: newCohortName.trim(),
        course_id: newCohortCourseId,
        center_id: newCohortCenterId || null,
        start_date: newCohortStartDate || new Date().toISOString().split('T')[0],
        end_date: newCohortEndDate || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
        status: 'active'
      });
      if (error) throw error;
      setAlert({ type: 'success', message: `Cohort "${newCohortName}" successfully established!` });
      setNewCohortName(''); setNewCohortCourseId(''); setNewCohortCenterId('');
      setNewCohortStartDate(''); setNewCohortEndDate('');
      // Reload cohorts
      const { data: updatedCohorts } = await supabase.from('cohorts').select('*, course:courses(*), center:training_centers(*)');
      setCohortsList(updatedCohorts || []);
    } catch (err) {
      setAlert({ type: 'error', message: `Failed to create cohort: ${err.message}` });
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <LoadingSpinner size="medium" message="Retrieving system metrics..." />
      </div>
    );
  }

  // Derived Statistics
  const totalUsers = usersList.length;
  const activeSessions = activities.filter((act) => act.status === 'success' && !act.logout_time).length;
  const failedLogins = activities.filter((act) => act.status === 'failed').length;
  const studentCount = usersList.filter((u) => u.role === 'student').length;
  const teacherCount = usersList.filter((u) => u.role === 'teacher').length;
  const adminCount = usersList.filter((u) => u.role === 'admin').length;
  const suspendedCount = usersList.filter((u) => u.status === 'suspended').length;

  // ── Style Helpers ──────────────────────────────────────────────────────────
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' };
  const sectionTitle = { fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, margin: '0 0 14px' };
  const emptyBox = { padding: '36px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' };

  const pageTitle = {
    overview: 'System Console',
    users: 'User Account Management',
    analytics: 'Security & Access Logs',
    courses: 'Academic Database',
    revenue: 'Financial Operations',
    settings: 'System Configuration',
  }[activeTab] || 'Admin Console';

  const pageSubtitle = {
    overview: 'Real-time security configuration, monitoring, and user audits.',
    users: 'Manage roles, assign status toggles, and edit profiles.',
    analytics: 'Audit hardware keys, IP locations, and login events.',
    courses: 'View all assignments, database rosters, and active courses.',
    revenue: 'Review financial invoices, average sales, and billing details.',
    settings: 'Toggle system security locks and session durations.',
  }[activeTab] || '';

  const statCards = [
    { label: 'Total Users', value: totalUsers, icon: <Users size={20}/>, bg: '#eff6ff', color: '#2563eb' },
    { label: 'Active Sessions', value: activeSessions, icon: <Activity size={20} className="animate-pulse"/>, bg: '#ecfdf5', color: '#059669' },
    { label: 'Failed Logins', value: failedLogins, icon: <AlertTriangle size={20}/>, bg: '#fef2f2', color: '#dc2626' },
    { label: 'Suspended Users', value: suspendedCount, icon: <Ban size={20}/>, bg: '#fffbeb', color: '#d97706' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '28px 32px', fontFamily: 'var(--font)' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{pageTitle}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>{pageSubtitle}</p>
        </div>
        <button
          onClick={loadAdminData}
          className="btn btn-secondary btn-sm"
        >
          Refresh Feed
        </button>
      </div>

      {alert && (
        <div style={{ marginBottom: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* ══ OVERVIEW TAB ═════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Stat Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {statCards.map((c, i) => (
              <div key={i} style={card} className="stat-card">
                <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
                  {c.icon}
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 650, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', display: 'block', marginTop: 2 }}>{c.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* User Distribution section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            <div style={{ ...card, padding: 24 }}>
              <h4 style={{ margin: '0 0 18px', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>User Roles Distribution</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { name: 'Students', count: studentCount, pct: totalUsers ? (studentCount / totalUsers) * 100 : 0, color: '#3b82f6', bg: '#eff6ff' },
                  { name: 'Teachers', count: teacherCount, pct: totalUsers ? (teacherCount / totalUsers) * 100 : 0, color: '#10b981', bg: '#ecfdf5' },
                  { name: 'Admins', count: adminCount, pct: totalUsers ? (adminCount / totalUsers) * 100 : 0, color: '#8b5cf6', bg: '#f5f3ff' }
                ].map((role) => (
                  <div key={role.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-2)' }}>{role.name}</span>
                      <span style={{ color: 'var(--text)' }}>
                        {role.count} ({Math.round(role.pct)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', bg: 'var(--surface-3)', borderRadius: 99, height: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div
                        style={{ width: `${role.pct}%`, background: role.color, height: '100%', borderRadius: 99, transition: 'width 0.4s' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Platform Integrity Audit</h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  All authentication flows are logged with hardware keys, browser user-agents, and network IP coordinates. 
                  Suspensions invalidate session tokens immediately.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Instructors</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#10b981', display: 'block', marginTop: 2 }}>{teacherCount}</span>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Students</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#3b82f6', display: 'block', marginTop: 2 }}>{studentCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ USERS TAB ════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="animate-fade-in" style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Registered Accounts</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login Time</th>
                  <th>Security Status</th>
                  <th style={{ textAlign: 'right' }}>Modify Access</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`chip ${
                        user.role === 'admin' ? 'chip-green' :
                        user.role === 'teacher' ? 'chip-indigo' :
                        'chip-gray'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <span className={`chip ${
                        user.status === 'active' ? 'chip-green' : 'chip-red'
                      }`}>
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                          className="input"
                          disabled={user.id === profile.id}
                          style={{ width: 100, height: 28, fontSize: 11, padding: '0 4px', opacity: user.id === profile.id ? 0.6 : 1 }}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                        
                        {/* Suspend/Activate Button */}
                        <button
                          onClick={() => handleUpdateUser(user.id, { status: user.status === 'active' ? 'suspended' : 'active' })}
                          className={`btn ${user.status === 'active' ? 'btn-danger' : 'btn-primary'} btn-sm`}
                          disabled={user.id === profile.id}
                          style={{ height: 28, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: user.id === profile.id ? 0.5 : 1 }}
                          title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                        >
                          <Ban size={12} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-danger btn-sm"
                          disabled={user.id === profile.id}
                          style={{ height: 28, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dc2626', borderColor: '#dc2626', opacity: user.id === profile.id ? 0.5 : 1 }}
                          title="Delete User Permanently"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ SECURITY LOGS TAB ═══════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="animate-fade-in" style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Access & Security Logs</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-clean">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Login Calendar</th>
                  <th>Logout Calendar</th>
                  <th>Network IP</th>
                  <th>Client Hardware</th>
                  <th>Gate Result</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => {
                  const targetUser = usersList.find((u) => u.id === act.user_id);
                  return (
                    <tr key={act.activity_id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{targetUser ? targetUser.full_name : 'Unknown Profile'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>{act.user_id}</div>
                      </td>
                      <td style={{ fontSize: 11.5 }}>{new Date(act.login_time).toLocaleString()}</td>
                      <td style={{ fontSize: 11.5 }}>
                        {act.logout_time ? new Date(act.logout_time).toLocaleString() : (
                          act.status === 'success' ? (
                            <span style={{ color: 'var(--success)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span className="animate-pulse" style={{ width: 6, height: 6, background: 'var(--success)', borderRadius: '50%' }} /> Active Session
                            </span>
                          ) : '—'
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{act.ip_address || '127.0.0.1'}</td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{act.device_info || 'Chrome (Win64)'}</td>
                      <td>
                        <span className={`chip ${act.status === 'success' ? 'chip-green' : 'chip-red'}`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ ACADEMIC DATABASE TAB ════════════════════════════════════════════ */}
      {activeTab === 'courses' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Sub-tabs Navigation */}
          <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            {[
              { id: 'syllabus', label: 'Courses & Syllabus' },
              { id: 'centers', label: 'Coaching Centers & Orgs' },
              { id: 'cohorts', label: 'Cohort-Based Programs' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setCourseSubTab(tab.id)}
                className={`btn ${courseSubTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{ height: 32, padding: '0 14px', fontSize: 12.5, fontWeight: 650 }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── SUB-TAB: SYLLABUS ────────────────────────────────────────────── */}
          {courseSubTab === 'syllabus' && (
            <>
              {/* Courses Control */}
              <div style={{ ...card, overflow: 'hidden' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Active Academic Syllabus Rooms</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {courses.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>No course structures in the registry.</div>
                  ) : (
                    <table className="table-clean">
                      <thead>
                        <tr>
                          <th>Syllabus Code</th>
                          <th>Room Title</th>
                          <th>Assigned Instructor</th>
                          <th>Coaching Center</th>
                          <th>Enrollment Size</th>
                          <th>Pricing Fee</th>
                          <th>Training Duration</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => {
                          const count = enrollments.filter(e => e.course_id === course.id).length;
                          return (
                            <tr key={course.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{course.code}</td>
                              <td style={{ fontWeight: 600 }}>{course.title}</td>
                              <td>{course.teacher?.full_name || 'Unassigned'}</td>
                              <td>{course.center?.name || 'Online / Virtual'}</td>
                              <td>{count} Enrolled</td>
                              <td style={{ fontWeight: 650 }}>{course.fee > 0 ? `₹${course.fee}` : 'Free Course'}</td>
                              <td style={{ color: 'var(--text-2)' }}>{course.duration || '3 Months'}</td>
                              <td>
                                <span className={`chip ${course.status === 'active' ? 'chip-green' : 'chip-gray'}`}>
                                  {course.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Assignments Monitor */}
              <div style={{ ...card, overflow: 'hidden' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Global Course Assignments</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {assignments.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>No assignments exist in the curriculum logs.</div>
                  ) : (
                    <table className="table-clean">
                      <thead>
                        <tr>
                          <th>Room / Course</th>
                          <th>Assignment Title</th>
                          <th>Calendar Due</th>
                          <th>Marks Weightage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assign) => (
                          <tr key={assign.id}>
                            <td style={{ fontWeight: 700 }}>{assign.course?.title}</td>
                            <td>{assign.title}</td>
                            <td style={{ fontSize: 12 }}>{new Date(assign.deadline).toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{assign.max_marks} Pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── SUB-TAB: COACHING CENTERS ─────────────────────────────────────── */}
          {courseSubTab === 'centers' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }} className="animate-fade-in">
              {/* Left Column: Centers Directory */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={sectionTitle}>Coaching Centers & Branches ({centersList.length})</p>
                {centersList.length === 0 ? (
                  <div style={emptyBox}>No training centers registered.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {centersList.map(center => {
                      const centerCourses = courses.filter(c => c.center_id === center.id);
                      return (
                        <div key={center.id} style={{ ...card, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h5 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{center.name}</h5>
                            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-2)' }}>📍 Branch Location: <strong style={{ color: 'var(--text)' }}>{center.location}</strong></p>
                            {center.contact_email && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>✉️ Contact: {center.contact_email}</p>}
                          </div>
                          <span className="chip chip-indigo" style={{ flexShrink: 0 }}>
                            {centerCourses.length} Courses
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Add Coaching Center Form */}
              <div style={{ ...card, padding: 24, alignSelf: 'start' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  Register Training Center
                </h4>
                <form onSubmit={handleAddCenter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label" style={{ fontSize: 11.5 }}>Center / Organization Name</label>
                    <input type="text" value={newCenterName} onChange={e => setNewCenterName(e.target.value)}
                      placeholder="e.g. Mumbai Downtown Campus" required className="input" style={{ width: '100%', height: 38 }} />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 11.5 }}>Branch Location</label>
                    <input type="text" value={newCenterLocation} onChange={e => setNewCenterLocation(e.target.value)}
                      placeholder="e.g. Mumbai South (or Virtual)" className="input" style={{ width: '100%', height: 38 }} />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 11.5 }}>Contact Email</label>
                    <input type="email" value={newCenterEmail} onChange={e => setNewCenterEmail(e.target.value)}
                      placeholder="e.g. contact@mumbai-lms.com" className="input" style={{ width: '100%', height: 38 }} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 38, marginTop: 6, fontSize: 13, fontWeight: 700 }}>
                    Add Coaching Center
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── SUB-TAB: COHORTS ─────────────────────────────────────────────── */}
          {courseSubTab === 'cohorts' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }} className="animate-fade-in">
              {/* Left Column: Cohorts list */}
              <div style={{ ...card, overflow: 'hidden' }}>
                <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}>
                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>Active Cohort Programs ({cohortsList.length})</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {cohortsList.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>No cohort-based programs defined yet.</div>
                  ) : (
                    <table className="table-clean" style={{ fontSize: 12.5 }}>
                      <thead>
                        <tr>
                          <th>Cohort Name</th>
                          <th>Linked Course</th>
                          <th>Center / Campus</th>
                          <th>Schedule Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohortsList.map(cohort => {
                          const enrolledInCohort = enrollments.filter(e => e.cohort_id === cohort.id).length;
                          return (
                            <tr key={cohort.id}>
                              <td style={{ fontWeight: 700 }}>
                                {cohort.name}
                                <span style={{ display: 'block', fontSize: 10, color: 'var(--text-3)', fontWeight: 400, marginTop: 2 }}>{enrolledInCohort} Students Enrolled</span>
                              </td>
                              <td><span className="chip chip-gray">{cohort.course?.code}</span></td>
                              <td>{cohort.center?.name || 'Online Only'}</td>
                              <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right Column: Establish Cohort Form */}
              <div style={{ ...card, padding: 24, alignSelf: 'start' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  Establish New Cohort
                </h4>
                <form onSubmit={handleCreateCohort} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label" style={{ fontSize: 11.5 }}>Cohort Name</label>
                    <input type="text" value={newCohortName} onChange={e => setNewCohortName(e.target.value)}
                      placeholder="e.g. CS-301 Spring 2026 Cohort C" required className="input" style={{ width: '100%', height: 38 }} />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 11.5 }}>Associated Syllabus / Course</label>
                    <select value={newCohortCourseId} onChange={e => setNewCohortCourseId(e.target.value)} required
                      className="input" style={{ width: '100%', height: 38 }}>
                      <option value="">-- Select Course --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 11.5 }}>Coaching Center Branch</label>
                    <select value={newCohortCenterId} onChange={e => setNewCohortCenterId(e.target.value)}
                      className="input" style={{ width: '100%', height: 38 }}>
                      <option value="">-- Virtual / Online Only --</option>
                      {centersList.map(c => <option key={c.id} value={c.id}>{c.name} ({c.location})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label" style={{ fontSize: 11.5 }}>Start Date</label>
                      <input type="date" value={newCohortStartDate} onChange={e => setNewCohortStartDate(e.target.value)}
                        className="input" style={{ width: '100%', height: 38 }} />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: 11.5 }}>End Date</label>
                      <input type="date" value={newCohortEndDate} onChange={e => setNewCohortEndDate(e.target.value)}
                        className="input" style={{ width: '100%', height: 38 }} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 38, marginTop: 6, fontSize: 13, fontWeight: 700 }}>
                    Create Cohort Program
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ REVENUE TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'revenue' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Revenue metrics cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Cumulative Revenue', value: `₹${payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}`, icon: <TrendingUp size={20}/>, bg: '#ecfdf5', color: '#059669' },
              { label: 'Paid Transactions', value: `${payments.filter(p => p.status === 'completed').length} Sales`, icon: <ShieldCheck size={20}/>, bg: '#eff6ff', color: '#2563eb' },
              { label: 'Average Enrollment Ticket', value: `₹${Math.round(payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0) / (payments.filter(p => p.status === 'completed').length || 1)).toLocaleString()}`, icon: <Users size={20}/>, bg: '#f5f3ff', color: '#8b5cf6' },
            ].map((c, i) => (
              <div key={i} style={card} className="stat-card">
                <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
                  {c.icon}
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 650, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', display: 'block', marginTop: 2 }}>{c.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Transaction logs Table */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>System Billing Receipts Log</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {payments.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>No billing invoices exist in the transactions table.</div>
              ) : (
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Transaction Date</th>
                      <th>Billed Student</th>
                      <th>Acquired Course Room</th>
                      <th>Gateway Invoice ID</th>
                      <th>Total Amount</th>
                      <th>Billing Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.id}>
                        <td style={{ fontSize: 11.5, fontFamily: 'monospace' }}>{new Date(pay.paid_at || pay.created_at).toLocaleString()}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{pay.student?.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{pay.student?.email}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{pay.course?.title} <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 400 }}>({pay.course?.code})</span></td>
                        <td style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--text-2)' }}>{pay.gateway_order_id}</td>
                        <td style={{ fontWeight: 750 }}>₹{pay.amount}</td>
                        <td>
                          <span className="chip chip-green">
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIGURATION TAB ═════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...card, padding: 24, maxWidth: 640 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              Platform Security Controls
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div>
                  <h5 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Session Expiry Threshold</h5>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>Force logoff inactive users after 1 hour of silence</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div>
                  <h5 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Hard Lock on Failed Attempts</h5>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>Freeze accounts automatically after 5 sequential failures</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div>
                  <h5 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Emergency Lockout Mode</h5>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>Halt new student/teacher logins immediately</p>
                </div>
                <button 
                  className="btn btn-danger btn-sm"
                  style={{ gap: 6, fontWeight: 700 }}
                >
                  <Power size={13} /> Lock Console
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
