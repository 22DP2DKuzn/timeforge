<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->prepare('SELECT achievement_id FROM user_achievements WHERE user_id=?');
    $rows->execute([$uid]);
    ok($rows->fetchAll(PDO::FETCH_COLUMN));

} elseif ($method === 'POST') {
    $achId = body()['achievementId'] ?? '';
    $check = $pdo->prepare('SELECT 1 FROM user_achievements WHERE user_id=? AND achievement_id=?');
    $check->execute([$uid, $achId]);
    if ($check->fetch()) {
        ok(['unlocked' => false]);
    } else {
        $pdo->prepare('INSERT INTO user_achievements (user_id,achievement_id) VALUES (?,?)')->execute([$uid, $achId]);
        ok(['unlocked' => true]);
    }
}
