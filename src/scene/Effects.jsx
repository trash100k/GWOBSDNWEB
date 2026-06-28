import {
  EffectComposer,
  Bloom,
  GodRays,
  ChromaticAberration,
  HueSaturation,
  BrightnessContrast,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/**
 * God-rays from the ember sun + warm bloom, refraction-edge aberration, a warm
 * cinematic grade (richer fire + crushed blacks), vignette, grain.
 */
export default function Effects({ quality, sun }) {
  const high = quality === 'high'
  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      {high && sun ? (
        <GodRays sun={sun} samples={28} density={0.9} decay={0.93} weight={0.5} exposure={0.5} clampMax={1} blur />
      ) : (
        <></>
      )}
      <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.3} intensity={high ? 0.95 : 0.6} radius={0.8} />
      {high ? (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.001, 0.0015]} radialModulation modulationOffset={0.4} />
      ) : (
        <></>
      )}
      {/* warm cinematic grade — the 60/30/10 fire pops, the obsidian crushes darker */}
      <HueSaturation saturation={0.14} />
      <BrightnessContrast brightness={-0.03} contrast={0.14} />
      <Vignette eskil={false} offset={0.22} darkness={0.96} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.05 : 0.035} />
    </EffectComposer>
  )
}
