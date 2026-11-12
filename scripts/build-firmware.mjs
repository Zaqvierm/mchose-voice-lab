import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openFactory, buildFirmware } from "../src/firmware.mjs";
const [basePath, actPath, output, target = "V_POWON.act"] =
  process.argv.slice(2);
if (
  !basePath ||
  !actPath ||
  !output ||
  [basePath, actPath].some((p) => resolve(p) === resolve(output))
) {
  console.error(
    "Usage: node scripts/build-firmware.mjs FACTORY.bin SOUND.act OUTPUT-headset.bin [V_POWON.act]",
  );
  process.exit(1);
}
const factory = await openFactory(new Uint8Array(await readFile(basePath)));
const result = await buildFirmware(
  factory,
  target,
  new Uint8Array(await readFile(actPath)),
);
await writeFile(output, result.image);
await writeFile(`${output}.json`, JSON.stringify(result.report, null, 2));
console.log(JSON.stringify(result.report, null, 2));
