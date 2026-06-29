import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  HueSaturation,
  BrightnessContrast,
  Vignette,
  Noise,
  SMAA,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/**
 * Restrained finish: bloom catches the gem's bright green emissive core and the
 * pale-gold HDR facet glints, subtle refraction-edge aberration, a cool emerald
 * grade (hue rotated toward green-teal + crushed blacks so the void stays deep),
 * vignette, grain, and SMAA on the high tier. The whole frame reads jewel-green,
 * never fire-warm.
 */
export default function Effects({ quality }) {
  const high = quality === 'high'
  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      {/* Only the HDR pale-gold glint + brightest emerald facet flashes cross threshold;
          the dark emerald body + near-black void stay clean (no whiteout). */}
      <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.3} intensity={high ? 0.85 : 0.55} radius={0.85} />
      {high ? (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0008, 0.0012]} radialModulation modulationOffset={0.42} />
      ) : (
        <></>
      )}
      {/* Cool emerald grade: negative hue rotation steers the cast toward green-teal,
          saturation keeps the jewel richness — neutralizes the old warm/fire bias. */}
      <HueSaturation hue={-0.08} saturation={0.14} />
      <BrightnessContrast brightness={-0.04} contrast={0.16} />
      <Vignette eskil={false} offset={0.22} darkness={0.96} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.05 : 0.035} />
      {high ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
