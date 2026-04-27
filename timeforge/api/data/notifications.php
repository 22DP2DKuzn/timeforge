<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$body = body();

if ($method === 'GET') {
    $rows = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC');
    $rows->execute([$uid]);
    ok(array_map(fn($r) => [
        'id'        => $r['id'],
        'userId'    => (int)$r['user_id'],
        'type'      => $r['type'],
        'title'     => $r['title'],
        'message'   => $r['message'],
        'icon'      => $r['icon'],
        'read'      => (bool)$r['is_read'],
        'createdAt' => $r['created_at'],
    ], $rows->fetchAll()));

} elseif ($method === 'POST') {
    $d = $body;
    $pdo->prepare('INSERT INTO notifications (id,user_id,type,title,message,icon) VALUES (?,?,?,?,?,?)')
        ->execute([$d['id'],$uid,$d['type']??'',$d['title']??'',$d['message']??'',$d['icon']??'🔔']);
    ok($d);

} elseif ($method === 'PATCH') {
    // mark one as read
    $id = $body['id'] ?? '';
    $all = isset($body['all']) && $body['all'];
    if ($all) {
        $pdo->prepare('UPDATE notifications SET is_read=1 WHERE user_id=?')->execute([$uid]);
    } else {
        $pdo->prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?')->execute([$id, $uid]);
    }
    ok(null);
}
