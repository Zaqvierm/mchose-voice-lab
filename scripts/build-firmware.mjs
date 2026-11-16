import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openEditable, buildFirmware } from "../src/firmware.mjs";
import lzma from "lzma";
const [basePath, actPath, output, target = "V_POWON.act"] =
  process.argv.slice(2);
if (
  !basePath ||
  !actPath ||
  !output ||
  [basePath, actPath].some((p) => resolve(p) === resolve(output))
) {
  console.error(
    "Usage: node scripts/build-firmware.mjs COMPATIBLE.bin SOUND.act OUTPUT-headset.bin [V_POWON.act]",
  );
  process.exit(1);
}
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
const factory = await openEditable(new Uint8Array(await readFile(basePath)), {
  codec,
});
const result = await buildFirmware(
  factory,
  target,
  new Uint8Array(await readFile(actPath)),
  { codec },
);
await writeFile(output, result.image);
await writeFile(`${output}.json`, JSON.stringify(result.report, null, 2));
console.log(JSON.stringify(result.report, null, 2));
