<template>
  <div class="theme-root" :data-theme="theme">
  <div class="page">
    <!-- 装饰 -->
    <div class="decor decor-1">👑</div>
    <div class="decor decor-2">💎</div>
    <div class="decor decor-3">⭐</div>

    <!-- 顶部 Header -->
    <header class="header">
      <div class="shell header-content">
        <!-- 标题行 -->
        <div class="title-row">
          <h1 class="title">
            <span class="header-icon">👑</span>
            美妆达人业绩榜
          </h1>
          <div class="title-actions">
            <button class="theme-toggle-btn" type="button" @click="toggleTheme" :title="theme === 'dark' ? '切换浅色' : '切换深色'">
              <span v-if="theme === 'dark'">☀️</span><span v-else>🌙</span>
            </button>
            <div class="update-tag">每日12:00更新</div>
          </div>
        </div>

        <!-- 奖金池 Banner -->
        <div class="prize-banner">
          <div class="prize-text">🏆 总奖金池：{{ formatMoney(prizePool) }}</div>
          <div class="prize-date">截止: {{ endDate }}</div>
        </div>

        <!-- 倒计时 -->
        <div class="countdown-section">
          <div class="countdown-title">⏳ 距离下次更新还有</div>

          <div class="countdown-display">
            <div class="countdown-item">
              <div class="countdown-value">{{ cd.hh }}</div>
              <div class="countdown-label">小时</div>
            </div>
            <div class="countdown-item">
              <div class="countdown-value">{{ cd.mm }}</div>
              <div class="countdown-label">分钟</div>
            </div>
            <div class="countdown-item">
              <div class="countdown-value">{{ cd.ss }}</div>
              <div class="countdown-label">秒</div>
            </div>
          </div>

          <div class="update-time">最后更新：{{ updateTime || "-" }}</div>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <main class="shell main-content">
      <!-- TAB：排行榜 / 规则页（桌面也能切换） -->
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'rank' }" @click="tab = 'rank'">
          📊 排行榜
        </button>
        <button class="tab" :class="{ active: tab === 'rules' }" @click="tab = 'rules'">
          📌 规则页
        </button>
      </div>

      <!-- ===================== 排行榜页 ===================== -->
      <section v-if="tab === 'rank'">
        <!-- 领奖台 -->
        <div class="podium-container">
          <div class="podium-step podium-2">
            <div class="podium-rank">2</div>
            <div class="podium-label">亚军</div>
            <div class="podium-prize" :class="{ 'is-empty': !prizeConfig[2] }">{{ formatPrize(prizeConfig[2]) }}</div>
          </div>

          <div class="podium-step podium-1">
            <div class="podium-rank">1</div>
            <div class="podium-label">冠军</div>
            <div class="podium-prize">{{ formatPrize(prizeConfig[1]) }}</div>
          </div>

          <div class="podium-step podium-3">
            <div class="podium-rank">3</div>
            <div class="podium-label">季军</div>
            <div class="podium-prize">{{ formatPrize(prizeConfig[3]) }}</div>
          </div>
        </div>

        <!-- 阶梯奖励 -->
        <div class="reward-steps">
          <StepItem icon="🏆" title="冠军" desc="排名第1名" :prize="prizeConfig[1]" />
          <StepItem icon="🥈" title="亚军" desc="排名第2名" :prize="prizeConfig[2]" />
          <StepItem icon="🥉" title="季军" desc="排名第3名" :prize="prizeConfig[3]" />
          <StepItem icon="⭐" title="精英达人" desc="排名4-20名" :prize="prizeConfig['4-20']" />
          <StepItem icon="💗" title="优秀达人" desc="排名21-100名" :prize="prizeConfig['21-100']" />
        </div>

        <!-- 额外奖励 -->
        <h2 class="section-title">🎁 额外奖励</h2>

        <div class="extra-rewards">
          <div v-for="r in extraRewards" :key="r.id" class="reward-card">
            <div class="reward-icon">🎀</div>
            <div class="reward-title">{{ r.name }}</div>

            <div class="reward-amount">
              <span v-if="r.type === 'promotion_percent_rank_le'">{{ r.percent }}%</span>
              <span v-else>{{ formatMoney(r.amount) }}</span>
            </div>

            <div class="reward-condition">
              <span v-if="r.type === 'orders_gte'">满{{ r.threshold }}单</span>
              <span v-else-if="r.type === 'orders_step'">每满{{ r.step }}单</span>
              <span v-else>推广金奖励（前{{ r.rank_le }}名）</span>
            </div>

            <div v-if="r.enabled === false" class="reward-disabled">（未启用）</div>
          </div>
        </div>

        <!-- 排行榜 -->
        <div class="ranking-section">
          <h2 class="section-title">📈 实时业绩排行榜</h2>

          


