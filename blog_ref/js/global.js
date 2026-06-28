/**
 * Wuming Blog - 全局初始化
 * Live2D、音乐播放器、导航栏、主题、登录状态 —— 永远存活
 */
(function () {
    if (window.__globalInit) return;
    window.__globalInit = true;

    // ==================== API 工具 ====================
    window.WumingBlog = {
        async fetchAPI(endpoint, options) {
            try {
                var url = '/blog/api' + endpoint;
                var res = await fetch(url, {
                    ...options,
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json', ...(options && options.headers) }
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return await res.json();
            } catch (e) {
                console.error('API Error:', endpoint, e);
                return null;
            }
        },

        animateNumber(el, target, duration) {
            duration = duration || 1000;
            var step = target / (duration / 16);
            var current = 0;
            var timer = setInterval(function () {
                current += step;
                if (current >= target) { current = target; clearInterval(timer); }
                el.textContent = target >= 1000 ? (current / 1000).toFixed(1) + 'k' : Math.floor(current);
            }, 16);
        },

        currentUser: null,
        adminAvatar: null,
        adminUsername: null,

        renderAvatar(avatar, size) {
            size = size || 20;
            if (!avatar) return '👤';
            if (avatar.startsWith('data:image') || avatar.indexOf('/data/avatars') !== -1) {
                return '<img src="' + avatar + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover;vertical-align:middle;">';
            }
            return avatar;
        },

        // ==================== 移动端菜单 ====================
        initMobileMenu() {
            var toggle = document.getElementById('menu-toggle');
            var sidebar = document.getElementById('mobile-sidebar');
            var overlay = document.getElementById('sidebar-overlay');
            if (!toggle || !sidebar || !overlay) return;

            toggle.addEventListener('click', function () {
                toggle.classList.toggle('active');
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
            });

            overlay.addEventListener('click', function () {
                toggle.classList.remove('active');
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });

            sidebar.querySelectorAll('.sidebar-nav-item').forEach(function (item) {
                item.addEventListener('click', function () {
                    toggle.classList.remove('active');
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        },

        // ==================== 特效 ====================
        createFallingElements() {
            var elements = ['✨', '💫', '⭐', '🌟', '💎', '🔮', '❄️'];
            var create = function () {
                var el = document.createElement('div');
                el.className = 'falling-element';
                el.innerHTML = elements[Math.floor(Math.random() * elements.length)];
                el.style.cssText = 'left:' + Math.random() * 100 + 'vw;font-size:' + (10 + Math.random() * 15) +
                    'px;animation-duration:' + (5 + Math.random() * 5) + 's;opacity:' + (0.3 + Math.random() * 0.4) + ';';
                document.body.appendChild(el);
                setTimeout(function () { el.remove(); }, 10000);
            };
            setInterval(create, 600);
            for (var i = 0; i < 5; i++) setTimeout(create, i * 200);
        },

        createClickEffect() {
            var colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#da77f2'];
            document.addEventListener('click', function (e) {
                for (var i = 0; i < 8; i++) {
                    var p = document.createElement('div');
                    var color = colors[Math.floor(Math.random() * colors.length)];
                    var size = 4 + Math.random() * 4;
                    var angle = (i / 8) * Math.PI * 2;
                    var v = 50 + Math.random() * 30;
                    p.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:' + size +
                        'px;height:' + size + 'px;background:' + color + ';border-radius:50%;pointer-events:none;z-index:9999;' +
                        'animation:particle-fly 0.8s ease-out forwards;--tx:' + Math.cos(angle) * v + 'px;--ty:' + Math.sin(angle) * v + 'px;';
                    document.body.appendChild(p);
                    setTimeout(function () { p.remove(); }, 800);
                }
            });
            if (!document.getElementById('particle-style')) {
                var s = document.createElement('style');
                s.id = 'particle-style';
                s.textContent = '@keyframes particle-fly{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0}}';
                document.head.appendChild(s);
            }
        },

        createMouseTrail() {
            var particles = ['✨', '⭐', '💫', '🌟', '♡', '❀', '❁', '✧', '･ﾟ✧'];
            var colors = ['#ffb7c5', '#ffc0cb', '#e0bfff', '#b0e0e6', '#ffd1dc', '#c8a2c8'];
            if (!document.getElementById('trail-style')) {
                var s = document.createElement('style');
                s.id = 'trail-style';
                s.textContent = '.trail-particle{position:fixed!important;pointer-events:none!important;z-index:99999!important;animation:trail-fade 0.8s ease-out forwards!important;font-size:14px!important;opacity:0.8}@keyframes trail-fade{0%{opacity:0.8;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(0.2) translateY(-30px)}}';
                document.head.appendChild(s);
            }
            var lastTime = 0;
            document.addEventListener('mousemove', function (e) {
                var now = Date.now();
                if (now - lastTime < 40) return;
                lastTime = now;
                if (Math.random() > 0.7) return;
                var p = document.createElement('span');
                p.className = 'trail-particle';
                p.textContent = particles[Math.floor(Math.random() * particles.length)];
                p.style.left = (e.clientX + (Math.random() - 0.5) * 15) + 'px';
                p.style.top = (e.clientY + (Math.random() - 0.5) * 15) + 'px';
                p.style.color = colors[Math.floor(Math.random() * colors.length)];
                document.body.appendChild(p);
                setTimeout(function () { p.remove(); }, 800);
            });
        },

        // ==================== 登录状态 ====================
        initAuthStatus() {
            var self = this;
            this.loadAdminAvatar().catch(function () {});
            fetch('/blog/api/auth.php?action=check', { credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.loggedin && data.user) {
                        self.currentUser = data.user;
                        self.updateAuthUI(data.user);
                    }
                })
                .catch(function () {});
        },

        loadAdminAvatar() {
            var self = this;
            var cached = localStorage.getItem('adminAvatar');
            var cachedName = localStorage.getItem('adminUsername');
            var cacheTime = localStorage.getItem('adminAvatarTime');
            if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
                this.adminAvatar = cached;
                this.adminUsername = cachedName || 'Wuming';
                this.updateAdminAvatarUI();
            } else {
                this.updateAdminAvatarUI();
            }
            fetch('/blog/data/admin_info.json?t=' + Date.now())
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.success && data.admin) {
                        self.adminAvatar = data.admin.avatar;
                        self.adminUsername = data.admin.username;
                        localStorage.setItem('adminAvatar', data.admin.avatar);
                        localStorage.setItem('adminUsername', data.admin.username);
                        localStorage.setItem('adminAvatarTime', Date.now().toString());
                        self.updateAdminAvatarUI();
                    }
                })
                .catch(function () {});
        },

        updateAdminAvatarUI() {
            var avatar = this.adminAvatar || '💫';
            var hero = document.querySelector('.hero-avatar');
            if (hero) {
                if (avatar.startsWith('data:image') || avatar.indexOf('/data/avatars') !== -1) {
                    hero.innerHTML = '<img src="' + avatar + '" alt="avatar">';
                } else {
                    hero.textContent = avatar;
                }
            }
            var sidebar = document.getElementById('mobile-sidebar');
            if (sidebar && !this.currentUser) {
                var sa = sidebar.querySelector('.sidebar-header .sidebar-avatar');
                if (sa && !sa.classList.contains('user-link')) {
                    if (avatar.startsWith('data:image') || avatar.indexOf('/data/avatars') !== -1) {
                        sa.innerHTML = '<img src="' + avatar + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">';
                    } else {
                        sa.textContent = avatar;
                    }
                }
            }
        },

        updateAuthUI(user) {
            var navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                var loginLink = navLinks.querySelector('a[href="/blog/pages/login.html"]');
                if (loginLink) {
                    var userLink = document.createElement('a');
                    userLink.href = '/blog/pages/profile.html';
                    userLink.className = 'user-link';
                    userLink.innerHTML = this.renderAvatar(user.avatar) + ' ' + user.username;
                    loginLink.replaceWith(userLink);
                }
                if (user.role === 'admin' && !navLinks.querySelector('.admin-link') && !document.body.classList.contains('admin-page')) {
                    var adminLink = document.createElement('a');
                    adminLink.href = '/blog/pages/admin.html';
                    adminLink.className = 'admin-link';
                    adminLink.innerHTML = '⚙️ 管理';
                    adminLink.style.cssText = 'background:var(--gradient-primary);color:white;padding:8px 16px;border-radius:20px;';
                    navLinks.appendChild(adminLink);
                }
            }
            var sidebar = document.getElementById('mobile-sidebar');
            if (sidebar) {
                var sn = sidebar.querySelector('.sidebar-nav');
                if (sn) {
                    var li = sn.querySelector('a[href="/blog/pages/login.html"]');
                    if (li) {
                        var pi = document.createElement('a');
                        pi.href = '/blog/pages/profile.html';
                        pi.className = 'sidebar-nav-item';
                        pi.innerHTML = '<span>' + this.renderAvatar(user.avatar, 24) + '</span> ' + user.username;
                        li.replaceWith(pi);
                    }
                    if (user.role === 'admin' && !sn.querySelector('.admin-link') && !document.body.classList.contains('admin-page')) {
                        var al = document.createElement('a');
                        al.href = '/blog/pages/admin.html';
                        al.className = 'sidebar-nav-item admin-link';
                        al.innerHTML = '<span>⚙️</span> 管理';
                        sn.appendChild(al);
                    }
                }
                var sh = sidebar.querySelector('.sidebar-header');
                if (sh) {
                    var sa = sh.querySelector('.sidebar-avatar');
                    var sn2 = sh.querySelector('h3');
                    if (sa) {
                        if (user.avatar && (user.avatar.startsWith('data:image') || user.avatar.indexOf('/data/avatars') !== -1)) {
                            sa.innerHTML = '<img src="' + user.avatar + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">';
                        } else {
                            sa.textContent = user.avatar || '👤';
                        }
                    }
                    if (sn2) sn2.textContent = user.username;
                }
            }
        },

        // ==================== 标题切换 ====================
        initTitleSwitch() {
            var originalTitle = document.title;
            var leaveTitle = "(´・ω・`) 别走啊，再逛逛~";
            var timer = null;
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) {
                    timer = setTimeout(function () { document.title = leaveTitle; }, 500);
                } else {
                    if (timer) clearTimeout(timer);
                    document.title = originalTitle;
                }
            });
            document.addEventListener('mouseleave', function () {
                if (!document.hidden) document.title = leaveTitle;
            });
            document.addEventListener('mouseenter', function () {
                document.title = originalTitle;
            });
        },

        // ==================== 音乐播放器 ====================
        musicOpen: false,
        musicLoaded: false,

        initMusicPlayer() {
            if (this._musicPlayerInited) return;
            this._musicPlayerInited = true;

            var fab = document.getElementById('music-player-fab');
            var panel = document.getElementById('music-player');
            var close = document.getElementById('music-player-close');
            var header = panel ? panel.querySelector('.music-player-header') : null;
            if (!fab || !panel || !close) return;

            var self = this;
            var fabDragging = false, fabStartX, fabStartY, fabOrigLeft, fabOrigTop, fabMoved = false;

            fab.addEventListener('mousedown', function (e) {
                fabDragging = true; fabMoved = false;
                fabStartX = e.clientX; fabStartY = e.clientY;
                fabOrigLeft = fab.offsetLeft; fabOrigTop = fab.offsetTop;
                fab.classList.add('dragging');
                fab.style.left = fabOrigLeft + 'px';
                fab.style.top = fabOrigTop + 'px';
                fab.style.transform = 'none';
                e.preventDefault();
            });

            document.addEventListener('mousemove', function (e) {
                if (!fabDragging) return;
                var dx = e.clientX - fabStartX, dy = e.clientY - fabStartY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) fabMoved = true;
                fab.style.left = (fabOrigLeft + dx) + 'px';
                fab.style.top = (fabOrigTop + dy) + 'px';
            });

            document.addEventListener('mouseup', function () {
                if (fabDragging) { fab.classList.remove('dragging'); fabDragging = false; }
            });

            fab.addEventListener('touchstart', function (e) {
                fabDragging = true; fabMoved = false;
                var t = e.touches[0];
                fabStartX = t.clientX; fabStartY = t.clientY;
                fabOrigLeft = fab.offsetLeft; fabOrigTop = fab.offsetTop;
                fab.classList.add('dragging');
                fab.style.left = fabOrigLeft + 'px';
                fab.style.top = fabOrigTop + 'px';
                fab.style.transform = 'none';
            }, { passive: false });

            document.addEventListener('touchmove', function (e) {
                if (!fabDragging) return;
                var t = e.touches[0];
                var dx = t.clientX - fabStartX, dy = t.clientY - fabStartY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) fabMoved = true;
                fab.style.left = (fabOrigLeft + dx) + 'px';
                fab.style.top = (fabOrigTop + dy) + 'px';
            }, { passive: false });

            document.addEventListener('touchend', function () {
                if (fabDragging) { fab.classList.remove('dragging'); fabDragging = false; }
            });

            fab.addEventListener('click', function (e) {
                if (fabMoved) return;
                self.musicOpen = !self.musicOpen;
                if (self.musicOpen) {
                    var fr = fab.getBoundingClientRect();
                    var pw = 340, ph = 420;
                    var left = fr.right + 12, top = fr.top - 60;
                    if (left + pw > window.innerWidth - 8) left = fr.left - pw - 12;
                    if (left < 8) left = 8;
                    if (top < 8) top = 8;
                    if (top + ph > window.innerHeight - 8) top = window.innerHeight - ph - 8;
                    panel.style.left = left + 'px';
                    panel.style.top = top + 'px';
                    panel.style.right = 'auto';
                    panel.style.bottom = 'auto';
                    panel.classList.add('open');
                    fab.classList.add('active');
                    if (!self.musicLoaded) { self.musicLoaded = true; self._initAPlayer(); }
                } else {
                    panel.classList.remove('open');
                    fab.classList.remove('active');
                }
            });

            close.addEventListener('click', function (e) {
                e.stopPropagation();
                self.musicOpen = false;
                panel.classList.remove('open');
                fab.classList.remove('active');
            });

            var panelDrag = null;
            header.addEventListener('mousedown', function (e) {
                if (e.target === close) return;
                panelDrag = { startX: e.clientX, startY: e.clientY, left: panel.offsetLeft, top: panel.offsetTop };
                panel.classList.add('dragging');
                e.preventDefault();
            });

            document.addEventListener('mousemove', function (e) {
                if (!panelDrag || fabDragging) return;
                panel.style.left = (panelDrag.left + e.clientX - panelDrag.startX) + 'px';
                panel.style.top = (panelDrag.top + e.clientY - panelDrag.startY) + 'px';
            });

            document.addEventListener('mouseup', function () {
                if (panelDrag) { panel.classList.remove('dragging'); panelDrag = null; }
            });

            header.addEventListener('touchstart', function (e) {
                if (e.target === close) return;
                var t = e.touches[0];
                panelDrag = { startX: t.clientX, startY: t.clientY, left: panel.offsetLeft, top: panel.offsetTop };
                panel.classList.add('dragging');
            }, { passive: false });

            document.addEventListener('touchmove', function (e) {
                if (!panelDrag || fabDragging) return;
                var t = e.touches[0];
                panel.style.left = (panelDrag.left + t.clientX - panelDrag.startX) + 'px';
                panel.style.top = (panelDrag.top + t.clientY - panelDrag.startY) + 'px';
            }, { passive: false });

            document.addEventListener('click', function (e) {
                var path = e.composedPath();
                if (self.musicOpen && path.indexOf(panel) === -1 && path.indexOf(fab) === -1) {
                    self.musicOpen = false;
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

            this._initCustomVolume(ap);

            ap.on('timeupdate', function () {
                if (!self.lrcData || !self.lrcData.length) return;
                var ct = ap.audio.currentTime;
                var idx = -1;
                for (var i = self.lrcData.length - 1; i >= 0; i--) {
                    if (ct >= self.lrcData[i].time) { idx = i; break; }
                }
                self._highlightLrcLine(idx);
            });

            ap.on('listswitch', function () { self._loadLrcForCurrent(); });
            ap.on('listadd', function () { self._loadLrcForCurrent(); });
            ap.on('play', function () {
                if (self._currentSongIdx !== ap.list.index) { self._loadLrcForCurrent(); }
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
                    if (songs.length) ap.list.add(songs);
                })
                .catch(function () {
                    body.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">网络错误</p>';
                });
        },

        _initCustomVolume(ap) {
            var track = document.getElementById('custom-volume-track');
            var fill = document.getElementById('custom-volume-fill');
            var thumb = document.getElementById('custom-volume-thumb');
            var valEl = document.getElementById('custom-volume-val');
            var muteBtn = document.getElementById('custom-volume-mute');
            if (!track || !fill || !thumb || !valEl || !muteBtn) return;
            var self = this, dragging = false;

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
                    muteBtn.textContent = pct < 0.3 ? '🔈' : pct < 0.7 ? '🔉' : '🔊';
                }
            }

            function updateFromEvent(e) {
                var rect = track.getBoundingClientRect();
                var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
                setUI(x / rect.width);
            }

            track.addEventListener('mousedown', function (e) { dragging = true; updateFromEvent(e); e.preventDefault(); });
            track.addEventListener('touchstart', function (e) { dragging = true; updateFromEvent(e); e.preventDefault(); }, { passive: false });
            document.addEventListener('mousemove', function (e) { if (dragging) updateFromEvent(e); });
            document.addEventListener('touchmove', function (e) { if (dragging) updateFromEvent(e); }, { passive: false });
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
                    .catch(function () { self.lrcData = null; self._updateLrcBar('歌词加载失败', ''); });
            } else {
                this._parseLrc(meta.lrc);
            }
        },

        _parseLrc(lrcText) {
            if (!lrcText) { this.lrcData = null; this._updateLrcBar('暂无歌词', ''); return; }
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
            if (!data.length) this._updateLrcBar('纯音乐，请欣赏', '');
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
            if (this._lrcSlot === 0) {
                topEl.textContent = current; topEl.classList.add('active');
                botEl.textContent = next; botEl.classList.remove('active');
            } else {
                topEl.textContent = next; topEl.classList.remove('active');
                botEl.textContent = current; botEl.classList.add('active');
            }
            this._applyLrcScroll(topEl);
            this._applyLrcScroll(botEl);
        },

        _applyLrcScroll(el) {
            if (!el) return;
            el.classList.remove('lrc-scroll');
            el.style.animation = 'none';
            el.removeAttribute('data-text');
            var clone = el.cloneNode(true);
            clone.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;max-width:none;width:auto;display:inline-block;';
            document.body.appendChild(clone);
            var textW = clone.offsetWidth;
            document.body.removeChild(clone);
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
                if (idx !== this._currentLrcIdx) { this._lrcSlot = this._lrcSlot ? 0 : 1; }
                this._currentLrcIdx = idx;
                this._updateLrcBar(idx);
            }
        },

        initLrcFloatDrag() {
            var el = document.getElementById('lrc-float');
            if (!el) return;
            var startX, startY, startLeft, startTop, dragging = false;
            el.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return;
                startX = e.clientX; startY = e.clientY;
                var rect = el.getBoundingClientRect();
                startLeft = rect.left; startTop = rect.top;
                dragging = true; el.style.transition = 'none';
                e.preventDefault();
            });
            document.addEventListener('mousemove', function (e) {
                if (!dragging) return;
                var left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startLeft + e.clientX - startX));
                var top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startTop + e.clientY - startY));
                el.style.left = left + 'px'; el.style.top = top + 'px'; el.style.right = 'auto';
            });
            document.addEventListener('mouseup', function () { if (dragging) { dragging = false; el.style.transition = ''; } });
            el.addEventListener('touchstart', function (e) {
                var t = e.touches[0];
                startX = t.clientX; startY = t.clientY;
                var rect = el.getBoundingClientRect();
                startLeft = rect.left; startTop = rect.top;
                dragging = true; el.style.transition = 'none';
            }, { passive: false });
            document.addEventListener('touchmove', function (e) {
                if (!dragging) return;
                var t = e.touches[0];
                var left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startLeft + t.clientX - startX));
                var top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startTop + t.clientY - startY));
                el.style.left = left + 'px'; el.style.top = top + 'px'; el.style.right = 'auto';
            }, { passive: false });
            document.addEventListener('touchend', function () { if (dragging) { dragging = false; el.style.transition = ''; } });
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
                    if (self._currentLrcIdx >= 0 && self.lrcData && self.lrcData.length) {
                        self._updateLrcBar(self._currentLrcIdx);
                    }
                }
            }
            btn.addEventListener('click', function () {
                self._lrcMode = (self._lrcMode === 'float') ? 'toast' : 'float';
                updateUI();
            });
            updateUI();
        },

        // ==================== 简单 Markdown 解析 ====================
        parseMarkdown(text) {
            if (!text) return '';
            var html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, function (match, lang, code) {
                return '<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;overflow-x:auto;margin:12px 0;font-family:monospace;font-size:0.9em;"><code>' + code.trim() + '</code></pre>';
            });
            var lines = html.split('\n');
            var processed = [];
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (/^#{1,3}\s/.test(line)) {
                    var level = line.match(/^(#{1,3})\s/)[1].length;
                    var content = line.replace(/^#{1,3}\s+/, '');
                    var sizes = { 1: '1.8em', 2: '1.4em', 3: '1.2em' };
                    processed.push('<h' + level + ' style="font-size:' + sizes[level] + ';margin:12px 0 8px;font-weight:600;">' + content + '</h' + level + '>');
                    continue;
                }
                if (/^[-]{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
                    processed.push('<hr style="border:none;border-top:1px solid rgba(77,171,247,0.2);margin:16px 0;">');
                    continue;
                }
                if (/^\s*[-*]\s/.test(line)) {
                    processed.push('<li style="margin:4px 0 4px 20px;">' + line.replace(/^\s*[-*]\s+/, '') + '</li>');
                    continue;
                }
                processed.push(line);
            }
            html = processed.join('\n');
            html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+=(\d+)(?:x(\d+))?(?:\s+(contain|cover|fill|none))?)?\)/g, function (match, alt, url, width, height, fit) {
                var style = 'max-width:100%;height:auto;border-radius:8px;margin:8px 0;';
                if (width) style = 'width:' + width + 'px;' + (height ? 'height:' + height + 'px;' : '') + 'border-radius:8px;margin:8px 0;object-fit:' + (fit || 'contain') + ';';
                return '<img src="' + url + '" alt="' + alt + '" style="' + style + 'cursor:pointer;transition:transform 0.2s;" onclick="WumingBlog.showLightbox(this.src)" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">';
            });
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--primary);text-decoration:underline;">$1</a>');
            html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            html = html.replace(/~~([^~]+)~~/g, '<del style="color:#999;">$1</del>');
            html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(77,171,247,0.1);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>');
            html = html.replace(/\n/g, '<br>');
            return html;
        },

        showLightbox(src) {
            var existing = document.getElementById('lightbox-overlay');
            if (existing) existing.remove();
            var overlay = document.createElement('div');
            overlay.id = 'lightbox-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:99999;cursor:zoom-out;';
            overlay.innerHTML = '<img src="' + src + '" style="max-width:90%;max-height:90%;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.5);"><button style="position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;color:white;font-size:30px;width:50px;height:50px;border-radius:50%;cursor:pointer;">×</button>';
            overlay.querySelector('button').onclick = function () { overlay.remove(); };
            overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
            });
            document.body.appendChild(overlay);
        },

        showError(container, message) {
            message = message || '加载失败';
            if (typeof container === 'string') container = document.getElementById(container);
            if (container) {
                container.innerHTML = '<article class="post-card"><div class="post-header"><span class="post-title">哎呀，' + message + ' (╯°□°)╯</span></div><p class="post-excerpt">请刷新页面试试，如果问题持续存在，请联系管理员。</p></article>';
            }
        }
    };

    // ==================== DOMContentLoaded 初始化 ====================
    document.addEventListener('DOMContentLoaded', function () {
        if (window.__globalDomReady) return;
        window.__globalDomReady = true;

        if (!window._NO_EFFECTS) {
            WumingBlog.createFallingElements();
            WumingBlog.createClickEffect();
            WumingBlog.createMouseTrail();
        }
        WumingBlog.initMobileMenu();
        WumingBlog.initAuthStatus();
        WumingBlog.initTitleSwitch();
        WumingBlog.initMusicPlayer();
        WumingBlog.initLrcFloatDrag();
        WumingBlog.initLrcToggle();

        if (typeof Toast !== 'undefined') {
            Toast.init();
        }
    });
})();