import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, MailOpen, AlertCircle, Sparkles, BookOpen, CreditCard } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up polling interval to fetch notifications (fallback for realtime)
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [profile]);

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err.message);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to update notification:', err.message);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notifId);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'assignment': return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'quiz': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850 hover:border-slate-750 transition-all focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-slate-950 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in text-slate-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications Feed</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center text-[10px] text-indigo-400 hover:text-indigo-350 font-bold transition-colors"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y divide-slate-850/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No notifications logged.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-4 flex items-start space-x-3 transition-colors cursor-pointer ${
                    notif.is_read ? 'hover:bg-slate-850/20' : 'bg-indigo-500/[0.02] hover:bg-indigo-500/[0.04]'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-850 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-xs truncate ${notif.is_read ? 'text-slate-355 font-medium' : 'text-slate-100 font-bold'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal break-words">
                      {notif.message}
                    </p>
                    <p className="text-[8px] text-slate-550 mt-1.5">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all self-center"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
