import fs from 'node:fs';
import path from 'node:path';
import { COMPANY_ROOT } from './file-reader.js';
const ACTIVITY_DIR = path.join(COMPANY_ROOT, 'operations', 'activity');
function activityPath(roleId) {
    return path.join(ACTIVITY_DIR, `${roleId}.json`);
}
function ensureDir() {
    if (!fs.existsSync(ACTIVITY_DIR)) {
        fs.mkdirSync(ACTIVITY_DIR, { recursive: true });
    }
}
export function setActivity(roleId, task) {
    ensureDir();
    const activity = {
        roleId,
        status: 'working',
        currentTask: task,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recentOutput: '',
    };
    fs.writeFileSync(activityPath(roleId), JSON.stringify(activity, null, 2));
}
export function updateActivity(roleId, output) {
    const activity = getActivity(roleId);
    if (!activity)
        return;
    activity.updatedAt = new Date().toISOString();
    activity.recentOutput = output.slice(-500);
    fs.writeFileSync(activityPath(roleId), JSON.stringify(activity, null, 2));
}
export function completeActivity(roleId) {
    const activity = getActivity(roleId);
    if (!activity)
        return;
    activity.status = 'done';
    activity.updatedAt = new Date().toISOString();
    fs.writeFileSync(activityPath(roleId), JSON.stringify(activity, null, 2));
}
export function clearActivity(roleId) {
    const filePath = activityPath(roleId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
export function getActivity(roleId) {
    const filePath = activityPath(roleId);
    if (!fs.existsSync(filePath))
        return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    catch {
        return null;
    }
}
export function getAllActivities() {
    ensureDir();
    const files = fs.readdirSync(ACTIVITY_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
        try {
            return JSON.parse(fs.readFileSync(path.join(ACTIVITY_DIR, f), 'utf-8'));
        }
        catch {
            return null;
        }
    }).filter((a) => a !== null);
}
