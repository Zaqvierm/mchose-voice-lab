import { readFile, writeFile } from 'node:fs/promises';
import { setLanguage, t } from '../src/i18n.mjs';
import { prerender } from './prerender.mjs';
setLanguage('ru');
const catalog=JSON.parse(await readFile('public/catalog.json','utf8'));
const models=[...new Set(catalog.firmwares.filter(x=>x.kind==='headset').map(x=>x.model))];
const result=prerender(await readFile('dist/index.html','utf8'),t,models);
await writeFile('dist/index.html',result);
console.log(`Prerendered UI content; application IDs preserved; ${models.length} model names.`);
