// Device heading from orientation sensors. Heading is degrees clockwise from north
// of the direction the player faces: the top edge of a phone held flat, or the camera
// direction of a phone held upright.

const D2R = Math.PI / 180;

export function headingFromOrientation(e, screenAngle = 0) {
  let deg;
  if (typeof e.webkitCompassHeading === 'number' && Number.isFinite(e.webkitCompassHeading)) {
    deg = e.webkitCompassHeading; // iOS: already clockwise from north
  } else if (e.alpha != null && e.absolute !== false) {
    // W3C order: R = Rz(alpha) · Rx(beta) · Ry(gamma); earth frame x = east, y = north.
    const a = e.alpha * D2R, b = (e.beta ?? 0) * D2R, g = (e.gamma ?? 0) * D2R;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
    let vx = -sa * cb, vy = ca * cb;                    // device top edge
    if (Math.hypot(vx, vy) < 0.5) {                     // held upright: use the camera axis
      vx = -ca * sg - sa * sb * cg;
      vy = -sa * sg + ca * sb * cg;
    }
    deg = Math.atan2(vx, vy) / D2R;
  } else {
    return null;
  }
  return (((deg + screenAngle) % 360) + 360) % 360;
}

export class Compass {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.t = 0;
    this.started = false;
    this.onEvent = (e) => this.handle(e);
  }

  // iOS asks for permission, and only from a user gesture.
  get needsPermission() {
    return typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
  }

  async requestPermission() {
    if (!this.needsPermission) return true;
    try {
      return (await DeviceOrientationEvent.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }

  start() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    // Android: only the absolute event is referenced to north.
    if ('ondeviceorientationabsolute' in window) addEventListener('deviceorientationabsolute', this.onEvent);
    else addEventListener('deviceorientation', this.onEvent);
  }

  handle(e) {
    const angle = screen.orientation?.angle ?? window.orientation ?? 0;
    const h = headingFromOrientation(e, angle);
    if (h === null) return;
    // Low-pass on the unit vector, so 359° → 1° does not swing the long way round.
    const k = this.t ? 0.25 : 1;
    this.x += (Math.sin(h * D2R) - this.x) * k;
    this.y += (Math.cos(h * D2R) - this.y) * k;
    this.t = performance.now();
  }

  // Radians clockwise from north, or null if the sensor is silent.
  heading(nowPerf = performance.now()) {
    if (!this.t || nowPerf - this.t > 1500) return null;
    return Math.atan2(this.x, this.y);
  }
}
