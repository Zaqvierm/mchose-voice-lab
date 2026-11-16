import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import lzma from "lzma";
import vm from "node:vm";
import {
  configRecords,
  planBindings,
  buildBindings,
  unpackBindingApp,
  supportsBindings,
  BINDING_ACTIONS,
} from "../src/bindings.mjs";
import { openFactory, parseImage, sameBytes } from "../src/firmware.mjs";
const codec = {};
for (const method of ["compress", "decompress"])
  codec[method] = (data) =>
    new Promise((resolve, reject) => {
      const done = (value, error) =>
        error
          ? reject(error)
          : resolve(
              typeof value === "string"
                ? new TextEncoder().encode(value)
                : Uint8Array.from(value),
            );
      if (method === "compress") lzma.compress(Array.from(data), 6, done);
      else lzma.decompress(Array.from(data), done);
    });
function table() {
  const t = new Uint8Array(240);
  t.set([1, 11, 15, 0, 32, 0]);
  t.set([9, 7, 3, 0, 0, 4], 6);
  t.set([0x38, 7, 15, 0, 0, 64], 12);
  t.set([0x36, 7, 15, 0, 0, 16], 18);
  t.set([0x1d, 9, 3, 0, 0, 4], 24);
  return t;
}
test("binding planner preserves Power and rejects unavailable/duplicate gestures", () => {
  const t = table(),
    out = planBindings(t, [
      { button: "g", event: "triple", action: "connection" },
    ]);
  assert.deepEqual(out.slice(0, 6), t.slice(0, 6));
  assert(
    out.some(
      (v, i) =>
        i % 6 === 0 && v === 0x38 && out[i + 4] === 16 && out[i + 5] === 0,
    ),
  );
  for (const change of [
    { button: "power", event: "single", action: "play" },
    { button: "g", event: "single", action: "power" },
    { button: "mic", event: "seven", action: "play" },
    { button: "toString", event: "single", action: "play" },
    { button: "g", event: "constructor", action: "play" },
  ])
    assert.throws(() => planBindings(t, [change]));
  assert.throws(() =>
    planBindings(t, [
      { button: "g", event: "single", action: "play" },
      { button: "g", event: "single", action: "microphone" },
    ]),
  );
  const noPower = t.slice();
  noPower[0] = 0;
  assert.throws(() => planBindings(noPower, []), /Power/);
});

test("hidden actions use the immutable defaults without restoring old gestures", () => {
  const merged = table(),
    defaults = table();
  defaults.set([0x0b, 5, 3, 0, 0, 64], 30);
  assert.throws(() =>
    planBindings(merged, [{ button: "g", event: "triple", action: "next" }]),
  );
  const edited = planBindings(
    merged,
    [{ button: "g", event: "triple", action: "next" }],
    { offset: 2, size: 231 },
    defaults,
  );
  assert(
    edited.some(
      (v, i) =>
        i % 6 === 0 &&
        v === 0x0b &&
        edited[i + 1] === 7 &&
        edited[i + 4] === 16,
    ),
  );
  assert.deepEqual(edited.slice(0, 6), merged.slice(0, 6));
  assert(
    !edited.some((v, i) => i % 6 === 0 && v === 0x0b && edited[i + 1] === 5),
  );
});
test("CFG parser rejects malformed directory and size", () => {
  assert.throws(() => configRecords(new Uint8Array(16)));
  assert.equal(supportsBindings({ profile: { id: "v9pro-1015" } }), false);
});

