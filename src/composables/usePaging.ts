// src/composables/usePaging.ts
// 通用分頁管理 composable

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface PagingOptions<T = any> {
  /** 初始每頁筆數 */
  initialLimit?: number
  /** 初始偏移量 */
  initialOffset?: number
  /** 資料獲取函數 */
  fetcher: (params: { limit: number; offset: number; [key: string]: any }) => Promise<{
    data: T[]
    total: number
  }>
  /** 是否自動同步到 URL query */
  syncToUrl?: boolean
  /** URL query 參數前綴 */
  queryPrefix?: string
}

export function usePaging<T = any>(options: PagingOptions<T>) {
  const route = useRoute()
  const router = useRouter()

  const {
    initialLimit = 20,
    initialOffset = 0,
    fetcher,
    syncToUrl = true,
    queryPrefix = ''
  } = options

  // 從 URL query 讀取初始值
  const getInitialValue = (key: string, defaultValue: number) => {
    if (!syncToUrl) return defaultValue
    const queryKey = queryPrefix ? `${queryPrefix}_${key}` : key
    const value = route.query[queryKey]
    return value ? parseInt(String(value), 10) || defaultValue : defaultValue
  }

  // 狀態
  const limit = ref(getInitialValue('limit', initialLimit))
  const offset = ref(getInitialValue('offset', initialOffset))
  const total = ref(0)
  const data = ref<T[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1)
  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  // 頁碼範圍（顯示分頁按鈕用）
  const pageRange = computed(() => {
    const current = currentPage.value
    const totalP = totalPages.value
    const range: number[] = []

    if (totalP <= 7) {
      // 總頁數少於等於7，顯示所有頁碼
      for (let i = 1; i <= totalP; i++) {
        range.push(i)
      }
    } else {
      // 總頁數大於7，顯示省略號邏輯
      if (current <= 4) {
        // 當前頁在前4頁
        range.push(1, 2, 3, 4, 5, -1, totalP) // -1 表示省略號
      } else if (current >= totalP - 3) {
        // 當前頁在後4頁
        range.push(1, -1, totalP - 4, totalP - 3, totalP - 2, totalP - 1, totalP)
      } else {
        // 當前頁在中間
        range.push(1, -1, current - 1, current, current + 1, -1, totalP)
      }
    }

    return range
  })

  // 更新 URL query
  const updateUrl = () => {
    if (!syncToUrl) return

    const query = { ...route.query }
    const limitKey = queryPrefix ? `${queryPrefix}_limit` : 'limit'
    const offsetKey = queryPrefix ? `${queryPrefix}_offset` : 'offset'

    if (limit.value !== initialLimit) {
      query[limitKey] = String(limit.value)
    } else {
      delete query[limitKey]
    }

    if (offset.value !== initialOffset) {
      query[offsetKey] = String(offset.value)
    } else {
      delete query[offsetKey]
    }

    router.replace({ query })
  }

  // 載入資料
  const loadData = async (additionalParams: Record<string, any> = {}) => {
    loading.value = true
    error.value = null

    try {
      const result = await fetcher({
        limit: limit.value,
        offset: offset.value,
        ...additionalParams
      })

      data.value = result.data
      total.value = result.total
    } catch (err: any) {
      error.value = err.message || '載入資料失敗'
      data.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  // 跳到指定頁碼
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return

    const newOffset = (page - 1) * limit.value
    offset.value = newOffset
    updateUrl()
  }

  // 上一頁
  const prevPage = () => {
    if (hasPrevPage.value) {
      goToPage(currentPage.value - 1)
    }
  }

  // 下一頁
  const nextPage = () => {
    if (hasNextPage.value) {
      goToPage(currentPage.value + 1)
    }
  }

  // 修改每頁筆數
  const changeLimit = (newLimit: number) => {
    // 保持當前顯示資料的大約位置
    const currentItemIndex = offset.value

    limit.value = newLimit
    offset.value = Math.floor(currentItemIndex / newLimit) * newLimit
    updateUrl()
  }

  // 重置到第一頁
  const resetToFirstPage = () => {
    offset.value = 0
    updateUrl()
  }

  // 監聽分頁參數變化，自動載入資料
  let additionalParams = {}

  const refresh = (params: Record<string, any> = {}) => {
    additionalParams = params
    return loadData(params)
  }

  // 監聽 limit 和 offset 變化
  watch([limit, offset], () => {
    loadData(additionalParams)
  })

  return {
    // 狀態
    limit,
    offset,
    total,
    data,
    loading,
    error,

    // 計算屬性
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    pageRange,

    // 方法
    loadData,
    refresh,
    goToPage,
    prevPage,
    nextPage,
    changeLimit,
    resetToFirstPage,
    updateUrl
  }
}