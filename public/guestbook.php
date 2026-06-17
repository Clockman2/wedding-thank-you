<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$logDir = __DIR__ . '/logs';
$guestbookFile = $logDir . '/guestbook.jsonl';
$pendingGuestbookFile = $logDir . '/pending-guestbook.jsonl';

function send_json(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_text($value, int $maxLength): string {
    $text = preg_replace('/[\r\n\t]+/', ' ', (string) $value);
    $text = trim((string) $text);
    return substr($text, 0, $maxLength);
}

function read_guestbook_entries(string $file): array {
    if (!is_file($file)) {
        return [];
    }

    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return [];
    }

    $entries = [];

    foreach (array_reverse($lines) as $line) {
        $entry = json_decode($line, true);
        if (is_array($entry)) {
            $entries[] = [
                'name' => clean_text($entry['name'] ?? 'Guest', 80),
                'message' => clean_text($entry['message'] ?? '', 900),
                'server_time' => clean_text($entry['server_time'] ?? '', 40),
            ];
        }

        if (count($entries) >= 24) {
            break;
        }
    }

    return $entries;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    send_json(200, [
        'ok' => true,
        'entries' => read_guestbook_entries($guestbookFile),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['ok' => false, 'error' => 'GET or POST only']);
}

$rawInput = file_get_contents('php://input');

if ($rawInput === false || strlen($rawInput) > 16384) {
    send_json(400, ['ok' => false, 'error' => 'Invalid request size']);
}

$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    send_json(400, ['ok' => false, 'error' => 'Invalid JSON']);
}

$name = clean_text($payload['name'] ?? '', 80);
$message = clean_text($payload['message'] ?? '', 900);

if ($name === '' || $message === '') {
    send_json(400, ['ok' => false, 'error' => 'Name and message are required']);
}

if (!is_dir($logDir) && !mkdir($logDir, 0755, true)) {
    send_json(500, ['ok' => false, 'error' => 'Could not create log directory']);
}

$entry = [
    'server_time' => gmdate('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'guest_key' => clean_text($payload['guest_key'] ?? 'default', 120),
    'language' => clean_text($payload['language'] ?? '', 20),
    'name' => $name,
    'message' => $message,
];

$line = json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;

if (file_put_contents($pendingGuestbookFile, $line, FILE_APPEND | LOCK_EX) === false) {
    send_json(500, ['ok' => false, 'error' => 'Could not write guestbook']);
}

send_json(200, [
    'ok' => true,
    'pending' => true,
    'review_file' => 'logs/pending-guestbook.jsonl',
    'entries' => read_guestbook_entries($guestbookFile),
]);
