'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import { leaderboard as apiLeaderboard, submissions as apiSubmissions, problems as apiProblems, GlobalLeaderboardEntry, SubmissionResponse } from '@/lib/api';

const initialFeed = [
  {
    isRecord: true,
    user: '@user_42',
    action: 'broke the record for',
    target: 'Planar 3-Coloring',
    suffix: 'with a 12-vertex graph!',
    time: '2 mins ago',
  },
  {
    isRecord: false,
    user: '@quantum_leap',
    action: 'solved',
    target: 'Goldbach Conjecture (Restricted)',
    suffix: 'challenge.',
    time: '8 mins ago',
  },
  {
    isRecord: true,
    user: '@hypersphere_alpha',
    action: 'just claimed the',
    target: 'Z-Function Zeta',
    suffix: 'record!',
    time: '15 mins ago',
  },
  {
    isRecord: false,
    user: '@zeta_zero',
    action: 'uploaded a new proof for review:',
    target: '"On the density of G-sets"',
    suffix: '',
    time: '22 mins ago',
  },
  {
    isRecord: false,
    user: '@prime_oracle',
    action: 'reached',
    target: 'Lvl 50 Senior Researcher',
    suffix: 'status.',
    time: '45 mins ago',
    isPrimary: true,
  },
  {
    isRecord: true,
    user: '@newbie_math',
    action: 'found a new counterexample for',
    target: 'Mersenne 31',
    suffix: '',
    time: '1 hour ago',
  },
];

