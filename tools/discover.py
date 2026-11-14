#!/usr/bin/env python3
"""Reproduce resource discovery without consulting stored resource offsets."""
import argparse,json,pathlib,hashlib,struct
from offline_core import unpack,validate_sbc,descramble,header,inspect

def discover(source):
    profiles=json.loads((pathlib.Path(__file__).parent/'offline-profiles.json').read_text())
    profile=next((p for p in profiles if p['sha256']==hashlib.sha256(source).hexdigest() and p['bytes']==len(source)),None)
    if profile is None:raise ValueError('Only the four pinned research originals are accepted')
    if profile['format']=='sbc-lzma':
        raw,_=unpack(source);records=[]
        for off in range(0,len(raw)-8,4):
            pointer,size=struct.unpack_from('<II',raw,off);a=pointer-0x2c020000
            if not 0<=a<a+size<=len(raw) or not 100<=size<=200000:continue
            data=raw[a:a+size]
            try:frames=validate_sbc(data)
            except ValueError:continue
            if frames>=10:records.append(dict(descriptor=off,offset=a,bytes=size,frames=frames))
        return dict(profile=profile['id'],resources=records)
    candidates=[]
    for key in range(65536):
        first=descramble(source[:64],key)
        try:
            a=header(first,0);b=header(first,32)
            if a['name']=='app_area_head' and b['name']=='app.bin' and 32<a['size']<=len(source):candidates.append(key)
        except (ValueError,UnicodeError):continue
    if len(candidates)!=1:raise ValueError('No unique key')
    key=candidates[0];roots,resources=inspect(descramble(source,key))
    return dict(profile=profile['id'],key=hex(key),roots=[r['name'] for r in roots],
                resources=[dict(name=name,descriptor=r['header'],offset=off,bytes=len(data)) for name,(r,off,data) in resources.items() if name.startswith('tone_zh/')])

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('original',type=pathlib.Path);args=p.parse_args()
    if args.original.stat().st_size>16*1024*1024:raise SystemExit('Input exceeds limit')
    print(json.dumps(discover(args.original.read_bytes()),indent=2))
