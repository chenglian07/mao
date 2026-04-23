/**
 * MeowGuard - 项目猫前端核心模块
 * 城市流浪猫生命共同体
 */

// ============================================
// 工具函数模块
// ============================================

/**
 * 防抖函数 - 减少频繁调用
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数 - 限制调用频率
 */
function throttle(func, limit = 1000) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Toast 提示系统
 */
const Toast = {
    element: null,
    
    init() {
        this.element = document.getElementById('toast');
    },
    
    show(message, duration = 3000, type = 'info') {
        if (!this.element) this.init();
        if (!this.element) return;
        
        // 设置样式类
        this.element.className = 'toast show';
        if (type !== 'info') {
            this.element.classList.add(`toast-${type}`);
        }
        
        this.element.innerHTML = `
            <span class="toast-icon">${this.getIcon(type)}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
        `;
        
        // 清除之前的定时器
        if (this.timer) clearTimeout(this.timer);
        
        this.timer = setTimeout(() => {
            this.element.classList.remove('show');
        }, duration);
    },
    
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    success(message, duration) { this.show(message, duration, 'success'); },
    error(message, duration) { this.show(message, duration, 'error'); },
    warning(message, duration) { this.show(message, duration, 'warning'); }
};

/**
 * 加载状态管理
 */
