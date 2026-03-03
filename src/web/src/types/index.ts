export interface Role {
  id: string;
  name: string;
  level: string;
  reportsTo: string;
  status: string;
}

export interface RoleDetail extends Role {
  persona: string;
  authority: {
    autonomous: string[];
    needsApproval: string[];
  };
  journal: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  created: string;
}

export interface Task {
  id: string;
  title: string;
  role: string;
  status: string;
  description: string;
}

export interface ProjectDetail extends Project {
  prd: string;
  tasks: Task[];
}

export interface Standup {
  date: string;
  content: string;
}

export interface Wave {
  id: string;
  timestamp: string;
  content: string;
}

export interface Decision {
  id: string;
  title: string;
  date: string;
  content: string;
}

export interface Company {
  name: string;
  domain: string;
  founded: string;
  mission: string;
  roles: Role[];
}

/* ─── Stream Event Types ───────────────── */

export interface StreamEvent {
  type: 'thinking' | 'tool' | 'dispatch' | 'turn';
  timestamp: number;
  text?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  roleId?: string;
  task?: string;
  turn?: number;
}

/* ─── Terminal Session Types ─────────────── */

export interface Message {
  id: string;
  from: 'ceo' | 'role';
  content: string;
  thinking?: string;
  streamEvents?: StreamEvent[];
  type: 'conversation' | 'directive' | 'system';
  status?: 'streaming' | 'done' | 'error';
  timestamp: string;
}

export interface CreateRoleInput {
  id: string;
  name: string;
  level: 'c-level' | 'team-lead' | 'member';
  reportsTo: string;
  persona: string;
  authority: { autonomous: string[]; needsApproval: string[] };
  knowledge: { reads: string[]; writes: string[] };
  reports: { daily: string; weekly: string };
}

export interface Session {
  id: string;
  roleId: string;
  title: string;
  mode: 'talk' | 'do';
  messages: Message[];
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}
