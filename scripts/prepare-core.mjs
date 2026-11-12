import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('public/ffmpeg', { recursive: true });
for (const name of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  await copyFile(`node_modules/@ffmpeg/core/dist/esm/${name}`, `public/ffmpeg/${name}`);
}

await mkdir("public/licenses", {recursive:true});
for(const name of ["FFmpeg-GPLv2.txt","ffmpeg-wasm-MIT.txt"]) await copyFile(`licenses/${name}`,`public/licenses/${name}`);
await copyFile("THIRD_PARTY.md","public/licenses/THIRD_PARTY.md");
