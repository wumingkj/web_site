/* ============================================
   Hub 卡片渲染模块
   负责将项目数据渲染为 DOM 卡片，支持回调钩子
   ============================================ */

var HubRenderer = (function () {
    'use strict';

    var gridElement = null;
    var onBeforeRender = null;
    var onAfterRender = null;

    function buildCardHTML(project, index) {
        var p = project;
        var delay = ((index || 0) * 0.12).toFixed(2);

        return (
            '<a href="' + p.url + '" class="hub-card anim-fade-up" data-anim-delay="' + delay + 's" target="_self">' +
                '<span class="card-status ' + (p.status || 'online') + '">' + (p.statusText || '运行中') + '</span>' +
                '<div class="card-icon ' + (p.iconClass || 'default') + '">' + (p.icon || '🔗') + '</div>' +
                '<h3 class="card-title">' + (p.name || '') + '</h3>' +
                '<p class="card-desc">' + (p.desc || '') + '</p>' +
                '<div class="card-arrow">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<line x1="5" y1="12" x2="19" y2="12"></line>' +
                        '<polyline points="12 5 19 12 12 19"></polyline>' +
                    '</svg>' +
                '</div>' +
            '</a>'
        );
    }

    return {
        setGrid: function (elementId) {
            gridElement = document.getElementById(elementId || 'hubGrid');
            if (!gridElement) {
                console.warn('HubRenderer: 网格容器未找到');
            }
        },

        render: function (projects) {
            if (!gridElement) {
                this.setGrid();
            }
            if (!gridElement) return;

            if (typeof onBeforeRender === 'function') {
                onBeforeRender(projects);
            }

            var html = '';
            for (var i = 0; i < projects.length; i++) {
                html += buildCardHTML(projects[i], i);
            }

            gridElement.innerHTML = html;

            if (typeof onAfterRender === 'function') {
                onAfterRender(projects);
            }
        },

        renderFiltered: function (projects, filterFn) {
            var filtered = projects.filter(filterFn);
            this.render(filtered);
        },

        onBeforeRender: function (callback) {
            onBeforeRender = callback;
        },

        onAfterRender: function (callback) {
            onAfterRender = callback;
        }
    };
})();