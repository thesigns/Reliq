import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regionName, regionLabels } from '../js/render/regions.js';
import { pickScale, scaleLabel } from '../js/ui/scale-bar.js';

test('region names are deterministic and agree in gender', () => {
  assert.equal(regionName('forest', 3, 7), regionName('forest', 3, 7));
  const endings = { Silva: /a$/, Saltus: /us$/, Nemus: /um$/, Lucus: /us$/, Montes: /i$/, Mons: /us$/, Iuga: /a$/, Rupes: /a$/, Colles: /i$/, Tumuli: /i$/, Clivus: /us$/, Campi: /i$/, Prata: /a$/, Arva: /a$/, Campus: /us$/ };
  for (const kind of ['forest', 'mountains', 'hills', 'plains']) {
    for (let i = 0; i < 60; i++) {
      const name = regionName(kind, i, i * 3 + 1);
      const [noun, adj] = name.split(' ');
      assert.ok(endings[noun], `unknown noun in ${name}`);
      assert.match(adj, endings[noun], name);
      assert.match(adj, /^[A-Z][a-z]+$/);
    }
  }
});

test('region labels are stable and a zoomed-out view names a few regions', () => {
  let total = 0;
  for (let i = 0; i < 100; i++) {
    const view = { x: 0, y: 0, ppm: 0.3, w: 430, h: 680 };
    const off = { x: (i * 7919) % 60000, y: (i * 104729) % 60000 };
    const a = regionLabels(view, off);
    assert.deepEqual(a, regionLabels(view, off));
    for (const l of a) assert.ok(['forest', 'mountains', 'hills', 'plains'].includes(l.kind));
    total += a.length;
  }
  assert.ok(total / 100 > 1.8, `average ${total / 100} labels per view`);
});

test('scale bar picks a round length that fits', () => {
  for (const ppm of [0.12, 0.3, 1.1, 2.5, 5]) {
    const { metres, px } = pickScale(ppm);
    assert.ok(px <= 130, `${ppm}: ${px}`);
    assert.ok(px >= 50 || metres === 5, `${ppm}: ${px}`);
  }
  assert.equal(pickScale(1.1).metres, 100);
  assert.equal(scaleLabel(250), '250 m');
  assert.equal(scaleLabel(2500, 'pl'), '2,5 km');
  assert.equal(scaleLabel(1000, 'en'), '1 km');
});
