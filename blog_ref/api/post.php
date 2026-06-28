<?php
/**
 * 文章 API - 匹配实际表结构
 */

require_once 'db.php';

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function checkAdmin($pdo) {
    $token = $_COOKIE['auth_token'] ?? '';
    if (!$token) return false;

    $stmt = $pdo->prepare("SELECT role FROM sessions WHERE token = ? AND expires_at > datetime('now')");
    $stmt->execute([$token]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    return $session && $session['role'] === 'admin';
}

try {
    $pdo = db()->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    // GET - 获取文章
    if ($method === 'GET') {
        if ($id <= 0) {
            sendResponse(['success' => false, 'error' => '无效的文章ID']);
        }

        $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
        $stmt->execute([$id]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$post) {
            sendResponse(['success' => false, 'error' => '文章不存在']);
        }

        // 更新阅读数（仅当 noView 参数不存在且文章已发布时）
        $noView = isset($_GET['noView']) || isset($_GET['noview']);
        if (!$noView && ($post['status'] ?? 'published') === 'published') {
            $newViews = intval($post['views']) + 1;
            $pdo->prepare("UPDATE posts SET views = ? WHERE id = ?")->execute([$newViews, $id]);
            $post['views'] = $newViews;
        }

        // 获取评论数
        $post['comments'] = 0;
        try {
            $result = $pdo->query("SELECT COUNT(*) as count FROM comments WHERE post_id = $id")->fetch();
            $post['comments'] = intval($result['count']);
        } catch (Exception $e) {}

        // 获取标签
        $post['tags'] = [];
        try {
            $tags = $pdo->query("
                SELECT t.id, t.name, t.slug, t.color 
                FROM tags t
                JOIN post_tags pt ON t.id = pt.tag_id
                WHERE pt.post_id = $id
            ")->fetchAll(PDO::FETCH_ASSOC);
            $post['tags'] = $tags;
        } catch (Exception $e) {}

        // 获取分类
        if (!empty($post['category_id'])) {
            $cat = $pdo->query("SELECT id, name, slug, icon FROM categories WHERE id = {$post['category_id']}")->fetch(PDO::FETCH_ASSOC);
            $post['category'] = $cat ?: null;
        }

        // 上一篇/下一篇
        $prev = $pdo->query("SELECT id, title FROM posts WHERE id < $id ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        $next = $pdo->query("SELECT id, title FROM posts WHERE id > $id ORDER BY id ASC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        $post['prev'] = $prev ?: null;
        $post['next'] = $next ?: null;

        sendResponse(['success' => true, 'post' => $post, 'data' => $post]);
    }

    // POST - 创建文章
    if ($method === 'POST') {
        if (!checkAdmin($pdo)) {
            sendResponse(['success' => false, 'message' => '需要管理员权限']);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $title = trim($data['title'] ?? '');
        $content = $data['content'] ?? '';
        $excerpt = trim($data['excerpt'] ?? '');
        $status = $data['status'] ?? 'published';
        $categoryId = intval($data['category_id'] ?? 0) ?: null;
        $tagIds = $data['tag_ids'] ?? [];

        if (empty($title)) {
            sendResponse(['success' => false, 'message' => '请输入标题']);
        }

if (empty($excerpt) && !empty($content)) {
    $plainText = strip_tags($content);
    if (function_exists('mb_substr')) {
        $excerpt = mb_substr($plainText, 0, 150, 'UTF-8');
    } else {
        // 安全截断：逐字节扫描，避免截断多字节 UTF-8 字符
        $excerpt = '';
        $len = 0;
        for ($i = 0; $i < strlen($plainText) && $len < 150; $i++) {
            $byte = ord($plainText[$i]);
            if ($byte < 0x80) {
                $excerpt .= $plainText[$i];
                $len++;
            } elseif ($byte >= 0xC0) {
                $charLen = ($byte >= 0xF0) ? 4 : (($byte >= 0xE0) ? 3 : 2);
                if ($i + $charLen <= strlen($plainText) && $len + 1 <= 150) {
                    $excerpt .= substr($plainText, $i, $charLen);
                    $i += $charLen - 1;
                    $len++;
                } else {
                    break;
                }
            }
            // 0x80-0xBF 是续字节，跳过（不应出现在首位）
        }
    }
}
// 确保 excerpt 是合法 UTF-8，防止 json_encode 失败
if (!empty($excerpt) && function_exists('mb_encode_numericentity')) {
    $encoded = mb_encode_numericentity($excerpt, [0x80, 0x10FFFF, 0, 0x1FFFFF], 'UTF-8');
    $excerpt = mb_decode_numericentity($encoded, [0x80, 0x10FFFF, 0, 0x1FFFFF], 'UTF-8');
}

        $now = date('Y-m-d H:i:s');

        $stmt = $pdo->prepare("INSERT INTO posts (id, title, content, excerpt, status, category_id, views, created_at, updated_at) VALUES (NULL, ?, ?, ?, ?, ?, 0, ?, ?)");
        $stmt->execute([$title, $content, $excerpt, $status, $categoryId, $now, $now]);

        $newId = $pdo->lastInsertId();

        // 处理标签
        foreach ($tagIds as $tagId) {
            $tagId = intval($tagId);
            if ($tagId > 0) {
                $pdo->prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)")->execute([$newId, $tagId]);
            }
        }

        sendResponse(['success' => true, 'message' => '文章创建成功', 'id' => $newId]);
    }

    // PUT - 更新文章
    if ($method === 'PUT') {
        if (!checkAdmin($pdo)) {
            sendResponse(['success' => false, 'message' => '需要管理员权限']);
        }

        if ($id <= 0) {
            sendResponse(['success' => false, 'message' => '无效的文章ID']);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $title = trim($data['title'] ?? '');
        $content = $data['content'] ?? '';
        $excerpt = trim($data['excerpt'] ?? '');
        $status = $data['status'] ?? 'published';
        $categoryId = isset($data['category_id']) ? (intval($data['category_id']) ?: null) : null;
        $tagIds = $data['tag_ids'] ?? null;

        if (empty($title)) {
            sendResponse(['success' => false, 'message' => '请输入标题']);
        }

if (empty($excerpt) && !empty($content)) {
    $plainText = strip_tags($content);
    if (function_exists('mb_substr')) {
        $excerpt = mb_substr($plainText, 0, 150, 'UTF-8');
    } else {
        $excerpt = '';
        $len = 0;
        for ($i = 0; $i < strlen($plainText) && $len < 150; $i++) {
            $byte = ord($plainText[$i]);
            if ($byte < 0x80) {
                $excerpt .= $plainText[$i];
                $len++;
            } elseif ($byte >= 0xC0) {
                $charLen = ($byte >= 0xF0) ? 4 : (($byte >= 0xE0) ? 3 : 2);
                if ($i + $charLen <= strlen($plainText) && $len + 1 <= 150) {
                    $excerpt .= substr($plainText, $i, $charLen);
                    $i += $charLen - 1;
                    $len++;
                } else {
                    break;
                }
            }
        }
    }
}
if (!empty($excerpt) && function_exists('mb_encode_numericentity')) {
    $encoded = mb_encode_numericentity($excerpt, [0x80, 0x10FFFF, 0, 0x1FFFFF], 'UTF-8');
    $excerpt = mb_decode_numericentity($encoded, [0x80, 0x10FFFF, 0, 0x1FFFFF], 'UTF-8');
}

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("UPDATE posts SET title = ?, content = ?, excerpt = ?, status = ?, category_id = ?, updated_at = ? WHERE id = ?");
        $stmt->execute([$title, $content, $excerpt, $status, $categoryId, $now, $id]);

        // 更新标签
        if ($tagIds !== null) {
            $pdo->prepare("DELETE FROM post_tags WHERE post_id = ?")->execute([$id]);
            foreach ($tagIds as $tagId) {
                $tagId = intval($tagId);
                if ($tagId > 0) {
                    $pdo->prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)")->execute([$id, $tagId]);
                }
            }
        }

        sendResponse(['success' => true, 'message' => '文章更新成功']);
    }

    // DELETE - 删除文章
    if ($method === 'DELETE') {
        if (!checkAdmin($pdo)) {
            sendResponse(['success' => false, 'message' => '需要管理员权限']);
        }

        if ($id <= 0) {
            sendResponse(['success' => false, 'message' => '无效的文章ID']);
        }

        $pdo->prepare("DELETE FROM comments WHERE post_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM post_tags WHERE post_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM posts WHERE id = ?")->execute([$id]);

        sendResponse(['success' => true, 'message' => '文章删除成功']);
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage()]);
}