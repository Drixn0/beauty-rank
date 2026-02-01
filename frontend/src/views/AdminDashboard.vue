<template>
  <div class="theme-root" :data-theme="theme">
    <div class="page">
      <div class="wrap">
        <!-- 顶部 Header -->
        <header class="admin-hero">
          <div class="hero-left">
            <div class="hero-title">
              <span class="hero-icon">⚙️</span>
              <div>
                <div class="hero-h1">数据管理后台</div>
                <div class="hero-sub">仅限内部人员 · 统一规则计算 · API 驱动</div>
              </div>
            </div>
          </div>

          <div class="hero-actions">
            <div class="hero-actions-right compact">
              <button class="theme-toggle-btn inline" type="button" @click="toggleThemeAnimated" :class="{ bounce: themeAnimating }"
                :title="theme === 'dark' ? '切换浅色' : '切换深色'">
                <span v-if="theme === 'dark'">☀️</span><span v-else>🌙</span>
              </button>
              <button class="btn btn-secondary logout-inline" @click="logoutAsk">退出登录</button>
            </div>
          </div>
        </header>

        <!-- 统计卡片 -->
        <section class="stats">
          <div class="stat-card">
            <div class="stat-label">达人总数</div>
            <div class="stat-value">{{ users.length }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">总单数</div>
            <div class="stat-value">{{ format(totalOrders) }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">总推广金</div>
            <div class="stat-value">¥{{ format(totalPromotion) }}</div>
          </div>
        </section>

        <main class="main">
          <!-- 管理卡：选择/搜索达人 -->
          <section class="card">
            <div class="card-title">
              <span class="badge">达人管理</span>
              <div class="card-h2">选择达人并更新数据</div>
              <div class="card-sub">更新的是“累计总数据”，排行榜会自动按规则刷新</div>
            </div>

            <div class="grid">
              <div class="field">
                <label>搜索（姓名或ID）</label>
                <div class="search">
                  <input v-model.trim="searchTerm" placeholder="例如：Alice 或 1" @keyup.enter="handleSearch" />
                  <button class="btn btn-primary" @click="handleSearch">搜索</button>
                </div>
              </div>

              <div class="field">
                <label>选择达人</label>
                <select v-model.number="selectedId" @change="syncCurrent">
                  <option :value="0">请选择</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.name }}（ID: {{ String(u.id).padStart(3, "0") }}）
                  </option>
                </select>
              </div>
            </div>

            <div v-if="current" class="current">
              <div class="current-left">
                <div class="avatar">{{ current.name?.slice(0, 1) }}</div>
                <div>
                  <div class="current-name">{{ current.name }}</div>
                  <div class="current-id">ID: {{ String(current.id).padStart(3, "0") }}</div>
                </div>
              </div>
              <div class="current-right">
                <div class="pill">
                  <div class="pill-label">当前单数</div>
                  <div class="pill-value">{{ current.totalOrders }}</div>
                </div>
                <div class="pill">
                  <div class="pill-label">当前推广金</div>
                  <div class="pill-value">¥{{ format(current.totalPromotion) }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 管理卡：更新数据 -->
          <section class="card">
            <div class="card-title">
              <span class="badge">更新</span>
              <div class="card-h2">新增业绩数据</div>
              <div class="card-sub">只填“新增”，提交后会累加到该达人总数据</div>
            </div>

            <div class="grid grid-3">
              <div class="field">
                <label>新增单数</label>
                <input type="number" min="0" v-model.number="addOrders" placeholder="例如：10" />
              </div>
              <div class="field">
                <label>新增推广金（¥）</label>
                <input type="number" min="0" v-model.number="addPromotion" placeholder="例如：500" />
              </div>
              <div class="field actions">
                <label>&nbsp;</label>
                <button class="btn btn-primary" @click="submit" :disabled="saving">
                  {{ saving ? "提交中..." : "提交更新" }}
                </button>
              </div>
            </div>

            <div class="modal-overlay" v-if="msg" @click.self="closeMsg" @keydown.esc="closeMsg" tabindex="-1"
              ref="modalEl">
              <div class="ios-modal" :class="{ ok: msgType === 'ok', err: msgType === 'err' }" role="dialog"
                aria-modal="true">
                <div class="ios-modal__icon">
                  <span v-if="msgType === 'ok'">✅</span>
                  <span v-else-if="msgType === 'err'">❌</span>
                  <span v-else>⚠️</span>
                </div>
                <div class="ios-modal__title">{{ msgType === 'ok' ? '已完成' : (msgType === 'err' ? '出错了' : '提示') }}</div>
                <div class="ios-modal__text">{{ msg }}</div>
                <div class="ios-modal__actions">
                  <button class="btn btn-primary ios-modal__btn" type="button" @click="closeMsg">我知道了</button>
                </div>
              </div>
            </div>
          </section>

          <!-- 奖金规则 -->
          <section class="card">
            <div class="card-title">
              <span class="badge">规则</span>
              <div class="card-h2">奖金规则配置</div>
              <div class="card-sub">修改后会影响排行榜奖金计算（前端不参与计算）</div>
            </div>

            <div class="grid grid-3">
              <div class="field">
                <label>冠军（NO.1）</label>
                <input type="number" min="0" v-model.number="prize[1]" />
              </div>

              <div class="field">
                <label>亚军（NO.2）</label>
                <input type="number" min="0" v-model.number="prize[2]" />
              </div>

              <div class="field">
                <label>季军（NO.3）</label>
                <input type="number" min="0" v-model.number="prize[3]" />
              </div>
            </div>

            <div class="grid" style="margin-top: 14px;">
              <div class="field">
                <label>第 4 - 20 名</label>
                <input type="number" min="0" v-model.number="prize['4-20']" />
              </div>

              <div class="field">
                <label>第 21 - 100 名</label>
                <input type="number" min="0" v-model.number="prize['21-100']" />
              </div>
            </div>

            <div class="row-actions">
              <button class="btn btn-secondary" @click="loadPrizes">重新加载</button>
              <button class="btn btn-primary" @click="savePrizesAsk" :disabled="prizeSaving">
                {{ prizeSaving ? "保存中..." : "保存规则" }}
              </button>
            </div>
          </section>

          <!-- 额外奖励 -->
          <section class="card" v-if="extrasCfg.length === 4">
            <div class="card-title">
              <span class="badge">额外奖励</span>
              <div class="card-h2">额外奖励配置</div>
              <div class="card-sub">修改“门槛单数 / 金额 / 百分比 / 前N名”，保存后排行榜立即生效</div>
            </div>

            <div class="extras-admin">
              <!-- 达成奖 -->
              <div class="extras-row">
                <div class="left">
                  <div class="row-title">达成奖</div>
                  <div class="row-sub">满足单数门槛发固定金额</div>
                </div>
                <div class="right-grid">
                  <div class="switch">
                    <label class="ios-switch">
                      <input type="checkbox" v-model="extrasCfg[0].enabled" />
                      <span class="ios-slider"></span>
                    </label>
                    <span class="switch-label">启用</span>
                  </div>
                  <div class="mini-field">
                    <span>满</span>
                    <input type="number" min="1" v-model.number="extrasCfg[0].threshold" />
                    <span>单</span>
                  </div>
                  <div class="mini-field">
                    <span>奖励</span>
                    <input type="number" min="0" v-model.number="extrasCfg[0].amount" />
                    <span>元</span>
                  </div>
                </div>
              </div>

              <!-- 里程碑奖 -->
              <div class="extras-row">
                <div class="left">
                  <div class="row-title">里程碑奖</div>
                  <div class="row-sub">每满 N 单叠加一次</div>
                </div>
                <div class="right-grid">
                  <div class="switch">
                    <label class="ios-switch">
                      <input type="checkbox" v-model="extrasCfg[1].enabled" />
                      <span class="ios-slider"></span>
                    </label>
                    <span class="switch-label">启用</span>
                  </div>
                  <div class="mini-field">
                    <span>每满</span>
                    <input type="number" min="1" v-model.number="extrasCfg[1].step" />
                    <span>单</span>
                  </div>
                  <div class="mini-field">
                    <span>奖励</span>
                    <input type="number" min="0" v-model.number="extrasCfg[1].amount" />
                    <span>元</span>
                  </div>
                </div>
              </div>

              <!-- 卓越奖 -->
              <div class="extras-row">
                <div class="left">
                  <div class="row-title">卓越奖</div>
                  <div class="row-sub">满足大门槛发固定金额</div>
                </div>
                <div class="right-grid">
                  <div class="switch">
                    <label class="ios-switch">
                      <input type="checkbox" v-model="extrasCfg[2].enabled" />
                      <span class="ios-slider"></span>
                    </label>
                    <span class="switch-label">启用</span>
                  </div>
                  <div class="mini-field">
                    <span>满</span>
                    <input type="number" min="1" v-model.number="extrasCfg[2].threshold" />
                    <span>单</span>
                  </div>
                  <div class="mini-field">
                    <span>奖励</span>
                    <input type="number" min="0" v-model.number="extrasCfg[2].amount" />
                    <span>元</span>
                  </div>
                </div>
              </div>

              <!-- 年终奖 -->
              <div class="extras-row">
                <div class="left">
                  <div class="row-title">年终奖</div>
                  <div class="row-sub">推广金按百分比（向下取整），限制前N名</div>
                </div>
                <div class="right-grid">
                  <div class="switch">
                    <label class="ios-switch">
                      <input type="checkbox" v-model="extrasCfg[3].enabled" />
                      <span class="ios-slider"></span>
                    </label>
                    <span class="switch-label">启用</span>
                  </div>
                  <div class="mini-field">
                    <span>前</span>
                    <input type="number" min="1" v-model.number="extrasCfg[3].rank_le" />
                    <span>名</span>
                  </div>
                  <div class="mini-field">
                    <span>比例</span>
                    <input type="number" min="0" v-model.number="extrasCfg[3].percent" />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="row-actions">
              <button class="btn btn-secondary" @click="loadExtrasCfg">重新加载</button>
              <button class="btn btn-primary" @click="saveExtrasCfgAsk" :disabled="extrasSaving">
                {{ extrasSaving ? "保存中..." : "保存额外奖励配置" }}
              </button>
            </div>
          </section>
          <!-- 规则页分段正文（4段分别编辑） -->
          <section class="card">
            <div class="card-title">
              <span class="badge">规则页</span>
              <div class="card-h2">规则页分段正文（4段分别编辑）</div>
              <div class="card-sub">每一段对应规则页的一张卡片；留空则显示系统默认排版（跟随奖金/额外奖励配置自动生成）</div>
            </div>

            <div class="field">
              <label>1) 排名基础奖金（自定义正文）</label>
              <textarea class="textarea" rows="4" v-model="rulesSections.base"
                placeholder="留空=显示默认（冠军/亚军/季军...）"></textarea>
            </div>

            <div class="field">
              <label>2) 额外奖励（自定义正文）</label>
              <textarea class="textarea" rows="4" v-model="rulesSections.extra"
                placeholder="留空=显示默认（达成奖/里程碑奖...）"></textarea>
            </div>

            <div class="field">
              <label>3) 奖金池计算口径（自定义正文）</label>
              <textarea class="textarea" rows="3" v-model="rulesSections.pool"
                placeholder="留空=显示默认（总奖金池/截止日期）"></textarea>
            </div>

            <div class="field">
              <label>4) 排名规则（自定义正文）</label>
              <textarea class="textarea" rows="2" v-model="rulesSections.rank"
                placeholder="留空=显示默认（按单数/推广金排序）"></textarea>
            </div>

            <div class="field">
              <label>注意事项（每行一条，支持 Markdown）</label>
              <textarea class="textarea" rows="4" v-model="rulesSections.notice"
                placeholder="示例：&#10;所有奖金将在活动结束后统一发放&#10;数据以系统统计为准，如有疑问请联系客服&#10;禁止任何形式的刷单行为，一经发现取消资格"></textarea>
            </div>

            <div class="row-actions">
              <button class="btn btn-secondary" @click="loadRulesSections">重新加载</button>
              <button class="btn btn-primary" @click="saveRulesSectionsAsk" :disabled="rulesSectionsSaving">
                {{ rulesSectionsSaving ? "保存中..." : "保存规则分段" }}
              </button>
            </div>
          </section>



          <!-- 达人总览 -->
          <section class="card">
            <div class="card-title row">
              <div>
                <span class="badge">总览</span>
                <div class="card-h2">达人列表</div>
                <div class="card-sub">按单数 / 推广金 排序（与排行榜规则一致）</div>
              </div>

              <div class="right-actions">
