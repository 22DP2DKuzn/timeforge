<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();

// Admin only
$me = $pdo->prepare('SELECT role FROM users WHERE id=?');
$me->execute([$uid]);
if ($me->fetchColumn() !== 'admin') { fail('Forbidden', 403); exit; }

// Aggregate stats
$stats = [];

$stats['totalUsers']    = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
$stats['activeUsers']   = (int) $pdo->query('SELECT COUNT(*) FROM users WHERE blocked = 0')->fetchColumn();
$stats['blockedUsers']  = (int) $pdo->query('SELECT COUNT(*) FROM users WHERE blocked = 1')->fetchColumn();
$stats['totalTasks']    = (int) $pdo->query('SELECT COUNT(*) FROM tasks')->fetchColumn();
$stats['completedTasks']= (int) $pdo->query("SELECT COUNT(*) FROM tasks WHERE status='completed'")->fetchColumn();
$stats['focusSessions'] = (int) $pdo->query('SELECT COUNT(*) FROM focus_sessions WHERE completed = 1')->fetchColumn();
$stats['totalQuotes']   = (int) $pdo->query('SELECT COUNT(*) FROM quotes')->fetchColumn();

// Activity logs (last 200 entries) joined with user info
$logStmt = $pdo->query(
    'SELECT al.id, al.user_id, al.action, al.details, al.created_at,
            u.email, u.first_name, u.last_name
     FROM activity_log al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC
     LIMIT 200'
);
$logs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

ok(['stats' => $stats, 'logs' => $logs]);
