// Profile-specific configuration edits. Never patch executable instructions.
import {
  openEditable,
  parseImage,
  parseSdfs,
  transform,
  sha256,
  sameBytes,
  sum32,
  crc32,
} from "./firmware.mjs";
import { IMAGE_IDENTITIES } from "./image-identities.mjs";
const need = (ok, message) => {
  if (!ok) throw new Error(message);
};
const dv = (a) => new DataView(a.buffer, a.byteOffset, a.byteLength);
const u32 = (a, p) => dv(a).getUint32(p, true);
const put = (a, p, v) => dv(a).setUint32(p, v >>> 0, true);
const align = (n, a) => Math.ceil(n / a) * a;
const text = new TextDecoder(),
  enc = new TextEncoder();
export const BINDING_BUTTONS = Object.freeze({ g: 7, mic: 9, power: 11 });
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
  previous: 0x0a,
  next: 0x0b,
  volumeUp: 0x10,
  volumeDown: 0x11,
  callVolumeUp: 0x14,
  callVolumeDown: 0x15,
  answer: 0x16,
  reject: 0x17,
  hangup: 0x18,
  assistantStart: 0x1f,
  assistantStop: 0x20,
  rgb: 0x2c,
  connection: 0x38,
  soundMode: 0x36,
  microphone: 0x1d,
});
export const bindingIdentity = (f) =>
  IMAGE_IDENTITIES.find((p) => p.id === f?.profile?.id);
