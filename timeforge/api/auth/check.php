<?php
header('Content-Type: application/json');
session_start();

if (empty($_SESSION['user_id']) || (isset($_SESSION['expires']) && $_SESSION['expires'] < time())) {
    session_destroy();
    echo json_encode(['ok' => false]);
    exit;
}

require_once dirname(__DIR__) . '/config.php';

$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || $user['blocked']) {
    session_destroy();
    echo json_encode(['ok' => false]);
    exit;
}

echo json_encode([
    'ok'   => true,
    'user' => [
        'id'             => (int)$user['id'],
        'firstName'      => $user['first_name'],
        'lastName'       => $user['last_name'],
        'email'          => $user['email'],
        'role'           => $user['role'],
        'xp'             => (int)$user['xp'],
        'level'          => (int)$user['level_num'],
        'streak'         => (int)$user['streak'],
        'language'       => $user['language'],
        'timezone'       => $user['timezone'],
        'blocked'        => (bool)$user['blocked'],
        'lastActiveDate' => $user['last_active_date'],
    ],
]);
