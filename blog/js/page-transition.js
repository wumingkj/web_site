/**
 * Wuming Blog - SPA 页面过渡
 * 通用路由：提取内容 + 动态加载页面专属脚本/CSS，保持全局资源不中断
 */
(function () {
    if (window._pageTransitionInit) return;
    window._pageTransitionInit = true;

    var DURATION = 180;
    var contentEl = document.getElementById('page-content');

    // 全局脚本 basename（不会被移除）
    var GLOBAL_SCRIPTS = [
        'page-transition.js', 'common.js', 'toast.js', 'effects.js', 'home.js',
        'marked.min.js', 'pixi.min.js', 'live2dcubismcore.min.js',
        'live2dcubismframework.js', 'live2dcubismpixi.js',
        'charData.js', 'l2d.js', 'kanban.js'
    ];

    function isGlobal(src) {
        var base = (src || '').split('?')[0];
        if (base.indexOf('http://') === 0 || base.indexOf('https://') === 0) return true;
        for (var i = 0; i < GLOBAL_SCRIPTS.length; i++) {
            if (base.indexOf(GLOBAL_SCRIPTS[i]) !== -1) return true;
        }
        return false;
    }

    // 当前页面加载的专属脚本（用于清理）
    var _pageScripts = [];

    // ==================== 过渡层 ====================
    var overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:var(--body-bg,#f5f7fa);z-index:99999;' +
        'opacity:0;pointer-events:none;transition:opacity ' + DURATION + 'ms ease-in;';
    document.body.appendChild(overlay);

    function fadeOut(cb) {
        overlay.style.pointerEvents = 'auto';
        overlay.style.opacity = '1';
        var safety = setTimeout(function () {
            fadeIn();
            console.warn('page-transition: safety timeout');
        }, 5000);
        setTimeout(function () {
            clearTimeout(safety);
            cb();
        }, DURATION);
    }

    function fadeIn() {
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
    }

    function updateNav(href) {
        document.querySelectorAll('.nav-links a, .sidebar-nav a').forEach(function (a) {
            var aHref = a.getAttribute('href');
            a.classList.toggle('active', aHref === href || aHref === href + 'index.html');
        });
    }

    // ==================== 资源清理 ====================
    function cleanupPageResources() {
        // 通知即将卸载（页面脚本可监听此事件做清理）
        document.dispatchEvent(new CustomEvent('page:beforeunload'));

        // 移除旧的页面专属脚本
        for (var i = 0; i < _pageScripts.length; i++) {
            var s = _pageScripts[i];
            if (s && s.parentNode) s.remove();
        }
        _pageScripts = [];
    }

    // ==================== 资源加载 ====================
    function loadPageResources(doc) {
        // 执行内联脚本（在加载外部脚本之前，确保 _NO_EFFECTS 等标志先设置）
        var inlineScripts = doc.querySelectorAll('script:not([src])');
        for (var i = 0; i < inlineScripts.length; i++) {
            var code = inlineScripts[i].textContent.trim();
            if (code) {
                try {
                    // 使用 Function 构造器执行，作用域为全局
                    (new Function(code))();
                } catch (e) {
                    console.warn('page-transition: inline script error', e);
                }
            }
        }

        // 加载页面专属脚本
        var scripts = doc.querySelectorAll('script[src]');
        var pending = 0;
        var done = false;

        function checkDone() {
            if (done) return;
            if (pending === 0) {
                done = true;
                document.dispatchEvent(new CustomEvent('page:loaded'));
            }
        }

        // 收集已存在的脚本 src（去重）
        var existing = [];
        document.querySelectorAll('script[src]').forEach(function (s) {
            existing.push(s.getAttribute('src').split('?')[0]);
        });

        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src');
            var base = src.split('?')[0];
            if (isGlobal(src) || existing.indexOf(base) !== -1) continue;
            existing.push(base);
            pending++;
            var script = document.createElement('script');
            script.src = src;
            script.onload = function () { pending--; checkDone(); };
            script.onerror = function () { pending--; checkDone(); };
            document.body.appendChild(script);
            _pageScripts.push(script);
        }

        checkDone();
    }

    // ==================== 页面加载 ====================
    function loadPage(href) {
        fadeOut(function () {
            fetch(href)
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.text();
                })
                .then(function (html) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');

                    var newContent = doc.getElementById('page-content');
                    if (!newContent) {
                        window.location.href = href;
                        return;
                    }

                    var newTitle = doc.querySelector('title');
                    if (newTitle) document.title = newTitle.textContent;

                    // 1. 清理旧页面资源
                    cleanupPageResources();

                    // 2. 替换内容
                    contentEl.innerHTML = newContent.innerHTML;
                    contentEl.className = newContent.className;

                    // 3. 加载新页面资源
                    loadPageResources(doc);

                    // 4. 完成
                    history.pushState({ href: href }, '', href);
                    updateNav(href);
                    window.scrollTo(0, 0);
                    fadeIn();
                })
                .catch(function () {
                    window.location.href = href;
                });
        });
    }

    // ==================== 事件监听 ====================
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href || href.indexOf('http') === 0 || href.indexOf('//') === 0 ||
            href.indexOf('#') === 0 || href.indexOf('mailto:') === 0 ||
            href.indexOf('tel:') === 0) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;
        if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey) return;

        // 排除特殊页面（有独立布局，不走 SPA）
        if (href.indexOf('post3d') !== -1 ||
            href.indexOf('/admin') !== -1 ||
            href.indexOf('/login') !== -1 ||
            href === '/blog/50x.html' ||
            href === '/blog/404.html') return;

        e.preventDefault();

        if (!contentEl) {
            fadeOut(function () { window.location.href = href; });
            return;
        }

        loadPage(href);
    });

    window.addEventListener('popstate', function (e) {
        if (e.state && e.state.href) {
            loadPage(e.state.href);
        }
    });

    // ==================== 初始淡入 ====================
    document.documentElement.style.opacity = '0';
    document.documentElement.style.transition = 'opacity ' + DURATION + 'ms ease-out';

    function initFadeIn() {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.documentElement.style.opacity = '1';
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFadeIn);
    } else {
        initFadeIn();
    }
})();