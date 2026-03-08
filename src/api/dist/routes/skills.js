/**
 * skills.ts — Skill registry + Role-Skill management API
 */
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { COMPANY_ROOT } from '../services/file-reader.js';
import { getAvailableSkills } from '../services/scaffold.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const skillsRouter = Router();
/* ─── Skill Registry ─────────────────────── */
// GET /api/skills — Available skills (from templates + installed)
skillsRouter.get('/', (_req, res, next) => {
    try {
        // 1. Template skills (bundled with the product)
        const templateSkills = getAvailableSkills().map(s => ({
            ...s,
            source: 'template',
            installed: isSkillInstalled(s.id),
        }));
        // 2. Installed skills not in templates (user-added)
        const sharedDir = path.join(COMPANY_ROOT, '.claude', 'skills', '_shared');
        const installedIds = new Set(templateSkills.map(s => s.id));
        const userSkills = [];
        if (fs.existsSync(sharedDir)) {
            for (const entry of fs.readdirSync(sharedDir, { withFileTypes: true })) {
                if (!entry.isDirectory() || installedIds.has(entry.name))
                    continue;
                const skillMdPath = path.join(sharedDir, entry.name, 'SKILL.md');
                if (!fs.existsSync(skillMdPath))
                    continue;
                const content = fs.readFileSync(skillMdPath, 'utf-8');
                const meta = extractSkillMeta(content, entry.name);
                userSkills.push({ ...meta, source: 'user', installed: true });
            }
        }
        res.json([...templateSkills, ...userSkills]);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/skills/:id — Skill detail
skillsRouter.get('/:id', (req, res, next) => {
    try {
        const id = req.params.id;
        // Check installed first
        const installedPath = path.join(COMPANY_ROOT, '.claude', 'skills', '_shared', id, 'SKILL.md');
        if (fs.existsSync(installedPath)) {
            const content = fs.readFileSync(installedPath, 'utf-8');
            const meta = extractSkillMeta(content, id);
            res.json({ ...meta, installed: true, content });
            return;
        }
        // Check template
        const templateSkills = getAvailableSkills();
        const templateSkill = templateSkills.find(s => s.id === id);
        if (templateSkill) {
            res.json({ ...templateSkill, installed: false });
            return;
        }
        res.status(404).json({ error: `Skill not found: ${id}` });
    }
    catch (err) {
        next(err);
    }
});
/* ─── Role-Skill Management ─────────────── */
// GET /api/roles/:id/skills — Skills equipped to a role
skillsRouter.get('/role/:roleId', (req, res, next) => {
    try {
        const roleId = req.params.roleId;
        const skills = getRoleSkills(roleId);
        res.json(skills);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/roles/:id/skills — Equip a skill to a role
skillsRouter.post('/role/:roleId', (req, res, next) => {
    try {
        const roleId = req.params.roleId;
        const { skillId } = req.body;
        if (!skillId || typeof skillId !== 'string') {
            res.status(400).json({ error: 'skillId is required' });
            return;
        }
        // Verify skill exists (installed or template)
        if (!isSkillInstalled(skillId) && !isSkillInTemplate(skillId)) {
            res.status(404).json({ error: `Skill not found: ${skillId}` });
            return;
        }
        // Install skill if not already installed
        if (!isSkillInstalled(skillId)) {
            installSkillFromTemplate(skillId);
        }
        // Add to role.yaml skills array
        const yamlPath = path.join(COMPANY_ROOT, 'roles', roleId, 'role.yaml');
        if (!fs.existsSync(yamlPath)) {
            res.status(404).json({ error: `Role not found: ${roleId}` });
            return;
        }
        const raw = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'));
        const skills = raw.skills || [];
        if (skills.includes(skillId)) {
            res.json({ ok: true, message: 'Skill already equipped' });
            return;
        }
        skills.push(skillId);
        raw.skills = skills;
        fs.writeFileSync(yamlPath, YAML.stringify(raw));
        res.json({ ok: true, roleId, skillId, skills });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/roles/:roleId/skills/:skillId — Unequip a skill
skillsRouter.delete('/role/:roleId/:skillId', (req, res, next) => {
    try {
        const roleId = req.params.roleId;
        const skillId = req.params.skillId;
        const yamlPath = path.join(COMPANY_ROOT, 'roles', roleId, 'role.yaml');
        if (!fs.existsSync(yamlPath)) {
            res.status(404).json({ error: `Role not found: ${roleId}` });
            return;
        }
        const raw = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'));
        const skills = raw.skills || [];
        const idx = skills.indexOf(skillId);
        if (idx === -1) {
            res.json({ ok: true, message: 'Skill not equipped' });
            return;
        }
        skills.splice(idx, 1);
        raw.skills = skills.length > 0 ? skills : undefined;
        fs.writeFileSync(yamlPath, YAML.stringify(raw));
        res.json({ ok: true, roleId, skillId, skills });
    }
    catch (err) {
        next(err);
    }
});
/* ─── Helpers ────────────────────────────── */
function isSkillInstalled(skillId) {
    return fs.existsSync(path.join(COMPANY_ROOT, '.claude', 'skills', '_shared', skillId, 'SKILL.md'));
}
function isSkillInTemplate(skillId) {
    return getAvailableSkills().some(s => s.id === skillId);
}
function installSkillFromTemplate(skillId) {
    const srcDir = path.resolve(__dirname, '../../../../../templates/skills', skillId);
    const destDir = path.join(COMPANY_ROOT, '.claude', 'skills', '_shared', skillId);
    if (!fs.existsSync(srcDir))
        return;
    fs.mkdirSync(destDir, { recursive: true });
    const skillMdSrc = path.join(srcDir, 'SKILL.md');
    if (fs.existsSync(skillMdSrc)) {
        fs.copyFileSync(skillMdSrc, path.join(destDir, 'SKILL.md'));
    }
}
function getRoleSkills(roleId) {
    const yamlPath = path.join(COMPANY_ROOT, 'roles', roleId, 'role.yaml');
    if (!fs.existsSync(yamlPath))
        return [];
    const raw = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'));
    return raw.skills || [];
}
function extractSkillMeta(content, id) {
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
        return { id, name: id, description: '' };
    }
    try {
        const meta = YAML.parse(frontmatter[1]);
        return {
            id,
            name: meta.name || id,
            description: meta.description || '',
            ...(meta.tags ? { tags: meta.tags } : {}),
        };
    }
    catch {
        return { id, name: id, description: '' };
    }
}
