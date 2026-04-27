<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();

// Projects
$stmt = $pdo->prepare('SELECT * FROM projects WHERE user_id=? ORDER BY created_at DESC');
$stmt->execute([$uid]);
$projects = array_map(fn($r) => ['id'=>$r['id'],'userId'=>(int)$r['user_id'],'name'=>$r['name'],'description'=>$r['description'],'startDate'=>$r['start_date'],'endDate'=>$r['end_date'],'color'=>$r['color'],'icon'=>$r['icon'],'status'=>$r['status'],'createdAt'=>$r['created_at']], $stmt->fetchAll());

// Tasks
$stmt = $pdo->prepare('SELECT * FROM tasks WHERE user_id=? ORDER BY date ASC');
$stmt->execute([$uid]);
$tasks = array_map(fn($r) => ['id'=>$r['id'],'userId'=>(int)$r['user_id'],'projectId'=>$r['project_id'],'name'=>$r['name'],'description'=>$r['description'],'date'=>$r['date'],'time'=>$r['time'],'duration'=>(int)$r['duration'],'priority'=>$r['priority'],'category'=>$r['category'],'status'=>$r['status'],'type'=>$r['type'],'location'=>$r['location'],'completedAt'=>$r['completed_at'],'createdAt'=>$r['created_at']], $stmt->fetchAll());

// Focus sessions
$stmt = $pdo->prepare('SELECT * FROM focus_sessions WHERE user_id=? ORDER BY created_at DESC');
$stmt->execute([$uid]);
$focusSessions = array_map(fn($r) => ['id'=>$r['id'],'userId'=>(int)$r['user_id'],'taskId'=>$r['task_id'],'startTime'=>$r['start_time'],'endTime'=>$r['end_time'],'duration'=>(int)$r['duration'],'type'=>$r['type'],'completed'=>(bool)$r['completed'],'createdAt'=>$r['created_at']], $stmt->fetchAll());

// Notifications
$stmt = $pdo->prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC');
$stmt->execute([$uid]);
$notifications = array_map(fn($r) => ['id'=>$r['id'],'userId'=>(int)$r['user_id'],'type'=>$r['type'],'title'=>$r['title'],'message'=>$r['message'],'icon'=>$r['icon'],'read'=>(bool)$r['is_read'],'createdAt'=>$r['created_at']], $stmt->fetchAll());

// Quotes (with seed if empty)
$quotes = $pdo->query('SELECT * FROM quotes ORDER BY created_at ASC')->fetchAll();
if (empty($quotes)) {
    $defaults = [
        ['textLv'=>'Laiks, ko tu baudīsi tērēt, nav iztērēts velti.','textEn'=>'Time you enjoy wasting is not wasted time.','author'=>'Marthe Troly-Curtin'],
        ['textLv'=>'Labākais laiks koku stādīt bija pirms 20 gadiem. Nākamais labākais laiks ir tagad.','textEn'=>'The best time to plant a tree was 20 years ago. The next best time is now.','author'=>'Ķīniešu sakāmvārds'],
        ['textLv'=>'Nekad nav par vēlu būt tam, kas tu varēji būt.','textEn'=>'It is never too late to be what you might have been.','author'=>'George Eliot'],
        ['textLv'=>'Veiksmīgi cilvēki dara to, ko neveiksmīgi nevēlas darīt.','textEn'=>'Successful people do what unsuccessful people are not willing to do.','author'=>'Jim Rohn'],
        ['textLv'=>'Fokuss ir par to, lai pateiktu nē.','textEn'=>'Focus is about saying no.','author'=>'Steve Jobs'],
        ['textLv'=>'Tu nevari izlietot radošumu. Jo vairāk lieto, jo vairāk ir.','textEn'=>"You can't use up creativity. The more you use, the more you have.",'author'=>'Maya Angelou'],
        ['textLv'=>'Sāciet tur, kur esat. Izmantojiet to, kas jums ir. Dariet to, ko varat.','textEn'=>'Start where you are. Use what you have. Do what you can.','author'=>'Arthur Ashe'],
        ['textLv'=>'Produktivitāte nav par aizņemtību. Tā ir par prioritātēm.','textEn'=>'Productivity is not about being busy. It is about priorities.','author'=>'Unknown'],
        ['textLv'=>'Katrs liels ceļojums sākas ar vienu soli.','textEn'=>'Every great journey begins with a single step.','author'=>'Lao Tzu'],
        ['textLv'=>'Necenties pavadīt laiku. Centies to investēt.','textEn'=>"Don't try to spend time. Try to invest it.",'author'=>'Unknown'],
    ];
    $ins = $pdo->prepare('INSERT INTO quotes (id,text_lv,text_en,author) VALUES (?,?,?,?)');
    foreach ($defaults as $q) { $ins->execute([substr(md5(uniqid()),0,12),$q['textLv'],$q['textEn'],$q['author']]); }
    $quotes = $pdo->query('SELECT * FROM quotes ORDER BY created_at ASC')->fetchAll();
}
$quotesOut = array_map(fn($r) => ['id'=>$r['id'],'textLv'=>$r['text_lv'],'textEn'=>$r['text_en'],'author'=>$r['author'],'active'=>(bool)$r['active']], $quotes);

// Favorite quotes
$stmt = $pdo->prepare('SELECT quote_id FROM favorite_quotes WHERE user_id=?');
$stmt->execute([$uid]);
$favoriteQuotes = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Achievements
$stmt = $pdo->prepare('SELECT achievement_id FROM user_achievements WHERE user_id=?');
$stmt->execute([$uid]);
$achievements = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Settings
$stmt = $pdo->prepare('SELECT * FROM user_settings WHERE user_id=?');
$stmt->execute([$uid]);
$s = $stmt->fetch() ?: ['email_notifications'=>1,'reminder_24h'=>1,'reminder_1h'=>1];
$settings = ['emailNotifications'=>(bool)$s['email_notifications'],'reminder24h'=>(bool)$s['reminder_24h'],'reminder1h'=>(bool)$s['reminder_1h']];

// Activity log
$stmt = $pdo->prepare('SELECT * FROM activity_log WHERE user_id=? ORDER BY created_at DESC LIMIT 500');
$stmt->execute([$uid]);
$activityLog = array_map(fn($r) => ['id'=>$r['id'],'userId'=>(int)$r['user_id'],'action'=>$r['action'],'details'=>$r['details'],'timestamp'=>$r['created_at']], $stmt->fetchAll());

ok(compact('projects','tasks','focusSessions','notifications','quotesOut','favoriteQuotes','achievements','settings','activityLog'));
