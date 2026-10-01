import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, User as UserIcon, MessageSquare, LogOut, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';

export const Navbar = ({ isChatOpen, setIsChatOpen }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { name: 'Events', path: '/', icon: Compass },
    { name: 'My RSVPs', path: '/rsvps', icon: CheckSquare, protected: true },
    { name: 'Profile', path: '/profile', icon: UserIcon, protected: true }
  ];

  return (
    <header className="sticky top-0 z-40 bg-app-surface border-b border-app-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-input bg-app-primary flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-none">
              EP
            </div>
            <span className="font-semibold text-base tracking-tight text-app-text">
              EventPulse
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.protected && !isAuthenticated) return null;
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-input transition-colors ${
                    isActive
                      ? 'bg-app-primary-soft text-app-primary font-semibold'
                      : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Chat toggle + User profile / Auth */}
        <div className="flex items-center gap-3">
          {/* Chat Panel Toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-input border transition-colors ${
              isChatOpen
                ? 'bg-app-primary text-white border-app-primary'
                : 'bg-app-surface border-app-border text-app-text hover:bg-app-surface-muted'
            }`}
            title="Toggle Assistant Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Assistant</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-app-border">
              <Link
                to="/profile"
                className="flex items-center gap-2 py-1 px-2 rounded-input hover:bg-app-surface-muted transition-colors text-left"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-app-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-app-primary-soft text-app-primary font-medium text-xs flex items-center justify-center border border-app-primary/20">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-app-text leading-tight truncate max-w-[120px]">
                    {user?.name}
                  </div>
                  <div className="text-[11px] text-app-text-muted leading-tight truncate max-w-[120px]">
                    {user?.city || 'Mumbai'}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                className="p-1.5 text-app-text-muted hover:text-app-danger rounded-input hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
