/**
 * Wuming Blog - 3D 第一人称文章探索 (ES Module)
 * WASD 移动 + 鼠标视角 + 展板交互
 */

import * as THREE from 'three';

// ==================== 配置 ====================
const CFG = {
    spacing: 22,          // 展板间距
    viewDist: 12,         // 可读距离
    boardW: 14,           // 展板宽度
    boardH: 8,            // 展板高度
    playerH: 2,           // 视点高度
    moveSpeed: 25,        // 移动速度
    sprintMul: 2,         // 冲刺倍率
    sensitivity: 0.002,   // 鼠标灵敏度
    gravity: 28,
    jumpForce: 10,
    fogDensity: 0.003,
};

// ==================== 全局状态 ====================
let scene, camera, renderer, clock;
let billboards = [];       // { group, position, title, html, index, markdownContent, isAimed }
let floatOverlay = null;    // HTML 悬浮文字覆盖层
let postId = null;
let yaw = 0, pitch = 0;
let velocityY = 0, canJump = true;
let isLocked = false;
let currentChapter = -1;
let panelOpen = false;
let currentNearby = null;
let aimedBillboard = null; // 鼠标指向的展板
const keys = {};
let starsMaterial = null;
let meteors = [];          // 流星
let commentBillboard = null;
let commentsLoaded = false;
let portals = []; // 传送门 { group, targetId, title, position }
let groundMesh = null;
let cubeCamera = null;
let cubeRenderTarget = null;
let cubeFrameCount = 0;
let fpsFrameCount = 0;
let fpsLastTime = 0;
let fpsEl = null;
let decorMeshes = [];      // 装饰物体缓存，避免每帧遍历 scene.children
const _movFwd = new THREE.Vector3();
const _movRight = new THREE.Vector3();
const _movDir = new THREE.Vector3();
const _movUp = new THREE.Vector3(0, 1, 0);
const _movEuler = new THREE.Euler();
const _movQuat = new THREE.Quaternion();
const _projVec = new THREE.Vector3();
const _cam2D = new THREE.Vector2();
const _b2D = new THREE.Vector2();

// ==================== 初始化入口 ====================
async function init3DPage() {
    const params = new URLSearchParams(window.location.search);
    postId = params.get('id');
    if (!postId) { showFatal('请指定文章 ID'); return; }

    try {
        initThree();
        initFloatOverlay();

        const res = await fetch(`/blog/api/post.php?id=${postId}`, { credentials: 'same-origin' });
        const data = await res.json();
        if (!data?.success) { hideLoading(); showFatal(data?.error || '加载失败'); return; }
        buildWorld(data.data);
        hideLoading();
        document.getElementById('start-overlay').classList.remove('hidden');
    } catch (e) {
        console.error('[3D Page]', e);
        hideLoading();
        showFatal('加载失败', e?.message || String(e));
    }
}

// ==================== Three.js 基础 ====================
function initThree() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, CFG.fogDensity);

    camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(0, CFG.playerH, 8);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('three-canvas'),
        antialias: false,
        powerPreference: 'high-performance'
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

    // 灯光
    scene.add(new THREE.AmbientLight(0x334466, 0.5));
    const dirLight = new THREE.DirectionalLight(0x4dabf7, 0.3);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);

    createSkyDome();
    createStars();
    createGround();
    bindControls();
    bindUI();

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    // bfcache 内存清理：页面被替换前销毁 WebGL 资源
    window.addEventListener('pagehide', () => {
        cancelAnimationFrame(animate._raf);
        renderer.dispose();
        if (cubeRenderTarget) cubeRenderTarget.dispose();
        scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
            }
        });
    });

    animate();
}

// ==================== 天空穹顶 ====================
function createSkyDome() {
    // 渐变天空
    const c = document.createElement('canvas');
    c.width = 4; c.height = 512;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0c0c35');
    grad.addColorStop(0.15, '#0f1240');
    grad.addColorStop(0.35, '#0a1530');
    grad.addColorStop(0.55, '#071520');
    grad.addColorStop(0.75, '#050d1a');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, 512);

    const tex = new THREE.CanvasTexture(c);
    // 只用半球体（上半部分），避免低头看到球底
    const geo = new THREE.SphereGeometry(900, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false });
    scene.add(new THREE.Mesh(geo, mat));

    // 星云 — 更大、更明显、更多色彩
    const nebulae = [
        { color: 0x1a3a8a, x: -200, y: 150, z: -400, sx: 250, sy: 60 },
        { color: 0x4a1a6a, x: 180, y: 120, z: -600, sx: 200, sy: 50 },
        { color: 0x1a5a4a, x: -100, y: 100, z: -200, sx: 180, sy: 45 },
        { color: 0x6a2a2a, x: 300, y: 180, z: -500, sx: 150, sy: 40 },
        { color: 0x2a3a7a, x: 0, y: 200, z: -800, sx: 300, sy: 70 },
    ];
    nebulae.forEach(n => {
        const ng = new THREE.SphereGeometry(100, 8, 8);
        const nm = new THREE.MeshBasicMaterial({
            color: n.color, transparent: true, opacity: 0.08, fog: false, side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(ng, nm);
        mesh.position.set(n.x, n.y, n.z);
        mesh.scale.set(n.sx / 100, n.sy / 100, 1);
        scene.add(mesh);
    });

    // 极光带 — 横跨天空的淡色光带
    const auroraColors = [0x2288aa, 0x44aa66, 0x8866cc];
    auroraColors.forEach((color, i) => {
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(-400, 200 + i * 30, -500 + i * 100),
            new THREE.Vector3(0, 250 + i * 20, -600),
            new THREE.Vector3(400, 180 + i * 25, -400 - i * 80)
        );
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 8 + i * 3, 6, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: 0.025, fog: false
        });
        scene.add(new THREE.Mesh(tubeGeo, tubeMat));
    });
}

