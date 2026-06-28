<?php
/**
 * 统计 API - 匹配实际表结构
 */

require_once 'db.php';

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $pdo = db()->getConnection();

    // 是否获取所有文章统计（管理后台用）
    $all = isset($_GET['all']) && $_GET['all'] === 'true';

    $stats = [
        'posts' => 0,
        'categories' => 0,
        'tags' => 0,
        'comments' => 0,
        'users' => 0,
        'views' => 0
    ];

    // 文章数
    try {
        $where = $all ? "" : " WHERE status = 'published'";
        $stats['posts'] = intval($pdo->query("SELECT COUNT(*) FROM posts" . $where)->fetchColumn());
    } catch (Exception $e) {}

    // 分类数
    try {
        $stats['categories'] = intval($pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn());
    } catch (Exception $e) {}

    // 标签数
    try {
        $stats['tags'] = intval($pdo->query("SELECT COUNT(*) FROM tags")->fetchColumn());
    } catch (Exception $e) {}

    // 评论数
    try {
        $stats['comments'] = intval($pdo->query("SELECT COUNT(*) FROM comments")->fetchColumn());
    } catch (Exception $e) {}

    // 用户数
    try {
        $stats['users'] = intval($pdo->query("SELECT COUNT(*) FROM users")->fetchColumn());
    } catch (Exception $e) {}

    // 总阅读数
    try {
        $stats['views'] = intval($pdo->query("SELECT COALESCE(SUM(views), 0) FROM posts" . $where)->fetchColumn());
    } catch (Exception $e) {}

    sendResponse(['success' => true, 'stats' => $stats]);

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage()]);
}