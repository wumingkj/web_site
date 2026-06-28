/**
 * Wuming Blog - 公共函数库
 */

const WumingBlog = {
    /**
     * 发送 API 请求
     */
    async fetchAPI(endpoint, options = {}) {
        try {
            const url = '/blog/api' + endpoint;
            const response = await fetch(url, {
                ...options,
                credentials: 'same-origin',  // 确保发送 cookie
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', endpoint, error);
            return null;
        }
    },

    /**
     * 数字递增动画
     */
    animateNumber(element, target, duration = 1000) {
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            element.textContent = target >= 1000 
                ? (current / 1000).toFixed(1) + 'k'
                : Math.floor(current);
        }, 16);
    },

    /**
     * 初始化移动端菜单
     */
    initMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (!menuToggle || !mobileSidebar || !sidebarOverlay) return;

        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileSidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            document.body.style.overflow = mobileSidebar.classList.contains('active') ? 'hidden' : '';
        });

        sidebarOverlay.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        // 点击导航链接后关闭侧边栏
        const sidebarNavItems = mobileSidebar.querySelectorAll('.sidebar-nav-item');
        sidebarNavItems.forEach(item => {
            item.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileSidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    },

    /**
     * 创建飘落元素
     */
    createFallingElements() {
        const elements = ['✨', '💫', '⭐', '🌟', '💎', '🔮', '❄️'];

        const create = () => {
            const el = document.createElement('div');
            el.className = 'falling-element';
            el.innerHTML = elements[Math.floor(Math.random() * elements.length)];

            el.style.cssText = `
                left: ${Math.random() * 100}vw;
                font-size: ${10 + Math.random() * 15}px;
                animation-duration: ${5 + Math.random() * 5}s;
                opacity: ${0.3 + Math.random() * 0.4};
            `;

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 10000);
        };

        setInterval(create, 600);
        for (let i = 0; i < 5; i++) setTimeout(create, i * 200);
    },

    /**
     * 创建点击彩虹粒子效果
     */
    createClickEffect() {
        const colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#da77f2'];

        document.addEventListener('click', (e) => {
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = 4 + Math.random() * 4;
                const angle = (i / 8) * Math.PI * 2;
                const velocity = 50 + Math.random() * 30;

                particle.style.cssText = `
                    position: fixed;
                    left: ${e.clientX}px;
                    top: ${e.clientY}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    animation: particle-fly 0.8s ease-out forwards;
                    --tx: ${Math.cos(angle) * velocity}px;
                    --ty: ${Math.sin(angle) * velocity}px;
                `;

                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 800);
            }
        });

        if (!document.getElementById('particle-style')) {
            const style = document.createElement('style');
            style.id = 'particle-style';
            style.textContent = `
                @keyframes particle-fly {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    },

    /**
     * 创建二次元鼠标拖尾效果
     */
    createMouseTrail() {
        // 二次元风格元素
        const particles = ['✨', '⭐', '💫', '🌟', '♡', '❀', '❁', '✧', '･ﾟ✧'];
        const colors = ['#ffb7c5', '#ffc0cb', '#e0bfff', '#b0e0e6', '#ffd1dc', '#c8a2c8'];
        
        // 添加样式
        if (!document.getElementById('trail-style')) {
            const style = document.createElement('style');
            style.id = 'trail-style';
            style.textContent = `
                .trail-particle {
                    position: fixed !important;
                    pointer-events: none !important;
                    z-index: 99999 !important;
                    animation: trail-fade 0.8s ease-out forwards !important;
                    font-size: 14px !important;
                    opacity: 0.8;
                }
                @keyframes trail-fade {
                    0% { opacity: 0.8; transform: scale(1) translateY(0); }
                    100% { opacity: 0; transform: scale(0.2) translateY(-30px); }
                }
            `;
            document.head.appendChild(style);
        }

        let lastTime = 0;

        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastTime < 40) return; // 提高频率
            lastTime = now;

            // 30% 概率生成粒子（更密集）
            if (Math.random() > 0.7) return;

            const particle = document.createElement('span');
            particle.className = 'trail-particle';
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            particle.style.left = (e.clientX + (Math.random() - 0.5) * 15) + 'px';
            particle.style.top = (e.clientY + (Math.random() - 0.5) * 15) + 'px';
            particle.style.color = colors[Math.floor(Math.random() * colors.length)];
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        });
    },

    /**
     * 显示错误消息
     */
    showError(container, message = '加载失败') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (container) {
            container.innerHTML = `
                <article class="post-card">
                    <div class="post-header">
                        <span class="post-title">哎呀，${message} (╯°□°)╯</span>
                    </div>
                    <p class="post-excerpt">请刷新页面试试，如果问题持续存在，请联系管理员。</p>
                </article>
            `;
        }
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 淡入动画
     */
    fadeIn(elements) {
        elements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('fade-in');
        });
    },

    /**
     * 获取管理员头像（公开）
     * 直接读取静态 JSON 文件，不走 PHP API，速度更快
     */
    async loadAdminAvatar() {
        // 先尝试从缓存加载（立即显示）
        const cachedAvatar = localStorage.getItem('adminAvatar');
        const cachedUsername = localStorage.getItem('adminUsername');
        const cacheTime = localStorage.getItem('adminAvatarTime');
        
        if (cachedAvatar && cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
            // 缓存未过期（24小时内）
            WumingBlog.adminAvatar = cachedAvatar;
            WumingBlog.adminUsername = cachedUsername || 'Wuming';
            WumingBlog.updateAdminAvatarUI();
        } else {
            // 缓存过期或不存在，先用默认头像
            WumingBlog.updateAdminAvatarUI();
        }

        // 直接读取静态 JSON 文件（不经过 PHP，速度更快）
        fetch('/blog/data/admin_info.json?t=' + Date.now())
            .then(res => res.json())
            .then(data => {
                if (data.success && data.admin) {
                    WumingBlog.adminAvatar = data.admin.avatar;
                    WumingBlog.adminUsername = data.admin.username;
                    // 缓存到 localStorage
                    localStorage.setItem('adminAvatar', data.admin.avatar);
                    localStorage.setItem('adminUsername', data.admin.username);
                    localStorage.setItem('adminAvatarTime', Date.now().toString());
                    // 更新 UI
                    WumingBlog.updateAdminAvatarUI();
                }
            })
            .catch(() => console.log('获取管理员信息失败'));
    },

    /**
     * 更新所有显示 admin 头像的地方
     */
    updateAdminAvatarUI() {
        const avatar = WumingBlog.adminAvatar || '💫';
        
        // 更新 Hero 区域头像
        const heroAvatar = document.querySelector('.hero-avatar');
        if (heroAvatar) {
            if (avatar.startsWith('data:image') || avatar.startsWith('/blog/data/avatars') || avatar.startsWith('/data/avatars')) {
                heroAvatar.innerHTML = `<img src="${avatar}" alt="avatar">`;
            } else {
                heroAvatar.textContent = avatar;
            }
        }
        
        // 更新移动端侧边栏头像（非登录状态）
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (mobileSidebar && !WumingBlog.currentUser) {
            const sidebarAvatar = mobileSidebar.querySelector('.sidebar-header .sidebar-avatar');
            if (sidebarAvatar && !sidebarAvatar.classList.contains('user-link')) {
                if (avatar.startsWith('data:image') || avatar.startsWith('/blog/data/avatars') || avatar.startsWith('/data/avatars')) {
                    sidebarAvatar.innerHTML = `<img src="${avatar}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">`;
                } else {
                    sidebarAvatar.textContent = avatar;
                }
            }
        }
    },

    /**
     * 初始化登录状态
     */
    async initAuthStatus() {
        // 异步加载管理员头像（不阻塞登录检查）
        WumingBlog.loadAdminAvatar().catch(() => {});
        
        try {
            const res = await fetch('/blog/api/auth.php?action=check', {
                credentials: 'same-origin'
            });
            const data = await res.json();
            
            if (data.loggedin && data.user) {
                WumingBlog.currentUser = data.user;
                WumingBlog.updateAuthUI(data.user);
            }
        } catch (err) {
            console.log('未登录');
        }
    },

    /**
     * 渲染头像（支持表情和图片）
     */
    renderAvatar(avatar, size = 20) {
        if (!avatar) return '👤';
        if (avatar.startsWith('data:image') || avatar.startsWith('/blog/data/avatars') || avatar.startsWith('/data/avatars')) {
            return `<img src="${avatar}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;vertical-align:middle;">`;
        }
        return avatar;
    },

    /**
     * 更新登录状态UI
     */
    updateAuthUI(user) {
        // 更新桌面端导航 - 替换登录链接为用户信息
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const loginLink = navLinks.querySelector('a[href="/blog/pages/login.html"]');
            if (loginLink) {
                // 替换为用户信息
                const userLink = document.createElement('a');
                userLink.href = '/blog/pages/profile.html';
                userLink.className = 'user-link';
                userLink.innerHTML = `${WumingBlog.renderAvatar(user.avatar)} ${user.username}`;
                loginLink.replaceWith(userLink);
            }
            
            // 管理员添加后台入口（不在管理页面时）
            if (user.role === 'admin' && !navLinks.querySelector('.admin-link') && !document.body.classList.contains('admin-page')) {
                const adminLink = document.createElement('a');
                adminLink.href = '/blog/pages/admin.html';
                adminLink.className = 'admin-link';
                adminLink.innerHTML = '⚙️ 管理';
                adminLink.style.background = 'var(--gradient-primary)';
                adminLink.style.color = 'white';
                adminLink.style.padding = '8px 16px';
                adminLink.style.borderRadius = '20px';
                navLinks.appendChild(adminLink);
            }
        }
        
        // 更新移动端侧边栏
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (mobileSidebar) {
            const sidebarNav = mobileSidebar.querySelector('.sidebar-nav');
            if (sidebarNav) {
                const loginItem = sidebarNav.querySelector('a[href="/blog/pages/login.html"]');
                if (loginItem) {
                    // 替换为个人中心
                    const profileItem = document.createElement('a');
                    profileItem.href = '/blog/pages/profile.html';
                    profileItem.className = 'sidebar-nav-item';
                    profileItem.innerHTML = `<span>${WumingBlog.renderAvatar(user.avatar, 24)}</span> ${user.username}`;
                    loginItem.replaceWith(profileItem);
                }
                
                // 管理员添加后台入口（不在管理页面时）
                if (user.role === 'admin' && !sidebarNav.querySelector('.admin-link') && !document.body.classList.contains('admin-page')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = '/blog/pages/admin.html';
                    adminLink.className = 'sidebar-nav-item admin-link';
                    adminLink.innerHTML = '<span>⚙️</span> 管理';
                    sidebarNav.appendChild(adminLink);
                }
            }
            
            // 更新侧边栏头部显示用户信息
            const sidebarHeader = mobileSidebar.querySelector('.sidebar-header');
            if (sidebarHeader) {
                const sidebarAvatar = sidebarHeader.querySelector('.sidebar-avatar');
                const sidebarName = sidebarHeader.querySelector('h3');
                if (sidebarAvatar) {
                    // 判断是否是图片
                    if (user.avatar && (user.avatar.startsWith('data:image') || user.avatar.startsWith('/blog/data/avatars') || user.avatar.startsWith('/data/avatars'))) {
                        sidebarAvatar.innerHTML = `<img src="${user.avatar}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">`;
                    } else {
                        sidebarAvatar.textContent = user.avatar || '👤';
                    }
                }
                if (sidebarName) sidebarName.textContent = user.username;
            }
        }
    },

    /**
     * 页面离开/返回标题切换
     */
    initTitleSwitch() {
        const originalTitle = document.title;
        const leaveTitle = '(´・ω・`) 别走啊，再逛逛~';
        let titleTimer = null;

        // 使用 visibilitychange 和 blur 双重检测
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                titleTimer = setTimeout(() => {
                    document.title = leaveTitle;
                }, 500);
            } else {
                if (titleTimer) clearTimeout(titleTimer);
                document.title = originalTitle;
            }
        });

        // 鼠标离开窗口时触发
        document.addEventListener('mouseleave', () => {
            if (!document.hidden) {
                document.title = leaveTitle;
            }
        });

        // 鼠标回到窗口
        document.addEventListener('mouseenter', () => {
            document.title = originalTitle;
        });
    },

    /**
     * 简单 Markdown 解析（用于公告等）
     */
    parseMarkdown(text) {
        if (!text) return '';
        
        // 转义 HTML
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // 代码块 ```code```
        html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;overflow-x:auto;margin:12px 0;font-family:monospace;font-size:0.9em;"><code>${code.trim()}</code></pre>`;
        });
        
        // 分割行处理
        const lines = html.split('\n');
        const processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // 标题 ### ## #
            if (/^#{1,3}\s/.test(line)) {
                const level = line.match(/^(#{1,3})\s/)[1].length;
                const content = line.replace(/^#{1,3}\s+/, '');
                const sizes = { 1: '1.8em', 2: '1.4em', 3: '1.2em' };
                processedLines.push(`<h${level} style="font-size:${sizes[level]};margin:12px 0 8px;font-weight:600;">${content}</h${level}>`);
                continue;
            }
            
            // 分割线 --- 或 ***
            if (/^[-]{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
                processedLines.push('<hr style="border:none;border-top:1px solid rgba(77,171,247,0.2);margin:16px 0;">');
                continue;
            }
            
            // 无序列表 - 或 * 开头（支持缩进）
            if (/^\s*[-*]\s/.test(line)) {
                const content = line.replace(/^\s*[-*]\s+/, '');
                processedLines.push(`<li style="margin:4px 0 4px 20px;">${content}</li>`);
                continue;
            }
            
            processedLines.push(line);
        }
        
        html = processedLines.join('\n');
        
        // 图片 ![alt](url) 或 ![alt](url =200x300) 或 ![alt](url =200x300 cover)
        html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+=(\d+)(?:x(\d+))?(?:\s+(contain|cover|fill|none))?)?\)/g, (match, alt, url, width, height, fit) => {
            let style = 'max-width:100%;height:auto;border-radius:8px;margin:8px 0;';
            if (width) {
                const fitStyle = fit || 'contain';
                style = `width:${width}px;${height ? `height:${height}px;` : ''}border-radius:8px;margin:8px 0;object-fit:${fitStyle};`;
            }
            return `<img src="${url}" alt="${alt}" style="${style}cursor:pointer;transition:transform 0.2s;" onclick="WumingBlog.showLightbox(this.src)" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">`;
        });
        
        // 链接 [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--primary);text-decoration:underline;">$1</a>');
        
        // 粗体 **text**
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // 斜体 *text*
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // 删除线 ~~text~~
        html = html.replace(/~~([^~]+)~~/g, '<del style="color:#999;">$1</del>');
        
        // 行内代码 `code`（排除已处理的代码块）
        html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(77,171,247,0.1);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>');
        
        // 换行
        html = html.replace(/\n/g, '<br>');
        
        return html;
    },

    /**
     * 图片灯箱
     */
    showLightbox(src) {
        // 移除已存在的灯箱
        const existing = document.getElementById('lightbox-overlay');
        if (existing) existing.remove();

        // 创建灯箱
        const overlay = document.createElement('div');
        overlay.id = 'lightbox-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            cursor: zoom-out;
        `;
        overlay.innerHTML = `
            <img src="${src}" style="max-width:90%;max-height:90%;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
            <button style="position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;color:white;font-size:30px;width:50px;height:50px;border-radius:50%;cursor:pointer;transition:background 0.2s;" onclick="document.getElementById('lightbox-overlay').remove()">×</button>
        `;
        overlay.querySelector('button').onmouseover = function() { this.style.background = 'rgba(255,255,255,0.3)'; };
        overlay.querySelector('button').onmouseout = function() { this.style.background = 'rgba(255,255,255,0.2)'; };

        // 点击关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        // ESC 关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        document.body.appendChild(overlay);
    },

    /**
     * 当前用户
     */
    currentUser: null,
    
    /**
     * 管理员信息
     */
    adminAvatar: null,
    adminUsername: null,

    /**
     * 音乐播放器
     */
    musicOpen: false,
    musicLoaded: false,

    initMusicPlayer() {
        if (this._musicPlayerInited) return;
        this._musicPlayerInited = true;

        const fab = document.getElementById('music-player-fab');
        const panel = document.getElementById('music-player');
        const close = document.getElementById('music-player-close');
        const header = panel ? panel.querySelector('.music-player-header') : null;

        if (!fab || !panel || !close) return;

        // FAB 拖动
        let fabDragging = false, fabStartX, fabStartY, fabOrigLeft, fabOrigTop;
        let fabMoved = false;

        fab.addEventListener('mousedown', (e) => {
            fabDragging = true;
            fabMoved = false;
            fabStartX = e.clientX;
            fabStartY = e.clientY;
            fabOrigLeft = fab.offsetLeft;
            fabOrigTop = fab.offsetTop;
            fab.classList.add('dragging');
            fab.style.left = fabOrigLeft + 'px';
            fab.style.top = fabOrigTop + 'px';
            fab.style.transform = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!fabDragging) return;
            const dx = e.clientX - fabStartX;
            const dy = e.clientY - fabStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) fabMoved = true;
            fab.style.left = (fabOrigLeft + dx) + 'px';
            fab.style.top = (fabOrigTop + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (fabDragging) {
                fab.classList.remove('dragging');
                fabDragging = false;
            }
        });

        fab.addEventListener('touchstart', (e) => {
            fabDragging = true;
            fabMoved = false;
            const t = e.touches[0];
            fabStartX = t.clientX;
            fabStartY = t.clientY;
            fabOrigLeft = fab.offsetLeft;
            fabOrigTop = fab.offsetTop;
            fab.classList.add('dragging');
            fab.style.left = fabOrigLeft + 'px';
            fab.style.top = fabOrigTop + 'px';
            fab.style.transform = 'none';
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!fabDragging) return;
            const t = e.touches[0];
            const dx = t.clientX - fabStartX;
            const dy = t.clientY - fabStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) fabMoved = true;
            fab.style.left = (fabOrigLeft + dx) + 'px';
            fab.style.top = (fabOrigTop + dy) + 'px';
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (fabDragging) {
                fab.classList.remove('dragging');
                fabDragging = false;
            }
        });

        // FAB 点击
        fab.addEventListener('click', (e) => {
            if (fabMoved) return;
            this.musicOpen = !this.musicOpen;
            if (this.musicOpen) {
                const fabRect = fab.getBoundingClientRect();
                const panelW = 340;
                const panelH = 420;
                let left = fabRect.right + 12;
                let top = fabRect.top - 60;
                if (left + panelW > window.innerWidth - 8) left = fabRect.left - panelW - 12;
                if (left < 8) left = 8;
                if (top < 8) top = 8;
                if (top + panelH > window.innerHeight - 8) top = window.innerHeight - panelH - 8;
                panel.style.left = left + 'px';
                panel.style.top = top + 'px';
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                panel.classList.add('open');
                fab.classList.add('active');
                if (!this.musicLoaded) {
                    this.musicLoaded = true;
                    this._initAPlayer();
                }
            } else {
                panel.classList.remove('open');
                fab.classList.remove('active');
            }
        });

        close.addEventListener('click', (e) => {
            e.stopPropagation();
            this.musicOpen = false;
            panel.classList.remove('open');
            fab.classList.remove('active');
        });

        // 面板拖动
        let panelDrag = null;
        header.addEventListener('mousedown', (e) => {
            if (e.target === close) return;
            panelDrag = {
                startX: e.clientX,
                startY: e.clientY,
                left: panel.offsetLeft,
                top: panel.offsetTop
            };
            panel.classList.add('dragging');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!panelDrag || fabDragging) return;
            panel.style.left = (panelDrag.left + e.clientX - panelDrag.startX) + 'px';
            panel.style.top = (panelDrag.top + e.clientY - panelDrag.startY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (panelDrag) {
                panel.classList.remove('dragging');
                panelDrag = null;
            }
        });

        header.addEventListener('touchstart', (e) => {
            if (e.target === close) return;
            const t = e.touches[0];
            panelDrag = { startX: t.clientX, startY: t.clientY, left: panel.offsetLeft, top: panel.offsetTop };
            panel.classList.add('dragging');
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!panelDrag || fabDragging) return;
            const t = e.touches[0];
            panel.style.left = (panelDrag.left + t.clientX - panelDrag.startX) + 'px';
            panel.style.top = (panelDrag.top + t.clientY - panelDrag.startY) + 'px';
        }, { passive: false });

        document.addEventListener('click', (e) => {
            var path = e.composedPath();
            if (this.musicOpen && path.indexOf(panel) === -1 && path.indexOf(fab) === -1) {
                this.musicOpen = false;
                panel.classList.remove('open');
                fab.classList.remove('active');
            }
        });
    },

    _initAPlayer() {
        var body = document.getElementById('music-player-body');
        if (!body) return;

        body.innerHTML = '';

        var self = this;
        this.lrcData = null;
        this.lrcLines = [];

        var ap = new APlayer({
            container: body,
            mini: false,
            autoplay: false,
            theme: '#a882ff',
            loop: 'all',
            order: 'list',
            preload: 'none',
            volume: 0.7,
            mutex: true,
            listFolded: true,
            listMaxHeight: '160px',
            lrcType: 0,
            audio: []
        });
        this.ap = ap;

        // 自定义音量条接管
        this._initCustomVolume(ap);

        // 自定义歌词同步 - 渲染到侧边栏
        ap.on('timeupdate', function () {
            if (!self.lrcData || !self.lrcData.length) return;
            var ct = ap.audio.currentTime;
            var idx = -1;
            for (var i = self.lrcData.length - 1; i >= 0; i--) {
                if (ct >= self.lrcData[i].time) { idx = i; break; }
            }
            self._highlightLrcLine(idx);
        });

        ap.on('listswitch', function () {
            self._loadLrcForCurrent();
        });

        ap.on('listadd', function () {
            self._loadLrcForCurrent();
        });

        // 切歌时也重新加载歌词（listswitch 在某些 APlayer 版本不触发）
        ap.on('play', function () {
            if (self._currentSongIdx !== ap.list.index) {
                self._loadLrcForCurrent();
            }
        });

        var playlistId = '17894771349';
        fetch('https://api.injahow.cn/meting/?type=playlist&id=' + playlistId)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data || !data.length) {
                    body.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">歌单加载失败</p>';
                    return;
                }
                var songs = data.map(function (s, i) {
                    self._songMeta = self._songMeta || {};
                    self._songMeta[i] = { lrc: s.lrc || '' };
                    return {
                        name: s.name || s.title || 'Unknown',
                        artist: s.artist || s.author || 'Unknown',
                        url: s.url || '',
                        cover: s.pic || s.cover || '',
                        theme: '#a882ff'
                    };
                }).filter(function (s) { return s.url; });

                if (songs.length) {
                    ap.list.add(songs);
                }
            })
            .catch(function () {
                body.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">网络错误</p>';
            });
    },

    _initCustomVolume(ap) {
        var track = document.getElementById('custom-volume-track');
        var fill  = document.getElementById('custom-volume-fill');
        var thumb = document.getElementById('custom-volume-thumb');
        var valEl = document.getElementById('custom-volume-val');
        var muteBtn = document.getElementById('custom-volume-mute');
        if (!track || !fill || !thumb || !valEl || !muteBtn) return;

        var self = this;
        var dragging = false;

        function setUI(pct) {
            pct = Math.max(0, Math.min(1, pct));
            fill.style.width = (pct * 100) + '%';
            thumb.style.left = (pct * 100) + '%';
            valEl.textContent = Math.round(pct * 100);
            ap.audio.volume = pct;
            if (pct === 0) {
                ap.audio.muted = true;
                muteBtn.textContent = '🔇';
                muteBtn.classList.add('muted');
            } else {
                ap.audio.muted = false;
                muteBtn.classList.remove('muted');
                if (pct < 0.3) muteBtn.textContent = '🔈';
                else if (pct < 0.7) muteBtn.textContent = '🔉';
                else muteBtn.textContent = '🔊';
            }
        }

        function updateFromEvent(e) {
            var rect = track.getBoundingClientRect();
            var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            setUI(x / rect.width);
        }

        track.addEventListener('mousedown', function (e) {
            dragging = true;
            updateFromEvent(e);
            e.preventDefault();
        });
        track.addEventListener('touchstart', function (e) {
            dragging = true;
            updateFromEvent(e);
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('mousemove', function (e) {
            if (dragging) updateFromEvent(e);
        });
        document.addEventListener('touchmove', function (e) {
            if (dragging) updateFromEvent(e);
        }, { passive: false });

        document.addEventListener('mouseup', function () { dragging = false; });
        document.addEventListener('touchend', function () { dragging = false; });

        muteBtn.addEventListener('click', function () {
            if (ap.audio.muted || ap.audio.volume === 0) {
                setUI(self._savedVolume || 0.7);
            } else {
                self._savedVolume = ap.audio.volume;
                setUI(0);
            }
        });

        // 初始状态
        setUI(ap.audio.volume || 0.5);
    },

    _loadLrcForCurrent() {
        var self = this;
        if (!this.ap) return;
        var idx = this.ap.list.index;
        this._currentSongIdx = idx;
        var meta = this._songMeta && this._songMeta[idx];
        if (!meta || !meta.lrc) {
            this.lrcData = null;
            this.lrcLines = null;
            this._updateLrcBar('暂无歌词', '');
            return;
        }
        if (meta.lrc.indexOf('http') === 0) {
            fetch(meta.lrc)
                .then(function (r) { return r.text(); })
                .then(function (txt) { self._parseLrc(txt); })
                .catch(function () {
                    self.lrcData = null;
                    self._updateLrcBar('歌词加载失败', '');
                });
        } else {
            this._parseLrc(meta.lrc);
        }
    },

    _parseLrc(lrcText) {
        if (!lrcText) {
            this.lrcData = null;
            this._updateLrcBar('暂无歌词', '');
            return;
        }
        var lines = lrcText.split('\n');
        var data = [];
        var re = /\[(\d{2}):(\d{2})[\.:](\d{2,3})\]/g;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            var match;
            while ((match = re.exec(line)) !== null) {
                var min = parseInt(match[1], 10);
                var sec = parseInt(match[2], 10);
                var ms = parseInt(match[3], 10);
                if (match[3].length === 2) ms *= 10;
                var time = min * 60 + sec + ms / 1000;
                var text = line.replace(/\[.*?\]/g, '').trim();
                if (text) data.push({ time: time, text: text });
            }
        }
        data.sort(function (a, b) { return a.time - b.time; });
        this.lrcData = data;
        this._currentLrcIdx = -1;
        if (!data.length) {
            this._updateLrcBar('纯音乐，请欣赏', '');
        }
    },

    _updateLrcBar(currentIdx) {
        var topEl = document.getElementById('lrc-float-top');
        var botEl = document.getElementById('lrc-float-bot');
        if (!topEl || !botEl) return;

        if (!this.lrcData || !this.lrcData.length) {
            topEl.textContent = '';
            botEl.textContent = '♪ 暂未播放';
            topEl.classList.remove('active');
            botEl.classList.add('active');
            return;
        }

        var idx = currentIdx >= 0 ? currentIdx : 0;
        var current = this.lrcData[idx].text;
        var next = (idx + 1 < this.lrcData.length) ? this.lrcData[idx + 1].text : '';

        // 交替高亮：_lrcSlot 0=上行高亮下行预览, 1=下行高亮上行预览
        if (this._lrcSlot === 0) {
            topEl.textContent = current;
            topEl.classList.add('active');
            botEl.textContent = next;
            botEl.classList.remove('active');
        } else {
            topEl.textContent = next;
            topEl.classList.remove('active');
            botEl.textContent = current;
            botEl.classList.add('active');
        }

        // 歌词太长则滚动
        this._applyLrcScroll(topEl);
        this._applyLrcScroll(botEl);
    },

    _applyLrcScroll(el) {
        if (!el) return;
        el.classList.remove('lrc-scroll');
        el.style.animation = 'none';
        el.removeAttribute('data-text');

        // 用 clone 测量实际文字宽度
        var clone = el.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.visibility = 'hidden';
        clone.style.whiteSpace = 'nowrap';
        clone.style.maxWidth = 'none';
        clone.style.width = 'auto';
        clone.style.display = 'inline-block';
        clone.classList.remove('active', 'lrc-scroll');
        document.body.appendChild(clone);
        var textW = clone.offsetWidth;
        document.body.removeChild(clone);

        // 容器最大宽度 = 360px max-width - 22*2 padding - 12*2 内边距 ≈ 292px
        var maxW = 280;
        if (textW > maxW) {
            el.setAttribute('data-text', el.textContent);
            el.classList.add('lrc-scroll');
            el.style.setProperty('--scroll-dist', (textW - maxW + 40) + 'px');
            el.style.setProperty('--scroll-dur', Math.max(3, (textW - maxW) / 30) + 's');
        }
    },

    _highlightLrcLine(idx) {
        if (!this.lrcData || !this.lrcData.length) return;

        if (this._lrcMode === 'toast') {
            if (idx !== this._currentLrcIdx) {
                this._currentLrcIdx = idx;
                var current = idx >= 0 ? this.lrcData[idx].text : '';
                var duration = 4000;
                if (idx >= 0 && idx + 1 < this.lrcData.length) {
                    var gap = this.lrcData[idx + 1].time - this.lrcData[idx].time;
                    duration = Math.max(1500, gap * 1000);
                }
                if (typeof Toast !== 'undefined' && Toast.lrc) {
                    Toast.lrc(current, null, duration);
                }
            }
        } else {
            if (idx !== this._currentLrcIdx) {
                this._lrcSlot = this._lrcSlot ? 0 : 1;
            }
            this._currentLrcIdx = idx;
            this._updateLrcBar(idx);
        }
    },

    _escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    initLrcFloatDrag() {
        var el = document.getElementById('lrc-float');
        if (!el) return;

        var startX, startY, startLeft, startTop;
        var dragging = false;

        el.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            startX = e.clientX;
            startY = e.clientY;
            var rect = el.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            dragging = true;
            el.style.transition = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            var left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startLeft + dx));
            var top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startTop + dy));
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.right = 'auto';
        });

        document.addEventListener('mouseup', function () {
            if (dragging) {
                dragging = false;
                el.style.transition = '';
            }
        });

        // 触摸支持
        el.addEventListener('touchstart', function (e) {
            var t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            var rect = el.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            dragging = true;
            el.style.transition = 'none';
        }, { passive: false });

        document.addEventListener('touchmove', function (e) {
            if (!dragging) return;
            var t = e.touches[0];
            var dx = t.clientX - startX;
            var dy = t.clientY - startY;
            var left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startLeft + dx));
            var top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startTop + dy));
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.right = 'auto';
        }, { passive: false });

        document.addEventListener('touchend', function () {
            if (dragging) {
                dragging = false;
                el.style.transition = '';
            }
        });
    },

    initLrcToggle() {
        var btn = document.getElementById('music-player-lrc-toggle');
        var floatEl = document.getElementById('lrc-float');
        if (!btn) return;

        this._lrcMode = this._lrcMode || 'toast';
        var self = this;

        function updateUI() {
            if (self._lrcMode === 'toast') {
                btn.classList.add('active');
                btn.title = '歌词模式：Toast（点击切换为悬浮窗）';
                if (floatEl) floatEl.classList.add('hidden');
            } else {
                btn.classList.remove('active');
                btn.title = '歌词模式：悬浮窗（点击切换为 Toast）';
                if (floatEl) floatEl.classList.remove('hidden');
                // 切换回浮窗时，把当前歌词同步过去
                if (self._currentLrcIdx >= 0 && self.lrcData && self.lrcData.length) {
                    var current = self.lrcData[self._currentLrcIdx].text;
                    var next = (self._currentLrcIdx + 1 < self.lrcData.length) ? self.lrcData[self._currentLrcIdx + 1].text : '';
                    self._updateLrcBar(current, next);
                }
            }
        }

        btn.addEventListener('click', function () {
            self._lrcMode = (self._lrcMode === 'float') ? 'toast' : 'float';
            if (self._lrcMode === 'float') {
                var lrcContainer = document.getElementById('toast-lrc-container');
                if (lrcContainer) lrcContainer.innerHTML = '';
            }
            updateUI();
        });

        updateUI();
    },

};

document.addEventListener('DOMContentLoaded', () => {
    if (window._pageInitialized) return;
    window._pageInitialized = true;
    if (!window._NO_EFFECTS) {
        WumingBlog.createFallingElements();
        WumingBlog.createClickEffect();
        WumingBlog.createMouseTrail();
    }
    WumingBlog.initMobileMenu();
    WumingBlog.initAuthStatus();
    WumingBlog.initTitleSwitch();
    // Toast 初始化和公告加载
    if (typeof Toast !== 'undefined') {
        Toast.init();
    }
    if (typeof AnnouncementBar !== 'undefined') {
        AnnouncementBar.load();
    }
    WumingBlog.initMusicPlayer();
    WumingBlog.initLrcFloatDrag();
    WumingBlog.initLrcToggle();
});
// Version: 31