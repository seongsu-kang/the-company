import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { Role } from '../types.js';

/**
 * Load a single role from the company's roles directory.
 */
export function loadRole(companyRoot: string, roleId: string): Role {
  const rolePath = join(companyRoot, 'roles', roleId, 'role.yaml');
  if (!existsSync(rolePath)) {
    throw new Error(`Role '${roleId}' not found at ${rolePath}`);
  }
  return yaml.load(readFileSync(rolePath, 'utf-8')) as Role;
}

/**
 * Load all roles from the company's roles directory.
 */
export function loadAllRoles(companyRoot: string): Role[] {
  const rolesDir = join(companyRoot, 'roles');
  if (!existsSync(rolesDir)) return [];

  const roles: Role[] = [];
  for (const entry of readdirSync(rolesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const yamlPath = join(rolesDir, entry.name, 'role.yaml');
    if (existsSync(yamlPath)) {
      roles.push(yaml.load(readFileSync(yamlPath, 'utf-8')) as Role);
    }
  }
  return roles.sort((a, b) => a.id.localeCompare(b.id));
}
