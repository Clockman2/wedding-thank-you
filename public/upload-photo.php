<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$pendingUploadDir = __DIR__ . '/uploads/pending-photos';
$approvedUploadUrlBase = '/uploads/guest-photos';
$pendingUploadUrlBase = '/uploads/pending-photos';
$logDir = __DIR__ . '/logs';
$uploadLog = $logDir . '/uploads.jsonl';
$pendingUploadLog = $logDir . '/pending-uploads.jsonl';
$maxBytes = 8 * 1024 * 1024;
$allowedTypes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

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

function read_uploaded_photos(string $file): array {
    if (!is_file($file)) {
        return [];
    }

    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return [];
    }

    $photos = [];

    foreach (array_reverse($lines) as $line) {
        $photo = json_decode($line, true);
        if (is_array($photo) && isset($photo['url'])) {
            $photos[] = [
                'url' => clean_text($photo['url'], 240),
                'name' => clean_text($photo['name'] ?? '', 80),
                'server_time' => clean_text($photo['server_time'] ?? '', 40),
            ];
        }

        if (count($photos) >= 24) {
            break;
        }
    }

    return $photos;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    send_json(200, [
        'ok' => true,
        'photos' => read_uploaded_photos($uploadLog),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['ok' => false, 'error' => 'GET or POST only']);
}

if (!isset($_FILES['photo']) || !is_array($_FILES['photo'])) {
    send_json(400, ['ok' => false, 'error' => 'Photo is required']);
}

$photo = $_FILES['photo'];

if (($photo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    send_json(400, ['ok' => false, 'error' => 'Upload failed']);
}

if (($photo['size'] ?? 0) <= 0 || ($photo['size'] ?? 0) > $maxBytes) {
    send_json(400, ['ok' => false, 'error' => 'Photo is too large']);
}

$tmpName = $photo['tmp_name'] ?? '';
$imageInfo = @getimagesize($tmpName);

if ($imageInfo === false) {
    send_json(400, ['ok' => false, 'error' => 'File is not an image']);
}

$mimeType = $imageInfo['mime'] ?? '';
$extension = $allowedTypes[$mimeType] ?? '';

if ($extension === '') {
    send_json(400, ['ok' => false, 'error' => 'Unsupported image type']);
}

if (!is_dir($pendingUploadDir) && !mkdir($pendingUploadDir, 0755, true)) {
    send_json(500, ['ok' => false, 'error' => 'Could not create upload directory']);
}

if (!is_dir($logDir) && !mkdir($logDir, 0755, true)) {
    send_json(500, ['ok' => false, 'error' => 'Could not create log directory']);
}

$fileName = gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
$destination = $pendingUploadDir . '/' . $fileName;

if (!move_uploaded_file($tmpName, $destination)) {
    send_json(500, ['ok' => false, 'error' => 'Could not save photo']);
}

$entry = [
    'server_time' => gmdate('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'guest_key' => clean_text($_POST['guest_key'] ?? 'default', 120),
    'language' => clean_text($_POST['language'] ?? '', 20),
    'name' => clean_text($_POST['name'] ?? '', 80),
    'file' => $fileName,
    'url' => $approvedUploadUrlBase . '/' . $fileName,
    'pending_url' => $pendingUploadUrlBase . '/' . $fileName,
    'size' => (int) $photo['size'],
    'mime' => $mimeType,
];

$line = json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;

if (file_put_contents($pendingUploadLog, $line, FILE_APPEND | LOCK_EX) === false) {
    send_json(500, ['ok' => false, 'error' => 'Could not write upload log']);
}

send_json(200, [
    'ok' => true,
    'pending' => true,
    'file' => $fileName,
    'url' => $entry['pending_url'],
    'approved_url' => $entry['url'],
    'review_file' => 'logs/pending-uploads.jsonl',
    'review_folder' => 'uploads/pending-photos',
    'photos' => read_uploaded_photos($uploadLog),
]);
