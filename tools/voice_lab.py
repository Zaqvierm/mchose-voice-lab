#!/usr/bin/env python3
"""Experimental, local-only SBC/LZMA and WTS/JLFS workflow. Never flashes devices."""
import argparse
import hashlib
import json
import math
import os
import pathlib
import shutil
import struct
import subprocess
import tempfile
import urllib.request
import wave

from offline_core import unpack, pack, validate_sbc, descramble, inspect, crc, fix_header

HERE = pathlib.Path(__file__).resolve().parent

def require(value, message):
    if not value:
        raise ValueError(message)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def run(args, cwd=None):
    result = subprocess.run([str(x) for x in args], cwd=cwd, capture_output=True, timeout=120)
    require(result.returncode == 0, result.stderr.decode(errors='replace')[:500] or 'Codec process failed')
    return result

def load(path):
    require(path.stat().st_size <= 16 * 1024 * 1024, 'Firmware exceeds size limit')
    source = path.read_bytes()
    profile = next((p for p in json.loads((HERE/'offline-profiles.json').read_text())
                    if p['sha256'] == digest(source) and p['bytes'] == len(source)), None)
    require(profile, 'Unknown or modified original firmware; no substitute profile is allowed')
    if profile['format'] == 'sbc-lzma':
        raw, settings = unpack(source)
        require(pack(raw, settings) == source, 'Original does not rebuild byte-identically')
        resources = {}
        ranges = []
        for item in profile['resources']:
            a, n = item['offset'], item['bytes']
            require(0 <= a < a+n <= len(raw), 'Invalid resource bounds')
            require(struct.unpack_from('<II', raw, item['descriptor']) == (0x2c020000+a, n), 'Resource table mismatch')
            require(not any(a < y and x < a+n for x,y in ranges), 'Overlapping resources')
            ranges.append((a,a+n))
            data = raw[a:a+n]
            require(validate_sbc(data) == item['frames'], 'SBC structure mismatch')
            resources[item['name']] = {**item, 'data': data}
        return profile, source, raw, settings, resources
    raw = descramble(source, profile['key'])
    roots, items = inspect(raw)
    require(descramble(raw, profile['key']) == source, 'JLFS outer roundtrip failed')
    resources = {name: {**record, 'offset': offset, 'bytes': len(data), 'data': data}
                 for name,(record,offset,data) in items.items() if name.startswith('tone_zh/') and name.endswith('.wts')}
    require(len(resources) == 17, 'Unexpected G9 resource set')
    return profile, source, raw, roots, resources

def tool_paths(directory):
    require(os.name == 'nt', 'WTS encoding currently requires Windows and official vendor tools')
    result = {}
    for item in json.loads((HERE/'audio-tools.json').read_text()):
        path = (directory/item['name']).resolve()
        require(path.is_file() and digest(path.read_bytes()) == item['sha256'], 'Missing or altered codec tool: '+item['name'])
        result[item['name']] = path
    return result

def prepare_tools(directory):
    directory.mkdir(parents=True, exist_ok=True)
    for item in json.loads((HERE/'audio-tools.json').read_text()):
        path = directory/item['name']
        if path.exists():
            require(digest(path.read_bytes()) == item['sha256'], 'Existing tool hash mismatch')
            continue
        with urllib.request.urlopen(item['url'], timeout=30) as response:
            data = response.read(4*1024*1024+1)
        require(len(data) <= 4*1024*1024 and digest(data) == item['sha256'], 'Downloaded tool hash mismatch')
        with path.open('xb') as f:
            f.write(data)

