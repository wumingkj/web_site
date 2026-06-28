<?php
/**
 * 数据库配置 - 简洁版
 */

// SQLite 数据库路径
define('DB_TYPE', 'sqlite');
define('DB_PATH', __DIR__ . '/../data/wuming_blog.db');

// 错误报告
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// 时区设置
date_default_timezone_set('Asia/Shanghai');

// CORS 设置
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}