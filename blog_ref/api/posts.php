<?php
/**
 * 文章列表 API - 匹配实际表结构
 */

require_once 'db.php';

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

try {
    $pdo = db()->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(50, intval($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

        // 获取单篇文章
        if ($id > 0) {
            $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
            $stmt->execute([$id]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$post) {
                sendResponse(['success' => false, 'error' => '文章不存在']);
            }

            $commentCount = $pdo->prepare("SELECT COUNT(*) FROM comments WHERE post_id = ?");
            $commentCount->execute([$id]);
            $post['comments'] = intval($commentCount->fetchColumn());

            sendResponse(['success' => true, 'post' => $post]);
        }

        // 获取文章列表
        $tagId = isset($_GET['tag_id']) ? intval($_GET['tag_id']) : 0;
        $tagSlug = trim($_GET['tag_slug'] ?? '');
        $tagSlugs = trim($_GET['tag_slugs'] ?? ''); // 多标签筛选，逗号分隔
        $categoryId = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;
        $categorySlug = trim($_GET['category_slug'] ?? '');

        // 排序参数
        $sort = in_array($_GET['sort'] ?? '', ['created_at', 'views', 'comments']) ? $_GET['sort'] : 'created_at';
        $order = strtoupper($_GET['order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
        
        // 构建SQL
        $status = $_GET['status'] ?? '';
        $params = [];

        // 如果没有指定状态或状态不是 all/published/draft，前端默认只显示已发布文章
        if ($status === 'all') {
            $where = "1=1";
        } elseif ($status === 'draft' || $status === 'published') {
            $where = "p.status = ?";
            $params[] = $status;
        } else {
            // 默认只显示已发布
            $where = "p.status = 'published'";
        }
        
        if ($tagId > 0) {
            $where .= " AND p.id IN (SELECT post_id FROM post_tags WHERE tag_id = ?)";
            $params[] = $tagId;
        } elseif (!empty($tagSlugs)) {
            // 多标签筛选（AND 关系 - 必须同时包含所有选中的标签）
            $slugs = array_filter(array_map('trim', explode(',', $tagSlugs)));
            if (!empty($slugs)) {
                $placeholders = implode(',', array_fill(0, count($slugs), '?'));
                $tagCount = count($slugs);
                $where .= " AND p.id IN (
                    SELECT pt.post_id 
                    FROM post_tags pt 
                    JOIN tags t ON pt.tag_id = t.id 
                    WHERE t.slug IN ($placeholders)
                    GROUP BY pt.post_id 
                    HAVING COUNT(DISTINCT t.id) = $tagCount
                )";
                $params = array_merge($params, $slugs);
            }
        } elseif (!empty($tagSlug)) {
            $where .= " AND p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE t.slug = ?)";
            $params[] = $tagSlug;
        }

        // 分类筛选
        if ($categoryId > 0) {
            $where .= " AND p.category_id = ?";
            $params[] = $categoryId;
        } elseif (!empty($categorySlug)) {
            $where .= " AND p.category_id = (SELECT id FROM categories WHERE slug = ?)";
            $params[] = $categorySlug;
        }

        // 排序逻辑
        $orderBy = "p.created_at";
        if ($sort === 'views') {
            $orderBy = "p.views";
        } elseif ($sort === 'comments') {
      $orderBy = "(SELECT COUNT(*) FROM comments WHERE post_id = p.id)";
        }
        
        $sql = "SELECT p.id, p.title, p.category_id, p.status, p.views, p.created_at, p.updated_at FROM posts p WHERE $where ORDER BY $orderBy $order LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countSql = "SELECT COUNT(*) FROM posts p WHERE $where";
        $countParams = array_slice($params, 0, -2); // 移除 limit 和 offset
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($countParams);
        $total = $countStmt->fetchColumn();

        // 批量获取评论数
        $postIds = array_column($posts, 'id');
        $commentCounts = [];
        if (!empty($postIds)) {
            $idPlaceholders = implode(',', array_fill(0, count($postIds), '?'));
            $commentStmt = $pdo->prepare("SELECT post_id, COUNT(*) as cnt FROM comments WHERE post_id IN ($idPlaceholders) GROUP BY post_id");
            $commentStmt->execute($postIds);
            while ($row = $commentStmt->fetch(PDO::FETCH_ASSOC)) {
                $commentCounts[$row['post_id']] = intval($row['cnt']);
            }
        }

        // 批量获取标签
        $postTags = [];
        if (!empty($postIds)) {
            $idPlaceholders = implode(',', array_fill(0, count($postIds), '?'));
            $tagStmt = $pdo->prepare("
                SELECT pt.post_id, t.id, t.name, t.slug, t.color 
                FROM post_tags pt
                JOIN tags t ON pt.tag_id = t.id
                WHERE pt.post_id IN ($idPlaceholders)
            ");
            $tagStmt->execute($postIds);
            while ($row = $tagStmt->fetch(PDO::FETCH_ASSOC)) {
                $postTags[$row['post_id']][] = $row;
            }
        }

        foreach ($posts as &$post) {
            $post['comments'] = $commentCounts[$post['id']] ?? 0;
            $post['tags'] = $postTags[$post['id']] ?? [];
        }

        sendResponse([
            'success' => true,
            'data' => $posts,
            'total' => intval($total),
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]);
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage()]);
}