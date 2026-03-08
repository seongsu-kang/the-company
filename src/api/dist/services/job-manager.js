import { COMPANY_ROOT } from './file-reader.js';
import { ActivityStream } from './activity-stream.js';
import { buildOrgTree } from '../engine/org-tree.js';
import { createRunner } from '../engine/runners/index.js';
import { setActivity, updateActivity, completeActivity } from './activity-tracker.js';
/* ─── Helpers ────────────────────────────── */
function summarizeInput(input) {
    const summary = {};
    for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string' && value.length > 200) {
            summary[key] = value.slice(0, 200) + '...';
        }
        else {
            summary[key] = value;
        }
    }
    return summary;
}
/* ─── JobManager Singleton ───────────────── */
class JobManager {
    jobs = new Map();
    runner = createRunner();
    nextId = 1;
    jobCreatedListeners = new Set();
    /** Replace the execution runner (e.g. after BYOK setup switches engine). */
    setRunner(newRunner) {
        this.runner = newRunner;
    }
    /** Recreate runner from current env (call after EXECUTION_ENGINE changes). */
    refreshRunner() {
        this.runner = createRunner();
    }
    /** Register a listener for new job creation. Returns unsubscribe function. */
    onJobCreated(listener) {
        this.jobCreatedListeners.add(listener);
        return () => { this.jobCreatedListeners.delete(listener); };
    }
    /** Start a new execution job. Returns the Job immediately (fire-and-forget). */
    startJob(params) {
        const jobId = `job-${Date.now()}-${this.nextId++}`;
        const orgTree = buildOrgTree(COMPANY_ROOT);
        const stream = new ActivityStream(jobId, params.roleId, params.parentJobId);
        const job = {
            id: jobId,
            type: params.type,
            roleId: params.roleId,
            task: params.task,
            status: 'running',
            stream,
            abort: () => { },
            parentJobId: params.parentJobId,
            childJobIds: [],
            createdAt: new Date().toISOString(),
        };
        this.jobs.set(jobId, job);
        // Emit job:start
        stream.emit('job:start', params.roleId, {
            jobId,
            type: params.type,
            task: params.task,
            sourceRole: params.sourceRole ?? 'ceo',
        });
        // Set activity tracker
        setActivity(params.roleId, params.task);
        const model = params.model ?? orgTree.nodes.get(params.roleId)?.model;
        // Build team status snapshot: which roles are currently busy
        const teamStatus = {};
        for (const [, j] of this.jobs) {
            if (j.status === 'running' && j.id !== jobId) {
                teamStatus[j.roleId] = { status: 'working', task: j.task };
            }
        }
        const handle = this.runner.execute({
            companyRoot: COMPANY_ROOT,
            roleId: params.roleId,
            task: params.task,
            sourceRole: params.sourceRole ?? 'ceo',
            orgTree,
            readOnly: params.readOnly,
            model,
            jobId,
            teamStatus,
        }, {
            onText: (text) => {
                updateActivity(params.roleId, text);
                stream.emit('text', params.roleId, { text });
            },
            onThinking: (text) => {
                stream.emit('thinking', params.roleId, { text });
            },
            onToolUse: (name, input) => {
                stream.emit('tool:start', params.roleId, {
                    name,
                    input: input ? summarizeInput(input) : undefined,
                });
            },
            onDispatch: (subRoleId, subTask) => {
                // Create child job for the dispatch
                const childJob = this.startJob({
                    type: 'assign',
                    roleId: subRoleId,
                    task: subTask,
                    sourceRole: params.roleId,
                    parentJobId: jobId,
                });
                job.childJobIds.push(childJob.id);
                stream.emit('dispatch:start', params.roleId, {
                    targetRoleId: subRoleId,
                    task: subTask,
                    childJobId: childJob.id,
                });
            },
            onTurnComplete: (turn) => {
                stream.emit('turn:complete', params.roleId, { turn });
            },
            onError: (error) => {
                stream.emit('stderr', params.roleId, { message: error });
            },
        });
        job.abort = handle.abort;
        // Notify listeners
        for (const listener of this.jobCreatedListeners) {
            try {
                listener(job);
            }
            catch { /* ignore */ }
        }
        handle.promise
            .then((result) => {
            job.status = 'done';
            job.result = result;
            completeActivity(params.roleId);
            for (const d of result.dispatches) {
                completeActivity(d.roleId);
            }
            stream.emit('job:done', params.roleId, {
                output: result.output.slice(-1000),
                turns: result.turns,
                tokens: result.totalTokens,
                toolCalls: result.toolCalls.length,
                dispatches: result.dispatches.map((d) => ({ roleId: d.roleId, task: d.task })),
            });
        })
            .catch((err) => {
            job.status = 'error';
            job.error = err.message;
            completeActivity(params.roleId);
            stream.emit('job:error', params.roleId, { message: err.message });
        });
        return job;
    }
    /** Get a job by ID (in-memory or reconstruct from file) */
    getJob(id) {
        return this.jobs.get(id);
    }
    /** Get job info (safe to serialize) */
    getJobInfo(id) {
        const job = this.jobs.get(id);
        if (!job) {
            // Check if we have a JSONL file for it (historical)
            if (ActivityStream.exists(id)) {
                const events = ActivityStream.readAll(id);
                const startEvent = events.find(e => e.type === 'job:start');
                const doneEvent = events.find(e => e.type === 'job:done');
                const errorEvent = events.find(e => e.type === 'job:error');
                const dispatchEvents = events.filter(e => e.type === 'dispatch:start');
                if (startEvent) {
                    return {
                        id,
                        type: (startEvent.data.type ?? 'assign'),
                        roleId: startEvent.roleId,
                        task: startEvent.data.task ?? '',
                        status: doneEvent ? 'done' : errorEvent ? 'error' : 'done',
                        parentJobId: startEvent.data.parentJobId,
                        childJobIds: dispatchEvents.map(e => e.data.childJobId).filter(Boolean),
                        createdAt: startEvent.ts,
                    };
                }
            }
            return undefined;
        }
        return {
            id: job.id,
            type: job.type,
            roleId: job.roleId,
            task: job.task,
            status: job.status,
            parentJobId: job.parentJobId,
            childJobIds: job.childJobIds,
            createdAt: job.createdAt,
        };
    }
    /** List jobs with optional filter */
    listJobs(filter) {
        const result = [];
        for (const job of this.jobs.values()) {
            if (filter?.status && job.status !== filter.status)
                continue;
            if (filter?.roleId && job.roleId !== filter.roleId)
                continue;
            result.push({
                id: job.id,
                type: job.type,
                roleId: job.roleId,
                task: job.task,
                status: job.status,
                parentJobId: job.parentJobId,
                childJobIds: job.childJobIds,
                createdAt: job.createdAt,
            });
        }
        return result;
    }
    /** Abort a running job */
    abortJob(id) {
        const job = this.jobs.get(id);
        if (!job || job.status !== 'running')
            return false;
        job.abort();
        job.status = 'error';
        job.error = 'Aborted by user';
        completeActivity(job.roleId);
        job.stream.emit('job:error', job.roleId, { message: 'Aborted by user' });
        return true;
    }
    /** Get the active (running) job for a given role */
    getActiveJobForRole(roleId) {
        for (const job of this.jobs.values()) {
            if (job.roleId === roleId && job.status === 'running') {
                return job;
            }
        }
        return undefined;
    }
}
/* ─── Export singleton ───────────────────── */
export const jobManager = new JobManager();
