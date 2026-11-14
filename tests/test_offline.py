"""Public boundary checks and optional, private official-image integration checks."""
import sys,pathlib,unittest,tempfile,lzma,struct,os,json
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools'))
from offline_core import unpack,pack,descramble,header,crc,validate_sbc
from voice_lab import load,replace
from discover import discover

class Boundaries(unittest.TestCase):
    def test_crc_known_vector(self):
        self.assertEqual(crc(b'123456789'),0x31c3)

    def test_lzma_container_bounds(self):
        plain=b'container interoperability check'
        coded=lzma.compress(plain,format=lzma.FORMAT_ALONE,filters=[dict(id=lzma.FILTER_LZMA1,dict_size=65536,lc=3,lp=0,pb=2)])
        original=b'\xff'*4+len(coded).to_bytes(4,'big')+coded
        decoded,settings=unpack(original)
        self.assertEqual(decoded,plain)
        self.assertEqual(pack(decoded,settings),original)
        for bad in [original[:-1],b'BAD!'+original[4:],original[:4]+b'\xff'*4+original[8:]]:
            with self.assertRaises((ValueError,lzma.LZMAError)):unpack(bad)
        with self.assertRaises(ValueError):pack(decoded+b'X',settings)

    def test_sbc_rejects_malformed_data(self):
        for bad in [b'',b'\x9c',b'\x9c\x31',b'\x9c\x31\x35',bytes(114),b'\x9c\x31\x00'+bytes(111)]:
            with self.assertRaises(ValueError):validate_sbc(bad)

    def test_jlfs_crc_and_names(self):
        raw=bytearray(struct.pack('<HHIIBBH16s',0,0,32,64,0x82,0,1,b'power_on.wts'))
        struct.pack_into('<H',raw,0,crc(raw[2:]))
        self.assertEqual(header(raw,0)['name'],'power_on.wts')
        encrypted=descramble(raw,0xb1c7)
        self.assertEqual(descramble(encrypted,0xb1c7),raw)
        raw[8]^=1
        with self.assertRaises(ValueError):header(raw,0)

    def test_unknown_source_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/'unknown.bin';p.write_bytes(b'not a factory image')
            with self.assertRaises(ValueError):load(p)
            with self.assertRaises(ValueError):discover(p.read_bytes())

    @unittest.skipUnless(os.environ.get('MCHOSE_PRIVATE_FACTORY_DIR'),'private factory fixtures not supplied')
    def test_every_resource_and_original_roundtrip(self):
        root=pathlib.Path(os.environ['MCHOSE_PRIVATE_FACTORY_DIR'])
        for name in ['v9pro2-0032','v9pro2-1002','r9-0018','g9v2-0031']:
            profile,source,raw,settings,resources=load(root/(name+'.bin'))
            self.assertEqual(len(resources),25 if name.startswith('r9') else 17 if name.startswith('g9') else 15)
            for key,r in resources.items():
                self.assertEqual(replace(profile,raw,settings,resources,key,r['data']),source)
            p=root/(name+'.bin')
            with tempfile.TemporaryDirectory() as d:
                changed=bytearray(p.read_bytes());changed[-1]^=1;q=pathlib.Path(d)/'bad.bin';q.write_bytes(changed)
                with self.assertRaises(ValueError):load(q)

if __name__=='__main__':unittest.main()
