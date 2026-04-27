<?php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'error.serverError']);
    exit;
}

$data      = json_decode(file_get_contents('php://input'), true) ?? [];
$firstName = trim($data['firstName'] ?? '');
$lastName  = trim($data['lastName']  ?? '');
$email     = strtolower(trim($data['email'] ?? ''));
$password  = $data['password'] ?? '';

if (!$firstName || !$lastName || !$email || !$password) {
    echo json_encode(['ok' => false, 'error' => 'error.fillRequired']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'error' => 'error.emailInvalid']);
    exit;
}

// Check duplicate email
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['ok' => false, 'error' => 'error.emailExists']);
    exit;
}

// First registered user becomes admin
$role = ($pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() == 0) ? 'admin' : 'user';

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$firstName, $lastName, $email, $hash, $role]);
$userId = (int)$pdo->lastInsertId();

echo json_encode([
    'ok'   => true,
    'user' => [
        'id'             => $userId,
        'firstName'      => $firstName,
        'lastName'       => $lastName,
        'email'          => $email,
        'role'           => $role,
        'xp'             => 0,
        'level'          => 1,
        'streak'         => 0,
        'language'       => 'lv',
        'timezone'       => 'Europe/Riga',
        'blocked'        => false,
        'lastActiveDate' => null,
    ],
]);
