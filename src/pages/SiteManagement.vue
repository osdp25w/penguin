<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">場域管理</h1>
        <p class="mt-1 text-sm text-gray-700">建立、編輯、刪除場域，並支援分頁</p>
      </div>
      <Button variant="primary" size="sm" @click="openCreate">新增場域</Button>
    </div>

    <div class="card">
        <div class="p-4 flex items-center gap-3">
          <label for="site-keyword" class="sr-only">搜尋場域名稱</label>
          <input id="site-keyword" name="keyword" v-model.trim="keyword" type="text" placeholder="搜尋場域名稱" class="input-base w-64" @input="applyFilter" />
        </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">名稱</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">緯度</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">經度</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="s in rows" :key="s.id">
              <td class="px-4 py-3 text-sm text-gray-900">{{ s.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ s.lat?.toFixed(6) }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ s.lon?.toFixed(6) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <Button variant="outline" size="xs" @click="openEdit(s)">編輯</Button>
                  <Button variant="ghost" size="xs" class="text-red-600" @click="remove(s)">刪除</Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!rows.length" class="text-center py-8 text-gray-600">目前沒有資料</div>
      </div>
    </div>

    <PaginationBar
      v-if="paging.total.value > 0"
      :current-page="paging.currentPage.value"
      :total-pages="paging.totalPages.value"
      :total="paging.total.value"
      :limit="paging.limit.value"
      :offset="paging.offset.value"
      :page-range="paging.pageRange.value"
      :has-next-page="paging.hasNextPage.value"
      :has-prev-page="paging.hasPrevPage.value"
      @page-change="paging.goToPage"
      @limit-change="paging.changeLimit"
      @prev="paging.prevPage"
      @next="paging.nextPage"
    />

    <!-- Drawer / Modal for Create/Edit -->
    <div v-if="showForm" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeForm"></div>
      <div class="absolute right-0 top-0 bottom-0 w-full sm:w-[28rem] bg-white shadow-xl">
        <div class="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">{{ editing ? '編輯場域' : '新增場域' }}</h3>
          <Button variant="ghost" size="sm" @click="closeForm"><i class="i-ph-x w-4 h-4" /></Button>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label for="sm-name" class="block text-sm font-medium text-gray-700 mb-1">名稱</label>
            <input id="sm-name" name="name" v-model.trim="form.name" class="input-base w-full" />
            <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="sm-lat" class="block text-sm font-medium text-gray-700 mb-1">緯度</label>
              <input id="sm-lat" name="lat" v-model.number="form.lat" type="number" step="0.000001" class="input-base w-full" />
              <p v-if="errors.lat" class="text-xs text-red-600 mt-1">{{ errors.lat }}</p>
            </div>
            <div>
              <label for="sm-lon" class="block text-sm font-medium text-gray-700 mb-1">經度</label>
              <input id="sm-lon" name="lon" v-model.number="form.lon" type="number" step="0.000001" class="input-base w-full" />
              <p v-if="errors.lon" class="text-xs text-red-600 mt-1">{{ errors.lon }}</p>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
          <Button variant="outline" @click="closeForm">取消</Button>
          <Button variant="primary" :disabled="submitting" @click="save">{{ submitting ? '儲存中...' : '儲存' }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { Button } from '@/design/components'
import PaginationBar from '@/components/PaginationBar.vue'
import { useSites } from '@/stores/sites'
import { usePaging } from '@/composables/usePaging'

// 全局錯誤捕獲
onErrorCaptured((err, instance, info) => {
  console.error('[SiteManagement] Component error captured:', {
    error: err,
    instance,
    info,
    stack: err.stack
  })
  return false // 不阻止錯誤傳播
})

const sites = useSites()
const keyword = ref('')

const paging = usePaging({
  fetcher: async ({ limit, offset }) => {
    return await sites.fetchSitesPaged({ limit, offset, keyword: keyword.value })
  },
  syncToUrl: true,
  queryPrefix: 'sites'
})

const rows = computed(() => paging.data.value)

function applyFilter() {
  paging.resetToFirstPage()
  paging.refresh()
}

// Form state
const showForm = ref(false)
const editing = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const form = ref<{ name: string; lat: number | null; lon: number | null }>({ name: '', lat: null, lon: null })
const errors = ref<{ name?: string; lat?: string; lon?: string }>({})

function openCreate() {
  editing.value = false
  editingId.value = null
  form.value = { name: '', lat: null, lon: null }
  errors.value = {}
  showForm.value = true
}

function openEdit(s: any) {
  editing.value = true
  editingId.value = s.id
  form.value = { name: s.name, lat: s.lat ?? null, lon: s.lon ?? null }
  errors.value = {}
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

function validate(): boolean {
  errors.value = {}
  let ok = true
  if (!form.value.name) { errors.value.name = '請輸入名稱'; ok = false }
  const lat = Number(form.value.lat)
  if (Number.isNaN(lat) || lat < -90 || lat > 90) { errors.value.lat = '緯度需在 -90 ~ 90'; ok = false }
  const lon = Number(form.value.lon)
  if (Number.isNaN(lon) || lon < -180 || lon > 180) { errors.value.lon = '經度需在 -180 ~ 180'; ok = false }
  return ok
}

async function save() {
  if (!validate()) return
  submitting.value = true
  try {
    if (editing.value && editingId.value) {
      await sites.updateSite(editingId.value, { name: form.value.name, lat: Number(form.value.lat), lon: Number(form.value.lon) } as any)
    } else {
      await sites.createSite({ name: form.value.name, lat: Number(form.value.lat), lon: Number(form.value.lon) })
    }
    showForm.value = false
    await paging.refresh()
  } finally {
    submitting.value = false
  }
}

async function remove(s: any) {
  // TODO: 後端若阻擋刪除（關聯車輛），在此顯示提示
  await sites.deleteSite(s.id)
  await paging.refresh()
}

// 初始載入資料
onMounted(async () => {
  console.log('[SiteManagement] Component mounted, starting initialization...')

  try {
    console.log('[SiteManagement] Starting pagination refresh with keyword:', keyword.value)
    await paging.refresh({ keyword: keyword.value })

    console.log('[SiteManagement] Pagination data loaded:', {
      dataLength: paging.data.value.length,
      total: paging.total.value,
      loading: paging.loading.value
    })
  } catch (error) {
    console.error('[SiteManagement] Error during initialization:', error)
  }
})
</script>

<style scoped>
.input-base { @apply px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400; }
.card { @apply bg-white rounded-lg border border-gray-200 shadow-sm; }
</style>
