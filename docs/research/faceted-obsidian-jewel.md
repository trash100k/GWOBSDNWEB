# Research: the faceted obsidian jewel (replacing the fluid vein slab)

> Goal: turn the hero from a full-frame slab with a fluid fire-opal vein shader ("a random
> spurt of background") into an **actual cut obsidian jewel** — a centered, faceted gem with
> sharp polished facets, glowing faceted edges, and the fire-opal play-of-color reading across
> the cut. Researched 2026-06-30.

## What actually makes a "cut gem" read (the findings)
- **Faceted geometry + flat shading is the core trick.** "The sharp facets of an Icosahedron
  show a nice cut-gem style of refraction"; `flatShading:true` gives each triangle its own face
  normal so every facet reads as a discrete plane catching light.
  [[three.js forum](https://discourse.threejs.org/t/gemstone-refraction-and-reflection/206)]
- **Obsidian is OPAQUE black glass — render it REFLECTIVE, not transmissive.** Cut diamonds use
  transmission + ior + `dispersion` (r164+) + BVH internal reflection, but that's for clear
  stones. Obsidian = near-black body + crisp environment reflections off the flat facets.
  `MeshPhysicalMaterial` reflective path: high `envMapIntensity`, low `roughness`, `clearcoat`,
  and built-in **`iridescence`** for the fire-opal play-of-color (no custom shader needed).
  [[MeshPhysicalMaterial docs](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)]
  - **Bonus / constraint fit:** transmission is exactly what rendered BLACK on the Chromebook
    (see `deploy-doctor`/WEBGL section). A reflective faceted gem is **lighter and safer** than
    the old slab shader AND the transmission path — wins on perf + compatibility.
- **The colour flash lives at facet EDGES.** "On actual crystals you see sharp flashes of colour
  at the edges of facets due to chromatic aberration." So the fire-opal belongs on/near the
  **cut edges** — implemented as `EdgesGeometry` → glowing `LineSegments` in the forge palette
  (the fire-opal in the cuts), plus a Fresnel grazing-angle iridescent flash on the faces.
- **Sparkle = the env reflected off many flat facets as the gem turns.** Our cool `Lightformer`
  rig reflects crisply off flat facets → moving glints when the jewel rotates / on pointer
  parallax. Slow auto-rotate + scroll-coupled spin makes it "turn to catch the light."

## The build (v1)
1. **Geometry — `src/scene/gem.js`** (`buildGem`): a procedural cut gem — a flat **table**, a
   ring of **crown** facets down to the **girdle** (widest ring), and **pavilion** facets to a
   **culet** point. Non-indexed (each tri = fresh verts) → `computeVertexNormals` gives true flat
   facets; winding auto-corrected outward (flip any tri whose normal·centroid < 0). `sides` knob
   controls facet count (octagonal step-cut ≈ 8, rounder brilliant ≈ 14–16).
2. **Material — flat-shaded reflective obsidian** (`MeshPhysicalMaterial`): near-black color,
   `flatShading:true`, low roughness + clearcoat (polished), high `envMapIntensity`,
   `iridescence` (fire-opal), a faint warm `emissive`. **`transmission:0`** (opaque + safe).
3. **Faceted edges** — `EdgesGeometry(gem, angle)` → `<lineSegments>` with an additive
   fire-opal line material; edge glow rides `--`/store heat (scroll energy + strikes) so the cut
   lines flare with the journey (keeps the living-veins coupling, now on the cuts).
4. **Motion** — the gem is **centered** and slowly **auto-rotates** + scroll-coupled spin +
   pointer parallax (it turns to catch the light). Camera reframed to hold the centered jewel.
5. **Perf/tiers** — low-poly (~tens of tris) + lines = cheap; no transmission. Renders on `low`
   (Chromebook/phone) and `high`; `static` still shows the poster. `dispose()` geo+mat on unmount.

## Verify
`qa-route`/finale-qa (SwiftShader compiles → 0 console errors) + DOM probe (canvas alive, gem
mesh present) + the **iPhone 15 read** (the facets/edges/sparkle only truly judge on the OLED).
Tune facet count, edge glow, iridescence, rotation speed from that read.

## Sources
- [three.js forum — Gemstone refraction & reflection](https://discourse.threejs.org/t/gemstone-refraction-and-reflection/206)
- [MeshPhysicalMaterial — three.js docs](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) (iridescence, clearcoat, transmission, dispersion)
- [Codrops — transparent glass & plastic in three.js](https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/) (icosahedron facets, thickness/refraction)
- [Auriga IT — custom diamond shaders in three.js](https://aurigait.com/blog/how-to-create-custom-shaders-for-a-diamond-in-three-js/) (internal reflection / chromatic aberration — the clear-stone path we deliberately avoid)
- [Three.js Journey — Geometries](https://threejs-journey.com/lessons/geometries) (polyhedra / detail)