const Loading = {
    elements: new Map(),
    
    show(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        this.elements.set(elementId, element.innerHTML);
        element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span class="loading-text">加载中...</span>
            </div>
        `;
        element.classList.add('loading');
    },
    
    hide(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const original = this.elements.get(elementId);
        if (original) {
            element.innerHTML = original;
            this.elements.delete(elementId);
        }
        element.classList.remove('loading');
    },
    
    toggleButton(button, isLoading) {
        if (!button) return;
        
        const originalText = button.innerHTML;
        const originalDisabled = button.disabled;
        
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `
                <span class="button-loading">
                    <span class="spinner-small"></span>
                    <span>处理中...</span>
                </span>
            `;
        } else {
            button.disabled = originalDisabled;
            button.innerHTML = originalText;
        }
    }
};

/**
 * 格式化时间
 */
function formatTime(timeString) {
    if (!timeString) return '';
    
    try {
        const now = new Date();
        const normalized = typeof timeString === 'string' 
            ? timeString.replace(' ', 'T') 
            : timeString;
        const time = new Date(normalized);
        
        if (isNaN(time.getTime())) return '';
        
        const diff = now - time;
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        
        if (diff < minute) return '刚刚';
        if (diff < hour) return Math.floor(diff / minute) + '分钟前';
        if (diff < day) return Math.floor(diff / hour) + '小时前';
        if (diff < 7 * day) return Math.floor(diff / day) + '天前';
        
        return time.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '';
    }
}

/**
 * 格式化数字（添加千位分隔符）
 */
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('zh-CN');
}

/**
 * 深色模式切换
 */
const DarkMode = {
    isDark: false,
    
    init() {
        // 从 localStorage 读取用户偏好
        const saved = localStorage.getItem('darkMode');
        if (saved === 'true') {
            this.enable();
        } else if (saved === 'false') {
            this.disable();
        } else {
            // 跟随系统偏好
            this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (this.isDark) {
                this.enable();
            }
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('darkMode') === null) {
                if (e.matches) {
                    this.enable();
                } else {
                    this.disable();
                }
            }
        });
    },
    
    enable() {
        this.isDark = true;
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
        this.updateToggleIcon();
    },
    
    disable() {
        this.isDark = false;
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
        this.updateToggleIcon();
    },
    
    toggle() {
        if (this.isDark) {
            this.disable();
        } else {
            this.enable();
        }
    },
    
    updateToggleIcon() {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            // 不要修改 innerHTML，因为 CSS 使用 ::before 伪元素显示图标
            // 只需更新 aria-label 和 title 属性
            toggleBtn.setAttribute('aria-label', this.isDark ? '切换到浅色模式' : '切换到深色模式');
            toggleBtn.setAttribute('title', this.isDark ? '切换到浅色模式' : '切换到深色模式');
        }
    }
};

// ============================================
// API 调用模块
// ============================================

const API = {
    baseURL: '',
    
    async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
            const response = await fetch(this.baseURL + url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络连接');
            }
            throw error;
        }
    },
    
    get(url) {
        return this.request(url);
    },
    
    post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// ============================================
// 猫咪数据模块
// ============================================

const CatStore = {
    cats: [],
    stats: {},
    cacheTime: 0,
    cacheDuration: 30000, // 30 秒缓存
    
    async fetchCats() {
        try {
            this.cats = await API.get('/api/cats');
            this.cacheTime = Date.now();
            return this.cats;
        } catch (error) {
            console.error('获取猫咪数据失败:', error);
            Toast.error('加载猫咪数据失败');
            return [];
        }
    },
    
    async fetchStats() {
        try {
            this.stats = await API.get('/api/stats');
            return this.stats;
        } catch (error) {
            console.error('获取统计数据失败:', error);
            return {};
        }
    },
    
    getCats() {
        const now = Date.now();
        if (this.cats.length > 0 && now - this.cacheTime < this.cacheDuration) {
            return Promise.resolve(this.cats);
        }
        return this.fetchCats();
    },
    
    getCatById(id) {
        return this.cats.find(cat => cat.id === id);
    },
    
    getAdoptableCats() {
        return this.cats.filter(cat => cat.adoption_ready);
    }
};

// ============================================
// 猫咪 UI 模块
// ============================================

const CatUI = {
    emojiMap: {
        '黑': '🐱',
        '白': '🐱',
        '橘': '🐱',
        '灰': '🐱',
        '花': '🐱',
        '相间': '🐱'
    },
    
    backgroundMap: {
        '黑': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        '白': 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%)',
        '橘': 'linear-gradient(135deg, #f6d365 0%, #fda085 50%, #ff6b6b 100%)',
        '灰': 'linear-gradient(135deg, #4b6cb7 0%, #182848 50%, #0d1b2a 100%)',
        '花': 'linear-gradient(135deg, #ffd89b 0%, #19547b 50%, #0d1b2a 100%)',
        '相间': 'linear-gradient(135deg, #fff5e6 0%, #ffe0b2 50%, #ffcc80 100%)'
    },
    
    getEmoji(color) {
        if (!color) return '🐱';
        for (const [key, emoji] of Object.entries(this.emojiMap)) {
            if (color.includes(key)) return emoji;
        }
        return '🐱';
    },
    
    getBackground(color) {
        if (!color) return 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        for (const [key, bg] of Object.entries(this.backgroundMap)) {
            if (color.includes(key)) return bg;
        }
        return 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
    },
    
    getGenderText(gender) {
        return gender === 'male' ? '♂ 公' : '♀ 母';
    },
    
    getStatusBadge(cat) {
        if (!cat) return '<span class="status-badge unavailable">暂不可领养</span>';
        if (cat.adoption_ready) {
            return '<span class="status-badge adoption">🏠 可领养</span>';
        }
        if (cat.adoption_note) {
            return `<span class="status-badge unavailable" title="${cat.adoption_note}">⏸ ${cat.adoption_note}</span>`;
        }
        if (cat.health && cat.health !== '健康') {
            return `<span class="status-badge warning">⚠️ 健康${cat.health}</span>`;
        }
        if (cat.neutered === false) {
            return '<span class="status-badge warning">🔧 未绝育</span>';
        }
        return '<span class="status-badge unavailable">⏸ 暂未开放</span>';
    },
    
    createCatCard(cat) {
        const searchAttrs = [cat.name, cat.nickname, cat.location, cat.color]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        
        return `
            <div class="cat-card" 
                 data-id="${cat.id}" 
                 data-adoption="${cat.adoption_ready}" 
                 data-neutered="${cat.neutered}" 
                 data-search="${this.escapeHtml(searchAttrs)}">
                <div class="cat-card-image" style="background: ${this.getBackground(cat.color)}">
                    <div class="cat-avatar large">${this.getEmoji(cat.color)}</div>
                    <div class="cat-status-badge">${this.getStatusBadge(cat)}</div>
                    ${cat.neutered ? '<div class="cat-ribbon">已绝育</div>' : ''}
                </div>
                <div class="cat-card-info">
                    <h3 class="cat-name">${this.escapeHtml(cat.name)}</h3>
                    <p class="cat-nickname">"${this.escapeHtml(cat.nickname || '')}"</p>
                    <div class="cat-tags">
                        <span class="tag">${this.getGenderText(cat.gender)} ${this.escapeHtml(cat.age)}</span>
                        <span class="tag color">${this.escapeHtml(cat.color)}</span>
                        ${cat.neutered ? '<span class="tag neutered">已绝育</span>' : ''}
                        <span class="tag health ${cat.health === '健康' ? 'good' : 'warning'}">${this.escapeHtml(cat.health || '未知')}</span>
                    </div>
                    <p class="cat-location">📍 ${this.escapeHtml(cat.location)}</p>
                    <div class="cat-stats">
                        <span class="stat">❤️ ${formatNumber(cat.feed_count)} 次投喂</span>
                        <span class="stat">👁️ ${formatNumber(cat.views)} 次观看</span>
                        <span class="stat points">⭐ ${formatNumber(cat.points || 0)} 积分</span>
                    </div>
                    <button class="cat-detail-btn" onclick="CatUI.showDetail(${cat.id})">
                        <span class="btn-text">查看详情</span>
                        <span class="btn-icon">→</span>
                    </button>
                    <button class="cat-share-btn" onclick="ShareUI.shareCat(${cat.id})" title="分享">
                        📤
                    </button>
                </div>
            </div>
        `;
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    async showDetail(catId) {
        const modalBody = document.getElementById('modalBody');
        if (!modalBody) return;
        
        Loading.show('modalBody');
        
        try {
            const cat = await API.get(`/api/cat/${catId}`);
            
            modalBody.innerHTML = `
                <div class="detail-header">
                    <div class="detail-avatar" style="background: ${CatUI.getBackground(cat.color)}">
                        ${CatUI.getEmoji(cat.color)}
                    </div>
                    <div class="detail-info">
                        <h2>${CatUI.escapeHtml(cat.name)}</h2>
                        <p class="nickname">"${CatUI.escapeHtml(cat.nickname || '')}"</p>
                        <div class="detail-badges">
                            ${CatUI.getStatusBadge(cat)}
                            <span class="status-badge ${cat.health === '健康' ? 'healthy' : 'warning'}">${CatUI.escapeHtml(cat.health || '未知')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4><span class="section-icon">📋</span> 基本信息</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">性别</span>
                            <span class="value">${CatUI.getGenderText(cat.gender)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">年龄</span>
                            <span class="value">${CatUI.escapeHtml(cat.age)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">毛色</span>
                            <span class="value">${CatUI.escapeHtml(cat.color)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">绝育</span>
                            <span class="value">${cat.neutered ? '✅ 已完成' : '❌ 未完成'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4><span class="section-icon">📍</span> 位置信息</h4>
                    <p class="location-text">📍 ${CatUI.escapeHtml(cat.location)}</p>
                    <p class="location-note">⚠️ 为保护猫咪安全，精确位置仅对认证志愿者可见</p>
                </div>
                
                <div class="detail-section">
                    <h4><span class="section-icon">📝</span> 喵生简介</h4>
                    <p class="description">${CatUI.escapeHtml(cat.description || '暂无简介')}</p>
                </div>
                
                <div class="detail-section">
                    <h4><span class="section-icon">📊</span> 互动数据</h4>
                    <div class="detail-stats">
                        <div class="detail-stat">
                            <span class="value">${formatNumber(cat.feed_count)}</span>
                            <span class="label">累计投喂</span>
                        </div>
                        <div class="detail-stat">
                            <span class="value">${formatNumber(cat.views)}</span>
                            <span class="label">累计观看</span>
                        </div>
                        <div class="detail-stat">
                            <span class="value">${cat.neutered ? '✅' : '⏳'}</span>
                            <span class="label">${cat.neutered ? '已绝育' : '待绝育'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section detail-actions">
                    ${cat.adoption_ready ? `
                        <a href="/adopt?cat=${cat.id}" class="adopt-btn-large">
                            <span class="btn-icon">🏠</span>
                            <span>申请领养</span>
                        </a>
                    ` : `
                        <p class="adopt-note">🐾 ${CatUI.getStatusBadge(cat)}</p>
                    `}
                </div>
            `;
            
            document.getElementById('catDetailModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('加载猫咪详情失败:', error);
            Toast.error('加载详情失败，请稍后重试');
            Loading.hide('modalBody');
        }
    },
    
    hideDetail() {
        const modal = document.getElementById('catDetailModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
};

// ============================================
// 直播间模块
// ============================================

const LiveRoom = {
    currentCatId: 1,
    cats: [],
    stats: {},
    feedTimer: null,
    viewerTimer: null,
    envTimer: null,
    
    async init() {
        const roomSelect = document.getElementById('roomSelect');
        const feedBtn = document.getElementById('feedBtn');
        
        if (!roomSelect || !feedBtn) return;
        
        // 从 URL 获取初始猫咪
        const urlParams = new URLSearchParams(window.location.search);
        const catId = parseInt(urlParams.get('cat') || '', 10);
        if (!isNaN(catId) && catId > 0) {
            this.currentCatId = catId;
        }
        
        // 加载数据
        await this.loadData();
        
        // 渲染房间选择器
        this.renderRoomSelect(roomSelect);
        
        // 设置初始猫咪
        const initialCat = this.getCatById(this.currentCatId) || this.cats[0];
        if (initialCat) {
            this.currentCatId = initialCat.id;
            roomSelect.value = String(this.currentCatId);
            this.applyCat(initialCat);
        }
        
        // 绑定事件
        this.bindEvents(roomSelect, feedBtn);
        
        // 启动定时更新
        this.startTimers();
    },
    
    async loadData() {
        try {
            const [cats, stats] = await Promise.all([
                API.get('/api/cats'),
                API.get('/api/stats')
            ]);
            this.cats = Array.isArray(cats) ? cats : [];
            this.stats = stats || {};
            
            // 更新总投喂数
            const totalFeedsEl = document.getElementById('totalFeeds');
            if (totalFeedsEl && this.stats.total_feeds !== undefined) {
                totalFeedsEl.textContent = formatNumber(this.stats.total_feeds);
            }
        } catch (error) {
            console.error('加载直播间数据失败:', error);
        }
    },
    
    renderRoomSelect(selectEl) {
        selectEl.innerHTML = this.cats
            .map(cat => `<option value="${cat.id}">🐱 ${CatUI.escapeHtml(cat.name)} · ${CatUI.escapeHtml(cat.location)}</option>`)
            .join('');
    },
    
    bindEvents(roomSelect, feedBtn) {
        // 投喂按钮
        feedBtn.addEventListener('click', () => this.feed());
        
        // 房间切换
        roomSelect.addEventListener('change', (e) => {
            const newId = parseInt(e.target.value, 10);
            if (!isNaN(newId) && newId > 0 && newId !== this.currentCatId) {
                this.switchRoom(newId);
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && document.activeElement !== feedBtn) {
                e.preventDefault();
                this.feed();
            }
        });
    },
    
    switchRoom(catId) {
        this.currentCatId = catId;
        const cat = this.getCatById(catId);
        if (cat) {
            this.applyCat(cat);
            this.loadFeedLogs(catId);
            this.updateUrl(catId);
        }
    },
    
    applyCat(cat) {
        // 更新主画面
        const liveCatEmoji = document.getElementById('liveCatEmoji');
        const liveCatTitle = document.getElementById('liveCatTitle');
        const liveCatLocation = document.getElementById('liveCatLocation');
        
        if (liveCatEmoji) liveCatEmoji.textContent = CatUI.getEmoji(cat.color);
        if (liveCatTitle) liveCatTitle.textContent = `${CatUI.escapeHtml(cat.name)}的直播间`;
        if (liveCatLocation) liveCatLocation.textContent = `📍 ${CatUI.escapeHtml(cat.location)}`;
        
        // 更新侧边栏
        const sidebarCatEmoji = document.getElementById('sidebarCatEmoji');
        const sidebarCatName = document.getElementById('sidebarCatName');
        const sidebarCatNickname = document.getElementById('sidebarCatNickname');
        const sidebarCatBadges = document.getElementById('sidebarCatBadges');
        
        if (sidebarCatEmoji) sidebarCatEmoji.textContent = CatUI.getEmoji(cat.color);
        if (sidebarCatName) sidebarCatName.textContent = CatUI.escapeHtml(cat.name);
        if (sidebarCatNickname) sidebarCatNickname.textContent = CatUI.escapeHtml(cat.nickname || '');
        if (sidebarCatBadges) {
            sidebarCatBadges.innerHTML = `
                <span class="status-badge ${cat.health === '健康' ? 'healthy' : 'warning'}">${CatUI.escapeHtml(cat.health || '未知')}</span>
                ${cat.neutered ? '<span class="status-badge neutered">已绝育</span>' : '<span class="status-badge">未绝育</span>'}
            `;
        }
        
        // 更新投喂数
        const todayFeeds = document.getElementById('todayFeeds');
        if (todayFeeds && typeof cat.feed_count === 'number') {
            todayFeeds.textContent = formatNumber(cat.feed_count);
        }
    },
    
    async feed() {
        const feedBtn = document.getElementById('feedBtn');
        if (!feedBtn || feedBtn.disabled) return;
        
        // 直接设置按钮状态，不使用 Loading.toggleButton
        feedBtn.disabled = true;
        const originalHtml = feedBtn.innerHTML;
        feedBtn.innerHTML = `
            <span class="button-loading">
                <span class="spinner-small"></span>
                <span>处理中...</span>
            </span>
        `;
        
        try {
            const result = await API.post('/api/feed', {
                cat_id: this.currentCatId,
                user_name: '匿名用户'
            });
            
            if (result.success) {
                Toast.success(result.message);
                this.triggerFeedAnimation();
                
                // 更新显示
                if (typeof result.feed_count === 'number') {
                    const todayFeeds = document.getElementById('todayFeeds');
                    if (todayFeeds) todayFeeds.textContent = formatNumber(result.feed_count);
                    
                    const cat = this.getCatById(this.currentCatId);
                    if (cat) cat.feed_count = result.feed_count;
                }
                
                // 加载最新投喂记录
                this.loadFeedLogs(this.currentCatId);
            } else {
                Toast.error(result.message || '投喂失败');
            }
        } catch (error) {
            console.error('投喂失败:', error);
            Toast.error('投喂失败，请检查网络连接');
        } finally {
            // 恢复按钮状态
            const btn = document.getElementById('feedBtn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    },
    
    triggerFeedAnimation() {
        const animation = document.getElementById('feedAnimation');
        const liveCatEmoji = document.getElementById('liveCatEmoji');
        
        // 触发猫咪跳动动画
        if (liveCatEmoji) {
            liveCatEmoji.classList.remove('cat-bounce');
            void liveCatEmoji.offsetWidth; // 触发重绘
            liveCatEmoji.classList.add('cat-bounce');
        }
        
        // 创建粒子特效
        if (animation) {
            const particles = ['🍖', '❤️', '✨', '🐟', '💕', '🎉', '⭐'];
            const randomParticles = particles.sort(() => Math.random() - 0.5).slice(0, 5);
            
            animation.innerHTML = randomParticles.map((particle, index) => {
                const tx = (index - 2) * 30; // 水平分散
                const ty = -80 - Math.random() * 40; // 垂直向上
                return `<div class="feed-particle" style="--tx: ${tx}px; --ty: ${ty}px; --delay: ${index * 0.05}s">${particle}</div>`;
            }).join('');
            
            setTimeout(() => {
                animation.innerHTML = '';
            }, 1000);
        }
    },
    
    async loadFeedLogs(catId) {
        try {
            const logs = await API.get(`/api/feed-logs?cat_id=${catId}&limit=10`);
            const feedLogsEl = document.getElementById('feedLogs');
            
            if (feedLogsEl && logs.length > 0) {
                feedLogsEl.innerHTML = logs.map(log => `
                    <div class="log-item">
                        <span class="log-time">${formatTime(log.time)}</span>
                        <span class="log-user">${CatUI.escapeHtml(log.user_name || '匿名用户')}</span>
                        <span class="log-action">投喂了${CatUI.escapeHtml(this.getCatNameById(log.cat_id) || '猫咪')}</span>
                    </div>
                `).join('');
            } else if (feedLogsEl) {
                feedLogsEl.innerHTML = '<div class="log-empty">暂无投喂记录</div>';
            }
        } catch (error) {
            console.error('加载投喂记录失败:', error);
        }
    },
    
    getCatById(id) {
        return this.cats.find(cat => cat.id === id);
    },
    
    getCatNameById(id) {
        const cat = this.getCatById(id);
        return cat ? cat.name : '';
    },
    
    updateUrl(catId) {
        const url = new URL(window.location.href);
        url.searchParams.set('cat', String(catId));
        window.history.replaceState({}, '', url.toString());
    },
    
    startTimers() {
        // 在线观众模拟
        this.viewerTimer = setInterval(() => {
            const onlineViewers = document.getElementById('onlineViewers');
            if (onlineViewers) {
                let viewers = parseInt(onlineViewers.textContent.replace(/,/g, '')) || 1234;
                const change = Math.floor(Math.random() * 21) - 10;
                viewers = Math.max(100, viewers + change);
                onlineViewers.textContent = formatNumber(viewers);
            }
        }, 5000);
        
        // 环境监测模拟
        this.envTimer = setInterval(() => {
            const temperature = document.getElementById('temperature');
            const humidity = document.getElementById('humidity');
            
            if (temperature) {
                const temp = (20 + Math.random() * 4 - 2).toFixed(1);
                temperature.textContent = `${temp}°C`;
            }
            
            if (humidity) {
                const hum = Math.floor(55 + Math.random() * 10 - 5);
                humidity.textContent = `${hum}%`;
            }
        }, 10000);
    },
    
    destroy() {
        if (this.viewerTimer) clearInterval(this.viewerTimer);
        if (this.envTimer) clearInterval(this.envTimer);
    }
};

// ============================================
// 猫咪档案页模块
// ============================================

const CatsPage = {
    currentFilter: 'all',
    searchQuery: '',
    cats: [],
    
    async init() {
        this.cats = await CatStore.getCats();
        this.renderLeaderboard();
        this.render();
        this.bindEvents();
    },
    
    renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;
        
        // 按积分排序，取前 10 名
        const sortedCats = [...this.cats]
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 10);
        
        if (sortedCats.length === 0) {
            leaderboardList.innerHTML = '<div class="leaderboard-empty">暂无积分数据</div>';
            return;
        }
        
        leaderboardList.innerHTML = sortedCats.map((cat, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            
            return `
                <div class="leaderboard-item ${rankClass}">
                    <div class="leaderboard-rank">${rankIcon}</div>
                    <div class="leaderboard-cat-info">
                        <span class="leaderboard-cat-name">${CatUI.escapeHtml(cat.name)}</span>
                        <span class="leaderboard-cat-location">📍 ${CatUI.escapeHtml(cat.location)}</span>
                    </div>
                    <div class="leaderboard-points">
                        <span class="points-value">${formatNumber(cat.points || 0)}</span>
                        <span class="points-label">积分</span>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    render() {
        const grid = document.getElementById('catsGrid');
        if (!grid) return;
        
        const filtered = this.filterCats();
        grid.innerHTML = filtered.map(cat => CatUI.createCatCard(cat)).join('');
        
        // 显示/隐藏空状态
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🐱</div>
                    <p class="empty-text">没有找到匹配的猫咪</p>
                    <button class="empty-btn" onclick="CatsPage.resetFilter()">重置筛选</button>
                </div>
            `;
        }
    },
    
    filterCats() {
        return this.cats.filter(cat => {
            // 状态筛选
            const matchesFilter = this.currentFilter === 'all'
                || (this.currentFilter === 'adoption' && cat.adoption_ready)
                || (this.currentFilter === 'neutered' && cat.neutered);
            
            // 搜索筛选
            const searchAttrs = [cat.name, cat.nickname, cat.location, cat.color]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const matchesSearch = !this.searchQuery || searchAttrs.includes(this.searchQuery.toLowerCase());
            
            return matchesFilter && matchesSearch;
        });
    },
    
    bindEvents() {
        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
        
        // 搜索框（带防抖）
        const searchInput = document.getElementById('catsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchQuery = e.target.value;
                this.render();
            }, 300));
        }
        
        // 模态框关闭
        const modalClose = document.getElementById('modalClose');
        const modal = document.getElementById('catDetailModal');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => CatUI.hideDetail());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) CatUI.hideDetail();
            });
            
            // ESC 键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') CatUI.hideDetail();
            });
        }
    },
    
    resetFilter() {
        this.currentFilter = 'all';
        this.searchQuery = '';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
        const searchInput = document.getElementById('catsSearch');
        if (searchInput) searchInput.value = '';
        this.render();
    }
};

// ============================================
// 领养页面模块
// ============================================

const AdoptPage = {
    selectedCatId: null,
    
    async init() {
        const cats = await CatStore.getCats();
        const adoptableCats = cats.filter(cat => cat.adoption_ready);
        this.renderCats(adoptableCats);
        this.bindEvents();
        
        // 检查 URL 参数
        const urlParams = new URLSearchParams(window.location.search);
        const catId = parseInt(urlParams.get('cat') || '', 10);
        if (!isNaN(catId) && catId > 0) {
            const cat = cats.find(c => c.id === catId);
            if (cat && cat.adoption_ready) {
                this.openForm(catId);
            }
        }
    },
    
    renderCats(cats) {
        const grid = document.getElementById('adoptCatsGrid');
        if (!grid) return;
        
        if (cats.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏠</div>
                    <p class="empty-text">暂无可领养的猫咪</p>
                    <p class="empty-subtext">请关注后续更新，或考虑通过投喂支持它们</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = cats.map(cat => `
            <div class="cat-card adopt-card">
                <div class="cat-card-image" style="background: ${CatUI.getBackground(cat.color)}">
                    <div class="cat-avatar large">${CatUI.getEmoji(cat.color)}</div>
                    <div class="cat-status-badge adoption">🏠 可领养</div>
                </div>
                <div class="cat-card-info">
                    <h3 class="cat-name">${CatUI.escapeHtml(cat.name)}</h3>
                    <p class="cat-nickname">"${CatUI.escapeHtml(cat.nickname || '')}"</p>
                    <div class="cat-tags">
                        <span class="tag">${CatUI.getGenderText(cat.gender)} ${CatUI.escapeHtml(cat.age)}</span>
                        <span class="tag color">${CatUI.escapeHtml(cat.color)}</span>
                        ${cat.neutered ? '<span class="tag neutered">已绝育</span>' : ''}
                    </div>
                    <p class="cat-description">${CatUI.escapeHtml(cat.description || '')}</p>
                    <button class="adopt-apply-btn" onclick="AdoptPage.openForm(${cat.id})">
                        <span class="btn-icon">🏠</span>
                        <span>申请领养</span>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    openForm(catId) {
        this.selectedCatId = catId;
        const formSection = document.getElementById('formSection');
        if (formSection) {
            formSection.classList.add('show');
            // 阻止背景滚动
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeForm() {
        const formSection = document.getElementById('formSection');
        if (formSection) {
            formSection.classList.remove('show');
            // 恢复背景滚动
            document.body.style.overflow = '';
        }
        document.getElementById('adoptForm')?.reset();
        this.selectedCatId = null;
    },
    
    bindEvents() {
        const form = document.getElementById('adoptForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        const cancelBtn = document.getElementById('cancelBtn');
        const formClose = document.getElementById('formClose');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeForm());
        }
        
        if (formClose) {
            formClose.addEventListener('click', () => this.closeForm());
        }
    },
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.btn-submit');
        if (!submitBtn || submitBtn.disabled) return;
        
        const formData = {
            cat_id: this.selectedCatId,
            applicant: {
                name: document.getElementById('applicantName').value.trim(),
                age: parseInt(document.getElementById('applicantAge').value, 10),
                phone: document.getElementById('applicantPhone').value.trim(),
                email: document.getElementById('applicantEmail').value.trim(),
                housingType: document.getElementById('housingType').value,
                housingSize: document.getElementById('housingSize').value,
                familyAgree: document.getElementById('familyAgree').value,
                petExperience: document.getElementById('petExperience').value,
                previousPets: document.getElementById('previousPets').value.trim(),
                adoptionReason: document.getElementById('adoptionReason').value.trim()
            }
        };
        
        // 验证必填字段
        if (!formData.applicant.name || !formData.applicant.phone || !formData.applicant.adoptionReason) {
            Toast.warning('请填写姓名、电话与领养动机');
            return;
        }
        
        if (formData.applicant.age < 18 || formData.applicant.age > 120) {
            Toast.warning('年龄必须在 18-120 岁之间');
            return;
        }
        
        // 显示加载状态
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="button-loading"><span class="spinner-small"></span><span>提交中...</span></span>';
        
        try {
            const result = await API.post('/api/adoption', formData);
            
            if (result.success) {
                Toast.success('申请已提交，我们会尽快联系您！', 5000);
                this.closeForm();
            } else {
                Toast.error(result.message || '提交失败，请稍后重试');
            }
        } catch (error) {
            console.error('提交领养申请失败:', error);
            Toast.error('网络异常，请稍后重试');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-icon">📮</span><span>提交申请</span>';
        }
    }
};

// ============================================
// 分享功能模块
// ============================================

const ShareUI = {
    currentCat: null,
    modal: null,
    
    init() {
        // 创建分享弹窗
        this.createModal();
        
        // 绑定关闭事件
        this.bindEvents();
    },
    
    createModal() {
        const modalHtml = `
            <div class="share-modal" id="shareModal">
                <div class="share-modal-content">
                    <button class="share-modal-close" onclick="ShareUI.close()">&times;</button>
                    <div class="share-modal-header">
                        <h3>分享猫咪档案</h3>
                        <p>邀请更多人关注这只可爱的猫咪</p>
                    </div>
                    <div class="share-cat-preview">
                        <div class="share-cat-avatar" id="shareCatAvatar">🐱</div>
                        <div class="share-cat-name" id="shareCatName">猫咪名字</div>
                        <div class="share-cat-nickname" id="shareCatNickname">"昵称"</div>
                        <div class="share-cat-info">
                            <span id="shareCatGender">♂ 公</span>
                            <span id="shareCatAge">2 岁</span>
                            <span id="shareCatColor">橘色</span>
                        </div>
                    </div>
                    <div class="share-options">
                        <div class="share-option" onclick="ShareUI.shareWechat()">
                            <span class="share-option-icon">💬</span>
                            <span class="share-option-label">微信</span>
                        </div>
                        <div class="share-option" onclick="ShareUI.shareWeibo()">
                            <span class="share-option-icon">🌸</span>
                            <span class="share-option-label">微博</span>
                        </div>
                        <div class="share-option" onclick="ShareUI.shareQQ()">
                            <span class="share-option-icon">🐧</span>
                            <span class="share-option-label">QQ</span>
                        </div>
                        <div class="share-option" onclick="ShareUI.copyLink()">
                            <span class="share-option-icon">🔗</span>
                            <span class="share-option-label">复制链接</span>
                        </div>
                    </div>
                    <div class="share-link-section">
                        <label class="share-link-label">分享链接</label>
                        <div class="share-link-container">
                            <input type="text" class="share-link-input" id="shareLinkInput" readonly>
                            <button class="share-link-btn" onclick="ShareUI.copyLink()">复制</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('shareModal');
    },
    
    bindEvents() {
        if (!this.modal) return;
        
        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        
        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('show')) {
                this.close();
            }
        });
    },
    
    async shareCat(catId) {
        try {
            const cat = await API.get(`/api/cat/${catId}`);
            this.currentCat = cat;
            
            // 更新弹窗内容
            this.updatePreview(cat);
            this.updateLink(catId);
            
            // 显示弹窗
            this.modal?.classList.add('show');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('加载猫咪数据失败:', error);
            Toast.error('加载猫咪信息失败');
        }
    },
    
    updatePreview(cat) {
        if (!cat) return;
        
        document.getElementById('shareCatAvatar').textContent = CatUI.getEmoji(cat.color);
        document.getElementById('shareCatName').textContent = CatUI.escapeHtml(cat.name);
        document.getElementById('shareCatNickname').textContent = `"${CatUI.escapeHtml(cat.nickname || '')}"`;
        document.getElementById('shareCatGender').textContent = CatUI.getGenderText(cat.gender);
        document.getElementById('shareCatAge').textContent = CatUI.escapeHtml(cat.age);
        document.getElementById('shareCatColor').textContent = CatUI.escapeHtml(cat.color);
    },
    
    updateLink(catId) {
        const link = `${window.location.origin}/cats?cat=${catId}`;
        const input = document.getElementById('shareLinkInput');
        if (input) input.value = link;
    },
    
    close() {
        this.modal?.classList.remove('show');
        document.body.style.overflow = '';
        this.currentCat = null;
    },
    
    async copyLink() {
        const input = document.getElementById('shareLinkInput');
        if (!input) return;
        
        try {
            await navigator.clipboard.writeText(input.value);
            Toast.success('链接已复制到剪贴板');
        } catch (error) {
            // 降级方案
            input.select();
            document.execCommand('copy');
            Toast.success('链接已复制到剪贴板');
        }
    },
    
    shareWechat() {
        Toast.warning('微信分享需在移动端使用');
        // 实际实现可以使用微信 JS-SDK
    },
    
    shareWeibo() {
        if (!this.currentCat) return;
        const text = `快来看看这只可爱的猫咪：${this.currentCat.name}！${this.currentCat.nickname ? `"${this.currentCat.nickname}"` : ''} 在 项目猫 等你来看~`;
        const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    },
    
    shareQQ() {
        if (!this.currentCat) return;
        const title = `可爱的猫咪：${this.currentCat.name}`;
        const url = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(title)}`;
        window.open(url, '_blank');
    }
};

// ============================================
// 数据统计可视化模块
// ============================================

const StatsDashboard = {
    charts: {},
    
    init() {
        this.renderStatsCards();
        this.renderCharts();
        this.bindEvents();
    },
    
    async renderStatsCards() {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;
        
        try {
            const stats = await API.get('/api/stats');
            
            statsGrid.innerHTML = `
                <div class="stat-card primary">
                    <span class="stat-icon">🐱</span>
                    <div class="stat-info">
                        <span class="stat-value">${formatNumber(stats.total_cats || 0)}</span>
                        <span class="stat-label">猫咪总数</span>
                    </div>
                </div>
                <div class="stat-card success">
                    <span class="stat-icon">❤️</span>
                    <div class="stat-info">
                        <span class="stat-value">${formatNumber(stats.total_feeds || 0)}</span>
                        <span class="stat-label">累计投喂</span>
                    </div>
                </div>
                <div class="stat-card warning">
                    <span class="stat-icon">👁️</span>
                    <div class="stat-info">
                        <span class="stat-value">${formatNumber(stats.total_views || 0)}</span>
                        <span class="stat-label">累计观看</span>
                    </div>
                </div>
                <div class="stat-card info">
                    <span class="stat-icon">🏠</span>
                    <div class="stat-info">
                        <span class="stat-value">${formatNumber(stats.adoptable_cats || 0)}</span>
                        <span class="stat-label">可领养</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('加载统计数据失败:', error);
            statsGrid.innerHTML = '<div class="stat-card"><span class="stat-icon">❌</span><div class="stat-info"><span class="stat-value">-</span><span class="stat-label">数据加载失败</span></div></div>';
        }
    },
    
    async renderCharts() {
        const feedChartCanvas = document.getElementById('feedChart');
        const pointsChartCanvas = document.getElementById('pointsChart');
        
        if (!feedChartCanvas && !pointsChartCanvas) return;
        
        try {
            // 获取历史数据
            const feedData = await API.get('/api/stats/feed-history');
            const pointsData = await API.get('/api/stats/points-history');
            
            // 渲染投喂趋势图
            if (feedChartCanvas && typeof Chart !== 'undefined') {
                this.renderFeedChart(feedChartCanvas, feedData);
            }
            
            // 渲染积分趋势图
            if (pointsChartCanvas && typeof Chart !== 'undefined') {
                this.renderPointsChart(pointsChartCanvas, pointsData);
            }
        } catch (error) {
            console.error('加载图表数据失败:', error);
            // 使用模拟数据展示
            this.renderChartsWithMockData();
        }
    },
    
    renderFeedChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        
        // 销毁旧图表
        if (this.charts.feedChart) {
            this.charts.feedChart.destroy();
        }
        
        const labels = data?.labels || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const values = data?.values || [120, 150, 180, 140, 200, 250, 220];
        
        this.charts.feedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '投喂次数',
                    data: values,
                    borderColor: '#ff8fb0',
                    backgroundColor: 'rgba(255, 143, 176, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#ff8fb0',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#8e8e8e',
                            font: { size: 12 }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#8e8e8e',
                            font: { size: 12 },
                            beginAtZero: true
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },
    
    renderPointsChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        
        // 销毁旧图表
        if (this.charts.pointsChart) {
            this.charts.pointsChart.destroy();
        }
        
        // 修复：默认数据只有 4 只猫，与 data.json 一致
        const labels = data?.labels || ['咪咪', '小黑', '雪球', '大橘'];
        const values = data?.values || [193, 90, 237, 314];
        
        this.charts.pointsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '积分',
                    data: values,
                    backgroundColor: [
                        'rgba(255, 143, 176, 0.8)',
                        'rgba(135, 206, 250, 0.8)',
                        'rgba(255, 215, 0, 0.8)',
                        'rgba(139, 225, 219, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 143, 176, 1)',
                        'rgba(135, 206, 250, 1)',
                        'rgba(255, 215, 0, 1)',
                        'rgba(139, 225, 219, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#8e8e8e',
                            font: { size: 12 }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#8e8e8e',
                            font: { size: 12 },
                            beginAtZero: true
                        }
                    }
                }
            }
        });
    },
    
    renderChartsWithMockData() {
        const feedChartCanvas = document.getElementById('feedChart');
        const pointsChartCanvas = document.getElementById('pointsChart');
        
        // 模拟数据
        const mockFeedData = {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            values: [120, 150, 180, 140, 200, 250, 220]
        };
        
        // 修复：只有 4 只猫，对应 4 个数据
        const mockPointsData = {
            labels: ['咪咪', '小黑', '雪球', '大橘'],
            values: [193, 90, 237, 314]
        };
        
        if (feedChartCanvas && typeof Chart !== 'undefined') {
            this.renderFeedChart(feedChartCanvas, mockFeedData);
        }
        
        if (pointsChartCanvas && typeof Chart !== 'undefined') {
            this.renderPointsChart(pointsChartCanvas, mockPointsData);
        }
    },
    
    bindEvents() {
        // 时间段切换按钮
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const period = btn.dataset.period;
                this.updateChartData(period);
            });
        });
    },
    
    async updateChartData(period) {
        try {
            const feedData = await API.get(`/api/stats/feed-history?period=${period}`);
            const pointsData = await API.get(`/api/stats/points-history?period=${period}`);
            
            const feedChartCanvas = document.getElementById('feedChart');
            const pointsChartCanvas = document.getElementById('pointsChart');
            
            if (feedChartCanvas && typeof Chart !== 'undefined') {
                this.renderFeedChart(feedChartCanvas, feedData);
            }
            
            if (pointsChartCanvas && typeof Chart !== 'undefined') {
                this.renderPointsChart(pointsChartCanvas, pointsData);
            }
        } catch (error) {
            console.error('更新图表数据失败:', error);
        }
    }
};

// ============================================
// 消息通知系统模块
// ============================================

const NotificationCenter = {
    notifications: [],
    unreadCount: 0,
    currentTab: 'all',
    
    init() {
        this.renderNotifications();
        this.bindEvents();
        this.startPolling();
    },
    
    async renderNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;
        
        try {
            this.notifications = await API.get('/api/notifications');
            this.updateUnreadCount();
        } catch (error) {
            console.error('加载通知失败:', error);
            this.notifications = this.getMockNotifications();
        }
        
        this.displayNotifications();
    },
    
    getMockNotifications() {
        return [
            {
                id: 1,
                type: 'activity',
                title: '新投喂记录',
                message: '用户"爱猫人"刚刚给小黑猫投喂了美食',
                time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                unread: true
            },
            {
                id: 2,
                type: 'system',
                title: '系统通知',
                message: '猫咪档案系统已升级，新增积分功能',
                time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
                unread: true
            },
            {
                id: 3,
                type: 'reminder',
                title: '绝育提醒',
                message: '小白猫距离绝育手术还有 3 天',
                time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
                unread: false
            },
            {
                id: 4,
                type: 'activity',
                title: '领养进展',
                message: '小花猫的领养申请已进入审核阶段',
                time: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
                unread: false
            },
            {
                id: 5,
                type: 'system',
                title: '维护通知',
                message: '系统将于本周日凌晨 2 点进行例行维护',
                time: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
                unread: false
            }
        ];
    },
    
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => n.unread).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = this.unreadCount > 0 ? String(this.unreadCount) : '';
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    },
    
    displayNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;
        
        const filtered = this.currentTab === 'all' 
            ? this.notifications 
            : this.notifications.filter(n => n.type === this.currentTab);
        
        if (filtered.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon">🔔</div>
                    <p>暂无通知</p>
                </div>
            `;
            return;
        }
        
        notificationList.innerHTML = filtered.map(notification => `
            <div class="notification-item ${notification.unread ? 'unread' : ''}" onclick="NotificationCenter.markAsRead(${notification.id})">
                <div class="notification-icon-badge ${notification.type}">
                    ${this.getIconByType(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                    <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                    <div class="notification-time">${formatTime(notification.time)}</div>
                </div>
                ${notification.unread ? '<div class="notification-dot"></div>' : ''}
            </div>
        `).join('');
    },
    
    getIconByType(type) {
        const icons = {
            system: '⚙️',
            activity: '❤️',
            reminder: '⏰'
        };
        return icons[type] || 'ℹ️';
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    bindEvents() {
        // 通知标签切换
        document.querySelectorAll('.notification-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.type;
                this.displayNotifications();
            });
        });
        
        // 标记已读按钮
        const markReadBtn = document.getElementById('markAllRead');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => this.markAllAsRead());
        }
    },
    
    async markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && notification.unread) {
            notification.unread = false;
            this.updateUnreadCount();
            this.displayNotifications();
            
            try {
                await API.post('/api/notifications/read', { id });
            } catch (error) {
                console.error('标记已读失败:', error);
            }
        }
    },
    
    async markAllAsRead() {
        this.notifications.forEach(n => n.unread = false);
        this.updateUnreadCount();
        this.displayNotifications();
        
        try {
            await API.post('/api/notifications/read-all');
            Toast.success('所有通知已标记为已读');
        } catch (error) {
            console.error('批量标记已读失败:', error);
        }
    },
    
    startPolling() {
        // 每 30 秒轮询一次新通知
        setInterval(async () => {
            try {
                const newNotifications = await API.get('/api/notifications/unread-count');
                if (newNotifications.count > this.unreadCount) {
                    this.notifications = await API.get('/api/notifications');
                    this.updateUnreadCount();
                    
                    // 显示新通知提示
                    if (newNotifications.count - this.unreadCount > 0) {
                        Toast.success(`收到 ${newNotifications.count - this.unreadCount} 条新通知`);
                    }
                }
            } catch (error) {
                console.error('轮询通知失败:', error);
            }
        }, 30000);
    },
    
    showNotification(title, message, type = 'system') {
        // 显示浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/static/icons/logo.png',
                badge: '/static/icons/badge.png'
            });
        }
        
        // 同时显示 Toast
        Toast.show(`${title}: ${message}`, 5000, type === 'reminder' ? 'warning' : 'info');
    },
    
    requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
};