export default function LeaderboardPage() {
  const [searchValue, setSearchValue] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<GlobalLeaderboardEntry[]>([]);
  const [feed, setFeed] = useState<any[]>(initialFeed);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    networkLoad: '0.0 PFlops',
    solvedCount: 0,
  });

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await apiLeaderboard.global();
        setLeaderboardData(data);

        // Fetch recent submissions across all active problems to create a live feed
        const activeProblems = await apiProblems.list();
        let allSubmissions: SubmissionResponse[] = [];
        let solved = 0;

        await Promise.all(
          activeProblems.map(async (p) => {
            try {
              const subs = await apiSubmissions.listForProblem(p.id);
              allSubmissions = [...allSubmissions, ...subs];
              if (p.record_size !== null) {
                solved++;
              }
            } catch (err) {
              console.error(`Error loading submissions for problem ${p.id}:`, err);
            }
          })
        );

        setStats({
          networkLoad: `${(1.0 + (allSubmissions.length * 0.05)).toFixed(1)} PFlops`,
          solvedCount: solved,
        });

        if (allSubmissions.length > 0) {
          // Sort by creation time
          allSubmissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          const mappedFeed = allSubmissions.map((sub) => {
            const matchedProblem = activeProblems.find(p => p.id === sub.problem_id);
            const title = matchedProblem ? matchedProblem.title : `Conjecture #${sub.problem_id}`;
            const isRec = sub.is_record && sub.verification_status === 'passed';
            
            // Format time difference
            const diffMs = new Date().getTime() - new Date(sub.created_at).getTime();
            const diffMin = Math.floor(diffMs / 60000);
            let timeStr = 'Just now';
            if (diffMin > 0 && diffMin < 60) {
              timeStr = `${diffMin} mins ago`;
            } else if (diffMin >= 60) {
              const diffHrs = Math.floor(diffMin / 60);
              timeStr = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
            }

            return {
              isRecord: isRec,
              user: `@${sub.username}`,
              action: isRec ? 'broke the record for' : 'submitted proof for',
              target: title,
              suffix: isRec ? `with a ${sub.size_value}-vertex graph!` : `(${sub.verification_status})`,
              time: timeStr,
              isPrimary: sub.verification_status === 'passed',
            };
          });

          setFeed(mappedFeed.slice(0, 10));
        }

        // Show record toast if there's any recent record
        const recentRecord = allSubmissions.find(s => s.is_record && s.verification_status === 'passed');
        if (recentRecord) {
          setShowToast(true);
        }

      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboardData.filter(user =>
    user.username.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="min-h-screen font-inter text-on-surface">
      <Navigation activePath="/leaderboard" />
      <Header
        breadcrumbs={[
          { label: 'Global Standings' },
          { label: 'Hall of Fame', active: true },
        ]}
        searchPlaceholder="Search mathematicians..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <main className="md:ml-64 pt-24 pb-12 px-6 max-w-[1440px] mx-auto">
        {/* Page Title */}
        <div className="mb-12">
          <h2
            className="font-outfit font-bold mb-2"
            style={{ fontSize: '64px', lineHeight: '72px', color: '#dfe2f1' }}
          >
            Hall of Fame
          </h2>
          <p className="max-w-2xl font-inter" style={{ fontSize: '18px', lineHeight: '28px', color: '#c2c6d6' }}>
            Recognizing the elite minds who have cracked the most complex mathematical structures. Records are
            verified by the distributed MathMatrix network.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Leaderboard Section */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="glass-card rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
                      {['Rank', 'Username', 'Records Held', 'Problems Solved', 'Score'].map((col, i) => (
                        <th
                          key={col}
                          className="py-4 px-6 font-inter font-medium uppercase"
                          style={{
                            fontSize: '12px',
                            letterSpacing: '0.05em',
                            color: '#c2c6d6',
                            textAlign: i === 4 ? 'right' : 'left',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid transparent' }}>
                    {loading && (
                      <tr>
                        <td colSpan={5} className="text-center py-20">
                          <svg className="animate-spin h-8 w-8 text-secondary mx-auto" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        </td>
                      </tr>
                    )}
                    {!loading && filteredLeaderboard.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-20 text-on-surface-variant font-medium">
                          No researchers found on the leaderboard.
                        </td>
                      </tr>
                    )}
                    {!loading && filteredLeaderboard.map((researcher) => {
                      const isFirst = researcher.rank === 1;
                      const avatarLetters = researcher.username.slice(0, 2).toUpperCase();
                      const scoreValue = researcher.records_held * 5000 + researcher.problems_solved * 1000;

                      return (
                        <tr
                          key={researcher.username}
                          className="transition-colors group cursor-pointer"
                          style={{
                            background: isFirst ? 'rgba(78,222,163,0.05)' : undefined,
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = isFirst
                              ? 'rgba(78,222,163,0.05)'
                              : 'transparent';
                          }}
                        >
                          <td className={`py-${isFirst ? 6 : 5} px-6`}>
                            {isFirst ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-outfit font-bold"
                                  style={{ fontSize: '32px', lineHeight: '40px', color: '#4edea3' }}
                                >
                                  01
                                </span>
                                <span
                                  className="material-symbols-outlined"
                                  style={{ color: '#4edea3', fontVariationSettings: "'FILL' 1" }}
                                >
                                  workspace_premium
                                </span>
                              </div>
                            ) : (
                              <span
                                className="font-outfit font-semibold transition-colors"
                                style={{
                                  fontSize: '32px',
                                  lineHeight: '40px',
                                  color: 'rgba(223,226,241,0.5)',
                                }}
                              >
                                {researcher.rank < 10 ? `0${researcher.rank}` : researcher.rank}
                              </span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                style={
                                  isFirst
                                    ? {
                                        border: '2px solid #4edea3',
                                        padding: '2px',
                                        background: 'rgba(78,222,163,0.15)',
                                        color: '#4edea3',
                                      }
                                    : {
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#c2c6d6',
                                      }
                                }
                              >
                                {avatarLetters}
                              </div>
                              <div>
                                <p
                                  className="font-bold text-on-surface group-hover:text-secondary transition-colors"
                                >
                                  {researcher.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            {isFirst ? (
                              <div
                                className="inline-flex items-center px-2 py-1 text-xs font-bold"
                                style={{
                                  background: 'rgba(78,222,163,0.1)',
                                  color: '#4edea3',
                                  border: '1px solid rgba(78,222,163,0.2)',
                                  borderRadius: '2px',
                                  boxShadow: 'inset 0 0 15px rgba(78,222,163,0.2), 0 0 10px rgba(78,222,163,0.1)',
                                }}
                              >
                                {researcher.records_held} RECORDS
                              </div>
                            ) : (
                              <span className="font-jetbrains" style={{ color: '#4edea3', fontSize: '14px' }}>
                                {researcher.records_held}
                              </span>
                            )}
                          </td>
                          <td className="py-5 px-6 font-jetbrains" style={{ color: '#c2c6d6', fontSize: '14px' }}>
                            {researcher.problems_solved}
                          </td>
                          <td className="py-5 px-6 text-right tabular-nums">
                            {isFirst ? (
                              <span
                                className="font-outfit font-semibold"
                                style={{ fontSize: '32px', lineHeight: '40px', color: '#4edea3' }}
                              >
                                {scoreValue.toLocaleString()}
                              </span>
                            ) : (
                              <span
                                className="font-inter font-semibold"
                                style={{ fontSize: '18px', lineHeight: '28px', color: '#dfe2f1' }}
                              >
                                {scoreValue.toLocaleString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="p-6 flex justify-between items-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}
              >
                <span className="text-sm" style={{ color: '#c2c6d6' }}>
                  Showing top 100 researchers
                </span>
                <div className="flex gap-2">
                  <button
                    disabled
                    className="p-2 rounded-sm disabled:opacity-50"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#c2c6d6' }}>
                      chevron_left
                    </span>
                  </button>
                  <button
                    className="p-2 rounded-sm hover:bg-white/5 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#c2c6d6' }}>
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Activity Feed */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Live Feed */}
            <div
              className="glass-card rounded-lg p-6 flex flex-col"
              style={{ maxHeight: '720px' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-inter font-semibold flex items-center gap-2" style={{ fontSize: '18px', color: '#dfe2f1' }}>
                  <span className="relative flex h-3 w-3">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: '#4edea3' }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-3 w-3"
                      style={{ background: '#4edea3' }}
                    />
                  </span>
                  Live Feed
                </h3>
                <span className="font-jetbrains text-xs" style={{ color: '#c2c6d6', fontSize: '14px' }}>
                  SYNCING...
                </span>
              </div>

              <div
                className="space-y-6 overflow-y-auto pr-2 flex-1"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(78,222,163,0.3) rgba(255,255,255,0.02)',
                }}
              >
                {feed.map((item, i) => (
                  <div
                    key={i}
                    className="relative pl-6 pb-4"
                    style={{
                      borderLeft: item.isRecord
                        ? '1px solid rgba(78,222,163,0.3)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      className="absolute -left-1.5 top-0 w-3 h-3 rounded-full"
                      style={
                        item.isRecord
                          ? {
                              background: '#4edea3',
                              boxShadow: 'inset 0 0 15px rgba(78,222,163,0.2), 0 0 10px rgba(78,222,163,0.1)',
                              border: '1px solid rgba(78,222,163,0.4)',
                            }
                          : { background: 'rgba(255,255,255,0.2)' }
                      }
                    />
                    <p className="text-sm leading-relaxed mb-1" style={{ color: '#dfe2f1' }}>
                      <span
                        className="font-bold"
                        style={{ color: item.isRecord ? '#4edea3' : '#dfe2f1' }}
                      >
                        {item.user}
                      </span>{' '}
                      {item.action}{' '}
                      {item.target && (
                        <span
                          style={
                            item.isPrimary
                              ? { color: '#adc6ff', fontWeight: 'bold' }
                              : {
                                  textDecoration: 'underline',
                                  textDecorationColor: 'rgba(78,222,163,0.3)',
                                  color: '#dfe2f1',
                                }
                          }
                        >
                          {item.target}
                        </span>
                      )}{' '}
                      {item.suffix}
                    </p>
                    <span
                      className="font-jetbrains uppercase"
                      style={{ fontSize: '10px', letterSpacing: '0.05em', color: '#c2c6d6' }}
                    >
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="mt-6 w-full py-2 text-xs font-bold tracking-widest uppercase transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  color: '#dfe2f1',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                }}
              >
                View Full History
              </button>
            </div>

            {/* Stats Card */}
            <div className="glass-card rounded-lg p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined" style={{ fontSize: '120px', color: '#dfe2f1' }}>
                  analytics
                </span>
              </div>
              <p
                className="font-inter font-medium uppercase tracking-widest mb-2"
                style={{ fontSize: '12px', color: '#c2c6d6', letterSpacing: '0.05em' }}
              >
                Network Load
              </p>
              <div className="flex items-end gap-3">
                <span className="font-outfit font-semibold" style={{ fontSize: '32px', lineHeight: '40px', color: '#dfe2f1' }}>
                  {stats.networkLoad}
                </span>
                <span className="text-sm mb-1" style={{ color: '#4edea3' }}>
                  {stats.solvedCount} conjectures active
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <div
        className="fixed bottom-8 right-8 p-4 rounded-sm flex items-center gap-4 z-50 transition-transform duration-500"
        style={{
          backdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(78,222,163,0.4)',
          boxShadow: 'inset 0 0 15px rgba(78,222,163,0.2), 0 0 10px rgba(78,222,163,0.1)',
          transform: showToast ? 'translateY(0)' : 'translateY(8rem)',
        }}
      >
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center"
          style={{ background: 'rgba(78,222,163,0.2)', color: '#4edea3' }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#dfe2f1' }}>
            New Global Record!
          </p>
          <p className="text-xs" style={{ color: '#c2c6d6' }}>
            A verified proof successfully claimed the lead
          </p>
        </div>
        <button
          className="ml-4 transition-colors hover:text-white"
          style={{ color: '#c2c6d6' }}
          onClick={() => setShowToast(false)}
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
