/**
 * Wuming Blog - 关于页面脚本
 */

async function initAboutPage() {
    try {
        const aboutRes = await WumingBlog.fetchAPI('/about.php');
        if (!aboutRes) return;

        // 尝试从缓存获取头像
        const cachedAvatar = localStorage.getItem('adminAvatar');
        const cacheTime = localStorage.getItem('adminAvatarTime');
        let avatar = aboutRes.avatar || '💫';

        if (cachedAvatar && cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
            avatar = cachedAvatar;
        }

        renderAbout({ ...aboutRes, avatar: avatar });

        // 后台异步更新头像
        if (!cachedAvatar || !cacheTime || Date.now() - parseInt(cacheTime) >= 86400000) {
            fetch('/blog/data/admin_info.json?t=' + Date.now())
                .then(res => res.json())
                .then(adminData => {
                    if (adminData.success && adminData.admin) {
                        localStorage.setItem('adminAvatar', adminData.admin.avatar);
                        localStorage.setItem('adminUsername', adminData.admin.username);
                        localStorage.setItem('adminAvatarTime', Date.now().toString());
                        updateAvatar(adminData.admin.avatar);
                    }
                })
                .catch(() => {});
        }
    } catch (error) {
        console.error('Load about data failed');
    }
}

function renderAbout(data) {
    updateAvatar(data.avatar);

    const nameEl = document.querySelector('.about-name');
    if (nameEl) nameEl.textContent = data.name || '无名';

    const titleEl = document.querySelector('.about-title');
    if (titleEl) titleEl.textContent = data.title || '';

    const bioEl = document.querySelector('.about-bio');
    if (bioEl && data.bio) bioEl.innerHTML = data.bio;

    // 技能进度条
    renderSkillBars(data.skills);

    // 时间线
    renderTimeline(data.timeline);

    // 联系方式
    renderContact(data.contact, data.social);

    // 站点信息
    renderSiteInfo(data.site_info);

    // 重新初始化滚动动画（因为内容是动态生成的）
    if (typeof initScrollReveal === 'function') initScrollReveal();
}

function updateAvatar(avatar) {
    const avatarEl = document.querySelector('.about-avatar');
    if (!avatarEl) return;
    if (avatar && (avatar.startsWith('data:image') || avatar.startsWith('/blog/data/avatars') || avatar.startsWith('/data/avatars'))) {
        avatarEl.innerHTML = '<img src="' + avatar + '" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
    } else {
        avatarEl.textContent = avatar || '💫';
    }
}

function renderSkillBars(skills) {
    const container = document.querySelector('.skill-bars');
    if (!container || !skills) return;

    if (skills.length > 0 && typeof skills[0] === 'object' && skills[0].percent !== undefined) {
        container.innerHTML = skills.map(function (skill, i) {
            var delay = (Math.floor(i / 2) + 1);
            var color = skill.color || '';
            var barStyle = color ? 'background:linear-gradient(90deg,' + color + ',' + color + 'cc);' : '';
            return '<div class="skill-bar scroll-reveal scroll-delay-' + Math.min(delay, 4) + '">' +
                '<div class="skill-bar-header">' +
                    '<span class="skill-bar-name">' + skill.name + '</span>' +
                    '<span class="skill-bar-percent">' + skill.percent + '%</span>' +
                '</div>' +
                '<div class="skill-bar-track">' +
                    '<div class="skill-bar-fill" data-width="' + skill.percent + '%" style="' + barStyle + '"></div>' +
                '</div>' +
            '</div>';
        }).join('');
    } else {
        container.innerHTML = skills.map(function (skill, i) {
            var delay = (Math.floor(i / 2) + 1);
            return '<div class="skill-bar scroll-reveal scroll-delay-' + Math.min(delay, 4) + '">' +
                '<div class="skill-bar-header">' +
                    '<span class="skill-bar-name">' + skill + '</span>' +
                '</div>' +
                '<div class="skill-bar-track">' +
                    '<div class="skill-bar-fill" data-width="75%"></div>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    // 动画交给 effects.js 的 MutationObserver / barObserver 处理
}

function renderTimeline(timeline) {
    const container = document.querySelector('.timeline');
    if (!container || !timeline) return;

    container.innerHTML = timeline.map(function (item, i) {
        var delay = Math.min(i + 1, 4);
        return '<div class="timeline-item scroll-reveal scroll-delay-' + delay + '">' +
            '<div class="timeline-date">' + item.year + '</div>' +
            '<div class="timeline-title">' + item.title + '</div>' +
            '<div class="timeline-desc">' + (item.desc || '') + '</div>' +
        '</div>';
    }).join('');
}

function renderContact(contact, social) {
    const section = document.querySelector('.about-contact');
    if (!section || !contact) return;

    var html = '<p>' + (contact.description || '') + '</p>';

    if (contact.email) {
        html += '<p><strong>📧 邮箱：</strong><a href="mailto:' + contact.email + '">' + contact.email + '</a></p>';
    }
    if (contact.github) {
        html += '<p><strong>🐙 GitHub：</strong>' + contact.github + '</p>';
    }
    if (social) {
        if (social.qq) {
            html += '<p><strong>💬 QQ：</strong>' + social.qq + '</p>';
        }
        if (social.bilibili) {
            html += '<p><strong>📺 B站：</strong>' + social.bilibili + '</p>';
        }
        if (social.csdn) {
            html += '<p><strong>📚 CSDN：</strong>' + social.csdn + '</p>';
        }
    }
    html += '<p class="about-contact-ending">期待与你的交流！✨</p>';
    section.innerHTML = html;
}

function renderSiteInfo(siteInfo) {
    const container = document.querySelector('.about-site-info');
    if (!container || !siteInfo) return;

    var html = '';
    if (siteInfo.start_date) {
        var start = new Date(siteInfo.start_date);
        var now = new Date();
        var days = Math.floor((now - start) / 86400000);
        html += '<p>🐾 博客已运行 <strong>' + days + '</strong> 天</p>';
    }
    if (siteInfo.powered_by) {
        html += '<p>⚡ Powered by ' + siteInfo.powered_by + '</p>';
    }
    if (siteInfo.icp) {
        html += '<p>ICP备案：' + siteInfo.icp + '</p>';
    }
    container.innerHTML = html;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutPage);
} else {
    initAboutPage();
}