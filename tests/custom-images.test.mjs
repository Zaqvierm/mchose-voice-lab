import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import lzma from "lzma";
import { PROFILES } from "../src/profiles.mjs";
import { IMAGE_IDENTITIES } from "../src/image-identities.mjs";
import {
  openFactory,
  openEditable,
  scanFirmware,
  buildFirmware,
  parseImage,
  sameBytes,
  crc32,
  transform,
  sum32,
} from "../src/firmware.mjs";
import {
  buildBindings,
  bindingButtons,
  bindingActions,
  gestureActions,
  validateKeyTable,
  unpackBindingApp,
} from "../src/bindings.mjs";
const codec = {};
for (const method of ["compress", "decompress"])
  codec[method] = (data) =>
    new Promise((resolve, reject) => {
      const finish = (value, error) =>
        error
          ? reject(error)
          : resolve(
              typeof value === "string"
                ? new TextEncoder().encode(value)
                : Uint8Array.from(value),
            );
      if (method === "compress") lzma.compress(Array.from(data), 6, finish);
      else lzma.decompress(Array.from(data), finish);
    });
test("model policies preserve power while allowing Power clicks and reject unsafe keys", () => {
  assert.equal(IMAGE_IDENTITIES.length, 9);
  for (const meta of IMAGE_IDENTITIES) {
    const rows = Uint8Array.from(meta.stockRows.flat());
    validateKeyTable(rows, meta);
    const bad = rows.slice();
    bad[4] ^= 1;
    assert.throws(() => validateKeyTable(bad, meta), /Power/);
    assert.equal(meta.buttons.power, 11);
    assert.equal(
      new Set(Object.values(meta.buttons)).size,
      Object.keys(meta.buttons).length,
    );
  }
  assert.deepEqual(bindingButtons({ profile: { id: "g9pro-0026" } }), {
    power: 11,
    g: 3,
    mic: 2,
  });
  assert.deepEqual(bindingButtons({ profile: { id: "v9pro-0036" } }), {
    power: 11,
    mic: 2,
  });
  assert(
    !Object.hasOwn(bindingActions({ profile: { id: "v9pro-0036" } }), "rgb"),
  );
});
const fixtures = Boolean(process.env.X9_CATALOG_ROOT);
test(
  "private fixtures: all 9 custom-audio images accept bindings, preserve sounds and re-edit safely",
  { skip: !fixtures },
  async () => {
    for (const profile of PROFILES) {
      const input = new Uint8Array(
        await readFile(
          new URL("../public/firmware/" + profile.id + ".bin", import.meta.url),
        ),
      );
      const stock = await openFactory(input);
      const off = stock.voices.find((v) => v.name === "V_POWOFF.act");
      const custom = await buildFirmware(stock, "V_POWON.act", off.bytes);
      const loaded = await scanFirmware(custom.image, { codec });
      assert(loaded.canBuild, loaded.compatibilityError);
      assert(loaded.isCustom);
      assert.equal(loaded.profile.id, profile.id);
      assert(
        sameBytes(
          loaded.voices.find((v) => v.name === "V_POWON.act").bytes,
          off.bytes,
        ),
      );
      const bound = await buildBindings(
        loaded,
        [
          { button: "power", event: "single", action: "connection" },
          { button: "mic", event: "triple", action: "next" },
        ],
        codec,
      );
      const audioPart = (img) =>
        parseImage(img).entries.find((e) => e.name === "tone.bin").bytes;
      assert(
        sameBytes(audioPart(custom.image), audioPart(bound.image)),
        profile.id,
      );
      const reopen = await openEditable(bound.image, { codec });
      assert(reopen.isCustomApplication);
      assert(gestureActions(reopen, "power", "single").includes("connection"));
      assert(gestureActions(reopen, "mic", "triple").includes("next"));
      const noop = await buildBindings(reopen, [], codec);
      assert(sameBytes(noop.image, bound.image));
      const moreAudio = await buildFirmware(reopen, "V_MICON.act", off.bytes, {
        codec,
      });
      assert(
        sameBytes(
          parseImage(moreAudio.image).entries.find((e) => e.name === "app.bin")
            .bytes,
          parseImage(bound.image).entries.find((e) => e.name === "app.bin")
            .bytes,
        ),
      );
      const more = await openEditable(moreAudio.image, { codec });
      assert(
        sameBytes(
          more.voices.find((v) => v.name === "V_POWON.act").bytes,
          off.bytes,
        ),
      );
      const restored = await buildBindings(
        more,
        [{ button: "power", event: "single", action: "factory" }],
        codec,
      );
      const after = await openEditable(restored.image, { codec });
      assert.deepEqual(
        gestureActions(after, "power", "single"),
        gestureActions(after, "power", "single", true),
      );
      assert(gestureActions(after, "mic", "triple").includes("next"));
      assert(sameBytes(audioPart(restored.image), audioPart(moreAudio.image)));
    }
  },
);

