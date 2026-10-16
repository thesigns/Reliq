import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artifactSketch } from '../js/ui/artifact-sketch.js';
import { MODELS } from '../js/render/models/index.js';

test('every artifact model gives a clean ink sketch', () => {
  for (const [id, model] of Object.entries(MODELS)) {
    const svg = artifactSketch(model);
    assert.match(svg, /^<svg class="artifact-sketch" viewBox="0 0 200 200"/, id);
    assert.ok(!/NaN|Infinity/.test(svg), `${id}: no broken numbers`);
    assert.ok((svg.match(/<polygon /g) ?? []).length > 20, `${id}: faces drawn`);
    assert.ok((svg.match(/<line x1/g) ?? []).length > 20, `${id}: ink lines drawn`);
  }
});

test('sketches on one page never share pattern ids', () => {
  const ids = (svg) => [...svg.matchAll(/<pattern id="([^"]+)"/g)].map((m) => m[1]);
  const a = ids(artifactSketch(MODELS.cup)), b = ids(artifactSketch(MODELS.cup));
  assert.equal(a.length, 2);
  assert.equal(new Set([...a, ...b]).size, 4);
});
