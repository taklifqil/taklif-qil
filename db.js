'use strict';
const { Pool } = require('pg');
let pool;
function connect() {
 if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL talab qilinadi: PostgreSQL ulanishi yo‘q');
 pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined, max: 10 });
 return pool;
}
const q = (sql, params=[]) => pool.query(sql, params);
async function migrate() {
 await q(`CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', username TEXT NOT NULL DEFAULT '', blocked BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_seen TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await q(`CREATE TABLE IF NOT EXISTS invites (id TEXT PRIMARY KEY, owner BIGINT NOT NULL REFERENCES users(id), data JSONB NOT NULL, off BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await q(`CREATE INDEX IF NOT EXISTS invites_owner_idx ON invites(owner,created_at DESC)`);
 await q(`CREATE TABLE IF NOT EXISTS rsvps (id BIGSERIAL PRIMARY KEY, invite_id TEXT NOT NULL REFERENCES invites(id) ON DELETE CASCADE, answer TEXT NOT NULL CHECK(answer IN ('yes','no')), guest_name TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await q(`CREATE INDEX IF NOT EXISTS rsvps_invite_idx ON rsvps(invite_id)`);
 await q(`CREATE TABLE IF NOT EXISTS views (id BIGSERIAL PRIMARY KEY, invite_id TEXT NOT NULL REFERENCES invites(id) ON DELETE CASCADE, viewed_on DATE NOT NULL DEFAULT CURRENT_DATE, hits INTEGER NOT NULL DEFAULT 1, UNIQUE(invite_id,viewed_on))`);
 await q(`CREATE TABLE IF NOT EXISTS audit_logs (id BIGSERIAL PRIMARY KEY, actor BIGINT, action TEXT NOT NULL, target TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await q(`CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, owner BIGINT NOT NULL REFERENCES users(id), content BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
 await q(`CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), expires_at TIMESTAMPTZ NOT NULL)`);
}
async function upsertUser(u) {
 const id = String(u.id), name = [u.first_name,u.last_name].filter(Boolean).join(' ').slice(0,200);
 await q(`INSERT INTO users(id,name,username) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,username=EXCLUDED.username,last_seen=now()`,[id,name,String(u.username||'').slice(0,100)]);
 const {rows} = await q('SELECT blocked FROM users WHERE id=$1',[id]); return !rows[0].blocked;
}
function unpack(row) {return row && {...row.data,id:row.id,owner:Number(row.owner),off:row.off,createdAt:new Date(row.created_at).getTime()};}
async function invitation(id) {const {rows}=await q('SELECT * FROM invites WHERE id=$1',[id]);return unpack(rows[0]);}
async function saveInvite(d) {const {id,owner,off,...data}=d;await q('INSERT INTO invites(id,owner,data,off) VALUES($1,$2,$3,$4)',[id,String(owner),JSON.stringify(data),!!off]);}
async function listInvites(owner) {const {rows}=await q('SELECT * FROM invites WHERE owner=$1 ORDER BY created_at DESC LIMIT 200',[String(owner)]);return rows.map(unpack);}
async function rsvpCounts(id) { const {rows}=await q(`SELECT answer,COUNT(*)::int AS count FROM rsvps WHERE invite_id=$1 GROUP BY answer`,[id]);return {yes:rows.find(x=>x.answer==='yes')?.count||0,no:rows.find(x=>x.answer==='no')?.count||0};}
module.exports={connect,q,migrate,upsertUser,invitation,saveInvite,listInvites,rsvpCounts,unpack};
