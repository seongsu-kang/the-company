import fs from 'node:fs';
import path from 'node:path';
import { COMPANY_ROOT } from './file-reader.js';

function activityDir(): string {
  return path.join(COMPANY_ROOT, 'operations', 'activity');
}

export interface RoleActivity {
  roleId: string;
  status: 'idle' | 'working' | 'done';
  currentTask: string;
  startedAt: string;
  updatedAt: string;
  recentOutput: string;
}

function activityPath(roleId: string): string {
  return path.join(activityDir(), `${roleId}.json`);
}

function ensureDir(): void {
  const dir = activityDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function setActivity(roleId: string, task: string): void {
  ensureDir();
  const activity: RoleActivity = {
    roleId,
    status: 'working',
    currentTask: task,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recentOutput: '',
  };
  fs.writeFileSync(activityPath(roleId), JSON.stringify(activity, null, 2));
}

export function updateActivity(roleId: string, output: string): void {
  const activity = getActivity(roleId);
  if (!activity) return;
  activity.updatedAt = new Date().toISOString();
  activity.recentOutput = output.slice(-500);
  fs.writeFileSync(activityPath(roleId), JSON.stringify(activity, null, 2));
}

export function completeActivity(roleId: string): void {
  const activity = getActivity(roleId);
  if (!activity) return;
  activity.status = 'done';
  activity.updatedAt = new Date().toISOString();
  fs.writeFileSync(activityPath(roleId), JSON.stringify(activity, null, 2));
}

export function clearActivity(roleId: string): void {
  const filePath = activityPath(roleId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getActivity(roleId: string): RoleActivity | null {
  const filePath = activityPath(roleId);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function getAllActivities(): RoleActivity[] {
  ensureDir();
  const files = fs.readdirSync(activityDir()).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(activityDir(), f), 'utf-8'));
    } catch {
      return null;
    }
  }).filter((a): a is RoleActivity => a !== null);
}
