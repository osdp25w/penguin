import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    fullWidth: false,
});
const __VLS_emit = defineEmits();
const buttonClasses = computed(() => {
    const baseClasses = [
        'inline-flex',
        'items-center',
        'justify-center',
        'gap-2',
        'font-medium',
        'rounded-lg',
        'transition-all',
        'duration-200',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'disabled:opacity-50',
        'disabled:cursor-not-allowed',
    ];
    // Size variants
    const sizeClasses = {
        sm: ['px-3', 'py-1.5', 'text-sm'],
        md: ['px-4', 'py-2', 'text-base'],
        lg: ['px-6', 'py-3', 'text-lg'],
    };
    // Color variants
    const variantClasses = {
        primary: [
            'bg-brand-primary',
            'text-white',
            'hover:opacity-90',
            'focus:ring-brand-primary',
        ],
        secondary: [
            'bg-brand-secondary',
            'text-white',
            'hover:opacity-90',
            'focus:ring-brand-secondary',
        ],
        outline: [
            'text-gray-700',
            'border',
            'border-gray-300',
            'bg-white',
            'hover:bg-gray-50',
            'focus:ring-brand-primary',
        ],
        ghost: [
            'text-brand-primary',
            'border',
            'border-brand-primary',
            'hover:bg-brand-primary',
            'hover:text-white',
            'focus:ring-brand-primary',
        ],
        danger: [
            'bg-danger',
            'text-white',
            'hover:opacity-90',
            'focus:ring-danger',
        ],
    };
    const widthClasses = props.fullWidth ? ['w-full'] : [];
    return [
        ...baseClasses,
        ...sizeClasses[props.size],
        ...variantClasses[props.variant],
        ...widthClasses,
    ].join(' ');
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    fullWidth: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('click', $event);
        } },
    type: (__VLS_ctx.type),
    disabled: (__VLS_ctx.disabled),
    ...{ class: (__VLS_ctx.buttonClasses) },
});
var __VLS_0 = {};
var __VLS_2 = {};
var __VLS_4 = {};
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2, __VLS_5 = __VLS_4;
[__VLS_dollars.$attrs,];
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            buttonClasses: buttonClasses,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