// ==================== 星空 ====================
function createStars() {
    const N = 1200;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const sizes = new Float32Array(N);

    for (let i = 0; i < N; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 1600;
        pos[i * 3 + 1] = Math.random() * 500 + 30;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 1600;
        const r = Math.random();
        // 白色星、蓝白星、暖黄星
        col[i * 3]     = r < 0.5 ? 1.0 : (r < 0.75 ? 0.7 : 1.0);
        col[i * 3 + 1] = r < 0.5 ? 1.0 : (r < 0.75 ? 0.85 : 0.9);
        col[i * 3 + 2] = r < 0.5 ? 1.0 : (r < 0.75 ? 1.0 : 0.5);
        sizes[i] = Math.random() * 3 + 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 16; dotCanvas.height = 16;
    const dctx = dotCanvas.getContext('2d');
    const grad = dctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.5, 'rgba(200,220,255,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = grad;
    dctx.fillRect(0, 0, 16, 16);
    const dotTex = new THREE.CanvasTexture(dotCanvas);

    starsMaterial = new THREE.PointsMaterial({
        size: 3.5,
        map: dotTex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8,
    });
    scene.add(new THREE.Points(geo, starsMaterial));

    // 流星系统
    createMeteors();
}

// ==================== 流星 ====================
function createMeteors() {
    // 初始生成1颗流星
    for (let i = 0; i < 1; i++) {
        spawnMeteor();
    }
}

function spawnMeteor() {
    const startX = (Math.random() - 0.5) * 600;
    const startY = Math.random() * 200 + 100;
    const startZ = (Math.random() - 0.5) * 600 - 200;
    const angle = Math.random() * 0.5 + 0.3; // 倾斜角度
    const speed = Math.random() * 300 + 200;
    const length = Math.random() * 40 + 20;
    const dir = new THREE.Vector3(-Math.cos(angle), -Math.sin(angle), Math.random() * 0.3 - 0.15).normalize();

    // 流星尾迹 - 用一条发光线
    const tailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(dir.x * length, dir.y * length, dir.z * length)
    ]);
    const tailMat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(tailGeo, tailMat);
    line.position.set(startX, startY, startZ);
    scene.add(line);

    // 流星头部发光点
    const headGeo = new THREE.SphereGeometry(0.5, 3, 3);
    const headMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(startX, startY, startZ);
    scene.add(head);

    meteors.push({
        line, head, dir, speed, life: 0,
        maxLife: length / speed + Math.random() * 0.5,
        startPos: new THREE.Vector3(startX, startY, startZ)
    });
}

function updateMeteors(dt) {
    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += dt;
        const progress = m.life / m.maxLife;

        if (progress >= 1) {
            scene.remove(m.line);
            scene.remove(m.head);
            meteors.splice(i, 1);
            // 随机间隔生成新流星
            if (Math.random() < 0.15) spawnMeteor();
            continue;
        }

        // 移动
        const offset = m.dir.clone().multiplyScalar(m.speed * m.life);
        m.head.position.copy(m.startPos).add(offset);
        m.line.position.copy(m.startPos).add(offset);

        // 淡出
        const fade = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
        m.line.material.opacity = fade * 0.8;
        m.head.material.opacity = fade * 0.9;
    }

    // 随机添加新流星
    if (meteors.length < 1 && Math.random() < 0.003) {
        spawnMeteor();
    }
}

// ==================== 镜面反射地面 ====================
function createGround() {
    // CubeCamera 实时环境反射（高精度）
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter
    });
    cubeCamera = new THREE.CubeCamera(0.1, 2000, cubeRenderTarget);

    const geo = new THREE.PlaneGeometry(2000, 2000, 1, 1);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
        color: 0x8899bb,
        metalness: 1.0,
        roughness: 0.15,
        envMap: cubeRenderTarget.texture,
        envMapIntensity: 1.0,
    });

    groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.position.y = -0.02;
    scene.add(groundMesh);
}

