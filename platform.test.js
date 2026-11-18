
'use strict';const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const src=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
test('Admin login offers Telegram widget and bot alternative',()=>{const h=src('admin.html');assert.match(h,/adminLoginWidget/);assert.match(h,/adminBot/);assert.match(h,/Sessiya tugadi/);});
test('Home login does not automatically redirect browser',()=>{const js=src('web.js');assert.doesNotMatch(js,/window\.location\.assign\(link\)/);assert.match(js,/telegramLogin/);});
test('Wizard has four steps and share screen',()=>{const h=src('web.html');for(let i=0;i<4;i++)assert.ok(h.includes('data-step="'+i+'"'));assert.ok(h.includes('id="shareScreen"'));});
test('Admin API requires authorization middleware',()=>{const s=src('server.js');assert.match(s,/app\.get\('\/api\/system-status',\.\.\.admin/);assert.match(s,/app\.get\('\/api\/admin\/activity',\.\.\.admin/);});
test('RSVP has browser and server duplicate protections',()=>{assert.match(src('server.js'),/rsvp_limits/);assert.match(src('invite.js'),/tq_rsvp_/);});
test('Referral data stored and bot start payload handled',()=>{assert.match(src('db.js'),/ADD COLUMN IF NOT EXISTS ref/);assert.match(src('server.js'),/ctx\.startPayload/);assert.match(src('invitation.js'),/ref_/);});
test('Invitations render without GSAP',()=>{assert.match(src('invite.js'),/if\(!window\.gsap\)/);assert.match(src('invitation.js'),/noscript/);});
