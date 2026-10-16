// Still images of the low-poly models (artifacts and coins in the vault, the backpack card),
// rendered once each and cached. They keep the chunky pixels of the reveal screen.

import { ArtifactRenderer } from './artifact3d.js';
import { MODELS } from './models/index.js';
import { COIN_MODELS } from './models/coins.js';

const CSS_SIZE = 84;   // shown at about this size; drawn at 1 / ARTIFACT_PIXEL of it
let renderer = null;
const cache = new Map();

// { url }: a PNG data URL. null while the GPU context is lost.
function thumbnail(key, model, pose) {
  if (cache.has(key)) return cache.get(key);
  if (!renderer) {
    renderer = new ArtifactRenderer(document.createElement('canvas'));
    renderer.resize(CSS_SIZE);
  }
  if (renderer.gl.isContextLost()) return null;   // try again next time
  renderer.setModel(model);
  renderer.render(pose);
  // Read back in the same task as the draw, before the buffer is cleared.
  const thumb = { url: renderer.canvas.toDataURL('image/png') };
  cache.set(key, thumb);
  return thumb;
}

// An artifact turned three-quarters to the viewer.
export const artifactThumbnail = (id) => thumbnail(`artifact:${id}`, MODELS[id], { yaw: -0.6, pitch: 0.38, scale: 1 });

// A coin's obverse, turned a little so its rim shows.
export const coinThumbnail = (id) => thumbnail(`coin:${id}`, COIN_MODELS[id], { yaw: 0.38, pitch: 0.12, scale: 1.3 });
