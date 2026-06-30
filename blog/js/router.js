/**
 * Wuming Blog - SPA 路由
 * 通用路由：零硬编码，从 fragments/ 加载页面片段，动态执行脚本
 */
(function () {
    if (window.__routerInit) return;
    window.__routerInit = true;

    var DURATION = 180;
    var appEl = document.getElementById('app');

    // 全局脚本 basename（已在 index.html 加载，跳过不重复加载）
    var GLOBAL = [
        'router.js', 'global.js', 'toast.js', 'effects.js', 'home.js',
        'live2d_manager.js', 'pixi.min.js', 'live2dcubismcore.min.js',
        'live2dcubismframework.js', 'live2dcubismpixi.js', 'l2d.js', 'charData.js', 'marked.min.js'
    ];

    function isGlobal(src) {
        var base = (src || '').split('?')[0];
        if (base.indexOf('http://') === 0 || base.indexOf('https://') === 0 || base.indexOf('//') === 0) return true;
        for (var i = 0; i < GLOBAL.length; i++) {
            if (base.indexOf(GLOBAL[i]) !== -1) return true;
        }
        return false;
    }

    // 当前页面加载的脚本标签（用于清理）
    var _scripts = [];

    // ==================== URL → 片段映射（纯函数，零查表） ====================
    function hrefToFragment(href) {
        // 去掉 query 和 hash
        var path = href.split('?')[0].split('#')[0];
        // 去掉开头的 /blog/
        path = path.replace(/^\/blog\//, '');
        // 首页
        if (path === '' || path === 'index.html') return '/blog/fragments/home.html';
        // 去掉 pages/ 前缀
        if (path.indexOf('pages/') === 0) path = path.slice(6);
        return '/blog/fragments/' + path;
    }

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
            console.warn('router: safety timeout');
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

    // ==================== 清理旧页面脚本 ====================
    function cleanupScripts() {
        document.dispatchEvent(new CustomEvent('page:beforeunload'));
        _scripts = [];
    }

    // ==================== 加载页面片段 ====================
    function loadPage(href) {
        var fragmentUrl = hrefToFragment(href);

        fadeOut(function () {
            fetch(fragmentUrl)
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.text();
                })
                .then(function (html) {
                    // 1. 清理旧脚本
                    cleanupScripts();

                    // 2. 替换内容
                    appEl.innerHTML = html;
                    appEl.className = (href === '/blog/' || href === '/blog/index.html')
                        ? 'home-container'
                        : 'page-container';

                    // 3. 更新标题
                    var h1 = appEl.querySelector('h1');
                    if (h1) {
                        var title = h1.textContent.trim();
                        document.title = title + ' | Wuming Blog';
                    }

                    // 4. 执行内联脚本
                    var inlines = appEl.querySelectorAll('script:not([src])');
                    for (var i = 0; i < inlines.length; i++) {
                        var code = inlines[i].textContent.trim();
                        if (code) {
                            try { (new Function(code))(); }
                            catch (e) { console.warn('router: inline script error', e); }
                        }
                    }

                    // 4.5 先派发 page:loaded（在加载外部脚本前，避免重复初始化）
                    document.dispatchEvent(new CustomEvent('page:loaded', { detail: { href: href } }));

                    // 5. 加载外部脚本（每次创建独立作用域，避免 let/const 重复声明冲突）
                    var extScripts = appEl.querySelectorAll('script[src]');
                    var pending = 0;

                    function checkDone() {
                        if (pending === 0) {
                            // page:loaded 已在脚本加载前派发，此处仅用于完成回调
                        }
                    }

                    for (var j = 0; j < extScripts.length; j++) {
                        var src = extScripts[j].getAttribute('src');
                        var base = src.split('?')[0];
                        if (isGlobal(src)) continue;
                        pending++;
                        _scripts.push(src);
                        (function (url) {
                            fetch(url)
                                .then(function (res) { return res.text(); })
                                .then(function (code) {
                                    try {
                                        (new Function(code))();
                                    } catch (e) {
                                        console.warn('router: script error', url, e);
                                    }
                                    pending--;
                                    checkDone();
                                })
                                .catch(function () {
                                    console.warn('router: script load failed', url);
                                    pending--;
                                    checkDone();
                                });
                        })(src);
                    }

                    checkDone();

                    // 6. 完成
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

        // 排除特殊页面（独立布局，不走 SPA）
        if (href.indexOf('post3d') !== -1 ||
            href === '/blog/50x.html' ||
            href === '/blog/404.html') return;

        e.preventDefault();

        if (!appEl) {
            window.location.href = href;
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

    // 初始历史记录
    history.replaceState({ href: window.location.pathname + window.location.search }, '', window.location.href);

    // 暴露全局导航函数，供 login.js 等脚本使用，避免 location.href 打断音乐/live2d
    window.__navigate = loadPage;
})();