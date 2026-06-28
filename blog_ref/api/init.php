<?php
/**
 * 首页初始化 API - 合并多个接口减少请求数
 */

require_once 'db.php';

try {
    $pdo = db()->getConnection();

    // 统计数据
    $postsCount = $pdo->query("SELECT COUNT(*) FROM posts WHERE status = 'published'")->fetchColumn();
    $categoriesCount = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    $commentsCount = $pdo->query("SELECT COUNT(*) FROM comments WHERE status = 'approved'")->fetchColumn();
    $viewsTotal = $pdo->query("SELECT COALESCE(SUM(views), 0) FROM posts WHERE status = 'published'")->fetchColumn();

    $stats = [
        'posts' => intval($postsCount),
        'categories' => intval($categoriesCount),
        'comments' => intval($commentsCount),
        'views' => intval($viewsTotal)
    ];

    // 标签列表
    $tags = $pdo->query("
        SELECT t.id, t.name, t.slug, t.color, COUNT(pt.post_id) as post_count
        FROM tags t
        LEFT JOIN post_tags pt ON t.id = pt.tag_id
        LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
        GROUP BY t.id
        ORDER BY post_count DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    // 分类列表
    $categories = $pdo->query("
        SELECT c.id, c.name, c.slug, c.icon,
               (SELECT COUNT(*) FROM posts WHERE category_id = c.id AND status = 'published') as post_count
        FROM categories c
        ORDER BY post_count DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    // 公告（从 JSON 文件读取）
    $jsonFile = __DIR__ . '/../data/announcement.json';
    $announcements = [];
    if (file_exists($jsonFile)) {
        $aData = json_decode(file_get_contents($jsonFile), true);
        if ($aData && $aData['enabled'] && !empty($aData['announcements'])) {
            $announcements = array_values(array_filter($aData['announcements'], function($a) {
                return ($a['active'] ?? true);
            }));
            usort($announcements, function($a, $b) {
                $orderA = $a['sort_order'] ?? 0;
                $orderB = $b['sort_order'] ?? 0;
                if ($orderA !== $orderB) return $orderB - $orderA;
                return strtotime($b['created_at'] ?? '0') - strtotime($a['created_at'] ?? '0');
            });
        }
    }

    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'tags' => $tags,
        'categories' => $categories,
        'announcements' => $announcements
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
