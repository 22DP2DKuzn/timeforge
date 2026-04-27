<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $row = $pdo->prepare('SELECT * FROM user_settings WHERE user_id=?');
    $row->execute([$uid]);
    $s = $row->fetch() ?: ['email_notifications'=>1,'reminder_24h'=>1,'reminder_1h'=>1];
    ok([
        'emailNotifications' => (bool)$s['email_notifications'],
        'reminder24h'        => (bool)$s['reminder_24h'],
        'reminder1h'         => (bool)$s['reminder_1h'],
    ]);

} elseif ($method === 'PUT') {
    $d = body();
    $pdo->prepare('INSERT INTO user_settings (user_id,email_notifications,reminder_24h,reminder_1h) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE email_notifications=VALUES(email_notifications),reminder_24h=VALUES(reminder_24h),reminder_1h=VALUES(reminder_1h)')
        ->execute([$uid,(int)($d['emailNotifications']??1),(int)($d['reminder24h']??1),(int)($d['reminder1h']??1)]);
    ok($d);
}
