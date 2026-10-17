// The angle a model rests at on screen (the reveal, thumbnails): turned three-quarters on, so
// flat things show their face. Long, thin things turn the other way, where they stretch out.

const COIN = { yaw: 0.38, pitch: 0.12 };
const ARTIFACT = { yaw: -0.6, pitch: 0.38 };
const BY_MODEL = {
  comb: { yaw: -0.3 },
  key: { yaw: 0.3 },
  sabre: { yaw: 0.3 },
  junk_icestick: { yaw: 0.3 },
};

// model: a generated module from js/render/models/. Returns { yaw, pitch }.
export const restingView = (model) => ({ ...(model.name.startsWith('coin_') ? COIN : ARTIFACT), ...BY_MODEL[model.name] });
