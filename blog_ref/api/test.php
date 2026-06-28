<?php
/**
 * 数据库测试 API - 匹配实际表结构
 */

require_once 'db.php';

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $pdo = db()->getConnection();

    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);

    $result = ['success' => true, 'database' => DB_PATH, 'tables' => []];

    foreach ($tables as $table) {
        if ($table === 'sqlite_sequence') continue;

        $columns = $pdo->query("PRAGMA table_info(\"$table\")")->fetchAll(PDO::FETCH_ASSOC);
        $count = $pdo->query("SELECT COUNT(*) FROM \"$table\"")->fetchColumn();

        $result['tables'][$table] = [
            'columns' => $columns,
            'count' => $count
        ];
    }

    $result['size_mb'] = round(filesize(DB_PATH) / 1024 / 1024, 2);

    sendResponse($result);

} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage()]);
}