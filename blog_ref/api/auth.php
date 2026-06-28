<?php
/**
 * 认证 API - 匹配实际表结构
 */

require_once 'db.php';

// 设置上传限制
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '12M');
ini_set('max_execution_time', '120');
ini_set('max_input_time', '120');

// 判断是否被直接访问（用于区分被 require 的情况）
$isDirectAccess = basename($_SERVER['SCRIPT_NAME']) === 'auth.php';

if ($isDirectAccess) {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
}

/**
 * 更新管理员信息静态文件（用于快速读取）
 */
function updateAdminInfoFile($pdo) {
    $stmt = $pdo->prepare("SELECT id, username, avatar FROM users WHERE role = 'admin' LIMIT 1");
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        $data = [
            'success' => true,
            'admin' => [
                'id' => $admin['id'],
                'username' => $admin['username'],
                'avatar' => filterAvatar($admin['avatar'])
            ]
        ];
        file_put_contents(__DIR__ . '/../data/admin_info.json', json_encode($data, JSON_UNESCAPED_UNICODE));
    }
}

function getClientIP() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    }
    return filter_var($ip, FILTER_VALIDATE_IP) ?: '127.0.0.1';
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

function createSession($pdo, $userId, $username, $role) {
    $token = generateToken();
    $ip = getClientIP();
    $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255);
    $expires = date('Y-m-d H:i:s', strtotime('+30 days'));

    $pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'author',
        token TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $stmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("INSERT INTO sessions (user_id, username, email, role, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $username, $user['email'] ?? '', $role, $token, $ip, $userAgent, $expires]);

    return $token;
}

function validateSession($pdo, $token) {
    if (!$token) return ['valid' => false, 'reason' => 'no_token'];

    $stmt = $pdo->prepare("SELECT * FROM sessions WHERE token = ?");
    $stmt->execute([$token]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) return ['valid' => false, 'reason' => 'session_not_found', 'token_preview' => substr($token, 0, 10)];
    if (strtotime($session['expires_at']) < time()) return ['valid' => false, 'reason' => 'expired', 'expires_at' => $session['expires_at']];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$session['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("UPDATE sessions SET username = ?, email = ?, role = ?, last_active = ? WHERE token = ?");
        $stmt->execute([$user['username'], $user['email'] ?? '', $user['role'] ?? 'author', $now, $token]);

        $session['username'] = $user['username'];
        $session['role'] = $user['role'] ?? 'author';
        $session['email'] = $user['email'] ?? '';
        $session['avatar'] = $user['avatar'] ?? '👤';
    }

    $session['valid'] = true;
    return $session;
}

function getCurrentUser($pdo) {
    $token = $_COOKIE['auth_token'] ?? '';
    $session = validateSession($pdo, $token);
    // 返回有效的 session 或 null
    if (isset($session['valid']) && $session['valid'] === true) {
        return $session;
    }
    return null;
}