<div class="ranking-header">
  <div class="col-rank">排名</div>
  <div class="col-name">达人名称</div>
  <div class="col-orders">单数</div>
  <div class="col-promo">推广金 <span class="muted">(300元/单)</span></div>
  <div class="col-prize">已获奖金</div>
  <div class="col-level">等级</div>
</div>

          <div class="ranking-list">
            <div v-if="allList.length === 0" class="empty-tip">
              暂无数据（请检查后端是否启动 /api/rank 是否返回 top3、list）
            </div>

            <div v-for="u in allList" :key="u.id" class="ranking-item">
              <!-- rank -->
              <div class="rank-cell" :class="rankClass(u.rank)">
                {{ u.rank }}
              </div>

              <!-- name -->
              <div class="name-cell">
                <div class="player-avatar">{{ (u.name || "?").slice(0, 1) }}</div>
                <div>
                  <div class="player-name" :title="u.name">{{ isMobile ? displayName(u.name) : u.name }}</div>
                  <div class="player-id">ID: {{ padId(u.id) }}</div>
                </div>
              </div>

              <!-- orders -->
              <div class="data-cell orders-cell">{{ u.totalOrders }}</div>

              <!-- promotion -->
              <div class="data-cell promo-cell">¥{{ formatNum(u.totalPromotion) }}</div>

              <!-- prize -->
              <div class="data-cell prize-cell">¥{{ formatNum(u.prize) }}</div>

              <!-- icon -->
              <div class="icon-cell">
                {{ rankIcon(u.rank) }}
              </div>

              <!-- extras detail (桌面可读性更好) -->
              <!-- <div v-if="u.extras && u.extras.length" class="extras-line">
                <span class="extras-tag">额外：</span>
                <span class="extras-item" v-for="(ex, idx) in u.extras" :key="ex.id">
                  {{ ex.name }} +{{ formatNum(ex.amount) }}（{{ ex.detail }}）<span v-if="idx !== u.extras.length - 1">；</span>
                </span>
              </div> -->
            </div>
          </div>
        </div>
      </section>

      <!-- ===================== 规则页 ===================== -->
      <section v-else class="rules">
        <h2 class="section-title">📌 奖励规则说明</h2>

        <div class="rule-card">
          <div class="rule-title">1) 排名基础奖金</div>
          <div v-if="rulesSections.base" class="rule-custom md" v-html="renderMarkdown(rulesSections.base)"></div>
          <div v-else class="rule-default">
            <div class="rule-list">
              <div class="rule-item">🏆 第 1 名：<b>{{ formatPrize(prizeConfig[1]) }}</b></div>
              <div class="rule-item">🥈 第 2 名：<b>{{ formatPrize(prizeConfig[2]) }}</b></div>
              <div class="rule-item">🥉 第 3 名：<b>{{ formatPrize(prizeConfig[3]) }}</b></div>
              <div class="rule-item">⭐ 第 4-20 名：<b>{{ formatPrize(prizeConfig["4-20"]) }}</b></div>
              <div class="rule-item">💗 第 21-100 名：<b>{{ formatPrize(prizeConfig["21-100"]) }}</b></div>
            </div>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-title">2) 额外奖励（可叠加/不可叠加以后台配置为准）</div>
          <div v-if="rulesSections.extra" class="rule-custom md" v-html="renderMarkdown(rulesSections.extra)"></div>
          <div v-else class="rule-default">
            <div class="rule-list">
              <div v-for="r in extraRewards" :key="r.id" class="rule-item">
                🎁 {{ r.name }} —
                <span v-if="r.type==='orders_gte'">单数 ≥ {{ r.threshold }}</span>
                <span v-else-if="r.type==='orders_step'">每满 {{ r.step }} 单</span>
                <span v-else-if="r.type==='promotion_percent_rank_le'">排名 ≤ {{ r.rank_le }}，推广金 × {{ r.percent }}%</span>
                ，奖励 <b>{{ formatPrize(r.amount) }}</b>
                <span v-if="r.type==='orders_step'">（可叠加）</span>
                <span v-if="r.type==='promotion_percent_rank_le'">（向下取整）</span>
              </div>
              <div v-if="!extraRewards || extraRewards.length===0" class="rule-muted">暂无额外奖励配置</div>
            </div>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-title">3) 奖金池计算口径</div>
          <div v-if="rulesSections.pool" class="rule-custom md" v-html="renderMarkdown(rulesSections.pool)"></div>
          <div v-else class="rule-default">
            <div class="rule-muted">奖金池 = 前100名（含额外奖励）的总奖金之和（后端已计算并返回）。</div>
            <div class="rule-list" style="margin-top:10px">
              <div class="rule-item">🏆 当前总奖金池：<b>{{ formatMoney(prizePool) }}</b></div>
              <div class="rule-item">📅 规则截止日期：<b>{{ endDate }}</b></div>
            </div>
          </div>
        </div>

        <div class="rule-card">
          <div class="rule-title">4) 排名规则</div>
          <div v-if="rulesSections.rank" class="rule-custom md" v-html="renderMarkdown(rulesSections.rank)"></div>
          <div v-else class="rule-default">
            <div class="rule-muted">先按「总单数」降序排序；若单数相同，再按「推广金」降序排序。</div>
          </div>
        </div>
      

      <!-- ✅ 注意事项（可后台编辑：每行一条） -->
      <div v-if="noticeItems.length" class="notice-box">
        <div class="notice-title">注意事项</div>
        <div class="notice-list">
          <div v-for="(t, i) in noticeItems" :key="i" class="notice-item">
            <span class="notice-icon">✓</span>
            <span class="notice-text md" v-html="renderInlineMarkdown(t)"></span>
          </div>
        </div>
      </div>

    </section>

      <!-- 给底部导航留空间 -->
      <div class="bottom-safe-area"></div>
    </main>

    <!-- 底部按钮栏 -->
    <div v-if="toast" class="toast">{{ toast }}</div>

    <nav class="bottom-nav">
      <button class="nav-item" :class="{ active: tab === 'rank' }" @click="tab = 'rank'">
        <div class="nav-icon">📊</div>
        <div class="nav-text">排行榜</div>
      </button>

      <button class="nav-item" :class="{ active: tab === 'rules' }" @click="tab = 'rules'">
        <div class="nav-icon">📌</div>
        <div class="nav-text">规则页</div>
      </button>

      <button class="nav-item" @click="refresh()" :disabled="refreshing">
        <div class="nav-icon">{{ refreshing ? "⏳" : "🔄" }}</div>
        <div class="nav-text">{{ refreshing ? "刷新中" : "刷新" }}</div>
      </button>
    </nav>
  </div>
  </div>
