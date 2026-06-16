<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST only']);
    exit;
}

$rawInput = file_get_contents('php://input');

if ($rawInput === false || strlen($rawInput) > 32768) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid request size']);
    exit;
}

$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

function clean_value($value) {
    if (is_bool($value) || is_int($value) || is_float($value) || $value === null) {
        return $value;
    }

    if (is_array($value)) {
        return '[array]';
    }

    $text = (string) $value;
    $text = preg_replace('/[\r\n\t]+/', ' ', $text);
    $text = trim($text);

    return substr($text, 0, 500);
}

$event = [];

foreach ($payload as $key => $value) {
    $cleanKey = preg_replace('/[^a-zA-Z0-9_:-]/', '_', (string) $key);
    $event[$cleanKey] = clean_value($value);
}

$event = array_merge([
    'server_time' => gmdate('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'x_forwarded_for' => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
], $event);

$logDir = __DIR__ . '/logs';
$logFile = $logDir . '/access-log.txt';

if (!is_dir($logDir) && !mkdir($logDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not create log directory']);
    exit;
}

$lineParts = [];

foreach ($event as $key => $value) {
    $encodedValue = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
    $lineParts[] = $key . '=' . json_encode($encodedValue, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

$line = implode(' | ', $lineParts) . PHP_EOL;

if (file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not write log']);
    exit;
}

echo json_encode(['ok' => true]);
