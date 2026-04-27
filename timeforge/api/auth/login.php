<?php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'error.serverError']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['ok' => false, 'error' => 'error.fillRequired']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['ok' => false, 'error' => 'error.loginFailed']);
    exit;
}

if ($user['blocked']) {
    echo json_encode(['ok' => false, 'error' => 'error.loginFailed']);
    exit;
}

// Update streak
$today     = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));
$streak    = (int)$user['streak'];

if ($user['last_active_date'] !== $today) {
    $streak = ($user['last_active_date'] === $yesterday) ? $streak + 1 : 1;
    $pdo->prepare('UPDATE users SET last_active_date = ?, streak = ? WHERE id = ?')
        ->execute([$today, $streak, $user['id']]);
}

// Start session
$_SESSION['user_id'] = $user['id'];
$_SESSION['expires'] = time() + 86400;

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
        'streak'         => $streak,
        'language'       => $user['language'],
        'timezone'       => $user['timezone'],
        'blocked'        => (bool)$user['blocked'],
        'lastActiveDate' => $today,
    ],
]);
