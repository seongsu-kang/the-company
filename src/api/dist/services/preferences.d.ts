export interface CharacterAppearance {
    skinColor: string;
    hairColor: string;
    shirtColor: string;
    pantsColor: string;
    shoeColor: string;
}
export interface SpeechSettings {
    /** 'template' = static pool only, 'llm' = AI generation, 'auto' = detect engine */
    mode: 'template' | 'llm' | 'auto';
    /** Interval between ambient speech in seconds */
    intervalSec: number;
    /** Daily budget for LLM speech in USD (0 = unlimited) */
    dailyBudgetUsd: number;
}
export interface Preferences {
    appearances: Record<string, CharacterAppearance>;
    theme: string;
    speech?: SpeechSettings;
}
/** Read preferences from .tycono/preferences.json. Returns defaults if missing. */
export declare function readPreferences(companyRoot: string): Preferences;
/** Write preferences to .tycono/preferences.json. Creates dir if needed. */
export declare function writePreferences(companyRoot: string, prefs: Preferences): void;
/** Merge partial preferences into existing. */
export declare function mergePreferences(companyRoot: string, partial: Partial<Preferences>): Preferences;