// ==================== 构建3D世界 ====================
function buildWorld(post) {
    document.title = `${post.title} | Wuming Blog`;
    document.getElementById('start-title').textContent = post.title;

    // 解析章节
    const content = post.content || post.excerpt || '暂无内容';
    const html = (typeof marked !== 'undefined') ? marked.parse(content) : content;
    const sections = splitByHeadings(html);
    const mdSections = splitMarkdownByHeadings(content);

    if (sections.length === 0) return;

    // 设置玩家起点
    camera.position.set(0, CFG.playerH, CFG.spacing * 0.4);
    yaw = Math.PI;

    // 创建展板
    const totalZ = sections.length * CFG.spacing;
    const startZ = -CFG.spacing;

    sections.forEach((sec, i) => {
        const num = i + 1;
        const title = sec.title || `第 ${num} 部分`;

        const offsetX = (i % 2 === 0 ? -1 : 1) * 8;
        const z = startZ - i * CFG.spacing;
        const pos = new THREE.Vector3(offsetX, 0, z);

        const group = createBillboard3D(num, title);
        group.position.copy(pos);
        scene.add(group);

        billboards.push({
            group, position: pos, title,
            html: sec.content || '', index: i,
            markdownContent: mdSections[i]?.markdown || '',
            isAimed: false, prevAimed: false
        });
    });

    // 路径指示线
    const pathPts = billboards.map(b => new THREE.Vector3(b.position.x * 0.3, 0.05, b.position.z));
    pathPts.unshift(new THREE.Vector3(0, 0.05, CFG.spacing * 0.5));
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPts);
    const pathMat = new THREE.LineBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.12 });
    scene.add(new THREE.Line(pathGeo, pathMat));

    // 装饰浮动物体
    createDecor(totalZ);

    // 评论区展板（最后一个展板后方）
    const commentZ = startZ - sections.length * CFG.spacing;
    createCommentBillboard(commentZ);

    // 传送门（评论区后方）
    createPortals(post, commentZ);

    // 加载评论
    loadComments();
}

// ==================== 悬浮文字 HTML 覆盖层 ====================

function initFloatOverlay() {
    floatOverlay = {
        el: document.getElementById('float-text'),
        titleEl: document.getElementById('float-title'),
        bodyEl: document.getElementById('float-body'),
        progressEl: document.getElementById('float-progress'),
        currentBillboard: null,
        progress: 0,
        lastRendered: -1,
    };
}

function showFloatOverlay(billboard) {
    const ov = floatOverlay;
    if (!ov) return;

    // 切换目标展板时重置
    if (ov.currentBillboard !== billboard) {
        ov.currentBillboard = billboard;
        ov.progress = 0;
        ov.lastRendered = -1;
        ov.titleEl.textContent = billboard.title || '';
        ov.bodyEl.innerHTML = '';
    }

    // 3D 坐标投影到屏幕 — 投影展板顶部（Chapter 标签下方）
    _projVec.set(
        billboard.group.position.x,
        billboard.group.position.y + CFG.boardH / 2 - 0.8,
        billboard.group.position.z
    );
    _projVec.project(camera);

    // 在相机后方则隐藏
    if (_projVec.z > 1) {
        ov.el.classList.add('hidden');
        return;
    }

    const W = renderer.domElement.clientWidth;
    const H = renderer.domElement.clientHeight;
    const sx = (_projVec.x * 0.5 + 0.5) * W;
    const sy = (-_projVec.y * 0.5 + 0.5) * H;

    // 完全离开屏幕则隐藏
    if (sx < -250 || sx > W + 250 || sy < -150 || sy > H + 150) {
        ov.el.classList.add('hidden');
        return;
    }

    ov.el.classList.remove('hidden');

    // 定位：水平居中于展板，垂直从 Chapter 标签下方开始覆盖展板
    const ovW = Math.min(720, W * 0.85);
    const left = Math.max(8, Math.min(W - ovW - 8, sx - ovW / 2));
    const top = Math.max(8, Math.min(H - 50, sy + 10));
    ov.el.style.left = `${left}px`;
    ov.el.style.top = `${top}px`;

    // 打字机效果
    const md = billboard.markdownContent;
    if (!md) {
        ov.bodyEl.innerHTML = '<p style="color:rgba(255,255,255,0.3)">（无内容）</p>';
        return;
    }

    if (ov.progress < md.length) {
        ov.progress = Math.min(ov.progress + 0.6, md.length);
        const rendered = Math.floor(ov.progress);
        if (rendered !== ov.lastRendered) {
            ov.lastRendered = rendered;
            const partial = md.slice(0, rendered);
            try {
                ov.bodyEl.innerHTML = (typeof marked !== 'undefined') ? marked.parse(partial) : partial;
            } catch (e) {
                ov.bodyEl.textContent = partial;
            }
            ov.bodyEl.scrollTop = ov.bodyEl.scrollHeight;
            const pct = Math.min(100, Math.round(rendered / md.length * 100));
            ov.progressEl.textContent = pct < 100 ? `${pct}%` : '';
        }
    }
}

function hideFloatOverlay() {
    const ov = floatOverlay;
    if (!ov) return;
    ov.el.classList.add('hidden');
    ov.currentBillboard = null;
    ov.progress = 0;
    ov.lastRendered = -1;
}

// ==================== 射线检测（鼠标指向） ====================
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

function checkAiming() {
    if (!isLocked || panelOpen) {
        billboards.forEach(b => { b.isAimed = false; });
        aimedBillboard = null;
        return;
    }

    raycaster.setFromCamera(screenCenter, camera);

    let closestHit = null;
    let closestDist = Infinity;

    billboards.forEach(b => {
        // 只检测距离内的展板
        const d3d = camera.position.distanceTo(b.group.position);
        if (d3d > CFG.viewDist * 1.2) {
            b.isAimed = false;
            return;
        }
        const intersects = raycaster.intersectObjects(b.group.children, false);
        if (intersects.length > 0 && d3d < closestDist) {
            closestDist = d3d;
            closestHit = b;
        }
    });

    // 也检测评论展板
    if (commentBillboard) {
        const d3d = camera.position.distanceTo(commentBillboard.group.position);
        if (d3d < CFG.viewDist * 1.2) {
            const intersects = raycaster.intersectObjects(commentBillboard.group.children, false);
            if (intersects.length > 0) {
                closestHit = commentBillboard;
            }
        }
    }

    aimedBillboard = closestHit;
}

