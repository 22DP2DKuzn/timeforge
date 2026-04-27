<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->prepare('SELECT * FROM activity_log WHERE user_id=? ORDER BY created_at DESC LIMIT 500');
    $rows->execute([$uid]);
    ok(array_map(fn($r) => [
        'id'        => $r['id'],
        'userId'    => (int)$r['user_id'],
        'action'    => $r['action'],
        'details'   => $r['details'],
        'timestamp' => $r['created_at'],
    ], $rows->fetchAll()));

} elseif ($method === 'POST') {
    $d = body();
    $pdo->prepare('INSERT INTO activity_log (id,user_id,action,details) VALUES (?,?,?,?)')
        ->execute([$d['id'],$uid,$d['action']??'',$d['details']??'']);
    ok(null);
}
