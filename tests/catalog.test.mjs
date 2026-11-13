import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  openFactory,
  scanFirmware,
  buildFirmware,
  sameBytes,
} from "../src/firmware.mjs";
import { PROFILES } from "../src/profiles.mjs";
test("catalog pins distinct images and records hardware evidence separately", () => {
  assert.equal(PROFILES.length, 9);
  assert.equal(new Set(PROFILES.map((p) => p.sha256)).size, 9);
  assert.equal(PROFILES.filter((p) => p.hardwareTestedPowerOn).length, 1);
});
const root = process.env.X9_CATALOG_ROOT;
test(
  "private fixtures: all 9 profiles no-op rebuild byte-identically and enumerate actual sounds",
  { skip: !root },
  async () => {
    const names = [
      "G9Pro-0026.bin",
      "V9Pro-0036.bin",
      "V9Pro-1015.bin",
      "X9-0038.bin",
      "X9-1003.bin",
      "V9Turbo-0033.bin",
      "V9Turbo-0035.bin",
      "V9Turbo-1002.bin",
      "V9TurboBase-0005.bin",
    ];
    for (const name of names) {
      const bytes = new Uint8Array(await readFile(join(root, name))),
        f = await openFactory(bytes),
        scan = await scanFirmware(bytes);
      assert.equal(scan.voices.length, 19);
      assert(
        scan.voices.some((v) => v.name === "T_RING.pcm" && !v.replaceable),
      );
      const own = f.voices.find((v) => v.name === "V_POWON.act");
      assert(own);
      const built = await buildFirmware(f, own.name, own.bytes);
      assert(sameBytes(built.image, bytes), name);
      if (name.startsWith("V9Pro") || name.startsWith("G9Pro")) {
        assert(scan.voices.some((v) => v.name === "V_BATTLO.act"));
        assert(!scan.voices.some((v) => v.name === "V_MAXVOL.act"));
      }
      assert.equal(built.report.model, f.profile.model);
    }
  },
);