// ==================== 评论区展板 ====================
function createCommentBillboard(z) {
    const group = new THREE.Group();
    const W = CFG.boardW + 4, H = CFG.boardH + 2;

    // 主面板
    const boardGeo = new THREE.PlaneGeometry(W, H);
    const boardMat = new THREE.MeshBasicMaterial({
        color: 0xda77f2, transparent: true, opacity: 0.04, side: THREE.DoubleSide
    });
    group.add(new THREE.Mesh(boardGeo, boardMat));

    // 边框
    const edgeGeo = new THREE.EdgesGeometry(boardGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xda77f2, transparent: true, opacity: 0.4 });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // 标题
    const { tex: titleTex } = makeTextCanvas('💬 评论区', 36, 400, 80);
    const titleGeo = new THREE.PlaneGeometry(6, 1.2);
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTex, transparent: true });
    const titleMesh = new THREE.Mesh(titleGeo, titleMat);
    titleMesh.position.set(0, H / 2 - 1, 0.01);
    group.add(titleMesh);

    const pos = new THREE.Vector3(0, 0, z);
    group.position.copy(pos);
    group.position.y = CFG.playerH + 0.5;
    scene.add(group);

    commentBillboard = {
        group, position: pos, title: '评论区',
        html: '', index: -1,
        markdownContent: '正在加载评论...',
        isAimed: false, prevAimed: false
    };
}

async function loadComments() {
    if (!postId) return;
    try {
        const res = await fetch(`/blog/api/comments.php?post_id=${postId}`, { credentials: 'same-origin' });
        const data = await res.json();
        let md;
        if (data?.success && data.data?.length > 0) {
            commentBillboard._comments = data.data;
            md = data.data.map(c => `**${c.user}**：${c.content}`).join('\n\n---\n\n');
        } else {
            md = '暂无评论，快来发表第一条评论吧！';
        }
        commentBillboard.markdownContent = md;
    } catch (e) {
        commentBillboard.markdownContent = '评论加载失败';
    }
}

