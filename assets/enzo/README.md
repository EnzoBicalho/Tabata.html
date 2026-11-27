# Portrait used in the hero

`portrait.webp` is an unchanged copy of the user-provided `eu.webp` (1312 × 1199, native alpha). The original file is retained in Downloads.

`depth.png` is an estimated grayscale depth texture created with the built-in image generation tool, aligned to the supplied portrait. It is an artistic 2.5D depth estimate, not a measured 3D scan. Brighter pixels are closer to the camera.

`portrait-maps.js` derives the GPU alpha, edge gate and tangent normals from the original image's transparency and this depth estimate. These maps are prepared during the existing loader and do not alter the portrait file. Picking and the blueprint use the same displacement and mask.

Final image-generation prompt: create only a grayscale depth/displacement texture matching the exact 1312:1199 source framing, silhouette, face landmarks and hair; black background, smooth geometric depth, nose closest, shoulders farther away; do not use photo luminance, color, shadows, labels or retouch the portrait. The full prompt and generation details are recorded in `.reanimate/enzo-portrait/`.
