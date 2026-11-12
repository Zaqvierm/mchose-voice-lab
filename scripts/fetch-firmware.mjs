// Retrieve unchanged vendor originals for the published catalog, never Git source.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const catalog=JSON.parse(await readFile('public/catalog.json','utf8'));
await mkdir('public/firmware',{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const entry of catalog.firmwares){
 if(entry.kind!=='headset'||!/^[a-z0-9-]+$/.test(entry.id))throw new Error('Invalid catalog entry');
 const url=new URL(entry.url);
 if(url.protocol!=='https:'||url.hostname!=='cdn.mchose.com.cn'||!url.pathname.startsWith('/OTA/PC/prod/otaFile/'))throw new Error('Unexpected firmware source');
 const path=`public/firmware/${entry.id}.bin`;
 let data;try{data=await readFile(path);}catch{}
 if(!data||data.length!==entry.bytes||hash(data)!==entry.sha256){
  const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error(`${entry.id}: HTTP ${response.status}`);
  data=Buffer.from(await response.arrayBuffer());
  if(data.length!==entry.bytes||data.length>16*1024*1024||hash(data)!==entry.sha256)throw new Error(`${entry.id}: integrity check failed`);
  await writeFile(path,data);
 }
 console.log(`Verified vendor base: ${entry.id} (${data.length} bytes)`);
}
