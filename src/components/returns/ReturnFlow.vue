<template>
  <!-- 歸還表單對話框 -->
  <ReturnModal
    v-if="showReturnModal"
    :prefilled-site-id="prefilledSiteId"
    @close="handleCloseReturnModal"
    @request-confirm="handleRequestConfirm"
  />

  <!-- 確認歸還對話框 -->
  <ReturnConfirmDialog
    :show="showConfirmDialog"
    :return-data="pendingReturnData"
    @close="handleCloseConfirmDialog"
    @confirm="handleConfirmReturn"
  />

  <!-- 歸還成功對話框 -->
  <ReturnSuccessDialog
    :show="showSuccessDialog"
    :return-record="returnRecord"
    @close="handleCloseSuccessDialog"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ReturnModal from './ReturnModal.vue'
import ReturnConfirmDialog from './ReturnConfirmDialog.vue'
import ReturnSuccessDialog from './ReturnSuccessDialog.vue'
import { useReturns } from '@/stores/returns'
import type { ReturnRecord } from '@/stores/returns'

interface Props {
  show: boolean
  prefilledSiteId?: string
}

interface Emits {
  close: []
  success: [returnRecord: ReturnRecord]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const returnsStore = useReturns()

// 對話框狀態
const showReturnModal = ref(false)
const showConfirmDialog = ref(false)
const showSuccessDialog = ref(false)

// 資料狀態
const pendingReturnData = ref<any>(null)
const returnRecord = ref<ReturnRecord | null>(null)

// 監聽外部 show 屬性變化
watch(() => props.show, (newShow) => {
  if (newShow) {
    showReturnModal.value = true
  } else {
    handleCloseAll()
  }
})

// 方法
function handleCloseReturnModal() {
  showReturnModal.value = false
  emit('close')
}

function handleRequestConfirm(returnData: any) {
  pendingReturnData.value = returnData
  showReturnModal.value = false
  showConfirmDialog.value = true
}

function handleCloseConfirmDialog() {
  showConfirmDialog.value = false
  showReturnModal.value = true  // 回到表單
}

async function handleConfirmReturn(returnData: any) {
  try {
    const record = await returnsStore.confirmReturnVehicle(returnData)
    returnRecord.value = record
    
    showConfirmDialog.value = false
    showSuccessDialog.value = true
    
    emit('success', record)
  } catch (error) {
    console.error('歸還失敗:', error)
    // TODO: 顯示錯誤提示
    showConfirmDialog.value = false
    showReturnModal.value = true  // 回到表單
  }
}

function handleCloseSuccessDialog() {
  showSuccessDialog.value = false
  emit('close')
}

function handleCloseAll() {
  showReturnModal.value = false
  showConfirmDialog.value = false
  showSuccessDialog.value = false
  pendingReturnData.value = null
  returnRecord.value = null
}
</script>