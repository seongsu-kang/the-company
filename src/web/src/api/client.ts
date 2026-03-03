import type { Company, Role, RoleDetail, Project, ProjectDetail, Standup, Wave, Decision, Session, CreateRoleInput } from '../types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function patch_<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Existing
  getCompany: () => get<Company>('/company'),
  getRoles: () => get<Role[]>('/roles'),
  getRole: (id: string) => get<RoleDetail>(`/roles/${id}`),
  getProjects: () => get<Project[]>('/projects'),
  getProject: (id: string) => get<ProjectDetail>(`/projects/${id}`),
  getStandups: () => get<Standup[]>('/operations/standups'),
  getWaves: () => get<Wave[]>('/operations/waves'),
  getDecisions: () => get<Decision[]>('/operations/decisions'),

  // Roles (Engine)
  createRole: (input: CreateRoleInput) =>
    post<{ ok: boolean; roleId: string }>('/engine/roles', input),
  deleteRole: (id: string) =>
    del<{ ok: boolean; removed: string }>(`/engine/roles/${id}`),

  // Sessions
  getSessions: () => get<Omit<Session, 'messages'>[]>('/sessions'),
  getSession: (id: string) => get<Session>(`/sessions/${id}`),
  createSession: (roleId: string, mode: 'talk' | 'do' = 'talk') =>
    post<Session>('/sessions', { roleId, mode }),
  deleteSession: (id: string) => del<{ ok: boolean }>(`/sessions/${id}`),
  updateSession: (id: string, patch: { title?: string; mode?: 'talk' | 'do' }) =>
    patch_<Session>(`/sessions/${id}`, patch),
};