<button class="btn btn-secondary" @click="showCreate = true">新增达人</button>
                <button class="btn btn-secondary" @click="refreshUsers" :disabled="loading">
                  {{ loading ? "刷新中..." : "刷新数据" }}
                </button>
              </div>
            </div>

            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 80px;">ID</th>
                    <th>达人</th>
                    <th style="width: 140px;">单数</th>
                    <th style="width: 180px;">推广金</th>
                    <th style="width: 120px;">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in sortedUsers" :key="u.id" :class="{ active: u.id === selectedId }">
                    <td>{{ String(u.id).padStart(3, "0") }}</td>
                    <td class="name-cell">
                      <span class="mini-avatar">{{ u.name?.slice(0, 1) }}</span>
                      <span>{{ u.name }}</span>
                    </td>
                    <td>{{ u.totalOrders }}</td>
                    <td>¥{{ format(u.totalPromotion) }}</td>
                    <td>
                      <button class="btn-mini btn-danger" @click="openDelete(u)">删除</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- 新增达人弹窗 -->
          <div v-if="showCreate" class="modal-mask" @click.self="showCreate = false">
            <div class="modal">
              <div class="modal-title">
                <div>新增达人</div>
                <button class="x" @click="showCreate = false">✕</button>
              </div>

              <div class="modal-body">
                <div class="field">
                  <label>达人名称（必填）</label>
                  <input v-model.trim="newName" placeholder="例如：Daisy" />
                </div>

                <div class="grid">
                  <div class="field">
                    <label>初始单数</label>
                    <input type="number" min="0" v-model.number="newOrders" />
                  </div>
                  <div class="field">
                    <label>初始推广金（¥）</label>
                    <input type="number" min="0" v-model.number="newPromotion" />
                  </div>
                </div>

                <button class="btn btn-primary full" @click="submitCreate">确认新增</button>
              </div>
            </div>
          </div>

          <!-- 🔐 安全：修改管理员密码 -->
          <section class="card pwd-card">
            <div class="card-title">
              <span class="badge">安全</span>
              <div class="card-h2">修改管理员密码</div>
              <div class="card-sub">新密码至少 8 位；修改成功后建议重新登录。</div>
            </div>

            <div class="pwd-grid">
              <div class="pwd-field">
                <label>旧密码</label>
                <div class="pwd-input">
                  <input v-model="oldPassword" :type="showOld ? 'text' : 'password'" placeholder="请输入旧密码" />
                  <button type="button" class="eye-btn" @click="showOld = !showOld">{{ showOld ? "🙈" : "👁" }}</button>
                </div>
              </div>

              <div class="pwd-field">
                <label>新密码</label>
                <div class="pwd-input">
                  <input v-model="newPassword" :type="showNew ? 'text' : 'password'" placeholder="至少 8 位" />
                  <button type="button" class="eye-btn" @click="showNew = !showNew">{{ showNew ? "🙈" : "👁" }}</button>
                </div>
              </div>

              <div class="pwd-field">
                <label>确认新密码</label>
                <div class="pwd-input">
                  <input v-model="confirmPassword" :type="showNew2 ? 'text' : 'password'" placeholder="再次输入新密码" />
                  <button type="button" class="eye-btn" @click="showNew2 = !showNew2">{{ showNew2 ? "🙈" : "👁"
                    }}</button>
                </div>
              </div>

              <div class="pwd-actions">
                <button class="btn btn-primary" type="button" :disabled="pwdSaving" @click="changePassword">
                  {{ pwdSaving ? "保存中…" : "保存新密码" }}
                </button>
              </div>
            </div>
          </section>


          <!-- iOS 风格确认弹窗（取消 / 确认） -->
          <div class="confirm-overlay" v-if="confirm.show" @click.self="confirmCancel" @keydown.esc="confirmCancel"
            tabindex="-1" ref="confirmEl">
            <div class="confirm-card" :class="{ danger: confirm.type === 'danger' }" role="dialog" aria-modal="true">
              <div class="confirm-icon">
                <span v-if="confirm.type === 'danger'">❗️</span>
                <span v-else>⚠️</span>
              </div>
              <div class="confirm-title">{{ confirm.title }}</div>
              <div class="confirm-text">{{ confirm.text }}</div>
              <div class="confirm-actions">
                <button class="confirm-btn cancel" type="button" @click="confirmCancel">{{ confirm.cancelText
                  }}</button>
                <button class="confirm-btn ok" :class="{ danger: confirm.type === 'danger' }" type="button"
                  @click="confirmOk">{{ confirm.okText }}</button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  </div>

