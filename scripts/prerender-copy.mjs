// Include the same default UI copy in HTML before JavaScript rendering.
import { readFile, writeFile } from "node:fs/promises";
import { setLanguage, t } from "../src/i18n.mjs";
setLanguage("ru");
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
let html = await readFile("dist/index.html", "utf8");
html = html.replace(
  /<([a-z][a-z0-9]*)\b([^>]*\bdata-i18n="([A-Za-z0-9]+)"[^>]*)>[^<]*<\/\1>/gi,
  (_, tag, attrs, key) => {
    const text = t(key);
    if (text === key) throw new Error(`Missing prerender copy: ${key}`);
    return `<${tag}${attrs}>${escape(text)}</${tag}>`;
  },
);
const catalog = JSON.parse(await readFile("public/catalog.json", "utf8"));
const models = [
  ...new Set(
    catalog.firmwares.filter((x) => x.kind === "headset").map((x) => x.model),
  ),
];
html = html.replace(
  /(<select\b[^>]*id="model-select"[^>]*>)[\s\S]*?(<\/select>)/,
  (_, start, end) =>
    start +
    models
      .map(
        (model) =>
          `<option${model === "MCHOSE X9" ? " selected" : ""}>${escape(model)}</option>`,
      )
      .join("") +
    end,
);
await writeFile("dist/index.html", html);
console.log(
  `Prerendered default UI text and ${models.length} supported model names.`,
);
