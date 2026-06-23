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

def cone(name, r1, r2, h, loc, material, verts=8):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=h, location=loc, vertices=verts)
    o = bpy.context.active_object; o.name = name
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def sphere(name, r, loc, material, segs=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs, ring_count=rings)
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

# ---------------- MINARET (zandsteen schacht + balkon + uienkap + spits) ----------------
def build_minaret():
    reset(); M = materials()
    sand  = mat('msand',  (0.90, 0.86, 0.74), 0.0, 0.7)
    sand2 = mat('msand2', (0.82, 0.77, 0.64), 0.0, 0.75)
    gold  = M['gold']
    green = mat('mgreen', (0.07, 0.42, 0.22), 0.1, 0.5)
    P = []
    P.append(box('plinth', 1.3, 1.3, 0.5, (0, 0, 0.25), sand2))            # plint
    P.append(box('mbase', 1.0, 1.0, 1.2, (0, 0, 1.1), sand))               # vierkante voet
    P.append(cone('shaft', 0.62, 0.40, 8.4, (0, 0, 5.9), sand, 8))         # taps achthoekige schacht z1.7..10.1
    P.append(cyl('balcrail', 0.96, 0.07, (0, 0, 10.0), gold, 12))          # gouden balkonrand
    P.append(cyl('balcony', 0.92, 0.45, (0, 0, 10.25), sand2, 12))         # muezzin-balkon
    P.append(cone('drum', 0.42, 0.34, 1.8, (0, 0, 11.9), sand, 8))         # bovenste drum z11.0..12.8
    cap = sphere('cap', 0.5, (0, 0, 13.2), green, 16, 10)                  # groene uienkap
    cap.scale = (0.95, 0.95, 1.5)
    bpy.context.view_layer.objects.active = cap
    bpy.ops.object.select_all(action='DESELECT'); cap.select_set(True)
    bpy.ops.object.transform_apply(scale=True)
    P.append(cap)
    P.append(cone('spire', 0.11, 0.0, 0.9, (0, 0, 14.5), gold, 8))         # gouden spits
    P.append(sphere('finbulb', 0.14, (0, 0, 14.6), gold, 12, 8))           # bol aan de voet van de spits
    export(P, 'minaret.glb')

# ---------------- MINA-TENT (witte piramidetent met groene zoom) ----------------
def build_tent():
    reset()
    white  = mat('twhite',  (0.94, 0.92, 0.86), 0.0, 0.6)
    white2 = mat('twhite2', (0.86, 0.83, 0.75), 0.0, 0.7)
    green  = mat('tgreen',  (0.13, 0.45, 0.27), 0.1, 0.5)
    sand   = mat('tsand',   (0.78, 0.70, 0.52), 0.0, 0.8)
    dark   = mat('tdark',   (0.18, 0.14, 0.11), 0.0, 0.8)
    P = []
    P.append(box('walls', 2.3, 2.3, 0.6, (0, 0, 0.3), white2))             # lage wanden
    for sx, sy, w, d in [(0, 1.15, 2.42, 0.12), (0, -1.15, 2.42, 0.12),
                         (1.15, 0, 0.12, 2.42), (-1.15, 0, 0.12, 2.42)]:
        P.append(box('trim', w, d, 0.13, (sx, sy, 0.6), green))            # groene daklijn-zoom
    roof = cone('roof', 1.63, 0.0, 1.3, (0, 0, 1.25), white, 4)            # 4-zijdig piramidedak z0.6..1.9
    roof.rotation_euler = (0, 0, math.radians(45))
    bpy.context.view_layer.objects.active = roof
    bpy.ops.object.select_all(action='DESELECT'); roof.select_set(True)
    bpy.ops.object.transform_apply(rotation=True)
    P.append(roof)
    P.append(cyl('pole', 0.05, 0.3, (0, 0, 2.0), sand, 6))                 # nokpaaltje
    P.append(sphere('knob', 0.1, (0, 0, 2.2), white, 10, 6))              # knop
    P.append(box('door', 0.55, 0.06, 0.78, (0, -1.16, 0.39), dark))       # donkere ingang op -Y
    export(P, 'tent.glb')

