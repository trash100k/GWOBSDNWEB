/**
 * GAELWORX — OBSIDIAN HERO
 * ────────────────────────────────────────────────────────────────────────────
 * Neo-Gaelic Brutalist. The cooled aftermath of the forge.
 *
 * A full-screen slab of polished black volcanic glass. Sharp reflections ride a
 * hard clearcoat skin while warm amber caustics drift through the soft refractive
 * interior. A faint ember core breathes deep within. The slab rises from black
 * (ACT 1), lives and undulates while idle (ACT 2), content surfaces up through
 * the glass on scroll (ACT 3), and the surface bends toward the cursor (ACT 4).
 *
 * One self-contained component. Drop <ObsidianHero/> in and it runs.
 *
 * Stack
 *   • react-three-fiber + drei (RoundedBox slab, procedural Environment)
 *   • MeshPhysicalMaterial (the engine behind drei's MeshTransmissionMaterial)
 *     patched with custom GLSL via onBeforeCompile — real transmission + clearcoat
 *     for the glass, plus injected warm caustics / ember / living-surface bump.
 *   • @react-three/postprocessing — Bloom (warm only), ChromaticAberration,
 *     Vignette, film grain.
 *   • GSAP for the ACT 1 rise + ScrollTrigger for ACT 3 surfacing.
 *   • leva for live art-direction.
 *
 * Performance
 *   • Quality is auto-detected. 'high' uses real transmission + full post FX.
 *     'low' (mobile / few cores) drops transmission to a cheap reflective skin,
 *     trims post FX and DPR. 'static' (prefers-reduced-motion) freezes the glass.
 */

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Component,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox, AdaptiveDpr } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useControls, folder, Leva } from 'leva'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

/* ════════════════════════════════════════════════════════════════════════════
 * GLSL — the obsidian
 * Injected into MeshPhysicalMaterial. We keep the PBR engine (real clearcoat
 * reflections + transmission) and add the forge underneath.
 * ════════════════════════════════════════════════════════════════════════════ */

