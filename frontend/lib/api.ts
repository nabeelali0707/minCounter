/**
 * API client for the minCounter backend (FastAPI on localhost:8000)
 * All requests go through Next.js rewrites: /api/* → http://localhost:8000/api/*
 */

const API_BASE = '/api';

// ─── Token helpers ─────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}

// ─── Fetch wrapper ─────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export const auth = {
  login: (username_or_email: string, password: string) =>
    apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    apiFetch<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  me: () => apiFetch<UserResponse>('/auth/me'),

  logout: () => {
    removeToken();
  },
};

// ─── Problems ──────────────────────────────────────────────────────────────
export interface Problem {
  id: number;
  title: string;
  statement_text: string;
  object_type: string;
  size_metric: string;
  verification_predicate_ref: string;
  status: string;
  created_at: string;
  record_size: number | null;
  record_holder: string | null;
  difficulty?: string | null;
}

export interface HistoryEntry {
  submission_id: number;
  username: string;
  size: number;
  achieved_at: string;
}

export const problems = {
  list: () => apiFetch<Problem[]>('/problems/'),
  get: (id: number | string) => apiFetch<Problem>(`/problems/${id}`),
  history: (id: number | string) => apiFetch<HistoryEntry[]>(`/problems/${id}/history`),
  recordGraph: (id: number | string) => apiFetch<{ nodes: unknown[]; edges: unknown[] }>(`/problems/${id}/record-graph`),
  leaderboard: (id: number | string) => apiFetch<ProblemLeaderboardEntry[]>(`/problems/${id}/leaderboard`),
};

// ─── Leaderboard ───────────────────────────────────────────────────────────
export interface ProblemLeaderboardEntry {
  rank: number;
  username: string;
  size: number;
  submission_id: number;
  achieved_at: string;
  graph_data: unknown | null;
}

export interface GlobalLeaderboardEntry {
  rank: number;
  username: string;
  records_held: number;
  problems_solved: number;
}

export const leaderboard = {
  global: () => apiFetch<GlobalLeaderboardEntry[]>('/leaderboard/global'),
  problem: (id: number | string) => apiFetch<ProblemLeaderboardEntry[]>(`/leaderboard/problem/${id}`),
};

// ─── Submissions ───────────────────────────────────────────────────────────
export interface GraphData {
  nodes: { id: string | number; label?: string }[];
  edges: { source: string | number; target: string | number }[];
}

export interface SubmissionResponse {
  id: number;
  problem_id: number;
  user_id: number;
  username: string;
  object_data: GraphData;
  size_value: number | null;
  verification_status: 'pending' | 'passed' | 'failed';
  verification_reason: string | null;
  is_record: boolean;
  created_at: string;
}

export const submissions = {
  create: (problem_id: number, object_data: GraphData) =>
    apiFetch<SubmissionResponse>('/submissions/', {
      method: 'POST',
      body: JSON.stringify({ problem_id, object_data }),
    }),

  listForProblem: (problem_id: number | string) =>
    apiFetch<SubmissionResponse[]>(`/submissions/problem/${problem_id}`),

  get: (id: number | string) =>
    apiFetch<SubmissionResponse>(`/submissions/${id}`),

  status: (id: number | string) =>
    apiFetch<{ status: string; reason: string | null; size: number | null; is_record: boolean }>(
      `/submissions/${id}/status`
    ),

  mySubmissions: (problem_id: number | string) =>
    apiFetch<SubmissionResponse[]>(`/submissions/my/${problem_id}`),
};

export const healthCheck = () =>
  apiFetch<{ status: string }>('/health');