</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from "vue"
import {
  getUsers,
  updateUser,
  createUser,
  deleteUser,
  getPrizeConfig,
  updatePrizeConfig,
  getExtraRewards,
  saveExtraRewards,
  getRulesSections,
  saveRulesSections
} from "@/api/admin"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "vue-router"

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

// iOS 弹性动画：主题切换按钮（scale + fade）
const themeAnimating = ref(false)
function toggleThemeAnimated() {
  if (themeAnimating.value) return
  themeAnimating.value = true
  toggleTheme()
  setTimeout(() => {
    themeAnimating.value = false
  }, 420)
}

// 退出登录前二次确认（iOS Confirm：取消/退出）
function logoutAsk() {
  openConfirm({
    title: "确认退出登录",
    text: "确定要退出管理后台吗？",
    okText: "退出",
    cancelText: "取消",
    type: "danger",
    onOk: () => logout()
  })
}

onMounted(() => {
  applyThemeFromStorageOrSystem()
})


const store = useAuthStore()
const router = useRouter()

const users = ref([])
const loading = ref(false)
const saving = ref(false)

const selectedId = ref(0)
const current = ref(null)

const searchTerm = ref("")
const addOrders = ref(0)
const addPromotion = ref(0)

const msg = ref("")
const msgType = ref("ok")

