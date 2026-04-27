<?php
require_once __DIR__ . '/../data/base.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

$body     = body();
$messages = $body['messages'] ?? [];
$context  = $body['context']  ?? [];
$pet      = $body['pet']      ?? [];

if (!is_array($messages) || count($messages) === 0) {
    fail('Missing messages');
}

// ── API key: env var OR local config file ──────────────────────────────────
$localConfig = __DIR__ . '/../config.local.php';
if (is_file($localConfig)) @include_once $localConfig;

$apiKey = getenv('GEMINI_API_KEY')
    ?: ($_SERVER['GEMINI_API_KEY'] ?? '')
    ?: ($_ENV['GEMINI_API_KEY']    ?? '')
    ?: (defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '');

if (!$apiKey) {
    fail('GEMINI_API_KEY not set. Create timeforge/api/config.local.php with: define("GEMINI_API_KEY","YOUR_KEY"); Free key: aistudio.google.com', 500);
}

// ── Build system prompt ────────────────────────────────────────────────────
$petName  = trim((string)($pet['name']  ?? 'Nova'));
$petType  = trim((string)($pet['type']  ?? 'fox'));
$petStyle = trim((string)($pet['style'] ?? 'quick, witty, practical'));
$page     = trim((string)($context['page']     ?? 'app'));
$language = trim((string)($context['language'] ?? 'lv'));
$ctxJson  = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';

$system = "You are {$petName}, a friendly AI productivity assistant running inside the TimeForge web app as an animated pet character.
Personality: {$petStyle}. Be warm, short, practical — like a helpful companion.
Current page: {$page}. Language: {$language}. User data: {$ctxJson}.
Rules: answer in Latvian if language=lv, else English. Max 3-4 sentences unless user asks more. No markdown. No code blocks.";

// ── Build Gemini contents array ────────────────────────────────────────────
$contents = [];

// Add system turn first as a user/model pair (Gemini doesn't have system role)
$contents[] = ['role' => 'user',  'parts' => [['text' => $system]]];
$contents[] = ['role' => 'model', 'parts' => [['text' => "Sapratu! Es esmu {$petName} un esmu gatavs palīdzēt."]]];

foreach (array_slice($messages, -10) as $msg) {
    $role = ($msg['role'] ?? '') === 'assistant' ? 'model' : 'user';
    $text = trim((string)($msg['text'] ?? ''));
    if ($text === '') continue;
    $contents[] = ['role' => $role, 'parts' => [['text' => $text]]];
}

// Must end with user role for Gemini
if (empty($contents) || $contents[count($contents)-1]['role'] !== 'user') {
    fail('Conversation must end with a user message');
}

$payload = json_encode([
    'contents'         => $contents,
    'generationConfig' => [
        'maxOutputTokens' => 300,
        'temperature'     => 0.75,
        'thinkingConfig'  => ['thinkingBudget' => 0],
    ],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($payload === false) fail('Failed to encode payload', 500);

// ── Call Gemini 2.5 Flash Lite (free tier) ────────────────────────────────
$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' . urlencode($apiKey);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_TIMEOUT        => 30,
]);

$raw     = curl_exec($ch);
$status  = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($raw === false || $curlErr) fail('Request failed: ' . $curlErr, 502);

$json = json_decode($raw, true);
if (!is_array($json)) fail('Invalid response from Gemini', 502);

if ($status >= 400) {
    $msg = $json['error']['message'] ?? 'Gemini API error';
    fail($msg, 502);
}

// Extract reply text
$reply = '';
foreach (($json['candidates'][0]['content']['parts'] ?? []) as $part) {
    if (!empty($part['text'])) $reply .= $part['text'];
}
$reply = trim($reply);

if ($reply === '') fail('Empty response from Gemini', 502);

ok(['reply' => $reply, 'model' => 'gemini-2.5-flash-lite']);
