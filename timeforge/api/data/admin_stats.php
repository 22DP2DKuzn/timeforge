<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();

// Admin only
$me = $pdo->prepare('SELECT role FROM users WHERE id=?');
$me->execute([$uid]);
if ($me->fetchColumn() !== 'admin') { fail('Forbidden', 403); exit; }

function safeCount($pdo, $sql) {
    try { return (int) $pdo->query($sql)->fetchColumn(); } catch (Exception $e) { return 0; }
}

// Aggregate stats
$stats = [];
$stats['totalUsers']        = safeCount($pdo, 'SELECT COUNT(*) FROM users');
$stats['activeUsers']       = safeCount($pdo, 'SELECT COUNT(*) FROM users WHERE blocked = 0');
$stats['blockedUsers']      = safeCount($pdo, 'SELECT COUNT(*) FROM users WHERE blocked = 1');
$stats['totalTasks']        = safeCount($pdo, 'SELECT COUNT(*) FROM tasks');
$stats['completedTasks']    = safeCount($pdo, "SELECT COUNT(*) FROM tasks WHERE status='completed'");
$stats['focusSessions']     = safeCount($pdo, 'SELECT COUNT(*) FROM focus_sessions WHERE completed = 1');
$stats['totalQuotes']       = safeCount($pdo, 'SELECT COUNT(*) FROM quotes');
$stats['totalProjects']     = safeCount($pdo, 'SELECT COUNT(*) FROM projects');
$stats['totalAchievements'] = safeCount($pdo, 'SELECT COUNT(*) FROM user_achievements');
$stats['totalLogEntries']   = safeCount($pdo, 'SELECT COUNT(*) FROM activity_log');

// Per-action breakdown
$actionBreakdown = [];
try {
    $abStmt = $pdo->query(
        "SELECT action, COUNT(*) as cnt FROM activity_log GROUP BY action ORDER BY cnt DESC LIMIT 20"
    );
    foreach ($abStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $actionBreakdown[$row['action']] = (int)$row['cnt'];
    }
} catch (Exception $e) {}
$stats['actionBreakdown'] = $actionBreakdown;

// Activity logs (last 500 entries) joined with user info
$logs = [];
try {
    $logStmt = $pdo->query(
        'SELECT al.id, al.user_id, al.action, al.details, al.created_at,
                u.email, u.first_name, u.last_name
         FROM activity_log al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT 500'
    );
    $logs = $logStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {}

ok(['stats' => $stats, 'logs' => $logs]);