# ---------------- HANG-LANTAARN (zeshoekige messing kooi + warm glas) ----------------
def build_lantern():
    reset(); M = materials()
    gold  = M['gold']
    glass = mat('lglass', (1.0, 0.80, 0.42), 0.0, 0.3, emiss=(1.0, 0.78, 0.40), emiss_str=3.0)
    P = []
    P.append(cyl('glassbody', 0.22, 0.42, (0, 0, 0.0), glass, 6))          # zeshoekig glas-corpus
    P.append(cyl('ringB', 0.24, 0.05, (0, 0, -0.22), gold, 6))             # gouden onderring
    P.append(cyl('ringT', 0.20, 0.05, (0, 0, 0.22), gold, 6))             # gouden bovenring
    for i in range(6):                                                     # verticale gouden ribben
        a = i / 6 * 2 * math.pi
        P.append(box('rib', 0.03, 0.03, 0.46, (math.cos(a) * 0.21, math.sin(a) * 0.21, 0.0), gold))
    P.append(sphere('finial', 0.09, (0, 0, -0.30), gold, 10, 6))           # onderfinial
    P.append(cone('fintip', 0.05, 0.0, 0.12, (0, 0, -0.40), gold, 6))
    P.append(cone('neck', 0.18, 0.07, 0.22, (0, 0, 0.36), gold, 6))        # bovenhals
    bpy.ops.mesh.primitive_torus_add(location=(0, 0, 0.56), major_radius=0.06, minor_radius=0.018,
                                     major_segments=12, minor_segments=6)
    hook = bpy.context.active_object; hook.name = 'hook'
    hook.data.materials.append(gold); bpy.ops.object.shade_smooth()
    P.append(hook)                                                         # ophangoog bovenaan
    export(P, 'lantern.glb')

