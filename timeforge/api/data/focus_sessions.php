<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->prepare('SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY created_at DESC');
    $rows->execute([$uid]);
    ok(array_map(fn($r) => [
        'id'        => $r['id'],
        'userId'    => (int)$r['user_id'],
        'taskId'    => $r['task_id'],
        'startTime' => $r['start_time'],
        'endTime'   => $r['end_time'],
        'duration'  => (int)$r['duration'],
        'type'      => $r['type'],
        'completed' => (bool)$r['completed'],
        'createdAt' => $r['created_at'],
    ], $rows->fetchAll()));

} elseif ($method === 'POST') {
    $d = body();
    $pdo->prepare('INSERT INTO focus_sessions (id,user_id,task_id,start_time,end_time,duration,type,completed) VALUES (?,?,?,?,?,?,?,?)')
        ->execute([$d['id'],$uid,$d['taskId']??null,$d['startTime']??null,$d['endTime']??null,(int)($d['duration']??0),$d['type']??'work',(int)(bool)($d['completed']??false)]);
    ok($d);
}
