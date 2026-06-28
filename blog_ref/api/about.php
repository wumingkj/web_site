<?php
/**
 * 关于页面 API - 返回 about.json 数据
 */

header('Content-Type: application/json; charset=utf-8');

$jsonPath = __DIR__ . '/../data/about.json';

if (file_exists($jsonPath)) {
    echo file_get_contents($jsonPath);
} else {
    echo json_encode([
        'avatar' => '💫',
        'name' => '无名',
        'title' => '🌈 永远相信美好的事情即将发生',
        'bio' => '暂无简介',
        'skills' => [],
        'timeline' => [],
        'contact' => ['email' => '', 'github' => '']
    ], JSON_UNESCAPED_UNICODE);
}