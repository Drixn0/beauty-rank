/**
 * SQLite 版 db 模块（兼容你现有的 JSON/lowdb 用法）
 *
 * 目标：尽量不改 routes（仍然支持：await db.read(); db.data.xxx; await db.write()）
 *
 * 用法：
 *   const db = require("../models/db")
 *   await db.read()
 *   db.data.config = ...
 *   await db.write()
 */

const path = require("path")
const Database = require("better-sqlite3")

// 你可以改成放到项目根目录或 data/ 目录
const DB_FILE = path.join(__dirname, "..", "data.sqlite3")

const sqlite = new Database(DB_FILE)

// 初始化：两张表（一个存整份 json，一个存 users 便于未来扩展）
sqlite.exec(`
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`)

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return fallback
  }
}

function nowISO() {
  return new Date().toISOString()
}

const db = {
  data: {
    config: {},
    users: []
  },

  async read() {
    // 读取 config
    const cfgRow = sqlite.prepare("SELECT value FROM kv WHERE key=?").get("config")
    db.data.config = cfgRow ? safeJsonParse(cfgRow.value, {}) : {}

    // 读取 users（逐条存储，避免 config 太大）
    const rows = sqlite.prepare("SELECT value FROM users").all()
    db.data.users = rows.map(r => safeJsonParse(r.value, null)).filter(Boolean)

    return db.data
  },

  async write() {
    // 写 config（整份）
    const cfg = JSON.stringify(db.data.config ?? {})
    sqlite.prepare(`
      INSERT INTO kv(key, value) VALUES(?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run("config", cfg)

    // 写 users（按 id upsert）
    const users = Array.isArray(db.data.users) ? db.data.users : []
    const stmt = sqlite.prepare(`
      INSERT INTO users(id, value) VALUES(?, ?)
      ON CONFLICT(id) DO UPDATE SET value=excluded.value
    `)

    const tx = sqlite.transaction(() => {
      for (const u of users) {
        if (!u) continue
        const id = String(u.id ?? u.userId ?? u.uid ?? "")
        if (!id) continue
        // 附带更新时间（可选）
        const next = { ...u, updatedAt: u.updatedAt || nowISO() }
        stmt.run(id, JSON.stringify(next))
      }
    })
    tx()

    return true
  }
}

module.exports = db
