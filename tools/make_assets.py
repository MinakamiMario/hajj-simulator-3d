#!/usr/bin/env python3
# GLB-assetgenerator voor Hajj Simulator 3D
# Pure Python (geen dependencies): bouwt low-poly modellen met vertex-kleuren
# en schrijft ze als .glb naar assets/models/.
import json, struct, math, os, random

random.seed(7)
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'models')
os.makedirs(OUT, exist_ok=True)

# ---------------- GLB-schrijver ----------------
def write_glb(path, pos, nor, col, idx):
    def pad4(b, ch=b'\x00'): return b + ch * ((4 - len(b) % 4) % 4)
    p = struct.pack('<%df' % len(pos), *pos)
    n = struct.pack('<%df' % len(nor), *nor)
    c = struct.pack('<%df' % len(col), *col)
    use32 = max(idx) > 65535
    i = struct.pack('<%d%s' % (len(idx), 'I' if use32 else 'H'), *idx)
    bin_ = b''; views = []
    def addview(data, target):
        nonlocal bin_
        off = len(bin_)
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(data), "target": target})
        bin_ = pad4(bin_ + data)
        return len(views) - 1
    vp = addview(p, 34962); vn = addview(n, 34962); vc = addview(c, 34962); vi = addview(i, 34963)
    nv = len(pos) // 3
    mn = [min(pos[k::3]) for k in range(3)]; mx = [max(pos[k::3]) for k in range(3)]
    gltf = {
        "asset": {"version": "2.0", "generator": "hajj-asset-gen"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "COLOR_0": 2},
                                     "indices": 3, "material": 0}]}],
        "materials": [{"pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1],
                                                  "metallicFactor": 0.0, "roughnessFactor": 0.95},
                        "doubleSided": True}],
        "buffers": [{"byteLength": len(bin_)}],
        "bufferViews": views,
        "accessors": [
            {"bufferView": vp, "componentType": 5126, "count": nv, "type": "VEC3", "min": mn, "max": mx},
            {"bufferView": vn, "componentType": 5126, "count": nv, "type": "VEC3"},
            {"bufferView": vc, "componentType": 5126, "count": nv, "type": "VEC3"},
            {"bufferView": vi, "componentType": 5125 if use32 else 5123, "count": len(idx), "type": "SCALAR"}],
    }
    j = pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    binc = pad4(bin_)
    total = 12 + 8 + len(j) + 8 + len(binc)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(j), 0x4E4F534A)); f.write(j)
        f.write(struct.pack('<II', len(binc), 0x004E4942)); f.write(binc)
    print('  %-14s %5.1f kB  %d tris' % (os.path.basename(path), total / 1024, len(idx) // 3))

# ---------------- meshbouwer ----------------
class Mesh:
    def __init__(self):
        self.pos = []; self.col = []; self.idx = []
    def v(self, p, c):
        self.pos.append(p); self.col.append(c); return len(self.pos) - 1
    def tri(self, a, b, c): self.idx += [a, b, c]
    def quad(self, a, b, c, d): self.tri(a, b, c); self.tri(a, c, d)
    # buis langs een pad (lijst punten), met straal per ring
    def tube(self, path, radii, sides, colfn):
        rings = []
        for i, p in enumerate(path):
            if i == 0: t = sub(path[1], path[0])
            elif i == len(path) - 1: t = sub(path[-1], path[-2])
            else: t = sub(path[i + 1], path[i - 1])
            t = norm(t)
            up = (0, 1, 0) if abs(t[1]) < 0.93 else (1, 0, 0)
            x = norm(cross(up, t)); y = cross(t, x)
            ring = []
            for s in range(sides):
                a = s / sides * 2 * math.pi
                d = add(mul(x, math.cos(a)), mul(y, math.sin(a)))
                ring.append(self.v(add(p, mul(d, radii[i])), colfn(i, s)))
            rings.append(ring)
        for i in range(len(rings) - 1):
            for s in range(sides):
                a, b = rings[i][s], rings[i][(s + 1) % sides]
                c, d = rings[i + 1][(s + 1) % sides], rings[i + 1][s]
                self.quad(a, b, c, d)
        return rings
    # plat blad (ribbon) langs pad, breedte per punt — voor palmbladeren
    def ribbon(self, path, widths, side_dir, colfn):
        L = []; R = []
        for i, p in enumerate(path):
            w = widths[i] / 2
            L.append(self.v(add(p, mul(side_dir, w)), colfn(i)))
            R.append(self.v(add(p, mul(side_dir, -w)), colfn(i)))
        for i in range(len(path) - 1):
            self.quad(L[i], R[i], R[i + 1], L[i + 1])
    # ellipsoïde blob met jitter (boomkruinen, rotsen)
    def blob(self, c, r, segs, ringsN, colfn, jit=0.12, squash=1.0):
        vs = []
        top = self.v(add(c, (0, r[1] * squash, 0)), colfn(1))
        bot = self.v(add(c, (0, -r[1] * squash, 0)), colfn(-1))
        for ri in range(1, ringsN):
            ph = ri / ringsN * math.pi
            row = []
            for s in range(segs):
                th = s / segs * 2 * math.pi
                j = 1 + (random.random() - 0.5) * jit
                pnt = (c[0] + r[0] * math.sin(ph) * math.cos(th) * j,
                       c[1] + r[1] * math.cos(ph) * squash * j,
                       c[2] + r[2] * math.sin(ph) * math.sin(th) * j)
                row.append(self.v(pnt, colfn(math.cos(ph))))
            vs.append(row)
        for s in range(segs):
            self.tri(top, vs[0][s], vs[0][(s + 1) % segs])
        for ri in range(len(vs) - 1):
            for s in range(segs):
                a, b = vs[ri][s], vs[ri][(s + 1) % segs]
                cc, d = vs[ri + 1][(s + 1) % segs], vs[ri + 1][s]
                self.quad(a, b, cc, d)
        for s in range(segs):
            self.tri(bot, vs[-1][(s + 1) % segs], vs[-1][s])
    # normalen (smooth): gemiddelde van vlaknormalen
    def build(self):
        nv = len(self.pos)
        acc = [[0.0, 0.0, 0.0] for _ in range(nv)]
        for i in range(0, len(self.idx), 3):
            a, b, c = self.idx[i], self.idx[i + 1], self.idx[i + 2]
            n = cross(sub(self.pos[b], self.pos[a]), sub(self.pos[c], self.pos[a]))
            for k in (a, b, c):
                acc[k][0] += n[0]; acc[k][1] += n[1]; acc[k][2] += n[2]
        nor = []
        for n in acc:
            l = math.sqrt(n[0]**2 + n[1]**2 + n[2]**2) or 1
            nor += [n[0] / l, n[1] / l, n[2] / l]
        pos = [x for p in self.pos for x in p]
        col = [x for c in self.col for x in c]
        return pos, nor, col, self.idx

def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def mul(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a):
    l = math.sqrt(a[0]**2 + a[1]**2 + a[2]**2) or 1
    return (a[0] / l, a[1] / l, a[2] / l)
def jitc(c, j=0.05):
    return tuple(max(0, min(1, x + (random.random() - 0.5) * j)) for x in c)

# ---------------- DADELPALM ----------------
def make_palm():
    m = Mesh()
    H = 3.1
    lean = 0.35
    path = []; radii = []
    NS = 11
    for i in range(NS):
        t = i / (NS - 1)
        path.append((math.sin(t * 1.2) * lean, t * H, 0))
        radii.append(0.17 * (1 - t * 0.45))
    bark1 = (0.22, 0.14, 0.08); bark2 = (0.30, 0.20, 0.12)
    m.tube(path, radii, 7, lambda i, s: jitc(bark1 if i % 2 else bark2, 0.06))
    top = path[-1]
    # 10 afhangende bladeren met gekartelde rand
    for fi in range(10):
        ang = fi / 10 * 2 * math.pi + 0.2
        droop = 0.5 + (fi % 3) * 0.25
        dirx, dirz = math.cos(ang), math.sin(ang)
        side = norm((-dirz, 0, dirx))
        fl = 2.0 + (fi % 2) * 0.25
        bp = []; bw = []
        NP = 9
        for i in range(NP):
            t = i / (NP - 1)
            r = t * fl
            y = top[1] + 0.25 + math.sin(min(t * 1.8, math.pi * 0.94)) * 0.85 - t * t * droop
            bp.append((top[0] + dirx * r, y, top[2] + dirz * r))
            saw = 0.75 + 0.25 * math.cos(t * 28)          # karteling
            bw.append(max(0.04, math.sin(min(t * 2.4, math.pi)) * 0.34 * saw))
        g1 = (0.10, 0.26, 0.07); g2 = (0.22, 0.42, 0.12)
        m.ribbon(bp, bw, side, lambda i, _g1=g1, _g2=g2: jitc(tuple(
            _g1[k] + (_g2[k] - _g1[k]) * (i / (NP - 1)) for k in range(3)), 0.04))
    # dadeltrossen
    for di in (-1, 1):
        cx = top[0] + di * 0.22
        m.blob((cx, top[1] + 0.02, 0.12 * di), (0.16, 0.26, 0.16), 6, 4,
               lambda _t: jitc((0.55, 0.33, 0.10), 0.1))
    write_glb(os.path.join(OUT, 'palm.glb'), *m.build())

# ---------------- ACACIA ----------------
def make_acacia():
    m = Mesh()
    bark = (0.20, 0.13, 0.07)
    # gevorkte stam: 3 takken vanuit één voet
    for bi in range(3):
        a = bi / 3 * 2 * math.pi + 0.5
        tip = (math.cos(a) * 0.9, 1.9 + (bi % 2) * 0.25, math.sin(a) * 0.9)
        path = [(0, 0, 0), (math.cos(a) * 0.18, 0.7, math.sin(a) * 0.18),
                (math.cos(a) * 0.55, 1.4, math.sin(a) * 0.55), tip]
        m.tube(path, [0.16, 0.11, 0.07, 0.045], 6, lambda i, s: jitc(bark, 0.05))
    # platte parasolkruin: 3 overlappende afgeplatte blobs
    g = (0.16, 0.30, 0.10)
    m.blob((0, 2.15, 0), (1.55, 0.28, 1.55), 9, 4, lambda t: jitc(g, 0.08))
    m.blob((0.7, 2.0, 0.4), (0.9, 0.2, 0.9), 7, 3, lambda t: jitc(g, 0.08))
    m.blob((-0.6, 2.05, -0.45), (0.85, 0.2, 0.85), 7, 3, lambda t: jitc(g, 0.08))
    write_glb(os.path.join(OUT, 'acacia.glb'), *m.build())

# ---------------- NABAWI-PARASOL ----------------
def make_parasol():
    m = Mesh()
    cream = (0.93, 0.90, 0.82); cream2 = (0.85, 0.81, 0.71)
    gold = (0.72, 0.58, 0.25)
    # achthoekige mast
    m.tube([(0, 0, 0), (0, 1.8, 0), (0, 3.3, 0)], [0.13, 0.11, 0.09], 8,
           lambda i, s: cream2)
    # kraag
    m.tube([(0, 3.05, 0), (0, 3.25, 0)], [0.17, 0.15], 8, lambda i, s: gold)
    # vierkant doek met doorzakkende randen en geschulpte zoom
    N = 8; S = 2.6
    rows = []
    for iz in range(N + 1):
        row = []
        for ix in range(N + 1):
            x = (ix / N - 0.5) * 2 * S
            z = (iz / N - 0.5) * 2 * S
            d = max(abs(x), abs(z)) / S
            y = 3.95 - d * d * 0.55
            edge = (ix in (0, N)) or (iz in (0, N))
            if edge:                                   # geschulpte rand
                y -= 0.10 + 0.07 * math.cos(((ix + iz) % 2) * math.pi)
            c = cream if (ix + iz) % 2 else jitc(cream, 0.02)
            row.append(m.v((x, y, z), c))
        rows.append(row)
    for iz in range(N):
        for ix in range(N):
            m.quad(rows[iz][ix], rows[iz][ix + 1], rows[iz + 1][ix + 1], rows[iz + 1][ix])
    # 8 ribben van kraag naar de hoeken/randen
    for ri in range(8):
        a = ri / 8 * 2 * math.pi + math.pi / 8
        ex, ez = math.cos(a) * S * (1.31 if ri % 2 == 0 else 0.95), math.sin(a) * S * (1.31 if ri % 2 == 0 else 0.95)
        ex = max(-S, min(S, ex)); ez = max(-S, min(S, ez))
        d = max(abs(ex), abs(ez)) / S
        ey = 3.95 - d * d * 0.55 - 0.12
        m.tube([(0, 3.28, 0), (ex * 0.55, (3.3 + ey) / 2 + 0.08, ez * 0.55), (ex, ey, ez)],
               [0.045, 0.04, 0.03], 5, lambda i, s: cream2)
    # gouden punt
    m.tube([(0, 3.95, 0), (0, 4.35, 0)], [0.07, 0.01], 6, lambda i, s: gold)
    write_glb(os.path.join(OUT, 'parasol.glb'), *m.build())

print('Assets bouwen →', os.path.abspath(OUT))
make_palm(); make_acacia(); make_parasol()
print('klaar')
