/**
 * speech.ts — Ambient Speech LLM generation endpoint
 *
 * Generates contextual, persona-driven speech for idle roles.
 * Uses Haiku for cost efficiency (~$0.0003/call).
 */
import { Router, Request, Response, NextFunction } from 'express';
import { COMPANY_ROOT } from '../services/file-reader.js';
import { buildOrgTree } from '../engine/index.js';
import { AnthropicProvider } from '../engine/llm-adapter.js';

export const speechRouter = Router();

// Lazy-init LLM provider (Haiku for cost efficiency)
let llm: AnthropicProvider | null = null;
function getLLM(): AnthropicProvider {
  if (!llm) {
    llm = new AnthropicProvider({
      model: process.env.SPEECH_MODEL || 'claude-haiku-4-5-20251001',
    });
  }
  return llm;
}

/**
 * POST /api/speech/generate
 *
 * Body: { roleId, context?: string, relationships?: Array<{ partnerId, familiarity }> }
 * Returns: { speech: string, tokens: { input: number, output: number } }
 */
speechRouter.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleId, context, relationships } = req.body as {
      roleId: string;
      context?: string;
      relationships?: Array<{ partnerId: string; partnerName: string; familiarity: number }>;
    };

    if (!roleId) {
      res.status(400).json({ error: 'roleId is required' });
      return;
    }

    // Build org tree to get persona
    const tree = buildOrgTree(COMPANY_ROOT);
    const node = tree.nodes.get(roleId);
    if (!node) {
      res.status(404).json({ error: `Role not found: ${roleId}` });
      return;
    }

    const persona = node.persona || `${node.name} (${node.level})`;
    const relContext = relationships?.length
      ? `\nColleague relationships:\n${relationships.map(r =>
          `- ${r.partnerName}: familiarity ${r.familiarity}/100`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are ${node.name}, a ${node.level} employee at a tech company.
Your persona: ${persona}

Generate a brief, natural idle thought or mumble (1 sentence, max 30 characters in Korean).
This is what you'd say to yourself while sitting at your desk.
It should reflect your personality, current concerns, or professional interests.
Do NOT use quotes. Just output the raw sentence.
${relContext}
${context ? `\nCurrent situation: ${context}` : ''}`;

    const provider = getLLM();
    const response = await provider.chat(
      systemPrompt,
      [{ role: 'user', content: 'Generate one idle thought.' }],
    );

    const text = response.content
      .filter(c => c.type === 'text')
      .map(c => (c as { type: 'text'; text: string }).text)
      .join('')
      .trim()
      .replace(/^["']|["']$/g, ''); // strip quotes if LLM adds them

    res.json({
      speech: text,
      tokens: response.usage,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/speech/conversation
 *
 * Body: { roleA, roleB, familiarity, context? }
 * Returns: { turns: Array<{ speaker: string, text: string }>, tokens }
 */
speechRouter.post('/conversation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleA, roleB, familiarity, context } = req.body as {
      roleA: string;
      roleB: string;
      familiarity: number;
      context?: string;
    };

    if (!roleA || !roleB) {
      res.status(400).json({ error: 'roleA and roleB are required' });
      return;
    }

    const tree = buildOrgTree(COMPANY_ROOT);
    const nodeA = tree.nodes.get(roleA);
    const nodeB = tree.nodes.get(roleB);
    if (!nodeA || !nodeB) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    const famLevel = familiarity >= 80 ? 'best friends'
      : familiarity >= 50 ? 'close colleagues'
      : familiarity >= 20 ? 'coworkers'
      : 'barely acquainted';

    const relation = nodeA.reportsTo === roleB ? `${nodeA.name} reports to ${nodeB.name}`
      : nodeB.reportsTo === roleA ? `${nodeB.name} reports to ${nodeA.name}`
      : nodeA.level === 'c-level' && nodeB.level === 'c-level' ? 'C-level peers'
      : 'colleagues';

    const systemPrompt = `Generate a short office conversation between two employees (2-3 turns, each turn max 25 Korean characters).

${nodeA.name} (${nodeA.level}): ${nodeA.persona || 'a professional'}
${nodeB.name} (${nodeB.level}): ${nodeB.persona || 'a professional'}

They are ${relation}. Familiarity level: ${famLevel} (${familiarity}/100).
${context ? `Context: ${context}` : ''}

Output as JSON array: [{"speaker":"A","text":"..."},{"speaker":"B","text":"..."}]
No markdown, no quotes around the JSON. Just the array.`;

    const provider = getLLM();
    const response = await provider.chat(
      systemPrompt,
      [{ role: 'user', content: 'Generate the conversation.' }],
    );

    const raw = response.content
      .filter(c => c.type === 'text')
      .map(c => (c as { type: 'text'; text: string }).text)
      .join('')
      .trim();

    let turns: Array<{ speaker: string; text: string }>;
    try {
      turns = JSON.parse(raw);
    } catch {
      // Fallback: try to extract JSON from markdown code block
      const match = raw.match(/\[[\s\S]*\]/);
      turns = match ? JSON.parse(match[0]) : [
        { speaker: 'A', text: '...' },
        { speaker: 'B', text: '...' },
      ];
    }

    res.json({
      turns,
      tokens: response.usage,
    });
  } catch (err) {
    next(err);
  }
});
