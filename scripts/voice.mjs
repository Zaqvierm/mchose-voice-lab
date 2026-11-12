import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { wrapAct, unwrapAct } from '../src/firmware.mjs';
const [mode, source, target] = process.argv.slice(2);
if (!['wrap', 'unwrap'].includes(mode) || !source || !target || resolve(source) === resolve(target)) {
  console.error('Usage: node scripts/voice.mjs wrap|unwrap INPUT OUTPUT (different paths)'); process.exit(1);
}
const input = new Uint8Array(await readFile(source));
const result = mode === 'wrap' ? wrapAct(input) : unwrapAct(input).aac;
await writeFile(target, result); console.log(`${result.length} bytes written`);
