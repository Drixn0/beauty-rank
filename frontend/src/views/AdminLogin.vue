<template>
  <div class="login-page" :data-theme="theme">
    <div class="decor decor-1">👑</div>
    <div class="decor decor-2">💎</div>
    <div class="decor decor-3">⭐️</div>

    <div class="login-card" :class="{ shake: shakeIt }">
      <div class="card-topbar" />

      <button class="theme-toggle" type="button" @click="toggleTheme" :aria-label="theme === 'dark' ? '切换浅色' : '切换深色'">
        <span v-if="theme === 'dark'">☀️</span>
        <span v-else>🌙</span>
      </button>

      <div class="login-icon">🔒</div>
      <div class="login-title">数据管理后台</div>
      <div class="login-subtitle">仅限公司内部人员访问</div>

      <form class="form" @submit.prevent="doLogin">
        <label class="label">账号</label>
        <input
          v-model.trim="username"
          class="input"
          autocomplete="username"
          placeholder="请输入管理员账号"
        />

        <label class="label">密码</label>
        <div class="input-wrap">
          <input
            v-model.trim="password"
            class="input"
            :type="showPwd ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="请输入管理员密码"
          />
          <button
            class="eye-btn"
            type="button"
            @click="showPwd = !showPwd"
            :aria-label="showPwd ? '隐藏密码' : '显示密码'"
            :title="showPwd ? '隐藏密码' : '显示密码'"
          >
            {{ showPwd ? "🙈" : "👁" }}
          </button>
        </div>

        <button class="btn-primary" type="submit" :disabled="loading">
          <span class="btn-icon">↪︎</span>
          <span>{{ loading ? "登录中…" : "登录后台" }}</span>
        </button>
      </form>

      <div class="hint">
        <span class="hint-dot">i</span>
        <span>默认账号及密码功能已关闭，请牢记管理密码！</span>
      </div>

      <div v-if="err" class="error">{{ err }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"
import { useAuthStore } from "@/store/auth"

const router = useRouter()
const authStore = useAuthStore()

const username = ref("admin")
const password = ref("")
const showPwd = ref(false)
const loading = ref(false)
const err = ref("")
const shakeIt = ref(false)

// 主题：light / dark / system（默认 system 但这里用 light/dark 两态按钮更直观）
const theme = ref("light")
const THEME_KEY = "admin_theme"

function applySystemThemeIfNoSaved() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === "light" || saved === "dark") {
    theme.value = saved
    return
  }
  const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  theme.value = isDark ? "dark" : "light"
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark"
  localStorage.setItem(THEME_KEY, theme.value)
}

function triggerShake() {
  shakeIt.value = false
  // 让 class 重新生效
  nextTick(() => {
    shakeIt.value = true
    window.setTimeout(() => (shakeIt.value = false), 520)
  })
}

async function doLogin() {
  err.value = ""
  if (!username.value || !password.value) {
    err.value = "请输入账号和密码"
    triggerShake()
    return
  }

  loading.value = true
  try {
    const { data } = await axios.post("/api/admin/login", {
      username: username.value,
      password: password.value
    })

    const token = data?.token
    if (!token) throw new Error("未获取到 token")

    authStore.setToken(token)
    router.push("/admin/dashboard")
  } catch (e) {
    err.value = "账号或密码错误"
    triggerShake()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  applySystemThemeIfNoSaved()
})
</script>

<style scoped>
/* ===============================
   主题变量（与后台整体粉金渐变统一）
   =============================== */
.login-page{
  --rose: #ff5a9a;
  --lavender: #8a6bd1;
  --gold: #d4af37;
  --grad: linear-gradient(135deg, var(--rose), var(--lavender), var(--gold));

  --bg0: #fff7f9;
  --bg1: #ffffff;

  --card: rgba(255,255,255,0.92);
  --card-border: rgba(255, 90, 154, 0.14);
  --shadow: rgba(255, 90, 154, 0.18);

  --text: #3b3b3b;
  --muted: #8b8b8b;
  --field: rgba(255, 90, 154, 0.06);
  --field-border: rgba(255, 90, 154, 0.16);
  --danger: #b42318;
  --danger-bg: rgba(180, 35, 24, 0.08);
  --danger-border: rgba(180, 35, 24, 0.16);
}

.login-page[data-theme="dark"]{
  --bg0: #0f0b10;
  --bg1: #121016;

  --card: rgba(26, 20, 30, 0.88);
  --card-border: rgba(255, 90, 154, 0.18);
  --shadow: rgba(0, 0, 0, 0.55);

  --text: rgba(255,255,255,0.90);
  --muted: rgba(255,255,255,0.62);
  --field: rgba(255, 90, 154, 0.10);
  --field-border: rgba(255, 90, 154, 0.22);
  --danger: #ffb4aa;
  --danger-bg: rgba(255, 83, 83, 0.12);
  --danger-border: rgba(255, 83, 83, 0.24);
}

/* ===============================
   布局 & 背景
   =============================== */
