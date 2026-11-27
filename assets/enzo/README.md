# Portrait used in the hero

`portrait.webp` is the replacement bust supplied by the user on 2026-11-27, preserved unchanged. Its matching depth map was regenerated from this image.

`depth.png` is an estimated grayscale depth texture created with the built-in image generation tool, aligned to the supplied portrait. It is an artistic 2.5D depth estimate, not a measured 3D scan. Brighter pixels are closer to the camera.

`portrait-maps.js` derives GPU alpha and tangent normals from the original image's transparency and this depth estimate. Native alpha is preserved without depth-based trimming. The photographic material displays the original colors without artificial normal lighting; picking and the blueprint share its displacement and native mask. Maps are prepared during the loader and do not alter the portrait file.

Final image-generation prompt: create only a grayscale depth/displacement texture matching the exact source framing, bust silhouette, curved bottom edge, face landmarks and hair; black background, smooth geometric depth, nose closest, shoulders farther away; do not use photo luminance, color, shadows, labels or retouch the portrait. Generated with the built-in image tool. The full prompt and generation details are recorded in `.reanimate/enzo-portrait/generation-20261127.json`.
