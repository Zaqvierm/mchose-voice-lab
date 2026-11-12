import test from "node:test";
import assert from "node:assert/strict";
import { transform } from "../src/firmware.mjs";
test("independent Python feedback vector", () => {
  const plain = Uint8Array.from(
    Buffer.from(
      "496e646570656e64656e7420666565646261636b2d766563746f72207465737421",
      "hex",
    ),
  );
  const encoded = Uint8Array.from(
    Buffer.from(
      "ee237cb23cfa4707257cf471114e16d36904cb2d829d16b54d1eb43caca5e36686",
      "hex",
    ),
  );
  assert.deepEqual(transform(encoded), plain);
  assert.deepEqual(transform(plain, false), encoded);
});
