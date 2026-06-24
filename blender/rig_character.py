"""
Auto-rig a static T-posed humanoid GLB with a named humanoid armature + automatic weights.
Bind pose stays in T (clean auto-weights); arms are rotated down at RUNTIME in the game.
Run headless:
  blender --background --factory-startup --python rig_character.py -- <in.glb> <out.glb> <target_height> <gender m|f>
"""
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--")+1:]
IN, OUT = argv[0], argv[1]
TARGET_H = float(argv[2]) if len(argv) > 2 else 1.65
GENDER = argv[3] if len(argv) > 3 else 'm'

def log(*a): print("[RIG]", *a)

# ---- clean scene ----
bpy.ops.wm.read_factory_settings(use_empty=True)

# ---- import ----
bpy.ops.import_scene.gltf(filepath=IN)
bpy.ops.object.select_all(action='SELECT')
# clear parenting (empties), keep transforms
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
# delete everything that's not a mesh
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
log("meshes after import:", len(meshes))
# join all meshes into one
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
body.name = "Body"
# bake transforms
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---- normalize size & position: feet at Z=0, centered X/Y, scaled to TARGET_H ----
def bbox(o):
    o.update_from_editmode() if o.mode=='EDIT' else None
    cs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(c.x for c in cs), min(c.y for c in cs), min(c.z for c in cs)))
    mx = Vector((max(c.x for c in cs), max(c.y for c in cs), max(c.z for c in cs)))
    return mn, mx

mn, mx = bbox(body)
h = mx.z - mn.z
s = TARGET_H / h
# move to origin first (feet 0, center xy), then scale about origin
body.location -= Vector(((mn.x+mx.x)/2, (mn.y+mx.y)/2, mn.z))
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
body.scale = (s, s, s)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
mn, mx = bbox(body)
H = mx.z - mn.z
halfspan = max(abs(mn.x), abs(mx.x))   # half arm-span (T-pose)
log(f"normalized H={H:.3f} halfspan={halfspan:.3f} depthY=[{mn.y:.2f},{mx.y:.2f}]")

# ---- build armature ----
bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0))
arm = bpy.context.view_layer.objects.active
arm.name = "Armature"
amt = arm.data
amt.name = "rig"
eb = amt.edit_bones
for b in list(eb): eb.remove(b)   # remove default bone

# fractions of height
def Z(f): return H*f
sx = max(0.07, halfspan*0.16)        # shoulder x
# elbow/hand along the T-posed arm
ex = halfspan*0.55
hx = halfspan*0.92
legx = H*0.06                        # leg separation

def bone(name, head, tail, parent=None, connect=False):
    b = eb.new(name)
    b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = parent; b.use_connect = connect
    return b

hips  = bone("hips",  (0,0,Z(0.50)), (0,0,Z(0.56)))
spine = bone("spine", (0,0,Z(0.56)), (0,0,Z(0.70)), hips, True)
chest = bone("chest", (0,0,Z(0.70)), (0,0,Z(0.82)), spine, True)
neck  = bone("neck",  (0,0,Z(0.82)), (0,0,Z(0.88)), chest, True)
head  = bone("head",  (0,0,Z(0.88)), (0,0,Z(1.00)), neck, True)
for side, sgn in (("L",1.0),("R",-1.0)):
    sh = bone("shoulder."+side, (sgn*sx,0,Z(0.83)), (sgn*sx*2,0,Z(0.83)), chest, False)
    ua = bone("upperarm."+side, (sgn*sx*2,0,Z(0.83)), (sgn*ex,0,Z(0.83)), sh, True)
    fa = bone("forearm."+side,  (sgn*ex,0,Z(0.83)), (sgn*hx,0,Z(0.83)), ua, True)
    hd = bone("hand."+side,     (sgn*hx,0,Z(0.83)), (sgn*(hx+halfspan*0.08),0,Z(0.83)), fa, True)
    th = bone("thigh."+side, (sgn*legx,0,Z(0.50)), (sgn*legx,0,Z(0.28)), hips, False)
    sn = bone("shin."+side,  (sgn*legx,0,Z(0.28)), (sgn*legx,0,Z(0.06)), th, True)
    ft = bone("foot."+side,  (sgn*legx,0,Z(0.06)), (sgn*legx,-H*0.10,Z(0.01)), sn, True)

bpy.ops.object.mode_set(mode='OBJECT')

# ---- parent body to armature with automatic weights ----
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
# ---- MANUAL weighting (bone-heat fails on multi-part imported meshes → no skin) ----
# Per vertex: blend the nearest 1-2 bone segments by inverse distance → always valid weights.
def pt_seg_dist(p, a, b):
    ab = b - a; L2 = ab.length_squared
    t = 0.0 if L2 < 1e-9 else max(0.0, min(1.0, (p - a).dot(ab) / L2))
    return (p - (a + ab*t)).length

segs = [(b.name, b.head_local.copy(), b.tail_local.copy()) for b in arm.data.bones]
vgs = {name: body.vertex_groups.new(name=name) for (name, _, _) in segs}
me = body.data
hipZ = H*0.50
# robed characters (dress / kameez): weight the WHOLE lower body rigidly to the hips so the
# garment never tears; only upper body + arms + head articulate (we animate bob + arms, not legs).
LOWER = {'thighL','shinL','footL','thighR','shinR','footR'}
upper_segs = [s for s in segs if s[0] not in LOWER]
for v in me.vertices:
    p = v.co
    if p.z < hipZ:
        vgs['hips'].add([v.index], 1.0, 'REPLACE')
        continue
    ds = sorted(((pt_seg_dist(p, h, t_), name) for (name, h, t_) in upper_segs), key=lambda x: x[0])
    d1, n1 = ds[0]; d2, n2 = ds[1]; eps = 1e-4
    w1 = 1.0/(d1+eps); w2 = (1.0/(d2+eps)) if d2 <= d1*1.8 else 0.0
    s = w1 + w2
    vgs[n1].add([v.index], w1/s, 'REPLACE')
    if w2 > 0: vgs[n2].add([v.index], w2/s, 'REPLACE')
md = body.modifiers.new('Armature', 'ARMATURE'); md.object = arm
for b in arm.data.bones: b.use_deform = True
body.parent = arm
log("manual weights done; groups:", len(body.vertex_groups))

# ---- export GLB (with skin) — whole scene ----
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_skins=True,
    export_yup=True,
)
log("exported", OUT)
# verify skin made it in
import json, struct
with open(OUT, 'rb') as fh: dd = fh.read()
jl = struct.unpack('<I', dd[12:16])[0]; jj = json.loads(dd[20:20+jl])
log("VERIFY skins in output:", len(jj.get('skins', [])))