const showCreate = ref(false)
const newName = ref("")
const newOrders = ref(0)
const newPromotion = ref(0)

const deletingUser = ref(null)

function format(n) {
  return Number(n || 0).toLocaleString()
}

const totalOrders = computed(() =>
  users.value.reduce((s, u) => s + Number(u.totalOrders || 0), 0)
)

const totalPromotion = computed(() =>
  users.value.reduce((s, u) => s + Number(u.totalPromotion || 0), 0)
)

const sortedUsers = computed(() => {
  return [...users.value].sort(
    (a, b) => (b.totalOrders - a.totalOrders) || (b.totalPromotion - a.totalPromotion)
  )
})

async function refreshUsers() {
  loading.value = true
  try {
    const res = await getUsers()
    users.value = res.data || []
    syncCurrent()
  } finally {
    loading.value = false
  }
}

function syncCurrent() {
  current.value = users.value.find(u => u.id === selectedId.value) || null
}

function handleSearch() {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return

  const found = users.value.find(u =>
    String(u.id).includes(term) || String(u.name || "").toLowerCase().includes(term)
  )

  if (found) {
    selectedId.value = found.id
    syncCurrent()
    flash("已定位到达人：" + found.name, "ok")
  } else {
    flash("未找到匹配达人", "err")
  }
}

async function submit() {
  if (!selectedId.value) return flash("请先选择达人", "err")
  if (addOrders.value < 0 || addPromotion.value < 0) return flash("新增数据不能为负数", "err")

  saving.value = true
  try {
    await updateUser({
      userId: selectedId.value,
      addOrders: addOrders.value || 0,
      addPromotion: addPromotion.value || 0
    })
    addOrders.value = 0
    addPromotion.value = 0

    await refreshUsers()
    flash("更新成功 ✅", "ok")
  } catch (e) {
    flash("更新失败，请检查后端是否运行/Token是否有效", "err")
  } finally {
    saving.value = false
  }
}

async function submitCreate() {
  if (!newName.value.trim()) return flash("请输入达人名称", "err")
  if (newOrders.value < 0 || newPromotion.value < 0) return flash("初始数据不能为负数", "err")

  try {
    await createUser({
      name: newName.value,
      totalOrders: newOrders.value || 0,
      totalPromotion: newPromotion.value || 0
    })

    showCreate.value = false
    newName.value = ""
    newOrders.value = 0
    newPromotion.value = 0

    await refreshUsers()
    flash("新增达人成功 ✅", "ok")
  } catch (e) {
    flash("新增失败：请检查后端是否已添加接口", "err")
  }
}

const prize = ref({
  1: 3000000,
  2: 1200000,
  3: 500000,
  "4-20": 50000,
  "21-100": 5000
})

const prizeSaving = ref(false)

async function loadPrizes() {
  const res = await getPrizeConfig()
  prize.value = {
    1: Number(res.data[1] ?? res.data["1"] ?? 0),
    2: Number(res.data[2] ?? res.data["2"] ?? 0),
    3: Number(res.data[3] ?? res.data["3"] ?? 0),
    "4-20": Number(res.data["4-20"] ?? 0),
    "21-100": Number(res.data["21-100"] ?? 0)
  }
}

async function savePrizes() {
  const keys = [1, 2, 3, "4-20", "21-100"]
  for (const k of keys) {
    const v = Number(prize.value[k])
    if (!Number.isFinite(v) || v < 0) return flash(`奖金规则 ${k} 无效`, "err")
  }

  prizeSaving.value = true
  try {
    await updatePrizeConfig(prize.value)
    flash("奖金规则已保存 ✅（排行榜即时生效）", "ok")
  } catch (e) {
    flash(e.response?.data?.message || "保存失败", "err")
  } finally {
    prizeSaving.value = false
  }
}

function savePrizesAsk() {
  openConfirm({
    title: "确认保存奖金规则",
    text: "保存后排行榜奖金计算将立即生效。\n确定保存吗？",
    okText: "确认保存",
    cancelText: "取消",
    type: "info",
    onOk: () => savePrizes()
  })
}


function openDelete(u) {
  deletingUser.value = u
  openConfirm({
    title: "确认删除",
    text: `你确定要删除达人：${u?.name || ""}（ID: ${u?.id || ""}）吗？删除后将从数据中移除（不可恢复，除非手动再新增）。`,
    okText: "确认删除",
    cancelText: "取消",
    type: "danger",
    onOk: () => confirmDelete()
  })
}

async function confirmDelete() {
  if (!deletingUser.value) return
  try {
    await deleteUser(deletingUser.value.id)

    if (selectedId.value === deletingUser.value.id) {
      selectedId.value = 0
      current.value = null
    }
    deletingUser.value = null

    await refreshUsers()
    flash("删除成功 ✅", "ok")
  } catch (e) {
    flash("删除失败：请检查后端接口/权限", "err")
  }
}

function defaultExtras() {
  return [
    { id: 1, name: "达成奖", enabled: true, type: "orders_gte", threshold: 10, amount: 980 },
    { id: 2, name: "里程碑奖", enabled: true, type: "orders_step", step: 100, amount: 15000 },
    { id: 3, name: "卓越奖", enabled: true, type: "orders_gte", threshold: 1000, amount: 100000 },
    { id: 4, name: "年终奖", enabled: true, type: "promotion_percent_rank_le", rank_le: 100, percent: 5 }
  ]
}