</template>

<script setup>
import MarkdownIt from "markdown-it"
import DOMPurify from "dompurify"
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import axios from "axios"


// 仅手机端：达人名称超过4个字 → 显示前3个字 + “…”（即第4个字变成省略号）
const isMobile = ref(false)
function displayName(name) {
  const s = String(name ?? "")
  return s.length > 4 ? (s.slice(0, 3) + "…") : s
}
function updateIsMobile() {
  isMobile.value = window.matchMedia("(max-width: 520px)").matches
}
onMounted(() => {
  updateIsMobile()
  window.addEventListener("resize", updateIsMobile, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", updateIsMobile)
})

// ===== Dark mode (shared with AdminLogin) =====
const theme = ref("light")
const THEME_KEY = "admin_theme"

function applyThemeFromStorageOrSystem() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === "light" || saved === "dark") {
    theme.value = saved
    return
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  theme.value = prefersDark ? "dark" : "light"
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark"
  localStorage.setItem(THEME_KEY, theme.value)
}

onMounted(() => {
  applyThemeFromStorageOrSystem()
})


/* 子组件：阶梯奖励 */
const StepItem = {
  props: ["icon", "title", "desc", "prize"],
  template: `
    <div class="step-item">
      <div class="step-icon">{{icon}}</div>
      <div class="step-content">
        <div class="step-title">{{title}}</div>
        <div class="step-description">{{desc}}</div>
      </div>
      <div class="step-prize">{{ formatPrize(prize) }}</div>
    </div>
  `,
  methods: {
    formatPrize(v) {
      const x = Number(v)
      if (!Number.isFinite(x) || x <= 0) return "-"
      if (x >= 1000000) return Math.floor(x / 10000) + "万"
      return x.toLocaleString() + "元"
    }
  }
}

/* tab */
const tab = ref("rank")

/* 数据 */
const prizePool = ref(0)
const endDate = ref("-")
const prizeConfig = ref({})
const extraRewards = ref([])
const rulesText = ref("")
const rulesSections = ref({ base: "", extra: "", pool: "", rank: "", notice: "" })

// ✅ 注意事项：每行一条（支持换行）

// ✅ Markdown 渲染（安全：禁用原始 HTML，并用 DOMPurify 清洗）
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

function renderMarkdown(text) {
  const raw = String(text || "")
  return DOMPurify.sanitize(md.render(raw))
}

function renderInlineMarkdown(text) {
  const raw = String(text || "")
  return DOMPurify.sanitize(md.renderInline(raw))
}

const noticeItems = computed(() => {
  const raw = String((rulesSections.value && rulesSections.value.notice) || "").trim()
  if (!raw) return []
  return raw
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
})

const updateTime = ref("")
const lastRefreshAt = ref("")
const refreshing = ref(false)
const toast = ref("")

const top3 = ref([])
const list = ref([])
const allList = computed(() => [...top3.value, ...list.value])

/* 倒计时 */
const cd = ref({ hh: "00", mm: "00", ss: "00" })
let timer = null

