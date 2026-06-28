cd /var/www/blog
# ===== 第一步：修复所有目录权限（755 = 所有人可读可进，只有所有者可写）=====
find . -type d -exec chmod 755 {} \;

# ===== 第二步：修复所有文件权限（644 = 所有人可读，只有所有者可写）=====
find . -type f -exec chmod 644 {} \;

# ===== 第三步：特殊目录需要写权限 =====
# data 目录（SQLite 需要写权限创建 journal/wal 文件）
chmod 775 ./data/
chmod 664 ./data/wuming_blog.db
chown -R www-data:www-data ./data/

# logs 目录（日志需要写权限）
chmod 775 ./logs/
chown -R www-data:www-data ./logs/

# ===== 第四步：API PHP 文件确保可被读取（nginx/php-fpm 需要读）=====
chmod 644 ./api/*.php

# ===== 第五步：assets 静态资源确保可读 =====
chmod 644 ./assets/**/* 2>/dev/null
chmod 755 ./assets/ ./assets/images/

echo "权限设置完成！"