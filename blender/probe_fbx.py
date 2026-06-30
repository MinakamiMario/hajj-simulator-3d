import bpy, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index("--")+1:]
IN = argv[0]
bpy.ops.wm.read_factory_settings(use_empty=True)
# Blender 5.1 FBX-importer bug: zet light.cycles.cast_shadow (verwijderd in 5.x) → stub 'm
try:
    if not hasattr(bpy.types.CyclesLightSettings, 'cast_shadow'):
        bpy.types.CyclesLightSettings.cast_shadow = bpy.props.BoolProperty(default=True)
except Exception as e:
    print("[PROBE] stub-fail:", e)
bpy.ops.import_scene.fbx(filepath=IN, use_image_search=True)
objs=list(bpy.data.objects)
arms=[o for o in objs if o.type=='ARMATURE']
meshes=[o for o in objs if o.type=='MESH']
acts=list(bpy.data.actions)
print("[PROBE] objects:", len(objs), "armatures:", len(arms), "meshes:", len(meshes))
for a in arms:
    print("[PROBE] armature", a.name, "bones:", len(a.data.bones), "has_anim_data:", bool(a.animation_data and a.animation_data.action))
for ac in acts:
    fr=list(ac.frame_range); print("[PROBE] action:", ac.name, "frames:", [round(x,1) for x in fr], "fcurves:", len(ac.fcurves))
print("[PROBE] scene fps:", bpy.context.scene.render.fps, "frame_start..end:", bpy.context.scene.frame_start, bpy.context.scene.frame_end)
mn=Vector((1e9,1e9,1e9)); mx=Vector((-1e9,-1e9,-1e9))
for o in meshes:
    for c in o.bound_box:
        w=o.matrix_world @ Vector(c)
        for i in range(3):
            mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
print("[PROBE] mesh bbox size:", [round(mx[i]-mn[i],3) for i in range(3)], "min:", [round(v,2) for v in mn])
imgs=[i.name for i in bpy.data.images]
print("[PROBE] images:", len(imgs), imgs[:14])