// Ashima 2D simplex noise + fbm + a caustic field. The caustic is a domain-warped
// ridge field — thin curved filaments of light, the way real caustics fan out.
const GLSL_OBSIDIAN_HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uCausticSpeed;
  uniform float uCausticScale;
  uniform float uRefractionStrength;
  uniform float uEmberIntensity;
  uniform float uFresnelPower;
  uniform float uExposure;
  uniform float uReflectionStrength;
  uniform float uIntro;          // 0..1 ACT 1 reveal
  uniform vec2  uPointer;        // cursor in slab-uv space (0..1)
  uniform float uPointerStrength;
  uniform vec4  uRipple;         // xy origin uv, z startTime, w active
  uniform vec3  uCausticColor;
  uniform vec3  uEmberColor;
  uniform vec3  uReflectionColor;

  vec3 obs_permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  float obs_snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = obs_permute(obs_permute(i.y + vec3(0.0, i1.y, 1.0))
                                   + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float obs_fbm(vec2 p){
    float s = 0.0, a = 0.5;
    for(int i = 0; i < 3; i++){ s += a * obs_snoise(p); p = p*2.03 + vec2(11.3, 7.7); a *= 0.5; }
    return s;
  }
  // Warm caustic field: liquid light fanning beneath a hard skin.
  float obs_caustic(vec2 uv, float t){
    vec2 w = vec2(obs_fbm(uv*1.2 + vec2(0.0, t*0.12)),
                  obs_fbm(uv*1.2 + vec2(5.2, -t*0.10)));
    vec2 p = uv + w * 0.65;
    float n  = obs_fbm(p*1.9 + vec2(t*0.15, 0.0));
    float c  = pow(clamp(1.0 - abs(n), 0.0, 1.0), 4.5);   // thin curved filaments
    float n2 = obs_fbm(p*3.6 + vec2(-t*0.10, t*0.08) + 9.0);
    c += pow(clamp(1.0 - abs(n2), 0.0, 1.0), 6.0) * 0.4;
    return c;
  }
`

// Runs in the normal stage: bend the cursor's pull + ripple into the sample
// coords, evaluate the caustic once (reused later), and perturb the BASE normal
// from its gradient. Clearcoat keeps its own crisp normal — so the reflective
// skin stays sharp while the interior reflections undulate. The signature.
const GLSL_OBSIDIAN_NORMAL = /* glsl */ `
  vec2 obsCuv = vUv;

  // ACT 4 — cursor bends the caustic light toward itself.
  vec2 toP = uPointer - obsCuv;
  float pd = length(toP);
  obsCuv += (toP / (pd + 1e-4)) * uPointerStrength * exp(-pd * 3.5);

  // ACT 4 — a quick flick sends a slow refraction ripple across the slab.
  if (uRipple.w > 0.5) {
    float age = uTime - uRipple.z;
    float rd  = distance(vUv, uRipple.xy);
    float ring = sin(rd * 26.0 - age * 6.0) * exp(-age * 1.6) * exp(-rd * 2.5);
    obsCuv += (uRipple.xy - vUv) / (rd + 1e-4) * ring * 0.05 * uRefractionStrength;
  }

  float obsT = uTime * uCausticSpeed;
  float obsC = obs_caustic(obsCuv * uCausticScale, obsT);

  // Pools of light drift across the slab — most of the surface stays deep and
  // dark (black glass), warm caustics gather only in a few slow-moving pockets.
  float obsPool = obs_fbm(obsCuv * 0.55 + vec2(obsT * 0.05, -obsT * 0.04));
  obsPool = smoothstep(0.15, 0.85, obsPool);
  obsC *= obsPool;

  // Living surface: a faint bump from the caustic gradient so reflections slide
  // where the light pools — the rest of the skin stays smooth, hard and mirror.
  vec3 obsBump = vec3(dFdx(obsC), dFdy(obsC), 0.0);
  normal = normalize(normal - obsBump * uRefractionStrength * 0.35);
`

// Runs just before tonemapping (linear space) so Bloom catches the warm peaks.
// Adds caustics + ember + a faint warm fresnel rim. Everything is masked to the
// interior and faded by the ACT 1 intro — the obsidian stays deep and dark.
const GLSL_OBSIDIAN_COLOR = /* glsl */ `
  float obsNdV = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
  float obsFres = pow(1.0 - obsNdV, uFresnelPower);
  float obsInterior = 1.0 - obsFres;          // caustics live under the skin

  // ACT 2 — ember core: a single faint pocket of heat deep in the glass,
  // tightly localized and slow-breathing. Never a uniform glow.
  vec2 ed = vUv - vec2(0.5, 0.44);
  float ember = exp(-dot(ed, ed) * 11.0) * (0.5 + 0.5 * sin(uTime * 0.5));

  vec3 obsWarm =
      uCausticColor    * max(obsC - 0.03, 0.0) * obsInterior * 0.34   // sparse warm threads
    + uEmberColor      * ember * obsInterior * uEmberIntensity
    + uReflectionColor * obsFres * uReflectionStrength;   // warm distant-heat rim

  obsWarm *= uExposure * uIntro;
  gl_FragColor.rgb += obsWarm;
`

/* ════════════════════════════════════════════════════════════════════════════
 * Quality tier
 * ════════════════════════════════════════════════════════════════════════════ */

function detectQuality() {
  if (typeof window === 'undefined') return 'high'
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return 'static'
  const ua = navigator.userAgent || ''
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 760
  const cores = navigator.hardwareConcurrency || 4
  if (mobile || cores <= 4) return 'low'
  return 'high'
}

/* ════════════════════════════════════════════════════════════════════════════
 * The slab
 * ════════════════════════════════════════════════════════════════════════════ */

function ObsidianSlab({ quality, controls }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const { size } = useThree()

  // Cursor state (damped). pointerTarget = caustic pull in uv space; parallax in NDC.
  const pointerTarget = useRef(new THREE.Vector2(0.5, 0.5))
  const parallaxTarget = useRef(new THREE.Vector2(0, 0))
  const lastUv = useRef(new THREE.Vector2(0.5, 0.5))
  const lastMoveTime = useRef(0)
  const rippleCooldown = useRef(0)

  // One uniforms object, shared by reference into the compiled shader.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCausticSpeed: { value: 0.35 },
      uCausticScale: { value: 2.2 },
      uRefractionStrength: { value: 0.5 },
      uEmberIntensity: { value: 0.5 },
      uFresnelPower: { value: 3.0 },
      uExposure: { value: 0.95 },
      uReflectionStrength: { value: 0.16 },
      uIntro: { value: quality === 'static' ? 1 : 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerStrength: { value: 0.12 },
      uRipple: { value: new THREE.Vector4(0.5, 0.5, -10, 0) },
      uCausticColor: { value: new THREE.Color(1.6, 0.5, 0.13) },
      uEmberColor: { value: new THREE.Color(1.0, 0.24, 0.04) },
      uReflectionColor: { value: new THREE.Color(1.0, 0.55, 0.28) },
    }),
    [quality],
  )

  // The material: glass on capable hardware, cheap reflective skin on low.
  const material = useMemo(() => {
    const transmissive = quality === 'high'
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#05060b'), // near-black volcanic glass
      metalness: 0.0,
      roughness: 0.12,
      clearcoat: 1.0, // the hard, polished skin
      clearcoatRoughness: 0.04, // sharp reflections
      envMapIntensity: 1.15,
      reflectivity: 0.6,
      ior: 1.7,
      transmission: transmissive ? 0.5 : 0.0, // soft refractive interior
      thickness: transmissive ? 1.5 : 0.0,
      attenuationColor: new THREE.Color('#ff561d'), // amber-tinted depths
      attenuationDistance: 1.6,
      specularIntensity: 1.0,
      transparent: transmissive,
    })
    // Force a generic vUv into both shader stages for the caustic field.
    m.defines = { ...(m.defines || {}), USE_UV: '' }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_OBSIDIAN_HEAD}`)
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>\n${GLSL_OBSIDIAN_NORMAL}`,
        )
        .replace(
          '#include <tonemapping_fragment>',
          `${GLSL_OBSIDIAN_COLOR}\n#include <tonemapping_fragment>`,
        )
    }
    m.needsUpdate = true
    return m
  }, [quality, uniforms])

  useEffect(() => () => material.dispose(), [material])

  // Push leva values into uniforms / material whenever they change.
  useEffect(() => {
    uniforms.uCausticSpeed.value = quality === 'static' ? 0 : controls.causticSpeed
    uniforms.uCausticScale.value = controls.causticScale
    uniforms.uRefractionStrength.value = controls.refractionStrength
    uniforms.uEmberIntensity.value = controls.emberIntensity
    uniforms.uExposure.value = controls.exposure
    material.envMapIntensity = controls.reflection
  }, [uniforms, material, controls, quality])

  // ACT 1 — THE SLAB. From black, the slab rises into frame, caustics ignite,
  // the ember warms. Snap to final state for static / reduced-motion.
  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    if (quality === 'static') {
      group.position.y = 0
      group.scale.setScalar(1)
      uniforms.uIntro.value = 1
      return
    }
    const reveal = { intro: 0 }
    group.position.y = -4.2
    group.scale.setScalar(0.92)
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(group.position, { y: 0, duration: 2.5 }, 0)
      .to(group.scale, { x: 1, y: 1, z: 1, duration: 2.6 }, 0)
      .to(group.rotation, { x: -0.12, duration: 2.6, ease: 'power2.out' }, 0)
      .to(
        reveal,
        {
          intro: 1,
          duration: 2.2,
          ease: 'power1.inOut',
          onUpdate: () => (uniforms.uIntro.value = reveal.intro),
        },
        0.4,
      )
    return () => tl.kill()
  }, [quality, uniforms])

  // Pointer → caustic pull (exact uv from the raycast) + ripple on a fast flick.
  const onPointerMove = (e) => {
    if (!e.uv) return
    const now = performance.now() / 1000
    pointerTarget.current.set(e.uv.x, e.uv.y)
    parallaxTarget.current.set((e.uv.x - 0.5) * 2, (e.uv.y - 0.5) * 2)

    const dt = Math.max(now - lastMoveTime.current, 1e-3)
    const speed = lastUv.current.distanceTo(e.uv) / dt
    if (speed > 1.6 && now > rippleCooldown.current && quality !== 'static') {
      uniforms.uRipple.value.set(e.uv.x, e.uv.y, uniforms.uTime.value, 1)
      rippleCooldown.current = now + 1.4
    }
    lastUv.current.set(e.uv.x, e.uv.y)
    lastMoveTime.current = now
  }
  const onPointerOut = () => {
    pointerTarget.current.set(0.5, 0.5)
    parallaxTarget.current.set(0, 0)
  }

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (quality !== 'static') uniforms.uTime.value = t

    // Damp the cursor pull (ACT 4 — caustics ease toward the cursor).
    uniforms.uPointer.value.lerp(pointerTarget.current, 1 - Math.pow(0.001, delta))

    // Expire a spent ripple.
    if (uniforms.uRipple.value.w > 0.5 && t - uniforms.uRipple.value.z > 2.6) {
      uniforms.uRipple.value.w = 0
    }

    // ACT 4 — parallax: the slab leans toward the cursor; idle breathing keeps
    // it alive even when the cursor is still.
    const group = groupRef.current
    if (group && quality !== 'static') {
      const p = controls.parallaxAmount
      const breathe = Math.sin(t * 0.4) * 0.012
      const tx = parallaxTarget.current.x
      const ty = parallaxTarget.current.y
      group.rotation.y += (tx * 0.14 * p - group.rotation.y) * 0.05
      const targetX = -0.12 + (-ty * 0.06 * p) + breathe
      group.rotation.x += (targetX - group.rotation.x) * 0.05
      group.position.x += (tx * 0.18 * p - group.position.x) * 0.05
    }
  })

  // Keep the caustic field square regardless of viewport aspect.
  const aspect = size.width / size.height
  const slabW = aspect > 1 ? 7.6 : 4.6
  const slabH = aspect > 1 ? 4.4 : 6.2

  return (
    <group ref={groupRef} rotation={[-0.12, 0, 0]}>
      <RoundedBox
        ref={meshRef}
        args={[slabW, slabH, 0.5]}
        radius={0.12}
        smoothness={4}
        steps={1}
        material={material}
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
      />
    </group>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Scene — lights, reflections, slab
 * ════════════════════════════════════════════════════════════════════════════ */

function Scene({ quality, controls }) {
  return (
    <>
      {/* Deep dark — transmission samples pure black behind the slab. */}
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 9, 22]} />

      {/* Near-total darkness, one warm distant heat as the key. */}
      <ambientLight intensity={0.05} color="#241a12" />
      <directionalLight position={[5, 6, 4]} intensity={1.1} color="#ffb27a" />
      <pointLight position={[0, -2.4, 2.2]} intensity={2.4} distance={12} color="#ff3b0a" />

      <Suspense fallback={null}>
        {/* Procedural warm environment — the streaks the obsidian reflects.
            Self-contained (no HDR fetch); background stays black. */}
        <Environment resolution={quality === 'high' ? 256 : 128} frames={1}>
          <Lightformer
            form="rect"
            intensity={3.4}
            color="#ff7a2a"
            position={[0, 3, -5]}
            scale={[12, 1.4, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            color="#ff4d12"
            position={[-5, -1, -3]}
            scale={[3, 5, 1]}
            rotation={[0, 0.5, 0]}
          />
          <Lightformer
            form="ring"
            intensity={2.4}
            color="#ffd2a0"
            position={[4, 1.5, -3.5]}
            scale={2.2}
          />
          <Lightformer
            form="rect"
            intensity={0.22}
            color="#140d05"
            position={[0, 0, 6]}
            scale={[12, 12, 1]}
          />
        </Environment>

        <ObsidianSlab quality={quality} controls={controls} />
      </Suspense>

      {quality !== 'static' && <Effects quality={quality} controls={controls} />}
      <AdaptiveDpr pixelated />
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Post — warm bloom, refraction-edge aberration, vignette, film grain
 * ════════════════════════════════════════════════════════════════════════════ */

function Effects({ quality, controls }) {
  const high = quality === 'high'
  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      {/* Threshold high so ONLY the warm caustics + ember bloom. */}
      <Bloom
        mipmapBlur
        luminanceThreshold={0.48}
        luminanceSmoothing={0.3}
        intensity={controls.bloom}
        radius={0.72}
      />
      {high ? (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0012]}
          radialModulation
          modulationOffset={0.42}
        />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.28} darkness={0.92} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.06 : 0.04} />
    </EffectComposer>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * ACT 3 — content surfaces up through the glass on scroll
 * ════════════════════════════════════════════════════════════════════════════ */

function Content({ quality }) {
  const rootRef = useRef()

  useLayoutEffect(() => {
    if (quality === 'static') return // reduced motion: content is simply present
    const ctx = gsap.context((self) => {
      const sections = self.selector('.obs-surface')
      sections.forEach((el) => {
        const i = Number(el.dataset.index)
        const inner = el.querySelector('.obs-surface__inner')
        // The refraction filter nodes live in the shared <defs> — find them by id.
        const disp = self.selector(`#obs-warp-${i} feDisplacementMap`)[0]
        const gblur = self.selector(`#obs-warp-${i} feGaussianBlur`)[0]

        // Hidden + below the surface, heavily refracted, until it breaks through.
        gsap.set(inner, { y: 96, opacity: 0 })
        if (disp) gsap.set(disp, { attr: { scale: 72 } })
        if (gblur) gsap.set(gblur, { attr: { stdDeviation: 9 } })

        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        // Rise through the glass; refraction distortion + blur resolve to crisp.
        tl.to(inner, { y: 0, opacity: 1, duration: 1.15, ease: 'power3.out' }, 0)
        if (disp) tl.to(disp, { attr: { scale: 0 }, duration: 1.0, ease: 'power2.out' }, 0)
        if (gblur)
          tl.to(
            gblur,
            {
              attr: { stdDeviation: 0 },
              duration: 1.0,
              ease: 'power2.out',
              // Drop the filter entirely once settled — crisp + cheap.
              onComplete: () => {
                inner.style.filter = 'none'
              },
            },
            0,
          )
      })
      ScrollTrigger.refresh()
    }, rootRef)
    return () => ctx.revert()
  }, [quality])

  return (
    <div className="obs-content" ref={rootRef}>
      {/* SVG refraction filters — one per surfacing section. */}
      <svg className="obs-filters" aria-hidden="true" focusable="false">
        <defs>
          {[0, 1, 2, 3].map((i) => (
            <filter
              key={i}
              id={`obs-warp-${i}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.01 0.016"
                numOctaves="2"
                seed={7 + i * 3}
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
                result="disp"
              />
              <feGaussianBlur in="disp" stdDeviation="0" />
            </filter>
          ))}
        </defs>
      </svg>

      {/* ACT 1 / ACT 2 — the hero, etched into the polished glass. */}
      <header className="obs-hero" id="top">
        <div className="obs-mark">GAELWORX · POINT THE SWORD</div>
        <div className="obs-hero__center">
          <span className="obs-eyebrow">Four Branches · One Forge</span>
          <h1 className="obs-headline etched">Automatic Execution</h1>
          <p className="obs-sub">
            Business owners don&rsquo;t need <strong>Artificial Intelligence.</strong> They
            need <em>Automatic Execution.</em>
          </p>
          <a className="obs-cta" href="#arsenal">
            <span>POINT THE SWORD</span>
          </a>
        </div>
        <div className="obs-scrollcue" aria-hidden="true">
          <span>SURFACE</span>
          <i />
        </div>
      </header>

      {/* ACT 3 — each section emerges from beneath the obsidian. */}
      <main>
        <Surface index={0} id="clan" kicker="00 · The Clan">
          <h2>One clan. Many forges.</h2>
          <p>
            GAELWORX is an engineering forge. We ship our own platforms —{' '}
            <strong>YardWorx, RepairWorx, SalesWorx, AgentWorx</strong> — and bring that
            same hammer to client work. We move like a clan, not an agency: small,
            accountable, always in the work. No discovery-call theater. You talk to the
            people who hold the hammer.
          </p>
        </Surface>

        <Surface index={1} id="arsenal" kicker="01 · Four Branches · One Forge">
          <h2>Four forges. One clan.</h2>
          <p>
            Software, automations, voice agents, and web design — engineered as one
            cohesive arsenal. Pick the blade. We sharpen the rest.
          </p>
          <div className="obs-branches">
            <Branch
              id="GW–01 · Software"
              name="Platforms that decide."
              line="Custom software, forged to your trade."
            >
              Bespoke operational platforms, internal tooling, and trade-shaped
              applications — the same forge that built YardWorx, RepairWorx, SalesWorx,
              and AgentWorx, pointed at your business.
            </Branch>
            <Branch
              id="GW–02 · Voice Agents"
              name="A receptionist that never blinks."
              line="Meet Maeve, the Warrior Queen."
            >
              Inbound and outbound voice agents that qualify leads, book jobs, recover
              quotes, and handle reception — in your voice, on your script, 24/7.
            </Branch>
            <Branch
              id="GW–03 · Automations"
              name="Pipelines that don't sleep."
              line="Silent machines, built once, paid forever."
            >
              Quiet engines that run the empire after the fires die down: lead routing,
              billing follow-ups, supplier arbitrage, document workflows, and
              cross-system bridges.
            </Branch>
            <Branch
              id="GW–04 · Web Design"
              name="Lead engines, not brochures."
              line="Your mark, forged for the modern web."
            >
              Conversion-tuned local sites and studio-grade interactive reels. Every page
              is a magnet; every CTA captures the contact before the competitor&rsquo;s
              page finishes loading.
            </Branch>
          </div>
        </Surface>

        <Surface index={2} kicker="02 · Built For The Long Campaign">
          <h2>Software, forged to the shape of your trade.</h2>
          <p>
            Bespoke systems, internal tooling, and the workflow automations that quietly
            run the empire after the fires die down.{' '}
            <strong>Dashboards that decide. Pipelines that don&rsquo;t sleep. Systems
            built once, sharpened forever.</strong>
          </p>
        </Surface>

        <Surface index={3} id="contact" kicker="03 · Point The Sword">
          <h2>Start the forge.</h2>
          <p>
            One call. No discovery-call theater. You&rsquo;ll talk to the people who hold
            the hammer, not an account manager.
          </p>
          <a className="obs-cta obs-cta--solid" href="#top">
            <span>POINT THE SWORD</span>
          </a>
          <span className="obs-avail">
            <i>Available</i> · Continental US · 7 Days
          </span>
        </Surface>

        <footer className="obs-foot">
          <span>GAELWORX</span>
          <span>· One Forge ·</span>
          <span>Point The Sword</span>
          <span className="obs-foot__tag">
            Point the sword. We take care of the battlefield.
          </span>
        </footer>
      </main>
    </div>
  )
}

function Surface({ index, id, kicker, children }) {
  return (
    <section className="obs-surface" id={id} data-index={index}>
      <div className="obs-surface__inner" style={{ filter: `url(#obs-warp-${index})` }}>
        <div className="obs-surface__panel">
          <span className="obs-kicker">{kicker}</span>
          {children}
        </div>
      </div>
    </section>
  )
}

function Branch({ id, name, line, children }) {
  return (
    <div className="obs-branch">
      <span className="obs-branch__id">{id}</span>
      <h3 className="obs-branch__name">{name}</h3>
      <p className="obs-branch__line">{line}</p>
      <p>{children}</p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Graceful fallback — static CSS obsidian if WebGL throws
 * ════════════════════════════════════════════════════════════════════════════ */

class CanvasBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return <div className="obs-canvas obs-canvas--fallback" />
    return this.props.children
  }
}

/* ════════════════════════════════════════════════════════════════════════════
 * <ObsidianHero/> — the whole thing
 * ════════════════════════════════════════════════════════════════════════════ */

export default function ObsidianHero({ debug = false }) {
  const [quality, setQuality] = useState('high')

  useEffect(() => {
    setQuality(detectQuality())
  }, [])

  // Live art-direction. The four directed dials sit up top; the rest under a fold.
  const controls = useControls(
    'OBSIDIAN',
    {
      causticSpeed: { value: 0.35, min: 0, max: 2, step: 0.01 },
      refractionStrength: { value: 0.5, min: 0, max: 2, step: 0.01 },
      emberIntensity: { value: 0.5, min: 0, max: 3, step: 0.01 },
      parallaxAmount: { value: 0.5, min: 0, max: 1.5, step: 0.01 },
      'art direction': folder(
        {
          causticScale: { value: 1.9, min: 0.5, max: 6, step: 0.1 },
          reflection: { value: 1.1, min: 0, max: 2, step: 0.01 },
          exposure: { value: 0.95, min: 0, max: 2.5, step: 0.01 },
          bloom: { value: 0.7, min: 0, max: 2, step: 0.01 },
        },
        { collapsed: true },
      ),
    },
    { collapsed: false },
  )

  const dpr = quality === 'high' ? [1, 2] : quality === 'low' ? [1, 1.5] : 1

  return (
    <div className="obs-root">
      <ObsidianStyles />
      <Leva hidden={!debug} collapsed titleBar={{ title: 'GAELWORX' }} />

      <div className="obs-canvas">
        <CanvasBoundary>
          <Canvas
            dpr={dpr}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
            }}
            camera={{ position: [0, 0.25, 6], fov: 32, near: 0.1, far: 50 }}
            frameloop={quality === 'static' ? 'demand' : 'always'}
          >
            <Scene quality={quality} controls={controls} />
          </Canvas>
        </CanvasBoundary>
      </div>

      <Content quality={quality} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Styles — injected once, so the component is genuinely drop-in
 * ════════════════════════════════════════════════════════════════════════════ */

function ObsidianStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&display=swap');

/* ── GAELWORX brand tokens ──────────────────────────────────────────────
   Palette/type/motion from the brand book (Palette, Typography, Motion Laws,
   Kinetic Code). Hex are matched to the brand book; swap to exact source
   values when the gaelworx repo is in scope. */
:root {
  color-scheme: dark;
  --gw-void: #050608;        /* obsidian / void black — the slab + page */
  --gw-obsidian: #0a0b10;
  --gw-iron: #15161c;        /* iron — panel fill */
  --gw-steel: #9aa1ad;       /* steel / silver — muted text */
  --gw-bone: #efe6da;        /* bone white — primary text */
  --gw-ember: #ff5a1e;       /* ember orange — primary accent */
  --gw-ember-deep: #ff3b0a;
  --gw-forge: #d72638;       /* forge red — secondary accent / strike */
  --gw-display: 'Cinzel', 'Trajan Pro', 'Times New Roman', serif; /* the wordmark serif */
  --gw-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, Roboto, sans-serif;
  /* Motion Laws */
  --gw-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --gw-dur-fast: 240ms;
  --gw-dur: 600ms;
  --gw-dur-slow: 1100ms;
}
* { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; height: 100%; }
body {
  background: var(--gw-void);
  color: var(--gw-bone);
  font-family: var(--gw-sans);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
::selection { background: rgba(255,90,30,0.35); color: #fff; }

.obs-root { position: relative; width: 100%; background: #000; }

/* The slab lives fixed behind everything — the membrane between void and content. */
.obs-canvas { position: fixed; inset: 0; z-index: 0; }
.obs-canvas canvas { display: block; touch-action: pan-y; }

/* Static fallback: CSS volcanic glass, still deep and warm. */
.obs-canvas--fallback {
  background:
    radial-gradient(120% 90% at 50% 120%, rgba(255,70,20,0.16), transparent 55%),
    radial-gradient(80% 60% at 30% 20%, rgba(255,140,60,0.05), transparent 60%),
    linear-gradient(180deg, #04050a 0%, #02020400 40%, #000 100%),
    #000;
}

.obs-content { position: relative; z-index: 1; }

/* SVG filter host — present but invisible. */
.obs-filters { position: absolute; width: 0; height: 0; pointer-events: none; }

/* ── ACT 1 / ACT 2 — hero ─────────────────────────────────────────────── */
.obs-hero {
  position: relative;
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: clamp(20px, 4vw, 48px);
}
.obs-mark {
  font-size: clamp(10px, 1.1vw, 12px);
  letter-spacing: 0.42em;
  font-weight: 600;
  color: rgba(255, 210, 180, 0.62);
  text-transform: uppercase;
}
.obs-hero__center {
  align-self: center;
  max-width: 920px;
  animation: obs-rise 2.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0.6s;
}
@keyframes obs-rise {
  from { opacity: 0; transform: translateY(34px); filter: blur(10px); }
  to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
}
@media (prefers-reduced-motion: reduce) {
  .obs-hero__center { animation: none; }
}

/* Eyebrow above the headline — FOUR BRANCHES · ONE FORGE */
.obs-eyebrow {
  display: block;
  font-size: clamp(10px, 1.1vw, 12.5px);
  letter-spacing: 0.46em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--gw-ember);
  margin: 0 0 clamp(16px, 2vw, 26px);
}
/* Etched headline — the brand serif, engraved into the polished glass. */
.obs-headline {
  margin: 0;
  font-family: var(--gw-display);
  font-size: clamp(2.3rem, 8vw, 6.6rem);
  line-height: 0.98;
  font-weight: 700;
  letter-spacing: 0.012em;
  text-transform: uppercase;
}
.etched {
  color: rgba(236, 226, 214, 0.94);
  text-shadow:
    0 1px 0 rgba(255, 190, 130, 0.10),
    0 -1px 1px rgba(0, 0, 0, 0.85),
    0 2px 2px rgba(0, 0, 0, 0.65),
    0 0 38px rgba(255, 90, 30, 0.12);
}
.obs-sub {
  margin: clamp(18px, 2.4vw, 30px) 0 0;
  font-size: clamp(1.05rem, 2.1vw, 1.5rem);
  font-weight: 400;
  line-height: 1.32;
  letter-spacing: 0.01em;
  color: var(--gw-steel);
  max-width: 30ch;
}
.obs-sub strong { color: var(--gw-bone); font-weight: 600; }
.obs-sub em {
  font-style: normal;
  color: var(--gw-ember);
  font-weight: 600;
  text-shadow: 0 0 26px rgba(255,90,30,0.35);
}

/* CTA — POINT THE SWORD */
.obs-cta {
  --edge: rgba(255, 120, 50, 0.55);
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-top: clamp(26px, 3.4vw, 44px);
  padding: 16px 30px;
  border: 1px solid var(--edge);
  border-radius: 2px;
  color: #ffd9c2;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  background: linear-gradient(180deg, rgba(255,90,30,0.07), rgba(255,90,30,0.02));
  transition: color 0.4s ease, border-color 0.4s ease, box-shadow 0.5s ease, transform 0.3s ease;
  overflow: hidden;
}
.obs-cta::after {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(120% 160% at 0% 50%, rgba(255,100,40,0.30), transparent 55%);
  opacity: 0; transition: opacity 0.5s ease;
}
.obs-cta:hover {
  color: #fff;
  border-color: rgba(255, 150, 90, 0.95);
  box-shadow: 0 0 0 1px rgba(255,120,60,0.18), 0 10px 50px -12px rgba(255,80,20,0.55);
  transform: translateY(-1px);
}
.obs-cta:hover::after { opacity: 1; }
.obs-cta span { position: relative; z-index: 1; }
.obs-cta--solid {
  margin-top: clamp(24px, 3vw, 40px);
  background: linear-gradient(180deg, rgba(255,95,35,0.92), rgba(210,55,12,0.92));
  border-color: rgba(255,150,90,0.7);
  color: #1a0b04;
}
.obs-cta--solid:hover { color: #1a0b04; }

.obs-scrollcue {
  align-self: end; justify-self: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  font-size: 10px; letter-spacing: 0.4em; color: rgba(255,200,170,0.45);
}
.obs-scrollcue i {
  width: 1px; height: 46px;
  background: linear-gradient(180deg, rgba(255,150,90,0.7), transparent);
  animation: obs-cue 2.4s ease-in-out infinite;
  transform-origin: top;
}
@keyframes obs-cue { 0%,100% { transform: scaleY(0.4); opacity: 0.4; } 50% { transform: scaleY(1); opacity: 1; } }

/* ── ACT 3 — surfacing sections ──────────────────────────────────────── */
.obs-surface {
  display: grid;
  place-items: center;
  padding: clamp(80px, 16vh, 220px) clamp(20px, 5vw, 60px);
  min-height: 86vh;
}
.obs-surface__inner { will-change: transform, filter, opacity; width: min(820px, 100%); }
.obs-surface__panel {
  position: relative;
  padding: clamp(28px, 5vw, 64px);
  border-radius: 4px;
  border: 1px solid rgba(255, 150, 90, 0.10);
  background:
    linear-gradient(180deg, rgba(8,9,14,0.62), rgba(3,3,6,0.78));
  backdrop-filter: blur(3px);
  box-shadow: 0 40px 120px -50px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,180,130,0.05);
}
.obs-kicker {
  display: block;
  font-size: 11px; letter-spacing: 0.4em; font-weight: 700;
  color: var(--gw-ember); text-transform: uppercase;
  margin-bottom: 18px;
}
.obs-surface h2 {
  margin: 0 0 18px;
  font-family: var(--gw-display);
  font-size: clamp(1.5rem, 4vw, 2.8rem);
  line-height: 1.06; letter-spacing: 0; font-weight: 700;
  color: var(--gw-bone);
}
.obs-surface p {
  margin: 0; font-size: clamp(1rem, 1.5vw, 1.18rem); line-height: 1.6;
  color: var(--gw-steel); max-width: 60ch;
}
.obs-surface p strong { color: var(--gw-bone); font-weight: 600; }

/* ── Four branches · one forge (the arsenal grid) ────────────────────── */
.obs-branches {
  margin: clamp(28px, 4vw, 44px) 0 0;
  display: grid; gap: 1px;
  grid-template-columns: repeat(2, 1fr);
  background: rgba(255,150,90,0.10);
  border: 1px solid rgba(255,150,90,0.10);
  border-radius: 4px; overflow: hidden;
}
@media (max-width: 640px) { .obs-branches { grid-template-columns: 1fr; } }
.obs-branch {
  position: relative;
  padding: clamp(20px, 2.6vw, 30px);
  background: linear-gradient(180deg, rgba(12,13,19,0.86), rgba(4,5,9,0.92));
  transition: background var(--gw-dur-fast) var(--gw-ease);
}
.obs-branch:hover { background: linear-gradient(180deg, rgba(22,16,12,0.92), rgba(8,5,4,0.95)); }
.obs-branch__id {
  font-size: 10.5px; letter-spacing: 0.34em; font-weight: 700;
  text-transform: uppercase; color: var(--gw-ember);
}
.obs-branch__name {
  margin: 12px 0 6px;
  font-family: var(--gw-display); font-weight: 700;
  font-size: clamp(1.1rem, 1.7vw, 1.4rem); color: var(--gw-bone);
}
.obs-branch__line { margin: 0 0 10px; color: var(--gw-steel); font-size: 0.92rem; font-style: italic; }
.obs-branch p { margin: 0; font-size: 0.95rem; line-height: 1.55; color: rgba(154,161,173,0.85); max-width: none; }

/* contact availability tag */
.obs-avail {
  display: inline-block; margin-top: clamp(20px, 2.5vw, 28px);
  font-size: 10.5px; letter-spacing: 0.34em; font-weight: 700; text-transform: uppercase;
  color: var(--gw-steel);
}
.obs-avail i { font-style: normal; color: var(--gw-ember); }

.obs-foot {
  display: flex; gap: 14px 18px; flex-wrap: wrap; justify-content: center; align-items: center;
  padding: clamp(60px, 12vh, 140px) 20px clamp(40px, 8vh, 90px);
  font-size: clamp(10px, 1.2vw, 13px); letter-spacing: 0.42em; font-weight: 600;
  color: rgba(255, 200, 170, 0.4); text-transform: uppercase; text-align: center;
}
.obs-foot__tag {
  flex-basis: 100%; margin-top: 14px;
  font-family: var(--gw-display); font-weight: 600; letter-spacing: 0.08em;
  text-transform: none; color: var(--gw-steel); font-size: clamp(13px, 1.4vw, 16px);
}
`,
      }}
    />
  )
}
