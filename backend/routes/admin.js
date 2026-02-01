const express = require('express')
const db = require('../models/db')
const auth = require('../middleware/auth')
const router = express.Router()

// ✅ 后台接口全部需要登录
router.use(auth)

// ===============================
// 👤 达人管理
// ===============================

// 获取达人
router.get("/users", async (req, res) => {
  await db.read()
  res.json(db.data.users)
})

// 新增达人
router.post("/users", async (req, res) => {
  const { name, totalOrders = 0, totalPromotion = 0 } = req.body

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "name 不能为空" })
  }

  await db.read()

  // 自动生成 id：取当前最大 id + 1（确保唯一）
  const maxId = (db.data.users || []).reduce((m, u) => Math.max(m, Number(u.id) || 0), 0)
  const id = maxId + 1

  const newUser = {
    id,
    name: String(name).trim(),
    totalOrders: Number(totalOrders) || 0,
    totalPromotion: Number(totalPromotion) || 0
  }

  db.data.users.push(newUser)
  await db.write()

  res.json(newUser)
})

// 删除达人
router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ message: "id 无效" })

  await db.read()
  const idx = db.data.users.findIndex(u => Number(u.id) === id)
  if (idx === -1) return res.status(404).json({ message: "用户不存在" })

  const removed = db.data.users.splice(idx, 1)[0]
  await db.write()

  res.json({ success: true, removed })
})

router.post('/user/update', async (req, res) => {
  const { userId, addOrders, addPromotion } = req.body
  await db.read()
  const user = db.data.users.find(u => u.id === userId)
  if (!user) return res.status(404).json({ message: '用户不存在' })
  user.totalOrders += Number(addOrders) || 0
  user.totalPromotion += Number(addPromotion) || 0
  await db.write()
  res.json({ success: true })
})

// ===============================
// 🎁 奖金规则管理
// ===============================

// 获取奖金规则
router.get("/config/prizes", async (req, res) => {
  await db.read()
  res.json(db.data.config.prizes)
})

// 更新奖金规则
router.put("/config/prizes", async (req, res) => {
  const body = req.body || {}

  // === 1. 必须全部存在 ===
  const requiredKeys = ["1", "2", "3", "4-20", "21-100"]
  for (const k of requiredKeys) {
    if (body[k] === undefined && body[Number(k)] === undefined) {
      return res.status(400).json({ message: `缺少奖金字段：${k}` })
    }
  }

  // === 2. 转换成整数 ===
  const p1 = parseInt(body["1"] ?? body[1], 10)
  const p2 = parseInt(body["2"] ?? body[2], 10)
  const p3 = parseInt(body["3"] ?? body[3], 10)
  const pA = parseInt(body["4-20"], 10)
  const pB = parseInt(body["21-100"], 10)

  // === 3. 必须是非负整数 ===
  const fields = [
    ["冠军(1)", p1],
    ["亚军(2)", p2],
    ["季军(3)", p3],
    ["4-20名", pA],
    ["21-100名", pB]
  ]

  for (const [name, val] of fields) {
    if (!Number.isFinite(val) || val < 0 || !Number.isInteger(val)) {
      return res.status(400).json({ message: `${name} 奖金必须是非负整数` })
    }
  }

  // === 4. 严格递减校验（不允许倒挂） ===
  if (p1 < p2) return res.status(400).json({ message: "规则异常：冠军奖金不能小于亚军" })
  if (p2 < p3) return res.status(400).json({ message: "规则异常：亚军奖金不能小于季军" })
  if (p3 < pA) return res.status(400).json({ message: "规则异常：季军奖金不能小于 4-20 名奖金" })
  if (pA < pB) return res.status(400).json({ message: "规则异常：4-20 名奖金不能小于 21-100 名奖金" })

  // === 5. 保存 ===
  const next = { 1: p1, 2: p2, 3: p3, "4-20": pA, "21-100": pB }

  await db.read()
  db.data.config.prizes = next
  await db.write()

  res.json({ success: true, message: "奖金规则更新成功", prizes: next })
})

// ===============================
// 🎁 额外奖励配置
// ===============================