.login-page{
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 18px;
  background: radial-gradient(900px 460px at 20% 10%, rgba(255, 90, 154, 0.18), transparent 60%),
              radial-gradient(800px 520px at 90% 80%, rgba(138, 107, 209, 0.18), transparent 62%),
              linear-gradient(135deg, var(--bg0) 0%, var(--bg1) 100%);
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei",
    "Helvetica Neue", Arial, sans-serif;
  color: var(--text);
}

.decor{
  position: fixed;
  z-index: 0;
  opacity: 0.07;
  font-size: 120px;
  user-select: none;
  pointer-events: none;
  filter: blur(0.2px);
}
.decor-1{ top: 6%; left: 6%; transform: rotate(14deg); }
.decor-2{ bottom: 14%; right: 6%; transform: rotate(-12deg); font-size: 112px; }
.decor-3{ top: 18%; right: 12%; transform: rotate(22deg); font-size: 96px; }

/* ===============================
   卡片
   =============================== */
.login-card{
  width: min(420px, 100%);
  background: var(--card);
  border-radius: 34px;
  padding: 34px 30px 26px;
  box-shadow: 0 26px 70px var(--shadow);
  border: 1px solid var(--card-border);
  position: relative;
  z-index: 1;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.card-topbar{
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 5px;
  background: var(--grad);
}

/* 深色下让顶条更亮一点 */
.login-page[data-theme="dark"] .card-topbar{
  filter: brightness(1.06);
}

.theme-toggle{
  position: absolute;
  top: 14px;
  right: 14px;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(255, 90, 154, 0.18);
  background: rgba(255, 255, 255, 0.55);
  color: var(--text);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.2s ease;
}
.login-page[data-theme="dark"] .theme-toggle{
  background: rgba(0,0,0,0.22);
}
.theme-toggle:active{ transform: translateY(1px); }

/* ===============================
   顶部 icon & 文案
   =============================== */
.login-icon{
  width: 84px;
  height: 84px;
  border-radius: 999px;
  background: var(--grad);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  font-size: 34px;
  color: #fff;
  box-shadow: 0 14px 34px rgba(255, 90, 154, 0.25);
}

.login-title{
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.login-subtitle{
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 22px;
}

/* ===============================
   表单
   =============================== */
.form{
  display: grid;
  gap: 10px;
}

.label{
  font-size: 13px;
  color: var(--muted);
  font-weight: 700;
  margin-top: 6px;
}

.input{
  width: 100%;
  padding: 16px 16px;
  border-radius: 18px;
  background: var(--field);
  border: 2px solid var(--field-border);
  color: var(--text);
  font-size: 15px;
  outline: none;
  transition: 0.2s ease;
}

.input:focus{
  background: rgba(255,255,255,0.80);
  border-color: rgba(255, 90, 154, 0.52);
  box-shadow: 0 0 0 4px rgba(255, 90, 154, 0.14);
}
.login-page[data-theme="dark"] .input:focus{
  background: rgba(10,10,12,0.35);
}

.input-wrap{
  position: relative;
}

.eye-btn{
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 90, 154, 0.16);
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 16px;
  transition: transform 0.12s ease, background 0.2s ease;
}
.login-page[data-theme="dark"] .eye-btn{
  background: rgba(0,0,0,0.22);
}
.eye-btn:active{
  transform: translateY(-50%) scale(0.98);
}

/* ===============================
   按钮
   =============================== */
.btn-primary{
  margin-top: 10px;
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 15px 16px;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  background: var(--grad);
  box-shadow: 0 14px 30px rgba(255, 90, 154, 0.22);
  transition: transform 0.12s ease, filter 0.2s ease, opacity 0.2s ease;
}

.btn-primary:active{
  transform: translateY(2px);
  filter: brightness(0.98);
}
.btn-primary:disabled{
  opacity: 0.72;
  cursor: not-allowed;
}

.btn-icon{
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-weight: 900;
}

/* ===============================
   提示 & 错误
   =============================== */
.hint{
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 90, 154, 0.14);
  color: var(--muted);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.hint-dot{
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(255, 90, 154, 0.16);
  color: var(--rose);
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
}

.error{
  margin-top: 14px;
  text-align: center;
  color: var(--danger);
  font-weight: 800;
  font-size: 13px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  padding: 10px 12px;
  border-radius: 14px;
}

/* ===============================
   登录失败抖动动画
   =============================== */
.shake{
  animation: shake 0.5s ease;
}
@keyframes shake{
  0%{ transform: translateX(0); }
  12%{ transform: translateX(-10px); }
  25%{ transform: translateX(10px); }
  38%{ transform: translateX(-8px); }
  52%{ transform: translateX(8px); }
  68%{ transform: translateX(-6px); }
  82%{ transform: translateX(6px); }
  100%{ transform: translateX(0); }
}

/* 小屏适配 */
@media (max-width: 420px){
  .login-card{
    padding: 30px 22px 22px;
    border-radius: 28px;
  }
  .login-title{ font-size: 24px; }
}
</style>