const extrasCfg = ref(defaultExtras())
const extrasSaving = ref(false)

const rulesSections = ref({ base: "", extra: "", pool: "", rank: "", notice: "" })
const rulesSectionsSaving = ref(false)

async function loadExtrasCfg() {
  const res = await getExtraRewards()
  const arr = Array.isArray(res.data) ? res.data : []
  extrasCfg.value = arr.length === 4 ? arr : defaultExtras()
}

async function saveExtrasCfg() {
  extrasSaving.value = true
  try {
    if (extrasCfg.value.length !== 4) extrasCfg.value = defaultExtras()
    await saveExtraRewards(extrasCfg.value)
    flash("额外奖励配置已保存 ✅（排行榜即时生效）", "ok")
  } catch (e) {
    flash(e?.response?.data?.message || "保存失败", "err")
  } finally {
    extrasSaving.value = false
  }
}

function saveExtrasCfgAsk() {
  openConfirm({
    title: "确认保存额外奖励配置",
    text: "保存后排行榜将立即按新配置计算。\n确定保存吗？",
    okText: "确认保存",
    cancelText: "取消",
    type: "info",
    onOk: () => saveExtrasCfg()
  })
}



// ===============================
// 📌 规则页分段正文（4段分别编辑）
// ===============================
async function loadRulesSections() {
  try {
    const res = await getRulesSections()
    const rs = res.data?.rulesSections || {}
    rulesSections.value = {
      base: String(rs.base || ""),
      extra: String(rs.extra || ""),
      pool: String(rs.pool || ""),
      rank: String(rs.rank || ""),
      notice: String(rs.notice || "")
    }
  } catch (e) {
    console.error(e)
    flash(e?.response?.data?.message || "规则分段加载失败", "err")
  }
}

async function saveRulesSectionsClick() {
  rulesSectionsSaving.value = true
  try {
    await saveRulesSections(rulesSections.value)
    flash("规则分段已保存 ✅（Rank 规则页立即生效）", "ok")
  } catch (e) {
    console.error(e)
    flash(e?.response?.data?.message || "规则分段保存失败", "err")
  } finally {
    rulesSectionsSaving.value = false
  }
}

function saveRulesSectionsAsk() {
  openConfirm({
    title: "确认保存规则分段",
    text: "保存后前台规则页将立即更新（用户可能需要刷新）。\n确定保存吗？",
    okText: "确认保存",
    cancelText: "取消",
    type: "info",
    onOk: () => saveRulesSectionsClick()
  })
}


function flash(text, type) {
  msg.value = text
  msgType.value = type || "ok"
  const ms = msgType.value === "ok" ? 1500 : 2600
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => closeMsg(), ms)
}

function logout() {
  store.logout()
  router.push("/admin/login")
}

onMounted(() => {
  refreshUsers()
  loadPrizes()
  loadExtrasCfg()
  loadRulesSections()
})


// ===== 修改管理员密码 =====
const oldPassword = ref("")
const newPassword = ref("")
const confirmPassword = ref("")
const showOld = ref(false)
const showNew = ref(false)
const showNew2 = ref(false)
const pwdSaving = ref(false)
function getTokenSafe() {
  // 兼容不同存储方式（Pinia / localStorage）
  try {
    if (typeof store !== "undefined") {
      if (store.token) return store.token
      if (store.$state && store.$state.token) return store.$state.token
    }
  } catch (e) { }
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("auth_token") ||
    ""
  )
}

async function changePassword() {
  // 校验
  if (!oldPassword.value || !newPassword.value) return flash("请输入旧密码和新密码", "err")
  if (String(newPassword.value).length < 8) return flash("新密码至少 8 位", "err")
  if (newPassword.value !== confirmPassword.value) return flash("两次输入的新密码不一致", "err")

  const token = getTokenSafe()
  if (!token) return flash("未登录或登录已过期，请重新登录", "err")

  openConfirm({
    title: "确认修改密码",
    text: "修改成功后建议重新登录后台,确定继续吗？",
    okText: "确认修改",
    cancelText: "取消",
    type: "info",
    onOk: async () => {
      pwdSaving.value = true
      try {
        const resp = await fetch("/api/admin/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            oldPassword: oldPassword.value,
            newPassword: newPassword.value
          })
        })

        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          flash(data?.message || "修改失败", "err")
          return
        }

        flash("密码已更新 ✅（建议重新登录）", "ok")
        oldPassword.value = ""
        newPassword.value = ""
        confirmPassword.value = ""
      } catch (e) {
        flash("网络错误，修改失败", "err")
      } finally {
        pwdSaving.value = false
      }
    }
  })
}



const modalEl = ref(null)
const confirmEl = ref(null)

watch(() => msg.value, async (v) => {
  if (v) {
    await nextTick()
    // 让 ESC 生效：聚焦到遮罩层
    modalEl.value?.focus?.()
  }
})

let msgTimer = null

function closeMsg() {
  clearTimeout(msgTimer)
  msg.value = ""
}// ===== iOS 确认弹窗（取消/确认）=====
const confirm = ref({
  show: false,
  title: "确认操作",
  text: "",
  okText: "确认",
  cancelText: "取消",
  type: "info", // info | danger
  onOk: null
})

function openConfirm({ title = "确认操作", text = "", okText = "确认", cancelText = "取消", type = "info", onOk = null } = {}) {
  confirm.value = { show: true, title, text, okText, cancelText, type, onOk }
  nextTick(() => confirmEl.value?.focus?.())
}

function confirmCancel() {
  confirm.value.show = false
  confirm.value.onOk = null
}

async function confirmOk() {
  const fn = confirm.value.onOk
  confirm.value.show = false
  confirm.value.onOk = null
  try {
    await (fn && fn())
  } catch (e) {
    console.error(e)
    flash("操作失败，请重试", "err")
  }
}
</script>

