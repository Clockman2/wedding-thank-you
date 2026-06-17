<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$galleryDir = __DIR__ . '/assets/gallery';
$galleryUrlBase = '/assets/gallery';
$uploadLog = __DIR__ . '/logs/uploads.jsonl';
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

function clean_text($value, int $maxLength): string {
    $text = preg_replace('/[\r\n\t]+/', ' ', (string) $value);
    $text = trim((string) $text);
    return substr($text, 0, $maxLength);
}

function caption_from_filename(string $filename): array {
    $name = pathinfo($filename, PATHINFO_FILENAME);
    $text = ucwords(str_replace(['-', '_'], ' ', $name));

    return [
        'en' => $text,
        'pt' => $text,
    ];
}

$photos = [];

if (is_dir($galleryDir)) {
    $files = scandir($galleryDir);

    if (is_array($files)) {
        sort($files, SORT_NATURAL | SORT_FLAG_CASE);

        foreach ($files as $file) {
            $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

            if (!in_array($extension, $allowedExtensions, true)) {
                continue;
            }

            $photos[] = [
                'url' => $galleryUrlBase . '/' . rawurlencode($file),
                'rotation' => count($photos) % 2 === 0 ? '-2.1deg' : '1.8deg',
                'caption' => caption_from_filename($file),
            ];
        }
    }
}

if (is_file($uploadLog)) {
    $lines = file($uploadLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if (is_array($lines)) {
        foreach (array_reverse($lines) as $line) {
            $photo = json_decode($line, true);

            if (!is_array($photo) || empty($photo['url'])) {
                continue;
            }

            $name = clean_text($photo['name'] ?? '', 80);
            $photos[] = [
                'url' => clean_text($photo['url'], 240),
                'rotation' => count($photos) % 2 === 0 ? '-1.7deg' : '2deg',
                'caption' => [
                    'en' => $name ? 'Shared by ' . $name : 'Shared by a guest',
                    'pt' => $name ? 'Enviada por ' . $name : 'Enviada por um convidado',
                ],
            ];
        }
    }
}

echo json_encode([
    'ok' => true,
    'photos' => $photos,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