// 只有直接访问时才执行 API 逻辑
if ($isDirectAccess) {
try {
    $pdo = db()->getConnection();

    // 确保 sessions 表存在
    $pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'author',
        token TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    switch ($action) {
        case 'login':
            if ($method !== 'POST') {
                echo json_encode(['success' => false, 'message' => '仅支持POST请求']);
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $username = trim($data['username'] ?? '');
            $password = $data['password'] ?? '';

            if (empty($username) || empty($password)) {
                echo json_encode(['success' => false, 'message' => '请输入用户名和密码']);
                break;
            }

            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password'])) {
                $token = createSession($pdo, $user['id'], $user['username'], $user['role'] ?? 'author');

                setcookie('auth_token', $token, [
                    'expires' => strtotime('+30 days'),
                    'path' => '/',
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => '登录成功',
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'email' => $user['email'] ?? '',
                        'role' => $user['role'] ?? 'author',
                        'avatar' => filterAvatar($user['avatar'])
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => '用户名或密码错误']);
            }
            break;

        case 'register':
            if ($method !== 'POST') {
                echo json_encode(['success' => false, 'message' => '仅支持POST请求']);
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $username = trim($data['username'] ?? '');
            $email = trim($data['email'] ?? '');
            $password = $data['password'] ?? '';

            if (strlen($username) < 2) {
                echo json_encode(['success' => false, 'message' => '用户名至少2个字符']);
                break;
            }
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['success' => false, 'message' => '邮箱格式不正确']);
                break;
            }
            if (strlen($password) < 6) {
                echo json_encode(['success' => false, 'message' => '密码至少6个字符']);
                break;
            }

            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => '用户名已被使用']);
                break;
            }

            if ($email !== '') {
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => '邮箱已被注册']);
                    break;
                }
            }

            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $avatars = ['👤', '😊', '🤓', '😎', '🥳', '🤗', '😄', '🙂', '🎉', '✨', '🌟', '💫'];
            $avatar = $avatars[array_rand($avatars)];
            $now = date('Y-m-d H:i:s');

            $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$username, $email, $hashedPassword, 'author', $avatar, $now, $now]);

            $userId = $pdo->lastInsertId();
            $token = createSession($pdo, $userId, $username, 'author');

            setcookie('auth_token', $token, [
                'expires' => strtotime('+30 days'),
                'path' => '/',
                'httponly' => true,
                'samesite' => 'Lax'
            ]);

            echo json_encode([
                'success' => true,
                'message' => '注册成功',
                'user' => [
                    'id' => $userId,
                    'username' => $username,
                    'email' => $email,
                    'role' => 'author',
                    'avatar' => $avatar,
                    'created_at' => $now
                ]
            ]);
            break;

        case 'logout':
            $token = $_COOKIE['auth_token'] ?? '';
            if ($token) {
                $pdo->prepare("DELETE FROM sessions WHERE token = ?")->execute([$token]);
            }
            setcookie('auth_token', '', ['expires' => strtotime('-1 year'), 'path' => '/']);
            echo json_encode(['success' => true, 'message' => '已退出登录']);
            break;

        case 'check':
            $token = $_COOKIE['auth_token'] ?? '';
            $session = validateSession($pdo, $token);
            
            // 调试信息
            $debug = [
                'has_cookie' => isset($_COOKIE['auth_token']),
                'token_length' => $token ? strlen($token) : 0,
                'token_preview' => $token ? substr($token, 0, 16) . '...' : null,
                'session_result' => $session
            ];
            
            if (isset($session['valid']) && $session['valid'] === true) {
                echo json_encode([
                    'success' => true,
                    'loggedin' => true,
                    'user' => [
                        'id' => $session['user_id'],
                        'username' => $session['username'],
                        'email' => $session['email'] ?? '',
                        'role' => $session['role'],
                        'avatar' => filterAvatar($session['avatar'])
                    ],
                    'debug' => $debug
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'loggedin' => false,
                    'user' => null,
                    'debug' => $debug
                ]);
            }
            break;

        case 'user':
            $session = getCurrentUser($pdo);
            if (!$session) {
                echo json_encode(['success' => false, 'message' => '未登录']);
                break;
            }

            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$session['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'] ?? '',
                    'role' => $user['role'] ?? 'author',
                    'avatar' => filterAvatar($user['avatar']),
                    'created_at' => $user['created_at'] ?? '',
                    'updated_at' => $user['updated_at'] ?? ''
                ]
            ]);
            break;

        case 'users':
            $session = getCurrentUser($pdo);
            if (!$session || $session['role'] !== 'admin') {
                echo json_encode(['success' => false, 'message' => '需要管理员权限']);
                break;
            }

            $users = $pdo->query("SELECT id, username, email, role, avatar, created_at, updated_at FROM users ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'users' => $users]);
            break;

        case 'delete-user':
            $session = getCurrentUser($pdo);
            if (!$session || $session['role'] !== 'admin') {
                echo json_encode(['success' => false, 'message' => '需要管理员权限']);
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $userId = intval($_GET['id'] ?? $data['id'] ?? 0);

            if ($userId <= 0) {
                echo json_encode(['success' => false, 'message' => '无效的用户ID']);
                break;
            }
            if ($userId === intval($session['user_id'])) {
                echo json_encode(['success' => false, 'message' => '不能删除自己']);
                break;
            }

            $pdo->prepare("DELETE FROM sessions WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);

            echo json_encode(['success' => true, 'message' => '用户删除成功']);
            break;

        case 'upload-avatar':
            $session = getCurrentUser($pdo);
            if (!$session) {
                echo json_encode(['success' => false, 'message' => '未登录']);
                break;
            }

            if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
                echo json_encode(['success' => false, 'message' => '请选择图片']);
                break;
            }

            $file = $_FILES['avatar'];
            $allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            if (!in_array($ext, $allowedExts)) {
                echo json_encode(['success' => false, 'message' => '只支持 PNG, JPG, GIF, WebP']);
                break;
            }
            if ($file['size'] > 10 * 1024 * 1024) {
                echo json_encode(['success' => false, 'message' => '图片不能超过 10MB']);
                break;
            }

            // 创建头像目录
            $avatarDir = __DIR__ . '/../data/avatars';
            if (!is_dir($avatarDir)) {
                mkdir($avatarDir, 0755, true);
            }

            // 生成唯一文件名
            $filename = 'avatar_' . $session['user_id'] . '_' . time() . '.' . $ext;
            $filepath = $avatarDir . '/' . $filename;

            // 移动上传文件
            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                // 删除旧头像文件
                $stmt = $pdo->prepare("SELECT avatar FROM users WHERE id = ?");
                $stmt->execute([$session['user_id']]);
                $oldAvatar = $stmt->fetchColumn();
                if ($oldAvatar && strpos($oldAvatar, '/data/avatars/') === 0) {
                    $oldFile = __DIR__ . '/..' . $oldAvatar;
                    if (file_exists($oldFile)) {
                        @unlink($oldFile);
                    }
                }

                // 保存路径到数据库
                $avatarPath = '/data/avatars/' . $filename;
                $now = date('Y-m-d H:i:s');
                $pdo->prepare("UPDATE users SET avatar = ?, updated_at = ? WHERE id = ?")->execute([$avatarPath, $now, $session['user_id']]);

                // 更新管理员信息静态文件
                updateAdminInfoFile($pdo);

                echo json_encode(['success' => true, 'message' => '头像上传成功', 'avatar' => $avatarPath]);
            } else {
                echo json_encode(['success' => false, 'message' => '头像保存失败']);
            }
            break;

        case 'update-avatar':
            $session = getCurrentUser($pdo);
            if (!$session) {
                echo json_encode(['success' => false, 'message' => '未登录']);
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $avatar = $data['avatar'] ?? null;

            if ($avatar === null) {
                echo json_encode(['success' => false, 'message' => '请选择头像']);
                break;
            }

            $now = date('Y-m-d H:i:s');
            $pdo->prepare("UPDATE users SET avatar = ?, updated_at = ? WHERE id = ?")->execute([$avatar, $now, $session['user_id']]);

            // 更新管理员信息静态文件
            if ($session['role'] === 'admin') {
                updateAdminInfoFile($pdo);
            }

            echo json_encode(['success' => true, 'message' => '头像更新成功', 'avatar' => $avatar ?: '/assets/images/default_avatar.jpg']);
            break;

        case 'change-password':
            if ($method !== 'POST') {
                echo json_encode(['success' => false, 'message' => '仅支持POST请求']);
                break;
            }

            $session = getCurrentUser($pdo);
            if (!$session) {
                echo json_encode(['success' => false, 'message' => '未登录']);
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $oldPassword = $data['old_password'] ?? '';
            $newPassword = $data['new_password'] ?? '';

            if (strlen($newPassword) < 6) {
                echo json_encode(['success' => false, 'message' => '新密码至少6个字符']);
                break;
            }

            // 验证旧密码（管理员可以跳过）
            $stmt = $pdo->prepare("SELECT password, role FROM users WHERE id = ?");
            $stmt->execute([$session['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                echo json_encode(['success' => false, 'message' => '用户不存在']);
                break;
            }

            // 管理员修改密码也需要验证旧密码
            if (empty($oldPassword)) {
                echo json_encode(['success' => false, 'message' => '请输入当前密码']);
                break;
            }
            if (!password_verify($oldPassword, $user['password'])) {
                echo json_encode(['success' => false, 'message' => '当前密码错误']);
                break;
            }

            // 更新密码
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $now = date('Y-m-d H:i:s');
            $pdo->prepare("UPDATE users SET password = ?, updated_at = ? WHERE id = ?")->execute([$hashedPassword, $now, $session['user_id']]);

            echo json_encode(['success' => true, 'message' => '密码修改成功']);
            break;

        case 'get-admin':
            // 获取管理员信息（公开接口，用于显示博客头像）
            // 添加缓存控制头（缓存5分钟）
            header('Cache-Control: public, max-age=300');
            header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 300) . ' GMT');
            
            $stmt = $pdo->prepare("SELECT id, username, avatar FROM users WHERE role = 'admin' LIMIT 1");
            $stmt->execute();
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($admin) {
                echo json_encode([
                    'success' => true,
                    'admin' => [
                        'id' => $admin['id'],
                        'username' => $admin['username'],
                        'avatar' => filterAvatar($admin['avatar'])
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => '未找到管理员']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => '未知操作']);
    }

} catch (Exception $e) {
    error_log("Auth Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '服务器错误: ' . $e->getMessage()]);
}
} // end if ($isDirectAccess)