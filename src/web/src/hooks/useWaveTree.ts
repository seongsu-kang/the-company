import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityEvent, OrgNode } from '../types';
import type { StreamStatus } from './useActivityStream';

export type WaveNodeStatus = 'waiting' | 'running' | 'done' | 'error' | 'not-dispatched' | 'awaiting_input';

export interface WaveNode {
  jobId: string | null;
  sessionId?: string | null;
  roleId: string;
  roleName: string;
  children: string[];
  status: WaveNodeStatus;
  events: ActivityEvent[];
  streamStatus: StreamStatus;
}

interface UseWaveTreeResult {
  nodes: Map<string, WaveNode>;
  selectedRoleId: string | null;
  selectNode: (roleId: string) => void;
  progress: { done: number; total: number; running: number; awaitingInput: number };
  allDone: boolean;
  connectStream: (jobId: string, roleId: string, sessionId?: string) => void;
}

interface StreamState {
  controller: AbortController;
  lastSeq: number;
}

export default function useWaveTree(
  rootJobs: Array<{ jobId: string; roleId: string; roleName?: string; sessionId?: string }>,
  orgNodes: Record<string, OrgNode>,
  rootRoleId: string,
): UseWaveTreeResult {
  const [nodes, setNodes] = useState<Map<string, WaveNode>>(new Map());
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const streamsRef = useRef<Map<string, StreamState>>(new Map());
  const nodesRef = useRef<Map<string, WaveNode>>(nodes);
  nodesRef.current = nodes;

  // Build initial tree from org nodes
  useEffect(() => {
    if (!rootRoleId || Object.keys(orgNodes).length === 0) return;

    const initial = new Map<string, WaveNode>();

    // Add all org nodes under CEO
    const addNode = (roleId: string) => {
      const org = orgNodes[roleId];
      if (!org) return;
      initial.set(roleId, {
        jobId: null,
        roleId,
        roleName: org.name,
        children: org.children,
        status: 'waiting',
        events: [],
        streamStatus: 'idle',
      });
      org.children.forEach(addNode);
    };

    // Start from CEO's direct children (c-level)
    const root = orgNodes[rootRoleId];
    if (root) {
      // Add CEO node itself (dimmed)
      initial.set(rootRoleId, {
        jobId: null,
        roleId: rootRoleId,
        roleName: 'CEO',
        children: root.children,
        status: 'not-dispatched',
        events: [],
        streamStatus: 'idle',
      });
      root.children.forEach(addNode);
    }

    // Map root jobs to their role nodes
    for (const rj of rootJobs) {
      const node = initial.get(rj.roleId);
      if (node) {
        node.jobId = rj.jobId;
        node.sessionId = rj.sessionId;
        node.status = 'running';
        node.streamStatus = 'connecting';
      }
    }

    setNodes(initial);
    if (rootJobs.length > 0) {
      setSelectedRoleId(rootJobs[0].roleId);
    }
  }, [rootJobs, orgNodes, rootRoleId]);

  // Connect SSE for a job (SCA-012: prefer session-based stream)
  const connectStream = useCallback((jobId: string, roleId: string, sessionId?: string) => {
    console.log(`[WaveTree] connectStream → role=${roleId} job=${jobId} session=${sessionId ?? 'none'}`);
    // Cleanup existing stream for this jobId
    const streamKey = sessionId ?? jobId;
    const existing = streamsRef.current.get(streamKey);
    if (existing) {
      existing.controller.abort();
    }

    const controller = new AbortController();
    const state: StreamState = { controller, lastSeq: -1 };
    streamsRef.current.set(streamKey, state);

    const fromSeq = 0;
    // SCA-012: prefer session stream, fall back to job stream
    const url = sessionId
      ? `/api/sessions/${sessionId}/stream?from=${fromSeq}`
      : `/api/jobs/${jobId}/stream?from=${fromSeq}`;

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          setNodes((prev) => {
            const next = new Map(prev);
            const node = next.get(roleId);
            if (node) next.set(roleId, { ...node, streamStatus: 'error' });
            return next;
          });
          return;
        }

        setNodes((prev) => {
          const next = new Map(prev);
          const node = next.get(roleId);
          if (node) next.set(roleId, { ...node, streamStatus: 'streaming', status: 'running' });
          return next;
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (currentEvent === 'activity') {
                  const event = data as ActivityEvent;
                  if (event.seq > state.lastSeq) {
                    state.lastSeq = event.seq;
                  }

                  setNodes((prev) => {
                    const next = new Map(prev);
                    const node = next.get(roleId);
                    if (!node) return prev;
                    // Dedup
                    if (node.events.some(e => e.seq === event.seq)) return prev;

                    const updated = { ...node, events: [...node.events, event] };

                    // Handle dispatch:start — connect child SSE
                    if (event.type === 'dispatch:start' && event.data.childJobId) {
                      const childJobId = event.data.childJobId as string;
                      const targetRoleId = (event.data.targetRoleId as string) ?? (event.data.roleId as string);

                      console.log(`[WaveTree] dispatch:start → target=${targetRoleId} childJob=${childJobId} from=${roleId}/${jobId}`);

                      if (targetRoleId) {
                        const childNode = next.get(targetRoleId);
                        if (childNode) {
                          next.set(targetRoleId, {
                            ...childNode,
                            jobId: childJobId,
                            status: 'running',
                            streamStatus: 'connecting',
                          });
                          // Schedule child stream connection
                          setTimeout(() => connectStream(childJobId, targetRoleId), 0);
                        } else {
                          console.warn(`[WaveTree] dispatch:start — no node found for role "${targetRoleId}"`);
                        }
                      }
                    }

                    if (event.type === 'job:done') {
                      console.log(`[WaveTree] job:done → role=${roleId} job=${jobId}`);
                      updated.status = 'done';
                      updated.streamStatus = 'done';
                    } else if (event.type === 'job:error') {
                      console.log(`[WaveTree] job:error → role=${roleId} job=${jobId}`);
                      updated.status = 'error';
                      updated.streamStatus = 'error';
                    } else if (event.type === 'job:awaiting_input') {
                      console.log(`[WaveTree] job:awaiting_input → role=${roleId} job=${jobId}`);
                      updated.status = 'awaiting_input';
                      updated.streamStatus = 'done';
                    } else if (event.type === 'job:reply') {
                      console.log(`[WaveTree] job:reply → role=${roleId} job=${jobId}`);
                      // Will get a new child job via dispatch or continuation
                      updated.status = 'running';
                      updated.streamStatus = 'streaming';
                    }

                    next.set(roleId, updated);
                    return next;
                  });
                } else if (currentEvent === 'stream:end') {
                  const reason = data.reason as string;
                  console.log(`[WaveTree] stream:end → role=${roleId} job=${jobId} reason=${reason}`);
                  // 'replied' means CEO responded — new stream will take over, don't change status
                  if (reason !== 'replied') {
                    setNodes((prev) => {
                      const next = new Map(prev);
                      const node = next.get(roleId);
                      if (!node) return prev;
                      const finalStatus = reason === 'error' ? 'error'
                        : reason === 'awaiting_input' ? 'awaiting_input'
                        : 'done';
                      next.set(roleId, {
                        ...node,
                        status: node.status === 'running' ? (finalStatus as WaveNodeStatus) : node.status,
                        streamStatus: finalStatus === 'error' ? 'error' : 'done',
                      });
                      return next;
                    });
                  }
                }
              } catch { /* skip malformed */ }
              currentEvent = '';
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setNodes((prev) => {
          const next = new Map(prev);
          const node = next.get(roleId);
          if (node) next.set(roleId, { ...node, streamStatus: 'error' });
          return next;
        });
      });
  }, []);

  // Start SSE streams for root jobs
  useEffect(() => {
    if (rootJobs.length === 0) return;

    for (const rj of rootJobs) {
      connectStream(rj.jobId, rj.roleId, rj.sessionId);
    }

    return () => {
      for (const [, stream] of streamsRef.current) {
        stream.controller.abort();
      }
      streamsRef.current.clear();
    };
  }, [rootJobs, connectStream]);

  // Mark nodes as not-dispatched when all jobs are done
  const progress = (() => {
    let done = 0;
    let running = 0;
    let awaitingInput = 0;
    let total = 0;
    for (const [id, node] of nodes) {
      if (id === rootRoleId) continue; // skip CEO
      total++;
      if (node.status === 'done') done++;
      else if (node.status === 'running') running++;
      else if (node.status === 'awaiting_input') awaitingInput++;
    }
    return { done, total, running, awaitingInput };
  })();

  const allDone = progress.total > 0 && progress.running === 0 && progress.awaitingInput === 0 &&
    Array.from(nodes.values()).every(n => n.status !== 'running' && n.status !== 'awaiting_input' && n.streamStatus !== 'streaming' && n.streamStatus !== 'connecting');

  // When all done, mark remaining 'waiting' as 'not-dispatched'
  useEffect(() => {
    if (!allDone) return;
    setNodes((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const [id, node] of next) {
        if (node.status === 'waiting') {
          next.set(id, { ...node, status: 'not-dispatched' });
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allDone]);

  return {
    nodes,
    selectedRoleId,
    selectNode: setSelectedRoleId,
    progress,
    allDone,
    connectStream,
  };
}
