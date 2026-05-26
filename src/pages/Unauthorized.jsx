import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleGoBack = () => {
    if (!profile) {
      navigate('/login');
      return;
    }
    // Redirect to correct dashboard based on role
    switch (profile.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'teacher':
        navigate('/teacher');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-6 py-12 select-none">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-xl shadow-2xl text-center flex flex-col items-center">
        {/* Animated Icon Circle */}
        <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-400 mb-6 relative animate-pulse">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-2 tracking-tight">
          Access Denied
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          You do not have permission to access this area of LMS. 
          {profile?.role && (
            <span className="block mt-1 font-semibold text-rose-400">
              Current Role: {profile.role.toUpperCase()}
            </span>
          )}
        </p>

        <button
          onClick={handleGoBack}
          className="flex items-center justify-center px-6 py-3 w-full text-sm font-semibold rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
