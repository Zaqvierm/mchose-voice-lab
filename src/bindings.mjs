// X9 EN 1003 only. Configuration edits, never instruction patches.
import {
  openFactory,
  parseImage,
  parseSdfs,
  transform,
  sha256,
  sameBytes,
  sum32,
  crc32,
} from "./firmware.mjs";
const need = (ok, message) => {
  if (!ok) throw new Error(message);
};
const dv = (a) => new DataView(a.buffer, a.byteOffset, a.byteLength);
const u32 = (a, p) => dv(a).getUint32(p, true);
const put = (a, p, v) => dv(a).setUint32(p, v >>> 0, true);
const align = (n, a) => Math.ceil(n / a) * a;
const text = new TextDecoder(),
  enc = new TextEncoder();
const FS = 0xbb774,
  FS_SIZE = 327552,
  RAW_SHA = "4538318bfe55538caf702ad7e83de03a74160914a466bdfb96c65334e17a5338";
export const BINDING_BUTTONS = Object.freeze({ g: 7, mic: 9 });
export const BINDING_EVENTS = Object.freeze({
  single: 0x400,
  double: 0x4000,
  triple: 0x10,
  four: 8,
  five: 4,
  hold: 0x1000,
});
export const BINDING_ACTIONS = Object.freeze({
  play: 9,
  connection: 0x38,
  soundMode: 0x36,
  microphone: 0x1d,
});
export const supportsBindings = (f) => f?.profile?.id === "x9-1003";

