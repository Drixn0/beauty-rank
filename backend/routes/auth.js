const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const db = require("../models/db")
const auth = require("../middleware/auth")

const router = express.Router()

/**
 * 获取管理员密码 hash
 * 优先级：
 * 1️⃣ SQLite（db.data.config.adminPasswordHash）
 * 2️⃣ .env ADMIN_PASSWORD_HASH
 * 3️⃣ 初始化：.env ADMIN_PASSWORD 或 123456（写回 SQLite）
 */
async function getAdminPasswordHash() {
  await db.read()
  db.data.config = db.data.config || {}

  // 1. SQLite
  if (
    typeof db.data.config.adminPasswordHash === "string" &&
    db.data.config.adminPasswordHash.trim()
  ) {
    return db.data.config.adminPasswordHash
  }

  // 2. .env hash
  if (
    process.env.ADMIN_PASSWORD_HASH &&
    process.env.ADMIN_PASSWORD_HASH.trim()
  ) {
    return process.env.ADMIN_PASSWORD_HASH.trim()
  }

  // 3. 初始化（只会发生一次）
  const defaultPwd = process.env.ADMIN_PASSWORD || "123456"
  const hash = await bcrypt.hash(defaultPwd, 10)

  db.data.config.adminPasswordHash = hash
  await db.write()

  console.log("🔐 管理员密码已初始化并写入 SQLite")
  return hash
}

/**
 * 登录
 */
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body || {}

    if (String(username || "") !== "admin") {
      return res.status(401).json({ message: "账号或密码错误" })
    }

    const hash = await getAdminPasswordHash()
    const ok = await bcrypt.compare(String(password || ""), hash)

    if (!ok) {
      return res.status(401).json({ message: "账号或密码错误" })
    }

    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    )

    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "登录失败" })
  }
})

/**
 * 修改管理员密码（需要登录）
 * body: { oldPassword, newPassword }
 */
router.put("/admin/password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {}

    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: "新密码至少 8 位" })
    }

    const hash = await getAdminPasswordHash()
    const ok = await bcrypt.compare(String(oldPassword || ""), hash)

    if (!ok) {
      return res.status(401).json({ message: "旧密码错误" })
    }

    const newHash = await bcrypt.hash(String(newPassword), 10)

    await db.read()
    db.data.config = db.data.config || {}
    db.data.config.adminPasswordHash = newHash
    await db.write()

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "修改失败" })
  }
})

module.exports = router
