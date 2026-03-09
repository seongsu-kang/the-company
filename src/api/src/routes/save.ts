import { Router, Request, Response, NextFunction } from 'express';
import { COMPANY_ROOT } from '../services/file-reader.js';
import { getGitStatus, gitSave, gitHistory, gitRestore, gitInit, gitFetchStatus, gitPull } from '../services/git-save.js';
import type { RepoType } from '../services/git-save.js';

export const saveRouter = Router();

/** Extract repo type from query param, default 'akb' */
function getRepo(req: Request): RepoType {
  const repo = req.query.repo;
  return repo === 'code' ? 'code' : 'akb';
}

// GET /api/save/status?repo=akb|code
saveRouter.get('/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(getGitStatus(COMPANY_ROOT, getRepo(req)));
  } catch (err) {
    next(err);
  }
});

// POST /api/save?repo=akb|code — commit + push
saveRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body ?? {};
    const result = gitSave(COMPANY_ROOT, message, getRepo(req));
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Error && err.message === 'No changes to save') {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// GET /api/save/history?repo=akb|code
saveRouter.get('/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json(gitHistory(COMPANY_ROOT, limit, getRepo(req)));
  } catch (err) {
    next(err);
  }
});

// POST /api/save/init — initialize git repo
saveRouter.post('/init', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = gitInit(COMPANY_ROOT);
    if (!result.ok) {
      res.status(500).json({ error: result.message });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/save/restore
saveRouter.post('/restore', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sha, paths } = req.body ?? {};
    if (!sha || typeof sha !== 'string') {
      res.status(400).json({ error: 'sha is required' });
      return;
    }
    const result = gitRestore(COMPANY_ROOT, sha, paths);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/save/sync-status?repo=akb|code — fetch + ahead/behind
saveRouter.get('/sync-status', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(gitFetchStatus(COMPANY_ROOT, getRepo(req)));
  } catch (err) {
    next(err);
  }
});

// POST /api/save/pull?repo=akb|code — safe pull (ff-only)
saveRouter.post('/pull', (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = gitPull(COMPANY_ROOT, getRepo(req));
    const statusCode = result.status === 'ok' || result.status === 'up-to-date' ? 200
      : result.status === 'dirty' || result.status === 'diverged' ? 409
      : result.status === 'no-remote' ? 404
      : 500;
    res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
});