<style scoped>
/* ===== Dark mode variables (safe, scoped) ===== */
.theme-root {
  --bg: #ffffff;
  --card: #ffffff;
  --text: #222;
  --muted: #888;
}

.theme-root[data-theme="dark"] {
  --bg: #0f0b10;
  --card: #1a141e;
  --text: #eee;
  --muted: #aaa;
}

/* Apply base colors */
.theme-root {
  background: var(--bg);
  color: var(--text);
}

.theme-root :deep(.card),
.theme-root :deep(.panel),
.theme-root :deep(.box) {
  background: var(--card);
}

/* ===== 后台全局背景：商务白 + 轻粉点缀 ===== */
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fffafc 0%, #ffffff 50%, #fdf7fb 100%);
  color: #333;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 26px 18px 80px;
}

.main {
  display: flex;
  flex-direction: column;
}

/* ===== 顶部 Hero ===== */
.admin-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 18px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(231, 84, 128, 0.14);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.06);
  margin-bottom: 14px;
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(231, 84, 128, 0.16), rgba(150, 123, 182, 0.12));
  border: 1px solid rgba(231, 84, 128, 0.16);
}

.hero-h1 {
  font-size: 20px;
  font-weight: 900;
  color: #222;
}

.hero-sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

/* ===== 统计卡片 ===== */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.stat-card {
  padding: 14px 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  font-weight: 800;
}

.stat-value {
  margin-top: 10px;
  font-size: 22px;
  font-weight: 900;
  color: #d43f6e;
}

/* ===== 卡片 ===== */
.card {
  margin-top: 18px;
  padding: 22px 20px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(231, 84, 128, 0.14);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.06);
}

.card-title {
  margin-bottom: 16px;
}

.card-title.row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.right-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.card-h2 {
  font-size: 18px;
  font-weight: 900;
  color: #222;
}

.card-sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: #d43f6e;
  background: rgba(231, 84, 128, 0.12);
  border: 1px solid rgba(231, 84, 128, 0.22);
}

/* ===== 表单布局 ===== */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.grid-3 {
  grid-template-columns: 1fr 1fr 220px;
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 8px;
}

.search {
  display: flex;
  gap: 10px;
  align-items: center;
}

.actions {
  display: flex;
  flex-direction: column;
}

.actions .btn {
  width: 100%;
}

input,
select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  font-size: 14px;
  outline: none;
  transition: 0.25s;
}

input:focus,
select:focus {
  border-color: rgba(231, 84, 128, 0.55);
  box-shadow: 0 0 0 3px rgba(231, 84, 128, 0.12);
}

/* ===== 当前选中达人信息 ===== */
.current {
  margin-top: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(231, 84, 128, 0.14);
  background: linear-gradient(135deg, rgba(231, 84, 128, 0.06), rgba(150, 123, 182, 0.04));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.current-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(231, 84, 128, 0.12);
  border: 1px solid rgba(231, 84, 128, 0.18);
  color: #d43f6e;
  font-weight: 900;
}

.current-name {
  font-weight: 900;
  color: #222;
}

.current-id {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 2px;
}

.current-right {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pill {
  padding: 10px 12px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
  min-width: 160px;
}

.pill-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  font-weight: 800;
}

.pill-value {
  margin-top: 6px;
  font-weight: 900;
  color: #d43f6e;
}

/* ===== 按钮 ===== */
.btn {
  padding: 11px 16px;
  border-radius: 14px;
  border: none;
  font-weight: 800;
  cursor: pointer;
  transition: 0.25s;
}

.btn-primary {
  background: linear-gradient(135deg, #e75480, #d43f6e);
  color: white;
  box-shadow: 0 10px 25px rgba(231, 84, 128, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(0, 0, 0, 0.06);
  color: #333;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.10);
}

.row-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

/* ===== toast ===== */
.toast {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.toast.ok {
  background: rgba(46, 204, 113, 0.12);
  color: #1b7f47;
  border-color: rgba(46, 204, 113, 0.2);
}

.toast.err {
  background: rgba(255, 70, 70, 0.10);
  color: #b30000;
  border-color: rgba(255, 70, 70, 0.18);
}

/* ===== 表格 ===== */
.table-wrap {
  overflow: auto;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead th {
  text-align: left;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.55);
  background: rgba(231, 84, 128, 0.06);
}

.table tbody td {
  padding: 12px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 14px;
  color: #333;
}

.table tbody tr:hover {
  background: rgba(231, 84, 128, 0.05);
}

.table tbody tr.active {
  background: rgba(231, 84, 128, 0.07);
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(231, 84, 128, 0.10);
  border: 1px solid rgba(231, 84, 128, 0.16);
  font-weight: 900;
  color: #d43f6e;
}

.btn-mini {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(231, 84, 128, 0.25);
  background: rgba(231, 84, 128, 0.10);
  color: #d43f6e;
  cursor: pointer;
  font-weight: 900;
}

.btn-mini:hover {
  background: rgba(231, 84, 128, 0.16);
}

/* ===== 额外奖励配置（后台白底风格统一） ===== */
.extras-admin {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.extras-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.row-title {
  font-weight: 900;
  color: #222;
}

.row-sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.extras-row .right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.75);
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(231, 84, 128, 0.10);
  border: 1px solid rgba(231, 84, 128, 0.18);
  font-weight: 800;
}

.mini-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.10);
  font-size: 12px;
  color: rgba(0, 0, 0, 0.70);
}

.mini-field input {
  width: 110px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

/* ===== 弹窗（深色豪华） ===== */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 50;
}

.modal {
  width: min(520px, 100%);
  border-radius: 22px;
  background: rgba(20, 20, 24, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(14px);
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
}

.modal-title {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(231, 84, 128, 0.35), rgba(150, 123, 182, 0.25), rgba(212, 175, 55, 0.18));
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  font-weight: 900;
}

.modal-body {
  padding: 16px;
}

.modal-body .field label {
  color: rgba(255, 255, 255, 0.75);
}

