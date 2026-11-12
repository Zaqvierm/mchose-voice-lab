import test from "node:test";
import assert from "node:assert/strict";
import { setLanguage, t, voiceLabel } from "../src/i18n.mjs";
test("three language dictionaries and filename fallback", () => {
  setLanguage("ru");
  assert.equal(t("title"), "Редактор озвучки");
  assert.equal(voiceLabel("V_POWON.act"), "Включение");
  setLanguage("en");
  assert.equal(t("title"), "Voice prompt editor");
  assert.equal(voiceLabel("V_BATTLO.act"), "Very low battery");
  setLanguage("zh");
  assert.equal(t("title"), "提示音编辑器");
  assert.equal(voiceLabel("V_POWON.act"), "开机");
  assert.equal(voiceLabel("OTHER.act"), "OTHER.act");
  assert.notEqual(t("staticProfile"), "staticProfile");
});
