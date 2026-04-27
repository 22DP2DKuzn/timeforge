<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$body = body();

function mapUser($r) {
    return [
        'id'             => (int)$r['id'],
        'firstName'      => $r['first_name'],
        'lastName'       => $r['last_name'],
        'email'          => $r['email'],
        'role'           => $r['role'],
        'blocked'        => (bool)$r['blocked'],
        'xp'             => (int)$r['xp'],
        'level'          => (int)$r['level_num'],
        'streak'         => (int)$r['streak'],
        'language'       => $r['language'],
        'timezone'       => $r['timezone'],
        'lastActiveDate' => $r['last_active_date'],
        'createdAt'      => $r['created_at'],
    ];
}

if ($method === 'GET') {
    // Only admins can list all users
    $me = $pdo->prepare('SELECT role FROM users WHERE id=?');
    $me->execute([$uid]);
    $myRole = $me->fetchColumn();
    if ($myRole !== 'admin') { fail('Forbidden', 403); exit; }

    $rows = $pdo->query('SELECT * FROM users ORDER BY created_at ASC')->fetchAll();
    ok(array_map('mapUser', $rows));

} elseif ($method === 'PUT') {
    $d = $body;
    $pdo->prepare('UPDATE users SET first_name=?,last_name=?,language=?,timezone=? WHERE id=?')
        ->execute([$d['firstName']??'',$d['lastName']??'',$d['language']??'lv',$d['timezone']??'Europe/Riga',$uid]);
    ok($d);

} elseif ($method === 'PATCH') {
    // block/unblock or role change (admin only)
    $me = $pdo->prepare('SELECT role FROM users WHERE id=?');
    $me->execute([$uid]);
    if ($me->fetchColumn() !== 'admin') { fail('Forbidden', 403); exit; }

    if (isset($body['role'])) {
        $role = in_array($body['role'], ['admin', 'user', 'guest']) ? $body['role'] : 'user';
        $pdo->prepare('UPDATE users SET role=? WHERE id=?')
            ->execute([$role, (int)$body['id']]);
    } else {
        $pdo->prepare('UPDATE users SET blocked=? WHERE id=?')
            ->execute([(int)(bool)($body['blocked']??false), (int)$body['id']]);
    }
    ok(null);

} elseif ($method === 'DELETE') {
    // Only admin can delete users
    $me = $pdo->prepare('SELECT role FROM users WHERE id=?');
    $me->execute([$uid]);
    if ($me->fetchColumn() !== 'admin') { fail('Forbidden', 403); exit; }
    $pdo->prepare('DELETE FROM users WHERE id=?')->execute([(int)$body['id']]);
    ok(null);
}
