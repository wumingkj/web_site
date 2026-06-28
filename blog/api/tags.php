<?php
/**
 * 标签 API - 匹配实际表结构
 * tags 表字段: id, name, slug, color
 */

require_once 'db.php';

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $pdo = db()->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // GET - 获取标签列表
    if ($method === 'GET') {
        $tags = $pdo->query("
            SELECT t.*, COUNT(pt.post_id) as post_count 
            FROM tags t 
            LEFT JOIN post_tags pt ON t.id = pt.tag_id 
            GROUP BY t.id 
            ORDER BY t.name
        ")->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(['success' => true, 'tags' => $tags]);
    }

    // POST - 创建标签（管理员）
    if ($method === 'POST') {
        $token = $_COOKIE['auth_token'] ?? '';
        $stmt = $pdo->prepare("SELECT role FROM sessions WHERE token = ? AND expires_at > datetime('now')");
        $stmt->execute([$token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session || $session['role'] !== 'admin') {
            sendResponse(['success' => false, 'message' => '需要管理员权限']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $slug = trim($data['slug'] ?? '');
        $color = trim($data['color'] ?? '#4dabf7');

        if (empty($name)) {
            sendResponse(['success' => false, 'message' => '请输入标签名']);
        }

        if (empty($slug)) {
            $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
        }

        $stmt = $pdo->prepare("INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)");
        $stmt->execute([$name, $slug, $color]);

        sendResponse([
            'success' => true,
            'message' => '标签创建成功',
            'id' => $pdo->lastInsertId()
        ]);
    }

    // DELETE - 删除标签（管理员）
    if ($method === 'DELETE') {
        $token = $_COOKIE['auth_token'] ?? '';
        $stmt = $pdo->prepare("SELECT role FROM sessions WHERE token = ? AND expires_at > datetime('now')");
        $stmt->execute([$token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session || $session['role'] !== 'admin') {
            sendResponse(['success' => false, 'message' => '需要管理员权限']);
        }

        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0) {
            sendResponse(['success' => false, 'message' => '无效的标签ID']);
        }

        $pdo->prepare("DELETE FROM post_tags WHERE tag_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM tags WHERE id = ?")->execute([$id]);

        sendResponse(['success' => true, 'message' => '标签删除成功']);
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage()]);
}