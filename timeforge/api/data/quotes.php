<?php
require_once __DIR__ . '/base.php';
require_once dirname(__DIR__) . '/config.php';

$uid = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$body = body();

function mapQuote($r) {
    return ['id'=>$r['id'],'textLv'=>$r['text_lv'],'textEn'=>$r['text_en'],'author'=>$r['author'],'active'=>(bool)$r['active']];
}

if ($method === 'GET') {
    $quotes = $pdo->query('SELECT * FROM quotes ORDER BY created_at ASC')->fetchAll();

    // seed defaults if empty
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
        $stmt = $pdo->prepare('INSERT INTO quotes (id,text_lv,text_en,author) VALUES (?,?,?,?)');
        foreach ($defaults as $q) {
            $id = substr(md5(uniqid()), 0, 12);
            $stmt->execute([$id, $q['textLv'], $q['textEn'], $q['author']]);
        }
        $quotes = $pdo->query('SELECT * FROM quotes ORDER BY created_at ASC')->fetchAll();
    }

    // favorites for this user
    $favRows = $pdo->prepare('SELECT quote_id FROM favorite_quotes WHERE user_id=?');
    $favRows->execute([$uid]);
    $favs = $favRows->fetchAll(PDO::FETCH_COLUMN);

    ok(['quotes' => array_map('mapQuote', $quotes), 'favorites' => $favs]);

} elseif ($method === 'POST') {
    $d = $body;
    if (!empty($d['toggleFavorite'])) {
        // toggle favorite
        $qid = $d['quoteId'];
        $check = $pdo->prepare('SELECT 1 FROM favorite_quotes WHERE user_id=? AND quote_id=?');
        $check->execute([$uid, $qid]);
        if ($check->fetch()) {
            $pdo->prepare('DELETE FROM favorite_quotes WHERE user_id=? AND quote_id=?')->execute([$uid, $qid]);
            ok(['added' => false]);
        } else {
            $pdo->prepare('INSERT INTO favorite_quotes (user_id,quote_id) VALUES (?,?)')->execute([$uid, $qid]);
            ok(['added' => true]);
        }
    } else {
        $pdo->prepare('INSERT INTO quotes (id,text_lv,text_en,author) VALUES (?,?,?,?)')
            ->execute([$d['id'],$d['textLv'],$d['textEn'],$d['author']??'']);
        ok(mapQuote(['id'=>$d['id'],'text_lv'=>$d['textLv'],'text_en'=>$d['textEn'],'author'=>$d['author']??'','active'=>1]));
    }

} elseif ($method === 'PUT') {
    $d = $body;
    $pdo->prepare('UPDATE quotes SET text_lv=?,text_en=?,author=?,active=? WHERE id=?')
        ->execute([$d['textLv'],$d['textEn'],$d['author']??'',(int)($d['active']??1),$d['id']]);
    ok($d);

} elseif ($method === 'DELETE') {
    $id = $body['id'] ?? $_GET['id'] ?? '';
    $pdo->prepare('DELETE FROM quotes WHERE id=?')->execute([$id]);
    ok(null);
}
