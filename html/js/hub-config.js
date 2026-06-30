/* ============================================
   Hub 项目配置 - 添加新项目只需在此数组中追加
   支持分类 (category) 和标签 (tags) 扩展

   nginx 路由对应：
     /                        → Hub 中转站 (静态)
     /blog/                   → 个人博客 (PHP)
     /CelestialSimulation/    → 天体模拟 (PHP)
   ============================================ */

var HubConfig = (function () {
    'use strict';

    var projects = [
        {
            id: 'blog',
            name: '个人博客',
            desc: '记录学习、思考与生活的点滴，分享技术文章与个人感悟。',
            url: '/blog/',
            icon: '📝',
            iconClass: 'blog',
            status: 'online',
            statusText: '运行中',
            category: 'personal',
            tags: ['博客', '技术', '生活']
        },
        {
            id: 'celestial',
            name: 'CelestialSimulation',
            desc: '3D天体模拟教学软件 - 太阳系行星运动实时模拟 & 引力实验沙盒，基于真实物理引擎。',
            url: '/CelestialSimulation/',
            icon: '🪐',
            iconClass: 'celestial',
            status: 'online',
            statusText: '运行中',
            category: 'project',
            tags: ['天体', '模拟', '3D', '物理']
        }
    ];

    return {
        getProjects: function () {
            return projects;
        },

        getProjectById: function (id) {
            for (var i = 0; i < projects.length; i++) {
                if (projects[i].id === id) {
                    return projects[i];
                }
            }
            return null;
        },

        getProjectsByCategory: function (category) {
            return projects.filter(function (p) {
                return p.category === category;
            });
        },

        addProject: function (project) {
            if (!project.id || !project.name || !project.url) {
                console.warn('HubConfig: 项目缺少必要字段 (id, name, url)');
                return false;
            }

            var defaults = {
                desc: '',
                icon: '🔗',
                iconClass: 'default',
                status: 'online',
                statusText: '运行中',
                category: 'other',
                tags: []
            };

            var merged = {};
            var key;
            for (key in defaults) {
                if (defaults.hasOwnProperty(key)) {
                    merged[key] = project[key] !== undefined ? project[key] : defaults[key];
                }
            }
            merged.id = project.id;
            merged.name = project.name;
            merged.url = project.url;

            projects.push(merged);
            return true;
        },

        removeProject: function (id) {
            for (var i = 0; i < projects.length; i++) {
                if (projects[i].id === id) {
                    projects.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
    };
})();