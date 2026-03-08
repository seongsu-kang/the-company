/**
 * preferences.ts — .tycono/preferences.json 관리
 *
 * 캐릭터 외모, 오피스 테마 등 사용자 설정을 서버 파일로 영속화한다.
 * company-config.ts의 readConfig/writeConfig 패턴을 따른다.
 */
import fs from 'node:fs';
import path from 'node:path';
const CONFIG_DIR = '.tycono';
const PREFS_FILE = 'preferences.json';
const DEFAULT = { appearances: {}, theme: 'default' };
function prefsPath(companyRoot) {
    return path.join(companyRoot, CONFIG_DIR, PREFS_FILE);
}
/** Read preferences from .tycono/preferences.json. Returns defaults if missing. */
export function readPreferences(companyRoot) {
    const p = prefsPath(companyRoot);
    if (!fs.existsSync(p))
        return { ...DEFAULT, appearances: {} };
    try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return {
            appearances: data.appearances ?? {},
            theme: data.theme ?? 'default',
            speech: data.speech ?? undefined,
        };
    }
    catch {
        return { ...DEFAULT, appearances: {} };
    }
}
/** Write preferences to .tycono/preferences.json. Creates dir if needed. */
export function writePreferences(companyRoot, prefs) {
    const dir = path.join(companyRoot, CONFIG_DIR);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(prefsPath(companyRoot), JSON.stringify(prefs, null, 2) + '\n');
}
/** Merge partial preferences into existing. */
export function mergePreferences(companyRoot, partial) {
    const current = readPreferences(companyRoot);
    const merged = {
        appearances: partial.appearances !== undefined
            ? { ...current.appearances, ...partial.appearances }
            : current.appearances,
        theme: partial.theme ?? current.theme,
        speech: partial.speech !== undefined
            ? { ...current.speech, ...partial.speech }
            : current.speech,
    };
    writePreferences(companyRoot, merged);
    return merged;
}
