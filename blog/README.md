# Wuming Blog ✨ 无名博客

> 记录生活，分享技术 — 永远相信美好的事情即将发生

一个现代化的彩虹风格个人博客系统，PHP + SQLite 架构，前后端完全分离，零配置数据库。

## 特性

- 彩虹配色渐变设计 + 毛玻璃效果 UI
- 响应式布局，适配桌面端和移动端
- Markdown 文章渲染（marked.js）
- 互动特效：星空背景、浮动粒子、鼠标追踪
- Toast 消息通知系统
- 用户注册/登录（邮箱可选）
- 角色权限：管理员 / 作者
- 评论系统（登录后评论）
- 头像上传（PNG/JPG/GIF/WebP，最大 10MB）+ Emoji 头像
- 公告系统（JSON 文件存储）
- 管理后台（文章/分类/标签/评论/用户/公告管理）
- Cookie 认证（httponly, SameSite=Lax, 30 天有效）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + JavaScript ES6+（纯原生，无框架） |
| 后端 | PHP 7.4+ / PDO |
| 数据库 | SQLite（零配置） |
| 服务器 | Nginx + PHP-CGI |
| 字体 | Google Fonts（Nunito + Noto Sans SC） |
| Markdown | marked.min.js（本地） |

## 项目结构

```
wuming-blog/
├── index.html                  # 首页
├── 404.html                    # 404 错误页
├── 50x.html                    # 服务器错误页
│
├── css/                        # 样式目录
│   ├── style.css               # 全局样式
│   ├── home.css                # 首页样式
│   ├── pages.css               # 页面样式
│   ├── admin.css               # 管理后台样式
│   ├── toast.css               # Toast 消息样式
│   ├── effects.css             # 特效样式
│   └── error.css               # 错误页样式
│
├── js/                         # 脚本目录
│   ├── common.js               # 公共函数库
│   ├── main.js                 # 主脚本
│   ├── home.js                 # 首页脚本
│   ├── archive.js              # 归档/文章列表脚本
│   ├── categories.js           # 分类页脚本
│   ├── post.js                 # 文章详情页脚本
│   ├── about.js                # 关于页脚本
│   ├── admin.js                # 管理后台脚本
│   ├── toast.js                # Toast 消息系统
│   ├── effects.js              # 互动特效
│   └── marked.min.js           # Markdown 解析库
│
├── pages/                      # 页面目录
│   ├── login.html              # 登录 / 注册
│   ├── admin.html              # 管理后台
│   ├── archive.html            # 文章归档
│   ├── categories.html         # 分类页
│   ├── post.html               # 文章详情
│   ├── about.html              # 关于
│   └── profile.html            # 个人资料
│
├── api/                        # PHP API 目录
│   ├── config.php              # 数据库配置（SQLite 路径、CORS、时区）
│   ├── db.php                  # 数据库连接类（单例模式）
│   ├── auth.php                # 认证 API（登录/注册/登出/头像上传）
│   ├── init.php                # 首页初始化 API（合并接口）
│   ├── posts.php               # 文章列表 API
│   ├── post.php                # 文章详情 CRUD API
│   ├── comments.php            # 评论 API
│   ├── categories.php          # 分类 API
│   ├── tags.php                # 标签 API
│   ├── announcement.php        # 公告 API
│   ├── about.php               # 关于页 API
│   └── stats.php               # 统计 API
│
├── data/                       # 数据存储目录
│   ├── wuming_blog.db          # SQLite 数据库
│   ├── config.json             # 特效配置
│   ├── about.json              # 关于页数据
│   ├── announcement.json       # 公告数据
│   ├── admin_info.json         # 管理员信息缓存
│   └── avatars/                # 用户头像
│
├── assets/                     # 静态资源
│   ├── images/                 # 图片
│   └── fonts/                  # 字体
│
└── logs/                       # 日志目录
```

## 快速开始

### 环境要求

- PHP >= 7.4（需启用 PDO、PDO_SQLite、mbstring 扩展）
- Nginx 或 Apache
- 无需 MySQL

### 部署步骤

1. 将项目放到 Web 根目录

2. 确保 `data/` 目录可写（SQLite 数据库和头像上传需要写入权限）

3. 访问网站，数据库会自动创建

