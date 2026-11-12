// Original implementation reconstructed from verified X9 factory resources.
// No executable firmware, manufacturer SDK code, or audio is bundled here.
import { PROFILES } from "./profiles.mjs";
export const PROFILE = Object.freeze({
  model: "MCHOSE X9",
  version: "1003 EN",
  sha256: "9b9780a4434a12e6fbcca08ccbd5d2af97f80158f76c7fa14e66e2b17198368c",
  bytes: 743936,
  board: "cuckoo_dvb_earphone",
});
const encoder = new TextEncoder(),
  decoder = new TextDecoder();
const view = (a) => new DataView(a.buffer, a.byteOffset, a.byteLength);
const u32 = (a, p) => view(a).getUint32(p, true);
const put = (a, p, v) => view(a).setUint32(p, v >>> 0, true);
const align = (n, a) => Math.ceil(n / a) * a;
const need = (ok, message) => {
  if (!ok) throw new Error(message);
};
const nameAt = (a, p, n = 12) =>
  decoder.decode(a.subarray(p, p + n)).split("\0")[0];
export const sameBytes = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export async function sha256(a) {
  const result = await crypto.subtle.digest("SHA-256", a);
  return Array.from(new Uint8Array(result), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
const crcTable = Uint32Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let b = 0; b < 8; b++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export function crc32(a) {
  let c = 0xffffffff;
  for (const b of a) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
export function sum32(a) {
  let result = 0;
  for (let i = 0; i + 4 <= a.length; i += 4)
    result = (result + u32(a, i)) >>> 0;
  return result;
}
function popcount(v) {
  v >>>= 0;
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}
const masks = [
  2182120481, 138481731, 276832388, 553664776, 2181071376, 67109920, 268439584,
  536879564,
];
const lookup = Array.from({ length: 4 }, (_, byte) =>
  Uint8Array.from({ length: 256 }, (_, value) => {
    let result = 0;
    for (let bit = 0; bit < 8; bit++)
      result |= (popcount((value << (byte * 8)) & masks[bit]) & 1) << bit;
    return result;
  }),
);
export function transform(data, decrypt = true) {
  const result = new Uint8Array(data.length);
  for (let start = 0; start < data.length; start += 32) {
    let state = 0x01373373;
    for (let pos = start; pos < Math.min(start + 32, data.length); pos++) {
      const key =
        lookup[0][state & 255] ^
        lookup[1][(state >>> 8) & 255] ^
        lookup[2][(state >>> 16) & 255] ^
        lookup[3][state >>> 24];
      const value = data[pos] ^ key;
      result[pos] = value;
      const plain = decrypt ? value : data[pos];
      state =
        (((state << 1) & 0xfffffffc) |
          (((state ^ popcount(plain & 60)) & 1) << 1) |
          (popcount(state & 2187366107) & 1)) >>>
        0;
    }
  }
  return result;
}
export function parseAdts(a, allowPadding = false) {
  let pos = 0;
  const frames = [],
    rates = [
      96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000,
      11025, 8000, 7350,
    ];
  while (pos < a.length) {
    if (allowPadding && pos === a.length - 1 && a[pos] === 0) break;
    need(
      pos + 7 <= a.length && a[pos] === 255 && (a[pos + 1] & 0xf6) === 0xf0,
      `Неверный заголовок AAC: ${pos}`,
    );
    const n = ((a[pos + 3] & 3) << 11) | (a[pos + 4] << 3) | (a[pos + 5] >>> 5);
    const headerSize = a[pos + 1] & 1 ? 7 : 9;
    const rate = rates[(a[pos + 2] >>> 2) & 15];
    need(
      n >= headerSize && pos + n <= a.length && rate,
      "Повреждена длина кадра AAC",
    );
    frames.push({
      offset: pos,
      length: n,
      profile: (a[pos + 2] >>> 6) + 1,
      rate,
      channels: ((a[pos + 2] & 1) << 2) | (a[pos + 3] >>> 6),
      samples: 1024 * ((a[pos + 6] & 3) + 1),
    });
    pos += n;
  }
  need(frames.length, "AAC не содержит кадров");
  return { frames, consumed: pos };
}
export function unwrapAct(a) {
  need(a.length >= 10 && a.length % 2 === 0, "Неверный размер ACT");
  const p = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 2) {
    p[i] = a[i + 1] ^ 8;
    p[i + 1] = a[i] ^ 0x14;
  }
  need(p[0] === 0xf1 && p[1] === 0xa2, "Этот вариант ACT не поддерживается");
  const body = p.subarray(2),
    info = parseAdts(body, true);
  return { aac: body.slice(0, info.consumed), ...info };
}
export function wrapAct(aac) {
  const info = parseAdts(aac);
  need(
    info.consumed === aac.length &&
      info.frames.every(
        (f) => f.profile === 2 && f.rate === 16000 && f.channels === 1,
      ),
    "Нужен AAC-LC, 16 кГц, моно",
  );
  const p = new Uint8Array(align(2 + aac.length, 2));
  p.set([0xf1, 0xa2]);
  p.set(aac, 2);
  const result = new Uint8Array(p.length);
  for (let i = 0; i < p.length; i += 2) {
    result[i] = p[i + 1] ^ 0x14;
    result[i + 1] = p[i] ^ 8;
  }
  return result;
}
export function parseSdfs(data) {
  need(
    data.length >= 32 && nameAt(data, 0) === "sdfs.bin",
    "Не найдена файловая система звуков",
  );
  const count = u32(data, 12),
    tableEnd = (count + 1) * 32;
  need(
    count > 0 &&
      count <= 256 &&
      tableEnd <= data.length &&
      u32(data, 16) === data.length,
    "Повреждены размеры SDFS",
  );
  need(
    sum32(data.subarray(32, tableEnd)) === u32(data, 24) &&
      sum32(data.subarray(tableEnd)) === u32(data, 28),
    "Не совпадают суммы SDFS",
  );
  const entries = [],
    names = new Set();
  for (let i = 0; i < count; i++) {
    const record = (i + 1) * 32,
      name = nameAt(data, record),
      offset = u32(data, record + 12),
      size = u32(data, record + 16);
    need(
      /^[A-Za-z0-9_.-]+$/.test(name) &&
        !names.has(name) &&
        offset >= tableEnd &&
        offset + size <= data.length,
      "Неверная запись SDFS",
    );
    const bytes = data.slice(offset, offset + size);
    need(sum32(bytes) === u32(data, record + 28), `Повреждён ресурс ${name}`);
    need(
      entries.every(
        (e) =>
          !size ||
          !e.size ||
          Math.max(offset, e.offset) >=
            Math.min(offset + size, e.offset + e.size),
      ),
      "Ресурсы SDFS пересекаются",
    );
    entries.push({ name, record, offset, size, bytes });
    names.add(name);
  }
  return entries;
}
export function parseImage(image) {
  need(
    image.length >= 1024 && decoder.decode(image.subarray(0, 4)) === "AOTA",
    "Это не прошивка AOTA",
  );
  const v = view(image),
    count = image[12],
    directory = v.getUint16(16, true);
  need(
    v.getUint16(10, true) === 1024 &&
      v.getUint16(18, true) === 1024 &&
      count > 0 &&
      count <= 16 &&
      directory >= 32 &&
      directory + count * 32 <= 1024 &&
      u32(image, 20) === image.length,
    "Неверные размеры AOTA",
  );
  need(
    crc32(image.subarray(8, 1024)) === u32(image, 4) &&
      crc32(image.subarray(1024)) === u32(image, 24),
    "Не совпадают контрольные суммы AOTA",
  );
  const entries = [],
    names = new Set();
  for (let i = 0; i < count; i++) {
    const record = directory + i * 32,
      name = nameAt(image, record),
      offset = u32(image, record + 16),
      size = u32(image, record + 20);
    need(
      /^[A-Za-z0-9_.-]+$/.test(name) &&
        !names.has(name) &&
        offset >= 1024 &&
        offset + size <= image.length,
      "Неверная запись AOTA",
    );
    need(
      entries.every(
        (e) =>
          Math.max(offset, e.offset) >=
          Math.min(offset + size, e.offset + e.size),
      ),
      "Разделы AOTA пересекаются",
    );
    const bytes = image.slice(offset, offset + size);
    need(crc32(bytes) === u32(image, record + 28), `Повреждён раздел ${name}`);
    entries.push({ name, record, offset, size, bytes });
    names.add(name);
  }
  const xmlFile = entries.find((e) => e.name === "ota.xml");
  need(xmlFile, "Нет описания прошивки");
  const xml = decoder.decode(xmlFile.bytes);
  for (const match of xml.matchAll(/<partition>[\s\S]*?<\/partition>/g)) {
    const tag = (name) =>
      match[0].match(new RegExp(`<${name}>([^<]+)</${name}>`))?.[1];
    const name = tag("file_name");
    if (!name) continue;
    const entry = entries.find((e) => e.name === name);
    need(
      entry &&
        Number(tag("file_size")) === entry.size &&
        Number(tag("checksum")) === crc32(entry.bytes),
      `Неверное описание раздела ${name}`,
    );
  }
  return { entries, xml };
}
export async function scanFirmware(input) {
  const image = new Uint8Array(input).slice();
  need(image.length <= 16 * 1024 * 1024, "Файл слишком большой");
  const digest = await sha256(image);
  if (PROFILES.some((p) => p.sha256 === digest && p.bytes === image.length)) {
    const factory = await openFactory(image);
    const voices = factory.resources
      .filter((e) => /\.(act|aac|wav|pcm|mp3)$/i.test(e.name))
      .map((e) => ({
        ...e,
        kind: e.name.endsWith(".act") ? "AAC-LC / ACT" : "unknown",
        replaceable: e.name.endsWith(".act"),
      }));
    return { ...factory, digest, canBuild: true, voices };
  }
  const parsed = parseImage(image);
  let resources = [];
  // Inspect actual resources. Never infer a file name from an X9 preset.
  for (const part of parsed.entries.filter((e) =>
    /^(tone|sdfs(?:_k)?)\.bin$/i.test(e.name),
  )) {
    for (const candidate of [part.bytes, transform(part.bytes)]) {
      try {
        resources = parseSdfs(candidate);
        break;
      } catch {
        /* Unsupported filesystem; inspection only. */
      }
    }
    if (resources.length) break;
  }
  const voices = resources
    .filter((e) => /\.(act|aac|wav|pcm|mp3)$/i.test(e.name))
    .map((e) => {
      try {
        const info = unwrapAct(e.bytes);
        return {
          ...e,
          kind: `AAC-LC / ACT · ${info.frames[0].rate} Hz`,
          replaceable: true,
        };
      } catch {
        return { ...e, kind: "unknown", replaceable: false };
      }
    });
  return { image, digest, ...parsed, resources, voices, canBuild: false };
}
export async function openFactory(input) {
  const image = new Uint8Array(input).slice();
  const digest = await sha256(image),
    profile = PROFILES.find(
      (p) => p.sha256 === digest && p.bytes === image.length,
    );
  need(
    profile,
    "Поддерживается только оригинальная совместимая прошивка. Выбери заводской файл, не тестовую сборку.",
  );
  const parsed = parseImage(image),
    files = new Map(parsed.entries.map((e) => [e.name, e]));
  need(
    files.has("tone.bin") &&
      files.has("param.bin") &&
      parsed.xml.includes(profile.board),
    "Неверная модель устройства",
  );
  const tone = transform(files.get("tone.bin").bytes),
    resources = parseSdfs(tone),
    param = transform(files.get("param.bin").bytes);
  let capacity = 0;
  for (let i = 16; i + 24 <= Math.min(256, param.length); i += 24)
    if (nameAt(param, i, 8) === "fw0_sdfs") capacity = u32(param, i + 16);
  need(
    capacity === profile.toneCapacity && tone.length <= capacity,
    "Неизвестная карта разделов",
  );
  const voices = resources.filter((e) => e.name.endsWith(".act"));
  need(voices.length === 18, "Неизвестный набор уведомлений");
  for (const e of voices) {
    const info = unwrapAct(e.bytes);
    need(
      info.frames.every(
        (f) => f.profile === 2 && f.rate === 16000 && f.channels === 1,
      ),
      "Неизвестный формат заводского звука",
    );
  }
  return { image, tone, resources, voices, capacity, profile, ...parsed };
}
export async function buildFirmware(factory, target, replacement) {
  // Reopen the pinned base instead of trusting caller-mutated metadata.
  const original = await openFactory(factory.image);
  need(
    original.voices.some((e) => e.name === target),
    "Неизвестное уведомление",
  );
  const info = unwrapAct(replacement);
  need(
    sameBytes(wrapAct(info.aac), replacement),
    "ACT не проходит обратную проверку",
  );
  const entry = original.resources.find((e) => e.name === target);
  const oldEnd = align(entry.offset + entry.size, 32),
    newEnd = align(entry.offset + replacement.length, 32),
    delta = newEnd - oldEnd;
  const tone = new Uint8Array(original.tone.length + delta);
  need(
    tone.length <= original.capacity,
    "Звук не помещается в штатный раздел. Сократи фрагмент.",
  );
  tone.set(original.tone.subarray(0, entry.offset));
  tone.set(replacement, entry.offset);
  tone.set(original.tone.subarray(oldEnd), newEnd);
  for (const e of original.resources)
    if (e.offset >= oldEnd) put(tone, e.record + 12, e.offset + delta);
  put(tone, entry.record + 16, replacement.length);
  put(tone, entry.record + 28, sum32(replacement));
  put(tone, 16, tone.length);
  const tableEnd = (original.resources.length + 1) * 32;
  put(tone, 24, sum32(tone.subarray(32, tableEnd)));
  put(tone, 28, sum32(tone.subarray(tableEnd)));
  const after = parseSdfs(tone);
  for (const e of original.resources)
    need(
      sameBytes(
        after.find((a) => a.name === e.name).bytes,
        e.name === target ? replacement : e.bytes,
      ),
      `Изменился посторонний ресурс ${e.name}`,
    );
  const encryptedTone = transform(tone, false);
  let changed = false;
  const xml = original.xml.replace(
    /<partition>[\s\S]*?<\/partition>/g,
    (block) => {
      if (!block.includes("<file_name>tone.bin</file_name>")) return block;
      changed = true;
      return block
        .replace(
          /(<file_size>0x)[0-9a-fA-F]+(<\/file_size>)/,
          (_, a, b) => a + tone.length.toString(16) + b,
        )
        .replace(
          /(<checksum>0x)[0-9a-fA-F]+(<\/checksum>)/,
          (_, a, b) =>
            a + crc32(encryptedTone).toString(16).padStart(8, "0") + b,
        );
    },
  );
  need(
    changed &&
      encoder.encode(xml).length === encoder.encode(original.xml).length,
    "Невозможно обновить описание прошивки",
  );
  const payloads = original.entries.map((e) => ({
    ...e,
    bytes:
      e.name === "tone.bin"
        ? encryptedTone
        : e.name === "ota.xml"
          ? encoder.encode(xml)
          : e.bytes,
  }));
  let length = 1024;
  for (const e of payloads) {
    e.newOffset = align(length, 512);
    length = e.newOffset + e.bytes.length;
  }
  const image = new Uint8Array(align(length, 512));
  image.set(original.image.subarray(0, 1024));
  for (const e of payloads) {
    image.set(e.bytes, e.newOffset);
    put(image, e.record + 16, e.newOffset);
    put(image, e.record + 20, e.bytes.length);
    put(image, e.record + 28, crc32(e.bytes));
  }
  put(image, 20, image.length);
  put(image, 24, crc32(image.subarray(1024)));
  put(image, 4, crc32(image.subarray(8, 1024)));
  const verified = parseImage(image);
  for (const name of ["app.bin", "mbrec.bin", "param.bin"])
    need(
      sameBytes(
        original.entries.find((e) => e.name === name).bytes,
        verified.entries.find((e) => e.name === name).bytes,
      ),
      `Изменился защищённый раздел ${name}`,
    );
  const actualTone = transform(
    verified.entries.find((e) => e.name === "tone.bin").bytes,
  );
  need(
    sameBytes(
      parseSdfs(actualTone).find((e) => e.name === target).bytes,
      replacement,
    ),
    "Итоговый образ содержит другой звук",
  );
  return {
    image,
    report: {
      model: original.profile.model,
      baseVersion: original.profile.version,
      baseSha256: original.profile.sha256,
      outputSha256: await sha256(image),
      imageBytes: image.length,
      target,
      audioBytes: replacement.length,
      aacFrames: info.frames.length,
      sampleRate: 16000,
      channels: 1,
      toneBytes: tone.length,
      capacity: original.capacity,
      otherResourcesUnchanged: true,
      programBootParametersUnchanged: true,
      checksumsVerified: true,
      deviceFlashed: false,
      customAudioHardwareTested: false,
      profileEvidence: original.profile.hardwareTestedPowerOn
        ? "hardware-tested-PowerOn-scenario"
        : "static-only-no-hardware-test",
    },
  };
}
