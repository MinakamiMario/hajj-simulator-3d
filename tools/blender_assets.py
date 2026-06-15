# Blender-assetpijplijn voor Hajj Simulator 3D
# Draaien (headless):
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender_assets.py
# Bouwt heilige bouwwerken met echte PBR-materialen en exporteert ze als GLB
# naar assets/models/. Modelleer-eenheden = game-eenheden (1 Blender-unit = 1 three.js-unit).
# Blender is Z-up; de glTF-exporter zet dat om naar Y-up (three.js) — dus Z = hoogte hier.
import bpy, os, math

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'models')
os.makedirs(OUT, exist_ok=True)

# ---------------- helpers ----------------
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, base, metallic=0.0, rough=0.8, emiss=None, emiss_str=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (base[0], base[1], base[2], 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    if emiss is not None:
        # Blender 4.x: aparte Emission Color + Strength sockets
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (emiss[0], emiss[1], emiss[2], 1)
            bsdf.inputs['Emission Strength'].default_value = emiss_str
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = (emiss[0], emiss[1], emiss[2], 1)
    return m

def box(name, sx, sy, sz, loc, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def cyl(name, r, h, loc, material, verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts)
    o = bpy.context.active_object; o.name = name
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def export(objs, filename):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    # join tot één mesh zodat het in de game één nette node is
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.location = (0, 0, 0)
    path = os.path.join(OUT, filename)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB',
        use_selection=True, export_apply=True,
        export_yup=True)
    # ruwe grootte rapporteren
    kb = os.path.getsize(path) / 1024
    print('  EXPORT %-16s %6.1f kB' % (filename, kb))

# ---------------- materialen ----------------
def materials():
    return {
        'kiswah': mat('kiswah', (0.018, 0.018, 0.02), 0.0, 0.55),      # zwarte kiswah-stof
        'gold':   mat('gold',   (0.86, 0.66, 0.24),  1.0, 0.30,        # gouden hizam/deur (reflecteert env-map)
                      emiss=(0.16, 0.12, 0.035), emiss_str=1.0),       # + subtiele gloed zodat het in donkere scènes niet zwart wordt
        'silver': mat('silver', (0.78, 0.78, 0.82),  1.0, 0.22),       # zilveren stenen-omlijsting
        'stone':  mat('stone',  (0.04, 0.03, 0.05),  0.2, 0.35),       # Hajar al-Aswad
        'marble': mat('marble', (0.90, 0.88, 0.82),  0.0, 0.45),       # marmeren sokkel
    }

# ---------------- KA'BA ----------------
def build_kaaba():
    reset(); M = materials()
    parts = []
    W, D, H = 3.2, 3.2, 3.6                                            # breedte, diepte, hoogte
    # marmeren sokkel (shadhirwan) onderaan
    parts.append(box('base', W + 0.5, D + 0.5, 0.35, (0, 0, 0.17), M['marble']))
    # romp met zwarte kiswah
    parts.append(box('body', W, D, H, (0, 0, 0.35 + H / 2), M['kiswah']))
    bandY = 0.35 + H * 0.66                                            # hizam-band op ~2/3 hoogte
    # gouden hizam-band, licht uitstekend rondom
    parts.append(box('hizam', W + 0.06, D + 0.06, 0.46, (0, 0, bandY), M['gold']))
    # verhoogde boven- en onderrand van de band (vangt env-licht → leest als geborduurde rand)
    for dz in (0.20, -0.20):
        parts.append(box('hizam_rail', W + 0.12, D + 0.12, 0.06, (0, 0, bandY + dz), M['gold']))
    # kalligrafie-suggestie: rij kleine verticale ribbels rond de hele band (reliëf zonder normal-map)
    hx, hy = W / 2 + 0.065, D / 2 + 0.065
    for sy in (hy, -hy):                                               # voor- en achterzijde
        for k in range(9):
            parts.append(box('orn', 0.075, 0.05, 0.22, (-W / 2 + (k + 0.5) * (W / 9), sy, bandY), M['gold']))
    for sx in (hx, -hx):                                               # linker- en rechterzijde
        for k in range(9):
            parts.append(box('orn', 0.05, 0.075, 0.22, (sx, -D / 2 + (k + 0.5) * (D / 9), bandY), M['gold']))
    # gouden deur (Bab) op de +Y-zijde, iets uit het midden en boven de grond
    parts.append(box('door', 0.95, 0.08, 1.7, (0.55, D / 2 + 0.02, 0.35 + 1.15), M['gold']))
    # Hajar al-Aswad: zilveren omlijsting + zwarte steen op de oosthoek
    cx, cy = W / 2 - 0.02, D / 2 - 0.02
    sframe = box('stoneframe', 0.34, 0.34, 0.34, (cx, cy, 0.35 + 1.5), M['silver'])
    sframe.rotation_euler = (0, 0, math.radians(45)); bpy.ops.object.transform_apply(rotation=True)
    parts.append(sframe)
    stone = cyl('hajar', 0.1, 0.16, (cx, cy, 0.35 + 1.5), M['stone'], 12)
    stone.rotation_euler = (math.radians(90), 0, math.radians(45)); bpy.ops.object.transform_apply(rotation=True)
    parts.append(stone)
    # gouden mizab (regengoot) op het dak, achterzijde
    parts.append(box('mizab', 0.3, 0.6, 0.12, (0, -D / 2 - 0.2, 0.35 + H + 0.02), M['gold']))
    export(parts, 'kaaba.glb')

# ---------------- NABAWI GROENE KOEPEL ----------------
def build_dome():
    reset(); M = materials()
    green = mat('domegreen', (0.06, 0.42, 0.20), 0.15, 0.45)
    cream = mat('domecream', (0.90, 0.86, 0.74), 0.0, 0.7)
    parts = []
    # vierkante drum/basis
    parts.append(box('drum', 2.0, 2.0, 1.4, (0, 0, 0.7), cream))
    parts.append(box('cornice', 2.2, 2.2, 0.25, (0, 0, 1.4), cream))
    # groene koepel (halve UV-bol, iets uitgerekt)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.25, location=(0, 0, 1.5), segments=40, ring_count=20)
    dome = bpy.context.active_object; dome.name = 'dome'
    dome.scale = (1, 1, 1.15)
    bpy.ops.object.transform_apply(scale=True)
    # onderste helft weghalen (alleen kap behouden)
    import bmesh
    me = dome.data; bm = bmesh.new(); bm.from_mesh(me)
    for v in [v for v in bm.verts if v.co.z < 0]:
        bm.verts.remove(v)
    bm.to_mesh(me); bm.free()
    dome.data.materials.append(green)
    bpy.ops.object.shade_smooth()
    parts.append(dome)
    # gouden spits + maan
    parts.append(cyl('finial', 0.07, 0.9, (0, 0, 3.0), M['gold'], 12))
    parts.append(cyl('crescent', 0.12, 0.04, (0, 0, 3.5), M['gold'], 16))
    export(parts, 'dome_nabawi.glb')

# ---------------- HARAM-ARCADE MODULE ----------------
def build_arch():
    reset(); M = materials()
    stone = mat('archstone', (0.86, 0.82, 0.72), 0.0, 0.7)
    parts = []
    # twee pilaren + boog ertussen (herhaalbare module)
    for sx in (-0.9, 0.9):
        parts.append(cyl('pillar', 0.28, 4.4, (sx, 0, 2.2), stone, 16))
        parts.append(box('capital', 0.7, 0.7, 0.3, (sx, 0, 4.45), M['gold']))
    # boogband bovenop (afgeplatte torus-helft benaderd met een dikke ring-box-reeks)
    bpy.ops.mesh.primitive_torus_add(location=(0, 0, 4.5), major_radius=0.9, minor_radius=0.16,
                                     major_segments=24, minor_segments=12)
    arch = bpy.context.active_object; arch.name = 'archband'
    arch.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    import bmesh
    me = arch.data; bm = bmesh.new(); bm.from_mesh(me)
    for v in [v for v in bm.verts if v.co.z < 0]:
        bm.verts.remove(v)
    bm.to_mesh(me); bm.free()
    arch.data.materials.append(stone)
    bpy.ops.object.shade_smooth()
    parts.append(arch)
    export(parts, 'arch_haram.glb')

# ---------------- ROTSEN (procedurele displacement, 3 varianten) ----------------
def build_rocks():
    import bmesh, random as rnd
    cols = [(0.40, 0.34, 0.26), (0.47, 0.41, 0.33), (0.33, 0.29, 0.23)]
    for idx in range(3):
        reset()
        rm = mat('rock%d' % idx, cols[idx], 0.0, 0.96)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.0)
        o = bpy.context.active_object; o.name = 'rock'
        me = o.data; bm = bmesh.new(); bm.from_mesh(me)
        rnd.seed((idx + 1) * 13)
        for v in bm.verts:
            n = v.normal.copy()
            f = (0.32 * math.sin(v.co.x * 2.6 + idx) + 0.30 * math.cos(v.co.y * 3.1 - idx)
                 + 0.26 * math.sin(v.co.z * 2.2 + idx * 2) + rnd.uniform(-0.14, 0.14))
            v.co = v.co + n * (f * 0.55)
            v.co.z *= 0.72                                             # iets afgeplat
        minz = min(v.co.z for v in bm.verts)
        for v in bm.verts:
            v.co.z -= minz                                            # voet op de grond (z=0)
        bm.normal_update(); bm.to_mesh(me); bm.free()
        me.materials.append(rm)
        bpy.ops.object.shade_flat()                                   # facetten → graniet-look
        export([o], 'rock%d.glb' % (idx + 1))

