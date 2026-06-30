/**
 * Wuming Blog - 登录/注册页面脚本
 */

window.__navigate = window.__navigate || function (url) { window.location.href = url; };

function initLoginPage() {
    // Tab切换
    document.querySelectorAll('.login-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.login-tab').forEach(function (t) { t.classList.remove('active'); });
            document.querySelectorAll('.login-form').forEach(function (f) { f.classList.remove('active'); });

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm').classList.add('active');

            hideMessages();
        });
    });

    // 显示/隐藏消息
    function showError(msg) {
        var el = document.getElementById('errorMsg');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
        var successEl = document.getElementById('successMsg');
        if (successEl) successEl.style.display = 'none';
    }

    function showSuccess(msg) {
        var el = document.getElementById('successMsg');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
        var errorEl = document.getElementById('errorMsg');
        if (errorEl) errorEl.style.display = 'none';
    }

    function hideMessages() {
        var errorEl = document.getElementById('errorMsg');
        var successEl = document.getElementById('successMsg');
        if (errorEl) errorEl.style.display = 'none';
        if (successEl) successEl.style.display = 'none';
    }

    // 登录
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            var username = document.getElementById('loginUsername').value.trim();
            var password = document.getElementById('loginPassword').value;
            var btn = document.getElementById('loginBtn');

            if (!username || !password) {
                showError('请输入用户名和密码');
                return;
            }

            btn.disabled = true;
            btn.textContent = '登录中...';

            try {
                var res = await fetch('/blog/api/auth.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, password: password })
                });

                var data = await res.json();

                if (data.success) {
                    showSuccess('登录成功！正在跳转...');
                    if (data.user && window.WumingBlog && window.WumingBlog.updateAuthUI) {
                        window.WumingBlog.updateAuthUI(data.user);
                    }
                    setTimeout(function () {
                        if (data.user && data.user.role === 'admin') {
                            window.__navigate('/blog/pages/admin.html');
                        } else {
                            window.__navigate('/blog/');
                        }
                    }, 1500);
                } else {
                    showError(data.message || '登录失败');
                }
            } catch (err) {
                showError('网络错误，请稍后重试');
            }

            btn.disabled = false;
            btn.textContent = '登录';
        });
    }

    // 注册
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            var username = document.getElementById('regUsername').value.trim();
            var email = document.getElementById('regEmail').value.trim();
            var password = document.getElementById('regPassword').value;
            var password2 = document.getElementById('regPassword2').value;
            var btn = document.getElementById('registerBtn');

            if (!username || !password) {
                showError('请填写用户名和密码');
                return;
            }

            if (username.length < 2) {
                showError('用户名至少需要2个字符');
                return;
            }

            if (password.length < 6) {
                showError('密码至少需要6个字符');
                return;
            }

            if (password !== password2) {
                showError('两次输入的密码不一致');
                return;
            }

            btn.disabled = true;
            btn.textContent = '注册中...';

            try {
                var res = await fetch('/blog/api/auth.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, email: email, password: password })
                });

                var data = await res.json();

                if (data.success) {
                    showSuccess('注册成功！正在跳转...');
                    setTimeout(function () {
                        window.__navigate('/blog/');
                    }, 1000);
                } else {
                    showError(data.message || '注册失败');
                }
            } catch (err) {
                showError('网络错误，请稍后重试');
            }

            btn.disabled = false;
            btn.textContent = '注册';
        });
    }

    // 检查是否已登录
    fetch('/blog/api/auth.php?action=check', { credentials: 'same-origin' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success && data.loggedin && data.user) {
                if (window.WumingBlog && window.WumingBlog.updateAuthUI) {
                    window.WumingBlog.updateAuthUI(data.user);
                }
                if (data.user.role === 'admin') {
                    window.__navigate('/blog/pages/admin.html');
                } else {
                    window.__navigate('/blog/');
                }
            }
        })
        .catch(function () {});
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    initLoginPage();
}