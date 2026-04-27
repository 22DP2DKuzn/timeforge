<?php
function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    header('Content-Type: application/json');
    if (empty($_SESSION['user_id']) || (isset($_SESSION['expires']) && $_SESSION['expires'] < time())) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
        exit;
    }
    return (int)$_SESSION['user_id'];
}

function body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function ok($data) {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}
