"""
Convert a (Mixamo/Sketchfab) FBX with skeletal animation → GLB, keeping animation + skin + textures.
Works around Blender 5.1's FBX-importer light bug (CyclesLightSettings.cast_shadow removed).
  blender --background --factory-startup --python fbx_to_glb.py -- <in.fbx> <out.glb> [target_height]
"""
import bpy, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index("--")+1:]
IN, OUT = argv[0], argv[1]
TARGET_H = float(argv[2]) if len(argv) > 2 else 1.7
def log(*a): print("[FBX]", *a)

bpy.ops.wm.read_factory_settings(use_empty=True)

# --- workaround: Blender 5.1 FBX importer crashes on lights (lamp.cycles.cast_shadow removed) ---
import io_scene_fbx.import_fbx as IM
_orig = IM.blen_read_light
def _safe_light(*a, **k):
    try:
        return _orig(*a, **k)
    except Exception as e:
        log("light skipped:", e); return None
IM.blen_read_light = _safe_light

bpy.ops.import_scene.fbx(filepath=IN, use_image_search=True)

arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
acts = list(bpy.data.actions)
log("armatures", len(arms), "meshes", len(meshes), "actions", len(acts))
for ac in acts:
    log("action", repr(ac.name), "frames", [round(x, 1) for x in ac.frame_range])

# drop cameras + lights
for o in list(bpy.data.objects):
    if o.type in ('CAMERA', 'LIGHT'):
        bpy.data.objects.remove(o, do_unlink=True)

def bbox():
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in [x for x in bpy.data.objects if x.type == 'MESH']:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for i in range(3):
                mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    return mn, mx
mn, mx = bbox(); H = mx.z - mn.z
log("import height", round(H, 3), "size", [round(mx[i] - mn[i], 2) for i in range(3)])

# normalize to TARGET_H by scaling root objects (NOT applied → animation stays intact)
s = TARGET_H / H if H > 1e-6 else 1.0
for o in bpy.data.objects:
    if o.parent is None:
        o.scale = (o.scale[0] * s, o.scale[1] * s, o.scale[2] * s)
bpy.context.view_layer.update()
log("scaled by", round(s, 4), "-> target", TARGET_H)

if acts:
    fr = acts[0].frame_range
    bpy.context.scene.frame_start = int(fr[0]); bpy.context.scene.frame_end = int(fr[1])

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB',
    use_selection=False, export_animations=True, export_skins=True,
    export_yup=True, export_apply=False,
)
log("exported", OUT)

import json, struct
with open(OUT, 'rb') as fh: dd = fh.read()
jl = struct.unpack('<I', dd[12:16])[0]; jj = json.loads(dd[20:20 + jl])
anims = jj.get('animations', [])
log("VERIFY animations", len(anims), "skins", len(jj.get('skins', [])), "images", len(jj.get('images', [])))
if anims:
    ch = anims[0].get('channels', [])
    paths = {}
    for c in ch:
        p = c.get('target', {}).get('path', '?'); paths[p] = paths.get(p, 0) + 1
    log("anim channels", len(ch), "by path", paths)
