// Storage layer with two backends:
//   • Postgres  — used automatically when POSTGRES_URL is set (e.g. on Vercel)
//   • JSON file — used locally for testing when there's no database
//
// Everything is stored as simple key → JSON values in one `kv` table, mirroring
// the original db.json structure. All functions are async.
import fs from "fs";
import path from "path";
import postgres from "postgres";

const usePg = !!process.env.POSTGRES_URL;

// ---------- JSON file backend (local dev) ----------
const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");

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
  if (!sql) sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });
  return sql;
}

async function ensureTable() {
  if (ensured) return;
  await getSql()`CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value jsonb)`;
  ensured = true;
}

async function kvGet(key, fallback) {
  await ensureTable();
  const rows = await getSql()`SELECT value FROM kv WHERE key = ${key}`;
  return rows.length ? rows[0].value : fallback;
}

async function kvSet(key, value) {
  await ensureTable();
  await getSql()`
    INSERT INTO kv (key, value) VALUES (${key}, ${getSql().json(value)})
    ON CONFLICT (key) DO UPDATE SET value = ${getSql().json(value)}
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