def encode(args, profile, resource, work):
    audio = args.audio.resolve()
    require(audio.is_file() and audio.stat().st_size <= 25*1024*1024, 'Audio must be a local file up to 25 MB')
    require(audio.suffix.lower() in ['.wav','.mp3','.flac','.ogg','.m4a'], 'Unsupported input audio extension')
    require(math.isfinite(args.start) and args.start >= 0, 'Invalid start time')
    require(args.duration is None or math.isfinite(args.duration) and 0 < args.duration <= 600, 'Invalid duration')
    ffmpeg = shutil.which(args.ffmpeg)
    require(ffmpeg, 'FFmpeg not found; pass --ffmpeg with its executable path')
    sbc = profile['format'] == 'sbc-lzma'
    seconds = resource['frames']*128/16000 if sbc else 30
    pcm = work/'input.pcm'
    command = [ffmpeg,'-v','error','-nostdin','-protocol_whitelist','file,pipe','-ss',str(args.start),'-i',str(audio),
               '-t',str(min(args.duration or seconds+1, seconds+1)), '-vn','-ac','1','-ar','16000' if sbc else '32000',
               '-af','alimiter=limit=0.5:level=false,afade=t=in:d=0.003', '-f','s16le','-y',str(pcm)]
    run(command)
    require(pcm.stat().st_size > 0, 'Selected audio range is empty')
    if not sbc:
        require(pcm.stat().st_size <= 30*32000*2, 'WTS selection exceeds 30 seconds; trim with --duration')
    if sbc:
        require(pcm.stat().st_size <= resource['frames']*128*2, 'Audio is too long for this SBC slot; trim with --duration')
        pcm.write_bytes(pcm.read_bytes()+bytes(resource['frames']*128*2-pcm.stat().st_size+1024))
        output = work/'encoded.sbc'
        bitrate = (8 + 2*resource['data'][2])*1000
        run([ffmpeg,'-v','error','-nostdin','-f','s16le','-ar','16000','-ac','1','-i',pcm,
             '-c:a','sbc','-b:a',str(bitrate),'-sbc_delay','0.013','-f','sbc','-y',output])
        data = output.read_bytes()[:resource['bytes']]
        require(len(data) == resource['bytes'] and data[:3] == resource['data'][:3] and validate_sbc(data) == resource['frames'], 'Encoded SBC parameters differ from factory')
        output.write_bytes(data)
        preview = work/'preview.wav'
        run([ffmpeg,'-v','error','-nostdin','-f','sbc','-i',output,'-y',preview])
        return data, preview
    tools = tool_paths(args.tools_dir)
    # Vendor CLI uses fixed-length path buffers: give it only short relative names.
    run([tools['wtgv2_resample.exe'],'input.pcm','prepared.pcm'], cwd=work)
    run([tools['wtgv2_encode.exe'],'prepared.pcm','encoded.wts','aux.raw','16000','16000','20','0.35','1'], cwd=work)
    data = (work/'encoded.wts').read_bytes()
    require(100 <= len(data) <= resource['bytes'], 'Encoded WTS exceeds the original slot; shorten the audio')
    run([tools['wtgv2_decode.exe'],'encoded.wts','preview.wav'], cwd=work)
    preview = work/'preview.wav'
    require(preview.is_file() and preview.read_bytes()[:4] == b'RIFF', 'WTS preview failed')
    with wave.open(str(preview),'rb') as wav:
        require(wav.getframerate()==16000 and wav.getsampwidth()==2 and wav.getnchannels() in (1,2) and wav.getnframes()>0, 'Unexpected WTS preview parameters')
    return data, preview

