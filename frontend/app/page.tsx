'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import { problems as apiProblems, submissions as apiSubmissions, Problem, SubmissionResponse } from '@/lib/api';

interface ProblemWithExtra extends Problem {
  difficultyLabel: string;
  difficultyColor: string;
  color: string;
  svgNodes: { cx: number; cy: number }[];
  svgEdges: number[][];
  previewLabel: string;
}

const DEFAULT_GRAPHS: Record<number, { nodes: { cx: number; cy: number }[]; edges: number[][] }> = {
  1: {
    nodes: [
      { cx: 50, cy: 30 },
      { cx: 150, cy: 30 },
      { cx: 100, cy: 80 },
      { cx: 70, cy: 60 },
      { cx: 130, cy: 60 },
    ],
    edges: [
      [50, 30, 150, 30],
      [50, 30, 100, 80],
      [150, 30, 100, 80],
      [70, 60, 130, 60],
      [70, 60, 50, 30],
    ],
  },
  2: {
    nodes: [
      { cx: 80, cy: 30 },
      { cx: 120, cy: 30 },
      { cx: 80, cy: 70 },
      { cx: 120, cy: 70 },
      { cx: 100, cy: 50 },
    ],
    edges: [
      [100, 50, 80, 30],
      [100, 50, 120, 30],
      [100, 50, 80, 70],
      [100, 50, 120, 70],
    ],
  },
};