### Nginx 配置参考

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/wuming-blog;
    index index.html;

    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;  # 或 unix socket
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        client_max_body_size 12M;  # 头像上传
    }

    # 静态资源缓存
    location ~* \.(css|js|jpg|png|gif|ico|webp|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 数据库配置

编辑 `api/config.php`：

```php
define('DB_TYPE', 'sqlite');
define('DB_PATH', __DIR__ . '/../data/wuming_blog.db');
```

数据库表在首次访问时自动创建，包含：users、sessions、posts、categories、tags、post_tags、comments。

## API 接口

### 认证 — `api/auth.php`

| Action | 方法 | 说明 | 权限 |
|--------|------|------|------|
| `?action=login` | POST | 登录，设置 httponly cookie（30 天有效） | 公开 |
| `?action=register` | POST | 注册（用户名≥2字符，密码≥6字符，邮箱可选） | 公开 |
| `?action=logout` | GET | 登出 | 公开 |
| `?action=check` | GET | 检查登录状态 | 公开 |
| `?action=user` | GET | 获取当前用户信息 | 已登录 |
| `?action=users` | GET | 获取所有用户 | 管理员 |
| `?action=delete-user` | DELETE | 删除用户 | 管理员 |
| `?action=upload-avatar` | POST | 上传头像（PNG/JPG/GIF/WebP, ≤10MB） | 已登录 |
| `?action=update-avatar` | POST | 更新头像（emoji 或路径） | 已登录 |
| `?action=change-password` | POST | 修改密码 | 已登录 |
| `?action=get-admin` | GET | 获取管理员信息（缓存 5 分钟） | 公开 |

### 首页初始化 — `api/init.php`

| 方法 | 说明 |
|------|------|
| GET | 一次性返回 stats + tags + announcements，减少请求数 |

### 文章列表 — `api/posts.php`

| 方法 | 说明 |
|------|------|
| GET | 获取文章列表（分页/筛选/排序） |
| GET `?id=X` | 获取单篇文章 |

**查询参数**：`page`、`limit`(默认10, 最大50)、`tag_id`、`tag_slug`、`tag_slugs`(多标签 AND)、`category_id`、`category_slug`、`sort`(created_at/views/comments)、`order`(ASC/DESC)、`status`(all/published/draft)

### 文章详情 — `api/post.php`

| 方法 | 说明 | 权限 |
|------|------|------|
| GET `?id=X` | 文章详情 + 上一篇/下一篇（`noView` 跳过阅读计数） | 公开 |
| POST `?id=X` | 创建文章 | 管理员 |
| PUT `?id=X` | 更新文章 | 管理员 |
| DELETE `?id=X` | 删除文章（级联删除评论和标签关联） | 管理员 |

### 评论 — `api/comments.php`

| 方法 | 说明 | 权限 |
|------|------|------|
| GET `?post_id=X` | 获取文章评论 | 公开 |
| GET `?all=true` | 获取所有评论 | 管理员 |
| POST | 提交评论 | 已登录 |
| DELETE `?id=X` | 删除评论 | 管理员 |

### 分类 — `api/categories.php`

| 方法 | 说明 | 权限 |
|------|------|------|
| GET | 获取所有分类（含文章计数） | 公开 |
| POST | 创建分类 | 管理员 |
| DELETE `?id=X` | 删除分类 | 管理员 |

### 标签 — `api/tags.php`

| 方法 | 说明 | 权限 |
|------|------|------|
| GET | 获取所有标签（含文章计数） | 公开 |
| POST | 创建标签 | 管理员 |
| DELETE `?id=X` | 删除标签 | 管理员 |

### 公告 — `api/announcement.php`

| Action | 方法 | 说明 | 权限 |
|--------|------|------|------|
| (默认) | GET | 获取启用的公告 | 公开 |
| `?action=list` | GET | 获取所有公告 | 管理员 |
| `?action=create` | POST | 创建公告 | 管理员 |
| `?action=update` | POST/PUT | 更新公告 | 管理员 |
| `?action=delete` | POST/DELETE | 删除公告 | 管理员 |
| `?action=toggle` | POST | 切换公告状态 | 管理员 |

> 公告数据存储在 `data/announcement.json`，非数据库。

### 其他

| 文件 | 方法 | 说明 |
|------|------|------|
| `api/about.php` | GET | 返回 `data/about.json` |
| `api/stats.php` | GET | 统计数据（`?all=true` 含草稿） |

### 响应格式

```json
{
    "success": true,
    "data": "...",
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 28,
        "pages": 3
    }
}
```

## 数据存储

| 位置 | 格式 | 内容 |
|------|------|------|
| `data/wuming_blog.db` | SQLite | 用户、文章、分类、标签、评论 |
| `data/announcement.json` | JSON | 公告数据 |
| `data/about.json` | JSON | 关于页数据 |
| `data/config.json` | JSON | 特效配置 |
| `data/admin_info.json` | JSON | 管理员信息缓存 |
| `data/avatars/` | 文件 | 用户上传的头像 |

## 自定义配色

编辑 `css/style.css`：

```css
:root {
    --rainbow-1: #ff6b6b;    /* 红 */
    --rainbow-2: #ffa94d;    /* 橙 */
    --rainbow-3: #ffd43b;    /* 黄 */
    --rainbow-4: #69db7c;    /* 绿 */
    --rainbow-5: #4dabf7;    /* 蓝 */
    --rainbow-6: #9775fa;    /* 靛 */
    --rainbow-7: #da77f2;    /* 紫 */
}
```

## 许可证

MIT License

---

Powered by Wuming Blog (c) 2026
