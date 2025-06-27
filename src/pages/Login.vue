<!-- src/pages/Login.vue -->
<template>
  <!-- 整頁置中背景 ---------------------------------------------------- -->
  <div class="min-h-screen grid place-content-center bg-brand-500/5 px-4">

    <!-- 登入卡片 ------------------------------------------------------ -->
    <form
      class="w-[20rem] max-w-full space-y-8 rounded-2xl border border-black/10
             bg-white/60 backdrop-blur-xl shadow-lg shadow-black/20 p-8"
      @submit.prevent="submit"
    >
      <!-- 標題 -------------------------------------------------------- -->
      <h1 class="text-xl font-extrabold text-center text-slate-800 tracking-wide">
        使用者登入
      </h1>

      <!-- 帳號 / 密碼 -------------------------------------------------- -->
      <div class="space-y-5">
        <input
          v-model.trim="email"
          type="email"
          placeholder="Email"
          autocomplete="off"
          class="w-64 max-w-full px-4 py-2 rounded-md border border-black/15
                 bg-white text-slate-800 placeholder:text-slate-400
                 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <input
          v-model.trim="password"
          type="password"
          placeholder="Password"
          autocomplete="off"
          class="w-64 max-w-full px-4 py-2 rounded-md border border-black/15
                 bg-white text-slate-800 placeholder:text-slate-400
                 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <!-- 登入按鈕 ---------------------------------------------------- -->
      <button
        :disabled="loading"
        class="w-full rounded-md bg-indigo-500 py-2 text-white font-medium
               hover:bg-indigo-400 transition-colors disabled:opacity-60
               disabled:cursor-not-allowed"
      >
        <span v-if="loading" class="i-ph:spinner-gap-duotone animate-spin text-lg" />
        <span v-else class="opacity-90">登入</span>
      </button>

      <!-- 錯誤訊息 ---------------------------------------------------- -->
      <p v-if="auth.err" class="break-all text-center text-sm text-rose-500">
        {{ auth.err }}
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'

/* 表單狀態 ---------------------------------------------------------- */
const email    = ref('')
const password = ref('')
const loading  = ref(false)

/* Store / Router ---------------------------------------------------- */
const auth   = useAuth()
const router = useRouter()
const route  = useRoute()

/* 提交 -------------------------------------------------------------- */
async function submit () {
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.replace((route.query.redirect as string) || '/')
  } finally {
    loading.value = false
  }
}
</script>
