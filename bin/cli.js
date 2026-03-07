#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve tsx using createRequire from THIS file's location
// This traverses up node_modules correctly for both local and npx flat installs
const require = createRequire(import.meta.url);
const tsxApiPath = pathToFileURL(require.resolve('tsx/esm/api')).href;
const tsx = await import(tsxApiPath);
tsx.register();

// Now we can import .ts files
const entryPath = pathToFileURL(join(__dirname, 'tycono.ts')).href;
const { main } = await import(entryPath);
await main(process.argv.slice(2));
