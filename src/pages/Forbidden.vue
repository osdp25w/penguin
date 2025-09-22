<template>
  <div class="grid h-[70vh] place-content-center text-center">
    <div class="text-4xl font-extrabold text-rose-600">403</div>
    <p class="mt-2 text-lg text-gray-800">Forbidden</p>
    <p class="mt-1 text-gray-500">您沒有權限存取此頁面</p>
    <router-link :to="redirectPath" class="mt-6 inline-block rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
      {{ redirectText }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/stores/auth'

const auth = useAuth()

const redirectPath = computed(() => {
  const role = auth.user?.roleId
  if (role === 'member' || role === 'visitor' || role === 'tourist') {
    return '/sites'
  }
  return '/'
})

const redirectText = computed(() => {
  const role = auth.user?.roleId
  if (role === 'member' || role === 'visitor' || role === 'tourist') {
    return '回到場域地圖'
  }
  return '回到首頁'
})
</script>

