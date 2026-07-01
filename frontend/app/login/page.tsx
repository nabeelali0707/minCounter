'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, setToken, getToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (getToken()) router.push('/');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await auth.login(usernameOrEmail, password);
      setToken(res.access_token);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await auth.register(username, email, password);
      // Auto-login after register
      const res = await auth.login(username, password);
      setToken(res.access_token);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: '#0B0F19',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78,222,163,0.12) 0%, transparent 70%)',
          top: '10%',
          left: '5%',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(173,198,255,0.1) 0%, transparent 70%)',
          bottom: '10%',
          right: '5%',
          filter: 'blur(60px)',
        }}
      />

      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-3 mb-6"
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              background: 'rgba(78,222,163,0.08)',
              border: '1px solid rgba(78,222,163,0.2)',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '28px' }}>
              functions
            </span>
            <span className="font-outfit font-bold" style={{ fontSize: '24px', color: '#dfe2f1' }}>
              minCounter
            </span>
          </div>
          <h1 className="font-outfit font-semibold mb-2" style={{ fontSize: '32px', color: '#dfe2f1' }}>
            {mode === 'login' ? 'Researcher Portal' : 'Create Account'}
          </h1>
          <p style={{ color: '#c2c6d6' }}>
            {mode === 'login'
              ? 'Sign in to access the counterexample network'
              : 'Join the distributed proving network'}
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-card rounded-sm p-8"
          style={{ boxShadow: '0 0 40px rgba(78,222,163,0.05)' }}
        >
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label
                  className="block text-xs font-inter font-medium uppercase tracking-widest mb-2"
                  style={{ color: '#c2c6d6', letterSpacing: '0.05em' }}
                >
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_handle"
                  className="w-full rounded-sm px-4 py-3 outline-none transition-all font-inter text-sm"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#dfe2f1',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#4edea3')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
            )}

            <div>
              <label
                className="block text-xs font-inter font-medium uppercase tracking-widest mb-2"
                style={{ color: '#c2c6d6', letterSpacing: '0.05em' }}
              >
                {mode === 'login' ? 'Username or Email' : 'Email'}
              </label>
              <input
                type={mode === 'register' ? 'email' : 'text'}
                required
                value={mode === 'register' ? email : usernameOrEmail}
                onChange={(e) =>
                  mode === 'register' ? setEmail(e.target.value) : setUsernameOrEmail(e.target.value)
                }
                placeholder={mode === 'login' ? 'researcher_id or email' : 'researcher@university.edu'}
                className="w-full rounded-sm px-4 py-3 outline-none transition-all font-inter text-sm"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#dfe2f1',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#4edea3')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div>
              <label
                className="block text-xs font-inter font-medium uppercase tracking-widest mb-2"
                style={{ color: '#c2c6d6', letterSpacing: '0.05em' }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-sm px-4 py-3 outline-none transition-all font-inter text-sm"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#dfe2f1',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#4edea3')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-sm text-sm font-inter flex items-center gap-2"
                style={{
                  background: 'rgba(255,180,171,0.1)',
                  border: '1px solid rgba(255,180,171,0.3)',
                  color: '#ffb4ab',
                }}
              >
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 font-outfit font-bold tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 mt-2"
              style={{
                background: isLoading ? 'rgba(78,222,163,0.3)' : '#4edea3',
                color: '#002113',
                boxShadow: '0 0 20px rgba(78,222,163,0.3)',
                fontSize: '16px',
              }}
              onMouseEnter={(e) => {
                if (!isLoading)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 0 30px rgba(78,222,163,0.6)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 0 20px rgba(78,222,163,0.3)';
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {mode === 'login' ? 'Authenticating...' : 'Creating account...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    {mode === 'login' ? 'login' : 'person_add'}
                  </span>
                  {mode === 'login' ? 'Access Network' : 'Join Network'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-sm transition-colors hover:text-secondary font-inter"
              style={{ color: '#c2c6d6' }}
            >
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(194,198,214,0.5)' }}>
          minCounter Distributed Research Network · All submissions verified on-chain
        </p>
      </div>
    </div>
  );
}
