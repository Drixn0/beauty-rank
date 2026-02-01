/**
 * 一次性迁移脚本：把旧的 JSON 数据库（db.json）导入 SQLite（data.sqlite3）
 *
 * 用法（在 backend 目录执行）：
 *   node scripts/migrate-json-to-sqlite.js ./db.json
 *
 * 说明：
 * - 会把 json 里的 data.config 写入 kv(config)
 * - 会把 data.users 按 id 写入 users 表
 */

const fs = require("fs")
const path = require("path")
const Database = require("better-sqlite3")

const input = process.argv[2]
if (!input) {
  console.error("用法: node scripts/migrate-json-to-sqlite.js <path/to/db.json>")
  process.exit(1)
}

const jsonPath = path.resolve(process.cwd(), input)
if (!fs.existsSync(jsonPath)) {
  console.error("找不到文件:", jsonPath)
  process.exit(1)
}

const raw = fs.readFileSync(jsonPath, "utf-8")
let obj
try {
  obj = JSON.parse(raw)
} catch (e) {
  console.error("JSON 解析失败:", e.message)
  process.exit(1)
}

const data = obj.data || obj
const config = data.config || {}
const users = Array.isArray(data.users) ? data.users : []

const DB_FILE = path.join(__dirname, "..", "data.sqlite3")
const sqlite = new Database(DB_FILE)

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

sqlite.prepare(`
  INSERT INTO kv(key, value) VALUES(?, ?)
  ON CONFLICT(key) DO UPDATE SET value=excluded.value
`).run("config", JSON.stringify(config ?? {}))

const up = sqlite.prepare(`
  INSERT INTO users(id, value) VALUES(?, ?)
  ON CONFLICT(id) DO UPDATE SET value=excluded.value
`)

const tx = sqlite.transaction(() => {
  for (const u of users) {
    if (!u) continue
    const id = String(u.id ?? u.userId ?? u.uid ?? "")
    if (!id) continue
    up.run(id, JSON.stringify(u))
  }
})
tx()

console.log("迁移完成 ✅")
console.log("SQLite 文件:", DB_FILE)
console.log("config keys:", Object.keys(config || {}).length)
console.log("users:", users.length)
