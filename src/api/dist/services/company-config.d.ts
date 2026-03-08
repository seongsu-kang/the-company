export interface CompanyConfig {
    engine: 'claude-cli' | 'direct-api';
    model?: string;
    apiKey?: string;
}
export declare const TYCONO_DIR = ".tycono";
/** Read config from .tycono/config.json. Returns defaults if missing. */
export declare function readConfig(companyRoot: string): CompanyConfig;
/** Write config to .tycono/config.json. Creates dir if needed. */
export declare function writeConfig(companyRoot: string, config: CompanyConfig): void;
/**
 * Load config and apply to process.env.
 * Called once at server startup.
 */
export declare function applyConfig(companyRoot: string): CompanyConfig;
