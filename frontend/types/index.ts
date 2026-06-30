export interface User {
  id: number;
  username: str;
  email: string;
}

export interface Problem {
  id: number;
  title: string;
  statement_text: string;
  object_type: string;
  size_metric: string;
  verification_predicate_ref: string;
  record_size: number | null;
  record_holder: string | null;
}

export interface GraphNode {
  id: string | number;
  label?: string;
}

export interface GraphEdge {
  source: string | number;
  target: string | number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Submission {
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

export interface LeaderboardEntry {
  rank: number;
  username: string;
  size: number;
  submission_id: number;
  achieved_at: string;
  graph_data?: GraphData | null;
}

export interface GlobalLeaderboardEntry {
  rank: number;
  username: string;
  records_held: number;
  problems_solved: number;
}