def replace(profile, raw, settings, resources, name, data):
    target = resources[name]
    a, n = target['offset'], target['bytes']
    changed = bytearray(raw)
    require(0 < len(data) <= n, 'Replacement does not fit')
    changed[a:a+len(data)] = data
    allowed = [(a,a+len(data))]
    if profile['format'] == 'sbc-lzma':
        require(len(data) == n and validate_sbc(data) == target['frames'], 'SBC replacement mismatch')
        result = pack(changed, settings)
        require(unpack(result)[0] == changed, 'Rebuilt container mismatch')
    else:
        off = target['header']
        struct.pack_into('<H',changed,off+2,crc(data))
        struct.pack_into('<I',changed,off+8,len(data))
        fix_header(changed,off)
        tone = next(e for e in settings if e['name']=='tone_zh')
        to = tone['header']
        struct.pack_into('<H',changed,to+2,crc(changed[to+32:to+tone['size']]))
        fix_header(changed,to)
        _, after = inspect(changed)
        require(after[name][2] == data, 'Target resource mismatch')
        for item,r in resources.items():
            if item != name:require(after[item][2] == r['data'], 'Non-target resource changed')
        for e in settings:
            if e['name']!='tone_zh':require(raw[e['header']:e['header']+e['size']]==changed[e['header']:e['header']+e['size']], 'Non-tone section changed')
        allowed += [(off,off+32),(to,to+32)]
        result = descramble(changed, profile['key'])
        require(descramble(result,profile['key']) == changed, 'Rebuilt JLFS transform mismatch')
    require(len(raw)==len(changed), 'Decoded image length changed')
    for i,(x,y) in enumerate(zip(raw,changed)):
        require(x==y or any(lo<=i<hi for lo,hi in allowed), 'Changed bytes outside permitted ranges')
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command',required=True)
    prep = sub.add_parser('prepare-tools',help='Download hash-pinned official Windows WTS codecs; does not execute them')
    prep.add_argument('--tools-dir',type=pathlib.Path,required=True)
    for command in ['inspect','extract','replace']:
        p = sub.add_parser(command)
        p.add_argument('firmware',type=pathlib.Path)
        if command=='extract':p.add_argument('--directory',type=pathlib.Path,required=True)
        if command=='replace':
            p.add_argument('--resource',required=True)
            p.add_argument('--audio',type=pathlib.Path,required=True)
            p.add_argument('--output',type=pathlib.Path,required=True)
            p.add_argument('--start',type=float,default=0)
            p.add_argument('--duration',type=float)
            p.add_argument('--ffmpeg',default='ffmpeg')
            p.add_argument('--tools-dir',type=pathlib.Path,default=HERE/'vendor-tools')
            p.add_argument('--experimental',action='store_true',help='Acknowledge these model profiles have no project hardware-flash validation')
    args = parser.parse_args()
    if args.command=='prepare-tools':
        prepare_tools(args.tools_dir)
        print('Official codecs downloaded and SHA256-verified. No device functions are present.')
        return
    profile,source,raw,settings,resources = load(args.firmware)
    if args.command=='inspect':
        print(json.dumps({'profile':profile['id'],'format':profile['format'],'noOpExact':True,'hardwareTested':False,
                          'resources':[{'name':k,'bytes':v['bytes'],'eventConfirmed':profile['format']=='wts-jlfs'} for k,v in resources.items()]},indent=2))
        return
    if args.command=='extract':
        require(not args.directory.exists(), 'Extraction directory must not exist')
        args.directory.mkdir(parents=True)
        for name,r in resources.items():
            file = args.directory/(name.replace('/','--')+('.sbc' if profile['format']=='sbc-lzma' else ''))
            file.write_bytes(r['data'])
        print('Extracted',len(resources),'resources')
        return
    require(args.experimental, 'Pass --experimental; software checks do not establish hardware safety')
    require(args.resource in resources, 'Unknown resource name; use inspect first')
    outputs=[args.output,args.output.with_suffix('.preview.wav'),args.output.with_suffix('.report.json')]
    require(all(not p.exists() for p in outputs), 'Output, preview or report already exists; refusing overwrite')
    require(all(p.resolve()!=args.firmware.resolve() for p in outputs), 'Cannot overwrite the original')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='voice-lab-') as temp:
        data,preview = encode(args,profile,resources[args.resource],pathlib.Path(temp))
        result = replace(profile,raw,settings,resources,args.resource,data)
        report={'profile':profile['id'],'resource':args.resource,'sourceSHA256':digest(source),'outputSHA256':digest(result),
                'noOpExact':True,'onlyPermittedRangesChanged':True,'newResourceBytes':len(data),'hardwareTested':False,
                'eventConfirmed':profile['format']=='wts-jlfs','warning':'Experimental image. Listen to preview. No flashing is performed.'}
        # The firmware is written last; an interrupted preview/report save leaves no image.
        with outputs[1].open('xb') as f:f.write(preview.read_bytes())
        with outputs[2].open('x',encoding='utf8') as f:json.dump(report,f,indent=2)
        partial = None
        try:
            with tempfile.NamedTemporaryFile(dir=args.output.parent, prefix='.voice-lab-', suffix='.tmp', delete=False) as f:
                partial = pathlib.Path(f.name)
                f.write(result)
                f.flush()
                os.fsync(f.fileno())
            # Same-directory hard link publishes the complete file exclusively.
            os.link(partial, outputs[0])
        finally:
            if partial is not None:partial.unlink(missing_ok=True)
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    try:main()
    except (ValueError,OSError,wave.Error,subprocess.SubprocessError) as error:
        raise SystemExit(str(error))
