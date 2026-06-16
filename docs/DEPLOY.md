# Deployment

This project is meant to run on a basic cPanel hosting account with Apache and PHP.

## What To Upload

Upload the contents of `public/` into your site's `public_html` folder.

```text
public/
├── index.html
├── .htaccess
├── log.php
├── css/
├── js/
├── assets/
└── logs/
```

Do not upload the whole repository unless you specifically want the tools and generated QR files on the server. The public site only needs the files inside `public/`.

## Friendly URLs

The `public/.htaccess` file sends routes like `/en/test-en` and `/pt/test-pt` to `index.html`. JavaScript reads the URL and chooses the right guest and language.

Make sure `.htaccess` files are visible when uploading. Some file managers hide dotfiles by default.

## Logs

Visits are written to:

```text
public/logs/access-log.txt
```

The file is created automatically by `log.php`. Keep `public/logs/.htaccess` in place so the log cannot be opened directly in a browser.

## Quick Smoke Test

After uploading, open:

- `/en/test-en`
- `/pt/test-pt`

Then check that the page loads, the images appear, and the log file is created in `public/logs/`.
