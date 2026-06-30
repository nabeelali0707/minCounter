'use client';

import { usePathname } from 'next/navigation';

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

  // Helper to determine page title/breadcrumbs
  const getBreadcrumbs = () => {
    if (pathname.startsWith('/problems/')) {
      const problemId = pathname.split('/').pop()?.toUpperCase() || 'PROBLEM';
      return (
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-label-sm uppercase tracking-widest">Workspace</span>
          <span className="text-white/20">/</span>
          <span className="text-secondary font-label-sm uppercase tracking-widest">{problemId.replace(/-/g, ' ')}</span>
        </div>
      );
    }
    if (pathname === '/leaderboard') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-label-sm uppercase tracking-widest">Global Standings</span>
          <span className="text-white/20">/</span>
          <span className="text-secondary font-label-sm uppercase tracking-widest">Hall of Fame</span>
        </div>
      );
    }
    return (
      <div className="hidden md:flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Network Status</span>
        <span className="text-secondary flex items-center gap-1 font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          Computational Nodes Online
        </span>
      </div>
    );
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 bg-background/80 backdrop-blur-sm border-b border-white/10 flex justify-between items-center px-gutter z-40">
      {/* Mobile Title Logo */}
      <div className="md:hidden flex items-center gap-2">
        <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">MathMatrix</span>
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
            className="bg-black/20 border border-white/10 rounded-sm pl-10 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none w-64 transition-all focus:w-80"
            placeholder={searchPlaceholder ?? 'Search theorems...'}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-secondary transition-all scale-98 active:opacity-80 relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-tertiary-container rounded-full"></span>
          </button>
          <button className="text-on-surface-variant hover:text-secondary transition-all scale-98 active:opacity-80">
            <span className="material-symbols-outlined">settings</span>
          </button>
          
          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-surface-container-highest">
            <img
              className="w-full h-full object-cover"
              alt="Researcher Avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKj0GnMkM0EY_PbwBBIWC27PC24UPnzczxzqk-jbm2zxwab2ikpRMxqpYWOkj80BrcKFCGPK5VNf6OD3Ec8Ko0fnxeCXv2H0MH812NWEASYSEi3UD5mgjRK1qxcR801BZrQ9r9SDguj15iH8fH2YwzTf_o2nX2YDb4OXIdH2JyE7TqYsv3So8tWM-znboxDUq5GRxSCmCf_dgzTBgkguTDF1i-NXcfK6K_BkMV4qzB8ryl2b0dugK1GjK3IMkMwclJ4tWQI4GWQL8"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