// Independent integrity-valid corruptions: rejection must not depend on a broken outer CRC.
function container(source, replace) {
  const old = parseImage(source),
    encoder = new TextEncoder();
  const xml = old.xml.replace(/<partition>[\s\S]*?<\/partition>/g, (b) => {
    const name = b.match(/<file_name>([^<]+)<\/file_name>/)?.[1];
    const data = replace[name];
    if (!data) return b;
    return b
      .replace(
        /<file_size>[^<]+<\/file_size>/,
        "<file_size>0x" + data.length.toString(16) + "</file_size>",
      )
      .replace(
        /<checksum>[^<]+<\/checksum>/,
        "<checksum>0x" +
          crc32(data).toString(16).padStart(8, "0") +
          "</checksum>",
      );
  });
  const entries = old.entries.map((e) => ({
    ...e,
    bytes:
      replace[e.name] || (e.name === "ota.xml" ? encoder.encode(xml) : e.bytes),
  }));
  let length = 1024;
  for (const e of entries) {
    e.pos = Math.ceil(length / 512) * 512;
    length = e.pos + e.bytes.length;
  }
  const out = new Uint8Array(Math.ceil(length / 512) * 512);
  out.set(source.subarray(0, 1024));
  const d = new DataView(out.buffer);
  for (const e of entries) {
    out.set(e.bytes, e.pos);
    d.setUint32(e.record + 16, e.pos, true);
    d.setUint32(e.record + 20, e.bytes.length, true);
    d.setUint32(e.record + 28, crc32(e.bytes), true);
  }
  d.setUint32(20, out.length, true);
  d.setUint32(24, crc32(out.subarray(1024)), true);
  d.setUint32(4, crc32(out.subarray(8, 1024)), true);
  parseImage(out);
  return out;
}
async function forgeApp(input, meta, mutate) {
  const part = parseImage(input).entries.find((e) => e.name === "app.bin");
  const app = await unpackBindingApp(part.bytes, codec, meta);
  const raw = app.raw.slice();
  mutate(raw);
  const blocks = [];
  for (let i = 0; i < app.blocks.length; i++) {
    const data = raw.subarray(
      i * app.unit,
      Math.min((i + 1) * app.unit, raw.length),
    );
    if (sameBytes(data, app.chunks[i])) blocks.push(app.blocks[i]);
    else {
      const a = await codec.compress(data);
      const b = new Uint8Array(a.length - 8);
      b.set(app.blocks[i].subarray(0, 5));
      b.set(a.subarray(13), 5);
      blocks.push(b);
    }
  }
  const n =
      Math.ceil(
        (72 + blocks.length * 4 + blocks.reduce((v, b) => v + b.length, 0)) /
          32,
      ) * 32,
    packed = new Uint8Array(n);
  packed.set(app.data.subarray(0, 72));
  const d = new DataView(packed.buffer);
  let p = 72 + 4 * blocks.length;
  blocks.forEach((b, i) => {
    d.setUint32(72 + i * 4, b.length, true);
    packed.set(b, p);
    p += b.length;
  });
  d.setUint32(56, n - 64, true);
  d.setUint32(60, sum32(packed.subarray(64)), true);
  return container(input, { "app.bin": transform(packed, false) });
}
test(
  "private fixture: integrity-valid code, parameter and Power tampering are rejected",
  { skip: !fixtures },
  async () => {
    const meta = IMAGE_IDENTITIES.find((p) => p.id === "x9-1003"),
      base = new Uint8Array(
        await readFile(
          new URL("../public/firmware/x9-1003.bin", import.meta.url),
        ),
      );
    const param = parseImage(base)
      .entries.find((e) => e.name === "param.bin")
      .bytes.slice();
    param[100] ^= 1;
    await assert.rejects(
      openEditable(container(base, { "param.bin": param }), { codec }),
    );
    const code = await forgeApp(base, meta, (raw) => {
      raw[128] ^= 1;
    });
    await assert.rejects(
      openEditable(code, { codec }),
      /protected configuration|code/i,
    );
    const power = await forgeApp(base, meta, (raw) => {
      const fs = raw.subarray(meta.fsOffset, meta.fsOffset + meta.fsSize),
        dv = new DataView(fs.buffer, fs.byteOffset, fs.byteLength),
        count = dv.getUint32(12, true);
      let record;
      for (let i = 1; i <= count; i++) {
        const at = i * 32;
        const name = new TextDecoder()
          .decode(fs.subarray(at, at + 12))
          .split("\0")[0];
        if (name === "usrcfg.bin") record = at;
      }
      const off = dv.getUint32(record + 12, true),
        size = dv.getUint32(record + 16, true);
      fs[off + meta.userPatch.pos + 4 - meta.userPatch.offset] ^= 1;
      dv.setUint32(record + 28, sum32(fs.subarray(off, off + size)), true);
      dv.setUint32(24, sum32(fs.subarray(32, (count + 1) * 32)), true);
      dv.setUint32(28, sum32(fs.subarray((count + 1) * 32)), true);
    });
    await assert.rejects(openEditable(power, { codec }), /Power/);
    const inspected = await scanFirmware(power, { codec });
    assert.equal(inspected.canBuild, false);
  },
);
