const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const css = fs.readFileSync('style.css', 'utf8');
const html = fs.readFileSync('web.html', 'utf8');
const js = fs.readFileSync('web.js', 'utf8');

test('Mobile navigation has all four real tabs with SVG icons', () => {
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav, 'mobile navigation missing');
  for (const tab of ['home','create','mine','templates']) {
    assert.match(nav, new RegExp(`data-tab="${tab}"`));
  }
  assert.equal((nav.match(/<svg\b/g)||[]).length, 4);
});
test('Floating capsule and matching light/dark design tokens exist', () => {
  assert.match(css, /--bg:#FBF7F1/);
  assert.match(css, /--plum:#4A2340/);
  assert.match(css, /--gold:#C9A24B/);
  assert.match(css, /\.mobile-nav\s*\{[^}]*border-radius:999px/s);
  assert.match(css, /body\.dark\s*\{/);
});
test('Navigation updates accessible current tab and reduces motion', () => {
  assert.match(js, /setAttribute\('aria-current','page'\)/);
  assert.match(js, /removeAttribute\('aria-current'\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
