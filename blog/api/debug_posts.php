<?php
/**
 * 调试 json_encode 问题
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db.php';

echo "<h2>JSON 编码调试</h2>";

try {
    $pdo = db()->getConnection();

    $sql = "SELECT p.* FROM posts p WHERE p.status = 'published' ORDER BY p.created_at DESC LIMIT 10 OFFSET 0";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($posts as &$post) {
        $commentCount = $pdo->prepare("SELECT COUNT(*) FROM comments WHERE post_id = ?");
        $commentCount->execute([$post['id']]);
        $post['comments'] = intval($commentCount->fetchColumn());

        $tags = $pdo->query("
            SELECT t.id, t.name, t.slug, t.color 
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = {$post['id']}
        ")->fetchAll(PDO::FETCH_ASSOC);
        $post['tags'] = $tags;
    }

    // 逐篇文章测试 json_encode
    foreach ($posts as $i => $post) {
        echo "<h3>文章 {$post['id']}: {$post['title']}</h3>";
        $json = json_encode($post, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if ($json === false) {
            echo "<p style='color:red'>❌ json_encode 失败! 错误: " . json_last_error_msg() . "</p>";
            
            // 逐字段测试
            foreach ($post as $key => $value) {
                $test = json_encode([$key => $value], JSON_UNESCAPED_UNICODE);
                if ($test === false) {
                    echo "<p style='color:red'>字段 '$key' 编码失败</p>";
                    // 检查是否有无效 UTF-8
                    $isValid = mb_check_encoding($value, 'UTF-8');
                    echo "<p>UTF-8 有效: " . ($isValid ? '是' : '否') . "</p>";
                    echo "<p>字段长度: " . strlen($value) . "</p>";
                    // 显示前200字符的十六进制
                    $sample = substr($value, 0, 200);
                    echo "<p>前200字符: " . htmlspecialchars($sample) . "</p>";
                    // 修复: 用 UTF-8 重新编码
                    $fixed = utf8_encode($value);
                    $fixedJson = json_encode([$key => $fixed], JSON_UNESCAPED_UNICODE);
                    echo "<p>修复后编码: " . ($fixedJson !== false ? '成功' : '仍失败') . "</p>";
                }
            }
        } else {
            echo "<p style='color:green'>✓ json_encode 成功 (" . strlen($json) . " 字节)</p>";
        }
    }

    // 测试完整结果
    echo "<h3>完整数据编码测试</h3>";
    $result = [
        'success' => true,
        'data' => $posts,
        'total' => count($posts)
    ];
    
    // 不带 JSON_UNESCAPED_UNICODE 试试
    $json1 = json_encode($result);
    echo "<p>默认编码: " . ($json1 !== false ? '成功 (' . strlen($json1) . ' 字节)' : '失败 - ' . json_last_error_msg()) . "</p>";
    
    // 带 JSON_UNESCAPED_UNICODE
    $json2 = json_encode($result, JSON_UNESCAPED_UNICODE);
    echo "<p>UNESCAPED_UNICODE: " . ($json2 !== false ? '成功 (' . strlen($json2) . ' 字节)' : '失败 - ' . json_last_error_msg()) . "</p>";

    // 带 JSON_INVALID_UTF8_SUBSTITUTE
    $json3 = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    echo "<p>INVALID_UTF8_SUBSTITUTE: " . ($json3 !== false ? '成功 (' . strlen($json3) . ' 字节)' : '失败 - ' . json_last_error_msg()) . "</p>";

} catch (Exception $e) {
    echo "<p style='color:red'>❌ 错误: " . $e->getMessage() . "</p>";
}
?>
