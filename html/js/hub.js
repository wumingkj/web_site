/* ============================================
   中转站 Hub 主入口
   模块化架构：配置 → 星空 → 渲染 → 动画
   添加新项目：编辑 hub-config.js 中的 projects 数组
   ============================================ */

(function () {
    'use strict';

    function init() {
        HubStarfield.init({
            canvasId: 'starCanvas',
            starCount: 200
        });

        HubRenderer.setGrid('hubGrid');

        HubRenderer.onAfterRender(function () {
            HubAnimations.init({
                rootMargin: '0px 0px -60px 0px',
                threshold: 0.1
            });

            HubAnimations.observeAll('.hub-card', 'fadeUp');
        });

        var projects = HubConfig.getProjects();
        HubRenderer.render(projects);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();