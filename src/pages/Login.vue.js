import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/stores/auth';
/* 表單狀態 ---------------------------------------------------------- */
const email = ref('');
const password = ref('');
const loading = ref(false);
/* Store / Router ---------------------------------------------------- */
const auth = useAuth();
const router = useRouter();
const route = useRoute();
/* 提交 -------------------------------------------------------------- */
async function submit() {
    loading.value = true;
    try {
        await auth.login(email.value, password.value);
        router.replace(route.query.redirect || '/');
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "min-h-screen grid place-content-center bg-brand-500/5 px-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.submit) },
    ...{ class: "\u0077\u002d\u005b\u0032\u0030\u0072\u0065\u006d\u005d\u0020\u006d\u0061\u0078\u002d\u0077\u002d\u0066\u0075\u006c\u006c\u0020\u0073\u0070\u0061\u0063\u0065\u002d\u0079\u002d\u0038\u0020\u0072\u006f\u0075\u006e\u0064\u0065\u0064\u002d\u0032\u0078\u006c\u0020\u0062\u006f\u0072\u0064\u0065\u0072\u0020\u0062\u006f\u0072\u0064\u0065\u0072\u002d\u0062\u006c\u0061\u0063\u006b\u002f\u0031\u0030\u000a\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0062\u0067\u002d\u0077\u0068\u0069\u0074\u0065\u002f\u0036\u0030\u0020\u0062\u0061\u0063\u006b\u0064\u0072\u006f\u0070\u002d\u0062\u006c\u0075\u0072\u002d\u0078\u006c\u0020\u0073\u0068\u0061\u0064\u006f\u0077\u002d\u006c\u0067\u0020\u0073\u0068\u0061\u0064\u006f\u0077\u002d\u0062\u006c\u0061\u0063\u006b\u002f\u0032\u0030\u0020\u0070\u002d\u0038" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-xl font-extrabold text-center text-slate-800 tracking-wide" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "email",
    placeholder: "Email",
    autocomplete: "off",
    ...{ class: "\u0077\u002d\u0036\u0034\u0020\u006d\u0061\u0078\u002d\u0077\u002d\u0066\u0075\u006c\u006c\u0020\u0070\u0078\u002d\u0034\u0020\u0070\u0079\u002d\u0032\u0020\u0072\u006f\u0075\u006e\u0064\u0065\u0064\u002d\u006d\u0064\u0020\u0062\u006f\u0072\u0064\u0065\u0072\u0020\u0062\u006f\u0072\u0064\u0065\u0072\u002d\u0062\u006c\u0061\u0063\u006b\u002f\u0031\u0035\u000a\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0062\u0067\u002d\u0077\u0068\u0069\u0074\u0065\u0020\u0074\u0065\u0078\u0074\u002d\u0073\u006c\u0061\u0074\u0065\u002d\u0038\u0030\u0030\u0020\u0070\u006c\u0061\u0063\u0065\u0068\u006f\u006c\u0064\u0065\u0072\u003a\u0074\u0065\u0078\u0074\u002d\u0073\u006c\u0061\u0074\u0065\u002d\u0034\u0030\u0030\u000a\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0066\u006f\u0063\u0075\u0073\u003a\u006f\u0075\u0074\u006c\u0069\u006e\u0065\u002d\u006e\u006f\u006e\u0065\u0020\u0066\u006f\u0063\u0075\u0073\u003a\u0072\u0069\u006e\u0067\u002d\u0032\u0020\u0066\u006f\u0063\u0075\u0073\u003a\u0072\u0069\u006e\u0067\u002d\u0069\u006e\u0064\u0069\u0067\u006f\u002d\u0034\u0030\u0030" },
});
(__VLS_ctx.email);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "password",
    placeholder: "Password",
    autocomplete: "off",
    ...{ class: "\u0077\u002d\u0036\u0034\u0020\u006d\u0061\u0078\u002d\u0077\u002d\u0066\u0075\u006c\u006c\u0020\u0070\u0078\u002d\u0034\u0020\u0070\u0079\u002d\u0032\u0020\u0072\u006f\u0075\u006e\u0064\u0065\u0064\u002d\u006d\u0064\u0020\u0062\u006f\u0072\u0064\u0065\u0072\u0020\u0062\u006f\u0072\u0064\u0065\u0072\u002d\u0062\u006c\u0061\u0063\u006b\u002f\u0031\u0035\u000a\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0062\u0067\u002d\u0077\u0068\u0069\u0074\u0065\u0020\u0074\u0065\u0078\u0074\u002d\u0073\u006c\u0061\u0074\u0065\u002d\u0038\u0030\u0030\u0020\u0070\u006c\u0061\u0063\u0065\u0068\u006f\u006c\u0064\u0065\u0072\u003a\u0074\u0065\u0078\u0074\u002d\u0073\u006c\u0061\u0074\u0065\u002d\u0034\u0030\u0030\u000a\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0066\u006f\u0063\u0075\u0073\u003a\u006f\u0075\u0074\u006c\u0069\u006e\u0065\u002d\u006e\u006f\u006e\u0065\u0020\u0066\u006f\u0063\u0075\u0073\u003a\u0072\u0069\u006e\u0067\u002d\u0032\u0020\u0066\u006f\u0063\u0075\u0073\u003a\u0072\u0069\u006e\u0067\u002d\u0069\u006e\u0064\u0069\u0067\u006f\u002d\u0034\u0030\u0030" },
});
(__VLS_ctx.password);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    disabled: (__VLS_ctx.loading),
    ...{ class: "\u0077\u002d\u0066\u0075\u006c\u006c\u0020\u0072\u006f\u0075\u006e\u0064\u0065\u0064\u002d\u006d\u0064\u0020\u0062\u0067\u002d\u0069\u006e\u0064\u0069\u0067\u006f\u002d\u0035\u0030\u0030\u0020\u0070\u0079\u002d\u0032\u0020\u0074\u0065\u0078\u0074\u002d\u0077\u0068\u0069\u0074\u0065\u0020\u0066\u006f\u006e\u0074\u002d\u006d\u0065\u0064\u0069\u0075\u006d\u000a\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0068\u006f\u0076\u0065\u0072\u003a\u0062\u0067\u002d\u0069\u006e\u0064\u0069\u0067\u006f\u002d\u0034\u0030\u0030\u0020\u0074\u0072\u0061\u006e\u0073\u0069\u0074\u0069\u006f\u006e\u002d\u0063\u006f\u006c\u006f\u0072\u0073\u0020\u0064\u0069\u0073\u0061\u0062\u006c\u0065\u0064\u003a\u006f\u0070\u0061\u0063\u0069\u0074\u0079\u002d\u0036\u0030\u000a\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0064\u0069\u0073\u0061\u0062\u006c\u0065\u0064\u003a\u0063\u0075\u0072\u0073\u006f\u0072\u002d\u006e\u006f\u0074\u002d\u0061\u006c\u006c\u006f\u0077\u0065\u0064" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ class: "i-ph-spinner animate-spin text-lg" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "opacity-90" },
    });
}
if (__VLS_ctx.auth.err) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "break-all text-center text-sm text-rose-500" },
    });
    (__VLS_ctx.auth.err);
}
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['place-content-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-brand-500/5']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-[20rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-black/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/60']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-black/20']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-64']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-black/15']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-400']} */ ;
/** @type {__VLS_StyleScopedClasses['w-64']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-black/15']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-400']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-400']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-60']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['i-ph-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['break-all']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-rose-500']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            email: email,
            password: password,
            loading: loading,
            auth: auth,
            submit: submit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