export const supportsBindings = (f) => Boolean(bindingIdentity(f));
export const bindingButtons = (f) => bindingIdentity(f)?.buttons || {};
export const bindingActions = (f) => bindingIdentity(f)?.actions || {};
export function gestureActions(f, button, event, stock = false) {
  const meta = bindingIdentity(f);
  if (!meta) return [];
  const rows = stock ? meta.stockRows : f.bindingRows || meta.stockRows,
    key = meta.buttons[button];
  const values = rows.filter(
    (r) =>
      r[0] &&
      r[0] !== 0x3a &&
      r[1] === key &&
      (button === "power" && event === "hold"
        ? r[0] === 1
        : (r[4] | (r[5] << 8)) === BINDING_EVENTS[event]),
  );
  return values.map((r) =>
    r[0] === 1
      ? "power"
      : Object.keys(meta.actions).find((k) => meta.actions[k] === r[0]) ||
        "service",
  );
}

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
function tableInfo(raw, meta) {
  const fs = raw.slice(meta.fsOffset, meta.fsOffset + meta.fsSize),
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
      u[0].offset === meta.userPatch.offset &&
      u[0].size === meta.userPatch.size &&
      u[0].pos === meta.userPatch.pos,
    "Unknown key table layout",
  );
  const merged = d[0].bytes.slice();
  merged.set(u[0].bytes, u[0].offset);
  return { fs, resources, user, patch: u[0], merged, defaults: d[0].bytes };
}
export function planBindings(
  table,
  changes,
  patch = { offset: 2, size: 231 },
  defaults = table,
  policy = { buttons: BINDING_BUTTONS, actions: BINDING_ACTIONS, stock: table },
) {
  need(
    table.length === 240 && Array.isArray(changes) && changes.length <= 12,
    "Invalid key edits",
  );
  const out = table.slice(),
    seen = new Set();
  for (const change of changes) {
    need(
      Object.hasOwn(policy.buttons, change.button) &&
        Object.hasOwn(BINDING_EVENTS, change.event) &&
        (change.action === "factory" ||
          Object.hasOwn(policy.actions, change.action)),
      "Unsupported button, event or action",
    );
    const key = policy.buttons[change.button],
      event = BINDING_EVENTS[change.event],
      action = policy.actions[change.action];
    need(
      key && event && (action || change.action === "factory"),
      "Unsupported button, event or action",
    );
    need(
      !(key === policy.buttons.power && change.event === "hold"),
      "Protected Power hold",
    );
    const pair = key + ":" + event;
    need(!seen.has(pair), "Duplicate key gesture");
    seen.add(pair);
    need(defaults.length === 240, "Invalid default key table");
    const source = Array.from({ length: 80 }, (_, i) =>
      (i < 40 ? table : defaults).slice((i % 40) * 6, (i % 40) * 6 + 6),
    ).find((r) => r[0] === action);
    let sources;
    if (change.action === "factory") {
      sources = Array.from({ length: 40 }, (_, i) =>
        policy.stock.slice(i * 6, i * 6 + 6),
      ).filter(
        (r) =>
          r[0] &&
          r[0] !== 0x3a &&
          r[1] === key &&
          dv(r).getUint16(4, true) === event,
      );
      const current = Array.from({ length: 40 }, (_, i) =>
        out.slice(i * 6, i * 6 + 6),
      ).filter(
        (r) =>
          r[0] &&
          r[0] !== 0x3a &&
          r[1] === key &&
          dv(r).getUint16(4, true) === event,
      );
      const signature = (rows) =>
        rows
          .map((r) => Array.from(r).join(","))
          .sort()
          .join(";");
      if (signature(current) === signature(sources)) continue;
    } else {
      need(source, "Unknown factory action");
      sources = [source];
    }
    // Retain common 0x3a hooks. Replace only the explicit action for this gesture.
    for (let i = 0; i < 240; i += 6)
      if (
        out[i] &&
        out[i] !== 0x3a &&
        out[i + 1] === key &&
        dv(out).getUint16(i + 4, true) === event
      )
        out[i] = 0;
    for (const template of sources) {
      let slot = -1;
      for (let i = 0; i < 240; i += 6)
        if (
          !out[i] &&
          i >= patch.offset &&
          i + 6 <= patch.offset + patch.size
        ) {
          slot = i;
          break;
        }
      need(slot >= 0, "No editable key slots");
      out.set(template, slot);
      out[slot + 1] = key;
      dv(out).setUint16(slot + 4, event, true);
    }
  }
  for (let i = 0; i < 240; i += 6) {
    if (table[i] === 1 || out[i] === 1 || table[i] === 0x3a || out[i] === 0x3a)
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
      (i) => out[i] === 1 && out[i + 1] === policy.buttons.power,
    ),
    "Missing Power action",
  );
  return out;
}
export async function unpackBindingApp(
  encrypted,
  codec,
  meta = IMAGE_IDENTITIES.find((p) => p.id === "x9-1003"),
) {
  const data = transform(encrypted);
  need(
    text.decode(data.subarray(0, 8)) === "ACTHHTCA" &&
      u32(data, 56) === data.length - 64 &&
      u32(data, 60) === sum32(data.subarray(64)),
    "Application checksum",
  );
  const count = u32(data, 64),
    unit = u32(data, 68);
  need(
    count === meta.chunkCount && unit === meta.unit,
    "Unknown application chunks",
  );
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
    const size = i === count - 1 ? meta.rawSize - unit * (count - 1) : unit;
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
  const raw = new Uint8Array(meta.rawSize);
  chunks.forEach((c, i) => raw.set(c, i * unit));
  return { data, raw, blocks, chunks, unit };
}
async function packApp(app, raw, codec, meta) {
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
  need(
    size <= meta.appCapacity,
    "Application exceeds the smaller factory system slot",
  );
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
export function validateKeyTable(table, meta) {
  const stock = Uint8Array.from(meta.stockRows.flat()),
    allowed = new Set(Object.values(meta.actions)),
    keys = new Set(Object.values(meta.buttons));
  need(table.length === stock.length, "Unknown key table length");
  for (let i = 0; i < table.length; i += 6) {
    const row = table.subarray(i, i + 6),
      before = stock.subarray(i, i + 6);
    if (
      before[0] === 1 ||
      row[0] === 1 ||
      before[0] === 0x3a ||
      row[0] === 0x3a
    )
      need(sameBytes(row, before), "Protected Power or common event changed");
    if (
      sameBytes(row, before) ||
      !row[0] ||
      meta.stockRows.some((r) => sameBytes(row, Uint8Array.from(r)))
    )
      continue;
    const event = dv(row).getUint16(4, true);
    need(
      keys.has(row[1]) &&
        allowed.has(row[0]) &&
        Object.values(BINDING_EVENTS).includes(event),
      "Unsupported custom key binding",
    );
    need(
      !(row[1] === meta.buttons.power && event === BINDING_EVENTS.hold),
      "Protected Power hold",
    );
    need(
      [...meta.stockRows, ...meta.defaultRows].some(
        (t) => t[0] === row[0] && t[2] === row[2] && t[3] === row[3],
      ),
      "Unknown action context",
    );
  }
  need(
    meta.stockRows.some(
      (r, i) =>
        r[0] === 1 &&
        sameBytes(table.subarray(i * 6, i * 6 + 6), Uint8Array.from(r)),
    ),
    "Missing Power action",
  );
}
export async function validateBindingApplication(encrypted, meta, codec) {
  need(codec, "Application codec required");
  const app = await unpackBindingApp(encrypted, codec, meta),
    info = tableInfo(app.raw, meta),
    canonical = app.raw.slice();
  const start = meta.fsOffset + info.user.offset + info.patch.pos;
  canonical.fill(0, start, start + info.patch.size);
  canonical.fill(
    0,
    meta.fsOffset + info.user.record + 28,
    meta.fsOffset + info.user.record + 32,
  );
  canonical.fill(0, meta.fsOffset + 24, meta.fsOffset + 32);
  need(
    (await sha256(canonical)) === meta.canonicalAppSha256,
    "Application code or protected configuration changed",
  );
  validateKeyTable(info.merged, meta);
  return { ...app, info };
}
export async function buildBindings(
  factory,
  changes,
  codec,
  audioBuild = null,
) {
  const original = await openEditable(factory.image, { codec });
  need(supportsBindings(original), "Unsupported binding profile");
  const meta = bindingIdentity(original);
  const source = original.entries.find((e) => e.name === "app.bin"),
    app = await validateBindingApplication(source.bytes, meta, codec);
  const info = app.info,
    planned = planBindings(info.merged, changes, info.patch, info.defaults, {
      buttons: meta.buttons,
      actions: meta.actions,
      stock: Uint8Array.from(meta.stockRows.flat()),
    });
  validateKeyTable(planned, meta);
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
  raw.set(fs, meta.fsOffset);
  // An empty edit must not recompress the factory application.
  const encrypted = sameBytes(raw, app.raw)
    ? source.bytes
    : await packApp(app, raw, codec, meta);
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
  const verified = await validateBindingApplication(
    parsed.entries.find((e) => e.name === "app.bin").bytes,
    meta,
    codec,
  );
  need(sameBytes(verified.raw, raw), "Application rebuild mismatch");
  const after = verified.info;
  need(sameBytes(after.merged, planned), "Final key map mismatch");
  need(
    sameBytes(
      app.raw.subarray(0, meta.fsOffset),
      verified.raw.subarray(0, meta.fsOffset),
    ),
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
    inputSha256: original.digest,
    inputWasCustom: original.isCustom,
    target: audioBuild?.report.target || "bindings",
    capacity: original.capacity,
    toneBytes: base.entries.find((e) => e.name === "tone.bin").size,
    outputSha256: await sha256(image),
    imageBytes: image.length,
    bindings: changes.map((c) => ({ ...c })),
    powerBindingsPreserved: true,
    powerClicksEditable: true,
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