function updateCountdown() {
  const now = new Date()
  const next = new Date()

  if (now.getHours() >= 12) next.setDate(next.getDate() + 1)
  next.setHours(12, 0, 0, 0)

  const diff = Math.max(0, next - now)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  cd.value = {
    hh: String(h).padStart(2, "0"),
    mm: String(m).padStart(2, "0"),
    ss: String(s).padStart(2, "0")
  }
}

/* 工具 */
function formatNum(v) {
  const x = Number(v || 0)
  return Number.isFinite(x) ? x.toLocaleString() : "0"
}
function formatMoney(v) {
  const x = Number(v || 0)
  if (!Number.isFinite(x)) return "0元"
  if (x >= 1000000) return (x / 10000).toFixed(0) + "万"
  return x.toLocaleString() + "元"
}
function formatPrize(v) {
  const x = Number(v)
  if (!Number.isFinite(x) || x <= 0) return "-"
  if (x >= 1000000) return Math.floor(x / 10000) + "万"
  return x.toLocaleString() + "元"
}
function padId(id) {
  return String(id ?? "").padStart(3, "0")
}

/* rank 样式 */
function rankClass(rank) {
  const r = Number(rank)
  if (r === 1) return "rank-1"
  if (r === 2) return "rank-2"
  if (r === 3) return "rank-3"
  if (r <= 20) return "rank-4-20"
  if (r <= 100) return "rank-21-100"
  return "rank-other"
}
function rankIcon(rank) {
  const r = Number(rank)
  if (r === 1) return "👑"
  if (r === 2) return "🥈"
  if (r === 3) return "🥉"
  if (r <= 20) return "⭐"
  if (r <= 100) return "💗"
  return "✨"
}

/* API 基地址：可用 .env 配置 VITE_API_BASE */
const API_BASE = import.meta.env.VITE_API_BASE || "/api"
const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000
})

/* 拉取接口 */
async function loadRank() {
  const { data } = await api.get("/rank", { params: { t: Date.now() } })

  top3.value = data?.top3 || []
  list.value = data?.list || []

  prizeConfig.value = data?.prizeConfig || {}
  extraRewards.value = data?.extraRewardsConfig || []

  endDate.value = data?.endDate || "-"
  prizePool.value = Number(data?.prizePool || 0)
  updateTime.value = data?.updateTime || ""
  rulesText.value = String(data?.rulesText || "")
  const rs = data?.rulesSections || {}
  rulesSections.value = {
    base: String(rs.base || ""),
    extra: String(rs.extra || ""),
    pool: String(rs.pool || ""),
    rank: String(rs.rank || ""),
    notice: String(rs.notice || "")
  }
}

async function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  toast.value = "刷新中..."
  try {
    await loadRank()
    const now = new Date()
    lastRefreshAt.value = now.toLocaleString() + "." + String(now.getMilliseconds()).padStart(3, "0")
    toast.value = "已刷新 ✅"
  } catch (e) {
    console.error(e)
    toast.value = "刷新失败 ❌（看 Network）"
  } finally {
    setTimeout(() => (toast.value = ""), 1500)
    refreshing.value = false
  }
}

onMounted(async () => {
  await refresh()
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})</script>

<style scoped>/* ===== Dark mode variables (safe, scoped) ===== */
.theme-root{
  --bg: #ffffff;
  --card: #ffffff;
  --text: #222;
  --muted: #888;
}
.theme-root[data-theme="dark"]{
  --bg: #0f0b10;
  --card: #1a141e;
  --text: #eee;
  --muted: #aaa;
}
/* Apply base colors */
.theme-root{
  background: var(--bg);
  color: var(--text);
}
.theme-root :deep(.card),
.theme-root :deep(.panel),
.theme-root :deep(.box){
  background: var(--card);
}

/* ===================== 全局强制覆盖（修复桌面仍是手机宽度/黑边） ===================== */
:global(html, body, #app) {
  height: 100%;
}

:global(body) {
  margin: 0;
  padding: 0;
  display: block !important;      /* 覆盖 base.css 可能的 flex 居中 */
  place-items: unset !important;
  background: #fef7f9 !important; /* 覆盖黑色/深色背景 */
  min-height: 100vh;
}

:global(#app) {
  width: 100%;
  max-width: none !important;     /* 覆盖 base.css 的 max-width:1280 */
  margin: 0 !important;
  padding: 0 !important;          /* 覆盖 base.css 的 padding:2rem */
}

