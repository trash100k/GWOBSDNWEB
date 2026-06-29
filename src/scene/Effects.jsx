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
 * Restrained finish: warm bloom on the vein cores + opal flecks, subtle
 * refraction-edge aberration, a warm grade (richer fire + crushed blacks so the
 * obsidian stays deep), vignette, grain, and SMAA on the high tier.
 */
export default function Effects({ quality }) {
  const high = quality === 'high'
  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3} intensity={high ? 0.9 : 0.6} radius={0.8} />
      {high ? (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0008, 0.0012]} radialModulation modulationOffset={0.42} />
      ) : (
        <></>
      )}
      <HueSaturation saturation={0.12} />
      <BrightnessContrast brightness={-0.04} contrast={0.16} />
      <Vignette eskil={false} offset={0.22} darkness={0.96} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.05 : 0.035} />
      {high ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
