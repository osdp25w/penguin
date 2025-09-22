import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/design/components';
import { useAuth } from '@/stores/auth';
import EditProfileModal from '@/components/profile/EditProfileModal.vue';
import ToastHost from '@/components/ToastHost.vue';
import { ensureKoalaWsConnected, setConnectionStatusCallback } from '@/services/koala_ws';
const route = useRoute();
const router = useRouter();
const auth = useAuth();
const sidebarOpen = ref(false);
const userMenuOpen = ref(false);
const userMenuRef = ref();
const showProfileModal = ref(false);
// WebSocket 連線狀態
const wsConnected = ref(null);
const wsStatusText = computed(() => {
    if (wsConnected.value === null)
        return '未連線';
    return wsConnected.value ? '已連線' : '斷線';
});
const wsStatusClass = computed(() => {
    if (wsConnected.value === null)
        return 'border-gray-200 bg-gray-50 text-gray-600';
    return wsConnected.value
        ? 'border-green-200 bg-green-50 text-green-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';
});
const wsIndicatorClass = computed(() => {
    if (wsConnected.value === null)
        return 'bg-gray-400';
    return wsConnected.value ? 'bg-green-500' : 'bg-amber-500';
});
// 當前使用者資訊
const currentUser = computed(() => auth.user || {
    name: '管理員',
    email: 'admin@example.com',
    role: 'admin'
});
const userInitials = computed(() => {
    var _a;
    return ((_a = currentUser.value.name) === null || _a === void 0 ? void 0 : _a.slice(0, 1).toUpperCase()) || 'U';
});
const currentPageTitle = computed(() => {
    return route.meta.title || '總覽';
});
const baseNavigation = [
    { name: '總覽', href: '/', icon: 'i-ph-house' },
    { name: '場域地圖', href: '/sites', icon: 'i-ph-map-pin' },
    { name: '警報中心', href: '/alerts', icon: 'i-ph-warning-circle' }
];
const memberNavigation = [
    { name: '場域地圖', href: '/sites', icon: 'i-ph-map-pin' },
    { name: '我的租借', href: '/my-rentals', icon: 'i-ph-clock-counter-clockwise' }
];
const privilegedNavigation = [
    { name: '總覽', href: '/', icon: 'i-ph-house' },
    { name: '場域地圖', href: '/sites', icon: 'i-ph-map-pin' },
    { name: '租借管理', href: '/admin/rentals', icon: 'i-ph-clipboard-text' },
    { name: '車輛清單', href: '/vehicles', icon: 'i-ph-bicycle' },
    { name: '遙測設備', href: '/admin/telemetry', icon: 'i-ph-wifi-high' },
    // { name: '場域管理', href: '/admin/sites', icon: 'i-ph-map-pin-line' }, // 暫時隱藏
    { name: '帳號管理', href: '/admin/users', icon: 'i-ph-users' },
    { name: '警報中心', href: '/alerts', icon: 'i-ph-warning-circle' },
    { name: 'ML 預測', href: '/ml', icon: 'i-ph-chart-line-up' }
];
// 依角色過濾：member 僅限部分選單，admin/staff 顯示完整管理功能
const navigation = computed(() => {
    var _a, _b;
    const role = ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role');
    console.log('[AppShell] Navigation filtering - DETAILED DEBUG:', {
        role,
        userRole: (_b = auth.user) === null || _b === void 0 ? void 0 : _b.roleId,
        sessionRole: sessionStorage.getItem('penguin.role'),
        localRole: localStorage.getItem('penguin.role'),
        authUser: auth.user,
        isLogin: auth.isLogin
    });
    // member, visitor, tourist 都只能看到場域地圖和我的租借
    if (role === 'member' || role === 'visitor' || role === 'tourist') {
        console.log('[AppShell] Using member navigation for role:', role);
        return memberNavigation;
    }
    const isPrivileged = role === 'admin' || role === 'staff';
    const nav = isPrivileged ? privilegedNavigation : baseNavigation;
    console.log('[AppShell] Navigation filtered result:', {
        role,
        isPrivileged,
        selectedNav: isPrivileged ? 'privileged' : 'base',
        items: nav.map(i => ({ name: i.name, href: i.href }))
    });
    return nav;
});
const userMenuItems = [
    { name: '個人資料', action: 'profile', icon: 'i-ph-user' },
    { name: '登出', action: 'logout', icon: 'i-ph-sign-out' },
];
const isActiveRoute = (href) => {
    if (href === '/') {
        return route.path === '/';
    }
    return route.path.startsWith(href);
};
// 當 member/tourist 訪問禁止頁面時重導向到場域地圖
const checkAccessAndRedirect = () => {
    var _a;
    const role = (_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId;
    if (role === 'member' || role === 'visitor' || role === 'tourist') {
        const currentPath = route.path;
        const allowedPaths = ['/sites', '/my-rentals', '/login', '/register'];
        const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));
        if (!isAllowed) {
            console.log('[AppShell] Redirecting unauthorized member/tourist from:', currentPath);
            router.push('/sites');
        }
    }
};
const handleUserMenuAction = (item) => {
    console.log('點擊用戶選單項目:', item);
    userMenuOpen.value = false;
    if (item.action === 'profile') {
        console.log('打開個人資料模態框');
        showProfileModal.value = true;
        console.log('showProfileModal 狀態:', showProfileModal.value);
    }
    else if (item.action === 'logout') {
        auth.logout();
        router.push('/login');
    }
    else if (item.href) {
        router.push(item.href);
    }
};
const handleProfileSuccess = () => {
    // TODO: Show success toast
    console.log('個人資料更新成功');
};
// Close user menu when clicking outside
const handleClickOutside = (event) => {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
        userMenuOpen.value = false;
    }
};
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    // 檢查權限並重導向
    checkAccessAndRedirect();
    // Set up WebSocket connection status callback
    setConnectionStatusCallback((connected) => {
        wsConnected.value = connected;
    });
});
watch(() => { var _a; return ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role'); }, (role, prev) => {
    if (role && role !== prev) {
        console.log('[AppShell] Role changed, evaluating WS connection:', { role, prev });
        if (role === 'admin' || role === 'staff' || role === 'member') {
            ensureKoalaWsConnected().catch((error) => {
                console.error('[AppShell] WebSocket connection failed for role:', role, error);
            });
        }
        else {
            wsConnected.value = null;
        }
    }
}, { immediate: true });
watch(() => auth.isLogin, (loggedIn) => {
    var _a;
    if (loggedIn) {
        const role = ((_a = auth.user) === null || _a === void 0 ? void 0 : _a.roleId) || sessionStorage.getItem('penguin.role') || localStorage.getItem('penguin.role');
        if (role === 'admin' || role === 'staff' || role === 'member') {
            ensureKoalaWsConnected().catch((error) => {
                console.error('[AppShell] WebSocket connection failed (login watch):', error);
            });
        }
    }
    else {
        wsConnected.value = null;
    }
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
// Close sidebar when route changes on mobile
// watch(route, () => {
//   sidebarOpen.value = false
// })
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "min-h-screen bg-gray-50" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "px-4 sm:px-6 lg:px-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between h-16" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
const __VLS_0 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    variant: "ghost",
    size: "sm",
    ...{ class: "lg:hidden" },
    'aria-label': "開啟側邊選單",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    variant: "ghost",
    size: "sm",
    ...{ class: "lg:hidden" },
    'aria-label': "開啟側邊選單",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.sidebarOpen = !__VLS_ctx.sidebarOpen;
    }
};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-list w-5 h-5" },
});
var __VLS_3;
const __VLS_8 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    to: "/",
    ...{ class: "flex items-center gap-2 text-xl font-bold text-brand-primary" },
}));
const __VLS_10 = __VLS_9({
    to: "/",
    ...{ class: "flex items-center gap-2 text-xl font-bold text-brand-primary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-bicycle w-8 h-8" },
});
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "hidden lg:flex items-center gap-2 text-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
    ...{ class: "i-ph-house w-4 h-4 text-gray-600" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-gray-600" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "font-medium text-gray-900" },
});
(__VLS_ctx.currentPageTitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
if (__VLS_ctx.wsConnected !== null) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2 px-3 py-1.5 rounded-md border" },
        ...{ class: (__VLS_ctx.wsStatusClass) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "w-2 h-2 rounded-full animate-pulse" },
        ...{ class: (__VLS_ctx.wsIndicatorClass) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-xs font-medium" },
    });
    (__VLS_ctx.wsStatusText);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative" },
    ref: "userMenuRef",
});
/** @type {typeof __VLS_ctx.userMenuRef} */ ;
const __VLS_12 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    variant: "ghost",
    size: "sm",
    ...{ class: "flex items-center gap-2" },
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    variant: "ghost",
    size: "sm",
    ...{ class: "flex items-center gap-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (...[$event]) => {
        __VLS_ctx.userMenuOpen = !__VLS_ctx.userMenuOpen;
    }
};
__VLS_15.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-medium" },
});
(__VLS_ctx.userInitials);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "hidden sm:block text-sm font-medium text-gray-700" },
});
(__VLS_ctx.currentUser.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-caret-down w-4 h-4 text-gray-600" },
});
var __VLS_15;
const __VLS_20 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    enterActiveClass: "transition ease-out duration-100",
    enterFromClass: "transform opacity-0 scale-95",
    enterToClass: "transform opacity-100 scale-100",
    leaveActiveClass: "transition ease-in duration-75",
    leaveFromClass: "transform opacity-100 scale-100",
    leaveToClass: "transform opacity-0 scale-95",
}));
const __VLS_22 = __VLS_21({
    enterActiveClass: "transition ease-out duration-100",
    enterFromClass: "transform opacity-0 scale-95",
    enterToClass: "transform opacity-100 scale-100",
    leaveActiveClass: "transition ease-in duration-75",
    leaveFromClass: "transform opacity-100 scale-100",
    leaveToClass: "transform opacity-0 scale-95",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
if (__VLS_ctx.userMenuOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.userMenuItems))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.userMenuOpen))
                        return;
                    __VLS_ctx.handleUserMenuAction(item);
                } },
            key: (item.name),
            ...{ class: "w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150" },
        });
        const __VLS_24 = ((item.icon));
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
            ...{ class: "w-4 h-4" },
        }));
        const __VLS_26 = __VLS_25({
            ...{ class: "w-4 h-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        (item.name);
    }
}
var __VLS_23;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: ([
            'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
            __VLS_ctx.sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col h-full pt-16 lg:pt-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "flex-1 px-4 py-4 space-y-1 overflow-y-auto" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lg:hidden mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm font-medium text-gray-900" },
});
const __VLS_28 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    variant: "ghost",
    size: "sm",
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    variant: "ghost",
    size: "sm",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (...[$event]) => {
        __VLS_ctx.sidebarOpen = false;
    }
};
__VLS_31.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
    ...{ class: "i-ph-x w-4 h-4" },
});
var __VLS_31;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.navigation))) {
    const __VLS_36 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        ...{ 'onClick': {} },
        key: (item.name),
        to: (item.href),
        ...{ class: "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200" },
        ...{ class: (__VLS_ctx.isActiveRoute(item.href)
                ? 'bg-brand-primary text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100') },
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onClick': {} },
        key: (item.name),
        to: (item.href),
        ...{ class: "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200" },
        ...{ class: (__VLS_ctx.isActiveRoute(item.href)
                ? 'bg-brand-primary text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100') },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_40;
    let __VLS_41;
    let __VLS_42;
    const __VLS_43 = {
        onClick: (...[$event]) => {
            __VLS_ctx.sidebarOpen = false;
        }
    };
    __VLS_39.slots.default;
    const __VLS_44 = ((item.icon));
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ class: "w-5 h-5" },
    }));
    const __VLS_46 = __VLS_45({
        ...{ class: "w-5 h-5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    (item.name);
    var __VLS_39;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-4 border-t border-gray-200" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-xs text-gray-700 text-center" },
});
if (__VLS_ctx.sidebarOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.sidebarOpen))
                    return;
                __VLS_ctx.sidebarOpen = false;
            } },
        ...{ class: "fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "flex-1 min-w-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-4 lg:p-8" },
});
const __VLS_48 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({}));
const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
if (__VLS_ctx.showProfileModal) {
    /** @type {[typeof EditProfileModal, ]} */ ;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(EditProfileModal, new EditProfileModal({
        ...{ 'onClose': {} },
        ...{ 'onSuccess': {} },
    }));
    const __VLS_53 = __VLS_52({
        ...{ 'onClose': {} },
        ...{ 'onSuccess': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    let __VLS_55;
    let __VLS_56;
    let __VLS_57;
    const __VLS_58 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.showProfileModal))
                return;
            __VLS_ctx.showProfileModal = false;
        }
    };
    const __VLS_59 = {
        onSuccess: (__VLS_ctx.handleProfileSuccess)
    };
    var __VLS_54;
}
/** @type {[typeof ToastHost, ]} */ ;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(ToastHost, new ToastHost({}));
const __VLS_61 = __VLS_60({}, ...__VLS_functionalComponentArgsRest(__VLS_60));
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-list']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-bicycle']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-house']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['w-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-brand-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-caret-down']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-48']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-150']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-30']} */ ;
/** @type {__VLS_StyleScopedClasses['w-64']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border-r']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['ease-in-out']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:translate-x-0']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:static']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-16']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:pt-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-x']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-20']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:p-8']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Button: Button,
            EditProfileModal: EditProfileModal,
            ToastHost: ToastHost,
            sidebarOpen: sidebarOpen,
            userMenuOpen: userMenuOpen,
            userMenuRef: userMenuRef,
            showProfileModal: showProfileModal,
            wsConnected: wsConnected,
            wsStatusText: wsStatusText,
            wsStatusClass: wsStatusClass,
            wsIndicatorClass: wsIndicatorClass,
            currentUser: currentUser,
            userInitials: userInitials,
            currentPageTitle: currentPageTitle,
            navigation: navigation,
            userMenuItems: userMenuItems,
            isActiveRoute: isActiveRoute,
            handleUserMenuAction: handleUserMenuAction,
            handleProfileSuccess: handleProfileSuccess,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
