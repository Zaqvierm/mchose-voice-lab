"""Offline container primitives; never opens devices. See docs/wireless.en.md for provenance."""

import lzma, struct, binascii

def crc(data): return binascii.crc_hqx(data, 0)

def unpack(data):
    if data[:4]!=b'\xff'*4:raise ValueError('container magic')
    pos=4;blocks=[];settings=[]
    while pos<len(data):
        if pos+4>len(data):raise ValueError('truncated block length')
        size=int.from_bytes(data[pos:pos+4],'big');pos+=4
        if not 13<=size<=len(data)-pos:raise ValueError('block size')
        packed=data[pos:pos+size];pos+=size
        if packed[0]!=0x5d:raise ValueError('LZMA properties')
        dec=lzma.LZMADecompressor(format=lzma.FORMAT_ALONE,memlimit=256*1024*1024)
        raw=dec.decompress(packed,max_length=131073)
        if not dec.eof or dec.unused_data or len(raw)>131072:raise ValueError('LZMA block')
        blocks.append(raw);settings.append((len(raw),int.from_bytes(packed[1:5],'little')))
    return b''.join(blocks),settings

def pack(raw,settings):
    result=bytearray(b'\xff'*4);offset=0
    for size,dictionary in settings:
        part=raw[offset:offset+size];offset+=size
        compressed=lzma.compress(part,format=lzma.FORMAT_ALONE,filters=[dict(id=lzma.FILTER_LZMA1,dict_size=dictionary,lc=3,lp=0,pb=2)])
        result+=len(compressed).to_bytes(4,'big')+compressed
    if offset!=len(raw):raise ValueError('image size changed')
    return bytes(result)

def validate_sbc(data):
    pos=0;count=0
    if not data:raise ValueError('Empty SBC')
    prefix=data[:3]
    while pos<len(data):
        if pos+4>len(data):raise ValueError('Truncated SBC header')
        if data[pos:pos+2]!=b'\x9c\x31' or data[pos:pos+3]!=prefix or data[pos+2] not in (53,60):raise ValueError('SBC parameters')
        size=8+2*data[pos+2]
        if pos+size>len(data):raise ValueError('SBC length')
        bits=[]
        for b in data[pos+1:pos+3]+data[pos+4:pos+8]:bits.extend((b>>j)&1 for j in range(7,-1,-1))
        crc=15
        for bit in bits:
            high=crc>>7;crc=crc<<1&255
            if high^bit:crc^=29
        if crc!=data[pos+3]:raise ValueError('SBC CRC')
        pos+=size;count+=1
    return count

def descramble(data,key):
    out=bytearray(data)
    for block in range(0,len(out),32):
        state=(key^(block>>2))&65535
        for i in range(block,min(block+32,len(out))):
            out[i]^=state&255
            state=((state<<1)^(0x1021 if state&32768 else 0))&65535
    return bytes(out)

def header(data,offset):
    h=data[offset:offset+32]
    if len(h)!=32 or binascii.crc_hqx(h[2:],0)!=int.from_bytes(h[:2],'little'):
        raise ValueError('JLFS header CRC')
    hc,dc,loc,size,flags,res,index,name=struct.unpack('<HHIIBBH16s',h)
    name=name.split(b'\0')[0].decode('ascii')
    if not name or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-' for c in name):raise ValueError('unsafe name')
    return dict(header=offset,dataCRC=dc,location=loc,size=size,flags=flags,index=index,name=name)

def fix_header(raw,off):struct.pack_into('<H',raw,off,crc(raw[off+2:off+32]))

def inspect(raw):
    off=0;items={};records=[]
    while off<len(raw):
        e=header(raw,off);end=off+e['size']
        if not off+32<=end<=len(raw):raise ValueError('root bounds')
        if crc(raw[off+32:end])!=e['dataCRC']:raise ValueError('root data CRC')
        if e['flags']==0x83 and e['name'] in ['tone_zh','app_area_head']:
            pos=off+32
            while True:
                child=header(raw,pos);pos+=32
                if not child['flags']&0x10:
                    a=off+child['location'];b=a+child['size']
                    if not off+32<=a<=b<=end:raise ValueError('resource bounds')
                    data=bytes(raw[a:b])
                    if crc(data)!=child['dataCRC']:raise ValueError('resource CRC')
                    items[e['name']+'/'+child['name']]=(child,a,data)
                if child['index']:break
                if pos>=end:raise ValueError('directory end')
        records.append(e);off=end
        if e['index']:break
    if off!=len(raw):raise ValueError('trailing bytes')
    return records,items
