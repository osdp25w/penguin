var _a;
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useRentals } from '@/stores/rentals';
import { CreateRentalSchema } from '@/types/rental';
import { useAuth } from '@/stores/auth';
import { Koala } from '@/services/koala';
import { useToasts } from '@/stores/toasts';
const props = defineProps();
const emit = defineEmits();
const rentalsStore = useRentals();
const auth = useAuth();
const toasts = useToasts();
const isStaff = computed(() => { var _a, _b; return ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) === 'admin' || ((_b = auth.user) === null || _b === void 0 ? void 0 : _b.roleId) === 'staff'; });
// staff 僅保留代租功能（不提供「為自己」）
const isProxy = ref(true);
const currentUserName = computed(() => { var _a; return ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.name) || ''; });
const currentUserPhone = computed(() => { var _a; return ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.phone) || ''; });
const currentUserIdLast4 = computed(() => { var _a; return (((_a = auth.user) === null || _a === void 0 ? void 0 : _a.idNumber) ? String(auth.user.idNumber).slice(-4) : ''); });
const loading = ref(false);
const errors = reactive({ userName: '' });
// staff 代租：成員選擇
const memberOptions = ref([]);
const filteredMemberOptions = ref([]);
const selectedMemberId = ref('');
const memberQuery = ref('');
const canSubmit = computed(() => {
    if (!props.vehicle)
        return false;
    if (isStaff.value)
        return !!selectedMemberId.value;
    return !!currentUserName.value;
});
async function handleSubmit() {
    var _a, _b, _c, _d, _e, _f;
    if (!props.vehicle)
        return;
    loading.value = true;
    rentalsStore.clearError();
    try {
        // 準備租借資料
        let userName = currentUserName.value;
        let phone = currentUserPhone.value;
        let idLast4 = currentUserIdLast4.value;
        if (isStaff.value) {
            const m = memberOptions.value.find(x => String(x.id) === selectedMemberId.value);
            if (!m) {
                errors.userName = '請選擇要代租的成員';
                loading.value = false;
                return;
            }
            userName = (m === null || m === void 0 ? void 0 : m.full_name) || (m === null || m === void 0 ? void 0 : m.username) || '';
            phone = (m === null || m === void 0 ? void 0 : m.phone) || '';
            // Staff 代租時不需要身分證末四碼
            idLast4 = '';
        }
        // 處理可選欄位：確保符合 schema 規則或設為空字符串
        if (!phone) {
            // 如果 auth.user.phone 存在且符合台灣手機號碼格式，使用它；否則留空
            const userPhone = ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.phone) || '';
            phone = /^(09\d{8}|(\+886|886)9\d{8})$/.test(userPhone) ? userPhone : '';
        }
        if (!idLast4) {
            // 如果有 user idNumber，取末四碼；否則留空
            if ((_b = auth.user) === null || _b === void 0 ? void 0 : _b.idNumber) {
                const lastFour = String(auth.user.idNumber).slice(-4);
                idLast4 = /^\d{4}$/.test(lastFour) ? lastFour : '';
            }
            else {
                idLast4 = '';
            }
        }
        const formData = CreateRentalSchema.parse({ bikeId: props.vehicle.id, userName, phone, idLast4 });
        const isPhone = !!phone && /(^(09\d{8})$)|(^((\+886|886)9\d{8})$)/.test(phone);
        const rental = await rentalsStore.createRental({
            ...formData,
            member_phone: isPhone ? phone : undefined,
            member_email: !isPhone ? (isStaff.value ? (((_c = memberOptions.value.find(x => String(x.id) === selectedMemberId.value)) === null || _c === void 0 ? void 0 : _c.email) || undefined) : (((_d = auth.user) === null || _d === void 0 ? void 0 : _d.email) || undefined)) : undefined
        });
        await rentalsStore.unlockCurrent();
        rentalsStore.setInUse(props.vehicle.id);
        toasts.success('租借成功，車輛已啟用');
        emit('success', rental);
        handleClose();
    }
    catch (error) {
        console.error('租借失敗:', error);
        let message = (error === null || error === void 0 ? void 0 : error.message) || (error === null || error === void 0 ? void 0 : error.detail) || '租借失敗，請稍後再試';
        if (message.startsWith('{')) {
            try {
                const parsed = JSON.parse(message);
                message = (parsed === null || parsed === void 0 ? void 0 : parsed.msg) || (parsed === null || parsed === void 0 ? void 0 : parsed.message) || message;
                const bikeError = (_f = (_e = parsed === null || parsed === void 0 ? void 0 : parsed.details) === null || _e === void 0 ? void 0 : _e.bike_id) === null || _f === void 0 ? void 0 : _f[0];
                if (bikeError)
                    message = bikeError;
            }
            catch (_g) { }
        }
        toasts.error(message);
    }
    finally {
        loading.value = false;
    }
}
function handleClose() {
    if (!loading.value)
        emit('close');
}
watch(() => props.show, async (open) => {
    if (open) {
        await nextTick();
        if (isStaff.value && memberOptions.value.length === 0) {
            try {
                const list = await Koala.listMembers();
                memberOptions.value = list;
                filteredMemberOptions.value = list;
            }
            catch (e) {
                console.warn('無法載入成員清單', e);
            }
        }
    }
});
function filterMembers() {
    const q = memberQuery.value.trim().toLowerCase();
    if (!q) {
        filteredMemberOptions.value = memberOptions.value;
        return;
    }
    filteredMemberOptions.value = memberOptions.value.filter((m) => {
        const s = `${m.full_name || ''} ${m.username || ''} ${m.phone || ''} ${m.email || ''}`.toLowerCase();
        return s.includes(q);
    });
}
// 顯示輔助：截斷字串與組裝成員選項
const truncatedVehicleId = computed(() => {
    var _a;
    const id = ((_a = props.vehicle) === null || _a === void 0 ? void 0 : _a.id) || '';
    return id.length > 18 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
});
function short(val, max = 18) {
    const s = String(val || '');
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
function memberLabel(m) {
    const name = short(m.full_name || m.username || '—', 12);
    const contact = short(m.phone || m.email || '無', 14);
    return `${name}（${contact}）`;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.show) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        ...{ class: "fixed inset-0 z-50 overflow-y-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        ...{ class: "fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "hidden sm:inline-block sm:align-middle sm:h-screen" },
        'aria-hidden': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: "inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-xl font-semibold text-gray-900" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        ...{ class: "text-gray-400 hover:text-gray-600 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "i-ph-x w-5 h-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.handleSubmit) },
        ...{ class: "space-y-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative md:max-w-[20rem] lg:max-w-[24rem]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 font-mono text-sm truncate" },
        title: (((_a = __VLS_ctx.vehicle) === null || _a === void 0 ? void 0 : _a.id) || ''),
    });
    (__VLS_ctx.truncatedVehicleId);
    if (!__VLS_ctx.isStaff) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "font-medium" },
        });
        (__VLS_ctx.currentUserName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600" },
        });
        (__VLS_ctx.currentUserPhone || '未提供電話');
        if (__VLS_ctx.currentUserIdLast4) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-xs text-gray-500" },
            });
            (__VLS_ctx.currentUserIdLast4);
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "relative md:max-w-[20rem] lg:max-w-[24rem]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onInput: (__VLS_ctx.filterMembers) },
            value: (__VLS_ctx.memberQuery),
            type: "text",
            placeholder: "搜尋姓名/帳號/電話",
            ...{ class: "w-full px-4 py-3 border border-gray-300 rounded-xl" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "relative md:max-w-[20rem] lg:max-w-[24rem]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: (__VLS_ctx.selectedMemberId),
            ...{ class: "w-full px-4 py-3 border border-gray-300 rounded-xl" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: "",
        });
        for (const [m] of __VLS_getVForSourceType((__VLS_ctx.filteredMemberOptions))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (m.id),
                value: (String(m.id)),
            });
            (__VLS_ctx.memberLabel(m));
        }
        if (__VLS_ctx.errors.userName) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mt-1 text-xs text-red-600" },
            });
            (__VLS_ctx.errors.userName);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex space-x-3 pt-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleClose) },
        type: "button",
        ...{ class: "flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors" },
        disabled: (__VLS_ctx.loading),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" },
        disabled: (__VLS_ctx.loading || !__VLS_ctx.canSubmit),
    });
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-spinner w-4 h-4 mr-2 animate-spin inline-block" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: "i-ph-check-circle w-4 h-4 mr-2 inline-block" },
        });
    }
    (__VLS_ctx.loading ? '處理中...' : '確定租借');
}
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:block']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:p-0']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:align-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['align-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:my-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:align-middle']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:max-w-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-x']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-5']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['md:max-w-[20rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:max-w-[24rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['md:max-w-[20rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:max-w-[24rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['md:max-w-[20rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:max-w-[24rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-check-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isStaff: isStaff,
            currentUserName: currentUserName,
            currentUserPhone: currentUserPhone,
            currentUserIdLast4: currentUserIdLast4,
            loading: loading,
            errors: errors,
            filteredMemberOptions: filteredMemberOptions,
            selectedMemberId: selectedMemberId,
            memberQuery: memberQuery,
            canSubmit: canSubmit,
            handleSubmit: handleSubmit,
            handleClose: handleClose,
            filterMembers: filterMembers,
            truncatedVehicleId: truncatedVehicleId,
            memberLabel: memberLabel,
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