.modal-body input {
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.92);
  border-color: rgba(255, 255, 255, 0.16);
}

.modal-body input:focus {
  box-shadow: 0 0 0 3px rgba(231, 84, 128, 0.18);
}

.x {
  border: none;
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.full {
  width: 100%;
  margin-top: 12px;
}

.modal-p {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.88);
}

.modal-tip {
  margin: 0 0 14px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.danger-grad {
  background: linear-gradient(135deg, #ff3b6b, #c2185b, #d4af37);
}

/* ===== 响应式 ===== */
@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .admin-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}

.textarea {
  width: 100%;
  resize: vertical;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  outline: none;
  font-size: 14px;
  line-height: 1.5;
  background: #fff;
}

.textarea:focus {
  border-color: rgba(255, 76, 140, 0.55);
  box-shadow: 0 0 0 4px rgba(255, 76, 140, 0.12);
}

/* ===============================
   ✅ 额外奖励配置：Grid 表格对齐版
   =============================== */
.right-grid {
  display: grid;
  grid-template-columns: 96px 1fr 1fr auto;
  align-items: center;
  column-gap: 14px;
  justify-content: end;
}

.right-grid .mini-field {
  display: grid;
  grid-template-columns: auto 96px auto;
  align-items: center;
  gap: 6px;
}

.right-grid input {
  width: 96px !important;
  height: 34px;
  padding: 0 10px;
  border-radius: 12px;
  text-align: center;
}

.right-grid .mini-field span {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .right-grid {
    grid-template-columns: 90px 1fr;
    row-gap: 10px;
    column-gap: 12px;
  }

  .right-grid .mini-field {
    grid-column: span 2;
    grid-template-columns: auto 90px auto;
  }

  .right-grid input {
    width: 90px !important;
  }
}


/* ===============================
   ✅ iOS 风格开关（启用）
   =============================== */
.switch {
  width: 96px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  justify-self: center;
}

.switch-label {
  white-space: nowrap;
  font-weight: 700;
  color: #555;
  letter-spacing: 0.5px;
}

.ios-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 42px;
  height: 24px;
}

.ios-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.ios-slider {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  transition: background 0.18s ease, box-shadow 0.18s ease;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.10);
}

.ios-slider::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  top: 2px;
  background: #fff;
  border-radius: 999px;
  transition: transform 0.18s ease;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
}

.ios-switch input:checked+.ios-slider {
  background: rgba(255, 90, 154, 0.90);
  box-shadow: inset 0 0 0 1px rgba(255, 90, 154, 0.35);
}

.ios-switch input:checked+.ios-slider::before {
  transform: translateX(18px);
}

.ios-switch input:focus-visible+.ios-slider {
  box-shadow: 0 0 0 4px rgba(255, 90, 154, 0.18);
}


/* ===============================
   ✅ 搜索区对齐修正 v2
   =============================== */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grid {
  align-items: end;
}

.search {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search input {
  flex: 1;
  width: 100% !important;
  height: 44px;
  padding: 12px 14px;
  border-radius: 14px;
}

.search .btn {
  width: auto !important;
  min-width: 84px;
  height: 44px;
  padding: 0 16px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.grid select {
  height: 44px;
  padding: 0 12px;
  border-radius: 14px;
}



/* ===== Admin dark overrides (make text & surfaces readable) ===== */
.theme-root[data-theme="dark"] .page {
  background: radial-gradient(900px 460px at 20% 10%, rgba(255, 90, 154, 0.14), transparent 60%),
    radial-gradient(800px 520px at 90% 80%, rgba(138, 107, 209, 0.14), transparent 62%),
    linear-gradient(135deg, var(--bg) 0%, #14101a 100%);
}

.theme-root[data-theme="dark"] .wrap {
  background: transparent;
}

.theme-root[data-theme="dark"] .admin-hero {
  background: rgba(26, 20, 30, 0.80);
  border: 1px solid rgba(255, 90, 154, 0.18);
}

.theme-root[data-theme="dark"] .hero-h1 {
  color: var(--text);
}

.theme-root[data-theme="dark"] .hero-sub {
  color: var(--muted);
}

.theme-root[data-theme="dark"] .stat-card,
.theme-root[data-theme="dark"] .card {
  background: rgba(26, 20, 30, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

.theme-root[data-theme="dark"] .stat-label,
.theme-root[data-theme="dark"] .card-sub {
  color: var(--muted);
}

.theme-root[data-theme="dark"] .card-title,
.theme-root[data-theme="dark"] .card-h2 {
  color: var(--text);
}

.theme-root[data-theme="dark"] input,
.theme-root[data-theme="dark"] select,
.theme-root[data-theme="dark"] textarea {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  color: var(--text) !important;
}

.theme-root[data-theme="dark"] input::placeholder,
.theme-root[data-theme="dark"] textarea::placeholder {
  color: rgba(255, 255, 255, 0.45) !important;
}

.theme-root[data-theme="dark"] .search,
.theme-root[data-theme="dark"] .current {
  color: rgba(255, 255, 255, 0.82);
}

.theme-root[data-theme="dark"] .badge {
  background: rgba(255, 90, 154, 0.14);
  color: rgba(255, 255, 255, 0.86);
  border-color: rgba(255, 90, 154, 0.18);
}

.theme-root[data-theme="dark"] .actions .btn,
.theme-root[data-theme="dark"] .right-actions .btn {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.88);
}

.theme-toggle-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(231, 84, 128, 0.18);
  background: rgba(255, 255, 255, 0.6);
  display: grid;
  place-items: center;
  cursor: pointer;
  margin-right: 10px;
}

.theme-root[data-theme="dark"] .theme-toggle-btn {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.10);
}

.theme-toggle-btn:active {
  transform: translateY(1px);
}

/* ===== 修改密码（后台） ===== */
.pwd-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 900px) {
  .pwd-grid {
    grid-template-columns: 1fr;
  }
}

.pwd-field label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
  opacity: .75;
}

