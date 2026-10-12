import { copyFile, readFile, writeFile } from 'node:fs/promises';

const entryPath = new URL('../dist/types/index.d.ts', import.meta.url);
const ambientSourcePath = new URL('../src/lib/svelte-components.d.ts', import.meta.url);
const ambientOutputPath = new URL('../dist/types/svelte-components.d.ts', import.meta.url);
const entry = await readFile(entryPath, 'utf8');
const sourceReference = '../../src/lib/svelte-components.d.ts';

if (!entry.includes(sourceReference)) {
	throw new Error('Expected generated Svelte component declaration reference was not found');
}

await writeFile(entryPath, entry.replace(sourceReference, './svelte-components.d.ts'));
await copyFile(ambientSourcePath, ambientOutputPath);
