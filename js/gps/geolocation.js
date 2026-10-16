// Real device location via the Geolocation API.
// state: 'idle' | 'starting' | 'active' | 'denied' | 'unavailable' | 'insecure' | 'unsupported'

import { clock } from '../core/clock.js';

export class GeolocationSource {
  constructor(onSample) {
    this.onSample = onSample;
    this.state = 'idle';
    this.watchId = null;
    this.kind = 'real';
  }

  async start() {
    if (!window.isSecureContext) { this.state = 'insecure'; return; }
    if (!('geolocation' in navigator)) { this.state = 'unsupported'; return; }
    this.state = 'starting';
    try {
      const perm = await navigator.permissions?.query({ name: 'geolocation' });
      if (perm) {
        if (perm.state === 'denied') this.state = 'denied';
        perm.onchange = () => {
          if (perm.state === 'denied') this.state = 'denied';
          else if (this.state === 'denied') this.restart();
        };
      }
    } catch { /* Permissions API missing (older Safari): the prompt still works */ }
    this.watch();
  }

  watch() {
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.onPosition(pos),
      (err) => this.onError(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );
  }

  restart() {
    this.stop();
    this.state = 'starting';
    this.watch();
  }

  stop() {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.state = 'idle';
  }

  onPosition(pos) {
    this.state = 'active';
    const c = pos.coords;
    // Game time of the fix (the reading may be slightly older than "now").
    const age = Math.max(0, Date.now() - pos.timestamp);
    this.onSample({
      lat: c.latitude,
      lon: c.longitude,
      acc: c.accuracy,
      t: clock.now() - age,
      speed: Number.isFinite(c.speed) ? c.speed : null,
      course: Number.isFinite(c.heading) ? (c.heading * Math.PI) / 180 : null,
    });
  }

  onError(err) {
    if (err.code === 1) this.state = 'denied';
    else if (err.code === 2) this.state = 'unavailable';
    // code 3 (timeout) just means no new reading yet: keep the last one.
  }
}
