// 統一圖示匯出，混合使用 UnoCSS 圖示類和 Lucide 元件
// UnoCSS 圖示類別使用方式: <div class="i-ph:bicycle" /> 或 <i class="i-ph:bicycle" />
// Lucide 元件使用方式: <Bicycle class="w-5 h-5" />
// Lucide 元件匯出
export { Home, MapPin, AlertTriangle, Activity, Users, Settings, Bike, Battery, Calendar, Clock, Search, Filter, MoreVertical, Edit, Trash2, Eye, Plus, Minus, CheckCircle, XCircle, AlertCircle, Info, TrendingUp, TrendingDown, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, Menu, Bell, User, LogOut, Refresh, Download, Upload, FileText, Image, Map, Navigation, Zap, Leaf, Star, Heart, Bookmark, Share, Copy, Link, Mail, Phone, MessageCircle } from 'lucide-vue-next';
// 常用 UnoCSS 圖示類別對應表
export const iconClasses = {
    // 導航相關
    home: 'i-ph:house',
    sites: 'i-ph:map-pin',
    vehicles: 'i-ph:bicycle',
    alerts: 'i-ph:warning-circle',
    ml: 'i-ph:chart-line-up',
    users: 'i-ph:users',
    // 狀態指標
    trendUp: 'i-ph:trend-up',
    trendDown: 'i-ph:trend-down',
    neutral: 'i-ph:minus',
    success: 'i-ph:check-circle',
    warning: 'i-ph:warning',
    error: 'i-ph:x-circle',
    info: 'i-ph:info',
    // 操作按鈕
    search: 'i-ph:magnifying-glass',
    refresh: 'i-ph:arrow-clockwise',
    bell: 'i-ph:bell',
    gear: 'i-ph:gear',
    user: 'i-ph:user',
    logout: 'i-ph:sign-out',
    menu: 'i-ph:list',
    close: 'i-ph:x',
    arrowRight: 'i-ph:arrow-right',
    caretDown: 'i-ph:caret-down',
    question: 'i-ph:question',
    // 資料類型
    leaf: 'i-ph:leaf',
    battery: 'i-ph:battery-high',
    location: 'i-ph:map-pin',
    chart: 'i-ph:chart-line',
};
// 動態圖示類別生成函數
export const getIconClass = (name) => {
    return iconClasses[name] || 'i-ph:circle';
};
// 狀態圖示映射
export const getStatusIcon = (status) => {
    const statusMap = {
        available: 'i-ph:check-circle',
        rented: 'i-ph:bicycle',
        maintenance: 'i-ph:wrench',
        charging: 'i-ph:lightning',
        offline: 'i-ph:x-circle',
        online: 'i-ph:check-circle',
        warning: 'i-ph:warning',
        error: 'i-ph:x-circle',
        info: 'i-ph:info',
        success: 'i-ph:check-circle',
        healthy: 'i-ph:check-circle',
    };
    return statusMap[status] || 'i-ph:circle';
};
