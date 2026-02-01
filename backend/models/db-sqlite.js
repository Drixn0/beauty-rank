const Database = require("better-sqlite3")
const path = require("path")

const dbFile = path.join(__dirname, "..", "data.sqlite3")
const db = new Database(dbFile)

// 初始化表
db.exec(`
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  totalOrders INTEGER DEFAULT 0,
  totalPromotion INTEGER DEFAULT 0,
  updatedAt TEXT
);
`)

// ===== config =====
function getConfig(key, fallback = null) {
  const row = db.prepare("SELECT value FROM config WHERE key=?").get(key)
  if (!row) return fallback
  try { return JSON.parse(row.value) } catch { return fallback }
}

function setConfig(key, value) {
  const json = JSON.stringify(value ?? null)
  db.prepare(`
    INSERT INTO config(key, value) VALUES(?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(key, json)
}

// ===== users =====
function getAllUsers() {
  return db.prepare("SELECT * FROM users").all().map(u => ({
    ...u,
    totalOrders: Number(u.totalOrders || 0),
    totalPromotion: Number(u.totalPromotion || 0),
  }))
}

function upsertUser(user) {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO users(id, name, totalOrders, totalPromotion, updatedAt)
    VALUES(@id, @name, @totalOrders, @totalPromotion, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      totalOrders=excluded.totalOrders,
      totalPromotion=excluded.totalPromotion,
      updatedAt=excluded.updatedAt
  `).run({
    id: String(user.id),
    name: user.name ?? "",
    totalOrders: Number(user.totalOrders || 0),
    totalPromotion: Number(user.totalPromotion || 0),
    updatedAt: now
  })
}

module.exports = {
  getConfig,
  setConfig,
  getAllUsers,
  upsertUser,
}