# ---------------- JAMARAAT (moderne ovale jamrah-muur + vangbak + multi-level brug) ----------------
def build_jamaraat():
    reset(); M = materials()
    wall  = mat('jwall',  (0.83, 0.82, 0.79), 0.0, 0.6)    # jamrah-muur (licht beton)
    capm  = mat('jcap',   (0.72, 0.71, 0.68), 0.0, 0.7)    # kaplijst / kolommen
    basin = mat('jbasin', (0.33, 0.33, 0.37), 0.15, 0.55)  # donkere vangbak
    deck  = mat('jdeck',  (0.86, 0.83, 0.76), 0.0, 0.8)    # brugdek (zandsteen)
    gold  = M['gold']
    P = []
    wbase = mat('jwbase', (0.60, 0.58, 0.55), 0.0, 0.7)   # donkere voet van de muur
    col   = mat('jcol',   (0.78, 0.76, 0.71), 0.0, 0.7)   # kolommen (warm beton)
    Lh = 3.6   # halve lengte van de muur (langs Y)
    # --- jamrah-muur: HOOG en ovaal (de hoofdvorm) ---
    P.append(box('jwbase', 1.05, 2 * Lh + 0.7, 0.8, (0, 0, 0.4), wbase))       # brede voet
    P.append(box('jamrah', 0.8, 2 * Lh, 5.2, (0, 0, 3.0), wall))               # kern z0.4..5.6
    for sgn in (1, -1):
        P.append(cyl('jend', 0.4, 5.2, (0, sgn * Lh, 3.0), wall, 22))          # afgeronde uiteinden
    P.append(box('jcapbar', 0.96, 2 * Lh, 0.34, (0, 0, 5.75), capm))           # kaplijst
    for sgn in (1, -1):
        P.append(cyl('jcapend', 0.48, 0.34, (0, sgn * Lh, 5.75), capm, 22))
    # --- ovale verzonken vangbak: rand (torus geschaald) + donkere vloer ---
    bpy.ops.mesh.primitive_torus_add(location=(0, 0, 0.42), major_radius=3.9, minor_radius=0.55,
                                     major_segments=56, minor_segments=12)
    rim = bpy.context.active_object; rim.name = 'basinRim'
    rim.scale = (1.0, 1.65, 0.85)
    bpy.context.view_layer.objects.active = rim
    bpy.ops.object.select_all(action='DESELECT'); rim.select_set(True)
    bpy.ops.object.transform_apply(scale=True)
    rim.data.materials.append(basin); bpy.ops.object.shade_smooth()
    P.append(rim)
    flr = cyl('basinFloor', 3.7, 0.14, (0, 0, 0.07), basin, 52)
    flr.scale = (1.0, 1.6, 1.0)
    bpy.context.view_layer.objects.active = flr
    bpy.ops.object.select_all(action='DESELECT'); flr.select_set(True)
    bpy.ops.object.transform_apply(scale=True)
    P.append(flr)
    # ===== multi-level brug: DIKKE kolommen in een ring + dek als VERBONDEN frame =====
    ring = [(8.5, -12), (8.5, 0), (8.5, 12), (-8.5, -12), (-8.5, 0), (-8.5, 12), (0, -14), (0, 14)]
    for (cx, cy) in ring:
        P.append(cyl('colbase', 1.3, 0.5, (cx, cy, 0.25), capm, 20))
        P.append(cyl('col',     0.98, 9.2, (cx, cy, 4.85), col, 20))           # dikke pijler z0.25..9.45
        P.append(cone('colcap', 1.4, 1.0, 0.6, (cx, cy, 9.6), capm, 20))
    # brugdek = rechthoekig FRAME met open midden (de well boven de jamrah) op z~10
    DZ = 10.1
    frame = [(0, 16, 26, 6), (0, -16, 26, 6), (12.5, 0, 5, 26), (-12.5, 0, 5, 26)]  # (x,y,sx,sy)
    for (dx, dy, sx, sy) in frame:
        P.append(box('deck', sx, sy, 0.9, (dx, dy, DZ), deck))
    # gouden binnenrand rond de open well
    P.append(box('railA', 21, 0.35, 0.2, (0, 13, DZ + 0.55), gold))
    P.append(box('railB', 21, 0.35, 0.2, (0, -13, DZ + 0.55), gold))
    P.append(box('railC', 0.35, 26, 0.2, (10, 0, DZ + 0.55), gold))
    P.append(box('railD', 0.35, 26, 0.2, (-10, 0, DZ + 0.55), gold))
    # tweede niveau als silhouet erboven
    for (cx, cy) in [(8.5, -12), (8.5, 12), (-8.5, -12), (-8.5, 12)]:
        P.append(cyl('col2', 0.72, 4.0, (cx, cy, 12.5), col, 16))
    P.append(box('deck2a', 26, 5, 0.6, (0, 16, 14.7), deck))
    P.append(box('deck2b', 26, 5, 0.6, (0, -16, 14.7), deck))
    export(P, 'jamaraat.glb')

if __name__ == '__main__':
    import sys
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ALL = {
        'kaaba': build_kaaba, 'dome': build_dome, 'arch': build_arch,
        'rocks': build_rocks, 'interior': build_nabawi_interior,
        'minaret': build_minaret, 'tent': build_tent, 'lantern': build_lantern,
        'jamaraat': build_jamaraat,
    }
    targets = argv if argv else list(ALL.keys())
    print('Blender-assets bouwen ->', os.path.abspath(OUT), '| targets:', targets)
    for t in targets:
        fn = ALL.get(t)
        if fn:
            print('>>', t); fn()
        else:
            print('?? onbekend target:', t)
    print('klaar')
