// Read-only audit of the exact X9 EN 1003 image. No device or network access.
import { readFile } from "node:fs/promises";
import lzma from "lzma";
import { openFactory, sha256, parseSdfs } from "../src/firmware.mjs";
import {
  unpackBindingApp,
  configRecords,
  BINDING_ACTIONS,
  supportsBindings,
} from "../src/bindings.mjs";
const path = process.argv[2];
if (!path)
  throw new Error("Usage: node scripts/audit-keys.mjs ORIGINAL-X9-1003.bin");
const factory = await openFactory(new Uint8Array(await readFile(path)));
if (factory.profile.id !== "x9-1003")
  throw new Error("Audit supports the exact X9 EN 1003 original only");
const codec = {
  decompress: (data) =>
    new Promise((resolve, reject) =>
      lzma.decompress(Array.from(data), (value, error) =>
        error
          ? reject(error)
          : resolve(
              typeof value === "string"
                ? new TextEncoder().encode(value)
                : Uint8Array.from(value),
            ),
      ),
    ),
};
const { raw } = await unpackBindingApp(
  factory.entries.find((e) => e.name === "app.bin").bytes,
  codec,
);
const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
const registrations = [
  ["main", 0x9c450, 27],
  ["btmusic", 0x9c5d0, 15],
  ["btcall", 0x9c648, 13],
  ["le_call", 0x9c754, 13],
  ["le_media", 0x9c7b4, 13],
  ["usound", 0x9c87c, 13],
];
const commands = new Map();
for (const [mode, start, count] of registrations)
  for (let i = 0; i < count; i++) {
    const id = view.getUint32(start + i * 8, true),
      flags = view.getUint32(start + i * 8 + 4, true);
    if (!commands.has(id))
      commands.set(id, {
        id,
        hex: "0x" + id.toString(16).toUpperCase().padStart(2, "0"),
        registrations: [],
      });
    commands.get(id).registrations.push({
      mode,
      flags,
      table: "0x" + (0x10000000 + start).toString(16),
    });
  }
const resources = parseSdfs(raw.slice(0xbb774, 0xbb774 + 327552));
const defaults = configRecords(
    resources.find((e) => e.name === "defcfg.bin").bytes,
  ),
  user = configRecords(resources.find((e) => e.name === "usrcfg.bin").bytes),
  assigned = new Set();
for (const id of [12, 13]) {
  const d = defaults.find((r) => r.id === id),
    merged = d.bytes.slice();
  for (const r of user.filter((r) => r.id === id))
    merged.set(r.bytes, r.offset);
  for (let i = 0; i < merged.length; i += 6)
    if (merged[i]) assigned.add(merged[i]);
}
for (const command of commands.values()) {
  command.factoryAssigned = assigned.has(command.id);
  command.editorAction =
    Object.entries(BINDING_ACTIONS).find(([, id]) => id === command.id)?.[0] ||
    null;
}
console.log(
  JSON.stringify(
    {
      model: factory.profile.model,
      firmware: factory.profile.version,
      rawAppSha256: await sha256(raw),
      registeredCount: commands.size,
      withoutFactoryGesture: [...commands.values()].filter(
        (c) => !c.factoryAssigned,
      ).length,
      commands: [...commands.values()].sort((a, b) => a.id - b.id),
    },
    null,
    2,
  ),
);