.pwd-input {
  position: relative;
}

.pwd-input input {
  width: 100%;
  padding: 12px 44px 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, .08);
  background: rgba(255, 255, 255, .75);
  outline: none;
}

.theme-root[data-theme="dark"] .pwd-input input {
  background: rgba(255, 255, 255, .06);
  border-color: rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .92);
}

.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, .08);
  background: rgba(255, 255, 255, .70);
  cursor: pointer;
}

.theme-root[data-theme="dark"] .eye-btn {
  background: rgba(255, 255, 255, .08);
  border-color: rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .92);
}

.pwd-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: flex-end;
}

.pwd-ok {
  font-weight: 800;
  color: #067647;
}

.pwd-err {
  font-weight: 800;
  color: #b42318;
}


/* ===== iOS 风格提示弹窗（居中） ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, .30);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  outline: none;
}

.ios-modal {
  width: min(420px, 100%);
  border-radius: 22px;
  padding: 18px 18px 16px;
  background: rgba(255, 255, 255, .86);
  border: 1px solid rgba(255, 255, 255, .55);
  box-shadow: 0 22px 55px rgba(0, 0, 0, .22);
  text-align: center;
  animation: iosPop .18s ease-out;
}

.theme-root[data-theme="dark"] .ios-modal {
  background: rgba(20, 20, 22, .78);
  border-color: rgba(255, 255, 255, .10);
  box-shadow: 0 22px 55px rgba(0, 0, 0, .45);
}

.ios-modal__icon {
  width: 44px;
  height: 44px;
  margin: 2px auto 8px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(0, 0, 0, .04);
}

.theme-root[data-theme="dark"] .ios-modal__icon {
  background: rgba(255, 255, 255, .06);
}

.ios-modal__title {
  font-weight: 900;
  font-size: 16px;
  letter-spacing: .2px;
  margin-bottom: 6px;
}

.ios-modal__text {
  font-size: 14px;
  line-height: 1.65;
  opacity: .88;
  white-space: pre-wrap;
}

.ios-modal__actions {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.ios-modal__btn {
  min-width: 140px;
  border-radius: 999px;
  box-shadow: 0 10px 26px rgba(229, 72, 77, .30);
  transform: translateZ(0);
}

.ios-modal__btn:active {
  transform: translateY(1px);
  box-shadow: 0 8px 18px rgba(229, 72, 77, .24);
}

.ios-modal.ok .ios-modal__title {
  color: #067647;
}

.ios-modal.err .ios-modal__title {
  color: #b42318;
}

@keyframes iosPop {
  from {
    transform: translateY(10px) scale(.98);
    opacity: 0;
  }

  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}


/* ===== iOS 确认弹窗（取消 / 确认）===== */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, .32);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  outline: none;
}

.confirm-card {
  width: min(420px, 100%);
  border-radius: 22px;
  padding: 18px 18px 16px;
  background: rgba(255, 255, 255, .90);
  border: 1px solid rgba(255, 255, 255, .55);
  box-shadow: 0 22px 55px rgba(0, 0, 0, .22);
  text-align: center;
  animation: iosPop .18s ease-out;
}

.theme-root[data-theme="dark"] .confirm-card,
:root.dark .confirm-card {
  background: rgba(20, 20, 22, .78);
  border-color: rgba(255, 255, 255, .10);
  box-shadow: 0 22px 55px rgba(0, 0, 0, .45);
}

.confirm-icon {
  width: 44px;
  height: 44px;
  margin: 2px auto 8px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(0, 0, 0, .04);
}

.theme-root[data-theme="dark"] .confirm-icon,
:root.dark .confirm-icon {
  background: rgba(255, 255, 255, .06);
}

.confirm-title {
  font-weight: 900;
  font-size: 16px;
  letter-spacing: .2px;
  margin-bottom: 6px;
}

.confirm-text {
  font-size: 14px;
  line-height: 1.65;
  opacity: .88;
  white-space: pre-wrap;
}

.confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}

.confirm-btn {
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, .06);
  background: rgba(255, 255, 255, .72);
  font-weight: 800;
  cursor: pointer;
}

.confirm-btn.cancel {
  background: rgba(0, 0, 0, .04);
}

.confirm-btn.ok {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #ff4d6d, #ff2d55, #ff8a5b);
  box-shadow: 0 10px 26px rgba(255, 45, 85, .28);
}

.confirm-btn.ok.danger {
  background: linear-gradient(135deg, #ff3b30, #ff2d55);
  box-shadow: 0 10px 26px rgba(255, 59, 48, .26);
}

.confirm-btn:active {
  transform: translateY(1px);
}

/* 顶部右上角：主题切换；左侧：退出登录 */
.hero-actions{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 520px;
}
.hero-actions-left{ display:flex; align-items:center; gap:10px; }
.hero-actions-right{ display:flex; align-items:center; justify-content:flex-end; }
.theme-toggle-btn.top-right{
  width: 40px;
  height: 40px;
  border-radius: 14px;
}
@media (max-width: 720px){
  .hero-actions{ max-width: none; width: auto; }
}

/* Header 右上角紧凑布局（靠右） */
.hero-actions-right.compact {
  display: flex;
  align-items: center;
  gap: 8px;

  /* 👇 关键：整体顶到最右侧 */
  margin-left: auto;
}

.theme-toggle-btn.inline {
  width: 36px;
  height: 36px;
  border-radius: 999px;
}

.logout-inline {
  padding: 6px 14px;
  border-radius: 14px;
}



/* iOS 弹性动画：主题切换按钮（scale + fade） */
.theme-toggle-btn.bounce{
  animation: themeBounce .42s cubic-bezier(.2,.9,.2,1);
}
@keyframes themeBounce{
  0%{ transform: scale(1); opacity: 1; }
  35%{ transform: scale(.88); opacity: .72; }
  70%{ transform: scale(1.06); opacity: 1; }
  100%{ transform: scale(1); opacity: 1; }
}
</style>
