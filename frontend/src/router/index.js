import { createRouter, createWebHistory } from "vue-router"
import Rank from "@/views/Rank.vue"
import AdminLogin from "@/views/AdminLogin.vue"
import AdminDashboard from "@/views/AdminDashboard.vue"

import { useAuthStore } from "@/store/auth"

const routes = [
  { path: "/", component: Rank },

  { path: "/admin/login", component: AdminLogin },

  {
    path: "/admin/dashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const store = useAuthStore()

  if (to.meta.requiresAuth && !store.token) {
    next("/admin/login")
  } else {
    next()
  }
})

export default router
