// Geographic helpers. Gameplay runs in a local metric frame centred on the vault.

export const EARTH_R = 6371008.8;
const D2R = Math.PI / 180;

export function haversine(a, b) {
  const dLat = (b.lat - a.lat) * D2R;
  const dLon = (b.lon - a.lon) * D2R;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * D2R) * Math.cos(b.lat * D2R) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Equirectangular projection around an origin: x = east, y = north, in metres.
// Accurate to well under a metre within ~20 km, which covers the whole game area.
export class LocalFrame {
  constructor(lat0, lon0) {
    this.lat0 = lat0;
    this.lon0 = lon0;
    this.ky = EARTH_R * D2R;
    this.kx = this.ky * Math.cos(lat0 * D2R);
  }
  toLocal(lat, lon) {
    return { x: (lon - this.lon0) * this.kx, y: (lat - this.lat0) * this.ky };
  }
  toGeo(x, y) {
    return { lat: this.lat0 + y / this.ky, lon: this.lon0 + x / this.kx };
  }
  // Offset that turns local metres into stable "world" metres for terrain noise.
  // Wrapped to keep float32 precision on the GPU.
  worldOffset() {
    const P = 65536;
    const wrap = (v) => ((v % P) + P) % P;
    return { x: wrap(this.lon0 * this.kx), y: wrap(this.lat0 * this.ky) };
  }
}

export function formatDMS(deg, isLat) {
  const hemi = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
  let v = Math.abs(deg);
  let d = Math.floor(v);
  let m = Math.floor((v - d) * 60);
  let s = Math.round(((v - d) * 60 - m) * 60);
  if (s === 60) { s = 0; m += 1; }
  if (m === 60) { m = 0; d += 1; }
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″${hemi}`;
}
