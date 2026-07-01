'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, problems, getToken, UserResponse } from '@/lib/api';

interface NavigationProps {
  activePath?: string;
}

export default function Navigation({ activePath }: NavigationProps = {}) {
  const pathname = activePath ?? usePathname();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [firstProblemId, setFirstProblemId] = useState<number | string>('1');

  useEffect(() => {
    // Load logged in user profile
    const token = getToken();
    if (token) {
      auth.me()
        .then((profile) => setUser(profile))
        .catch((err) => console.error('Failed to load user profile in Navigation:', err));
    }

    // Load list of problems to grab the first one
    problems.list()
      .then((list) => {
        if (list && list.length > 0) {
          setFirstProblemId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load problems in Navigation:', err));
  }, []);

  const navItems = [
    { name: 'Problems', href: '/', icon: 'functions' },
    { name: 'Leaderboard', href: '/leaderboard', icon: 'leaderboard' },
    { name: 'Submit', href: `/problems/${firstProblemId}`, icon: 'send' },
    { name: 'Global Standings', href: '/leaderboard', icon: 'public' },
    { name: 'Documentation', href: '#', icon: 'menu_book' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-48 bg-surface/5 backdrop-blur-md border-r border-white/10 flex flex-col py-6 px-4 z-50">
      <div className="flex items-center gap-2 mb-8">
        <img
          alt="minCounter Logo"
          className="w-8 h-8 object-contain"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAQAElEQVR4AeydDXAc5XnHn/ckfyAhnYI9CTgQEtsMNhBMGiCNZDIFG8sE2mmhk0ynAQYMdQN0BqYxYIOlPcXhyzPUaRoKaW1cEiYzzSRDZ1LXIgQ3E2zXBQcXcCaZ8BXGNmBiWydbsmRJ9/Z59u6kvbtd3dd+3O7+L/vevvu+774fv2f/3P5vdU6C8AIBEHAkAIE4okEFCBBBILgKQGAaAhDINHBQBQIQCK4BEJiGgIcCmWZUVIFASAhAICEJFKYZDAEIJBjuGDUkBCCQkAQK0wyGAAQSDHeMGhIC4RRISOBimuEnAIGEP4ZYgYcEIBAP4aLr8BOAQMIfQ6zAQwIQiIdw0XX4CUAgRTHEIQhYCUAgVhrIg0ARAQikCAgOQcBKAAKx0kAeBIoIQCBFQHAIAlYCEIiVhrd59B5CAhBICIOGKftHAALxjzVGCiEBCCSEQcOU/SMAgfjHGiOFkAAEEsKglU4ZJV4RgEC8Iot+I0EAAolEGLEIrwhAIF6RRb+RIACBRCKMWIRXBCAQr8hGpd+YrwMCifkFgOVPTwACmZ4PamNOAAKJ+QWA5U9PAAKZno8vtZ2pkzd29Q3/uCs1fNBMnJcyXwbHINMSgECmxeNtZeeGk+d29g31K6Wf4ZGuJ0XzzER0vZRJnbThukhuYVgUBBJglFRGP6tIrXCagtSpCf0Dp3qUe08AAvGese0IfAt1C1d0cZp+U7Q013b6dqj1hAAE4gnWSjrNfLWSVtk21bTNnoF3dwhAIO5wrL4XRZdQpa9q2lbaJ9pVRAACqQiT940On72L9n9ho5kk7/2IkR7BtcVBIK6hrLIjTfuo0lc1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+0qIgCBVITJ/UY6QU9W2ms1bSvtE+5hQzNfRzKzGdX/Ytqf/POfH8P//H6b6//x/Wd6bZpY7d/UOx/9O/29Dq3zLzL/X2Uf/7x8A//8IWw21AAAABklEQVQDAHRTmSc5TEh0AAAAAElFTkSuQmCC"
        />
        <span className="font-outfit font-bold text-on-surface tracking-tight text-lg">
          minCounter
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 py-2 px-3 rounded-sm transition-all group text-xs ${
                isActive
                  ? 'text-secondary font-bold border-r-2 border-secondary bg-white/5 active-nav-glow'
                  : 'text-on-surface-variant font-medium hover:bg-white/5 hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${isActive ? 'fill-1' : 'group-hover:text-secondary'}`}>
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center border border-secondary/30">
            <span className="material-symbols-outlined text-secondary text-base">person</span>
          </div>
          <div>
            <p className="text-on-surface font-bold text-xs">
              {user ? user.username : 'Guest Researcher'}
            </p>
            <p className="text-on-surface-variant font-code-mono text-[10px]">
              #{user ? user.id : '0000'}
            </p>
          </div>
        </div>
        
        {user ? (
          <Link
            href={`/problems/${firstProblemId}`}
            className="w-full py-2 px-3 border border-secondary text-secondary rounded-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary/10 transition-all active:scale-95 text-center text-xs"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Proof
          </Link>
        ) : (
          <Link
            href="/login"
            className="w-full py-3 px-4 bg-secondary text-surface font-bold rounded-sm flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-all active:scale-95 text-center text-sm"
            style={{ color: '#002113' }}
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