# ---------------- NABAWI-GEBEDSHAL: GI gebakken naar vertex-kleuren ----------------
def build_nabawi_interior():
    import bmesh
    reset()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 128
    try: sc.cycles.device = 'CPU'
    except Exception: pass
    # warme ambient via world
    w = bpy.data.worlds.new('hallworld'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs[0].default_value = (0.85, 0.74, 0.55, 1); bg.inputs[1].default_value = 0.28

    W, D, H = 23.0, 16.4, 5.7
    cream = mat('hallcream', (0.87, 0.81, 0.69), 0.0, 0.92)

    # één mesh met rasteroppervlakken (vloer + 4 muren + plafond), normalen naar binnen
    bm = bmesh.new()
    def surface(o, u, v, nu, nv):
        ox, oy, oz = o
        rows = []
        for j in range(nv + 1):
            row = []
            for i in range(nu + 1):
                p = (ox + u[0] * i / nu + v[0] * j / nv,
                     oy + u[1] * i / nu + v[1] * j / nv,
                     oz + u[2] * i / nu + v[2] * j / nv)
                row.append(bm.verts.new(p))
            rows.append(row)
        bm.verts.ensure_lookup_table()
        for j in range(nv):
            for i in range(nu):
                bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    nx, ny, nz = 34, 24, 10
    surface((-W/2, -D/2, 0.02), (W, 0, 0), (0, D, 0), nx, ny)            # vloer
    surface((-W/2, -D/2, H), (W, 0, 0), (0, D, 0), nx, ny)              # plafond
    surface((-W/2, -D/2, 0), (W, 0, 0), (0, 0, H), nx, nz)             # muur -Y
    surface((-W/2,  D/2, 0), (W, 0, 0), (0, 0, H), nx, nz)             # muur +Y
    surface((-W/2, -D/2, 0), (0, D, 0), (0, 0, H), ny, nz)             # muur -X
    surface(( W/2, -D/2, 0), (0, D, 0), (0, 0, H), ny, nz)             # muur +X
    me = bpy.data.meshes.new('hall'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('hall', me); bpy.context.collection.objects.link(o)
    o.data.materials.append(cream)
    # normalen consistent naar binnen
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.shade_smooth()
    # kleurattribuut voor de bake
    me.color_attributes.new('bake', 'FLOAT_COLOR', 'POINT')

    # warme lichtbronnen: 'vensters' langs de lange muren + 2 kroonluchters
    def area(loc, rot, energy, size, col):
        bpy.ops.object.light_add(type='AREA', location=loc); L = bpy.context.active_object
        L.data.energy = energy; L.data.size = size; L.data.color = col; L.rotation_euler = rot
    for yy in (-5, 0, 5):
        area((-W/2 + 0.3, yy, 3.4), (0, math.radians(90), 0), 220, 2.4, (1.0, 0.82, 0.55))
        area(( W/2 - 0.3, yy, 3.4), (0, math.radians(-90), 0), 220, 2.4, (1.0, 0.82, 0.55))
    for xx in (-6, 4):
        bpy.ops.object.light_add(type='POINT', location=(xx, 0, 4.4)); L = bpy.context.active_object
        L.data.energy = 600; L.data.color = (1.0, 0.86, 0.62)

    # bake GI naar vertex-kleuren
    sc.render.bake.target = 'VERTEX_COLORS'
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    try:
        bpy.ops.object.bake(type='COMBINED')
        print('  bake OK (Cycles COMBINED -> vertex colors)')
    except Exception as e:
        print('  bake FOUT:', e)
    # materiaal de vertex-kleur laten tonen zodat de export ze meeneemt
    o.data.materials.clear()
    vm = bpy.data.materials.new('hallbaked'); vm.use_nodes = True
    nt = vm.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    attr = nt.nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'bake'
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    o.data.materials.append(vm)
    # lampen weg vóór export (alleen de schil exporteren)
    for L in [x for x in bpy.data.objects if x.type in ('LIGHT',)]:
        bpy.data.objects.remove(L, do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.context.view_layer.objects.active = o
    path = os.path.join(OUT, 'nabawi_interior.glb')
    try:
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True,
                                  export_apply=True, export_yup=True, export_vertex_color='ACTIVE')
    except TypeError:
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True,
                                  export_apply=True, export_yup=True)
    print('  EXPORT %-16s %6.1f kB' % ('nabawi_interior.glb', os.path.getsize(path) / 1024))

if __name__ == '__main__':
    print('Blender-assets bouwen ->', os.path.abspath(OUT))
    build_kaaba()
    build_dome()
    build_arch()
    build_rocks()
    build_nabawi_interior()
    print('klaar')
