<?php
/**
 * 公告 API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// 处理 OPTIONS 请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list':
            handleList();
            break;
        case 'get':
            handleGet();
            break;
        case 'create':
            handleCreate();
            break;
        case 'update':
            handleUpdate();
            break;
        case 'delete':
            handleDelete();
            break;
        case 'toggle':
            handleToggle();
            break;
        default:
            // 默认返回所有启用的公告
            handleDefault();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * 默认：获取所有启用的公告（公开）
 */
function handleDefault() {
    $jsonFile = __DIR__ . '/../data/announcement.json';
    
    // 从 JSON 文件读取
    if (file_exists($jsonFile)) {
        $json = file_get_contents($jsonFile);
        $data = json_decode($json, true);
        
        if ($data && isset($data['enabled']) && $data['enabled'] === true) {
            $announcements = $data['announcements'] ?? [];
            // 只返回启用的公告
            $announcements = array_filter($announcements, function($a) {
                return isset($a['active']) && $a['active'] === true;
            });
            // 按排序
            usort($announcements, function($a, $b) {
                return ($a['sort_order'] ?? 0) <=> ($b['sort_order'] ?? 0);
            });
            
            echo json_encode([
                'success' => true,
                'announcements' => array_values($announcements)
            ]);
            return;
        }
    }
    
    // 如果 JSON 不存在或未启用，返回空
    echo json_encode([
        'success' => true,
        'announcements' => []
    ]);
}

/**
 * 获取公告列表（管理用）
 */
function handleList() {
    // 验证管理员权限
    $user = checkAuth();
    if (!$user || $user['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => '未授权']);
        return;
    }
    
    $jsonFile = __DIR__ . '/../data/announcement.json';
    
    if (file_exists($jsonFile)) {
        $json = file_get_contents($jsonFile);
        $data = json_decode($json, true);
        $announcements = $data['announcements'] ?? [];
    } else {
        $announcements = [];
    }
    
    // 按排序
    usort($announcements, function($a, $b) {
        return ($a['sort_order'] ?? 0) <=> ($b['sort_order'] ?? 0);
    });
    
    echo json_encode([
        'success' => true,
        'announcements' => array_values($announcements),
        'enabled' => $data['enabled'] ?? true
    ]);
}

/**
 * 获取单个公告
 */
function handleGet() {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => '缺少公告ID']);
        return;
    }
    
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM announcements WHERE id = ?");
    $stmt->execute([$id]);
    $announcement = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$announcement) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => '公告不存在']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'announcement' => $announcement
    ]);
}

/**
 * 创建公告
 */
function handleCreate() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => '方法不允许']);
        return;
    }

    // 验证管理员权限
    $user = checkAuth();
    if (!$user || $user['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => '未授权']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');
    $type = trim($input['type'] ?? 'info');
    $icon = trim($input['icon'] ?? '📢');
    $position = trim($input['position'] ?? 'side');
    $sortOrder = intval($input['sort_order'] ?? 0);
    $closable = isset($input['closable']) ? (bool)$input['closable'] : true;

    if (empty($content)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => '公告内容不能为空']);
        return;
    }

    // 读取现有数据
    $jsonFile = __DIR__ . '/../data/announcement.json';
    $data = ['enabled' => true, 'announcements' => []];

    if (file_exists($jsonFile)) {
        $data = json_decode(file_get_contents($jsonFile), true) ?: $data;
    }

    // 生成新 ID
    $maxId = 0;
    foreach ($data['announcements'] as $a) {
        if (($a['id'] ?? 0) > $maxId) $maxId = $a['id'];
    }

    $newAnnouncement = [
        'id' => $maxId + 1,
        'title' => $title,
        'content' => $content,
        'type' => $type,
        'icon' => $icon,
        'position' => $position,
        'active' => true,
        'closable' => $closable,
        'sort_order' => $sortOrder,
        'created_at' => date('Y-m-d H:i:s')
    ];

    $data['announcements'][] = $newAnnouncement;

    // 保存
    file_put_contents($jsonFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    echo json_encode([
        'success' => true,
        'message' => '公告创建成功',
        'id' => $newAnnouncement['id']
    ]);
}

/**
 * 更新公告
 */
