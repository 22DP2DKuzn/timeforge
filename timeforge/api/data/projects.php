<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$body = body();

if ($method === 'GET') {
    $rows = $pdo->prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC');
    $rows->execute([$uid]);
    ok(array_map('mapProject', $rows->fetchAll()));

} elseif ($method === 'POST') {
    $d = $body;
    $pdo->prepare('INSERT INTO projects (id,user_id,name,description,start_date,end_date,color,icon,status) VALUES (?,?,?,?,?,?,?,?,?)')
        ->execute([$d['id'],$uid,$d['name'],$d['description']??'',$d['startDate']??null,$d['endDate']??null,$d['color']??'#5641FF',$d['icon']??'📁',$d['status']??'active']);
    ok($d);

} elseif ($method === 'PUT') {
    $d = $body;
    $pdo->prepare('UPDATE projects SET name=?,description=?,start_date=?,end_date=?,color=?,icon=?,status=? WHERE id=? AND user_id=?')
        ->execute([$d['name'],$d['description']??'',$d['startDate']??null,$d['endDate']??null,$d['color'],$d['icon'],$d['status'],$d['id'],$uid]);
    ok($d);

} elseif ($method === 'DELETE') {
    $id = $body['id'] ?? $_GET['id'] ?? '';
    $pdo->prepare('DELETE FROM projects WHERE id=? AND user_id=?')->execute([$id, $uid]);
    $pdo->prepare('DELETE FROM tasks WHERE project_id=? AND user_id=?')->execute([$id, $uid]);
    ok(null);
}

function mapProject($r) {
    return [
        'id'          => $r['id'],
        'userId'      => (int)$r['user_id'],
        'name'        => $r['name'],
        'description' => $r['description'],
        'startDate'   => $r['start_date'],
        'endDate'     => $r['end_date'],
        'color'       => $r['color'],
        'icon'        => $r['icon'],
        'status'      => $r['status'],
        'createdAt'   => $r['created_at'],
    ];
}