// ============================================
// 举报系统模块
// ============================================

const ReportSystem = {
    modal: null,
    currentCatId: null,
    
    init() {
        this.modal = document.getElementById('reportModal');
        this.bindEvents();
    },
    
    bindEvents() {
        // 关闭模态框
        if (this.modal) {
            const closeBtn = this.modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
    },
    
    open(catId, catName = '') {
        this.currentCatId = catId;
        const modalTitle = this.modal?.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = `举报 - ${catName || '猫咪'}`;
        }
        this.modal?.classList.add('active');
    },
    
    close() {
        this.modal?.classList.remove('active');
        this.currentCatId = null;
        // 重置表单
        const form = document.getElementById('reportForm');
        if (form) form.reset();
    },
    
    async submit(formData) {
        if (!this.currentCatId) {
            Toast.error('举报对象无效');
            return;
        }
        
        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cat_id: this.currentCatId,
                    report_type: formData.reportType,
                    description: formData.description,
                    reporter_name: formData.reporterName,
                    reporter_contact: formData.reporterContact,
                    is_emergency: formData.isEmergency
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                Toast.success(result.message);
                this.close();
                // 如果是紧急事件，刷新紧急警报
                if (formData.isEmergency && typeof EmergencyAlerts !== 'undefined') {
                    EmergencyAlerts.fetchAlerts();
                }
            } else {
                Toast.error(result.message || '举报失败');
            }
        } catch (error) {
            console.error('提交举报失败:', error);
            Toast.error('网络错误，请稍后重试');
        }
    }
};

