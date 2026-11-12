import './style.css';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { scanFirmware, buildFirmware, wrapAct, unwrapAct, sameBytes } from './firmware.mjs';
import { t, setLanguage, getLanguage, voiceLabel, locales } from './i18n.mjs';
const $ = id => document.getElementById(id);
const repo = 'https://github.com/Zaqvierm/mchose-voice-lab';
const state = { factory:null, catalog:[], buffer:null, prepared:null, built:null, busy:false, context:null, source:null, ffmpeg:null, audioURL:null, originalURL:null, audioFile:null, baseFile:null, messageKey:'ready', messageKind:'' };
const fmt = n => new Intl.NumberFormat(locales[getLanguage()]).format(n);
function fail(key) { const e=new Error(key);e.key=key;throw e; }
function message(key,kind='') { state.messageKey=key;state.messageKind=kind; $('status').textContent=t(key);$('status').className=`status ${kind}`; }
function controls() {
  for(const id of ['pick-base','pick-audio','clip-start','clip-end','start-slider','end-slider','play-clip','prepare','model-select','firmware-language','load-stock']) $(id).disabled=state.busy;
  $('model-select').disabled=state.busy||!state.catalog.length; $('firmware-language').disabled=state.busy||!state.catalog.length; $('load-stock').disabled=state.busy||!selectedCatalog();
  $('voice').disabled=state.busy||!state.factory?.voices?.length;
  const voice=selectedVoice();$('play-original').disabled=state.busy||!voice?.replaceable;
  $('build').disabled=state.busy||!state.factory?.canBuild||!state.prepared||!voice?.replaceable;
  $('download').disabled=state.busy||!state.built;
}
function coreErrorKey(error) {
  if(error.key)return error.key;
  const m=String(error.message||error);
  if(/не помещается/.test(m))return 'tooLong';
  if(/сумм|Поврежд|checksum|CRC/.test(m))return 'badChecksum';
  if(/Поддерживается только|Неизвестн|Неверн|Невозможно|неизвестн/.test(m))return 'unsupportedBase';
  return 'failed';
}
async function action(fn) { if(state.busy)return;state.busy=true;controls();try{await fn();}catch(e){console.error(e);message(coreErrorKey(e),'error');}finally{state.busy=false;controls();} }
function resetBuild(){state.built=null;$('result').hidden=true;}
function resetOriginal(){ $('original-audio').pause();$('original-audio').hidden=true;$('original-audio').removeAttribute('src');if(state.originalURL)URL.revokeObjectURL(state.originalURL);state.originalURL=null; }
function resetPrepared(){state.prepared=null;resetBuild();$('preview-panel').hidden=true;$('prepared-audio').pause();$('prepared-audio').removeAttribute('src');if(state.audioURL)URL.revokeObjectURL(state.audioURL);state.audioURL=null;controls();}
function download(data,name,type='application/octet-stream'){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function selection(){return [+ $('clip-start').value,+ $('clip-end').value];}
function updateSelection(source){
 if(!state.buffer)return;let start=+(source==='start-slider'?$('start-slider').value:$('clip-start').value),end=+(source==='end-slider'?$('end-slider').value:$('clip-end').value);const d=state.buffer.duration;
 start=Math.max(0,Math.min(Number.isFinite(start)?start:0,Math.max(0,d-.1)));end=Math.max(start+.1,Math.min(Number.isFinite(end)?end:d,d));
 for(const id of ['clip-start','start-slider'])$(id).value=start.toFixed(2);for(const id of ['clip-end','end-slider'])$(id).value=end.toFixed(2);
 $('clip-duration').textContent=`${(end-start).toFixed(2)} ${t('seconds')}`;if(state.source){try{state.source.stop();}catch{}state.source=null;}resetPrepared();drawWave();
}
function drawWave(){
 if(!state.buffer)return;const c=$('wave'),ctx=c.getContext('2d'),w=c.width,h=c.height,data=state.buffer.getChannelData(0),[start,end]=selection(),d=state.buffer.duration;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#e0e8f8';ctx.fillRect(start/d*w,0,(end-start)/d*w,h);ctx.strokeStyle='#8294b2';ctx.lineWidth=1.3;ctx.beginPath();const step=Math.max(1,Math.floor(data.length/w));
 for(let x=0;x<w;x++){let peak=0;for(let i=x*step;i<Math.min((x+1)*step,data.length);i++)peak=Math.max(peak,Math.abs(data[i]));const size=Math.max(1,peak*h*.43);ctx.moveTo(x,h/2-size);ctx.lineTo(x,h/2+size);}ctx.stroke();ctx.strokeStyle='#315bb6';ctx.lineWidth=2;for(const x of [start,end]){ctx.beginPath();ctx.moveTo(x/d*w,0);ctx.lineTo(x/d*w,h);ctx.stroke();}
}
function selectedCatalog(){return state.catalog.find(x=>x.id===$('firmware-language').value);}
function selectedVoice(){return state.factory?.voices?.find(x=>x.name===$('voice').value);}
function option(value,label,disabled=false){const o=document.createElement('option');o.value=value;o.textContent=label;o.disabled=disabled;return o;}
function catalogLanguage(e){if(e.language==='en')return 'English';if(e.language==='zh')return '中文';if(e.sourceType==='1')return t('foreignFirmware');if(e.sourceType==='0')return t('defaultFirmware');return t('unknownFirmware');}
function renderCatalog(keep=true){
 const model=keep?$('model-select').value:'MCHOSE X9',entry=keep?$('firmware-language').value:'';
 $('model-select').replaceChildren(...[...new Set(state.catalog.map(e=>e.model))].map(name=>option(name,name)));if([...$('model-select').options].some(x=>x.value===model))$('model-select').value=model;
 renderCatalogVariants(entry);
}
function renderCatalogVariants(previous=''){
 const entries=state.catalog.filter(e=>e.model===$('model-select').value);$('firmware-language').replaceChildren(...entries.map(e=>option(e.id,`${catalogLanguage(e)} — ${e.version}`)));
 if(entries.some(e=>e.id===previous))$('firmware-language').value=previous;else{const preferred=entries.find(e=>e.language===getLanguage())||entries.find(e=>e.language==='en');if(preferred)$('firmware-language').value=preferred.id;}
 const e=selectedCatalog();$('catalog-version').textContent=e?`${t('version')}: ${e.version} / ${fmt(e.bytes)} ${t('bytes')}`:'';
 $('stock-download').hidden=!e;if(e){$('stock-download').href=e.url;$('stock-download').textContent=t('stockSource');}$('load-stock').textContent=t('loadStock');controls();
}
function renderVoices(){
 const current=$('voice').value,voices=state.factory?.voices||[];
 $('voice').replaceChildren(option('',t('chooseTarget')),...voices.map(e=>{const label=voiceLabel(e.name),title=label===e.name?e.name:`${label} — ${e.name}`;return option(e.name,`${title} (${fmt(e.size)} ${t('bytes')}; ${e.kind==='unknown'?t('formatUnknown'):e.kind})`,!e.replaceable);}));
 if(voices.some(e=>e.name===current))$('voice').value=current;
 $('resource-count').textContent=voices.length?`${t('detectedFiles')}: ${fmt(voices.length)}`:'';
}
function renderBase(){
 const f=state.factory;document.querySelector('.profile-note').hidden=!f;if(!f){$('base-name').textContent=t('baseEmpty');$('base-detail').textContent='';$('base-badge').textContent='';return;}
 const meta=state.catalog.find(e=>e.sha256===f.digest);$('base-name').textContent=state.baseFile||meta?.model||'AOTA';$('base-badge').textContent=t(f.canBuild?'baseVerified':'baseInspected');$('base-badge').className=f.canBuild?'good':'';
 $('base-detail').textContent=meta?`${meta.model} / ${meta.version}`:f.xml.match(/<board_name>([^<]+)/)?.[1]||'AOTA';$('profile-state').textContent=t(f.profile?.hardwareTestedPowerOn?'verifiedProfile':f.canBuild?'staticProfile':'inspectionOnly');
}
function renderResult(){if(!state.built)return;const r=state.built.report;$('result-size').textContent=`${fmt(r.imageBytes)} ${t('bytes')} / ${t('available')}: ${fmt(r.capacity-r.toneBytes)} ${t('bytes')}`;}
function applyLanguage(value){
 setLanguage(value);document.documentElement.lang=value;document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));$('ui-language').value=value;$('ui-language').setAttribute('aria-label',t('uiLanguage'));
 $('research-link').href=`${repo}/blob/main/docs/research.${value}.md`;$('instructions-link').href=`${repo}/blob/main/docs/rebuild.${value}.md`;
 renderCatalog();renderVoices();renderBase();renderResult();if(state.buffer){const [a,b]=selection();$('clip-duration').textContent=`${(b-a).toFixed(2)} ${t('seconds')}`;}
 if(state.audioFile){$('audio-name').textContent=state.audioFile;$('audio-detail').textContent=`${state.buffer.duration.toFixed(2)} ${t('seconds')} / ${(state.audioBytes/1048576).toFixed(2)} MB`;}message(state.messageKey,state.messageKind);controls();try{localStorage.setItem('mchose-language',value);}catch{}
}
async function readBaseBytes(bytes,name){
 state.factory=null;resetBuild();resetOriginal();message('loadingBase','busy');
 const f=await scanFirmware(bytes);state.factory=f;state.baseFile=name;renderBase();renderVoices();
 if(f.voices.some(e=>e.name==='V_POWON.act'))$('voice').value='V_POWON.act';
 message(f.canBuild?'baseReady':f.voices.length?'baseUnsupported':'noSounds');
}
async function readBase(file){if(!file)return;if(file.size>16*1024*1024)fail('scanLimit');await readBaseBytes(new Uint8Array(await file.arrayBuffer()),file.name);}
async function readAudio(file){
 if(!file)return;resetPrepared();state.buffer=null;$('editor').hidden=true;if(file.size>25*1024*1024)fail('audioLarge');message('audioReading','busy');state.context ||=new AudioContext();
 try{state.buffer=await state.context.decodeAudioData(await file.arrayBuffer());}catch{fail('audioBad');}
 if(state.buffer.duration<.1||state.buffer.duration>600){state.buffer=null;fail('audioDuration');}
 state.audioFile=file.name;state.audioBytes=file.size;$('audio-name').textContent=file.name;$('audio-detail').textContent=`${state.buffer.duration.toFixed(2)} ${t('seconds')} / ${(file.size/1048576).toFixed(2)} MB`;$('drop-zone').classList.add('loaded');
 for(const id of ['clip-start','clip-end','start-slider','end-slider'])$(id).max=state.buffer.duration.toFixed(2);$('clip-start').value='0';$('clip-end').value=Math.min(2,state.buffer.duration).toFixed(2);$('editor').hidden=false;updateSelection();message('audioReady');
}
function makeWav(samples){
 const b=new ArrayBuffer(44+samples.length*2),d=new DataView(b),bytes=new Uint8Array(b),str=(p,s)=>[...s].forEach((c,i)=>d.setUint8(p+i,c.charCodeAt(0)));
 str(0,'RIFF');d.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,16000,true);d.setUint32(28,32000,true);d.setUint16(32,2,true);d.setUint16(34,16,true);str(36,'data');d.setUint32(40,samples.length*2,true);
 let peak=0;for(const x of samples)peak=Math.max(peak,Math.abs(x));const gain=Math.min(1,.5/Math.max(peak,1e-9));for(let i=0;i<samples.length;i++){const ramp=Math.min(1,i/47,(samples.length-1-i)/47);d.setInt16(44+i*2,Math.max(-32768,Math.min(32767,Math.round(samples[i]*gain*ramp*32768))),true);}return bytes;
}
async function getEngine(){
 if(state.ffmpeg)return state.ffmpeg;message('engineLoading','busy');const f=new FFmpeg();
 try{await f.load({coreURL:new URL('ffmpeg/ffmpeg-core.js',document.baseURI).href,wasmURL:new URL('ffmpeg/ffmpeg-core.wasm',document.baseURI).href});}catch(e){f.terminate();console.error(e);fail('engineFailed');}state.ffmpeg=f;return f;
}
async function prepareAudio(){
 if(!state.buffer)fail('needAudio');resetPrepared();const [start,end]=selection(),offline=new OfflineAudioContext(1,Math.round((end-start)*16000),16000),source=offline.createBufferSource();source.buffer=state.buffer;source.connect(offline.destination);source.start(0,start,end-start);
 const rendered=await offline.startRendering(),wav=makeWav(rendered.getChannelData(0)),f=await getEngine();message('processing','busy');
 try{await f.writeFile('clip.wav',wav);if(await f.exec(['-hide_banner','-v','error','-i','clip.wav','-c:a','aac','-profile:a','aac_low','-b:a','24k','-aac_pns','0','-aac_tns','0','-f','adts','-y','tone.aac']))fail('encodingFailed');
 const aac=new Uint8Array(await f.readFile('tone.aac')).slice(),act=wrapAct(aac);if(!sameBytes(unwrapAct(act).aac,aac))fail('encodingFailed');
 if(await f.exec(['-hide_banner','-v','error','-i','tone.aac','-c:a','pcm_s16le','-y','preview.wav']))fail('encodingFailed');const preview=new Uint8Array(await f.readFile('preview.wav')).slice();state.prepared={act,preview};state.audioURL=URL.createObjectURL(new Blob([preview],{type:'audio/wav'}));$('prepared-audio').src=state.audioURL;$('preview-panel').hidden=false;message('preparedReady');
 }finally{for(const n of ['clip.wav','tone.aac','preview.wav'])try{await f.deleteFile(n);}catch{}}
}
async function previewOriginal(){
 const selected=selectedVoice();if(!selected?.replaceable)return;resetOriginal();const f=await getEngine();message('originalBusy','busy');
 try{await f.writeFile('original.aac',unwrapAct(selected.bytes).aac);if(await f.exec(['-hide_banner','-v','error','-i','original.aac','-c:a','pcm_s16le','-y','original.wav']))fail('encodingFailed');const wav=new Uint8Array(await f.readFile('original.wav')).slice();state.originalURL=URL.createObjectURL(new Blob([wav],{type:'audio/wav'}));$('original-audio').src=state.originalURL;$('original-audio').hidden=false;message('originalReady');}
 finally{for(const n of ['original.aac','original.wav'])try{await f.deleteFile(n);}catch{}}
}
$('pick-base').onclick=()=>$('base-file').click();$('pick-audio').onclick=()=>$('audio-file').click();
$('base-file').onchange=e=>{const file=e.target.files[0];e.target.value='';action(()=>readBase(file));};$('audio-file').onchange=e=>{const file=e.target.files[0];e.target.value='';action(()=>readAudio(file));};
for(const id of ['clip-start','clip-end','start-slider','end-slider'])$(id).oninput=()=>updateSelection(id);
$('wave').onclick=e=>{if(state.busy||!state.buffer)return;const box=$('wave').getBoundingClientRect();$('clip-start').value=((e.clientX-box.left)/box.width*state.buffer.duration).toFixed(2);updateSelection();};
$('play-clip').onclick=()=>action(async()=>{if(!state.buffer)fail('needAudio');await state.context.resume();if(state.source)try{state.source.stop();}catch{}const source=state.context.createBufferSource(),gain=state.context.createGain();gain.gain.value=.5;source.buffer=state.buffer;source.connect(gain);gain.connect(state.context.destination);const [start,end]=selection();source.start(0,start,end-start);state.source=source;});
$('prepare').onclick=()=>action(prepareAudio);$('play-original').onclick=()=>action(previewOriginal);
$('voice').onchange=()=>{resetBuild();resetOriginal();controls();};
$('build').onclick=()=>action(async()=>{if(!state.factory?.canBuild)fail('noBuild');if(!state.prepared||!selectedVoice()?.replaceable)fail('needInputs');message('building','busy');state.built=await buildFirmware(state.factory,$('voice').value,state.prepared.act);$('result').hidden=false;renderResult();message('doneHint');});
$('download').onclick=()=>{if(state.built){const r=state.built.report,model=r.model.replace(/^MCHOSE\s*/,'').replace(/[^A-Za-z0-9+-]/g,'');download(state.built.image,`MCHOSE-${model}-headset-${r.baseVersion}-custom-${r.target.replace('.act','')}.bin`);}};$('download-report').onclick=()=>{if(state.built)download(JSON.stringify(state.built.report,null,2),'MCHOSE-build-report.json','application/json');};$('download-act').onclick=()=>{if(state.prepared)download(state.prepared.act,'MCHOSE-custom.act');};
$('ui-language').onchange=e=>applyLanguage(e.target.value);
function changedCatalog(keepVariant=false){renderCatalogVariants(keepVariant?$('firmware-language').value:'');if(state.factory){state.factory=null;state.baseFile=null;resetBuild();resetOriginal();renderBase();renderVoices();}controls();}
$('model-select').onchange=()=>changedCatalog(false);$('firmware-language').onchange=()=>changedCatalog(true);
$('load-stock').onclick=()=>action(async()=>{const e=selectedCatalog();if(!e)fail('catalogError');message('loadingBase','busy');const response=await fetch(new URL(`firmware/${e.id}.bin`,document.baseURI));if(!response.ok)fail('catalogError');const data=new Uint8Array(await response.arrayBuffer());await readBaseBytes(data,`${e.model} / ${e.version}`);if(state.factory.digest!==e.sha256){state.factory=null;resetBuild();renderBase();renderVoices();fail('badChecksum');}});
document.querySelectorAll('input[name="base-source"]').forEach(input=>input.onchange=()=>{$('catalog-source').hidden=input.value!=='catalog';});
for(const kind of ['dragenter','dragover'])$('drop-zone').addEventListener(kind,e=>{e.preventDefault();if(!state.busy)$('drop-zone').classList.add('drag');});for(const kind of ['dragleave','drop'])$('drop-zone').addEventListener(kind,e=>{e.preventDefault();$('drop-zone').classList.remove('drag');});$('drop-zone').addEventListener('drop',e=>{if(!state.busy)action(()=>readAudio(e.dataTransfer.files[0]));});
let initial='ru';try{initial=localStorage.getItem('mchose-language')||(/^(en|zh)/.exec(navigator.language)?.[1]||'ru');}catch{}applyLanguage(initial);
try{const response=await fetch(new URL('catalog.json',document.baseURI));if(!response.ok)throw new Error(response.status);const catalog=await response.json();state.catalog=catalog.firmwares.filter(e=>e.kind==='headset');renderCatalog(false);controls();}catch(e){console.error(e);message('catalogFailed','error');}
