import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
  Trophy,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  Award
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';

const ParentDashboard = ({ activeTab }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Data state
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [users, setUsers] = useState([]);

  // ── Load Parent Data ──────────────────────────────────────────────────────
  const loadParentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch parent-student links
      const { data: linksData, error: linksError } = await supabase
        .from('parent_student_links')
        .select('*');
      if (linksError) throw linksError;

      // Filter links for current parent
      const myLinks = (linksData || []).filter(l => l.parent_id === profile.id);

      // 2. Fetch all users (to resolve student names)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Resolve linked students
      const studentIds = myLinks.map(l => l.student_id);
      const students = (usersData || []).filter(u => studentIds.includes(u.id));
      setLinkedStudents(students.map(s => ({
        ...s,
        relationship: myLinks.find(l => l.student_id === s.id)?.relationship || 'Guardian'
      })));

      // 3. Fetch Courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*, teacher:users(*)');
      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // 4. Fetch Enrollments
      const { data: enrollData, error: enrollError } = await supabase
        .from('enrollments')
        .select('*, course:courses(*), student:users(*)');
      if (enrollError) throw enrollError;
      // Filter to only linked students
      setEnrollments((enrollData || []).filter(e => studentIds.includes(e.student_id)));

      // 5. Fetch Grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*, submission:submissions(*)');
      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      // 6. Fetch Attendance
      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select('*, course:courses(*), student:users!student_id(*)');
      if (attError) throw attError;
      setAttendance((attData || []).filter(a => studentIds.includes(a.student_id)));

      // 7. Fetch Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, course:courses(*), student:users(*)');
      if (paymentsError) throw paymentsError;
      setPayments((paymentsData || []).filter(p => studentIds.includes(p.student_id)));

      // 8. Fetch Quiz Attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*, student:users(*), quiz:quizzes(*)');
      if (attemptsError) throw attemptsError;
      setQuizAttempts((attemptsData || []).filter(a => studentIds.includes(a.student_id)));

      // 9. Fetch Assignments
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*, course:courses(*)');
      if (assignError) throw assignError;
      setAssignments(assignData || []);

      // 10. Fetch Submissions
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('*, student:users(*), assignment:assignments(*)');
      if (subError) throw subError;
      setSubmissions((subData || []).filter(s => studentIds.includes(s.student_id)));

      // 11. Fetch Certificates
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .select('*');
      if (certError) throw certError;
      setCertificates((certData || []).filter(c => studentIds.includes(c.student_id)));

    } catch (err) {
      console.error('Failed to load parent data:', err.message);
      setAlert({ type: 'error', message: `Failed to load data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParentData();
  }, []);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <LoadingSpinner size="medium" message="Loading your child's information..." />
      </div>
    );
  }

  // ── Derived Statistics ─────────────────────────────────────────────────────
  const totalCourses = enrollments.length;
  const totalPresent = attendance.filter(a => a.status === 'present').length;
  const totalAbsent = attendance.filter(a => a.status === 'absent').length;
  const attendanceRate = attendance.length > 0
    ? Math.round((totalPresent / attendance.length) * 100)
    : 0;
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const completedPayments = payments.filter(p => p.status === 'completed');

  // ── Style Helpers ──────────────────────────────────────────────────────────
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' };
  const emptyBox = { padding: '36px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' };

  const pageTitle = {
    overview: 'Parent Dashboard',
    grades: 'Child Academic Grades',
    attendance: 'Child Attendance Records',
    payments: 'Payment & Fee History',
    progress: 'Child Progress Tracker',
  }[activeTab] || 'Parent Dashboard';

  const pageSubtitle = {
    overview: 'Monitor your child\'s academic journey, attendance, and activities.',
    grades: 'View grades, quiz scores, and assignment results for your child.',
    attendance: 'Track daily attendance records across all enrolled courses.',
    payments: 'Review tuition fees, payment history, and pending invoices.',
    progress: 'Track overall academic progress, achievements, and milestones.',
  }[activeTab] || '';

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
          onClick={loadParentData}
          className="btn btn-secondary btn-sm"
        >
          Refresh Data
        </button>
      </div>

      {alert && (
        <div style={{ marginBottom: 16 }}>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* No linked students warning */}
      {linkedStudents.length === 0 && (
        <div style={{ ...card, padding: 32, textAlign: 'center' }} className="animate-fade-in">
          <AlertCircle size={40} style={{ color: 'var(--warning)', marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>No Linked Students</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', maxWidth: 400, marginInline: 'auto' }}>
            Your account is not linked to any student profiles yet. Please contact the administrator to connect your child's account.
          </p>
        </div>
      )}

      {/* ══ OVERVIEW TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && linkedStudents.length > 0 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Enrolled Courses', value: totalCourses, icon: <BookOpen size={20} />, bg: '#eff6ff', color: '#2563eb' },
              { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: <Calendar size={20} />, bg: '#ecfdf5', color: '#059669' },
              { label: 'Total Fees Paid', value: `₹${totalPaid.toLocaleString()}`, icon: <CreditCard size={20} />, bg: '#f5f3ff', color: '#8b5cf6' },
              { label: 'Certificates', value: certificates.length, icon: <Award size={20} />, bg: '#fffbeb', color: '#d97706' },
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

          {/* Linked Children Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: linkedStudents.length > 1 ? '1fr 1fr' : '1fr', gap: 20 }}>
            {linkedStudents.map(student => {
              const studentEnrollments = enrollments.filter(e => e.student_id === student.id);
              const studentAttendance = attendance.filter(a => a.student_id === student.id);
              const studentPresent = studentAttendance.filter(a => a.status === 'present').length;
              const studentRate = studentAttendance.length > 0 ? Math.round((studentPresent / studentAttendance.length) * 100) : 0;
              const initials = student.full_name ? student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'S';

              return (
                <div key={student.id} style={{ ...card, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 18, flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{student.full_name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span className="chip chip-amber">{student.relationship}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{student.email}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Courses</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', display: 'block', marginTop: 2 }}>{studentEnrollments.length}</span>
                    </div>
                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Attendance</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: studentRate >= 75 ? '#059669' : '#dc2626', display: 'block', marginTop: 2 }}>{studentRate}%</span>
                    </div>
                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Status</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: student.status === 'active' ? '#059669' : '#dc2626', display: 'block', marginTop: 6 }}>
                        {student.status === 'active' ? '● Active' : '● Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enrolled Courses */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Enrolled Courses</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {enrollments.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>No course enrollments found.</div>
              ) : (
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Enrolled On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(enr => {
                      const student = linkedStudents.find(s => s.id === enr.student_id);
                      return (
                        <tr key={enr.id}>
                          <td style={{ fontWeight: 600 }}>{student?.full_name || 'Student'}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{enr.course?.code}</td>
                          <td>{enr.course?.title}</td>
                          <td style={{ fontSize: 12 }}>{new Date(enr.enrolled_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`chip ${enr.status === 'active' ? 'chip-green' : 'chip-gray'}`}>
                              {enr.status}
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

          {/* Recent Attendance Summary */}
          {attendance.length > 0 && (
            <div style={{ ...card, padding: 24 }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Attendance Overview</h4>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-2)' }}>Present</span>
                    <span style={{ color: 'var(--text)' }}>{totalPresent} days ({attendanceRate}%)</span>
                  </div>
                  <div style={{ width: '100%', borderRadius: 99, height: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{ width: `${attendanceRate}%`, background: '#10b981', height: '100%', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-2)' }}>Absent</span>
                    <span style={{ color: 'var(--text)' }}>{totalAbsent} days ({attendance.length > 0 ? 100 - attendanceRate : 0}%)</span>
                  </div>
                  <div style={{ width: '100%', borderRadius: 99, height: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{ width: `${attendance.length > 0 ? 100 - attendanceRate : 0}%`, background: '#ef4444', height: '100%', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ GRADES TAB ═════════════════════════════════════════════════════════ */}
      {activeTab === 'grades' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Quiz Attempts */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Quiz Scores</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {quizAttempts.length === 0 ? (
                <div style={emptyBox}>No quiz attempts recorded yet.</div>
              ) : (
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Quiz Title</th>
                      <th>Score</th>
                      <th>Max Marks</th>
                      <th>Percentage</th>
                      <th>Attempted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizAttempts.map(attempt => {
                      const student = linkedStudents.find(s => s.id === attempt.student_id);
                      const pct = attempt.quiz?.max_marks ? Math.round((attempt.score / attempt.quiz.max_marks) * 100) : 0;
                      return (
                        <tr key={attempt.id}>
                          <td style={{ fontWeight: 600 }}>{student?.full_name || 'Student'}</td>
                          <td>{attempt.quiz?.title || 'Quiz'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{attempt.score}</td>
                          <td>{attempt.quiz?.max_marks || '—'}</td>
                          <td>
                            <span className={`chip ${pct >= 80 ? 'chip-green' : pct >= 50 ? 'chip-amber' : 'chip-red'}`}>
                              {pct}%
                            </span>
                          </td>
                          <td style={{ fontSize: 12 }}>{new Date(attempt.submitted_at || attempt.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Assignment Submissions */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Assignment Submissions</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {submissions.length === 0 ? (
                <div style={emptyBox}>No assignment submissions recorded yet.</div>
              ) : (
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Assignment</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => {
                      const student = linkedStudents.find(s => s.id === sub.student_id);
                      return (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 600 }}>{student?.full_name || 'Student'}</td>
                          <td>{sub.assignment?.title || 'Assignment'}</td>
                          <td style={{ fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleString()}</td>
                          <td>
                            <span className={`chip ${sub.status === 'graded' ? 'chip-green' : sub.status === 'submitted' ? 'chip-indigo' : 'chip-gray'}`}>
                              {sub.status}
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

          {/* Certificates */}
          {certificates.length > 0 && (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Certificates Earned</h4>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Certificate #</th>
                      <th>Course</th>
                      <th>Grade</th>
                      <th>Issued On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map(cert => {
                      const student = linkedStudents.find(s => s.id === cert.student_id);
                      const course = courses.find(c => c.id === cert.course_id);
                      return (
                        <tr key={cert.id}>
                          <td style={{ fontWeight: 600 }}>{student?.full_name || 'Student'}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{cert.certificate_number}</td>
                          <td>{course?.title || 'Course'}</td>
                          <td>
                            <span className="chip chip-green" style={{ fontWeight: 700 }}>{cert.grade}</span>
                          </td>
                          <td style={{ fontSize: 12 }}>{new Date(cert.issued_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ATTENDANCE TAB ═════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Attendance Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Present Days', value: totalPresent, icon: <CheckCircle size={20} />, bg: '#ecfdf5', color: '#059669' },
              { label: 'Absent Days', value: totalAbsent, icon: <XCircle size={20} />, bg: '#fef2f2', color: '#dc2626' },
              { label: 'Overall Rate', value: `${attendanceRate}%`, icon: <TrendingUp size={20} />, bg: '#eff6ff', color: '#2563eb' },
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

          {/* Per-Course Attendance Breakdown */}
          {linkedStudents.length > 0 && (
            <div style={{ ...card, padding: 24 }}>
              <h4 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Attendance by Course</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(() => {
                  const courseIds = [...new Set(attendance.map(a => a.course_id))];
                  return courseIds.map(courseId => {
                    const course = courses.find(c => c.id === courseId);
                    const courseAtt = attendance.filter(a => a.course_id === courseId);
                    const coursePresent = courseAtt.filter(a => a.status === 'present').length;
                    const coursePct = courseAtt.length > 0 ? Math.round((coursePresent / courseAtt.length) * 100) : 0;
                    return (
                      <div key={courseId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                          <span style={{ color: 'var(--text-2)' }}>{course?.title || 'Course'}</span>
                          <span style={{ color: 'var(--text)' }}>
                            {coursePresent}/{courseAtt.length} ({coursePct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', borderRadius: 99, height: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${coursePct}%`,
                              background: coursePct >= 75 ? '#10b981' : coursePct >= 50 ? '#f59e0b' : '#ef4444',
                              height: '100%',
                              borderRadius: 99,
                              transition: 'width 0.4s'
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Detailed Attendance Log */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Detailed Attendance Log</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {attendance.length === 0 ? (
                <div style={emptyBox}>No attendance records found.</div>
              ) : (
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...attendance].sort((a, b) => new Date(b.date) - new Date(a.date)).map(att => {
                      const student = linkedStudents.find(s => s.id === att.student_id);
                      return (
                        <tr key={att.id}>
                          <td style={{ fontWeight: 600 }}>{student?.full_name || 'Student'}</td>
                          <td>{att.course?.title || 'Course'}</td>
                          <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{att.date}</td>
                          <td>
                            <span className={`chip ${att.status === 'present' ? 'chip-green' : att.status === 'absent' ? 'chip-red' : 'chip-amber'}`}>
                              {att.status === 'present' ? '✓ Present' : att.status === 'absent' ? '✗ Absent' : att.status}
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
        </div>
      )}

      {/* ══ PAYMENTS TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Payment Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}`, icon: <CreditCard size={20} />, bg: '#ecfdf5', color: '#059669' },
              { label: 'Completed Payments', value: `${completedPayments.length}`, icon: <CheckCircle size={20} />, bg: '#eff6ff', color: '#2563eb' },
              { label: 'Pending Payments', value: `${pendingPayments.length}`, icon: <Clock size={20} />, bg: '#fffbeb', color: '#d97706' },
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

          {/* Transaction History */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Transaction History</h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {payments.length === 0 ? (
                <div style={emptyBox}>No payment records found.</div>
              ) : (
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(pay => {
                      const student = linkedStudents.find(s => s.id === pay.student_id);
                      return (
                        <tr key={pay.id}>
                          <td style={{ fontWeight: 600 }}>{student?.full_name || 'Student'}</td>
                          <td>{pay.course?.title || 'Course'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{Number(pay.amount).toLocaleString()}</td>
                          <td>
                            <span className="chip chip-gray">{pay.payment_method || 'N/A'}</span>
                          </td>
                          <td style={{ fontSize: 12 }}>{new Date(pay.paid_at || pay.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`chip ${pay.status === 'completed' ? 'chip-green' : pay.status === 'pending' ? 'chip-amber' : 'chip-red'}`}>
                              {pay.status}
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
        </div>
      )}

      {/* ══ PROGRESS TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'progress' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Per-Student Progress */}
          {linkedStudents.map(student => {
            const studentEnrollments = enrollments.filter(e => e.student_id === student.id);
            const studentSubmissions = submissions.filter(s => s.student_id === student.id);
            const studentQuizAttempts = quizAttempts.filter(a => a.student_id === student.id);
            const studentCerts = certificates.filter(c => c.student_id === student.id);
            const studentAttendance = attendance.filter(a => a.student_id === student.id);
            const studentPresent = studentAttendance.filter(a => a.status === 'present').length;
            const studentRate = studentAttendance.length > 0 ? Math.round((studentPresent / studentAttendance.length) * 100) : 0;
            const initials = student.full_name ? student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'S';

            // Courses enrolled by this student
            const enrolledCourseIds = studentEnrollments.map(e => e.course_id);
            const studentCourses = courses.filter(c => enrolledCourseIds.includes(c.id));

            // Find assignments for enrolled courses
            const courseAssignments = assignments.filter(a => enrolledCourseIds.includes(a.course_id));
            const submittedCount = studentSubmissions.length;
            const totalAssignments = courseAssignments.length;
            const assignmentCompletion = totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0;

            return (
              <div key={student.id} style={{ ...card, padding: 24 }}>
                {/* Student header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{student.full_name}</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{student.relationship} — {student.email}</span>
                  </div>
                </div>

                {/* Progress metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
                    <BookOpen size={18} style={{ color: '#2563eb', marginBottom: 6 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', display: 'block' }}>Courses</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', display: 'block', marginTop: 2 }}>{studentEnrollments.length}</span>
                  </div>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
                    <Trophy size={18} style={{ color: '#d97706', marginBottom: 6 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', display: 'block' }}>Quizzes Taken</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', display: 'block', marginTop: 2 }}>{studentQuizAttempts.length}</span>
                  </div>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
                    <GraduationCap size={18} style={{ color: '#8b5cf6', marginBottom: 6 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', display: 'block' }}>Certificates</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', display: 'block', marginTop: 2 }}>{studentCerts.length}</span>
                  </div>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
                    <Calendar size={18} style={{ color: '#059669', marginBottom: 6 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)', display: 'block' }}>Attendance</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: studentRate >= 75 ? '#059669' : '#dc2626', display: 'block', marginTop: 2 }}>{studentRate}%</span>
                  </div>
                </div>

                {/* Progress bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-2)' }}>Assignment Completion</span>
                      <span style={{ color: 'var(--text)' }}>{submittedCount}/{totalAssignments} ({assignmentCompletion}%)</span>
                    </div>
                    <div style={{ width: '100%', borderRadius: 99, height: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ width: `${assignmentCompletion}%`, background: '#6366f1', height: '100%', borderRadius: 99, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-2)' }}>Attendance Rate</span>
                      <span style={{ color: 'var(--text)' }}>{studentPresent}/{studentAttendance.length} ({studentRate}%)</span>
                    </div>
                    <div style={{ width: '100%', borderRadius: 99, height: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ width: `${studentRate}%`, background: studentRate >= 75 ? '#10b981' : '#ef4444', height: '100%', borderRadius: 99, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                </div>

                {/* Course-level progress */}
                {studentCourses.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h5 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Course Progress
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {studentCourses.map(course => {
                        const courseAssign = assignments.filter(a => a.course_id === course.id);
                        const courseSubs = studentSubmissions.filter(s => courseAssign.some(a => a.id === s.assignment_id));
                        const courseCompletion = courseAssign.length > 0 ? Math.round((courseSubs.length / courseAssign.length) * 100) : 100;
                        const hasCert = studentCerts.some(c => c.course_id === course.id);

                        return (
                          <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{course.title}</span>
                                {hasCert && <span className="chip chip-green" style={{ fontSize: 9 }}>Certified</span>}
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{course.code} · {course.duration || '3 Months'}</span>
                            </div>
                            <div style={{ width: 100, textAlign: 'right' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: courseCompletion === 100 ? '#059669' : 'var(--accent)' }}>
                                {courseCompletion}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {linkedStudents.length === 0 && (
            <div style={emptyBox}>No student data available to track progress.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