test('published command registry and all three action dictionaries agree with the builder',async()=>{
  const registry=JSON.parse(await readFile(new URL('../public/key-commands.json',import.meta.url),'utf8'));
  assert.equal(registry.commands.length,56);assert.equal(new Set(registry.commands.map(c=>c.id)).size,56);
  assert.equal(registry.commands.filter(c=>!c.factoryAssigned).length,40);
  const choices=registry.commands.filter(c=>c.editorAction);
  assert.equal(choices.length,16);
  for(const c of choices)assert.equal(BINDING_ACTIONS[c.editorAction],c.id);
  assert.equal(registry.commands.find(c=>c.id===1).status,'protected');
  const {setLanguage,t}=await import('../src/i18n.mjs');
  for(const language of ['ru','en','zh']){setLanguage(language);for(const action of Object.keys(BINDING_ACTIONS))assert.notEqual(t('bindAction_'+action),'bindAction_'+action)}
});
test("browser worker speaks the documented postMessage protocol", async () => {
  const script = await readFile(
    new URL("../node_modules/lzma/src/lzma_worker.js", import.meta.url),
    "utf8",
  );
  const response = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("No worker response")),
      3000,
    );
    const sandbox = {
      onmessage: null,
      setTimeout,
      setImmediate,
      postMessage: (data) => {
        if (data.action !== 3) {
          clearTimeout(timer);
          resolve(data);
        }
      },
    };
    vm.runInNewContext(script, sandbox);
    sandbox.onmessage({
      data: { action: 1, data: [0, 255, 12, 34, 56], mode: 6, cbn: 123 },
    });
  });
  assert.equal(response.cbn, 123);
  assert.equal(response.action, 1);
  assert(response.result.length > 13);
  assert(!response.error);
  const source = await readFile(
    new URL("../src/lzma-browser.mjs", import.meta.url),
    "utf8",
  );
  assert(source.includes("lzma_worker.js?url"));
  assert(!source.includes("lzma_worker-min.js?url"));
});
const lab = process.env.X9_LAB_ROOT;
test(
  "private fixture: key no-op exact; custom keys reparse; instructions, power and pairing unchanged",
  { skip: !lab },
  async () => {
    const bytes = new Uint8Array(
        await readFile(join(lab, "official/headset-1003-en.bin")),
      ),
      f = await openFactory(bytes);
    const noop = await buildBindings(f, [], codec);
    assert(sameBytes(noop.image, bytes));
    const factoryRaw = await unpackBindingApp(
      parseImage(bytes).entries.find((e) => e.name === "app.bin").bytes,
      codec,
    );
    const { parseSdfs } = await import("../src/firmware.mjs");
    const cfg = parseSdfs(factoryRaw.raw.slice(0xbb774, 0xbb774 + 327552));
    const defaults = configRecords(
      cfg.find((e) => e.name === "defcfg.bin").bytes,
    ).find((r) => r.id === 12).bytes;
    const user = configRecords(
      cfg.find((e) => e.name === "usrcfg.bin").bytes,
    ).find((r) => r.id === 12);
    const merged = defaults.slice();
    merged.set(user.bytes, user.offset);
    for (const action of Object.keys(BINDING_ACTIONS)) {
      const planned = planBindings(
        merged,
        [{ button: "g", event: "triple", action }],
        user,
        defaults,
      );
      assert.deepEqual(planned.slice(0, 6), merged.slice(0, 6));
      assert(
        planned.some(
          (v, i) =>
            i % 6 === 0 &&
            v === BINDING_ACTIONS[action] &&
            planned[i + 1] === 7 &&
            planned[i + 4] === 16,
        ),
        action,
      );
    }
    const edits = [
      { button: "g", event: "triple", action: "next" },
      { button: "mic", event: "five", action: "previous" },
    ];
    const result = await buildBindings(f, edits, codec);
    assert(!sameBytes(result.image, bytes));
    const raw = await unpackBindingApp(
      parseImage(result.image).entries.find((e) => e.name === "app.bin").bytes,
      codec,
    );
    assert.equal(raw.raw.length, 1095413);
    assert(result.report.powerBindingsPreserved);
    assert(result.report.pairingAndTimingConfigurationPreserved);
    assert(result.report.executableInstructionsUnchanged);
    assert.equal(result.report.customBindingsHardwareTested, false);
    const voice = f.voices.find((v) => v.name === "V_POWON.act");
    const { buildFirmware } = await import("../src/firmware.mjs");
    const audio = await buildFirmware(f, "V_POWON.act", voice.bytes),
      combined = await buildBindings(f, edits, codec, audio);
    assert(sameBytes(result.image, combined.image));
    const sound = await buildFirmware(
      f,
      "V_POWON.act",
      f.voices.find((v) => v.name === "V_POWOFF.act").bytes,
    );
    const both = await buildBindings(f, edits, codec, sound);
    assert(
      sameBytes(
        parseImage(both.image).entries.find((e) => e.name === "tone.bin").bytes,
        parseImage(sound.image).entries.find((e) => e.name === "tone.bin")
          .bytes,
      ),
    );
    assert(both.report.appConfigurationChanged);
    assert(both.report.powerBindingsPreserved);
    const untrusted = structuredClone(f);
    untrusted.profile.id = "v9pro-1015"; // actual pinned bytes are re-opened, caller metadata is ignored
    const reopened = await buildBindings(untrusted, [], codec);
    assert(sameBytes(reopened.image, bytes));
  },
);