export function configRecords(bytes) {
  need(
    bytes.length >= 16 && text.decode(bytes.subarray(0, 8)) === "CFG\0VER\0",
    "Unsupported CFG",
  );
  need(dv(bytes).getUint16(12, true) === bytes.length, "CFG size mismatch");
  const count = dv(bytes).getUint16(14, true);
  let pos = 16 + count * 4;
  need(count <= 256 && pos <= bytes.length, "CFG directory");
  const records = [];
  for (let i = 0; i < count; i++) {
    const v = u32(bytes, 16 + i * 4),
      id = v & 255,
      offset = (v >>> 8) & 4095,
      size = v >>> 20;
    need(pos + size <= bytes.length, "CFG bounds");
    records.push({
      id,
      offset,
      size,
      pos,
      bytes: bytes.slice(pos, pos + size),
    });
    pos += size;
  }
  need(pos === bytes.length, "CFG trailing data");
  return records;
}
function tableInfo(raw) {
  const fs = raw.slice(FS, FS + FS_SIZE),
    resources = parseSdfs(fs);
  const defaults = resources.find((e) => e.name === "defcfg.bin"),
    user = resources.find((e) => e.name === "usrcfg.bin");
  need(defaults && user, "Missing key configuration");
  const d = configRecords(defaults.bytes).filter((r) => r.id === 12),
    u = configRecords(user.bytes).filter((r) => r.id === 12);
  need(
    d.length === 1 &&
      d[0].offset === 0 &&
      d[0].size === 240 &&
      u.length === 1 &&
      u[0].offset === 2 &&
      u[0].size === 231,
    "Unknown key table layout",
  );
  const merged = d[0].bytes.slice();
  merged.set(u[0].bytes, u[0].offset);
  return { fs, resources, user, patch: u[0], merged };
}
export function planBindings(table, changes, patch = { offset: 2, size: 231 }) {
  need(
    table.length === 240 && Array.isArray(changes) && changes.length <= 12,
    "Invalid key edits",
  );
  const out = table.slice(),
    seen = new Set();
  for (const change of changes) {
    const key = BINDING_BUTTONS[change.button],
      event = BINDING_EVENTS[change.event],
      action = BINDING_ACTIONS[change.action];
    need(key && event && action, "Unsupported button, event or action");
    const pair = key + ":" + event;
    need(!seen.has(pair), "Duplicate key gesture");
    seen.add(pair);
    const source = Array.from({ length: 40 }, (_, i) =>
      table.slice(i * 6, i * 6 + 6),
    ).find((r) => r[0] === action);
    need(source, "Unknown factory action");
    // Retain common 0x3a hooks. Replace only the explicit action for this gesture.
    for (let i = 0; i < 240; i += 6)
      if (
        out[i] &&
        out[i] !== 0x3a &&
        out[i + 1] === key &&
        dv(out).getUint16(i + 4, true) === event
      )
        out[i] = 0;
    let slot = -1;
    for (let i = 0; i < 240; i += 6)
      if (!out[i] && i >= patch.offset && i + 6 <= patch.offset + patch.size) {
        slot = i;
        break;
      }
    need(slot >= 0, "No editable key slots");
    out.set(source, slot);
    out[slot + 1] = key;
    dv(out).setUint16(slot + 4, event, true);
  }
  for (let i = 0; i < 240; i += 6) {
    if (
      table[i + 1] === 11 ||
      out[i + 1] === 11 ||
      table[i] === 1 ||
      out[i] === 1
    )
      need(
        sameBytes(table.subarray(i, i + 6), out.subarray(i, i + 6)),
        "Protected Power binding changed",
      );
    if (!sameBytes(table.subarray(i, i + 6), out.subarray(i, i + 6)))
      need(
        i >= patch.offset && i + 6 <= patch.offset + patch.size,
        "Edit outside user key table",
      );
  }
  need(
    Array.from({ length: 40 }, (_, i) => i * 6).some(
      (i) => out[i] === 1 && out[i + 1] === 11,
    ),
    "Missing Power action",
  );
  return out;
}
export async function unpackBindingApp(encrypted, codec) {
  const data = transform(encrypted);
  need(
    text.decode(data.subarray(0, 8)) === "ACTHHTCA" &&
      u32(data, 56) === data.length - 64 &&
      u32(data, 60) === sum32(data.subarray(64)),
    "Application checksum",
  );
  const count = u32(data, 64),
    unit = u32(data, 68);
  need(count === 15 && unit === 73728, "Unknown application chunks");
  let pos = 72 + count * 4;
  const blocks = [],
    chunks = [];
  for (let i = 0; i < count; i++) {
    const n = u32(data, 72 + i * 4);
    need(n >= 6 && pos + n <= data.length, "Application chunk bounds");
    const block = data.slice(pos, pos + n);
    need(
      block[0] === 0x5d && u32(block, 1) <= 0x1000000,
      "Unexpected LZMA properties",
    );
    const size = i === count - 1 ? 1095413 - unit * (count - 1) : unit;
    const alone = new Uint8Array(block.length + 8);
    alone.set(block.subarray(0, 5));
    dv(alone).setBigUint64(5, BigInt(size), true);
    alone.set(block.subarray(5), 13);
    const decoded = await codec.decompress(alone);
    need(decoded.length === size, "LZMA output size");
    blocks.push(block);
    chunks.push(decoded);
    pos += n;
  }
  const raw = new Uint8Array(1095413);
  chunks.forEach((c, i) => raw.set(c, i * unit));
  return { data, raw, blocks, chunks, unit };
}
async function packApp(app, raw, codec) {
  const blocks = [];
  for (let i = 0; i < app.blocks.length; i++) {
    const next = raw.subarray(
      i * app.unit,
      Math.min((i + 1) * app.unit, raw.length),
    );
    if (sameBytes(next, app.chunks[i])) {
      blocks.push(app.blocks[i]);
      continue;
    }
    const alone = await codec.compress(next);
    need(alone[0] === 0x5d && alone.length > 13, "Invalid LZMA encoder output");
    // Raw payload + the factory properties; the encoder's smaller dictionary is compatible.
    const block = new Uint8Array(alone.length - 8);
    block.set(app.blocks[i].subarray(0, 5));
    block.set(alone.subarray(13), 5);
    blocks.push(block);
  }
  const size = align(
    72 + blocks.length * 4 + blocks.reduce((n, b) => n + b.length, 0),
    32,
  );
  need(size <= 0xa9000, "Application exceeds the smaller factory system slot");
  const data = new Uint8Array(size);
  data.set(app.data.subarray(0, 72));
  let pos = 72 + blocks.length * 4;
  blocks.forEach((b, i) => {
    put(data, 72 + i * 4, b.length);
    data.set(b, pos);
    pos += b.length;
  });
  put(data, 56, data.length - 64);
  put(data, 60, sum32(data.subarray(64)));
  return transform(data, false);
}
function replaceApp(image, bytes) {
  const parsed = parseImage(image);
  let changed = false;
  const xml = parsed.xml.replace(
    /<partition>[\s\S]*?<\/partition>/g,
    (block) => {
      if (!block.includes("<file_name>app.bin</file_name>")) return block;
      changed = true;
      return block
        .replace(
          /(<file_size>0x)[0-9a-fA-F]+(<\/file_size>)/,
          (_, a, b) => a + bytes.length.toString(16) + b,
        )
        .replace(
          /(<checksum>0x)[0-9a-fA-F]+(<\/checksum>)/,
          (_, a, b) => a + crc32(bytes).toString(16).padStart(8, "0") + b,
        );
    },
  );
  need(changed, "Missing application OTA descriptor");
  const payloads = parsed.entries.map((e) => ({
    ...e,
    bytes:
      e.name === "app.bin"
        ? bytes
        : e.name === "ota.xml"
          ? enc.encode(xml)
          : e.bytes,
  }));
  let size = 1024;
  for (const e of payloads) {
    e.next = align(size, 512);
    size = e.next + e.bytes.length;
  }
  const result = new Uint8Array(align(size, 512));
  result.set(image.subarray(0, 1024));
  for (const e of payloads) {
    result.set(e.bytes, e.next);
    put(result, e.record + 16, e.next);
    put(result, e.record + 20, e.bytes.length);
    put(result, e.record + 28, crc32(e.bytes));
  }
  put(result, 20, result.length);
  put(result, 24, crc32(result.subarray(1024)));
  put(result, 4, crc32(result.subarray(8, 1024)));
  return result;
}
export async function buildBindings(
  factory,
  changes,
  codec,
  audioBuild = null,
) {
  const original = await openFactory(factory.image);
  need(supportsBindings(original), "Bindings support X9 EN 1003 only");
  const source = original.entries.find((e) => e.name === "app.bin"),
    app = await unpackBindingApp(source.bytes, codec);
  need((await sha256(app.raw)) === RAW_SHA, "Unknown application program");
  const info = tableInfo(app.raw),
    planned = planBindings(info.merged, changes, info.patch);
  const user = info.user.bytes.slice();
  user.set(
    planned.subarray(info.patch.offset, info.patch.offset + info.patch.size),
    info.patch.pos,
  );
  const raw = app.raw.slice(),
    fs = info.fs.slice();
  fs.set(user, info.user.offset);
  put(fs, info.user.record + 28, sum32(user));
  const end = (info.resources.length + 1) * 32;
  put(fs, 24, sum32(fs.subarray(32, end)));
  put(fs, 28, sum32(fs.subarray(end)));
  raw.set(fs, FS);
  // An empty edit must not recompress the factory application.
  const encrypted = sameBytes(raw, app.raw)
    ? source.bytes
    : await packApp(app, raw, codec);
  const baseImage = audioBuild?.image || original.image,
    base = parseImage(baseImage);
  for (const e of original.entries)
    if (!["tone.bin", "ota.xml"].includes(e.name))
      need(
        sameBytes(
          e.bytes,
          base.entries.find((x) => x.name === e.name)?.bytes ||
            new Uint8Array(),
        ),
        "Untrusted combined image",
      );
  const image = sameBytes(encrypted, source.bytes)
      ? baseImage.slice()
      : replaceApp(baseImage, encrypted),
    parsed = parseImage(image);
  for (const e of base.entries)
    if (!["app.bin", "ota.xml"].includes(e.name))
      need(
        sameBytes(
          e.bytes,
          parsed.entries.find((x) => x.name === e.name)?.bytes ||
            new Uint8Array(),
        ),
        "Unrelated partition changed",
      );
  const verified = await unpackBindingApp(
    parsed.entries.find((e) => e.name === "app.bin").bytes,
    codec,
  );
  need(sameBytes(verified.raw, raw), "Application rebuild mismatch");
  const after = tableInfo(verified.raw);
  need(sameBytes(after.merged, planned), "Final key map mismatch");
  need(
    sameBytes(app.raw.subarray(0, FS), verified.raw.subarray(0, FS)),
    "Executable instructions changed",
  );
  for (const e of info.resources)
    need(
      sameBytes(
        after.resources.find((x) => x.name === e.name).bytes,
        e.name === "usrcfg.bin" ? user : e.bytes,
      ),
      "Unrelated application resource changed",
    );
  const report = {
    ...(audioBuild?.report || {}),
    model: original.profile.model,
    baseVersion: original.profile.version,
    baseSha256: original.profile.sha256,
    target: audioBuild?.report.target || "bindings",
    capacity: original.capacity,
    toneBytes: base.entries.find((e) => e.name === "tone.bin").size,
    outputSha256: await sha256(image),
    imageBytes: image.length,
    bindings: changes.map((c) => ({ ...c })),
    powerBindingsPreserved: true,
    pairingAndTimingConfigurationPreserved: true,
    executableInstructionsUnchanged: true,
    programBootParametersUnchanged: sameBytes(raw, app.raw),
    otherApplicationResourcesUnchanged: true,
    bootAndParametersUnchanged: true,
    appConfigurationChanged: !sameBytes(raw, app.raw),
    checksumsVerified: true,
    customBindingsHardwareTested: false,
    deviceFlashed: false,
  };
  return { image, report };
}
