import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import lzma from "lzma";
import createCore from "@ffmpeg/core";
import {
  buildFirmware,
  openEditable,
  openFactory,
  parseImage,
  parseSdfs,
  transform,
  sameBytes,
  sha256,
} from "../src/firmware.mjs";

// The base image is not distributed. Obtain the exact official V9 Pro 1015
// headset image and verify its digest before using this experimental recipe.
const BASE_SHA256 =
  "4893aba8c1b8b6007c7bc4a6a7d5b4c449787773a4b720313e23e87eb4dc290b";
const PROMPTS = [
  ["V_BATLOW", "Низкий заряд батареи."],
  ["V_BATTLO", "Очень низкий заряд."],
  ["V_BT", "Режим блютус."],
  ["V_BTCNT", "Блютус подключён."],
  ["V_BTCNT2", "Устройство подключено."],
  ["V_BTDISC", "Поиск устройств блютус."],
  ["V_BTDSC", "Блютус отключён."],
  ["V_BTPRMD", "Сопряжение блютус."],
  ["V_MICOFF", "Микрофон выключен."],
  ["V_MICON", "Микрофон включён."],
  ["V_NXTMUS", "Следующий трек."],
  ["V_PAIR", "Режим сопряжения."],
  ["V_PLAY", "Воспроизведение."],
  ["V_POWOFF", "Наушники выключаются."],
  ["V_POWON", "Наушники готовы. Хорошей игры."],
  ["V_PRVMUS", "Предыдущий трек."],
  ["V_USB", "Режим донгла."],
  ["V_USBDIS", "Донгл отключён."],
];

const [baseArg, promptsArg, outputArg] = process.argv.slice(2);
if (!baseArg || !promptsArg || !outputArg) {
  console.error(
    "Usage: node scripts/build-v9pro-ru-pack.mjs STOCK_1015.bin PROMPTS_DIR OUTPUT.bin\n" +
      "PROMPTS_DIR must contain one reviewed <resource-id>.mp3 for every ID in the script.",
  );
  process.exit(2);
}
const basePath = resolve(baseArg);
const promptsDir = resolve(promptsArg);
const outputPath = resolve(outputArg);
if (new Set([basePath, outputPath]).size !== 2) {
  throw new Error("Output path must differ from the stock image path");
}

const baseBytes = new Uint8Array(await readFile(basePath));
const baseSha256 = await sha256(baseBytes);
if (baseSha256 !== BASE_SHA256) {
  throw new Error(`Unexpected stock image SHA-256: ${baseSha256}`);
}

const codec = {
  decompress: (data) =>
    new Promise((resolvePromise, reject) =>
      lzma.decompress(Array.from(data), (value, error) =>
        error
          ? reject(error)
          : resolvePromise(
              typeof value === "string"
                ? new TextEncoder().encode(value)
                : Uint8Array.from(value),
            ),
      ),
    ),
};
globalThis.self = globalThis;
globalThis.location = {
  href: new URL("../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js", import.meta.url).href,
};
const wasmBinary = new Uint8Array(
  await readFile(new URL("../node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm", import.meta.url)),
);
const core = await createCore({
  wasmBinary,
  print: () => {},
  printErr: ({ message }) => console.error(message),
});

let factory = await openFactory(baseBytes);
const protectedParts = new Map(
  factory.entries
    .filter((entry) => ["app.bin", "mbrec.bin", "param.bin"].includes(entry.name))
    .map((entry) => [entry.name, entry.bytes]),
);
const originalVoices = new Map(factory.voices.map((entry) => [entry.name, entry.bytes]));
const reports = [];

