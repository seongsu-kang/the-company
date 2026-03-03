import type { IncomingMessage, ServerResponse } from 'node:http';
import { COMPANY_ROOT } from '../services/file-reader.js';
import { getAllActivities, setActivity, updateActivity, completeActivity } from '../services/activity-tracker.js';
import { buildOrgTree, canDispatchTo } from '../engine/org-tree.js';
import { createRunner, type RunnerResult } from '../engine/runners/index.js';
import {
  getSession,
  addMessage,
  updateMessage,
  type Message,
} from '../services/session-store.js';

/* ─── Shared Runner instance ────────────────── */

const runner = createRunner();

/* ─── Active execution tracking ──────────────── */

interface Execution {
  id: string;
  roleId: string;
  task: string;
  status: 'running' | 'done' | 'error';
  startedAt: string;
  output: string;
  abort?: () => void;
}

const activeExecutions = new Map<string, Execution>();
const roleStatus = new Map<string, 'idle' | 'working' | 'done'>();

/* ─── Raw HTTP handler (Express 5 SSE 호환 문제 우회) ─── */

export function handleExecRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? '';
  const method = req.method ?? '';

  // Route dispatch
  // Session message: POST /api/exec/session/{id}/message
  const sessionMatch = url.match(/\/api\/exec\/session\/([^/]+)\/message$/);

  if (sessionMatch && method === 'POST') {
    readBody(req).then((body) => handleSessionMessage(sessionMatch[1], body, req, res));
  } else if (method === 'POST' && url.endsWith('/assign')) {
    readBody(req).then((body) => handleAssign(body, req, res));
  } else if (method === 'POST' && url.endsWith('/wave')) {
    readBody(req).then((body) => handleWave(body, req, res));
  } else if (method === 'GET' && url.endsWith('/status')) {
    handleStatus(res);
  } else if (method === 'POST' && url.endsWith('/activity')) {
    readBody(req).then((body) => handleActivity(body, res));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

/* ─── Body parser ────────────────────────────── */

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
  });
}

/* ─── SSE helpers ────────────────────────────── */