export default function DashboardPage() {
  const [searchValue, setSearchValue] = useState('');
  const [problems, setProblems] = useState<ProblemWithExtra[]>([]);
  const [activityRows, setActivityRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProblems: '0',
    submissions: '0',
    globalRecords: '0',
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch active problems
        const rawProblems = await apiProblems.list();
        
        // Fetch record graphs & details for each problem
        const enriched = await Promise.all(
          rawProblems.map(async (p, idx) => {
            let svgNodes = DEFAULT_GRAPHS[(p.id % 2) + 1]?.nodes || [];
            let svgEdges = DEFAULT_GRAPHS[(p.id % 2) + 1]?.edges || [];
            
            try {
              const graph = await apiProblems.recordGraph(p.id);
              if (graph && graph.nodes && graph.nodes.length > 0) {
                // Map real graph coordinates to fit SVG preview box (200x100)
                // Let's generate nice concentric layouts if coordinates aren't set
                svgNodes = graph.nodes.map((n: any, i: number) => {
                  const angle = (i / graph.nodes.length) * 2 * Math.PI;
                  return {
                    cx: Math.round(100 + 40 * Math.cos(angle)),
                    cy: Math.round(50 + 30 * Math.sin(angle)),
                    id: n.id
                  };
                });
                
                svgEdges = [];
                graph.edges.forEach((e: any) => {
                  const sourceNode = svgNodes.find((n: any) => n.id === e.source);
                  const targetNode = svgNodes.find((n: any) => n.id === e.target);
                  if (sourceNode && targetNode) {
                    svgEdges.push([sourceNode.cx, sourceNode.cy, targetNode.cx, targetNode.cy]);
                  }
                });
              }
            } catch (err) {
              console.error(`Error loading graph for problem ${p.id}:`, err);
            }

            const diff = p.difficulty || (p.id % 2 === 0 ? 'hard' : 'medium');
            const difficultyLabel = diff.charAt(0).toUpperCase() + diff.slice(1) + ' Difficulty';
            const difficultyColor = diff === 'hard' ? 'tertiary' : 'secondary';
            const color = diff === 'hard' ? '#ffb3ad' : '#4edea3';

            return {
              ...p,
              difficultyLabel,
              difficultyColor,
              color,
              svgNodes,
              svgEdges,
              previewLabel: `Preview: G-${p.record_size || 'None'}`
            };
          })
        );

        setProblems(enriched);

        // Fetch submissions for all problems to show in recent activity
        let allSubmissions: SubmissionResponse[] = [];
        let totalSubmissionsCount = 0;
        let recordsCount = 0;

        await Promise.all(
          rawProblems.map(async (p) => {
            try {
              const subs = await apiSubmissions.listForProblem(p.id);
              allSubmissions = [...allSubmissions, ...subs];
              totalSubmissionsCount += subs.length;
              recordsCount += subs.filter(s => s.is_record && s.verification_status === 'passed').length;
            } catch (err) {
              console.error(`Error loading submissions for problem ${p.id}:`, err);
            }
          })
        );

        // Sort combined submissions by created_at desc
        allSubmissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Map to activity rows format
        const rows = allSubmissions.slice(0, 5).map((sub) => {
          const matchedProblem = rawProblems.find(p => p.id === sub.problem_id);
          const conjecture = matchedProblem ? matchedProblem.title : `Conjecture #${sub.problem_id}`;
          return {
            researcher: `@${sub.username}`,
            conjecture,
            vertices: sub.size_value || '-',
            status: sub.verification_status === 'passed' ? 'Verified' : sub.verification_status === 'failed' ? 'Invalidated' : 'Pending',
            statusColor: sub.verification_status === 'passed' ? 'secondary' : sub.verification_status === 'failed' ? 'tertiary' : 'primary',
          };
        });

        setActivityRows(rows);

        // Update stats HUD
        setStats({
          activeProblems: String(rawProblems.length),
          submissions: String(totalSubmissionsCount),
          globalRecords: String(recordsCount || enriched.filter(p => p.record_size !== null).length),
        });

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter problems by search
  const filteredProblems = problems.filter(p =>
    p.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    p.statement_text.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="min-h-screen font-inter text-on-surface">
      <Navigation activePath="/" />
      <Header
        breadcrumbs={[{ label: 'Network Status', isStatus: true }]}
        searchPlaceholder="Search theorems..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {/* Main Content Canvas */}
      <main className="pt-24 pb-12 px-4 md:px-16 md:ml-48">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="max-w-3xl">
            <h1
              className="font-outfit font-bold mb-6 leading-tight"
              style={{ fontSize: '48px', lineHeight: '56px', letterSpacing: '-0.02em', color: '#dfe2f1' }}
            >
              Find the smallest graph that breaks the theorem.{' '}
              <span style={{ color: '#4edea3' }}>Claim the record.</span>{' '}
              Dominate the leaderboard.
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: '#c2c6d6' }}>
              Our distributed proving network allows researchers to submit counterexamples for long-standing
              mathematical conjectures. Minimize vertices, maximize prestige.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: 'grid_view', label: 'Active Problems', value: stats.activeProblems, color: 'secondary' },
            { icon: 'cloud_upload', label: 'Submissions', value: stats.submissions, color: 'primary' },
            { icon: 'emoji_events', label: 'Global Records', value: stats.globalRecords, color: 'tertiary' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-sm flex items-center gap-6 p-6"
            >
              <div
                className="w-16 h-16 rounded-sm flex items-center justify-center"
                style={{
                  background:
                    stat.color === 'secondary'
                      ? 'rgba(78,222,163,0.1)'
                      : stat.color === 'primary'
                      ? 'rgba(173,198,255,0.1)'
                      : 'rgba(255,179,173,0.1)',
                  border:
                    stat.color === 'secondary'
                      ? '1px solid rgba(78,222,163,0.2)'
                      : stat.color === 'primary'
                      ? '1px solid rgba(173,198,255,0.2)'
                      : '1px solid rgba(255,179,173,0.2)',
                }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{
                    color:
                      stat.color === 'secondary'
                        ? '#4edea3'
                        : stat.color === 'primary'
                        ? '#adc6ff'
                        : '#ffb3ad',
                  }}
                >
                  {stat.icon}
                </span>
              </div>
              <div>
                <div
                  className="text-xs uppercase tracking-widest mb-1 font-inter font-medium"
                  style={{ color: '#c2c6d6', fontSize: '12px', letterSpacing: '0.05em' }}
                >
                  {stat.label}
                </div>
                <div
                  className="font-outfit font-semibold animate-pulse"
                  style={{ fontSize: '24px', lineHeight: '32px', color: '#dfe2f1' }}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Problems Grid Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-outfit font-semibold mb-1" style={{ fontSize: '24px', lineHeight: '32px', color: '#dfe2f1' }}>
              Conjecture Registry
            </h2>
            <p style={{ color: '#c2c6d6' }}>Select a theorem to begin counterexample search</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-sm text-sm border transition-all hover:bg-white/10"
              style={{
                background: '#1c1f2a',
                borderColor: 'rgba(255,255,255,0.05)',
                color: '#dfe2f1',
              }}
            >
              All Fields
            </button>
            <button
              className="px-4 py-2 rounded-sm text-sm border transition-all hover:bg-white/10"
              style={{
                background: '#1c1f2a',
                borderColor: 'rgba(255,255,255,0.05)',
                color: '#dfe2f1',
              }}
            >
              Trending
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Problem Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className="glass-card rounded-sm overflow-hidden flex flex-col group transition-all cursor-pointer"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className="text-xs px-2 py-1 rounded-sm uppercase font-bold tracking-tighter"
                      style={{
                        background:
                          problem.difficultyColor === 'secondary'
                            ? 'rgba(78,222,163,0.1)'
                            : 'rgba(255,179,173,0.1)',
                        color: problem.difficultyColor === 'secondary' ? '#4edea3' : '#ffb3ad',
                        border:
                          problem.difficultyColor === 'secondary'
                            ? '1px solid rgba(78,222,163,0.2)'
                            : '1px solid rgba(255,179,173,0.2)',
                      }}
                    >
                      {problem.difficultyLabel}
                    </span>
                    <span className="font-jetbrains text-sm" style={{ color: '#c2c6d6', fontSize: '14px' }}>
                      ID: TH-ID-{problem.id}
                    </span>
                  </div>

                  <h3
                    className="font-outfit font-semibold mb-2 transition-colors group-hover:text-secondary"
                    style={{
                      fontSize: '24px',
                      lineHeight: '32px',
                      color: '#dfe2f1',
                    }}
                  >
                    {problem.title}
                  </h3>
                  <p className="mb-6 min-h-12 text-sm leading-relaxed" style={{ color: '#c2c6d6' }}>
                    {problem.statement_text}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div
                      className="p-4 rounded-sm border"
                      style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="text-xs uppercase mb-1" style={{ color: '#c2c6d6' }}>
                        Current Record
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ color: problem.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          stars
                        </span>
                        <span className="font-jetbrains text-sm" style={{ color: problem.color }}>
                          {problem.record_holder ? `@${problem.record_holder}` : 'None'}
                        </span>
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-sm border"
                      style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="text-xs uppercase mb-1" style={{ color: '#c2c6d6' }}>
                        Vertex Count
                      </div>
                      <div
                        className="font-outfit font-semibold"
                        style={{ fontSize: '24px', lineHeight: '32px', color: '#dfe2f1' }}
                      >
                        {problem.record_size || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Mini Graph Preview */}
                  <div
                    className="h-48 w-full rounded-sm relative overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at center, ${problem.color}1a 0%, transparent 70%)`,
                      }}
                    />
                    <svg className="w-full h-full opacity-60" viewBox="0 0 200 100">
                      {problem.svgEdges.map(([x1, y1, x2, y2], i) => (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={problem.color}
                          strokeWidth="1.5"
                          strokeOpacity="0.5"
                        />
                      ))}
                      {problem.svgNodes.map((node, i) => (
                        <circle key={i} cx={node.cx} cy={node.cy} r="5" fill={problem.color} />
                      ))}
                    </svg>
                    <span
                      className="absolute bottom-3 right-4 uppercase font-inter font-medium text-xs"
                      style={{ color: '#c2c6d6', letterSpacing: '0.05em' }}
                    >
                      {problem.previewLabel}
                    </span>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-auto">
                  <Link href={`/problems/${problem.id}`}>
                    <button
                      className="w-full py-4 font-outfit font-bold rounded-sm transition-all flex items-center justify-center gap-2"
                      style={{
                        border: `1px solid ${problem.color}`,
                        color: problem.color,
                        boxShadow: `0 0 15px ${problem.color}33`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          problem.difficultyColor === 'secondary'
                            ? 'rgba(78,222,163,0.1)'
                            : 'rgba(255,179,173,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      View &amp; Compete
                      <span className="material-symbols-outlined">trending_flat</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Network Activity Table */}
        {!loading && activityRows.length > 0 && (
          <section className="mt-16">
            <h2
              className="font-outfit font-semibold mb-6"
              style={{ fontSize: '32px', lineHeight: '40px', color: '#dfe2f1' }}
            >
              Network Activity
            </h2>
            <div className="glass-card rounded-sm overflow-hidden">
              <table className="w-full text-left">
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    {['Researcher', 'Target Conjecture', 'Vertices', 'Status'].map((col, i) => (
                      <th
                        key={col}
                        className="px-6 py-4 uppercase font-inter font-medium"
                        style={{
                          fontSize: '12px',
                          letterSpacing: '0.05em',
                          color: '#c2c6d6',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          textAlign: i >= 2 ? 'right' : 'left',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activityRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="transition-all hover:bg-white/5"
                      style={idx % 2 === 1 ? { background: 'rgba(255,255,255,0.02)' } : {}}
                    >
                      <td className="px-6 py-4 font-jetbrains" style={{ color: '#adc6ff', fontSize: '14px' }}>
                        {row.researcher}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#dfe2f1' }}>
                        {row.conjecture}
                      </td>
                      <td className="px-6 py-4 text-right font-jetbrains" style={{ fontSize: '14px', color: '#dfe2f1' }}>
                        {row.vertices}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className="text-xs px-2 py-0.5 rounded-sm"
                          style={{
                            background:
                              row.statusColor === 'secondary'
                                ? 'rgba(78,222,163,0.1)'
                                : 'rgba(255,179,173,0.1)',
                            color: row.statusColor === 'secondary' ? '#4edea3' : '#ffb3ad',
                            border:
                              row.statusColor === 'secondary'
                                ? '1px solid rgba(78,222,163,0.2)'
                                : '1px solid rgba(255,179,173,0.2)',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50"
        style={{
          background: '#4edea3',
          color: '#002113',
          boxShadow: '0 0 30px rgba(78,222,163,0.4)',
        }}
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={{ fontVariationSettings: "'wght' 600" }}
        >
          add
        </span>
      </button>
    </div>
  );
}
