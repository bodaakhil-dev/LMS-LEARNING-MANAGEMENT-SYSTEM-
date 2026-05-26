import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

import NotificationBell from './components/NotificationBell';

// Unified Layout wrapper for authenticated dashboards
const DashboardLayout = ({ children, activeTab, setActiveTab }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg)', overflow: 'hidden', fontFamily: 'var(--font)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{
          height: 56,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: 12,
          flexShrink: 0, zIndex: 40,
        }}>
          <NotificationBell />
        </header>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Route wrapper for Admin Dashboard
const AdminRoute = () => {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <AdminDashboard activeTab={activeTab} />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

// Route wrapper for Teacher Dashboard
const TeacherRoute = () => {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <TeacherDashboard activeTab={activeTab} />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

// Route wrapper for Student Dashboard
const StudentRoute = () => {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <StudentDashboard activeTab={activeTab} />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

// Route wrapper for Parent Dashboard
const ParentRoute = () => {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <ParentDashboard activeTab={activeTab} />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Role-Based Dashboards */}
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/teacher" element={<TeacherRoute />} />
          <Route path="/student" element={<StudentRoute />} />
          <Route path="/parent" element={<ParentRoute />} />

          {/* Root Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/unauthorized" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
