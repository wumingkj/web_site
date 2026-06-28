<?php
/**
 * 分类 API - 匹配实际表结构
 * categories 表字段: id, name, slug, icon
 */

require_once 'db.php';

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $pdo = db()->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // GET - 获取分类列表
    if ($method === 'GET') {
        $categories = $pdo->query("
            SELECT c.*, COUNT(p.id) as post_count 
            FROM categories c 
            LEFT JOIN posts p ON c.id = p.category_id 
            GROUP BY c.id 
            ORDER BY c.name
        ")->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(['success' => true, 'categories' => $categories]);
    }

    // POST - 创建分类（管理员）
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
        $icon = trim($data['icon'] ?? '📁');

        if (empty($name)) {
            sendResponse(['success' => false, 'message' => '请输入分类名']);
        }

        if (empty($slug)) {
            $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
        }

        $stmt = $pdo->prepare("INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)");
        $stmt->execute([$name, $slug, $icon]);

        sendResponse([
            'success' => true,
            'message' => '分类创建成功',
            'id' => $pdo->lastInsertId()
        ]);
    }

    // DELETE - 删除分类（管理员）
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
            sendResponse(['success' => false, 'message' => '无效的分类ID']);
        }

        $pdo->prepare("UPDATE posts SET category_id = NULL WHERE category_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);

        sendResponse(['success' => true, 'message' => '分类删除成功']);
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage()]);
}