for (let index = 0; index < PROMPTS.length; index += 1) {
  const [id] = PROMPTS[index];
  const mp3 = new Uint8Array(await readFile(resolve(promptsDir, `${id}.mp3`)));
  const stem = `/v9pro-${String(index).padStart(2, "0")}`;
  core.FS.writeFile(`${stem}.mp3`, mp3);
  const rc = core.exec(
    "-hide_banner", "-v", "error", "-i", `${stem}.mp3`, "-f", "s16le",
    "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", `${stem}.raw`,
  );
  if (rc !== 0) throw new Error(`Could not decode ${id}.mp3 (FFmpeg ${rc})`);
  const raw = core.FS.readFile(`${stem}.raw`);
  if (raw.length % 2 !== 0) throw new Error(`Invalid PCM length for ${id}`);
  const wav = makeWav(raw);
  core.FS.writeFile(`${stem}.wav`, wav);
  core.exec(
    "-hide_banner", "-v", "error", "-i", `${stem}.wav`, "-c:a", "aac",
    "-profile:a", "aac_low", "-b:a", "24k", "-aac_pns", "0", "-aac_tns", "0",
    "-f", "adts", `${stem}.aac`,
  );
  const aac = core.FS.readFile(`${stem}.aac`);
  const act = wrapAct(aac);
  const built = await buildFirmware(factory, `${id}.act`, act, { codec });
  reports.push(built.report);
  factory = await openEditable(built.image, { codec });
}

const image = factory.image;
const partitions = new Map(parseImage(image).entries.map((entry) => [entry.name, entry.bytes]));
const tone = parseSdfs(transform(partitions.get("tone.bin")));
const voices = new Map(tone.filter((entry) => entry.name.endsWith(".act")).map((entry) => [entry.name, entry.bytes]));
for (const [id] of PROMPTS) {
  if (!voices.has(`${id}.act`)) throw new Error(`Missing built prompt ${id}`);
}
for (const [name, bytes] of protectedParts) {
  if (!sameBytes(partitions.get(name), bytes)) throw new Error(`Protected partition changed: ${name}`);
}
for (const [name, bytes] of originalVoices) {
  if (!PROMPTS.some(([id]) => `${id}.act` === name) && !sameBytes(voices.get(name), bytes)) {
    throw new Error(`Unrequested prompt changed: ${name}`);
  }
}

await writeFile(outputPath, image);
const report = {
  model: "MCHOSE V9 Pro",
  headsetFirmware: "1015",
  baseSha256,
  outputSha256: await sha256(image),
  outputBytes: image.length,
  replacedResources: PROMPTS.map(([id, text]) => ({ id, text })),
  protectedPartitionsUnchanged: true,
  otherPromptsUnchanged: true,
  hardwareStatus: "Experimental. The project author's custom image was accepted by the official updater; playback of every prompt is not independently verified.",
};
await writeFile(`${outputPath}.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function wrapAct(aac) {
  const padded = aac.length % 2 ? Uint8Array.from([...aac, 0]) : aac;
  const out = new Uint8Array(padded.length + 2);
  out.set([0xf1, 0xa2]);
  for (let i = 0; i < padded.length; i += 2) {
    out[i + 2] = padded[i + 1] ^ 0x08;
    out[i + 3] = padded[i] ^ 0x14;
  }
  return out;
}

function makeWav(raw) {
  const sampleCount = raw.length / 2;
  const source = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  let peak = 0;
  for (let i = 0; i < sampleCount; i += 1) {
    peak = Math.max(peak, Math.abs(source.getInt16(i * 2, true) / 32768));
  }
  const gain = Math.min(1, 0.5 / Math.max(peak, 1e-9));
  const wav = new Uint8Array(44 + raw.length);
  const view = new DataView(wav.buffer);
  const putText = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) wav[offset + i] = value.charCodeAt(i);
  };
  putText(0, "RIFF");
  view.setUint32(4, 36 + raw.length, true);
  putText(8, "WAVE");
  putText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  putText(36, "data");
  view.setUint32(40, raw.length, true);
  for (let i = 0; i < sampleCount; i += 1) {
    const sample = source.getInt16(i * 2, true) / 32768;
    const fade = Math.min(1, i / 47, (sampleCount - 1 - i) / 47);
    view.setInt16(44 + i * 2, Math.round(sample * gain * fade * 32768), true);
  }
  return wav;
}

