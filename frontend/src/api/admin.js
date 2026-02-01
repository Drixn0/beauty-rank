import axios from "axios"
import { useAuthStore } from "@/store/auth"

const request = axios.create({
  baseURL: "/api",
  timeout: 5000
})

request.interceptors.request.use((config) => {
  const store = useAuthStore()
  if (store.token) {
    config.headers.Authorization = "Bearer " + store.token
  }
  return config
})

export function adminLogin(data) {
  return request.post("/admin/login", data)
}

export function updateUser(data) {
  return request.post("/admin/user/update", data)
}

export function getUsers() {
  return request.get("/admin/users")
}

export function createUser(data) {
  return request.post("/admin/users", data)
}

export function deleteUser(id) {
  return request.delete(`/admin/users/${id}`)
}

export function getPrizeConfig() {
  return request.get("/admin/config/prizes")
}

export function updatePrizeConfig(data) {
  return request.put("/admin/config/prizes", data)
}

export function getExtraRewards() {
  return request.get("/admin/config/extras")
}

export function saveExtraRewards(data) {
  return request.put("/admin/config/extras", data)
}

/* ✅ 规则页正文（纯文本） */
export function getRulesText() {
  return request.get("/admin/config/rules")
}

export function saveRulesText(rulesText) {
  return request.put("/admin/config/rules", { rulesText })
}

// ✅ 追加到 src/api/admin.js（前端 axios）里
export function getRulesSections() {
  return request.get("/admin/config/rules-sections")
}

export function saveRulesSections(rulesSections) {
  return request.put("/admin/config/rules-sections", { rulesSections })
}