function sendSSE(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function startSSE(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
}

/* ─── POST /api/exec/assign ──────────────────── */

function handleAssign(body: Record<string, unknown>, req: IncomingMessage, res: ServerResponse): void {
  const roleId = body.roleId as string;
  const task = body.task as string;
  const sourceRole = (body.sourceRole as string) || 'ceo';
  const readOnly = body.readOnly === true;

  if (!roleId || !task) {
    jsonResponse(res, 400, { error: 'roleId and task are required' });
    return;
  }

  const orgTree = buildOrgTree(COMPANY_ROOT);

  if (!canDispatchTo(orgTree, sourceRole, roleId)) {
    jsonResponse(res, 403, {
      error: `${sourceRole} cannot dispatch to ${roleId}. Check organization hierarchy.`,
    });
    return;
  }

  startSSE(res);

  const execId = `exec-${Date.now()}`;
  roleStatus.set(roleId, 'working');
  setActivity(roleId, task);

  const execution: Execution = {
    id: execId, roleId, task,
    status: 'running',
    startedAt: new Date().toISOString(),
    output: '',
  };
  activeExecutions.set(execId, execution);

  sendSSE(res, 'start', { id: execId, roleId, task, sourceRole });

  const handle = runner.execute(
    { companyRoot: COMPANY_ROOT, roleId, task, sourceRole, orgTree, readOnly, model: orgTree.nodes.get(roleId)?.model },
    {
      onText: (text) => {
        execution.output += text;
        updateActivity(roleId, execution.output);
        sendSSE(res, 'output', { text });
      },
      onThinking: (text) => {
        sendSSE(res, 'thinking', { text });
      },
      onToolUse: (name, input) => {
        sendSSE(res, 'tool', { name, input: input ? summarizeInput(input) : undefined });
      },
      onDispatch: (subRoleId, subTask) => {
        roleStatus.set(subRoleId, 'working');
        setActivity(subRoleId, subTask);
        sendSSE(res, 'dispatch', { roleId: subRoleId, task: subTask });
      },
      onTurnComplete: (turn) => {
        sendSSE(res, 'turn', { turn });
      },
      onError: (error) => {
        sendSSE(res, 'stderr', { message: error });
      },
    },
  );

  execution.abort = handle.abort;

  handle.promise
    .then((result: RunnerResult) => {
      execution.status = 'done';
      roleStatus.set(roleId, 'idle');
      completeActivity(roleId);

      for (const d of result.dispatches) {
        roleStatus.set(d.roleId, 'idle');
        completeActivity(d.roleId);
      }

      sendSSE(res, 'done', {
        output: execution.output.slice(-1000),
        turns: result.turns,
        tokens: result.totalTokens,
        toolCalls: result.toolCalls.length,
        dispatches: result.dispatches.map((d) => ({ roleId: d.roleId, task: d.task })),
      });
      res.end();
    })
    .catch((err: Error) => {
      execution.status = 'error';
      roleStatus.set(roleId, 'idle');
      completeActivity(roleId);
      sendSSE(res, 'error', { message: err.message });
      res.end();
    });

  req.on('close', () => {
    if (execution.status === 'running') {
      execution.abort?.();
      execution.status = 'error';
      roleStatus.set(roleId, 'idle');
      completeActivity(roleId);
    }
  });
}

/* ─── POST /api/exec/wave ────────────────────── */

function handleWave(body: Record<string, unknown>, req: IncomingMessage, res: ServerResponse): void {
  const directive = body.directive as string;
  const target = (body.targetRole as string) || 'cto';

  if (!directive) {
    jsonResponse(res, 400, { error: 'directive is required' });
    return;
  }

  const orgTree = buildOrgTree(COMPANY_ROOT);

  if (!canDispatchTo(orgTree, 'ceo', target)) {
    jsonResponse(res, 403, {
      error: `CEO cannot dispatch to ${target}. Only direct reports (C-level) are valid wave targets.`,
    });
    return;
  }

  startSSE(res);

  const execId = `wave-${Date.now()}`;
  roleStatus.set(target, 'working');
  setActivity(target, `[CEO Wave] ${directive}`);

  sendSSE(res, 'start', { id: execId, directive, targetRole: target });

  const handle = runner.execute(
    {
      companyRoot: COMPANY_ROOT,
      roleId: target,
      task: `[CEO Wave] ${directive}`,
      sourceRole: 'ceo',
      orgTree,
      model: orgTree.nodes.get(target)?.model,
    },
    {
      onText: (text) => { sendSSE(res, 'output', { text }); },
      onThinking: (text) => { sendSSE(res, 'thinking', { text }); },
      onToolUse: (name, input) => {
        sendSSE(res, 'tool', { name, input: input ? summarizeInput(input) : undefined });
      },
      onDispatch: (subRoleId, subTask) => {
        roleStatus.set(subRoleId, 'working');
        setActivity(subRoleId, subTask);
        sendSSE(res, 'dispatch', { roleId: subRoleId, task: subTask });
      },
      onTurnComplete: (turn) => { sendSSE(res, 'turn', { turn }); },
      onError: (error) => { sendSSE(res, 'stderr', { message: error }); },
    },
  );

  handle.promise
    .then((result: RunnerResult) => {
      roleStatus.set(target, 'idle');
      completeActivity(target);
      for (const d of result.dispatches) {
        roleStatus.set(d.roleId, 'idle');
        completeActivity(d.roleId);
      }
      sendSSE(res, 'done', {
        output: result.output.slice(-1000),
        turns: result.turns,
        tokens: result.totalTokens,
        dispatches: result.dispatches.map((d) => ({ roleId: d.roleId, task: d.task })),
      });
      res.end();
    })
    .catch((err: Error) => {
      roleStatus.set(target, 'idle');
      completeActivity(target);
      sendSSE(res, 'error', { message: err.message });
      res.end();
    });

  req.on('close', () => {
    handle.abort();
    roleStatus.set(target, 'idle');
    completeActivity(target);
  });
}

/* ─── GET /api/exec/status ───────────────────── */

function handleStatus(res: ServerResponse): void {
  const statuses: Record<string, string> = {};

  for (const [roleId, status] of roleStatus) {
    statuses[roleId] = status;
  }

  const fileActivities = getAllActivities();
  for (const activity of fileActivities) {
    if (!statuses[activity.roleId] || statuses[activity.roleId] === 'idle') {
      statuses[activity.roleId] = activity.status;
    }
  }

  const memoryExecs = Array.from(activeExecutions.values())
    .filter((e) => e.status === 'running')
    .map(({ id, roleId, task, startedAt }) => ({ id, roleId, task, startedAt }));

  const fileExecs = fileActivities
    .filter((a) => a.status === 'working')
    .map((a) => ({
      id: `file-${a.roleId}`,
      roleId: a.roleId,
      task: a.currentTask,
      startedAt: a.startedAt,
    }));

  const memoryRoleIds = new Set(memoryExecs.map((e) => e.roleId));
  const mergedExecs = [
    ...memoryExecs,
    ...fileExecs.filter((e) => !memoryRoleIds.has(e.roleId)),
  ];

  jsonResponse(res, 200, { statuses, activeExecutions: mergedExecs });
}

/* ─── POST /api/exec/activity ────────────────── */

function handleActivity(body: Record<string, unknown>, res: ServerResponse): void {
  const roleId = body.roleId as string;
  const action = body.action as string;

  if (!roleId || !action) {
    jsonResponse(res, 400, { error: 'roleId and action are required' });
    return;
  }

  switch (action) {
    case 'start':
      setActivity(roleId, (body.task as string) ?? '');
      break;
    case 'update':
      updateActivity(roleId, (body.output as string) ?? '');
      break;
    case 'complete':
      completeActivity(roleId);
      break;
    default:
      jsonResponse(res, 400, { error: `Unknown action: ${action}` });
      return;
  }

  jsonResponse(res, 200, { ok: true });
}

/* ─── POST /api/exec/session/{id}/message ──── */

function handleSessionMessage(
  sessionId: string,
  body: Record<string, unknown>,
  req: IncomingMessage,
  res: ServerResponse,
): void {
  const session = getSession(sessionId);
  if (!session) {
    jsonResponse(res, 404, { error: 'Session not found' });
    return;
  }

  const content = body.content as string;
  const mode = (body.mode as 'talk' | 'do') ?? session.mode;
  if (!content) {
    jsonResponse(res, 400, { error: 'content is required' });
    return;
  }

  const roleId = session.roleId;
  const readOnly = mode === 'talk';

  // Authority check — Talk mode skips (CEO can chat with anyone)
  const orgTree = buildOrgTree(COMPANY_ROOT);
  if (mode === 'do' && !canDispatchTo(orgTree, 'ceo', roleId)) {
    jsonResponse(res, 403, { error: `CEO cannot dispatch to ${roleId}. Use Talk mode or dispatch via their manager.` });
    return;
  }

  // Add CEO message to session
  const ceoMsg: Message = {
    id: `msg-${Date.now()}-ceo`,
    from: 'ceo',
    content,
    type: mode === 'do' ? 'directive' : 'conversation',
    status: 'done',
    timestamp: new Date().toISOString(),
  };
  addMessage(sessionId, ceoMsg);

  // Build conversation context from history
  const contextWindow = buildConversationContext(session.messages, ceoMsg);
  const fullTask = contextWindow
    ? `${contextWindow}\n[Current Message]\nCEO: ${content}`
    : content;

  // Create role response message placeholder
  const roleMsg: Message = {
    id: `msg-${Date.now() + 1}-role`,
    from: 'role',
    content: '',
    type: 'conversation',
    status: 'streaming',
    timestamp: new Date().toISOString(),
  };
  addMessage(sessionId, roleMsg, true);

  // Start SSE
  startSSE(res);
  sendSSE(res, 'session', { sessionId, ceoMessageId: ceoMsg.id, roleMessageId: roleMsg.id });

  roleStatus.set(roleId, 'working');
  setActivity(roleId, content.slice(0, 80));

  const handle = runner.execute(
    { companyRoot: COMPANY_ROOT, roleId, task: fullTask, sourceRole: 'ceo', orgTree, readOnly, model: orgTree.nodes.get(roleId)?.model },
    {
      onText: (text) => {
        roleMsg.content += text;
        updateMessage(sessionId, roleMsg.id, { content: roleMsg.content });
        sendSSE(res, 'output', { text });
      },
      onThinking: (text) => {
        sendSSE(res, 'thinking', { text });
      },
      onToolUse: (name, input) => {
        sendSSE(res, 'tool', { name, input: input ? summarizeInput(input) : undefined });
      },
      onDispatch: (subRoleId, subTask) => {
        roleStatus.set(subRoleId, 'working');
        setActivity(subRoleId, subTask);
        sendSSE(res, 'dispatch', { roleId: subRoleId, task: subTask });
      },
      onTurnComplete: (turn) => {
        sendSSE(res, 'turn', { turn });
      },
      onError: (error) => {
        sendSSE(res, 'stderr', { message: error });
      },
    },
  );

  handle.promise
    .then((result: RunnerResult) => {
      updateMessage(sessionId, roleMsg.id, { content: roleMsg.content, status: 'done' });
      roleStatus.set(roleId, 'idle');
      completeActivity(roleId);
      for (const d of result.dispatches) {
        roleStatus.set(d.roleId, 'idle');
        completeActivity(d.roleId);
      }
      sendSSE(res, 'done', {
        roleMessageId: roleMsg.id,
        output: roleMsg.content.slice(-500),
        turns: result.turns,
        tokens: result.totalTokens,
      });
      res.end();
    })
    .catch((err: Error) => {
      updateMessage(sessionId, roleMsg.id, { status: 'error' });
      roleStatus.set(roleId, 'idle');
      completeActivity(roleId);
      sendSSE(res, 'error', { message: err.message });
      res.end();
    });

  req.on('close', () => {
    if (roleMsg.status === 'streaming') {
      handle.abort();
      updateMessage(sessionId, roleMsg.id, { status: 'error' });
      roleStatus.set(roleId, 'idle');
      completeActivity(roleId);
    }
  });
}

/* ─── Conversation context builder ─────────── */

function buildConversationContext(messages: Message[], currentMsg?: Message): string {
  const history = currentMsg
    ? messages.filter((m) => m.id !== currentMsg.id)
    : messages;

  if (history.length === 0) return '';

  let selected: Message[] = [];
  let totalChars = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    totalChars += msg.content.length;
    if (selected.length >= 10 || totalChars > 8000) break;
    selected.unshift(msg);
  }

  if (selected.length === 0) return '';

  const lines = selected.map((m) => {
    const speaker = m.from === 'ceo' ? 'CEO' : m.from.toUpperCase();
    return `${speaker}: ${m.content}`;
  });

  return `[Conversation History]\n${lines.join('\n')}\n`;
}

/* ─── Helpers ────────────────────────────────── */

function summarizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.length > 200) {
      summary[key] = value.slice(0, 200) + '...';
    } else {
      summary[key] = value;
    }
  }
  return summary;
}
