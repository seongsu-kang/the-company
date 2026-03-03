import { Router, Request, Response, NextFunction } from 'express';
import { readFile, fileExists, listFiles } from '../services/file-reader.js';
import { parseMarkdownTable } from '../services/markdown-parser.js';
import YAML from 'yaml';

export const rolesRouter = Router();

// GET /api/roles — Role 목록
rolesRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const content = readFile('roles/roles.md');
    const rows = parseMarkdownTable(content);

    const roles = rows.map(row => ({
      id: row.id ?? '',
      name: row.role ?? row.name ?? '',
      level: row.level ?? '',
      reportsTo: row.reports_to ?? '',
      status: row.상태 ?? row.status ?? '',
    }));

    res.json(roles);
  } catch (err) {
    next(err);
  }
});

// GET /api/roles/:id — Role 상세
rolesRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 기본 정보 (roles.md 테이블에서)
    const listContent = readFile('roles/roles.md');
    const rows = parseMarkdownTable(listContent);
    const roleRow = rows.find(r => r.id === id);

    if (!roleRow) {
      res.status(404).json({ error: `Role not found: ${id}` });
      return;
    }

    const role: Record<string, unknown> = {
      id: roleRow.id,
      name: roleRow.role ?? roleRow.name ?? '',
      level: roleRow.level ?? '',
      reportsTo: roleRow.reports_to ?? '',
      status: roleRow.상태 ?? roleRow.status ?? '',
      persona: '',
      authority: { autonomous: [] as string[], needsApproval: [] as string[] },
      journal: '',
    };

    // role.yaml에서 persona + authority 읽기
    const yamlPath = `roles/${id}/role.yaml`;
    if (fileExists(yamlPath)) {
      const raw = YAML.parse(readFile(yamlPath)) as Record<string, unknown>;
      if (raw.persona) role.persona = raw.persona;
      const auth = raw.authority as Record<string, string[]> | undefined;
      if (auth) {
        role.authority = {
          autonomous: auth.autonomous ?? [],
          needsApproval: auth.needs_approval ?? [],
        };
      }
    }

    // 오늘 저널 읽기
    const today = new Date().toISOString().slice(0, 10);
    const journalPath = `roles/${id}/journal/${today}.md`;
    if (fileExists(journalPath)) {
      role.journal = readFile(journalPath).slice(0, 3000);
    }

    res.json(role);
  } catch (err) {
    next(err);
  }
});
