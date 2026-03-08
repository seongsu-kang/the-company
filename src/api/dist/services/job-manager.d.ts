import { ActivityStream } from './activity-stream.js';
import type { ExecutionRunner } from '../engine/runners/types.js';
import type { RunnerResult } from '../engine/runners/types.js';
export type JobType = 'assign' | 'wave' | 'session-message';
export type JobStatus = 'running' | 'done' | 'error';
export interface Job {
    id: string;
    type: JobType;
    roleId: string;
    task: string;
    status: JobStatus;
    stream: ActivityStream;
    abort: () => void;
    parentJobId?: string;
    childJobIds: string[];
    createdAt: string;
    result?: RunnerResult;
    error?: string;
}
export interface JobInfo {
    id: string;
    type: JobType;
    roleId: string;
    task: string;
    status: JobStatus;
    parentJobId?: string;
    childJobIds: string[];
    createdAt: string;
}
export interface StartJobParams {
    type: JobType;
    roleId: string;
    task: string;
    sourceRole?: string;
    readOnly?: boolean;
    parentJobId?: string;
    model?: string;
}
declare class JobManager {
    private jobs;
    private runner;
    private nextId;
    private jobCreatedListeners;
    /** Replace the execution runner (e.g. after BYOK setup switches engine). */
    setRunner(newRunner: ExecutionRunner): void;
    /** Recreate runner from current env (call after EXECUTION_ENGINE changes). */
    refreshRunner(): void;
    /** Register a listener for new job creation. Returns unsubscribe function. */
    onJobCreated(listener: (job: Job) => void): () => void;
    /** Start a new execution job. Returns the Job immediately (fire-and-forget). */
    startJob(params: StartJobParams): Job;
    /** Get a job by ID (in-memory or reconstruct from file) */
    getJob(id: string): Job | undefined;
    /** Get job info (safe to serialize) */
    getJobInfo(id: string): JobInfo | undefined;
    /** List jobs with optional filter */
    listJobs(filter?: {
        status?: JobStatus;
        roleId?: string;
    }): JobInfo[];
    /** Abort a running job */
    abortJob(id: string): boolean;
    /** Get the active (running) job for a given role */
    getActiveJobForRole(roleId: string): Job | undefined;
}
export declare const jobManager: JobManager;
export {};
