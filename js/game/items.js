// Item catalogue. Names and descriptions live in i18n (items.<id>.name / .desc,
// artifacts.<id>.name / .desc).

export const JUNK = [
  'penny', 'pulltab', 'ticket', 'lighter', 'battery',
  'paperclip', 'earring', 'rubberband', 'bottlecap', 'receipt',
];

export const COINS = [
  { id: 'nummus', rarity: 'common', metal: 'bronze' },
  { id: 'kaiyuan', rarity: 'common', metal: 'bronze' },
  { id: 'kreuzer', rarity: 'common', metal: 'copper' },
  { id: 'denarius', rarity: 'uncommon', metal: 'silver' },
  { id: 'eightreales', rarity: 'uncommon', metal: 'silver' },
  { id: 'tetradrachm', rarity: 'uncommon', metal: 'silver' },
  { id: 'ducat', rarity: 'rare', metal: 'gold' },
  { id: 'solidus', rarity: 'rare', metal: 'gold' },
  { id: 'doubloon', rarity: 'rare', metal: 'gold' },
  { id: 'stater', rarity: 'legendary', metal: 'electrum' },
  { id: 'eidmar', rarity: 'legendary', metal: 'gold' },
  { id: 'ruble', rarity: 'legendary', metal: 'silver' },
];

export const coinById = (id) => COINS.find((c) => c.id === id);

// Tomb artifacts; each has a low-poly model in js/render/models/.
export const ARTIFACTS = ['abacus', 'bell', 'chalice', 'clog', 'comb', 'cup', 'lamp', 'vase'];
