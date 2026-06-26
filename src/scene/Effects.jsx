import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/** Warm-thresholded bloom (seam + blade heat), refraction-edge aberration, vignette, grain. */
export default function Effects({ quality }) {
  const high = quality === 'high'
  return (
    <EffectComposer disableNormalPass multisampling={high ? 2 : 0}>
      <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.3} intensity={high ? 0.85 : 0.6} radius={0.75} />
      {high ? (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0008, 0.0012]}
          radialModulation
          modulationOffset={0.4}
        />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.26} darkness={0.92} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={high ? 0.055 : 0.04} />
    </EffectComposer>
  )
}