// ==================== 传送门（VRChat 椭圆风格） ====================
function createPortalItem(item, posX, portalZ) {
    const group = new THREE.Group();
    const rx = 3, ry = 4.5;

    // 椭圆光环
    const torusGeo = new THREE.TorusGeometry(ry, 0.18, 12, 40);
    const torusMat = new THREE.MeshBasicMaterial({
        color: item.color, transparent: true, opacity: 0.7
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.scale.set(rx / ry, 1, 1);
    group.add(torus);

    // 外层淡光环
    const glowGeo = new THREE.TorusGeometry(ry, 0.6, 12, 40);
    const glowMat = new THREE.MeshBasicMaterial({
        color: item.color, transparent: true, opacity: 0.12,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.scale.set(rx / ry, 1, 1);
    group.add(glow);

    // 内部旋涡
    const aspectRatio = (ry / rx).toFixed(6);
    const innerGeo = new THREE.PlaneGeometry(rx * 2, ry * 2);
    const innerMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime:  { value: 0 },
            uColor: { value: new THREE.Color(item.color) },
            uPR:    { value: Math.min(devicePixelRatio, 2) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main(){
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }`,
        fragmentShader: `
            uniform float uTime;
            uniform vec3  uColor;
            varying vec2  vUv;

            void main(){
                vec2 c = vUv - 0.5;
                c.x *= ${aspectRatio};
                float d = length(c);
                float mask = smoothstep(0.5, 0.46, d);
                float ang = atan(c.y, c.x);
                float s1 = sin(ang * 3.0 + d * 18.0 - uTime * 2.5) * 0.5 + 0.5;
                float s2 = sin(ang * 5.0 - d * 12.0 + uTime * 3.5) * 0.5 + 0.5;
                float core = smoothstep(0.5, 0.0, d) * 0.5;
                vec3 col = uColor * (s1 * 0.35 + s2 * 0.25 + core);
                col += vec3(1.0) * smoothstep(0.15, 0.0, d) * 0.25;
                float a = mask * (0.25 + core * 0.6);
                gl_FragColor = vec4(col, a);
            }`,
        transparent: true, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    // 顶部标签
    const { tex: labelTex } = makeTextCanvas(item.label, 24, 320, 64);
    const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 0.8),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
    );
    labelMesh.position.set(0, ry + 0.9, 0);
    group.add(labelMesh);

    // 中间文字（标题+提示在传送门中心）
    const titleText = item.titleText || '';
    const { tex: titleTex } = makeTextCanvas(titleText, 20, 400, 80);
    const titleMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 1),
        new THREE.MeshBasicMaterial({ map: titleTex, transparent: true })
    );
    titleMesh.position.set(0, 0, 0.05);
    group.add(titleMesh);

    const pos = new THREE.Vector3(posX, CFG.playerH + 1.5, portalZ);
    group.position.copy(pos);
    scene.add(group);

    return { group, position: pos, color: item.color, innerMat, torusMat, glowMat, ...item.portalData };
}

function createPortals(post, baseZ) {
    const prev = post.prev;
    const next = post.next;
    const portalZ = baseZ - CFG.spacing;

    const items = [];
    if (prev) items.push({
        label: '← 上一篇', side: -1, color: 0xffa94d,
        titleText: prev.title?.length > 14 ? prev.title.slice(0, 14) + '...' : (prev.title || ''),
        portalData: { targetId: prev.id, title: prev.title }
    });
    if (next) items.push({
        label: '下一篇 →', side: 1, color: 0x69db7c,
        titleText: next.title?.length > 14 ? next.title.slice(0, 14) + '...' : (next.title || ''),
        portalData: { targetId: next.id, title: next.title }
    });

    // 返回首页传送门
    items.push({
        label: '🏠 返回首页', side: 0, color: 0xda77f2,
        titleText: 'Wuming Blog',
        portalData: { targetId: '__home__', title: '首页', isHome: true }
    });

    items.forEach(item => {
        const posX = item.side * 10;
        const portal = createPortalItem(item, posX, portalZ);
        portals.push(portal);
    });
}

function checkPortals() {
    if (!isLocked || panelOpen) return;
    portals.forEach(p => {
        const dist = camera.position.distanceTo(p.group.position);
        if (dist < 3) {
            if (p.isHome) {
                window.location.replace('/blog/');
            } else {
                window.location.replace(`/blog/pages/post3d.html?id=${p.targetId}`);
            }
        }
    });
}

function createBillboard3D(num, title) {
    const group = new THREE.Group();
    const W = CFG.boardW, H = CFG.boardH;

    // 主面板 — 半透明背景 + 发光边框
    const boardGeo = new THREE.PlaneGeometry(W, H);
    const boardMat = new THREE.MeshBasicMaterial({
        color: 0x4dabf7, transparent: true, opacity: 0.04, side: THREE.DoubleSide
    });
    group.add(new THREE.Mesh(boardGeo, boardMat));

    // 发光边框
    const edgeGeo = new THREE.EdgesGeometry(boardGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.4 });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // 章节标签
    const { tex: labelTex } = makeTextCanvas(`Chapter ${String(num).padStart(2, '0')}`, 28, 320, 64);
    const labelGeo = new THREE.PlaneGeometry(4, 0.8);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0, H / 2 - 1, 0.01);
    group.add(label);

    // 标题 — canvas 宽高比和几何体宽高比一致
    const titleText = title.length > 18 ? title.slice(0, 18) + '...' : title;
    const titleCW = 512, titleCH = 96;
    const { tex: titleTex } = makeTextCanvas(titleText, 32, titleCW, titleCH);
    const titleAspect = titleCW / titleCH;
    const titlePlaneW = Math.min(10, W - 2);
    const titlePlaneH = titlePlaneW / titleAspect;
    const titleGeo = new THREE.PlaneGeometry(titlePlaneW, titlePlaneH);
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTex, transparent: true });
    const titleMesh = new THREE.Mesh(titleGeo, titleMat);
    titleMesh.position.set(0, 0.6, 0.01);
    group.add(titleMesh);

    // 立柱
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, H, 8);
    const pillarMat = new THREE.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.2 });
    [-1, 1].forEach(side => {
        const p = new THREE.Mesh(pillarGeo, pillarMat);
        p.position.set(side * (W / 2 + 0.3), 0, 0);
        group.add(p);
    });

    // 底部和顶部发光环
    const dotGeo = new THREE.RingGeometry(0.3, 0.8, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    [-1, 1].forEach(dir => {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.rotation.x = -Math.PI / 2;
        dot.position.y = dir * H / 2;
        group.add(dot);
    });

    group.position.y = CFG.playerH + 0.5;

    return group;
}

function makeTextCanvas(text, fontSize = 20, canvasW = 512, canvasH = 128) {
    const c = document.createElement('canvas');
    c.width = canvasW; c.height = canvasH;
    const ctx = c.getContext('2d');
    ctx.font = `700 ${fontSize}px "PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvasW / 2, canvasH / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return { tex, width: canvasW, height: canvasH };
}

function createDecor(totalZ) {
    const geos = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TorusGeometry(1, 0.3, 8, 12)
    ];
    const colors = [0x4dabf7, 0xda77f2, 0x69db7c, 0xffa94d];
    for (let i = 0; i < 20; i++) {
        const geo = geos[i % geos.length];
        const mat = new THREE.MeshBasicMaterial({
            color: colors[i % colors.length],
            wireframe: true, transparent: true, opacity: 0.08
        });
        const mesh = new THREE.Mesh(geo, mat);
        const s = Math.random() * 10 + 3;
        mesh.scale.set(s, s, s);
        mesh.position.set(
            (Math.random() - 0.5) * 60,
            Math.random() * 25 + 5,
            -Math.random() * (totalZ + 100) - CFG.spacing
        );
        mesh.userData = {
            rx: Math.random() * 0.003, ry: Math.random() * 0.003,
            fs: Math.random() * 0.4 + 0.2, fa: Math.random() * 3 + 1,
            by: mesh.position.y
        };
        scene.add(mesh);
        decorMeshes.push(mesh);
    }
}

// ==================== 第一人称控制 ====================
function bindControls() {
    document.addEventListener('keydown', e => { keys[e.code] = true; });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    // PointerLock
    document.addEventListener('pointerlockchange', () => {
        isLocked = document.pointerLockElement === renderer.domElement;
        document.getElementById('crosshair').classList.toggle('hidden', !isLocked);
        document.getElementById('hud').classList.toggle('hidden', !isLocked);
        document.getElementById('minimap').classList.toggle('hidden', !isLocked);
        document.getElementById('fps-counter').classList.toggle('hidden', !isLocked);

        // 锁定提示
        const lockHint = document.getElementById('lock-hint');
        if (lockHint) lockHint.classList.toggle('hidden', isLocked);
    });

    document.addEventListener('mousemove', e => {
        if (!isLocked) return;
        yaw -= e.movementX * CFG.sensitivity;
        pitch -= e.movementY * CFG.sensitivity;
        pitch = Math.max(-1.2, Math.min(1.2, pitch));
    });
}

function updateMovement(dt) {
    if (!isLocked || panelOpen) return;

    const sprint = keys['ShiftLeft'] || keys['ShiftRight'] ? CFG.sprintMul : 1;
    const speed = CFG.moveSpeed * sprint * dt;

    _movEuler.set(0, yaw, 0);
    _movQuat.setFromEuler(_movEuler);
    _movFwd.set(0, 0, -1).applyQuaternion(_movQuat);
    _movRight.crossVectors(_movFwd, _movUp);

    _movDir.set(0, 0, 0);
    if (keys['KeyW']) _movDir.add(_movFwd);
    if (keys['KeyS']) _movDir.sub(_movFwd);
    if (keys['KeyA']) _movDir.sub(_movRight);
    if (keys['KeyD']) _movDir.add(_movRight);

    if (_movDir.lengthSq() > 0) {
        _movDir.normalize();
        camera.position.addScaledVector(_movDir, speed);
    }

    // 跳跃
    if ((keys['Space']) && canJump) {
        velocityY = CFG.jumpForce;
        canJump = false;
    }
    velocityY -= CFG.gravity * dt;
    camera.position.y += velocityY * dt;
    if (camera.position.y < CFG.playerH) {
        camera.position.y = CFG.playerH;
        velocityY = 0;
        canJump = true;
    }

    // 应用视角
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

// ==================== 展板交互 ====================
function checkProximity() {
    if (!isLocked || panelOpen) return;

    _cam2D.set(camera.position.x, camera.position.z);
    let closest = null;
    let closestDist = Infinity;

    billboards.forEach(b => {
        _b2D.set(b.position.x, b.position.z);
        const d = _cam2D.distanceTo(_b2D);
        if (d < closestDist) { closestDist = d; closest = b; }
    });

    // 更新 HUD
    const hud = document.getElementById('hud-chapter');
    const hint = document.getElementById('hud-hint');
    if (closest && closestDist < CFG.viewDist * 1.5) {
        hud.textContent = `Chapter ${String(closest.index + 1).padStart(2, '0')} — ${closest.title}`;
        hint.textContent = closestDist < CFG.viewDist ? '点击鼠标阅读此展板' : '继续靠近展板';
        hint.style.color = closestDist < CFG.viewDist ? 'var(--primary)' : '';
    } else {
        hud.textContent = '';
        hint.textContent = '走近发光展板阅读内容';
        hint.style.color = '';
    }

    currentNearby = (closest && closestDist < CFG.viewDist) ? closest : null;
}

// ==================== 内容面板 ====================
function openPanel(billboard) {
    panelOpen = true;
    hideFloatOverlay();
    currentChapter = billboard.index;

    document.getElementById('panel-chapter').textContent =
        `Chapter ${String(billboard.index + 1).padStart(2, '0')}`;
    document.getElementById('panel-title').textContent = billboard.title;
    const html = billboard.html || '<p style="color:rgba(255,255,255,0.3)">（无内容）</p>';
    document.getElementById('panel-body').innerHTML = html;

    // 链接在新标签页打开，避免离开3D页面
    document.getElementById('panel-body').querySelectorAll('a').forEach(a => {
        if (!a.href.startsWith('/') || a.href.includes('post3d')) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
        }
    });

    document.getElementById('content-panel').classList.remove('hidden');
    requestAnimationFrame(() => {
        document.getElementById('content-panel').classList.add('show');
    });

    // 退出 PointerLock
    if (document.pointerLockElement) document.exitPointerLock();
}

function closePanel() {
    panelOpen = false;
    const panel = document.getElementById('content-panel');
    panel.classList.remove('show');
    setTimeout(() => panel.classList.add('hidden'), 350);
}

function openCommentPanel() {
    panelOpen = true;
    hideFloatOverlay();
    currentChapter = -1;

    document.getElementById('panel-chapter').textContent = '💬 COMMENTS';
    document.getElementById('panel-title').textContent = '评论区';
    const body = document.getElementById('panel-body');

    if (commentBillboard?._comments?.length > 0) {
        const commentsHtml = commentBillboard._comments.map(c => {
            // 用 marked 解析评论内容（支持换行和基础 md）
            let contentHtml;
            if (typeof marked !== 'undefined') {
                contentHtml = marked.parse(c.content || '', { breaks: true, gfm: true });
            } else {
                contentHtml = escapeHtml(c.content || '').replace(/\n/g, '<br>');
            }
            return `
                <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="color:var(--primary);font-weight:600;font-size:13px;">${escapeHtml(c.user)}</span>
                        <span style="color:rgba(255,255,255,0.2);font-size:11px;">${c.created_at || ''}</span>
                    </div>
                    <div style="color:rgba(255,255,255,0.7);font-size:13px;line-height:1.7;">${contentHtml}</div>
                </div>`;
        }).join('');
        body.innerHTML = commentsHtml;
    } else if (commentBillboard?.markdownContent) {
        body.innerHTML = `<p style="color:rgba(255,255,255,0.3)">${commentBillboard.markdownContent}</p>`;
    } else {
        body.innerHTML = '<p style="color:rgba(255,255,255,0.3)">评论加载中...</p>';
    }

    // 添加评论链接
    body.innerHTML += `
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">
            <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:10px;">发表评论请前往普通模式</div>
            <a href="/blog/pages/post.html?id=${postId}" style="color:var(--primary);font-size:13px;text-decoration:none;border-bottom:1px solid rgba(77,171,247,0.3);">📖 前往普通模式评论 →</a>
        </div>`;

    document.getElementById('content-panel').classList.remove('hidden');
    requestAnimationFrame(() => {
        document.getElementById('content-panel').classList.add('show');
    });
    if (document.pointerLockElement) document.exitPointerLock();
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ==================== 小地图 ====================
function drawMinimap() {
    const canvas = document.getElementById('minimap');
    if (!canvas || !billboards.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 背景
    ctx.fillStyle = 'rgba(5, 5, 16, 0.7)';
    ctx.fillRect(0, 0, W, H);

    // 计算映射范围
    const zMin = billboards[billboards.length - 1].position.z - 20;
    const zMax = CFG.spacing;
    const xRange = 30;
    const mapZ = z => ((z - zMin) / (zMax - zMin)) * (W - 20) + 10;
    const mapX = x => ((x + xRange) / (xRange * 2)) * (H - 20) + 10;

    // 展板
    const allBoards = [...billboards];
    if (commentBillboard) allBoards.push(commentBillboard);
    allBoards.forEach((b, i) => {
        const x = mapZ(b.position.z);
        const y = mapX(b.position.x);
        ctx.fillStyle = i === currentChapter ? '#4dabf7' : 'rgba(77, 171, 247, 0.25)';
        ctx.fillRect(x - 2, y - 2, 4, 4);
    });

    // 传送门
    portals.forEach(p => {
        const x = mapZ(p.position.z);
        const y = mapX(p.position.x);
        const c = new THREE.Color(p.color);
        ctx.fillStyle = `rgb(${Math.floor(c.r*255)},${Math.floor(c.g*255)},${Math.floor(c.b*255)})`;
        ctx.fillRect(x - 3, y - 3, 6, 6);
    });

    // 玩家
    const px = mapZ(camera.position.z);
    const py = mapX(camera.position.x);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // 玩家朝向
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)));
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + dir.z * 8, py + dir.x * 8);
    ctx.stroke();
}

// ==================== UI 绑定 ====================
function bindUI() {
    // 鼠标滚轮滚动悬浮文字（pointer lock 下 wheel 不会自动传递）
    window.addEventListener('wheel', (e) => {
        const ov = floatOverlay;
        if (!ov || !ov.currentBillboard || ov.el.classList.contains('hidden')) return;
        e.preventDefault();
        ov.bodyEl.scrollTop += e.deltaY;
    }, { passive: false });

    // 开始按钮
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-overlay').classList.add('hidden');
        renderer.domElement.requestPointerLock();
    });

    // 面板关闭按钮
    document.getElementById('panel-close').addEventListener('click', () => {
        closePanel();
        setTimeout(() => renderer.domElement.requestPointerLock(), 100);
    });

    // 画布点击：面板打开时关闭，靠近+指向展板时打开，其他情况重新锁定
    renderer.domElement.addEventListener('click', () => {
        if (panelOpen) {
            closePanel();
            setTimeout(() => renderer.domElement.requestPointerLock(), 100);
        } else if (isLocked && aimedBillboard && currentNearby) {
            openPanel(aimedBillboard);
        } else if (isLocked && aimedBillboard === commentBillboard) {
            openCommentPanel();
        } else if (!isLocked) {
            renderer.domElement.requestPointerLock();
        }
    });

    // 普通模式按钮
    document.getElementById('nav-mode-btn').addEventListener('click', () => {
        if (postId) window.location.href = `/blog/pages/post.html?id=${postId}`;
        else window.location.href = '/blog/';
    });
}

