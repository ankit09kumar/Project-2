import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, MessageSquare, Wallet, User as UserIcon, LogOut, Menu, X, ShieldAlert, BarChart3, Briefcase, FileText } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-white font-outfit">
                Lumina<span className="text-indigo-400">Work</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
                <Link
                  to="/browse"
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/browse') ? 'text-indigo-400 bg-indigo-500/10' : 'hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Briefcase size={16} />
                  Browse Projects
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard') ? 'text-indigo-400 bg-indigo-500/10' : 'hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 size={16} />
                  Dashboard
                </Link>
                <Link
                  to="/contracts"
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/contracts') ? 'text-indigo-400 bg-indigo-500/10' : 'hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText size={16} />
                  Contracts
                </Link>
                {user.role === 'CLIENT' && (
                  <Link
                    to="/post-project"
                    className="ml-2 px-4 py-2 rounded-lg text-white font-medium text-xs tracking-wide uppercase transition-all bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 active:scale-95"
                  >
                    Post Project
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* User Right Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Wallet Balance Display */}
                <div
                  onClick={() => navigate('/payments')}
                  className="hidden sm:flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-sm hover:border-slate-700 transition-all"
                  title="Manage Wallet"
                >
                  <Wallet size={16} className="text-emerald-400" />
                  <span className="font-semibold text-emerald-400">${user.balance.toFixed(2)}</span>
                </div>

                {/* Chat Icon */}
                <Link
                  to="/chat"
                  className={`p-2 rounded-full border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white hover:border-slate-700 transition-colors ${
                    isActive('/chat') ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' : ''
                  }`}
                  title="Messages"
                >
                  <MessageSquare size={18} />
                </Link>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-2 rounded-full border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-[#0b0f19]">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-800 bg-[#0e1424] p-2 shadow-2xl backdrop-blur-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
                        <span className="font-semibold text-sm">Notifications</span>
                        <span className="text-xs text-indigo-400">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto mt-1 divide-y divide-slate-800/40">
                        {notifications.length === 0 ? (
                          <div className="px-3 py-6 text-center text-xs text-slate-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.type === 'DISPUTE') navigate('/admin');
                                else if (notif.type.includes('BID')) navigate('/browse');
                                else navigate('/contracts');
                                setShowNotifDropdown(false);
                              }}
                              className={`p-3 text-xs cursor-pointer hover:bg-white/5 transition-colors rounded-lg ${
                                !notif.read ? 'bg-indigo-500/5' : ''
                              }`}
                            >
                              <p className="text-slate-300">{notif.content}</p>
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {new Date(notif.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Settings Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 p-1 pr-3 hover:border-slate-700 transition-colors"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-7 w-7 rounded-full bg-slate-800 object-cover"
                    />
                    <span className="hidden sm:inline text-xs font-semibold text-slate-300">
                      {user.name}
                    </span>
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-800 bg-[#0e1424] p-1.5 shadow-2xl z-50">
                      <div className="px-3 py-2 border-b border-slate-800/60 mb-1">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                        <span className="inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] font-bold tracking-wider bg-indigo-500/20 text-indigo-400">
                          {user.role}
                        </span>
                      </div>

                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-amber-400 hover:bg-white/5 rounded-lg transition-colors font-medium"
                        >
                          <ShieldAlert size={14} />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        to="/payments"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Wallet size={14} />
                        Wallet & Payments
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  state={{ tab: 'register' }}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 md:hidden text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-800 bg-[#0b0f19] px-4 py-3 space-y-1">
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
          >
            Browse Projects
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
          >
            Dashboard
          </Link>
          <Link
            to="/contracts"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
          >
            Contracts
          </Link>
          {user.role === 'CLIENT' && (
            <Link
              to="/post-project"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-indigo-400 bg-indigo-500/10 font-medium text-sm"
            >
              Post Project
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
export default Navbar;
