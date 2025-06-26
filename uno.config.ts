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
      /* 讓 <i-ph:arrow-left-duotone /> 正常渲染 ----------------------- */
      collections: {
        ph: () =>
          import('@iconify-json/ph/icons.json').then((i) => i.default),
      },
      scale: 1.2,
      warn: true,
    }),
  ],

  /* ------------------------------------------------------------------ *
   * 2️⃣  全域主題：品牌色 & 字級                                         *
   * ------------------------------------------------------------------ */
  theme: {
    colors: {
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
  },

  /* ------------------------------------------------------------------ *
   * 3️⃣  常用捷徑：btn / card                                           *
   * ------------------------------------------------------------------ */
  shortcuts: {
    /* 主按鈕 ── `class="btn"` */
    btn: `inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium
          bg-brand-500 text-white
          hover:bg-brand-400 active:bg-brand-600
          transition duration-150
          disabled:cursor-not-allowed disabled:opacity-60`,

    /* 玻璃卡 ── `class="card"` */
    card: `rounded-2xl shadow-lg bg-white/5 backdrop-blur-sm
           border border-white/10 p-6`,
  },

  /* ------------------------------------------------------------------ *
   * 4️⃣  safelist：動態產生的漸層／背景色先打包進去                      *
   * ------------------------------------------------------------------ */
  safelist: [
    ...['emerald', 'rose', 'indigo', 'teal', 'brand'].flatMap((t) => [
      `bg-${t}-500`,
      `bg-${t}-600`,
      `from-${t}-500/80`,
      `to-${t}-600/90`,
    ]),
  ],
})