// ==================== 动画循环 ====================
function animate() {
    animate._raf = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    fpsFrameCount++;
    if (elapsed - fpsLastTime >= 0.5) {
        const fps = Math.round(fpsFrameCount / (elapsed - fpsLastTime));
        if (!fpsEl) fpsEl = document.getElementById('fps-counter');
        if (fpsEl) {
            fpsEl.textContent = fps + ' FPS';
            fpsEl.classList.toggle('warn', fps < 45 && fps >= 30);
            fpsEl.classList.toggle('bad', fps < 30);
        }
        fpsFrameCount = 0;
        fpsLastTime = elapsed;
    }

    updateMovement(dt);
    checkProximity();
    checkAiming();

    // 流星动画
    updateMeteors(dt);

    // 镜面地面反射更新（每3帧更新一次）
    cubeFrameCount++;
    if (groundMesh && cubeCamera && cubeFrameCount % 3 === 0) {
        groundMesh.visible = false;
        cubeCamera.position.set(camera.position.x, -0.02, camera.position.z);
        cubeCamera.update(renderer, scene);
        groundMesh.visible = true;
    }

    // 展板交互
    let anyBillboardAimed = false;
    billboards.forEach(b => {
        // 悬浮动画
        b.group.position.y = CFG.playerH + 0.5 + Math.sin(elapsed * 0.6 + b.index * 0.8) * 0.3;
        // 始终面向玩家（仅水平旋转）
        b.group.lookAt(camera.position.x, b.group.position.y, camera.position.z);

        const near = currentNearby === b;
        const aimed = aimedBillboard === b;
        if (near && aimed) {
            // 显示 HTML 悬浮文字
            showFloatOverlay(b);
            anyBillboardAimed = true;
            // 指向时展板发光增强
            b.group.children.forEach(child => {
                if (child.material?.color?.hex === 0x4dabf7) {
                    child.material.opacity = Math.min(child.material.opacity + 0.02, 0.8);
                }
            });
        } else {
            // 恢复正常亮度
            b.group.children.forEach(child => {
                if (child.material?.color?.hex === 0x4dabf7 && child.material.opacity > 0.35) {
                    child.material.opacity = Math.max(child.material.opacity - 0.01, 0.35);
                }
            });
        }
        b.prevAimed = aimed;
    });

    // 评论展板交互
    if (commentBillboard) {
        const aimed = aimedBillboard === commentBillboard;
        const near = camera.position.distanceTo(commentBillboard.group.position) < CFG.viewDist;
        commentBillboard.group.position.y = CFG.playerH + 0.5 + Math.sin(elapsed * 0.6) * 0.3;
        commentBillboard.group.lookAt(camera.position.x, commentBillboard.group.position.y, camera.position.z);
        if (near && aimed) {
            showFloatOverlay(commentBillboard);
            anyBillboardAimed = true;
        }
        commentBillboard.prevAimed = aimed;
    }

    // 没有展板被指向时隐藏悬浮文字
    if (!anyBillboardAimed) {
        hideFloatOverlay();
    }

    // 装饰物体动画
    decorMeshes.forEach(child => {
        child.rotation.x += child.userData.rx;
        child.rotation.y += child.userData.ry;
        child.position.y = child.userData.by + Math.sin(elapsed * child.userData.fs) * child.userData.fa;
    });

    // 传送门动画 & 检测
    portals.forEach((p, i) => {
        p.group.position.y = CFG.playerH + 1.5 + Math.sin(elapsed * 0.8 + i * 2) * 0.2;
        // 旋涡 shader 时间
        if (p.innerMat) p.innerMat.uniforms.uTime.value = elapsed;
        // 光环脉冲
        const pulse = Math.sin(elapsed * 2 + i) * 0.15;
        if (p.torusMat) p.torusMat.opacity = 0.55 + pulse * 0.3;
        if (p.glowMat) p.glowMat.opacity = 0.1 + pulse * 0.06;
    });
    checkPortals();

    // 小地图（每3帧更新）
    if (cubeFrameCount % 3 === 0) {
        drawMinimap();
    }

    renderer.render(scene, camera);
}

