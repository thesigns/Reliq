// Vibration patterns. navigator.vibrate is unavailable on iOS; calls are then no-ops.

let enabled = true;
const vib = (p) => { if (enabled && navigator.vibrate) navigator.vibrate(p); };

export const haptics = {
  setEnabled(v) { enabled = v; },
  tap: () => vib(12),
  dig: () => vib(38),
  deny: () => vib([20, 40, 20]),
  reveal: (rarity) => vib({ legendary: [60, 50, 120, 60, 200], rare: [50, 40, 120], uncommon: [40, 30, 60], common: 40, junk: 15 }[rarity] ?? 30),
};
