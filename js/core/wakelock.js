// Keeps the screen on while the game is open (Screen Wake Lock API, best effort).
// The browser drops the lock whenever the page is hidden; it is re-taken on return.

let sentinel = null;
let wanted = false;

async function acquire() {
  if (!wanted || sentinel || document.hidden || !('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => { sentinel = null; });
  } catch { /* denied or unsupported: the screen may sleep */ }
}

document.addEventListener('visibilitychange', acquire);

export function keepScreenOn(on) {
  wanted = on;
  if (on) acquire();
  else if (sentinel) sentinel.release().catch(() => {});
}

export const screenLockHeld = () => !!sentinel;
