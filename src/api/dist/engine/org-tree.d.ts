export interface Authority {
    autonomous: string[];
    needsApproval: string[];
}
export interface KnowledgeAccess {
    reads: string[];
    writes: string[];
}
export interface OrgNode {
    id: string;
    name: string;
    level: 'c-level' | 'team-lead' | 'member';
    reportsTo: string;
    children: string[];
    persona: string;
    authority: Authority;
    knowledge: KnowledgeAccess;
    reports: {
        daily: string;
        weekly: string;
    };
    skills?: string[];
    model?: string;
}
export interface OrgTree {
    root: string;
    nodes: Map<string, OrgNode>;
}
export declare function buildOrgTree(companyRoot: string): OrgTree;
/** Direct reports */
export declare function getSubordinates(tree: OrgTree, roleId: string): string[];
/** All descendants (recursive) */
export declare function getDescendants(tree: OrgTree, roleId: string): string[];
/** Chain from role up to CEO: [roleId, ..., ceo] */
export declare function getChainOfCommand(tree: OrgTree, roleId: string): string[];
/** Can source dispatch a task to target? */
export declare function canDispatchTo(tree: OrgTree, source: string, target: string): boolean;
/** Refresh tree (re-read all role.yaml files) */
export declare function refreshOrgTree(companyRoot: string): OrgTree;
/** Get a human-readable org chart string for context injection */
export declare function formatOrgChart(tree: OrgTree, perspective?: string): string;
