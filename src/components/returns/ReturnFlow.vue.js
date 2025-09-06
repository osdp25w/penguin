import { ref, watch } from 'vue';
import ReturnModal from './ReturnModal.vue';
import ReturnConfirmDialog from './ReturnConfirmDialog.vue';
import ReturnSuccessDialog from './ReturnSuccessDialog.vue';
import { useReturns } from '@/stores/returns';
const props = defineProps();
const emit = defineEmits();
const returnsStore = useReturns();
// 對話框狀態
const showReturnModal = ref(false);
const showConfirmDialog = ref(false);
const showSuccessDialog = ref(false);
// 資料狀態
const pendingReturnData = ref(null);
const returnRecord = ref(null);
// 監聽外部 show 屬性變化
watch(() => props.show, (newShow) => {
    if (newShow) {
        showReturnModal.value = true;
    }
    else {
        handleCloseAll();
    }
});
// 方法
function handleCloseReturnModal() {
    showReturnModal.value = false;
    emit('close');
}
function handleRequestConfirm(returnData) {
    pendingReturnData.value = returnData;
    showReturnModal.value = false;
    showConfirmDialog.value = true;
}
function handleCloseConfirmDialog() {
    showConfirmDialog.value = false;
    showReturnModal.value = true; // 回到表單
}
async function handleConfirmReturn(returnData) {
    try {
        const record = await returnsStore.confirmReturnVehicle(returnData);
        returnRecord.value = record;
        showConfirmDialog.value = false;
        showSuccessDialog.value = true;
        emit('success', record);
    }
    catch (error) {
        console.error('歸還失敗:', error);
        // TODO: 顯示錯誤提示
        showConfirmDialog.value = false;
        showReturnModal.value = true; // 回到表單
    }
}
function handleCloseSuccessDialog() {
    showSuccessDialog.value = false;
    emit('close');
}
function handleCloseAll() {
    showReturnModal.value = false;
    showConfirmDialog.value = false;
    showSuccessDialog.value = false;
    pendingReturnData.value = null;
    returnRecord.value = null;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.showReturnModal) {
    /** @type {[typeof ReturnModal, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(ReturnModal, new ReturnModal({
        ...{ 'onClose': {} },
        ...{ 'onRequestConfirm': {} },
        prefilledSiteId: (__VLS_ctx.prefilledSiteId),
    }));
    const __VLS_1 = __VLS_0({
        ...{ 'onClose': {} },
        ...{ 'onRequestConfirm': {} },
        prefilledSiteId: (__VLS_ctx.prefilledSiteId),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    let __VLS_3;
    let __VLS_4;
    let __VLS_5;
    const __VLS_6 = {
        onClose: (__VLS_ctx.handleCloseReturnModal)
    };
    const __VLS_7 = {
        onRequestConfirm: (__VLS_ctx.handleRequestConfirm)
    };
    var __VLS_2;
}
/** @type {[typeof ReturnConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(ReturnConfirmDialog, new ReturnConfirmDialog({
    ...{ 'onClose': {} },
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showConfirmDialog),
    returnData: (__VLS_ctx.pendingReturnData),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onClose': {} },
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showConfirmDialog),
    returnData: (__VLS_ctx.pendingReturnData),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_11;
let __VLS_12;
let __VLS_13;
const __VLS_14 = {
    onClose: (__VLS_ctx.handleCloseConfirmDialog)
};
const __VLS_15 = {
    onConfirm: (__VLS_ctx.handleConfirmReturn)
};
var __VLS_10;
/** @type {[typeof ReturnSuccessDialog, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(ReturnSuccessDialog, new ReturnSuccessDialog({
    ...{ 'onClose': {} },
    show: (__VLS_ctx.showSuccessDialog),
    returnRecord: (__VLS_ctx.returnRecord),
}));
const __VLS_17 = __VLS_16({
    ...{ 'onClose': {} },
    show: (__VLS_ctx.showSuccessDialog),
    returnRecord: (__VLS_ctx.returnRecord),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
let __VLS_19;
let __VLS_20;
let __VLS_21;
const __VLS_22 = {
    onClose: (__VLS_ctx.handleCloseSuccessDialog)
};
var __VLS_18;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ReturnModal: ReturnModal,
            ReturnConfirmDialog: ReturnConfirmDialog,
            ReturnSuccessDialog: ReturnSuccessDialog,
            showReturnModal: showReturnModal,
            showConfirmDialog: showConfirmDialog,
            showSuccessDialog: showSuccessDialog,
            pendingReturnData: pendingReturnData,
            returnRecord: returnRecord,
            handleCloseReturnModal: handleCloseReturnModal,
            handleRequestConfirm: handleRequestConfirm,
            handleCloseConfirmDialog: handleCloseConfirmDialog,
            handleConfirmReturn: handleConfirmReturn,
            handleCloseSuccessDialog: handleCloseSuccessDialog,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
