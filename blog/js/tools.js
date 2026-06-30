/**
 * Wuming Blog - 工具箱脚本
 */

/* ===== 密码生成器 ===== */
function generatePassword() {
    const length = parseInt(document.getElementById('pwd-length').value) || 16;
    const useUpper = document.getElementById('pwd-upper').checked;
    const useLower = document.getElementById('pwd-lower').checked;
    const useNumbers = document.getElementById('pwd-numbers').checked;
    const useSymbols = document.getElementById('pwd-symbols').checked;

    let chars = '';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
        Toast.show({ message: '请至少选择一种字符类型', type: 'warning' });
        return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
    }

    document.getElementById('pwd-output').value = password;
    updatePwdStrength(password);
}

function updatePwdStrength(pwd) {
    const bar = document.querySelector('#pwd-strength .bar');
    const text = document.getElementById('pwd-strength-text');
    if (!bar || !text) return;

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
        { min: 0, w: '10%',  c: '#ff6b6b', t: '极弱' },
        { min: 2, w: '30%',  c: '#ffa94d', t: '弱' },
        { min: 4, w: '60%',  c: '#ffd43b', t: '中等' },
        { min: 5, w: '80%',  c: '#69db7c', t: '强' },
        { min: 6, w: '100%', c: '#38d9a9', t: '很强' },
    ];
    const lv = [...levels].reverse().find(l => score >= l.min) || levels[0];
    bar.style.width = lv.w;
    bar.style.background = lv.c;
    text.textContent = lv.t;
    text.style.color = lv.c;
}

/* ===== JSON 格式化 ===== */
function formatJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    if (!input) return;
    try {
        output.value = JSON.stringify(JSON.parse(input), null, 2);
        output.style.color = '';
    } catch (e) {
        output.value = 'JSON 格式错误: ' + e.message;
        output.style.color = '#ff6b6b';
    }
}

function minifyJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    if (!input) return;
    try {
        output.value = JSON.stringify(JSON.parse(input));
        output.style.color = '';
    } catch (e) {
        output.value = 'JSON 格式错误: ' + e.message;
        output.style.color = '#ff6b6b';
    }
}

/* ===== 时间戳转换 ===== */
let tsTimer = null;

function startTimestamp() {
    function tick() {
        const el = document.getElementById('current-time');
        if (!el) return;
        const now = new Date();
        const sec = Math.floor(now.getTime() / 1000);
        const ms = now.getTime();
        const local = now.toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        el.innerHTML = `${sec} <small>(毫秒: ${ms})</small><br><small>${local}</small>`;
    }
    tick();
    tsTimer = setInterval(tick, 1000);
}

function tsToDate() {
    const val = document.getElementById('ts-input').value.trim();
    const out = document.getElementById('ts-output');
    if (!val) return;
    let ts = parseInt(val);
    if (ts > 1e12) ts = ts / 1000;
    const d = new Date(ts * 1000);
    if (isNaN(d.getTime())) { out.textContent = '无效的时间戳'; return; }
    out.innerHTML = '<strong>本地:</strong> ' + d.toLocaleString('zh-CN') +
        '<br><strong>UTC:</strong> ' + d.toUTCString() +
        '<br><strong>ISO:</strong> ' + d.toISOString();
}

function dateToTs() {
    const val = document.getElementById('date-input').value;
    const out = document.getElementById('date-output');
    if (!val) return;
    const d = new Date(val);
    out.innerHTML = '<strong>秒:</strong> ' + Math.floor(d.getTime() / 1000) +
        '<br><strong>毫秒:</strong> ' + d.getTime();
}

/* ===== Base64 编解码 ===== */
function encodeB64() {
    const input = document.getElementById('b64-input').value;
    const output = document.getElementById('b64-output');
    try {
        const bytes = new TextEncoder().encode(input);
        output.value = btoa(String.fromCharCode(...bytes));
        output.style.color = '';
    } catch (e) {
        output.value = '编码失败: ' + e.message;
        output.style.color = '#ff6b6b';
    }
}

function decodeB64() {
    const input = document.getElementById('b64-input').value.trim();
    const output = document.getElementById('b64-output');
    try {
        const bin = atob(input);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        output.value = new TextDecoder().decode(bytes);
        output.style.color = '';
    } catch (e) {
        output.value = '解码失败，请输入有效的 Base64 字符串';
        output.style.color = '#ff6b6b';
    }
}

/* ===== URL 编解码 ===== */
function encodeURI_() {
    const input = document.getElementById('url-input').value;
    document.getElementById('url-output').value = encodeURIComponent(input);
    document.getElementById('url-output').style.color = '';
}

function decodeURI_() {
    const input = document.getElementById('url-input').value.trim();
    try {
        document.getElementById('url-output').value = decodeURIComponent(input);
        document.getElementById('url-output').style.color = '';
    } catch (e) {
        document.getElementById('url-output').value = '解码失败，请输入有效的编码字符串';
        document.getElementById('url-output').style.color = '#ff6b6b';
    }
}

