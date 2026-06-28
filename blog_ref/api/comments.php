<?php
/**
 * 评论 API - 匹配实际表结构
 * comments 表字段: id, content, user, status, created_at, updated_at
 */

require_once 'db.php';

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
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

    // 创建 posts 表（用于关联）
    $pdo->exec("CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        excerpt TEXT,
        status TEXT DEFAULT 'published',
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // GET - 获取评论
    if ($method === 'GET') {
        $all = isset($_GET['all']) && $_GET['all'] === 'true';
        $postId = isset($_GET['post_id']) ? intval($_GET['post_id']) : 0;

        if ($all) {
            if (!checkAdmin($pdo)) {
                sendResponse(['success' => false, 'message' => '需要管理员权限']);
            }

            $comments = $pdo->query("
                SELECT c.*, p.title as post_title 
                FROM comments c 
                LEFT JOIN posts p ON c.post_id = p.id 
                ORDER BY c.created_at DESC
            ")->fetchAll(PDO::FETCH_ASSOC);

            $result = array_map(function($c) {
                return [
                    'id' => $c['id'],
                    'post_id' => $c['post_id'],
                    'user' => $c['user'] ?? '匿名',
                    'content' => $c['content'],
                    'status' => $c['status'] ?? 'approved',
                    'created_at' => $c['created_at'],
                    'updated_at' => $c['updated_at'] ?? '',
                    'post_title' => $c['post_title'] ?? '未知文章'
                ];
            }, $comments);

            sendResponse(['success' => true, 'comments' => $result]);
        } else {
            if ($postId <= 0) {
                sendResponse(['success' => false, 'error' => '无效的文章ID']);
            }

            $stmt = $pdo->prepare("SELECT c.*, u.avatar FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.status = 'approved' ORDER BY c.created_at ASC");
            $stmt->execute([$postId]);
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = array_map(function($c) {
                // 头像：如果是 base64 则不返回（太大），只返回文件路径或表情
                $avatar = $c['avatar'] ?? '👤';
                if (strpos($avatar, 'data:image') === 0) {
                    $avatar = '👤'; // base64 头像不传输，用户需重新上传
                }
                return [
                    'id' => $c['id'],
                    'user' => $c['user'] ?? '匿名',
                    'avatar' => $avatar,
                    'content' => $c['content'],
                    'status' => $c['status'] ?? 'approved',
                    'created_at' => $c['created_at'],
                    'updated_at' => $c['updated_at'] ?? ''
                ];
            }, $comments);

            sendResponse(['success' => true, 'data' => $result, 'total' => count($result)]);
        }
    }

    // POST - 提交评论（需要登录）
    if ($method === 'POST') {
        // 检查登录状态
        $token = $_COOKIE['auth_token'] ?? '';
        if (!$token) {
            sendResponse(['success' => false, 'message' => '请先登录后再评论']);
        }

        $stmt = $pdo->prepare("SELECT s.*, u.avatar FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')");
        $stmt->execute([$token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            sendResponse(['success' => false, 'message' => '登录已过期，请重新登录']);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $postId = intval($input['post_id'] ?? 0);
        $content = trim($input['content'] ?? '');

        if ($postId <= 0) {
            sendResponse(['success' => false, 'error' => '请选择文章']);
        }
        if (empty($content)) {
            sendResponse(['success' => false, 'error' => '请输入评论内容']);
        }

        // 使用登录用户信息
        $userId = $session['user_id'];
        $username = $session['username'];
        $avatar = filterAvatar($session['avatar'] ?? null);
        $now = date('Y-m-d H:i:s');
        $status = 'approved';

        $stmt = $pdo->prepare("INSERT INTO comments (post_id, user_id, user, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$postId, $userId, $username, $content, $status, $now, $now]);

        sendResponse([
            'success' => true,
            'message' => '评论发表成功',
            'data' => [
                'id' => $pdo->lastInsertId(),
                'post_id' => $postId,
                'user_id' => $userId,
                'user' => $username,
                'avatar' => $avatar,
                'content' => $content,
                'status' => $status,
                'created_at' => $now,
                'updated_at' => $now
            ]
        ]);
    }

    // DELETE - 删除评论
    if ($method === 'DELETE') {
        if (!checkAdmin($pdo)) {
            sendResponse(['success' => false, 'message' => '需要管理员权限']);
        }

        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0) {
            sendResponse(['success' => false, 'message' => '无效的评论ID']);
        }

        $pdo->prepare("DELETE FROM comments WHERE id = ?")->execute([$id]);

        sendResponse(['success' => true, 'message' => '评论删除成功']);
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage()]);
}