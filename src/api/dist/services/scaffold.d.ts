export interface ScaffoldConfig {
    companyName: string;
    description: string;
    apiKey?: string;
    team: 'startup' | 'research' | 'agency' | 'custom';
    projectRoot: string;
    existingProjectPath?: string;
    knowledgePaths?: string[];
}
interface TeamRole {
    id: string;
    name: string;
    level: string;
    reportsTo: string;
    persona: string;
    defaultSkills?: string[];
}
export declare function loadTeam(teamName: string): TeamRole[];
export declare function getAvailableTeams(): string[];
export interface SkillMeta {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    tags: string[];
    category: string;
    compatibleRoles: string[];
    dependencies: string[];
    files: string[];
}
/**
 * Get available skills from the template registry
 */
export declare function getAvailableSkills(): SkillMeta[];
export declare function scaffold(config: ScaffoldConfig): string[];
export {};
