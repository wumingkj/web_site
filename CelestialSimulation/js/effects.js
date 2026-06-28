/* ============================================
   CelestialSimulation - 炫酷太空特效
   Canvas 星空 + 流星 + 轨道行星 + 滚动动画
   ============================================ */
(function () {
    'use strict';

    /* ===== Canvas 星空背景 ===== */
    var canvas = document.createElement('canvas');
    canvas.id = 'starfield-canvas';
    Object.assign(canvas.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        zIndex: '-1', pointerEvents: 'none'
    });
    document.body.prepend(canvas);

    var ctx = canvas.getContext('2d');
    var stars = [];
    var shootingStars = [];
    var STAR_COUNT = 200;
    var w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function initStars() {
        stars = [];
        for (var i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    }
    initStars();
    window.addEventListener('resize', initStars);

    function spawnShootingStar() {
        if (Math.random() > 0.008) return;
        shootingStars.push({
            x: Math.random() * w * 0.8,
            y: Math.random() * h * 0.3,
            vx: 3 + Math.random() * 6,
            vy: 1 + Math.random() * 3,
            life: 1.0,
            decay: 0.008 + Math.random() * 0.015,
            length: 60 + Math.random() * 80
        });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        /* 星星 */
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            s.twinkle += s.twinkleSpeed;
            var alpha = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
            ctx.fill();

            /* 亮星加光晕 */
            if (s.r > 1.5 && alpha > 0.7) {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(124,92,252,' + (alpha * 0.15) + ')';
                ctx.fill();
            }
        }

        /* 流星 */
        spawnShootingStar();
        for (var j = shootingStars.length - 1; j >= 0; j--) {
            var m = shootingStars[j];
            var gradient = ctx.createLinearGradient(
                m.x, m.y,
                m.x - m.vx * m.length * 0.3, m.y - m.vy * m.length * 0.3
            );
            gradient.addColorStop(0, 'rgba(255,255,255,' + m.life + ')');
            gradient.addColorStop(0.3, 'rgba(200,220,255,' + (m.life * 0.6) + ')');
            gradient.addColorStop(1, 'rgba(124,92,252,0)');

            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.vx * m.length * 0.3, m.y - m.vy * m.length * 0.3);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;
            if (m.life <= 0) shootingStars.splice(j, 1);
        }

        requestAnimationFrame(draw);
    }
    draw();

    /* ===== Hero 轨道行星 ===== */
    var heroCanvas = document.createElement('canvas');
    heroCanvas.id = 'orbit-canvas';
    Object.assign(heroCanvas.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        pointerEvents: 'none'
    });
    var hero = document.querySelector('.hero');
    if (hero) {
        hero.style.position = 'relative';
        hero.style.overflow = 'hidden';
        hero.appendChild(heroCanvas);
    }

    var octx = heroCanvas.getContext('2d');
    var planets = [];
    var ow = 0, oh = 0;

    function resizeOrbit() {
        ow = heroCanvas.width = heroCanvas.parentElement.offsetWidth;
        oh = heroCanvas.height = heroCanvas.parentElement.offsetHeight;
    }

    function initPlanets() {
        planets = [];
        var cx = ow * 0.5, cy = oh * 0.45;
        var colors = [
            { body: '#ff6b6b', ring: 'rgba(255,107,107,0.15)' },
            { body: '#4dabf7', ring: 'rgba(77,171,247,0.12)' },
            { body: '#ffd43b', ring: 'rgba(255,212,59,0.1)' },
            { body: '#69db7c', ring: 'rgba(105,219,124,0.1)' }
        ];
        for (var i = 0; i < 4; i++) {
            planets.push({
                angle: Math.random() * Math.PI * 2,
                speed: 0.003 + Math.random() * 0.006,
                radius: 120 + i * 70 + Math.random() * 30,
                bodyRadius: 3 + Math.random() * 4,
                color: colors[i].body,
                ringColor: colors[i].ring,
                cx: cx, cy: cy
            });
        }
    }

    if (hero) {
        resizeOrbit();
        initPlanets();
        window.addEventListener('resize', function () {
            resizeOrbit();
            initPlanets();
        });

        function drawOrbit() {
            octx.clearRect(0, 0, ow, oh);

            var cx = ow * 0.5, cy = oh * 0.45;

            for (var i = 0; i < planets.length; i++) {
                var p = planets[i];
                p.cx = cx;
                p.cy = cy;
                p.angle += p.speed;

                /* 轨道线 */
                octx.beginPath();
                octx.ellipse(cx, cy, p.radius, p.radius * 0.4, 0, 0, Math.PI * 2);
                octx.strokeStyle = p.ringColor;
                octx.lineWidth = 0.5;
                octx.stroke();

                /* 行星 */
                var px = cx + Math.cos(p.angle) * p.radius;
                var py = cy + Math.sin(p.angle) * p.radius * 0.4;

                /* 光晕 */
                var glow = octx.createRadialGradient(px, py, 0, px, py, p.bodyRadius * 4);
                glow.addColorStop(0, p.color);
                glow.addColorStop(1, 'transparent');
                octx.beginPath();
                octx.arc(px, py, p.bodyRadius * 4, 0, Math.PI * 2);
                octx.fillStyle = glow;
                octx.fill();

                /* 本体 */
                octx.beginPath();
                octx.arc(px, py, p.bodyRadius, 0, Math.PI * 2);
                octx.fillStyle = p.color;
                octx.fill();
            }

            requestAnimationFrame(drawOrbit);
        }
        drawOrbit();
    }

    /* ===== 滚动入场动画 ===== */
    var observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .preview-card, .section-title, .download-card, .env-info, .install-info, .pain-card, .solution-banner, .feature-visual, .feature-points, .tech-card, .app-card, .closing-statement')
        .forEach(function (el) { observer.observe(el); });

    /* ===== 悬浮大纲滚动高亮 ===== */
    var tocLinks = document.querySelectorAll('.toc-list a');
    var sections = [];
    tocLinks.forEach(function (link) {
        var id = link.getAttribute('data-section');
        var el = document.getElementById(id);
        if (el) sections.push({ el: el, link: link });
    });

    function updateToc() {
        var scrollY = window.scrollY + window.innerHeight * 0.35;
        var current = null;
        for (var i = sections.length - 1; i >= 0; i--) {
            if (sections[i].el.offsetTop <= scrollY) {
                current = sections[i].link;
                break;
            }
        }
        tocLinks.forEach(function (l) { l.classList.remove('active'); });
        if (current) current.classList.add('active');
    }

    window.addEventListener('scroll', updateToc, { passive: true });
    updateToc();

    /* ===== 标题文字逐字发光 ===== */
    var titleEl = document.querySelector('.hero h1');
    if (titleEl) {
        var text = titleEl.textContent.trim();
        var iconEl = titleEl.querySelector('.title-icon');
        titleEl.innerHTML = '';
        if (iconEl) {
            titleEl.appendChild(iconEl);
            text = text.replace('CelestialSimulation', '').trim();
        }
        var spaceAdded = iconEl ? ' ' : '';
        for (var k = 0; k < text.length; k++) {
            var span = document.createElement('span');
            span.textContent = spaceAdded + text[k];
            span.style.animationDelay = (k * 0.06) + 's';
            span.className = 'char-reveal';
            titleEl.appendChild(span);
            spaceAdded = '';
        }
    }

    /* ===== 鼠标跟随渐变光晕 ===== */
    var glow = document.createElement('div');
    glow.className = 'mouse-glow';
    document.body.appendChild(glow);
    var glowTimer;

    document.addEventListener('mousemove', function (e) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
        glow.classList.add('visible');
        clearTimeout(glowTimer);
        glowTimer = setTimeout(function () { glow.classList.remove('visible'); }, 2000);
    }, { passive: true });

    /* ===== 大纲折叠 ===== */
    var tocToggle = document.getElementById('toc-toggle');
    var toc = document.getElementById('toc');
    if (tocToggle && toc) {
        tocToggle.addEventListener('click', function () {
            toc.classList.toggle('collapsed');
            tocToggle.textContent = toc.classList.contains('collapsed') ? '\u25C0' : '\u25B6';
        });
    }

})();