router.get("/config/extras", async (req, res) => {
  await db.read()
  res.json(db.data.config.extraRewards || [])
})

router.put("/config/extras", async (req, res) => {
  const list = req.body

  if (!Array.isArray(list)) {
    return res.status(400).json({ message: "extraRewards 必须是数组" })
  }

  const allowTypes = new Set(["orders_gte", "orders_step", "promotion_percent_rank_le"])
  const allowNames = new Set(["达成奖", "里程碑奖", "卓越奖", "年终奖"])

  for (const item of list) {
    if (!item || !allowNames.has(item.name)) {
      return res.status(400).json({ message: "奖励名称不合法（仅允许：达成奖/里程碑奖/卓越奖/年终奖）" })
    }
    if (!allowTypes.has(item.type)) {
      return res.status(400).json({ message: `奖励类型不合法：${item.name}` })
    }
    if (typeof item.enabled !== "boolean") {
      return res.status(400).json({ message: `${item.name} enabled 必须是 boolean` })
    }

    const amount = Number(item.amount ?? 0)
    const threshold = Number(item.threshold ?? 0)
    const step = Number(item.step ?? 0)
    const percent = Number(item.percent ?? 0)
    const rankLe = Number(item.rank_le ?? 0)

    if (item.type === "orders_gte") {
      if (!Number.isFinite(threshold) || threshold <= 0) {
        return res.status(400).json({ message: `${item.name} threshold 必须>0` })
      }
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ message: `${item.name} amount 必须>=0` })
      }
    }

    if (item.type === "orders_step") {
      if (!Number.isFinite(step) || step <= 0) {
        return res.status(400).json({ message: `里程碑奖 step 必须>0` })
      }
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ message: `里程碑奖 amount 必须>=0` })
      }
    }

    if (item.type === "promotion_percent_rank_le") {
      if (!Number.isFinite(rankLe) || rankLe <= 0) {
        return res.status(400).json({ message: `年终奖 rank_le 必须>0` })
      }
      if (!Number.isFinite(percent) || percent < 0) {
        return res.status(400).json({ message: `年终奖 percent 必须>=0` })
      }
    }
  }

  await db.read()
  db.data.config.extraRewards = list
  await db.write()

  res.json({ success: true, extraRewards: list })
})

// ===============================
// 📌 规则页正文（整段，可选保留）
// ===============================

router.get("/config/rules", async (req, res) => {
  await db.read()
  res.json({ rulesText: db.data.config?.rulesText || "" })
})

router.put("/config/rules", async (req, res) => {
  const rulesText = (req.body?.rulesText ?? "").toString()
  if (rulesText.length > 20000) {
    return res.status(400).json({ message: "规则正文过长（最多 20000 字）" })
  }

  await db.read()
  db.data.config = db.data.config || {}
  db.data.config.rulesText = rulesText
  await db.write()

  res.json({ success: true, rulesText })
})

// ===============================
// 📌 规则页分段正文（你要的：4段分别编辑）
// ===============================

// 获取分段正文
router.get("/config/rules-sections", async (req, res) => {
  await db.read()
  const rs = db.data.config?.rulesSections || { base: "", extra: "", pool: "", rank: "", notice: "" }
  res.json({ rulesSections: rs })
})

// 保存整份分段正文
router.put("/config/rules-sections", async (req, res) => {
  const body = req.body || {}
  const rs = body.rulesSections || body

  if (typeof rs !== "object" || rs === null || Array.isArray(rs)) {
    return res.status(400).json({ message: "rulesSections 必须是对象" })
  }

  const allowKeys = ["base", "extra", "pool", "rank", "notice"]
  const next = {}

  for (const k of allowKeys) {
    const v = (rs[k] ?? "").toString()
    if (v.length > 20000) {
      return res.status(400).json({ message: `规则段 ${k} 过长（最多 20000 字）` })
    }
    next[k] = v
  }

  await db.read()
  db.data.config = db.data.config || {}
  db.data.config.rulesSections = next
  await db.write()

  res.json({ success: true, rulesSections: next })
})

module.exports = router
