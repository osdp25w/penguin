# 嘉大數據平台 Design System

這是嘉大數據平台的設計系統，提供一致的使用者界面元件和設計代幣。

## 目錄結構

```
src/design/
├── tokens.css           # 設計代幣（顏色、字型、間距等）
├── components/          # UI 元件庫
│   ├── Button.vue      # 按鈕元件
│   ├── Card.vue        # 卡片元件  
│   ├── KpiCard.vue     # KPI 卡片元件
│   ├── EmptyState.vue  # 空狀態元件
│   ├── index.ts        # 元件匯出
│   └── __tests__/      # 元件測試
└── README.md           # 本文件
```

## 設計代幣 (Design Tokens)

設計代幣定義在 `tokens.css` 中，包含：

### 顏色系統
- **品牌色**: `--color-brand-primary` (#6366f1), `--color-brand-secondary` (#8b5cf6)
- **語意色**: `--color-success` (#10b981), `--color-warning` (#f59e0b), `--color-danger` (#ef4444)
- **中性色**: `--color-gray-50` 到 `--color-gray-900`

### 間距系統
- 基於 0.25rem (4px) 的 8pt 網格系統
- `--space-1` (0.25rem) 到 `--space-24` (6rem)

### 字型系統
- 字型家族: `--font-family-sans`, `--font-family-mono`
- 字級: `--font-size-xs` (0.75rem) 到 `--font-size-4xl` (2.25rem)
- 行高: `--line-height-tight`, `--line-height-normal`, `--line-height-relaxed`

### 圓角系統
- `--radius-none` (0) 到 `--radius-full` (9999px)

### 陰影系統
- `--shadow-sm` 到 `--shadow-xl`

## 元件庫

### Button 按鈕

基礎的按鈕元件，支援多種變體和尺寸。

```vue
<template>
  <Button variant="primary" size="md" @click="handleClick">
    點擊我
  </Button>
</template>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `fullWidth`: boolean

### Card 卡片

靈活的卡片容器元件。

```vue
<template>
  <Card variant="default" padding="md" hover>
    <template #header>
      <h3>卡片標題</h3>
    </template>
    
    卡片內容
    
    <template #footer>
      <Button>動作按鈕</Button>
    </template>
  </Card>
</template>
```

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hover`: boolean

### KpiCard KPI 卡片

專用於顯示關鍵績效指標的卡片元件。

```vue
<template>
  <KpiCard
    title="上線車輛"
    :value="42"
    unit="台"
    :change="5.2"
    trend="up"
    period="昨日"
    icon="i-ph:bicycle"
    color="green"
  />
</template>
```

**Props:**
- `title`: string - 指標標題
- `value`: number | string - 數值
- `unit`: string - 單位
- `change`: number - 變化量
- `trend`: 'up' | 'down' | 'neutral' - 趨勢
- `period`: string - 對比期間
- `icon`: string - 圖示
- `color`: 'blue' | 'green' | 'red' | 'yellow' | 'purple' - 顏色主題

### EmptyState 空狀態

用於顯示空狀態的元件。

```vue
<template>
  <EmptyState
    title="沒有找到資料"
    description="嘗試調整搜尋條件或新增內容"
    icon="i-ph:folder-open"
    variant="search"
  >
    <template #action>
      <Button>新增內容</Button>
    </template>
  </EmptyState>
</template>
```

## UnoCSS 整合

設計系統與 UnoCSS 深度整合，提供便利的工具類：

### 按鈕工具類
- `btn-primary`: 主要按鈕樣式
- `btn-secondary`: 次要按鈕樣式
- `btn-ghost`: 幽靈按鈕樣式
- `btn-danger`: 危險按鈕樣式

### 卡片工具類
- `card`: 基礎卡片樣式
- `card-hover`: 具有懸停效果的卡片

### 輸入工具類
- `input-base`: 基礎輸入框樣式

### 佈局工具類
- `flex-center`: 水平垂直置中
- `flex-between`: 兩端對齊

## 開發指南

### 新增元件

1. 在 `src/design/components/` 中創建新元件檔案
2. 在 `index.ts` 中匯出元件
3. 在 `__tests__/` 中新增對應的測試檔案
4. 更新本 README 文件

### 修改設計代幣

1. 編輯 `tokens.css` 檔案
2. 更新相關的 UnoCSS 配置（如需要）
3. 執行測試確保變更不會破壞現有元件

### 測試

```bash
# 執行元件測試
npm run test

# 執行測試並監看變更
npm run test:watch
```

## 設計原則

1. **一致性**: 所有元件使用相同的設計代幣和視覺語言
2. **可訪問性**: 符合 WCAG 2.1 無障礙標準
3. **可重用性**: 元件設計靈活，可在不同情境下重用
4. **效能**: 使用 CSS 變數和 UnoCSS 確保最佳效能
5. **可維護性**: 清晰的程式碼結構和充分的文件

## 色彩使用指南

### 品牌色
- 主要品牌色 (#6366f1): 用於主要動作、重要資訊強調
- 次要品牌色 (#8b5cf6): 用於次要動作、輔助元素

### 語意色
- 成功 (#10b981): 成功狀態、正面回饋
- 警告 (#f59e0b): 警告狀態、需要注意的資訊
- 危險 (#ef4444): 錯誤狀態、破壞性動作
- 資訊 (#3b82f6): 一般資訊、中性回饋

### 無障礙考量
- 確保文字與背景的對比度至少 4.5:1
- 不僅依賴顏色傳達資訊，同時使用圖示或文字
- 支援深色模式（未來功能）

## 更新日誌

### v2.0.0 (2024-08-23)
- 🎉 全新設計系統上線
- ✨ 新增設計代幣系統
- ✨ 新增 Button、Card、KpiCard、EmptyState 元件
- ✨ UnoCSS 深度整合
- ✨ 完整的 TypeScript 支援
- ✅ 單元測試覆蓋
- 📚 完整的文件說明