/* ===================== 页面基础 ===================== */
.page {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  background: linear-gradient(135deg, #fef7f9, #fff9fb);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 统一内容容器：移动端全宽；桌面端变宽但不至于太散 */
.shell {
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
}

/* decor */
.decor {
  position: fixed;
  font-size: 110px;
  opacity: 0.05;
  z-index: 0;
  pointer-events: none;
}
.decor-1 { top: 6%; left: 6%; }
.decor-2 { bottom: 12%; right: 6%; }
.decor-3 { top: 18%; right: 14%; }

/* header */
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 22px 0;
  border-radius: 0 0 35px 35px;
  background: linear-gradient(135deg, #e75480, #967bb6, #d4af37);
  color: white;
}

.header-content {
  position: relative;
  z-index: 1;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title-actions{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
@media (max-width: 520px){
  .title-row{
    flex-wrap: wrap;
  }
  .title-actions{
    margin-left: auto;
  }
}

.title {
  margin: 0;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
}

.header-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.update-tag {
  font-size: 0.9rem;
  background: rgba(255,255,255,0.3);
  padding: 8px 14px;
  border-radius: 20px;
  white-space: nowrap;
}

.prize-banner {
  margin-top: 14px;
  padding: 14px 18px;
  border-radius: 20px;
  background: rgba(255,255,255,0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.prize-text { font-weight: 800; }
.prize-date { opacity: 0.95; }

.countdown-section {
  margin-top: 14px;
  padding: 16px;
  border-radius: 25px;
  background: rgba(255,255,255,0.15);
}

.countdown-title {
  font-weight: 700;
  margin-bottom: 10px;
}

.countdown-display {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.countdown-item {
  flex: 1;
  text-align: center;
}

.countdown-value {
  font-size: 2rem;
  font-weight: 900;
  background: rgba(0,0,0,0.2);
  padding: 10px 8px;
  border-radius: 15px;
}

.countdown-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 6px;
}

.update-time {
  margin-top: 10px;
  font-size: 0.85rem;
  opacity: 0.9;
}

/* main */
.main-content {
  position: relative;
  z-index: 1;
  padding: 22px 0 0;
}

/* tabs */
.tabs {
  display: flex;
  gap: 10px;
  margin: 10px 0 14px;
}
.tab {
  flex: 1;
  border: 0;
  border-radius: 18px;
  padding: 12px 10px;
  font-weight: 800;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 25px rgba(231,84,128,0.10);
  color: #444;
  cursor: pointer;
}
.tab.active {
  background: linear-gradient(135deg, rgba(255,209,220,0.95), rgba(231,84,128,0.12));
  color: #d43f6e;
}

/* podium 容器 */
.podium-container{
  display:flex;
  justify-content:center;
  align-items:flex-end;
  gap:18px;
  margin:22px 0 18px;
  padding:12px 0;
}

/* ✅ 每个台阶：作为定位容器 */
.podium-step{
  width:min(190px,28vw);
  padding:20px 14px 72px;         /* ✅ 预留底部空间给 pill */
  border-radius:20px 20px 0 0;
  font-weight:800;
  text-align:center;
  box-shadow:0 18px 45px rgba(0,0,0,0.12);
  position:relative;              /* ✅ 关键 */
  display:flex;
  flex-direction:column;
  align-items:center;
}

/* 高度保持 */
.podium-1{ height:210px; background:linear-gradient(to top,#d4af37,#f4c430); color:#fff; }
.podium-2{ height:170px; background:linear-gradient(to top,#cfcfcf,#f0f0f0); color:#444; }
.podium-3{ height:160px; background:linear-gradient(to top,#cd7f32,#b5651d); color:#fff; }

.podium-rank{ font-size:2rem; font-weight:900; }
.podium-label{ margin-top:6px; line-height:1.1; }

/* ✅ 关键：pill 绝对定位到底部，三块必然对齐 */
.podium-prize{
  position:absolute;
  left:50%;
  bottom:14px;                    /* ✅ 三个台阶同一个 bottom */
  transform:translateX(-50%);

  width:82%;
  height:38px;                    /* ✅ 固定高度 */
  line-height:38px;
  border-radius:20px;
  background:rgba(255,255,255,0.25);
  font-weight:900;
  white-space:nowrap;
  margin:0 !important;            /* ✅ 干掉旧 margin-top */
}

/* 显示 "-" 时也统一视觉 */
.podium-prize.is-empty{
  opacity:0.85;
}

/* step rewards */
.reward-steps {
  margin-top: 10px;
  display: grid;
  gap: 12px;
}

.step-item {
  background: white;
  border-radius: 25px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 14px 35px rgba(231,84,128,0.10);
}

.step-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg,#e75480,#d43f6e);
  color: white;
  font-size: 1.5rem;
}

.step-content { flex: 1; }
.step-title { font-weight: 900; }
.step-description { opacity: 0.65; font-size: 0.9rem; margin-top: 4px; }

.step-prize {
  font-weight: 900;
  color: #d43f6e;
  white-space: nowrap;
}

/* section title */
.section-title {
  margin: 18px 0 12px;
  font-size: 1.1rem;
  font-weight: 900;
  color: #333;
}

/* extra */
.extra-rewards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.reward-card {
  background: white;
  border-radius: 25px;
  padding: 18px 16px;
  text-align: center;
  box-shadow: 0 14px 35px rgba(231,84,128,0.10);
  position: relative;
}

.reward-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
  background: radial-gradient(circle at 30% 30%, rgba(120,255,230,0.45), rgba(0,200,180,0.10));
  font-size: 1.5rem;
}

.reward-title { font-weight: 900; color: #333; }

.reward-amount {
  margin-top: 10px;
  font-weight: 900;
  font-size: 1.35rem;
  color: #d43f6e;
}

.reward-condition {
  margin-top: 8px;
  font-size: 0.9rem;
  opacity: 0.65;
}

.reward-disabled {
  margin-top: 6px;
  font-size: 0.85rem;
  color: #999;
}

/* ranking */
.ranking-section {
  margin-top: 18px;
  background: white;
  border-radius: 30px;
  padding: 18px;
  box-shadow: 0 18px 45px rgba(231,84,128,0.10);
}

.ranking-header,
.ranking-item {
  display: grid;
  grid-template-columns: 55px 1fr 75px 95px 110px 70px;
  align-items: center;
}

.ranking-header {
  background: linear-gradient(135deg, #ffd1dc, rgba(150,123,182,0.18));
  padding: 14px 12px;
  border-radius: 20px;
  font-weight: 900;
  color: #444;
  box-shadow: inset 0 0 0 1px rgba(231,84,128,0.08);
}

.ranking-list {
  margin-top: 10px;
}

.empty-tip {
  padding: 16px;
  border-radius: 18px;
  background: rgba(231,84,128,0.06);
  color: #888;
  font-weight: 700;
  text-align: center;
}

.ranking-item {
  padding: 16px 10px;
  border-bottom: 1px solid rgba(231,84,128,0.08);
  transition: all 0.25s ease;
  position: relative;
}

.ranking-item:hover {
  background: rgba(231,84,128,0.04);
  transform: translateY(-2px);
}

.rank-cell {
  text-align: left;
  font-weight: 900;
  font-size: 1.25rem;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg,#e75480,#967bb6,#d4af37);
  display: grid;
  place-items: center;
  color: white;
  font-weight: 900;
  box-shadow: 0 10px 25px rgba(231,84,128,0.22);
}

.player-name { font-weight: 900; }
.player-id { font-size: 0.82rem; opacity: 0.6; margin-top: 2px; }

.data-cell {
  text-align: left;
  font-weight: 800;
}

.orders-cell { color: #d43f6e; }
.promo-cell { color: #967bb6; }
.prize-cell { color: #d4af37; }

.icon-cell {
  text-align: left;
  font-size: 1.4rem;
}

.rank-1 { color: #d4af37; }
.rank-2 { color: #9aa0a6; }
.rank-3 { color: #cd7f32; }
.rank-4-20 { color: #e75480; }
.rank-21-100 { color: #967bb6; }
.rank-other { color: #999; }

/* extras detail line (放在一行下方；桌面更清晰) */
.extras-line {
  grid-column: 1 / -1;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(150,123,182,0.06);
  color: #666;
  font-size: 0.9rem;
  line-height: 1.45;
}
.extras-tag { font-weight: 900; color: #967bb6; }
.extras-item { word-break: break-word; }

/* rules page */
.rules .rule-card {
  background: white;
  border-radius: 26px;
  padding: 18px 16px;
  margin-bottom: 14px;
  box-shadow: 0 14px 35px rgba(231,84,128,0.10);
}
.rules .rule-title {
  font-weight: 900;
  margin-bottom: 10px;
  color: #333;
}
.rules .rule-list {
  display: grid;
  gap: 8px;
}
.rules .rule-item {
  color: #444;
}
.rules .rule-muted {
  color: #888;
  font-size: 0.92rem;
}

/* bottom nav */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(231,84,128,0.10);
  box-shadow: 0 -12px 35px rgba(231,84,128,0.10);
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
}

.bottom-nav .nav-item {
  flex: 1;
  max-width: 260px;
  border: 0;
  background: transparent;
  border-radius: 18px;
  padding: 10px 8px;
  cursor: pointer;
  color: #888;
  font-weight: 800;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bottom-nav .nav-item.active {
  background: linear-gradient(135deg, rgba(255,209,220,0.95), rgba(150,123,182,0.14));
  color: #d43f6e;
}

.nav-icon { font-size: 1.2rem; }
.nav-text { font-size: 0.88rem; }

/* 防止内容被底部栏盖住 */
.bottom-safe-area {
  height: 90px;
}

/* ===================== 响应式：桌面更舒展 ===================== */
@media (min-width: 900px) {
  /* 桌面：整体更“活动大屏”一些（更宽、更舒展） */
  .shell {
    width: min(1500px, calc(100% - 80px));
  }

  .header {
    padding: 28px 0;
  }

  .title {
    font-size: 1.7rem;
  }

  .tabs {
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }

  .podium-container{
    gap: 26px;
    margin: 26px 0 22px;
  }

  .reward-steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .extra-rewards {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .ranking-section {
    padding: 24px;
  }

  .ranking-header,
  .ranking-item {
    grid-template-columns: 70px 1fr 90px 120px 140px 90px;
  }

  /* 桌面底部栏：别占满屏，居中即可 */
  .bottom-nav {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(780px, calc(100% - 40px));
    border-radius: 22px 22px 0 0;
  }

  .bottom-nav .nav-item {
    max-width: none;
  }
}

@media (max-width: 520px) {
  /* 小屏：排行榜列变紧凑 */
  .ranking-header,
  .ranking-item {
    grid-template-columns: 45px 1fr 55px 75px 80px 50px;
  }

  .podium-step {
    width: 29vw;
  }
}

/* ===============================
   ✅ 刷新反馈 & 防止“看起来没反应”
   =============================== */
.toast{
  position: fixed;
  left: 50%;
  bottom: 92px; /* 在底部按钮栏上方 */
  transform: translateX(-50%);
  background: rgba(0,0,0,.75);
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  z-index: 9999;
  font-size: 13px;
  line-height: 1;
}

.nav-item:disabled{
  opacity: .55;
  cursor: not-allowed;
}

.muted{
  /* margin-left: 8px; */
  color: #666;
  font-size: 12px;
}

/* ✅ 规则页分段自定义正文 */
.rule-custom{
  white-space: pre-wrap;
  word-break: break-word;
  color: #111;
  line-height: 1.7;
  margin-top: 8px;
}
.rule-default{ margin-top: 8px; }

/* ===============================
   ✅ 注意事项：黄底提示框
   =============================== */
.notice-box{
  margin-top: 16px;
  background: rgba(255, 230, 160, 0.35);
  border: 1px solid rgba(255, 200, 90, 0.35);
  border-radius: 18px;
  padding: 16px 16px;
  box-shadow: 0 12px 26px rgba(255, 200, 90, 0.10);
}
.notice-title{
  font-weight: 800;
  color: #b26a00;
  font-size: 16px;
  margin-bottom: 12px;
}
.notice-list{
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notice-item{
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #6b5b45;
  line-height: 1.6;
  font-size: 14px;
}
.notice-icon{
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  color: #fff;
  background: #f6b64b;
  margin-top: 2px;
}
.notice-text{
  white-space: pre-wrap;
  word-break: break-word;
}

/* ✅ Markdown 基础样式（scoped 下用 :deep） */
.md :deep(p){ margin: 0 0 8px; }
.md :deep(p:last-child){ margin-bottom: 0; }
.md :deep(ul), .md :deep(ol){ margin: 6px 0 8px 18px; }
.md :deep(li){ margin: 4px 0; }
.md :deep(a){ color: inherit; text-decoration: underline; }
.md :deep(code){
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: rgba(0,0,0,0.06);
  padding: 2px 6px;
  border-radius: 8px;
}
.md :deep(pre){
  background: rgba(0,0,0,0.06);
  padding: 10px 12px;
  border-radius: 14px;
  overflow: auto;
}
.md :deep(blockquote){
  margin: 8px 0;
  padding: 6px 10px;
  border-left: 4px solid rgba(0,0,0,0.18);
  background: rgba(0,0,0,0.04);
  border-radius: 10px;
}
.md :deep(strong){ font-weight: 800; }

/* ✅ 修正：额外奖励卡片底部条件文字颜色 */
.reward-condition{
  color: #111 !important;
}

/* ✅ 修正：排行榜“达人名称/ID”颜色 */
.player-name{
  color: #111 !important;
}
.player-id{
  color: #111 !important;
  opacity: 0.9; /* 可选：让ID比名字稍弱一点 */
}

/* ===== Rank dark overrides (apply dark surfaces & readable text) ===== */
.theme-root[data-theme="dark"] .page{
  background: radial-gradient(900px 460px at 20% 10%, rgba(255, 90, 154, 0.12), transparent 60%),
              radial-gradient(800px 520px at 90% 80%, rgba(138, 107, 209, 0.12), transparent 62%),
              linear-gradient(135deg, #0f0b10 0%, #14101a 100%);
}
.theme-root[data-theme="dark"] .shell{ background: transparent; }

.theme-root[data-theme="dark"] .header{
  background: linear-gradient(135deg, rgba(255,90,154,0.35), rgba(138,107,209,0.28), rgba(212,175,55,0.22));
  border-color: rgba(255,255,255,0.10);
}

.theme-root[data-theme="dark"] .title,
.theme-root[data-theme="dark"] .prize-text,
.theme-root[data-theme="dark"] .prize-date,
.theme-root[data-theme="dark"] .countdown-title,
.theme-root[data-theme="dark"] .update-time{
  color: rgba(255,255,255,0.88);
}
.theme-root[data-theme="dark"] .update-tag{
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.86);
}

.theme-root[data-theme="dark"] .tab{
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78);
}
.theme-root[data-theme="dark"] .tab.active{
  background: rgba(255,90,154,0.18);
  border-color: rgba(255,90,154,0.22);
  color: rgba(255,255,255,0.92);
}

.theme-root[data-theme="dark"] .reward-card,
.theme-root[data-theme="dark"] .rules-card,
.theme-root[data-theme="dark"] .board,
.theme-root[data-theme="dark"] .table{
  background: rgba(26, 20, 30, 0.86);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: none;
}

.theme-root[data-theme="dark"] .section-title,
.theme-root[data-theme="dark"] .table-head{
  color: rgba(255,255,255,0.88);
}

.theme-toggle-btn{
  position: static;
  top: auto;
  right: auto;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.20);
  background: rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.95);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.theme-root[data-theme="dark"] .theme-toggle-btn{
  border-color: rgba(255,255,255,0.18);
  background: rgba(0,0,0,0.18);
}
.theme-toggle-btn:active{ transform: translateY(1px); }

@media (max-width: 520px){
  .title-row{ flex-wrap: wrap; }
  .title-actions{ margin-left: auto; }
}

/* === Mobile: hide avatar, single-line name ellipsis, rank closer to left === */
@media (max-width: 520px){
  /* 隐藏头像与ID，节省横向空间 */
  .player-avatar{ display:none !important; }
  .player-id{ display:none !important; }
  .name-cell{ gap: 8px; }
  /* 名称单行 + 省略号（约 3~4 个中文字宽） */
  .player-name{
    max-width: 6.5em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* 排名更靠左 */
  .rank-cell{
    text-align: left;
    padding-left: 2px;
  }
  /* 更紧凑的列宽：排名 / 名称 / 单数 / 推广金 / 已获奖金 */
  .ranking-grid{
    grid-template-columns: 34px 1fr 50px 78px 86px;
  }
  .ranking-header{ padding: 12px 10px; }
  .ranking-item{ padding: 14px 10px; }
  .promo-cell, .prize-cell{ font-size: 12.5px; }
}
@media (max-width: 380px){
  .player-name{ max-width: 6em; }
  .ranking-grid{
    grid-template-columns: 32px 1fr 48px 72px 80px;
  }
}

/* === Mobile layout (single source of truth) === */
.ranking-grid > *{
  min-width: 0; /* allow grid items to shrink instead of overflowing */
}

@media (max-width: 520px){
  /* 手机端隐藏等级列（表头 + 行内图标列） */
  .col-level,
  .icon-cell{
    display: none !important;
  }

  /* 手机端隐藏头像（如果有） */
  .player-avatar,
  .avatar{
    display: none !important;
  }

  /* 5列布局：排名 / 达人 / 单数 / 推广金 / 已获奖金 */
  .ranking-header,
  .ranking-item{
    grid-template-columns: 40px 1fr 56px 86px 94px;
  }

  .ranking-header{ padding: 12px 10px; }
  .ranking-item{ padding: 14px 10px; }

  /* 排名更靠左 */
  .rank-cell{
    justify-self: start;
    text-align: left;
    padding-left: 0;
  }

  /* 表头最多两行，并做对齐 */
  .ranking-header > div{
    font-size: 12px;
    line-height: 1.15;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ranking-header .muted{
    display: block;       /* 第二行 */
    font-size: 11px;
    opacity: .7;
    margin-top: 2px;
    text-align: center;
    white-space: nowrap;
  }

  /* 表头对齐：单数/已获奖金靠右；推广金居中 */
  .ranking-header .col-orders,
  .ranking-header .col-prize{
    text-align: right;
    justify-self: end;
  }
  .ranking-header .col-promo{
    text-align: center;
    justify-self: center;
  }

  /* 数据列对齐：单数/已获奖金靠右；推广金居中 */
  .orders-cell,
  .prize-cell{
    text-align: right;
    justify-self: end;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .promo-cell{
    text-align: center;
    justify-self: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 达人名称：单行省略号（约3~4字宽） */
  .name-cell > div{ min-width: 0; } /* wrapper can shrink */
  .player-name{
    display: block;
    width: 100%;
    max-width: 7.5em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 隐藏 ID 行（更紧凑） */
  .player-id{ display: none; }
}

@media (max-width: 380px){
  .ranking-header,
  .ranking-item{
    grid-template-columns: 38px 1fr 52px 78px 86px;
  }
  .player-name{ max-width: 6.8em; }
}

/* === Mobile: hide avatar in rank list === */
@media (max-width: 520px){
  .name-cell .player-avatar{
    display: none !important;
  }
  /* 头像隐藏后，达人列更紧凑 */
  .name-cell{
    gap: 0 !important;
  }
}
</style>
