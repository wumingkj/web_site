# Wuming Web Site

个人网站项目，包含中转站、博客、软件官网等多个子站点，运行于 Nginx + PHP-FPM。

## 项目结构

```
web_site/
├── html/                     # 中转站（首页导航）
│   ├── index.html
│   ├── css/hub.css
│   └── js/
│       ├── hub.js            # 入口
│       ├── hub-config.js     # 项目卡片配置
│       ├── hub-renderer.js   # 卡片渲染
│       ├── hub-animations.js # 滚动动画
│       └── hub-starfield.js  # 星空背景
├── blog/                     # 博客系统 (PHP)
│   ├── index.html
│   ├── pages/                # 各页面
│   ├── api/                  # PHP 后端
│   ├── css/ / js/            # 静态资源
│   ├── assets/images/        # 图片
│   └── data/                 # 数据库 & 用户数据
├── CelestialSimulation/      # 天体模拟软件官网
│   ├── index.html
│   ├── css/style.css
│   ├── js/effects.js
│   └── README.md             # 软件说明
└── all-sites.conf            # Nginx 配置
```

## 子项目

### 中转站 (html/)

项目导航页，模块化卡片布局，支持滚动动画和星空背景。通过 `hub-config.js` 配置项目卡片，可轻松扩展。

### 博客 (blog/)

基于 PHP 的轻量博客系统，支持文章发布、评论、标签分类、用户登录、Markdown 渲染，带 3D 文章展示页。

### CelestialSimulation

天体模拟教学软件官网，展示 3D 太阳系模拟与引力实验沙盒的核心功能。

## 部署

1. 将项目放置于 `/var/www/`
2. 将 `all-sites.conf` 链接到 Nginx：
   ```bash
   ln -sf /var/www/all-sites.conf /etc/nginx/sites-enabled/all-sites.conf
   ```
3. 重载 Nginx：
   ```bash
   systemctl reload nginx
   ```

## 技术栈

- **前端**：HTML5 / CSS3 / Vanilla JS
- **后端**：PHP 8.x + SQLite
- **服务器**：Nginx + PHP-FPM
- **渲染**：Canvas API / Three.js / ModernGL