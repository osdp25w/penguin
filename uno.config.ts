// uno.config.ts
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from 'unocss'

export default defineConfig({
  /* ------------------------------------------------------------------ *
   * 1️⃣  基礎 preset──Tailwind 風 utilities + Attributify + Icons       *
   * ------------------------------------------------------------------ */
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      /* 支援 ph 和 lucide 圖示集 ------------------------------------ */
      collections: {
        ph: () =>
          import('@iconify-json/ph/icons.json').then((i) => i.default),
        lucide: () =>
          import('@iconify-json/lucide/icons.json').then((i) => i.default),
      },
      scale: 1.1,
      warn: true,
    }),
  ],

  /* ------------------------------------------------------------------ *
   * 2️⃣  全域主題：品牌色 & 字級 + Design Tokens                        *
   * ------------------------------------------------------------------ */
  theme: {
    colors: {
      'brand-primary': 'var(--color-brand-primary)',
      'brand-secondary': 'var(--color-brand-secondary)',
      'success': 'var(--color-success)',
      'warning': 'var(--color-warning)',
      'danger': 'var(--color-danger)',
      'info': 'var(--color-info)',
      brand: {
        50:  '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1', // ★ 主色
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
      },
    },
    /* text-base = 18 px，依序放大一級 */
    fontSize: {
      base: '18px',
      lg: '20px',
      xl: '24px',
      '2xl': '28px',
      '3xl': '32px',
    },
    /* 自訂陰影 */
    boxShadow: {
      'base': 'var(--shadow-base)',
      'lg': 'var(--shadow-lg)',
      'xl': 'var(--shadow-xl)',
    },
  },

  /* ------------------------------------------------------------------ *
   * 3️⃣  常用捷徑：btn / card + Design System Components               *
   * ------------------------------------------------------------------ */
  shortcuts: {
    /* 按鈕變體 */
    'btn-primary': 'px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-secondary': 'px-4 py-2 bg-brand-secondary text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-ghost': 'px-4 py-2 text-brand-primary border border-brand-primary rounded-lg font-medium hover:bg-brand-primary hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-danger': 'px-4 py-2 bg-danger text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    
    /* 卡片組件 */
    'card': 'bg-white rounded-xl shadow-base border border-gray-200',
    'card-hover': 'bg-white rounded-xl shadow-base border border-gray-200 hover:shadow-lg transition-shadow duration-200',
    
    /* 輸入組件 */
    'input-base': 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all duration-200',
    
    /* 佈局組件 */
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    
    /* 原有按鈕保持兼容 */
    btn: `inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium
          bg-brand-500 text-white
          hover:bg-brand-400 active:bg-brand-600
          transition duration-150
          disabled:cursor-not-allowed disabled:opacity-60`,
  },

  /* ------------------------------------------------------------------ *
   * 4️⃣  safelist：動態產生的漸層／背景色 + 圖示類別                      *
   * ------------------------------------------------------------------ */
  safelist: [
    ...['emerald', 'rose', 'indigo', 'teal', 'brand'].flatMap((t) => [
      `bg-${t}-500`,
      `bg-${t}-600`,
      `from-${t}-500/80`,
      `to-${t}-600/90`,
    ]),
    // Design system utilities
    'btn-primary',
    'btn-secondary', 
    'btn-ghost',
    'btn-danger',
    'card',
    'card-hover',
    'input-base',
    // 常用圖示類別（確保動態圖示能正確載入）
    'i-ph:trend-up',
    'i-ph:trend-down', 
    'i-ph:minus',
    'i-ph:bicycle',
    'i-ph:warning-circle',
    'i-ph:map-pin',
    'i-ph:leaf',
    'i-ph:check-circle',
    'i-ph:gear',
    'i-ph:chart-line-up',
    'i-ph:chart-line-down',
    'i-ph:house',
    'i-ph:users',
    'i-ph:bell',
    'i-ph:magnifying-glass',
    'i-ph:arrow-clockwise',
    'i-ph:x-circle',
    'i-ph:info',
    'i-ph:warning',
    'i-ph:arrow-right',
    'i-ph:list',
    'i-ph:x',
    'i-ph:caret-down',
    'i-ph:sign-out',
    'i-ph:user',
    'i-ph:question',
    'i-lucide:bike',
    'i-lucide:map-pin',
    'i-lucide:alert-triangle',
    'i-lucide:activity',
    'i-lucide:users',
    'i-lucide:settings',
  ],
})
