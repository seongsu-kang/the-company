import { Router } from 'express';
import { readFile } from '../services/file-reader.js';
import { parseMarkdownTable, extractBoldKeyValues } from '../services/markdown-parser.js';
export const companyRouter = Router();
// GET /api/company — 회사 기본 정보
companyRouter.get('/', (_req, res, next) => {
    try {
        const companyContent = readFile('company/company.md');
        const kv = extractBoldKeyValues(companyContent);
        // blockquote에서 미션 추출
        const missionMatch = companyContent.match(/^>\s*(.+)/m);
        const mission = missionMatch ? missionMatch[1].trim() : '';
        // Role 목록
        const rolesContent = readFile('roles/roles.md');
        const roleRows = parseMarkdownTable(rolesContent);
        const roles = roleRows
            .filter(row => (row.id ?? '').toLowerCase() !== 'ceo')
            .map(row => ({
            id: row.id ?? '',
            name: row.role ?? row.name ?? '',
            level: row.level ?? '',
            reportsTo: row.reports_to ?? '',
            status: row.상태 ?? row.status ?? '',
        }));
        const company = {
            name: companyContent.split('\n').find(l => l.startsWith('# '))?.replace(/^#\s+/, '') ?? '',
            domain: kv['도메인'] ?? kv['domain'] ?? '',
            founded: kv['설립일'] ?? kv['founded'] ?? '',
            mission,
            roles,
        };
        res.json(company);
    }
    catch (err) {
        next(err);
    }
});