// ==================== 辅助函数 ====================

function splitMarkdownByHeadings(md) {
    const lines = md.split('\n');
    const headings = [];
    const sections = [];

    // 找到所有 ## 标题行
    for (let i = 0; i < lines.length; i++) {
        if (/^##\s+/.test(lines[i].trim())) {
            headings.push({ line: i, title: lines[i].replace(/^##\s*/, '').trim() });
        }
    }

    if (headings.length === 0) {
        sections.push({ title: null, markdown: md.trim() });
    } else {
        // 引言部分（第一个 ## 之前的内容）
        if (headings[0].line > 0) {
            const intro = lines.slice(0, headings[0].line).join('\n').trim();
            if (intro) sections.push({ title: '引言', markdown: intro });
        }
        // 各章节
        for (let i = 0; i < headings.length; i++) {
            const start = headings[i].line + 1;
            const end = i + 1 < headings.length ? headings[i + 1].line : lines.length;
            const content = lines.slice(start, end).join('\n').trim();
            sections.push({ title: headings[i].title, markdown: content });
        }
    }
    return sections;
}

function splitByHeadings(html) {
    const parts = html.split(/<h2[^>]*>(.*?)<\/h2>/gi);
    const sections = [];

    if (parts.length <= 1) {
        sections.push({ title: null, content: html.trim() });
    } else {
        if (parts[0].trim()) sections.push({ title: '引言', content: parts[0].trim() });
        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.replace(/<[^>]*>/g, '').trim();
            const content = parts[i + 1]?.trim() || '';
            if (title || content) sections.push({ title: title || null, content });
        }
    }
    return sections;
}

function hideLoading() {
    document.getElementById('loading-screen')?.classList.add('hidden');
}

function showFatal(msg, detail) {
    document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
            text-align:center;background:#050510;color:#fff;font-family:'PingFang SC','Microsoft YaHei','Segoe UI',system-ui,sans-serif;">
            <div>
                <div style="font-size:48px;margin-bottom:16px">🚀</div>
                <h1 style="font-family:'Segoe UI',system-ui,sans-serif;font-size:24px;margin-bottom:8px">${msg}</h1>
                <p style="color:rgba(255,255,255,0.4);margin-bottom:20px">无法加载 3D 文章</p>
                ${detail ? `<p style="color:rgba(255,100,100,0.7);font-size:13px;margin-bottom:20px;font-family:monospace">${detail}</p>` : ''}
                <a href="/blog/" style="color:var(--primary)">← 返回首页</a>
            </div>
        </div>`;
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', init3DPage);