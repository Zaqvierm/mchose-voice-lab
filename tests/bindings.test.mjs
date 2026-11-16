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
test("CFG parser rejects malformed directory and size", () => {
  assert.throws(() => configRecords(new Uint8Array(16)));
  assert.equal(supportsBindings({ profile: { id: "v9pro-1015" } }), false);
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
    const edits = [
      { button: "g", event: "triple", action: "connection" },
      { button: "mic", event: "five", action: "play" },
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
