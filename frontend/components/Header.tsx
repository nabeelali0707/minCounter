'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, getToken, removeToken, UserResponse } from '@/lib/api';

interface BreadcrumbItem {
  label: string;
  active?: boolean;
  isStatus?: boolean;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ breadcrumbs, searchPlaceholder, searchValue, onSearchChange }: HeaderProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      auth.me()
        .then((profile) => setUser(profile))
        .catch(() => setUser(null));
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setShowUserMenu(false);
    router.push('/login');
  };

  const userInitials = user
    ? user.username.slice(0, 2).toUpperCase()
    : null;

  const getBreadcrumbs = () => {
    if (breadcrumbs && breadcrumbs.length > 0) {
      return (
        <div className="flex items-center gap-2">
          {breadcrumbs.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && <span className="text-white/20">/</span>}
              <span
                className={`${
                  item.active ? 'text-secondary' : 'text-on-surface-variant'
                } font-inter font-medium uppercase tracking-widest text-xs`}
              >
                {item.label}
              </span>
            </span>
          ))}
        </div>
      );
    }

    if (pathname.startsWith('/problems/')) {
      const problemId = pathname.split('/').pop()?.toUpperCase() || 'PROBLEM';
      return (
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-inter font-medium uppercase tracking-widest text-xs">Workspace</span>
          <span className="text-white/20">/</span>
          <span className="text-secondary font-inter font-medium uppercase tracking-widest text-xs">{problemId}</span>
        </div>
      );
    }
    if (pathname === '/leaderboard') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-inter font-medium uppercase tracking-widest text-xs">Global Standings</span>
          <span className="text-white/20">/</span>
          <span className="text-secondary font-inter font-medium uppercase tracking-widest text-xs">Hall of Fame</span>
        </div>
      );
    }
    return (
      <div className="hidden md:flex flex-col">
        <span className="text-on-surface-variant font-inter font-medium uppercase tracking-widest" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Network Status</span>
        <span className="text-secondary flex items-center gap-1 text-xs font-inter">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          Computational Nodes Online
        </span>
      </div>
    );
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-12rem)] h-16 bg-background/80 backdrop-blur-sm border-b border-white/10 flex justify-between items-center px-6 z-40">
      {/* Mobile Title Logo */}
      <div className="md:hidden flex items-center gap-2">
        <span className="font-outfit font-bold text-on-surface text-xl">minCounter</span>
      </div>

      {/* Breadcrumbs / Status */}
      <div className="hidden md:block">
        {getBreadcrumbs()}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            className="bg-black/20 border border-white/10 rounded-sm pl-10 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none w-64 transition-all focus:w-80 font-inter"
            style={{ color: '#dfe2f1' }}
            placeholder={searchPlaceholder ?? 'Search theorems...'}
            type="text"
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-secondary transition-all relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-tertiary-container rounded-full"></span>
          </button>
          <button className="text-on-surface-variant hover:text-secondary transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>

          {/* User Profile Avatar — dynamic */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 transition-all hover:border-secondary/50 font-bold text-xs"
              style={{
                background: user ? 'rgba(78,222,163,0.15)' : 'rgba(255,255,255,0.08)',
                color: user ? '#4edea3' : '#c2c6d6',
              }}
              title={user ? user.username : 'Sign In'}
            >
              {userInitials ?? (
                <span className="material-symbols-outlined text-sm">person</span>
              )}
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div
                className="absolute right-0 top-10 w-48 rounded-sm py-2 z-50 shadow-lg"
                style={{
                  background: '#171b26',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs font-bold font-inter" style={{ color: '#dfe2f1' }}>
                        {user.username}
                      </p>
                      <p className="text-xs font-inter" style={{ color: '#c2c6d6' }}>
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-inter transition-colors hover:bg-white/5 flex items-center gap-2"
                      style={{ color: '#ffb4ab' }}
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2 text-xs font-inter transition-colors hover:bg-white/5 flex items-center gap-2"
                    style={{ color: '#4edea3' }}
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    Sign In
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
