import pl from './pl.js';
import en from './en.js';

const dicts = { pl, en };
let lang = (navigator.language || 'en').toLowerCase().startsWith('pl') ? 'pl' : 'en';
const listeners = new Set();

export function t(key, vars) {
  let s = dicts[lang][key] ?? dicts.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

export const getLang = () => lang;

export function formatDuration(ms) {
  const min = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(min / 60), m = min % 60;
  if (h >= 24) return `${Math.floor(h / 24)} d${h % 24 ? ` ${h % 24} h` : ''}`;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}

export function formatDate(t) {
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(new Date(t));
}

export function formatDistance(m) {
  if (m == null || !Number.isFinite(m)) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(m / 1000)} km`;
}

// Tombs are numbered in Roman numerals: Tomb IV, not Tomb 4.
export function formatRoman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

export function setLang(l) {
  if (!dicts[l] || l === lang) return;
  lang = l;
  document.documentElement.lang = l;
  listeners.forEach((fn) => fn(l));
}

export const onLangChange = (fn) => listeners.add(fn);

// Fill every [data-i18n] element in a subtree.
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
}
