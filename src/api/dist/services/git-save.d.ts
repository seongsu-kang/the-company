export interface GitStatus {
    dirty: boolean;
    modified: string[];
    untracked: string[];
    lastCommit: {
        sha: string;
        message: string;
        date: string;
    } | null;
    branch: string;
    hasRemote: boolean;
    synced: boolean;
    noGit: boolean;
}
export interface SaveResult {
    commitSha: string;
    message: string;
    filesChanged: number;
    pushed: boolean;
    pushError?: string;
}
export interface CommitInfo {
    sha: string;
    shortSha: string;
    message: string;
    date: string;
}
export interface RestoreResult {
    commitSha: string;
    restoredFiles: string[];
}
/** Get current git status. Returns noGit=true if not a git repo. */
export declare function getGitStatus(root: string): GitStatus;
/** Commit + push save-tracked files */
export declare function gitSave(root: string, message?: string): SaveResult;
/** Get commit history */
export declare function gitHistory(root: string, limit?: number): CommitInfo[];
/** Restore files from a previous commit (non-destructive: creates new commit) */
export declare function gitRestore(root: string, sha: string, paths?: string[]): RestoreResult;