function handleUpdate() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => '方法不允许']);
        return;
    }

    // 验证管理员权限
    $user = checkAuth();
    if (!$user || $user['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => '未授权']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $id = intval($input['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => '缺少公告ID']);
        return;
    }

    $jsonFile = __DIR__ . '/../data/announcement.json';
    if (!file_exists($jsonFile)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => '公告文件不存在']);
        return;
    }

    $data = json_decode(file_get_contents($jsonFile), true);
    if (!$data) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => '读取公告失败']);
        return;
    }

    // 找到并更新
    $found = false;
    foreach ($data['announcements'] as &$a) {
        if ($a['id'] === $id) {
            $found = true;
            $allowedFields = ['title', 'content', 'type', 'icon', 'position', 'sort_order', 'active', 'closable'];
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $a[$field] = $input[$field];
                }
            }
            break;
        }
    }

    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => '公告不存在']);
        return;
    }

    // 保存
    file_put_contents($jsonFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    echo json_encode([
        'success' => true,
        'message' => '公告更新成功'
    ]);
}

/**
 * 删除公告
 */
function handleDelete() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => '方法不允许']);
        return;
    }

    // 验证管理员权限
    $user = checkAuth();
    if (!$user || $user['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => '未授权']);
        return;
    }

    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => '缺少公告ID']);
        return;
    }

    $jsonFile = __DIR__ . '/../data/announcement.json';
    if (!file_exists($jsonFile)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => '公告文件不存在']);
        return;
    }

    $data = json_decode(file_get_contents($jsonFile), true);
    if (!$data) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => '读取公告失败']);
        return;
    }

    // 过滤掉要删除的公告
    $originalCount = count($data['announcements']);
    $data['announcements'] = array_values(array_filter($data['announcements'], function($a) use ($id) {
        return ($a['id'] ?? 0) !== $id;
    }));

    if (count($data['announcements']) === $originalCount) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => '公告不存在']);
        return;
    }

    // 保存
    file_put_contents($jsonFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    echo json_encode([
        'success' => true,
        'message' => '公告删除成功'
    ]);
}

/**
 * 切换公告状态
 */
function handleToggle() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => '方法不允许']);
        return;
    }

    // 验证管理员权限
    $user = checkAuth();
    if (!$user || $user['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => '未授权']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    // 全局开关
    if (isset($input['global'])) {
        $jsonFile = __DIR__ . '/../data/announcement.json';
        $data = ['enabled' => $input['global'] === true, 'announcements' => []];

        if (file_exists($jsonFile)) {
            $data = json_decode(file_get_contents($jsonFile), true) ?: $data;
        }

        $data['enabled'] = $input['global'] === true;
        file_put_contents($jsonFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        echo json_encode([
            'success' => true,
            'message' => $data['enabled'] ? '公告已启用' : '公告已禁用'
        ]);
        return;
    }

    $id = intval($input['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => '缺少公告ID']);
        return;
    }

    $jsonFile = __DIR__ . '/../data/announcement.json';
    if (!file_exists($jsonFile)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => '公告文件不存在']);
        return;
    }

    $data = json_decode(file_get_contents($jsonFile), true);
    if (!$data) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => '读取公告失败']);
        return;
    }

    // 切换单个公告状态
    $found = false;
    foreach ($data['announcements'] as &$a) {
        if ($a['id'] === $id) {
            $found = true;
            $a['active'] = !($a['active'] ?? false);
            break;
        }
    }

    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => '公告不存在']);
        return;
    }

    // 保存
    file_put_contents($jsonFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    echo json_encode([
        'success' => true,
        'message' => '状态更新成功'
    ]);
}

/**
 * 确保公告表存在
 */
function ensureAnnouncementsTable($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) DEFAULT '',
            content TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            icon VARCHAR(50) DEFAULT '📢',
            position ENUM('top', 'side') DEFAULT 'side',
            sort_order INT DEFAULT 0,
            active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

/**
 * 获取默认公告
 */
function getDefaultAnnouncements() {
    return [
        [
            'id' => 1,
            'title' => '欢迎来到无名博客',
            'content' => '感谢您的访问，这是一个正在建设中的个人博客。',
            'type' => 'info',
            'icon' => '🎉',
            'position' => 'top',
            'active' => true,
            'is_new' => true,
            'created_at' => date('Y-m-d')
        ],
        [
            'id' => 2,
            'title' => '新功能上线',
            'content' => 'Toast 消息系统已上线，体验更友好的消息提示！',
            'type' => 'success',
            'icon' => '✨',
            'position' => 'side',
            'active' => true,
            'is_new' => true,
            'created_at' => date('Y-m-d')
        ]
    ];
}