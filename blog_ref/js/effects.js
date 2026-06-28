/**
 * 二次元粒子 + 全息投影风格效果
 */
const AnimeHoloEffect = {
    starfield: null,
    canvas: null,
    ctx: null,
    particles: [],
    floatingParticles: [],
    config: {
        starCount: 80,
        floatingCount: 15,
        particleCount: 30,
        particleLife: 50,
        particleSize: 4,
        colors: ['#00ffff', '#ff00ff', '#ffff00', '#ff69b4', '#4dabf7', '#9775fa', '#69db7c']
    },

    /**
     * 初始化
     */
    init() {
        this.createStarfield();
        this.createStars();
        this.createFloatingParticles();
        this.createCanvas();
        this.bindEvents();
        this.animate();
    },

    /**
     * 创建星空容器
     */
    createStarfield() {
        if (document.getElementById('starfield')) return;

        this.starfield = document.createElement('div');
        this.starfield.id = 'starfield';
        document.body.insertBefore(this.starfield, document.body.firstChild);
    },

    /**
     * 创建星星
     */
    createStars() {
        for (let i = 0; i < this.config.starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const size = 1 + Math.random() * 3;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = 2 + Math.random() * 4;
            const delay = Math.random() * 3;

            star.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}%;
                top: ${y}%;
                --duration: ${duration}s;
                --min-opacity: ${0.2 + Math.random() * 0.3};
                animation-delay: ${delay}s;
            `;

            this.starfield.appendChild(star);
        }
    },

    /**
     * 创建飘落粒子（二次元风格）
     */
    createFloatingParticles() {
        const types = ['sakura', 'star-particle', 'circle', 'diamond'];
        
        for (let i = 0; i < this.config.floatingCount; i++) {
            this.spawnFloatingParticle(types[i % types.length]);
        }

        // 持续生成新粒子
        setInterval(() => {
            const types = ['sakura', 'star-particle', 'circle', 'diamond'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.spawnFloatingParticle(type);
        }, 2000);
    },

    /**
     * 生成单个飘落粒子
     */
    spawnFloatingParticle(type) {
        const particle = document.createElement('div');
        particle.className = `floating-particle ${type}`;
        
        const x = Math.random() * 100;
        const duration = 8 + Math.random() * 8;
        const delay = Math.random() * 5;
        const size = 0.8 + Math.random() * 0.6;

        particle.style.cssText = `
            left: ${x}%;
            --float-duration: ${duration}s;
            animation-delay: ${delay}s;
            transform: scale(${size});
        `;

        this.starfield.appendChild(particle);

        // 动画结束后移除
        setTimeout(() => particle.remove(), (duration + delay) * 1000);
    },

    /**
     * 创建粒子画布（鼠标跟随）
     */
    createCanvas() {
        if (document.getElementById('particle-canvas')) return;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    },

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 鼠标移动
        let lastX = 0, lastY = 0;
        document.addEventListener('mousemove', (e) => {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const speed = Math.sqrt(dx * dx + dy * dy);
            
            if (speed > 3) {
                this.createParticles(e.clientX, e.clientY, speed);
            }
            lastX = e.clientX;
            lastY = e.clientY;
        });

        // 触摸移动
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.createParticles(e.touches[0].clientX, e.touches[0].clientY, 5);
            }
        });

        // 点击产生爆发效果
        document.addEventListener('click', (e) => {
            this.createBurst(e.clientX, e.clientY);
        });

        // 窗口调整
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    /**
     * 创建跟随粒子
     */
    createParticles(x, y, speed = 3) {
        const count = Math.min(Math.floor(speed / 2) + 1, 4);
        
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.config.particleCount) break;

            const angle = Math.random() * Math.PI * 2;
            const velocity = 1 + Math.random() * 2;

            this.particles.push({
                x: x + (Math.random() - 0.5) * 15,
                y: y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: this.config.particleLife,
                maxLife: this.config.particleLife,
                size: Math.random() * this.config.particleSize + 2,
                color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
                type: Math.random() > 0.5 ? 'circle' : 'star'
            });
        }
    },

    /**
     * 点击爆发效果
     */
    createBurst(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const velocity = 3 + Math.random() * 2;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 40,
                maxLife: 40,
                size: Math.random() * 3 + 2,
                color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
                type: Math.random() > 0.3 ? 'star' : 'circle'
            });
        }
    },

    /**
     * 动画循环
     */
    animate() {
        if (!this.ctx) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新和绘制粒子
        this.particles = this.particles.filter(p => {
            p.life--;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;

            if (p.life <= 0) return false;

            const alpha = p.life / p.maxLife;
            const size = p.size * alpha;

            // 绘制粒子
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = p.color;

            if (p.type === 'star') {
                // 绘制星星形状
                this.drawStar(p.x, p.y, 5, size, size * 0.5);
            } else {
                // 绘制圆形
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
            return true;
        });

        requestAnimationFrame(() => this.animate());
    },

    /**
     * 绘制星星
     */
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
};

/**
 * 鼠标追逐者游戏
 */
const MouseChaserGame = {
    chasers: [],
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    mouseInWindow: true,
    config: {
        enabled: true,
        count: 3,
        speed: 2,
        catchRadius: 30,
        catchEffect: 'burst',
        respawnDelay: 2000,
        types: ['star', 'heart', 'cat']
    },
    emojis: {
        star: '⭐',
        heart: '💖',
        cat: '🐱'
    },
    catchMessages: [
        '抓到你啦！',
        '哼~',
        '太慢了！',
        '嘿嘿~',
        '喵~',
        '❤️',
        '✨',
        '不许跑！'
    ],
    skills: {
        star: {
            name: '瞬移',
            cd: 30000,
            range: 120,
            triggerMinDist: 150,
            triggerMaxDist: 600,
            castDelay: 800
        },
        heart: {
            name: '加速',
            cd: 30000,
            duration: 10000,
            multiplier: 2,
            triggerDist: 200
        },
        cat: {
            name: '穿墙',
            passive: true
        }
    },
    active: false,

    /**
     * 初始化
     */
    async init() {
        try {
            const res = await fetch('/blog_ref/data/config.json');
            const data = await res.json();
            
            if (data.effects && data.effects.mouseChaser) {
                this.config = { ...this.config, ...data.effects.mouseChaser };
                if (data.effects.mouseChaser.skills) {
                    if (data.effects.mouseChaser.skills.star) {
                        this.skills.star = { ...this.skills.star, ...data.effects.mouseChaser.skills.star };
                    }
                    if (data.effects.mouseChaser.skills.heart) {
                        this.skills.heart = { ...this.skills.heart, ...data.effects.mouseChaser.skills.heart };
                    }
                }
            }
        } catch (e) {
            console.log('使用默认配置');
        }

        if (!this.config.enabled) return;

        this.active = true;
        this.bindEvents();
        this.spawnChasers();
        this.gameLoop();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouseInWindow = true;
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
                this.mouseInWindow = true;
            }
        });

        // 鼠标离开窗口，追逐者随机方向离开
        document.addEventListener('mouseleave', () => {
            this.mouseInWindow = false;
            for (const chaser of this.chasers) {
                if (!chaser.alive) continue;
                // 随机选择一个方向离开屏幕
                const angle = Math.random() * Math.PI * 2;
                chaser.leavingVx = Math.cos(angle) * chaser.speed * 1.5;
                chaser.leavingVy = Math.sin(angle) * chaser.speed * 1.5;
                this.showBubble(chaser, '呜...走了...');
            }
        });

        // 鼠标重新进入窗口，重置追逐者状态
        document.addEventListener('mouseenter', () => {
            this.mouseInWindow = true;
            for (const chaser of this.chasers) {
                delete chaser.leavingVx;
                delete chaser.leavingVy;
            }
        });
    },

    /**
     * 生成追逐者
     */
    spawnChasers() {
        for (let i = 0; i < this.config.count; i++) {
            setTimeout(() => this.createChaser(i), i * 800);
        }
    },

    /**
     * 创建单个追逐者
     */
    createChaser(index) {
        const type = this.config.types[index % this.config.types.length];
        const element = document.createElement('div');
        element.className = `chaser chaser-${type}`;
        element.textContent = this.emojis[type];
        element.style.color = this.getChaserColor(type);

        // 随机初始位置
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = -30; y = Math.random() * window.innerHeight; break;
            case 1: x = window.innerWidth + 30; y = Math.random() * window.innerHeight; break;
            case 2: x = Math.random() * window.innerWidth; y = -30; break;
            case 3: x = Math.random() * window.innerWidth; y = window.innerHeight + 30; break;
        }

        element.style.left = x + 'px';
        element.style.top = y + 'px';

        document.body.appendChild(element);

        const chaser = {
            element,
            x,
            y,
            type,
            speed: this.config.speed * (0.8 + Math.random() * 0.4),
            baseSpeed: this.config.speed * (0.8 + Math.random() * 0.4),
            alive: true,
            showBubble: false,
            lastBubbleTime: 0,
            // 技能状态
            skillCdEnd: 0,       // CD结束时间戳
            skillActiveEnd: 0,   // 技能效果结束时间戳
            lastSkillCheck: 0,   // 上次检查技能的时间
            // 卡住检测
            lastStuckCheck: Date.now(),
            lastStuckX: x,
            lastStuckY: y
        };

        this.chasers.push(chaser);

        // 显示出场气泡
        this.showBubble(chaser, '我来了！');

        return chaser;
    },

    /**
     * 获取追逐者颜色
     */
    getChaserColor(type) {
        const colors = {
            star: '#ffd43b',
            heart: '#ff69b4',
            cat: '#4dabf7'
        };
        return colors[type] || '#4dabf7';
    },

    /**
     * 显示气泡
     */
    showBubble(chaser, text) {
        if (Date.now() - chaser.lastBubbleTime < 3000) return;
        chaser.lastBubbleTime = Date.now();

        const bubble = document.createElement('div');
        bubble.className = 'chaser-bubble';
        bubble.textContent = text;
        chaser.element.appendChild(bubble);

        setTimeout(() => bubble.remove(), 2000);
    },

    /**
     * 刷新障碍物缓存
     */
    refreshObstacles() {
        const elements = document.querySelectorAll(
            'a, button, input, textarea, select, ' +
            '.navbar, .card, .post-card, .toast-container, .announcement-bar, ' +
            'nav, header, footer, .sidebar, .comment-section, form, .search-box, ' +
            '.home-stats, .stats-card, .stat-item, .nav-cards, .nav-card, ' +
            '.profile-card, .search-container, .hero-section, .hero-content, ' +
            '.hero-buttons, .quick-links, .tag-cloud, .announcement-section, .announcement-grid, ' +
            '.section-header, .section'
        );
        const padding = 12;
        this.cachedObstacles = [];

        // 用Set去重（同一个DOM元素可能匹配多个选择器）
        const seen = new Set();
        for (const el of elements) {
            if (seen.has(el)) continue;
            seen.add(el);

            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight ||
                rect.right < 0 || rect.left > window.innerWidth) continue;

            // 跳过太小或太大的元素
            const w = rect.width;
            const h = rect.height;
            // 太小的跳过
            if (w < 30 || h < 30) continue;
            // 太大的跳过（整个页面框架不应该阻挡）
            if (w > window.innerWidth * 0.5 || h > window.innerHeight * 0.5) continue;

            this.cachedObstacles.push({
                left: rect.left - padding,
                right: rect.right + padding,
                top: rect.top - padding,
                bottom: rect.bottom + padding
            });
        }

        // 合并重叠的障碍物（父子元素重复时只保留大的）
        this.cachedObstacles = this.mergeObstacles(this.cachedObstacles);

        for (const c of this.chasers) {
            c._path = null;
        }
    },

    /**
     * 合并重叠的障碍物矩形
     */
    mergeObstacles(obstacles) {
        let merged = true;
        while (merged) {
            merged = false;
            const result = [];
            const used = new Set();

            for (let i = 0; i < obstacles.length; i++) {
                if (used.has(i)) continue;
                let a = { ...obstacles[i] };
                for (let j = i + 1; j < obstacles.length; j++) {
                    if (used.has(j)) continue;
                    const b = obstacles[j];
                    // 如果b完全在a内部，跳过b
                    if (b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom) {
                        used.add(j);
                        continue;
                    }
                    // 如果a完全在b内部，用b替换a
                    if (a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom) {
                        a = { ...b };
                        used.add(j);
                        continue;
                    }
                    // 检查是否重叠超过70%
                    const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
                    const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
                    const overlapArea = overlapX * overlapY;
                    const areaA = (a.right - a.left) * (a.bottom - a.top);
                    const areaB = (b.right - b.left) * (b.bottom - b.top);
                    if (overlapArea > areaA * 0.7 || overlapArea > areaB * 0.7) {
                        a = {
                            left: Math.min(a.left, b.left),
                            right: Math.max(a.right, b.right),
                            top: Math.min(a.top, b.top),
                            bottom: Math.max(a.bottom, b.bottom)
                        };
                        used.add(j);
                        merged = true;
                    }
                }
                result.push(a);
            }
            obstacles = result;
        }
        return obstacles;
    },

    /**
     * 射线检测：两点直线是否穿过障碍物
     */
    isLineBlocked(x1, y1, x2, y2, obstacles) {
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const steps = Math.max(3, Math.ceil(dist / 6));
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            for (const obs of obstacles) {
                if (x > obs.left && x < obs.right && y > obs.top && y < obs.bottom) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * 可视点图 + Dijkstra 寻路
     * 返回一组路径点 waypoints 数组，或 null（直线可达时）
     */
    findPath(startX, startY, endX, endY, obstacles) {
        if (!obstacles.length) return null; // 无障碍，直线

        // 直线可达则不寻路
        if (!this.isLineBlocked(startX, startY, endX, endY, obstacles)) return null;

        // 构建节点：所有障碍物的四个角（外扩偏移）+ 起终点
        const offset = 3;
        const nodes = [{ x: startX, y: startY }, { x: endX, y: endY }];

        for (const obs of obstacles) {
            nodes.push(
                { x: obs.left - offset, y: obs.top - offset },
                { x: obs.right + offset, y: obs.top - offset },
                { x: obs.left - offset, y: obs.bottom + offset },
                { x: obs.right + offset, y: obs.bottom + offset }
            );
        }

        const n = nodes.length;
        const adj = Array.from({ length: n }, () => []);

        // 建图：两点之间无障碍物则连边
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (!this.isLineBlocked(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, obstacles)) {
                    const d = Math.sqrt((nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2);
                    adj[i].push({ to: j, dist: d });
                    adj[j].push({ to: i, dist: d });
                }
            }
        }

        // Dijkstra
        const dist = new Float64Array(n).fill(Infinity);
        const prev = new Int32Array(n).fill(-1);
        const visited = new Uint8Array(n);
        dist[0] = 0;

        for (let iter = 0; iter < n; iter++) {
            // 找未访问的最短距离节点
            let u = -1, minD = Infinity;
            for (let i = 0; i < n; i++) {
                if (!visited[i] && dist[i] < minD) { minD = dist[i]; u = i; }
            }
            if (u === -1 || u === 1) break; // 无路径或到达终点
            visited[u] = 1;

            for (const edge of adj[u]) {
                const nd = dist[u] + edge.dist;
                if (nd < dist[edge.to]) {
                    dist[edge.to] = nd;
                    prev[edge.to] = u;
                }
            }
        }

        // 回溯路径
        if (dist[1] === Infinity) return null; // 无路径

        const path = [];
        let cur = 1;
        while (cur !== -1) {
            path.push({ x: nodes[cur].x, y: nodes[cur].y });
            cur = prev[cur];
        }
        path.reverse();

        // 去掉起终点，只保留中间绕行点
        if (path.length > 2) {
            return path.slice(1, -1);
        }
        return null;
    },

    /**
     * 计算路径（带缓存），cat穿墙时直线走
     */
    calculatePath(chaser) {
        const dx = this.mouse.x - chaser.x;
        const dy = this.mouse.y - chaser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) return { vx: 0, vy: 0 };

        // 计算实际速度
        let speed = chaser.speed;
        if (chaser.skillActiveEnd > Date.now() && chaser.type === 'heart') {
            speed = chaser.baseSpeed * this.skills.heart.multiplier;
            chaser.speed = speed;
        } else if (chaser.type === 'heart' && chaser.speed !== chaser.baseSpeed) {
            chaser.speed = chaser.baseSpeed;
        }

        // cat被动穿墙：永远直线走
        if (chaser.type === 'cat') {
            return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
        }

        const obstacles = this.cachedObstacles || [];
        if (!obstacles.length) {
            return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
        }

        // 检查是否在障碍物内部，强力弹出
        for (const obs of obstacles) {
            if (chaser.x > obs.left && chaser.x < obs.right &&
                chaser.y > obs.top && chaser.y < obs.bottom) {
                const dl = chaser.x - obs.left;
                const dr = obs.right - chaser.x;
                const dt = chaser.y - obs.top;
                const db = obs.bottom - chaser.y;
                const minD = Math.min(dl, dr, dt, db);
                let evx = 0, evy = 0;
                if (minD === dl) evx = -1;
                else if (minD === dr) evx = 1;
                else if (minD === dt) evy = -1;
                else evy = 1;
                return { vx: evx * speed * 2, vy: evy * speed * 2 };
            }
        }

        // 检查直线路径是否通畅
        const blocked = this.isLineBlocked(chaser.x, chaser.y, this.mouse.x, this.mouse.y, obstacles);
        if (!blocked) {
            // 直线通畅，走直线
            chaser._path = null;
            return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
        }

        // 检查缓存是否仍然有效
        const lastTX = chaser._pathTargetX || 0;
        const lastTY = chaser._pathTargetY || 0;
        const targetMoved = Math.sqrt((this.mouse.x - lastTX) ** 2 + (this.mouse.y - lastTY) ** 2);

        if (chaser._path && targetMoved < 40) {
            const wp = chaser._path[chaser._pathIdx];
            if (wp) {
                const wdx = wp.x - chaser.x;
                const wdy = wp.y - chaser.y;
                const wdist = Math.sqrt(wdx * wdx + wdy * wdy);

                if (wdist < 15) {
                    chaser._pathIdx++;
                    if (chaser._pathIdx >= chaser._path.length) {
                        chaser._path = null;
                    }
                }

                if (chaser._path && chaser._pathIdx < chaser._path.length) {
                    const next = chaser._path[chaser._pathIdx];
                    const ndx = next.x - chaser.x;
                    const ndy = next.y - chaser.y;
                    const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
                    if (ndist > 1) {
                        return { vx: (ndx / ndist) * speed, vy: (ndy / ndist) * speed };
                    }
                }
            }
        }

        // 路径被挡，必须寻路
        const path = this.findPath(chaser.x, chaser.y, this.mouse.x, this.mouse.y, obstacles);

        if (path) {
            chaser._path = path;
            chaser._pathIdx = 0;
            chaser._pathTargetX = this.mouse.x;
            chaser._pathTargetY = this.mouse.y;

            const wp = path[0];
            const wdx = wp.x - chaser.x;
            const wdy = wp.y - chaser.y;
            const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
            if (wdist > 1) {
                return { vx: (wdx / wdist) * speed, vy: (wdy / wdist) * speed };
            }
        }

        // findPath失败（所有角都被挡），用贪心绕行：走向最近的障碍物角
        if (blocked) {
            const bestCorner = this.findNearestCorner(chaser.x, chaser.y, this.mouse.x, this.mouse.y, obstacles);
            if (bestCorner) {
                const cdx = bestCorner.x - chaser.x;
                const cdy = bestCorner.y - chaser.y;
                const cd = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cd > 1) {
                    return { vx: (cdx / cd) * speed, vy: (cdy / cd) * speed };
                }
            }
        }

        // 兜底：尝试沿障碍物边缘滑动（而不是停止）
        // 检测前方哪个方向可以移动
        const slide = this.findSlideDirection(chaser.x, chaser.y, this.mouse.x, this.mouse.y, speed, obstacles);
        if (slide) {
            return slide;
        }

        // 最后兜底：随机扰动尝试逃脱，避免卡死
        const jitterAngle = (Math.random() - 0.5) * Math.PI;
        const jx = dirX * Math.cos(jitterAngle) - dirY * Math.sin(jitterAngle);
        const jy = dirX * Math.sin(jitterAngle) + dirY * Math.cos(jitterAngle);
        return { vx: jx * speed, vy: jy * speed };
    },

    /**
     * 沿障碍物边缘滑动：找到可以移动的方向
     * 改进版：计算实际障碍物法线，沿边缘滑动
     */
    findSlideDirection(cx, cy, mx, my, speed, obstacles) {
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return null;

        const dirX = dx / dist;
        const dirY = dy / dist;

        // 找到阻挡路径的障碍物
        let blockingObs = null;
        let minT = Infinity;
        for (const obs of obstacles) {
            // 射线与AABB相交检测
            const tMinX = (obs.left - cx) / (dirX || 0.001);
            const tMaxX = (obs.right - cx) / (dirX || 0.001);
            const tMinY = (obs.top - cy) / (dirY || 0.001);
            const tMaxY = (obs.bottom - cy) / (dirY || 0.001);

            const tEnter = Math.max(Math.min(tMinX, tMaxX), Math.min(tMinY, tMaxY));
            const tExit = Math.min(Math.max(tMinX, tMaxX), Math.max(tMinY, tMaxY));

            if (tEnter < tExit && tExit > 0 && tEnter < dist && tEnter < minT) {
                minT = tEnter;
                blockingObs = obs;
            }
        }

        if (!blockingObs) return null;

        // 计算碰撞点的法线
        const hitX = cx + dirX * minT;
        const hitY = cy + dirY * minT;

        // 判断碰撞发生在哪个边
        const distLeft = hitX - blockingObs.left;
        const distRight = blockingObs.right - hitX;
        const distTop = hitY - blockingObs.top;
        const distBottom = blockingObs.bottom - hitY;

        const minEdge = Math.min(distLeft, distRight, distTop, distBottom);

        let normalX = 0, normalY = 0;
        if (minEdge === distLeft) normalX = -1;
        else if (minEdge === distRight) normalX = 1;
        else if (minEdge === distTop) normalY = -1;
        else normalY = 1;

        // 计算两个切线方向（沿边缘滑动）
        const tangentDirections = [
            { x: -normalY, y: normalX },   // 顺时针切线
            { x: normalY, y: -normalX }    // 逆时针切线
        ];

        // 选择更靠近目标方向且不被阻挡的切线
        let bestDir = null;
        let bestDot = -Infinity;

        for (const tangent of tangentDirections) {
            const dot = tangent.x * dirX + tangent.y * dirY;
            if (dot < -0.1) continue; // 远离目标的不考虑

            const testX = cx + tangent.x * speed * 3;
            const testY = cy + tangent.y * speed * 3;

            let blocked = false;
            for (const obs of obstacles) {
                if (testX > obs.left && testX < obs.right &&
                    testY > obs.top && testY < obs.bottom) {
                    blocked = true;
                    break;
                }
            }

            if (!blocked && dot > bestDot) {
                bestDot = dot;
                bestDir = tangent;
            }
        }

        if (bestDir) {
            return { vx: bestDir.x * speed, vy: bestDir.y * speed };
        }

        // 切线方向都被挡，尝试更大角度偏移
        const angles = [];
        for (let i = 1; i <= 8; i++) {
            const a = (Math.PI / 4) * i / 8;
            angles.push(a, -a);
        }

        for (const angle of angles) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatedX = dirX * cos - dirY * sin;
            const rotatedY = dirX * sin + dirY * cos;

            const testX = cx + rotatedX * speed * 3;
            const testY = cy + rotatedY * speed * 3;

            let blocked = false;
            for (const obs of obstacles) {
                if (testX > obs.left && testX < obs.right &&
                    testY > obs.top && testY < obs.bottom) {
                    blocked = true;
                    break;
                }
            }

            if (!blocked) {
                return { vx: rotatedX * speed, vy: rotatedY * speed };
            }
        }

        return null;
    },

    /**
     * 找到离追逐者最近且离鼠标更近的障碍物角
     */
    findNearestCorner(cx, cy, mx, my, obstacles) {
        let best = null;
        let bestScore = Infinity;
        const offset = 5;

        for (const obs of obstacles) {
            const corners = [
                { x: obs.left - offset, y: obs.top - offset },
                { x: obs.right + offset, y: obs.top - offset },
                { x: obs.left - offset, y: obs.bottom + offset },
                { x: obs.right + offset, y: obs.bottom + offset }
            ];
            for (const c of corners) {
                const d1 = Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2);
                const d2 = Math.sqrt((mx - c.x) ** 2 + (my - c.y) ** 2);
                const score = d1 + d2 * 0.5;
                if (score < bestScore) {
                    bestScore = score;
                    best = c;
                }
            }
        }
        return best;
    },

    /**
     * 找到离当前位置最近的屏幕边缘
     */
    findNearestEdge(x, y) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const edges = [
            { x: -30, y: y, dist: x },                    // 左边缘
            { x: w + 30, y: y, dist: w - x },             // 右边缘
            { x: x, y: -30, dist: y },                    // 上边缘
            { x: x, y: h + 30, dist: h - y }              // 下边缘
        ];
        edges.sort((a, b) => a.dist - b.dist);
        return { x: edges[0].x, y: edges[0].y };
    },

    /**
     * 检查是否追到鼠标
     */
    checkCatch(chaser) {
        const dx = this.mouse.x - chaser.x;
        const dy = this.mouse.y - chaser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        return dist < this.config.catchRadius;
    },

    /**
     * 追到后的效果
     */
    onCatch(chaser) {
        // 爆发粒子
        if (typeof AnimeHoloEffect !== 'undefined') {
            AnimeHoloEffect.createBurst(this.mouse.x, this.mouse.y);
        }

        // 显示气泡
        const msg = this.catchMessages[Math.floor(Math.random() * this.catchMessages.length)];
        this.showBubble(chaser, msg);

        // 弹出侧边 Toast
        if (typeof Toast !== 'undefined') {
            Toast.show({
                message: `${this.emojis[chaser.type]} ${msg}`,
                type: 'info',
                duration: 1000
            });
        }

        // 播放动画
        chaser.element.classList.add('chaser-caught');
        chaser.alive = false;

        // 移除并重生
        setTimeout(() => {
            chaser.element.remove();
            const index = this.chasers.indexOf(chaser);
            if (index > -1) this.chasers.splice(index, 1);
            
            setTimeout(() => {
                if (this.active) {
                    const newChaser = this.createChaser(Math.floor(Math.random() * this.config.types.length));
                    this.showBubble(newChaser, '再来！');
                }
            }, this.config.respawnDelay);
        }, 600);
    },

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.active) return;

        // 每隔约500ms刷新一次障碍物缓存
        if (!this._obstacleTimer || Date.now() - this._obstacleTimer > 500) {
            this._obstacleTimer = Date.now();
            this.refreshObstacles();
        }

        for (const chaser of this.chasers) {
            if (!chaser.alive) continue;

            const now = Date.now();

            // ===== 技能系统 =====
            // star: 瞬移
            const sk = this.skills;
            // 前摇期间不能再次触发
            if (chaser.type === 'star' && !chaser.casting && now > chaser.skillCdEnd && now - chaser.lastSkillCheck > 5000) {
                const dist = Math.sqrt((this.mouse.x - chaser.x) ** 2 + (this.mouse.y - chaser.y) ** 2);
                if (dist > sk.star.triggerMinDist && dist < sk.star.triggerMaxDist) {
                    chaser.lastSkillCheck = now;
                    chaser.casting = true; // 标记正在施法
                    
                    // 前摇动画
                    chaser.element.classList.add('chaser-casting');
                    this.showBubble(chaser, '蓄力中...');
                    
                    setTimeout(() => {
                        if (!chaser.alive) {
                            chaser.casting = false;
                            return;
                        }
                        chaser.element.classList.remove('chaser-casting');
                        chaser.casting = false;
                        
                        const dx = this.mouse.x - chaser.x;
                        const dy = this.mouse.y - chaser.y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d > sk.star.range) {
                            chaser.x = this.mouse.x - (dx / d) * sk.star.range;
                            chaser.y = this.mouse.y - (dy / d) * sk.star.range;
                        }
                        chaser.skillCdEnd = Date.now() + sk.star.cd;
                        chaser._path = null;
                        this.showBubble(chaser, '咻~');
                        chaser.element.classList.add('chaser-teleport');
                        setTimeout(() => chaser.element.classList.remove('chaser-teleport'), 500);
                        if (typeof AnimeHoloEffect !== 'undefined') {
                            AnimeHoloEffect.createBurst(chaser.x, chaser.y);
                        }
                    }, sk.star.castDelay);
                }
            }
            
            // 施法前摇期间停止移动
            if (chaser.casting) {
                chaser.element.style.left = chaser.x + 'px';
                chaser.element.style.top = chaser.y + 'px';
                continue;
            }

            // heart: 加速
            if (chaser.type === 'heart' && now > chaser.skillCdEnd) {
                const dist = Math.sqrt((this.mouse.x - chaser.x) ** 2 + (this.mouse.y - chaser.y) ** 2);
                if (dist > sk.heart.triggerDist) {
                    chaser.skillCdEnd = now + sk.heart.cd;
                    chaser.skillActiveEnd = now + sk.heart.duration;
                    chaser._path = null;
                    this.showBubble(chaser, '全速前进！');
                    chaser.element.classList.add('chaser-boost');
                    setTimeout(() => {
                        chaser.element.classList.remove('chaser-boost');
                        this.showBubble(chaser, '好累...');
                    }, sk.heart.duration);
                }
            }

            // cat: 被动穿墙
            if (chaser.type === 'cat') {
                const inObs = (this.cachedObstacles || []).some(obs =>
                    chaser.x > obs.left && chaser.x < obs.right && chaser.y > obs.top && chaser.y < obs.bottom
                );
                if (inObs) {
                    chaser.element.classList.add('chaser-phasing');
                } else {
                    chaser.element.classList.remove('chaser-phasing');
                }
                if (Math.random() < 0.003) {
                    const msgs = ['穿墙~', '墙挡不住我！', '喵~无视地形！', '穿过来了！'];
                    this.showBubble(chaser, msgs[Math.floor(Math.random() * msgs.length)]);
                }
            }

            let vx, vy;

            // 鼠标离开窗口时，追逐者随机方向离开屏幕
            if (!this.mouseInWindow && chaser.leavingVx !== undefined) {
                vx = chaser.leavingVx;
                vy = chaser.leavingVy;
            } else {
                // 正常追鼠标
                const path = this.calculatePath(chaser);
                vx = path.vx;
                vy = path.vy;
            }

            // 更新位置
            chaser.x += vx;
            chaser.y += vy;

            // ===== 卡住检测 =====
            // cat 穿墙不会卡住，跳过检测
            if (chaser.type !== 'cat' && !chaser.casting) {
                const now = Date.now();
                if (now - chaser.lastStuckCheck > 1500) {
                    const moved = Math.sqrt((chaser.x - chaser.lastStuckX) ** 2 + (chaser.y - chaser.lastStuckY) ** 2);
                    if (moved < 8) {
                        chaser._stuckCount = (chaser._stuckCount || 0) + 1;
                        if (chaser._stuckCount >= 3) {
                            // 多次卡住，传送到最近的边缘
                            const edge = this.findNearestEdge(chaser.x, chaser.y);
                            chaser.x = edge.x;
                            chaser.y = edge.y;
                            chaser._path = null;
                            chaser._stuckCount = 0;
                            this.showBubble(chaser, '卡住了...传送！');
                            chaser.element.classList.add('chaser-teleport');
                            setTimeout(() => chaser.element.classList.remove('chaser-teleport'), 500);
                        } else {
                            // 第一次卡住，尝试随机方向弹开
                            const angle = Math.random() * Math.PI * 2;
                            const pushDist = 80 + Math.random() * 60;
                            chaser.x += Math.cos(angle) * pushDist;
                            chaser.y += Math.sin(angle) * pushDist;
                            chaser._path = null;
                        }
                    } else {
                        chaser._stuckCount = 0;
                    }
                    chaser.lastStuckCheck = now;
                    chaser.lastStuckX = chaser.x;
                    chaser.lastStuckY = chaser.y;
                }
            }

            // 边界检查
            chaser.x = Math.max(-30, Math.min(window.innerWidth + 30, chaser.x));
            chaser.y = Math.max(-30, Math.min(window.innerHeight + 30, chaser.y));

            // 离开屏幕太远时移除并重生
            if (chaser.x < -80 || chaser.x > window.innerWidth + 80 ||
                chaser.y < -80 || chaser.y > window.innerHeight + 80) {
                chaser.element.remove();
                const index = this.chasers.indexOf(chaser);
                if (index > -1) this.chasers.splice(index, 1);

                setTimeout(() => {
                    if (this.active && this.mouseInWindow) {
                        const newChaser = this.createChaser(Math.floor(Math.random() * this.config.types.length));
                        this.showBubble(newChaser, '我回来啦！');
                    }
                }, this.config.respawnDelay);
                continue;
            }

            // 更新DOM
            chaser.element.style.left = chaser.x + 'px';
            chaser.element.style.top = chaser.y + 'px';

            // 根据移动方向翻转
            if (vx > 0.5) {
                chaser.element.style.transform = 'scaleX(1)';
            } else if (vx < -0.5) {
                chaser.element.style.transform = 'scaleX(-1)';
            }

            // 鼠标在窗口内时才检查追赶和气泡
            if (this.mouseInWindow) {
                // 检查是否追到
                if (this.checkCatch(chaser)) {
                    this.onCatch(chaser);
                }

                // 接近时显示气泡
                const dist = Math.sqrt((this.mouse.x - chaser.x) ** 2 + (this.mouse.y - chaser.y) ** 2);
                if (dist < 150 && Math.random() < 0.01) {
                    const msgs = ['嘿嘿...', '马上...', '别跑！', '等等我~'];
                    this.showBubble(chaser, msgs[Math.floor(Math.random() * msgs.length)]);
                }
            }
        }

        requestAnimationFrame(() => this.gameLoop());
    },

    /**
     * 销毁
     */
    destroy() {
        this.active = false;
        for (const chaser of this.chasers) {
            chaser.element.remove();
        }
        this.chasers = [];
    }
};

// 打字机效果初始化
function initTypingEffect() {
    const typingEls = document.querySelectorAll('.typing-text');
    for (const el of typingEls) {
        if (el._typingReady) continue;
        el._typingReady = true;
        const fullText = el.textContent;
        el.textContent = '';
        el.style.width = '0';
        el._fullText = fullText;
        el._typing = false;
        el._charIndex = 0;
    }

    const typingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target._typing) {
                const delay = parseInt(entry.target.dataset.typingDelay) || 800;
                setTimeout(() => startTyping(entry.target), delay);
            }
        });
    }, { threshold: 0.5 });

    for (const el of typingEls) {
        typingObserver.observe(el);
    }

    function startTyping(el) {
        el._typing = true;
        const text = el._fullText;
        const speed = parseInt(el.dataset.typingSpeed) || 150;

        function typeChar() {
            if (el._charIndex < text.length) {
                el.textContent = text.substring(0, el._charIndex + 1);
                el.style.width = 'auto';
                el._charIndex++;
                setTimeout(typeChar, speed);
            } else {
                setTimeout(() => {
                    el.style.borderRightColor = 'transparent';
                }, 3000);
            }
        }
        typeChar();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window._effectsInitialized) return;
    window._effectsInitialized = true;
    setTimeout(() => {
        AnimeHoloEffect.init();
        if (!window._NO_CHASER) MouseChaserGame.init();
    }, 500);

    initTypingEffect();

    // ====== 滚动滑入动画 ======
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale').forEach(el => {
        revealObserver.observe(el);
    });

    // ====== 技能进度条动画 ======
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fill = entry.target.querySelector('.skill-bar-fill');
                if (fill) {
                    const target = fill.dataset.width || '0';
                    fill.style.width = '0';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            fill.style.width = target;
                        });
                    });
                }
                barObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    // 观察已存在的进度条
    function observeSkillBars() {
        document.querySelectorAll('.skill-bar').forEach(el => {
            if (!el._observed) {
                el._observed = true;
                barObserver.observe(el);
            }
        });
    }
    observeSkillBars();

    // 监听动态添加的进度条（MutationObserver）
    const skillMutationObserver = new MutationObserver(() => {
        observeSkillBars();
    });
    skillMutationObserver.observe(document.body, { childList: true, subtree: true });

    // 暴露给 about.js 调用
    window.initScrollReveal = function () {
        observeSkillBars();
        document.querySelectorAll('.scroll-reveal:not(.revealed), .scroll-reveal-left:not(.revealed), .scroll-reveal-right:not(.revealed), .scroll-reveal-scale:not(.revealed)').forEach(el => {
            revealObserver.observe(el);
        });
    };

    // ====== 平滑滚动 ======
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// 页面切换后重新初始化打字效果和滚动动画
document.addEventListener('page:loaded', () => {
    setTimeout(initTypingEffect, 100);
    if (window.initScrollReveal) {
        setTimeout(() => window.initScrollReveal(), 200);
    }
});