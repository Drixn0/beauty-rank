const express = require("express")
const db = require("../models/db")
const { buildRank } = require("../services/rankService")
const router = express.Router()

router.get("/rank", async (req, res) => {
  await db.read()

  db.data.config = db.data.config || {}

  const prizes = db.data.config.prizes || {}
  const extraRewards = db.data.config.extraRewards || []
  const endDate = db.data.config.endDate || "2026-12-31"

  // ✅ 旧整段规则（兼容）
  const rulesText = db.data.config.rulesText || ""

  // ✅ 新分段规则（5段）
  const rulesSections = db.data.config.rulesSections || { base: "", extra: "", pool: "", rank: "", notice: "" }

  const rankList = buildRank(db.data.users || [], prizes, extraRewards)

  const top100 = rankList.slice(0, 100)
  const prizePool = top100.reduce((s, it) => s + (Number(it.prize) || 0), 0)

  res.json({
    updateTime: new Date().toLocaleString(),
    top3: rankList.slice(0, 3),
    list: rankList.slice(3, 100),
    prizeConfig: prizes,
    extraRewardsConfig: extraRewards,
    endDate,
    prizePool,
    rulesText,
    rulesSections
  })
})

module.exports = router