/* ===== 哈希生成 ===== */
async function genHash() {
    const input = document.getElementById('hash-input').value;
    const type = document.getElementById('hash-type').value;
    const output = document.getElementById('hash-output');
    if (!input) { Toast.show({ message: '请输入文本', type: 'warning' }); return; }
    try {
        const buf = await crypto.subtle.digest(type, new TextEncoder().encode(input));
        output.value = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        output.value = '生成失败: ' + e.message;
    }
}

/* ===== UUID 生成器 ===== */
function makeUUID() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function genUUIDs() {
    const count = Math.min(20, Math.max(1, parseInt(document.getElementById('uuid-count').value) || 1));
    const list = document.getElementById('uuid-list');
    list.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const uuid = makeUUID();
        const item = document.createElement('div');
        item.className = 'uuid-item';
        item.innerHTML = '<span title="' + uuid + '">' + uuid + '</span>' +
            '<button onclick="copyToClip(null,\'' + uuid + '\')">复制</button>';
        list.appendChild(item);
    }
}

function copyAllUUIDs() {
    const items = document.querySelectorAll('#uuid-list .uuid-item span');
    const text = Array.from(items).map(s => s.textContent).join('\n');
    copyToClip(null, text);
}

/* ===== 颜色转换 ===== */
function hex2rgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return { r: parseInt(hex.substr(0, 2), 16), g: parseInt(hex.substr(2, 2), 16), b: parseInt(hex.substr(4, 2), 16) };
}

function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hsl2rgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
    const hue2rgb = (p, q, t) => { if (t < 0) t++; if (t > 1) t--; if (t < 1/6) return p + (q-p)*6*t; if (t < 1/2) return q; if (t < 2/3) return p + (q-p)*(2/3-t)*6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return { r: Math.round(hue2rgb(p, q, h + 1/3) * 255), g: Math.round(hue2rgb(p, q, h) * 255), b: Math.round(hue2rgb(p, q, h - 1/3) * 255) };
}

function rgb2hex(r, g, b) { return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join(''); }

function setColor(hex) {
    const rgb = hex2rgb(hex);
    const hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);
    document.getElementById('color-picker').value = hex;
    document.getElementById('color-hex').value = hex;
    document.getElementById('color-rgb').value = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    document.getElementById('color-hsl').value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
    document.getElementById('color-preview').style.background = hex;
}

function onColorPicker() { setColor(document.getElementById('color-picker').value); }

function onColorHex() {
    let hex = document.getElementById('color-hex').value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-Fa-f]{3}$/.test(hex) || /^#[0-9A-Fa-f]{6}$/.test(hex)) setColor(hex);
}

function onColorRgb() {
    const m = document.getElementById('color-rgb').value.match(/(\d+)/g);
    if (m && m.length >= 3) { const [r,g,b] = m.map(Number); if (r<=255&&g<=255&&b<=255) setColor(rgb2hex(r,g,b)); }
}

function onColorHsl() {
    const m = document.getElementById('color-hsl').value.match(/(\d+)/g);
    if (m && m.length >= 3) { const [h,s,l] = m.map(Number); if (h<=360&&s<=100&&l<=100) { const c = hsl2rgb(h,s,l); setColor(rgb2hex(c.r,c.g,c.b)); } }
}

/* ===== 通用复制 ===== */
function copyToClip(elId, text) {
    const content = text || (elId ? document.getElementById(elId).value : '');
    if (!content) { Toast.show({ message: '没有可复制的内容', type: 'warning' }); return; }
    navigator.clipboard.writeText(content).then(() => {
        Toast.show({ message: '已复制到剪贴板', type: 'success', duration: 1500 });
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = content; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        Toast.show({ message: '已复制到剪贴板', type: 'success', duration: 1500 });
    });
}

/* ===== 初始化 ===== */
function initToolsPage() {
    const slider = document.getElementById('pwd-length');
    const display = document.getElementById('pwd-length-val');
    if (slider && display) slider.addEventListener('input', function () { display.textContent = slider.value; });

    const picker = document.getElementById('color-picker');
    if (picker) picker.addEventListener('input', onColorPicker);

    startTimestamp();

    generatePassword();
    genUUIDs();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToolsPage);
} else {
    initToolsPage();
}

window.generatePassword = generatePassword;
window.copyToClip = copyToClip;
window.formatJSON = formatJSON;
window.minifyJSON = minifyJSON;
window.tsToDate = tsToDate;
window.dateToTs = dateToTs;
window.encodeB64 = encodeB64;
window.decodeB64 = decodeB64;
window.encodeURI_ = encodeURI_;
window.decodeURI_ = decodeURI_;
window.genHash = genHash;
window.genUUIDs = genUUIDs;
window.copyAllUUIDs = copyAllUUIDs;