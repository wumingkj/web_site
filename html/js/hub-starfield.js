/* ============================================
   Hub 星空背景模块
   独立管理星空 Canvas 的绘制与动画
   ============================================ */

var HubStarfield = (function () {
    'use strict';

    var canvas = null;
    var ctx = null;
    var stars = [];
    var animFrameId = null;
    var STAR_COUNT = 200;
    var w, h;

    function resize() {
        if (!canvas) return;
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createStars() {
        stars = [];
        for (var i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.8 + 0.2,
                opacity: Math.random(),
                speed: Math.random() * 0.008 + 0.002,
                direction: Math.random() > 0.5 ? 1 : -1
            });
        }
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);

        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];

            s.opacity += s.speed * s.direction;

            if (s.opacity >= 1) {
                s.opacity = 1;
                s.direction = -1;
            } else if (s.opacity <= 0.1) {
                s.opacity = 0.1;
                s.direction = 1;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(180, 200, 255, ' + s.opacity.toFixed(2) + ')';
            ctx.fill();
        }

        animFrameId = requestAnimationFrame(draw);
    }

    var onResize = null;

    function handleResize() {
        resize();
        createStars();
        if (typeof onResize === 'function') {
            onResize();
        }
    }

    return {
        init: function (options) {
            options = options || {};
            STAR_COUNT = options.starCount || 200;
            canvas = document.getElementById(options.canvasId || 'starCanvas');

            if (!canvas) {
                console.warn('HubStarfield: canvas 元素未找到');
                return;
            }

            ctx = canvas.getContext('2d');
            resize();
            createStars();
            draw();

            window.addEventListener('resize', handleResize);
        },

        destroy: function () {
            if (animFrameId) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
            window.removeEventListener('resize', handleResize);
            stars = [];
            canvas = null;
            ctx = null;
        },

        onResize: function (callback) {
            onResize = callback;
        }
    };
})();