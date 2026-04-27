<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();

$me = $pdo->prepare('SELECT role FROM users WHERE id=?');
$me->execute([$uid]);
if ($me->fetchColumn() !== 'admin') { fail('Forbidden', 403); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { fail('Method not allowed', 405); exit; }

$body = body();
$title   = trim($body['title']   ?? '');
$message = trim($body['message'] ?? '');
$icon    = trim($body['icon']    ?? '📢');
$target  = $body['target'] ?? 'all';

if (!$title || !$message) { fail('Title and message required', 400); exit; }

function makeUuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
}

$stmt = $pdo->prepare(
    'INSERT INTO notifications (id, user_id, type, title, message, icon) VALUES (?,?,?,?,?,?)'
);

if ($target === 'all') {
    $users = $pdo->query('SELECT id FROM users WHERE blocked = 0')->fetchAll();
    foreach ($users as $u) {
        $stmt->execute([makeUuid(), $u['id'], 'announcement', $title, $message, $icon]);
    }
    ok(['sent' => count($users)]);
} else {
    $stmt->execute([makeUuid(), (int)$target, 'announcement', $title, $message, $icon]);
    ok(['sent' => 1]);
}
