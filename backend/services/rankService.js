function calcBasePrize(rank, rules) {
  if (rank === 1) return rules[1]
  if (rank === 2) return rules[2]
  if (rank === 3) return rules[3]
  if (rank <= 20) return rules["4-20"]
  if (rank <= 100) return rules["21-100"]
  return 0
}

function n(v) {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

/**
 * 额外奖励计算（支持：固定、每满N单叠加、百分比向下取整）
 * 返回：
 * - extraTotal: 额外奖励总额
 * - applied: [{id,name,amount,detail}]
 */
function calcExtraRewards(user, rank, extras = []) {
  const applied = []
  let extraTotal = 0

  const totalOrders = n(user.totalOrders)
  const totalPromotion = n(user.totalPromotion)

  for (const r of extras) {
    if (!r || !r.enabled) continue

    let amount = 0
    let detail = ""

    // 1) 达成奖/卓越奖：单数达到门槛（固定金额）
    if (r.type === "orders_gte") {
      const th = n(r.threshold)
      if (totalOrders >= th) {
        amount = Math.floor(n(r.amount)) // 固定金额也按整数处理
        detail = `单数≥${th}`
      }
    }

    // 2) 里程碑奖：每满 step 单叠加一次（per_step）
    else if (r.type === "orders_step") {
      const step = Math.max(1, Math.floor(n(r.step)))
      const times = Math.floor(totalOrders / step)
      if (times > 0) {
        amount = Math.floor(n(r.amount)) * times
        detail = `每满${step}单×${times}`
      }
    }

    // 3) 年终奖：前N名，推广金的 percent%（向下取整）
    else if (r.type === "promotion_percent_rank_le") {
      const rankLe = Math.max(1, Math.floor(n(r.rank_le)))
      const percent = n(r.percent) // 5 表示 5%
      if (rank <= rankLe && percent > 0) {
        amount = Math.floor(totalPromotion * (percent / 100)) // ✅ 向下取整
        detail = `排名≤${rankLe}，推广金×${percent}%`
      }
    }

    if (amount > 0) {
      applied.push({
        id: r.id,
        name: r.name,
        amount,
        detail
      })
      extraTotal += amount

      // 如果某条设置为不可叠加：命中即停止
      if (r.stackable === false) break
    }
  }

  return { extraTotal, applied }
}

/**
 * 返回字段：
 * - basePrize: 基础奖金（原规则）
 * - extraPrize: 额外奖励合计
 * - extras: 额外奖励明细
 * - prize: 总奖金（基础+额外）
 */
function buildRank(users, rules, extraRewards) {
  const sorted = [...users].sort(
    (a, b) => (n(b.totalOrders) - n(a.totalOrders)) || (n(b.totalPromotion) - n(a.totalPromotion))
  )

  return sorted.map((u, i) => {
    const rank = i + 1
    const basePrize = calcBasePrize(rank, rules)
    const { extraTotal, applied } = calcExtraRewards(u, rank, extraRewards)

    return {
      ...u,
      rank,
      basePrize,
      extraPrize: extraTotal,
      extras: applied,
      prize: basePrize + extraTotal
    }
  })
}

module.exports = { buildRank }
