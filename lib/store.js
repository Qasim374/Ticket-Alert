// Storage layer with two backends:
//   • Postgres  — used automatically when POSTGRES_URL is set (e.g. on Vercel)
//   • JSON file — used locally for testing when there's no database
//
// Everything is stored as simple key → JSON values in one `kv` table, mirroring
// the original db.json structure. All functions are async.
import fs from "fs";
import path from "path";
import os from "os";
import postgres from "postgres";

// Vercel/Neon may name the connection string POSTGRES_URL or DATABASE_URL,
// so accept whichever is present.
const PG_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  null;
const usePg = !!PG_URL;

// ---------- JSON file backend (local dev) ----------
// Locally we keep db.json in the project; on a read-only host (e.g. Vercel
// without a DB) fall back to the OS temp dir so writes don't crash.
const localDir = path.join(process.cwd(), "data");
const dataDir = fsWritable(localDir) ? localDir : path.join(os.tmpdir(), "wc-data");
const dbFile = path.join(dataDir, "db.json");

function fsWritable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

function fileLoad() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8"));
  } catch {
    return {};
  }
}

function fileSave(db) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

// ---------- Postgres backend (Vercel) ----------
let sql = null;
let ensured = false;

function getSql() {
  // prepare:false makes it work through Neon/Vercel's pooled (PgBouncer)
  // connection, which doesn't support prepared statements.
  if (!sql) sql = postgres(PG_URL, { ssl: "require", prepare: false });
  return sql;
}

async function ensureTable() {
  if (ensured) return;
  // Store the JSON as plain text and (de)serialize in JS — avoids any
  // driver-specific jsonb handling.
  await getSql()`CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value text)`;
  ensured = true;
}

async function kvGet(key, fallback) {
  await ensureTable();
  const rows = await getSql()`SELECT value FROM kv WHERE key = ${key}`;
  if (!rows.length) return fallback;
  try {
    return JSON.parse(rows[0].value);
  } catch {
    return fallback;
  }
}

async function kvSet(key, value) {
  await ensureTable();
  const text = JSON.stringify(value);
  await getSql()`
    INSERT INTO kv (key, value) VALUES (${key}, ${text})
    ON CONFLICT (key) DO UPDATE SET value = ${text}
  `;
}

// ---------- Generic helpers (pick a backend) ----------
async function getArray(key) {
  if (usePg) return (await kvGet(key, [])) || [];
  return fileLoad()[key] || [];
}

async function getObject(key) {
  if (usePg) return (await kvGet(key, {})) || {};
  return fileLoad()[key] || {};
}

async function setKey(key, value) {
  if (usePg) return kvSet(key, value);
  const db = fileLoad();
  db[key] = value;
  fileSave(db);
}

// ---------- Goal-alert subscriptions ----------
export async function getSubscriptions() {
  return getArray("subscriptions");
}

export async function addSubscription(sub) {
  const subs = await getArray("subscriptions");
  if (!subs.find((s) => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    await setKey("subscriptions", subs);
  }
}

export async function removeSubscription(endpoint) {
  const subs = (await getArray("subscriptions")).filter((s) => s.endpoint !== endpoint);
  await setKey("subscriptions", subs);
}

export async function getLastScores() {
  return getObject("lastScores");
}

export async function setLastScores(lastScores) {
  await setKey("lastScores", lastScores);
}

// ---------- Ticket-alert subscriptions ----------
export async function getTicketSubscriptions() {
  return getArray("ticketSubscriptions");
}

export async function addTicketSubscription(sub) {
  const subs = await getArray("ticketSubscriptions");
  if (!subs.find((s) => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    await setKey("ticketSubscriptions", subs);
  }
}

export async function removeTicketSubscription(endpoint) {
  const subs = (await getArray("ticketSubscriptions")).filter(
    (s) => s.endpoint !== endpoint
  );
  await setKey("ticketSubscriptions", subs);
}

export async function getLastTicketStatus() {
  return getObject("lastTicketStatus");
}

export async function setLastTicketStatus(lastTicketStatus) {
  await setKey("lastTicketStatus", lastTicketStatus);
}
