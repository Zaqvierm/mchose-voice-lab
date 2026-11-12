import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { crc32, sum32, transform, wrapAct, unwrapAct, parseAdts, parseImage, openFactory, buildFirmware, sameBytes, sha256, PROFILE } from '../src/firmware.mjs';

test('CRC32 and SDFS sum have known independent values', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  assert.equal(sum32(Uint8Array.from([1, 0, 0, 0, 2, 0, 0, 0, 255])), 3);
});
test('feedback transform reverses boundaries and partial blocks', () => {
  for (const n of [0, 1, 31, 32, 33, 1024]) {
    const plain = Uint8Array.from({ length: n }, (_, i) => (i * 73 + 17) & 255);
    assert.deepEqual(transform(transform(plain, false)), plain);
  }
});
test('ACT pairs, prefix, odd AAC padding and malformed frames', () => {
  // Synthetic ADTS header/payload. Tests structure only, not AAC audio decoding.
  for (const n of [12, 13]) {
    const aac = new Uint8Array(n); aac.set([255, 241, 96, 64, n >> 3, ((n & 7) << 5) | 31, 252]);
    const act = wrapAct(aac);
    assert.deepEqual([...act.subarray(0, 6)], [182, 249, 229, 247, 84, 104]);
    assert.deepEqual(unwrapAct(act).aac, aac);
    assert.equal(parseAdts(aac).frames[0].samples, 1024);
    assert.throws(() => unwrapAct(act.subarray(1)));
    const bad = act.slice(); bad[3] ^= 1; assert.throws(() => unwrapAct(bad));
    const stereo = aac.slice(); stereo[3] = 128; assert.throws(() => wrapAct(stereo));
  }
  assert.throws(() => parseImage(new Uint8Array(1024)));
});
const lab = process.env.X9_LAB_ROOT;
test('private fixture: all 36 factory ACTs roundtrip in JS', { skip: !lab }, async () => {
  let count = 0, frames = 0;
  for (const variant of ['headset-1003-en', 'headset-0038-cn']) {
    const folder = join(lab, 'decoded', variant, 'tone');
    for (const name of await readdir(folder)) if (name.endsWith('.act')) {
      const a = new Uint8Array(await readFile(join(folder, name))), unwrapped = unwrapAct(a);
      assert(sameBytes(wrapAct(unwrapped.aac), a)); count++; frames += unwrapped.frames.length;
    }
  }
  assert.equal(count, 36); assert.equal(frames, 648);
});
test('private fixture: original image rebuild is byte-identical', { skip: !lab }, async () => {
  const raw = new Uint8Array(await readFile(join(lab, 'official/headset-1003-en.bin'))), f = await openFactory(raw);
  const result = await buildFirmware(f, 'V_POWON.act', f.voices.find(v => v.name === 'V_POWON.act').bytes);
  assert(sameBytes(result.image, raw)); assert.equal(result.report.outputSha256, PROFILE.sha256);
  const corrupted = raw.slice(); corrupted[5000] ^= 1; await assert.rejects(openFactory(corrupted));
});
test('private fixture: JS matches hardware-tested Python firmware exactly', { skip: !lab }, async () => {
  const base = new Uint8Array(await readFile(join(lab, 'official/headset-1003-en.bin')));
  const actPath = join(lab, '../../outputs/MCHOSE-X9-ACT-AAC/V_POWON-Miku-AAC.act');
  const act = new Uint8Array(await readFile(actPath));
  const result = await buildFirmware(await openFactory(base), 'V_POWON.act', act);
  assert.equal(await sha256(result.image), 'e92501a68b7c7ca8b3d3434c454b7f8615068ee33d3b15017c41d4b7221478fb');
});
