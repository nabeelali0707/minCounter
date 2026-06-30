'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import {
  problems as apiProblems,
  submissions as apiSubmissions,
  getToken,
  Problem,
  HistoryEntry,
  ProblemLeaderboardEntry,
  GraphData
} from '@/lib/api';

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  source: number;
  target: number;
}

const DEFAULT_NODES: Node[] = [
  { id: 1, x: 200, y: 100, label: '1' },
  { id: 2, x: 400, y: 50, label: '2' },
  { id: 3, x: 600, y: 150, label: '3' },
  { id: 4, x: 500, y: 350, label: '4' },
  { id: 5, x: 250, y: 400, label: '5' },
];

const DEFAULT_EDGES: Edge[] = [
  { source: 1, target: 2 },
  { source: 2, target: 3 },
  { source: 3, target: 4 },
  { source: 4, target: 5 },
  { source: 5, target: 1 },
  { source: 1, target: 3 },
  { source: 2, target: 4 },
];

type ToolMode = 'select' | 'addNode' | 'addEdge' | 'delete';
type ActiveTab = 'visual' | 'raw';

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const problemId = params.id;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [contributors, setContributors] = useState<ProblemLeaderboardEntry[]>([]);
  const [nodes, setNodes] = useState<Node[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<Edge[]>(DEFAULT_EDGES);

  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [activeTab, setActiveTab] = useState<ActiveTab>('visual');
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [edgeStart, setEdgeStart] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const nextId = useRef(6);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'passed' | 'failed' | 'pending' | null;
    reason: string | null;
  }>({ status: null, reason: null });

  const vertexCount = nodes.length;
  const edgeCount = edges.length;
  const chromaticNo = Math.min(6, Math.max(3, Math.floor(edgeCount / (vertexCount || 1)) + 2));

  const getNodeById = (id: number) => nodes.find((n) => n.id === id);

  // Load problem details, history, leaderboard, and record graph
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const prob = await apiProblems.get(problemId);
        setProblem(prob);

        const hist = await apiProblems.history(problemId);
        setHistory(hist);

        const contribs = await apiProblems.leaderboard(problemId);
        setContributors(contribs);

        // Try to load the current record graph
        const recordGraph = await apiProblems.recordGraph(problemId);
        if (recordGraph && recordGraph.nodes && recordGraph.nodes.length > 0) {
          const loadedNodes = recordGraph.nodes.map((n: any, i: number) => {
            // Generate circular coords if they don't exist
            const angle = (i / recordGraph.nodes.length) * 2 * Math.PI;
            return {
              id: Number(n.id),
              x: n.x || Math.round(400 + 150 * Math.cos(angle)),
              y: n.y || Math.round(220 + 120 * Math.sin(angle)),
              label: n.label || String(n.id),
            };
          });
          
          const loadedEdges = recordGraph.edges.map((e: any) => ({
            source: Number(e.source),
            target: Number(e.target),
          }));

          setNodes(loadedNodes);
          setEdges(loadedEdges);
          nextId.current = Math.max(...loadedNodes.map(n => n.id), 0) + 1;
        }
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [problemId]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (toolMode !== 'addNode') return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const id = nextId.current++;
    setNodes((prev) => [...prev, { id, x, y, label: String(id) }]);
  };

  const handleNodeClick = (nodeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (toolMode === 'addEdge') {
      if (edgeStart === null) {
        setEdgeStart(nodeId);
      } else if (edgeStart !== nodeId) {
        const exists = edges.some(
          (ed) =>
            (ed.source === edgeStart && ed.target === nodeId) ||
            (ed.source === nodeId && ed.target === edgeStart)
        );
        if (!exists) {
          setEdges((prev) => [...prev, { source: edgeStart, target: nodeId }]);
        }
        setEdgeStart(null);
      } else {
        setEdgeStart(null);
      }
    } else if (toolMode === 'delete') {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((ed) => ed.source !== nodeId && ed.target !== nodeId));
    } else {
      setSelectedNode(selectedNode === nodeId ? null : nodeId);
    }
  };

  const handleNodeMouseDown = (nodeId: number, e: React.MouseEvent) => {
    if (toolMode !== 'select') return;
    e.preventDefault();
    setDragNodeId(nodeId);
    setIsDragging(false);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragNodeId === null) return;
    setIsDragging(true);
    const rect = svgRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setNodes((prev) => prev.map((n) => (n.id === dragNodeId ? { ...n, x, y } : n)));
  };

  const handleSvgMouseUp = () => {
    setDragNodeId(null);
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleVerify = async () => {
    if (!getToken()) {
      alert('Please sign in to submit and verify counterexamples.');
      router.push('/login');
      return;
    }

    setVerifying(true);
    setVerificationResult({ status: 'pending', reason: 'Submitting to verification queue...' });

    try {
      const graphData: GraphData = {
        nodes: nodes.map((n) => ({ id: n.id, label: n.label })),
        edges: edges.map((e) => ({ source: e.source, target: e.target })),
      };

      const sub = await apiSubmissions.create(Number(problemId), graphData);
      
      // Poll verification status
      let attempts = 0;
      const interval = setInterval(async () => {
        try {
          attempts++;
          const statusRes = await apiSubmissions.status(sub.id);
          
          if (statusRes.status !== 'pending' || attempts > 20) {
            clearInterval(interval);
            setVerifying(false);
            setVerificationResult({
              status: statusRes.status as any,
              reason: statusRes.reason || (statusRes.status === 'passed' ? 'Valid counterexample found!' : 'Verification failed.'),
            });

            if (statusRes.status === 'passed') {
              // Reload page data to update records
              const prob = await apiProblems.get(problemId);
              setProblem(prob);
              const hist = await apiProblems.history(problemId);
              setHistory(hist);
              const contribs = await apiProblems.leaderboard(problemId);
              setContributors(contribs);
            }
          }
        } catch (err) {
          clearInterval(interval);
          setVerifying(false);
          setVerificationResult({ status: 'failed', reason: 'Error checking verification status.' });
        }
      }, 2000);

    } catch (err: any) {
      setVerifying(false);
      setVerificationResult({ status: 'failed', reason: err.message || 'Submission failed' });
    }
  };

  const rawJson = JSON.stringify(
    {
      nodes: nodes.map((n) => ({ id: n.id, label: n.label })),
      edges: edges.map((e) => ({ source: e.source, target: e.target })),
    },
    null,
    2
  );

  const tools = [
    { mode: 'select' as ToolMode, icon: 'open_with', label: 'Select (S)', hoverColor: '#4edea3' },
    { mode: 'addNode' as ToolMode, icon: 'add_circle', label: 'Add Node (N)', hoverColor: '#4edea3' },
    { mode: 'addEdge' as ToolMode, icon: 'link', label: 'Add Edge (E)', hoverColor: '#4edea3' },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-secondary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden font-inter text-on-surface flex flex-col">
      <Navigation activePath="/" />

      {/* Top App Bar */}
      <header
        className="fixed top-0 right-0 flex justify-between items-center h-16 px-6 z-40"
        style={{
          left: '256px',
          background: 'rgba(15,19,29,0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="font-outfit font-bold" style={{ fontSize: '32px', color: '#dfe2f1' }}>
            Workspace
          </span>
          <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <span className="font-inter font-medium uppercase text-xs tracking-widest" style={{ color: '#c2c6d6' }}>
            {problem?.title.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex pt-16 h-screen" style={{ marginLeft: '256px' }}>
        {/* Left Panel: Problem Details & History */}
        <section className="w-1/3 flex flex-col overflow-hidden" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Problem Header */}
            <div className="mb-8">
              <h2 className="font-outfit font-semibold mb-4 text-2xl text-on-surface">
                {problem?.title}
              </h2>
              <p className="leading-relaxed mb-6 text-sm" style={{ color: '#c2c6d6' }}>
                {problem?.statement_text}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-sm">
                  <p className="font-inter font-medium uppercase tracking-widest text-[10px] mb-1" style={{ color: '#c2c6d6' }}>
                    Complexity
                  </p>
                  <p className="font-inter font-semibold text-base text-secondary">
                    NP-Hard
                  </p>
                </div>
                <div className="glass-card p-4 rounded-sm">
                  <p className="font-inter font-medium uppercase tracking-widest text-[10px] mb-1" style={{ color: '#c2c6d6' }}>
                    Current Record
                  </p>
                  <p className="font-inter font-semibold text-base text-primary">
                    v = {problem?.record_size || 'None'}
                  </p>
                </div>
              </div>
            </div>

            {/* Record Progression Chart */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-inter font-semibold text-sm" style={{ color: '#dfe2f1' }}>
                  Record Progression
                </h3>
                <span className="font-inter font-medium uppercase text-[10px]" style={{ color: '#c2c6d6' }}>
                  VERTEX COUNT
                </span>
              </div>
              <div className="h-48 glass-card rounded-sm relative flex items-end p-4 gap-2">
                {history.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant font-medium">
                    No verified records yet.
                  </div>
                ) : (
                  history.map((bar, i) => {
                    const maxVal = Math.max(...history.map(h => h.size));
                    const heightPercent = `${Math.max(15, (bar.size / maxVal) * 90)}%`;
                    return (
                      <div
                        key={i}
                        className="flex-1 relative group"
                        style={{
                          height: heightPercent,
                          background: i === history.length - 1 ? 'rgba(78,222,163,0.3)' : 'rgba(78,222,163,0.2)',
                          borderTop: '2px solid #4edea3',
                          borderRight: i < history.length - 1 ? '2px solid #4edea3' : undefined,
                        }}
                      >
                        <div
                          className="absolute -top-8 left-0 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10"
                          style={{
                            background: '#0f131d',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#dfe2f1',
                          }}
                        >
                          v={bar.size} by {bar.username}
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between pb-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-full border-b border-dashed" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            <div>
              <h3 className="font-inter font-semibold mb-4 text-sm" style={{ color: '#dfe2f1' }}>
                Top Contributors
              </h3>
              <div className="glass-card rounded-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <tr>
                      {['Rank', 'Researcher', 'Vertices'].map((col, i) => (
                        <th
                          key={col}
                          className="px-4 py-3 font-inter font-medium uppercase text-[10px]"
                          style={{
                            color: '#c2c6d6',
                            textAlign: i === 2 ? 'right' : 'left',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {contributors.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-xs text-on-surface-variant font-medium">
                          Be the first to submit!
                        </td>
                      </tr>
                    ) : (
                      contributors.map((c, i) => (
                        <tr
                          key={i}
                          className="transition-colors hover:bg-white/5"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <td className="px-4 py-3 font-bold" style={{ color: i === 0 ? '#4edea3' : '#c2c6d6' }}>
                            #{c.rank}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: '#dfe2f1' }}>
                            {c.username}
                          </td>
                          <td className="px-4 py-3 font-jetbrains text-right text-xs" style={{ color: '#dfe2f1' }}>
                            {c.size}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="p-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: '#171b26' }}>
            {verificationResult.status && (
              <div
                className="mb-4 p-4 rounded-sm border text-xs flex flex-col gap-1 font-inter"
                style={{
                  background:
                    verificationResult.status === 'passed'
                      ? 'rgba(78,222,163,0.1)'
                      : verificationResult.status === 'failed'
                      ? 'rgba(255,180,171,0.1)'
                      : 'rgba(173,198,255,0.1)',
                  borderColor:
                    verificationResult.status === 'passed'
                      ? 'rgba(78,222,163,0.3)'
                      : verificationResult.status === 'failed'
                      ? 'rgba(255,180,171,0.3)'
                      : 'rgba(173,198,255,0.3)',
                  color:
                    verificationResult.status === 'passed'
                      ? '#4edea3'
                      : verificationResult.status === 'failed'
                      ? '#ffb4ab'
                      : '#adc6ff',
                }}
              >
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm">
                    {verificationResult.status === 'passed'
                      ? 'check_circle'
                      : verificationResult.status === 'failed'
                      ? 'error'
                      : 'pending'}
                  </span>
                  Verification {verificationResult.status}
                </div>
                <div className="leading-relaxed mt-1 font-medium">{verificationResult.reason}</div>
              </div>
            )}
            <button
              disabled={verifying}
              onClick={handleVerify}
              className="w-full py-4 font-outfit font-semibold tracking-wider rounded-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
              style={{
                border: '1px solid #4edea3',
                boxShadow: '0 0 10px rgba(78,222,163,0.2)',
                color: '#4edea3',
                background: 'transparent',
                fontSize: '18px',
              }}
              onMouseEnter={(e) => {
                if (!verifying) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(78,222,163,0.5)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(78,222,163,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
                }
              }}
              onMouseLeave={(e) => {
                if (!verifying) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px rgba(78,222,163,0.2)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }
              }}
            >
              {verifying ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  VERIFYING...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">verified</span>
                  VERIFY COUNTEREXAMPLE
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Panel: Graph Builder */}
        <section className="flex-1 flex flex-col relative">
          {/* Editor Tabs */}
          <div
            className="flex items-center px-8"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,19,29,0.3)',
            }}
          >
            {[
              { key: 'visual' as ActiveTab, icon: 'polyline', label: 'Visual Editor' },
              { key: 'raw' as ActiveTab, icon: 'data_object', label: 'Raw Data (JSON/Edge List)' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-6 py-4 font-inter font-medium flex items-center gap-2 transition-colors"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  color: activeTab === tab.key ? '#4edea3' : '#c2c6d6',
                  borderBottom: activeTab === tab.key ? '2px solid #4edea3' : '2px solid transparent',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span style={{ fontSize: '10px', color: 'rgba(194,198,214,0.5)' }}>
                ENGINE: CYTOSCAPE 3.9
              </span>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4edea3' }} />
            </div>
          </div>

          {/* Graph Canvas */}
          <div className="flex-1 relative overflow-hidden">
            {activeTab === 'visual' ? (
              <div className="absolute inset-0">
                <svg
                  ref={svgRef}
                  className="w-full h-full"
                  style={{
                    cursor:
                      toolMode === 'addNode'
                        ? 'crosshair'
                        : toolMode === 'delete'
                        ? 'not-allowed'
                        : 'default',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center',
                  }}
                  onClick={handleSvgClick}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}
                >
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  {/* Edges */}
                  <g stroke="#4edea3" strokeOpacity="0.5" strokeWidth="1.5">
                    {edges.map((edge, i) => {
                      const source = getNodeById(edge.source);
                      const target = getNodeById(edge.target);
                      if (!source || !target) return null;
                      return (
                        <line
                          key={i}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                        />
                      );
                    })}
                  </g>
                  {/* Nodes */}
                  {nodes.map((node) => (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={selectedNode === node.id ? 10 : 8}
                        fill="#0B0F19"
                        stroke={
                          edgeStart === node.id
                            ? '#adc6ff'
                            : selectedNode === node.id
                            ? '#4edea3'
                            : '#4edea3'
                        }
                        strokeWidth={selectedNode === node.id ? 3 : 2}
                        filter="url(#glow)"
                        style={{ cursor: toolMode === 'select' ? 'grab' : 'pointer' }}
                        onClick={(e) => handleNodeClick(node.id, e)}
                        onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                      />
                      <text
                        x={node.x}
                        y={node.y + 20}
                        textAnchor="middle"
                        fill="#c2c6d6"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="absolute inset-0 p-6 overflow-auto">
                <pre
                  className="font-jetbrains text-sm leading-relaxed p-6 rounded-sm"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#4edea3',
                    fontSize: '14px',
                    lineHeight: '20px',
                  }}
                >
                  {rawJson}
                </pre>
              </div>
            )}

            {/* Floating Toolbar */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div
                className="p-1 rounded-sm flex flex-col gap-1"
                style={{
                  backdropFilter: 'blur(12px)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {tools.map((tool) => (
                  <button
                    key={tool.mode}
                    title={tool.label}
                    onClick={() => {
                      setToolMode(tool.mode);
                      setEdgeStart(null);
                    }}
                    className="p-3 rounded-sm relative group transition-all"
                    style={{
                      color: toolMode === tool.mode ? '#4edea3' : '#c2c6d6',
                      background: toolMode === tool.mode ? 'rgba(78,222,163,0.1)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (toolMode !== tool.mode) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#4edea3';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (toolMode !== tool.mode) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = '#c2c6d6';
                      }
                    }}
                  >
                    <span className="material-symbols-outlined">{tool.icon}</span>
                    <span
                      className="absolute left-full ml-4 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                      style={{
                        background: '#0f131d',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#dfe2f1',
                      }}
                    >
                      {tool.label}
                    </span>
                  </button>
                ))}
                <div className="h-px mx-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <button
                  title="Delete"
                  onClick={() => {
                    setToolMode('delete');
                    setEdgeStart(null);
                  }}
                  className="p-3 rounded-sm relative group transition-all"
                  style={{
                    color: toolMode === 'delete' ? '#ffb4ab' : '#c2c6d6',
                    background: toolMode === 'delete' ? 'rgba(255,180,171,0.1)' : 'transparent',
                  }}
                >
                  <span className="material-symbols-outlined">delete</span>
                  <span
                    className="absolute left-full ml-4 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                    style={{
                      background: '#0f131d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#dfe2f1',
                    }}
                  >
                    Delete (Del)
                  </span>
                </button>
                <button
                  title="Clear"
                  onClick={() => {
                    setNodes([]);
                    setEdges([]);
                    nextId.current = 1;
                    setSelectedNode(null);
                    setEdgeStart(null);
                  }}
                  className="p-3 rounded-sm relative group transition-all"
                  style={{ color: '#c2c6d6' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#ffb4ab';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#c2c6d6';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <span className="material-symbols-outlined">layers_clear</span>
                  <span
                    className="absolute left-full ml-4 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                    style={{
                      background: '#0f131d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#dfe2f1',
                    }}
                  >
                    Clear All
                  </span>
                </button>
              </div>

              <div
                className="p-1 rounded-sm flex flex-col gap-1"
                style={{
                  backdropFilter: 'blur(12px)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {[
                  { icon: 'zoom_in', action: () => setZoom((z) => Math.min(z + 0.1, 2)) },
                  { icon: 'zoom_out', action: () => setZoom((z) => Math.max(z - 0.1, 0.5)) },
                  { icon: 'center_focus_strong', action: () => setZoom(1) },
                ].map(({ icon, action }) => (
                  <button
                    key={icon}
                    onClick={action}
                    className="p-3 rounded-sm transition-all"
                    style={{ color: '#c2c6d6' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#adc6ff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#c2c6d6';
                    }}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats HUD */}
            <div
              className="absolute bottom-6 left-6 p-4 rounded-sm flex gap-8 items-center"
              style={{
                backdropFilter: 'blur(12px)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderLeft: '4px solid #4edea3',
              }}
            >
              {[
                { label: 'Vertices', value: String(vertexCount) },
                { label: 'Edges', value: String(edgeCount) },
                { label: 'Chromatic No.', value: `χ = ${chromaticNo}`, colored: true },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-8">
                  {i > 0 && (
                    <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  )}
                  <div>
                    <p
                      className="font-inter font-medium uppercase"
                      style={{ fontSize: '10px', color: '#c2c6d6', letterSpacing: '0.05em' }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="font-jetbrains text-xl"
                      style={{ color: stat.colored ? '#4edea3' : '#dfe2f1' }}
                    >
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Minimap */}
            <div
              className="absolute bottom-6 right-6 w-40 h-40 rounded-sm overflow-hidden p-2 transition-opacity cursor-crosshair opacity-60 hover:opacity-100"
              style={{
                backdropFilter: 'blur(12px)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  background: 'rgba(10,14,24,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <svg className="w-full h-full opacity-40" viewBox="0 0 800 500">
                  <g stroke="#4edea3" strokeOpacity="0.5" strokeWidth="1.5">
                    {edges.map((edge, i) => {
                      const source = getNodeById(edge.source);
                      const target = getNodeById(edge.target);
                      if (!source || !target) return null;
                      return (
                        <line
                          key={i}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                        />
                      );
                    })}
                  </g>
                  {nodes.map((node) => (
                    <circle key={node.id} cx={node.x} cy={node.y} r="5" fill="#4edea3" />
                  ))}
                </svg>
              </div>
              <p
                className="absolute bottom-1 right-2"
                style={{ fontSize: '8px', color: '#c2c6d6' }}
              >
                MINIMAP
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