// ============================================
// 志愿者认证模块
// ============================================

const VolunteerAuth = {
    modal: null,
    currentVolunteer: null,
    
    init() {
        this.modal = document.getElementById('volunteerModal');
        this.bindEvents();
    },
    
    bindEvents() {
        if (this.modal) {
            const closeBtn = this.modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
    },
    
    open() {
        this.modal?.classList.add('active');
    },
    
    close() {
        this.modal?.classList.remove('active');
        const form = document.getElementById('volunteerForm');
        if (form) form.reset();
    },
    
    async submit(formData) {
        try {
            const response = await fetch('/api/volunteer/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                Toast.success(result.message);
                this.close();
            } else {
                Toast.error(result.message || '申请失败');
            }
        } catch (error) {
            console.error('提交志愿者申请失败:', error);
            Toast.error('网络错误，请稍后重试');
        }
    },
    
    async fetchVolunteers() {
        try {
            const response = await fetch('/api/volunteers');
            const volunteers = await response.json();
            return volunteers;
        } catch (error) {
            console.error('获取志愿者列表失败:', error);
            return [];
        }
    }
};

// ============================================
// 紧急求助模块
// ============================================

const EmergencyAlerts = {
    alerts: [],
    pollingInterval: null,
    
    init() {
        this.fetchAlerts();
        // 每 30 秒轮询一次紧急求助
        this.pollingInterval = setInterval(() => this.fetchAlerts(), 30000);
    },
    
    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    },
    
    async fetchAlerts() {
        try {
            const response = await fetch('/api/emergency/alerts?status=active');
            this.alerts = await response.json();
            this.render();
        } catch (error) {
            console.error('获取紧急求助失败:', error);
        }
    },
    
    render() {
        const container = document.getElementById('emergencyAlerts');
        if (!container) return;
        
        if (this.alerts.length === 0) {
            container.innerHTML = '<div class="no-alerts">暂无紧急求助</div>';
            return;
        }
        
        container.innerHTML = this.alerts.map(alert => `
            <div class="emergency-alert ${alert.type === 'injury' ? 'injury' : alert.type === 'abuse' ? 'abuse' : ''}">
                <div class="alert-header">
                    <span class="alert-icon">${alert.type === 'injury' ? '🚨' : alert.type === 'abuse' ? '😡' : '⚠️'}</span>
                    <span class="alert-cat">${this.escapeHtml(alert.cat_name || '未知猫咪')}</span>
                    <span class="alert-location">📍 ${this.escapeHtml(alert.location || '位置未知')}</span>
                </div>
                <div class="alert-body">
                    ${this.escapeHtml(alert.description || '')}
                </div>
                <div class="alert-footer">
                    <span class="alert-time">${this.formatTime(alert.time)}</span>
                    <button class="alert-respond-btn" onclick="EmergencyAlerts.respond(${alert.id})">
                        前往救助
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    formatTime(timeString) {
        if (!timeString) return '';
        try {
            const now = new Date();
            const normalized = typeof timeString === 'string' 
                ? timeString.replace(' ', 'T') 
                : timeString;
            const time = new Date(normalized);
            if (isNaN(time.getTime())) return '';
            const diff = now - time;
            const minute = 60 * 1000;
            const hour = 60 * minute;
            const day = 24 * hour;
            if (diff < minute) return '刚刚';
            if (diff < hour) return Math.floor(diff / minute) + '分钟前';
            if (diff < day) return Math.floor(diff / hour) + '小时前';
            return time.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    },
    
    respond(alertId) {
        Toast.success('已记录您的响应，请尽快前往救助！');
        // 可以进一步实现导航到猫咪位置等功能
    }
};

// ============================================
// 表单验证工具模块
// ============================================

const FormValidator = {
    // 手机号验证
    validatePhone(phone) {
        const regex = /^1[3-9]\d{9}$/;
        return regex.test(phone);
    },
    
    // 邮箱验证
    validateEmail(email) {
        if (!email) return true; // 邮箱非必填
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    // 年龄验证
    validateAge(age) {
        return age >= 18 && age <= 120;
    },
    
    // 显示验证错误
    showError(input, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        
        // 移除已有的错误提示
        this.clearError(input);
        
        // 创建错误提示元素
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = message;
        formGroup.appendChild(errorEl);
        
        // 添加错误样式
        input.classList.add('input-error');
    },
    
    // 显示验证成功
    showSuccess(input, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        
        // 移除已有的错误提示
        this.clearError(input);
        
        // 创建成功提示元素
        const successEl = document.createElement('div');
        successEl.className = 'form-success';
        successEl.textContent = message || '✓';
        formGroup.appendChild(successEl);
    },
    
    // 清除验证提示
    clearError(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        
        const existingError = formGroup.querySelector('.form-error');
        const existingSuccess = formGroup.querySelector('.form-success');
        
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
        
        input.classList.remove('input-error');
    },
    
    // 绑定实时验证
    bindValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // 手机号验证
        const phoneInput = form.querySelector('#applicantPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (!value) {
                    this.clearError(phoneInput);
                    return;
                }
                if (this.validatePhone(value)) {
                    this.showSuccess(phoneInput, '✓ 手机号格式正确');
                } else if (value.length >= 11) {
                    this.showError(phoneInput, '✗ 手机号格式不正确');
                }
            });
            
            phoneInput.addEventListener('blur', (e) => {
                const value = e.target.value.trim();
                if (value && !this.validatePhone(value)) {
                    this.showError(phoneInput, '✗ 请输入正确的手机号');
                }
            });
        }
        
        // 邮箱验证
        const emailInput = form.querySelector('#applicantEmail');
        if (emailInput) {
            emailInput.addEventListener('blur', (e) => {
                const value = e.target.value.trim();
                if (!value) {
                    this.clearError(emailInput);
                    return;
                }
                if (!this.validateEmail(value)) {
                    this.showError(emailInput, '✗ 邮箱格式不正确');
                } else {
                    this.showSuccess(emailInput, '✓');
                }
            });
        }
        
        // 年龄验证
        const ageInput = form.querySelector('#applicantAge');
        if (ageInput) {
            ageInput.addEventListener('blur', (e) => {
                const value = parseInt(e.target.value, 10);
                if (isNaN(value)) {
                    this.clearError(ageInput);
                    return;
                }
                if (!this.validateAge(value)) {
                    this.showError(ageInput, '✗ 年龄必须在 18-120 之间');
                } else {
                    this.showSuccess(ageInput, '✓');
                }
            });
        }
        
        // 姓名验证
        const nameInput = form.querySelector('#applicantName');
        if (nameInput) {
            nameInput.addEventListener('blur', (e) => {
                const value = e.target.value.trim();
                if (!value) {
                    this.clearError(nameInput);
                    return;
                }
                if (value.length < 2) {
                    this.showError(nameInput, '✗ 姓名至少 2 个字符');
                } else {
                    this.showSuccess(nameInput, '✓');
                }
            });
        }
    }
};

// ============================================
// 滚动动画观察器模块
// ============================================

const ScrollAnimations = {
    observer: null,
    
    init() {
        // 创建 IntersectionObserver
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // 只触发一次
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // 观察所有带动画类的元素
        this.observeElements();
    },
    
    observeElements() {
        // 观察淡入元素
        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
            this.observer.observe(el);
        });
    },
    
    // 添加新的观察元素
    observe(el) {
        if (el) {
            this.observer.observe(el);
        }
    },
    
    // 销毁观察器
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
};

// ============================================
// Service Worker 注册
// ============================================

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => {
                console.log('Service Worker 注册成功:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker 注册失败:', error);
            });
    }
}

// ============================================
// 页面初始化
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Service Worker 注册
    registerServiceWorker();
    // Toast 初始化
    Toast.init();
    
    // 深色模式初始化
    DarkMode.init();
    
    // 绑定深色模式切换按钮事件
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => DarkMode.toggle());
    }
    
    // 分享功能初始化
    ShareUI.init();
    
    // 数据统计初始化（在首页显示）
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
        StatsDashboard.init();
    }
    
    // 通知中心初始化（在所有页面）
    NotificationCenter.init();
    NotificationCenter.requestPermission();
    
    // 表单验证初始化（在领养页面）
    if (path === '/adopt' || path === '/adopt.html' || path === '/adopt/') {
        FormValidator.bindValidation('adoptForm');
    }
    
    // 滚动动画初始化（在所有页面）
    ScrollAnimations.init();
    
    // 根据页面初始化对应模块
    if (path === '/' || path === '/index.html') {
        // 直播间页面
        LiveRoom.init();
    } else if (path === '/cats' || path === '/cats.html' || path === '/cats/') {
        // 猫咪档案页面
        CatsPage.init();
    } else if (path === '/adopt' || path === '/adopt.html' || path === '/adopt/') {
        // 领养页面
        AdoptPage.init();
    }
    
    // 全局错误处理
    window.addEventListener('error', (e) => {
        console.error('全局错误:', e.error);
    });
    
    // 未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (e) => {
        console.error('未处理的 Promise 拒绝:', e.reason);
    });
});
