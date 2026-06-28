<?php
/**
 * 数据库连接类 - 简洁版
 */

require_once __DIR__ . '/config.php';

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        try {
            $dsn = 'sqlite:' . DB_PATH;
            $this->pdo = new PDO($dsn, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            $this->pdo->exec('PRAGMA foreign_keys = ON');
        } catch (PDOException $e) {
            $this->sendError('数据库连接失败: ' . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    private function sendError($message) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function db() {
    return Database::getInstance();
}

/**
 * 过滤头像：base64 太大不传输，只返回文件路径或表情
 */
function filterAvatar($avatar) {
    if (!$avatar) return '👤';
    // 如果是 base64 编码，不返回（用户需重新上传）
    if (strpos($avatar, 'data:image') === 0) {
        return '👤';
    }
    return $avatar;
}