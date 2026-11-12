// Retrieve unchanged vendor originals for the published catalog, never Git source.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const catalog = JSON.parse(await readFile("public/catalog.json", "utf8"));
await mkdir("public/firmware", { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
let preferPublishedMirror = process.env.MCHOSE_FACTORY_SOURCE === "mirror";
const valid = (data, entry) => data && data.length === entry.bytes && data.length <= 16 * 1024 * 1024 && hash(data) === entry.sha256;
for (const entry of catalog.firmwares) {
  if (entry.kind !== "headset" || !/^[a-z0-9-]+$/.test(entry.id))
    throw new Error("Invalid catalog entry");
  const url = new URL(entry.url);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "cdn.mchose.com.cn" ||
    !url.pathname.startsWith("/OTA/PC/prod/otaFile/")
  )
    throw new Error("Unexpected firmware source");
  const path = `public/firmware/${entry.id}.bin`;
  let data;
  try {
    data = await readFile(path);
  } catch {}
  if (!valid(data, entry)) {
    const mirror = new URL(`https://zaqvierm.github.io/mchose-voice-lab/firmware/${entry.id}.bin`);
    const sources = preferPublishedMirror ? [mirror, url] : [url, mirror];
    let failure;
    data = undefined;
    for (const source of sources) {
      try {
        const response = await fetch(source, { signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const candidate = Buffer.from(await response.arrayBuffer());
        if (!valid(candidate, entry)) throw new Error("SHA256/size mismatch");
        data = candidate;
        if (source === mirror) preferPublishedMirror = true;
        break;
      } catch (error) {
        failure = error;
        console.warn(`${entry.id}: ${source.hostname} unavailable or invalid: ${error.message}`);
      }
    }
    if (!data) throw new Error(`${entry.id}: no verified original available`, {cause: failure});
    await writeFile(path, data);
  }
  console.log(`Verified vendor base: ${entry.id} (${data.length} bytes)`);
}
