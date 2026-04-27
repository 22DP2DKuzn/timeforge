<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$body = body();

if ($method === 'GET') {
    $rows = $pdo->prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY date ASC, time ASC');
    $rows->execute([$uid]);
    ok(array_map('mapTask', $rows->fetchAll()));

} elseif ($method === 'POST') {
    $d = $body;
    $pdo->prepare('INSERT INTO tasks (id,user_id,project_id,name,description,date,time,duration,priority,category,status,type,location,completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$d['id'],$uid,$d['projectId']??null,$d['name'],$d['description']??'',$d['date']??null,$d['time']??'09:00',(int)($d['duration']??30),$d['priority']??'medium',$d['category']??'other',$d['status']??'planned',$d['type']??'task',$d['location']??'',$d['completedAt']??null]);
    ok($d);

} elseif ($method === 'PUT') {
    $d = $body;
    $pdo->prepare('UPDATE tasks SET project_id=?,name=?,description=?,date=?,time=?,duration=?,priority=?,category=?,status=?,type=?,location=?,completed_at=? WHERE id=? AND user_id=?')
        ->execute([$d['projectId']??null,$d['name'],$d['description']??'',$d['date']??null,$d['time']??'09:00',(int)($d['duration']??30),$d['priority']??'medium',$d['category']??'other',$d['status']??'planned',$d['type']??'task',$d['location']??'',$d['completedAt']??null,$d['id'],$uid]);
    ok($d);

} elseif ($method === 'DELETE') {
    $id = $body['id'] ?? $_GET['id'] ?? '';
    $pdo->prepare('DELETE FROM tasks WHERE id=? AND user_id=?')->execute([$id, $uid]);
    ok(null);
}

function mapTask($r) {
    return [
        'id'          => $r['id'],
        'userId'      => (int)$r['user_id'],
        'projectId'   => $r['project_id'],
        'name'        => $r['name'],
        'description' => $r['description'],
        'date'        => $r['date'],
        'time'        => $r['time'],
        'duration'    => (int)$r['duration'],
        'priority'    => $r['priority'],
        'category'    => $r['category'],
        'status'      => $r['status'],
        'type'        => $r['type'],
        'location'    => $r['location'],
        'completedAt' => $r['completed_at'],
        'createdAt'   => $r['created_at'],
    ];
}
