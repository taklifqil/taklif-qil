'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const {validate}=require('./validate');const {parseWhen,page}=require('./invitation');
const input={occ:'toy',dir:'bq',from:'Ali & Vali',when:'25.12.2026 19:00',where:'Toshkent',style:2};
test('Valid invitation form',()=>{const d=validate(input);assert.equal(d.style,2);assert.equal(d.occ,'toy');assert.equal(d.time,'19:00');});
test('Reject unknown event',()=>assert.throws(()=>validate({...input,occ:'unknown'})));
test('Require guests for non-wedding event',()=>assert.throws(()=>validate({...input,occ:'tug'})));
test('Reject invalid timestamp',()=>assert.equal(parseWhen('99.99.2026 30:99'),null));
test('Reject invalid image filename',()=>assert.throws(()=>validate({...input,photo:'../x.jpg'})));
test('HTML output escapes malicious text',()=>{const html=page({...validate({...input,from:'<img src=x onerror=1>'}),id:'abc',owner:123});assert.ok(html.includes('&lt;img src=x onerror=1&gt;'));assert.ok(!html.includes('<img src=x onerror=1>'));});
