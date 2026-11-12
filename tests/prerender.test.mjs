import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prerender,documentIds} from '../scripts/prerender.mjs';
import {setLanguage,t} from '../src/i18n.mjs';
test('prerender preserves split closing tags and escapes translated text',()=>{
  const input='<select id="model-select"></select\n><label data-i18n="label"></label\n><select id="firmware-language"></select><p data-i18n="note"></p>';
  const result=prerender(input,key=>({label:'Язык',note:'<unsafe> & text'})[key],['MCHOSE X9']);
  assert.deepEqual(documentIds(result),['firmware-language','model-select']);
  assert(result.includes('&lt;unsafe&gt; &amp; text'));
});
test('production template retains controls and contains indexable default content',async()=>{
  const input=await readFile('index.html','utf8'),catalog=JSON.parse(await readFile('public/catalog.json','utf8'));
  const models=[...new Set(catalog.firmwares.map(x=>x.model))];setLanguage('ru');
  const result=prerender(input,t,models);
  assert.deepEqual(documentIds(result),documentIds(input));
  assert(result.includes('MCHOSE G9 Pro'));assert(result.includes('Риск установки.'));
  assert(result.includes('id="firmware-language"'));
  assert(result.includes('https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select'));
});
