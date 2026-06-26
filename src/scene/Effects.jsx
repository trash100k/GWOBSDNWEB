import {
  EffectComposer,
  Bloom,
  GodRays,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/** God-rays from the ember sun + warm bloom, refraction-edge aberration, vignette, grain. */
export default function Effects({ quality, sun }) {
  const high = quality === 'high'
  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      {high && sun ? (
        <GodRays sun={sun} samples={28} density={0.9} decay={0.93} weight={0.5} exposure={0.5} clampMax={1} blur />
      ) : (
        <></>
      )}
      <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.3} intensity={high ? 0.9 : 0.6} radius={0.78} />
      {high ? (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0009, 0.0014]} radialModulation modulationOffset={0.4} />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.24} darkness={0.94} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.05 : 0.035} />
    </EffectComposer>
  )
}
