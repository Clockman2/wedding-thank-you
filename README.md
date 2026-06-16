# Wedding Thank-You Site

A small cPanel-friendly thank-you site with personalized URLs.

The public demo data is intentionally generic. It includes one English test route and one Brazilian Portuguese test route:

- `/en/test-en`
- `/pt/test-pt`

The page reads the last part of the URL, turns it into a guest label, and swaps in the right language copy. A guest can also have a small splash photo before the note.

## Project Layout

```text
wedding-thank-you/
├── public/              # Files to upload to cPanel public_html
│   ├── index.html
│   ├── .htaccess
│   ├── log.php
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── logs/
├── data/                # Input data for local tools
├── generated/           # Tool output, such as QR code PNGs
├── tools/               # Local development and generation scripts
├── README.md
├── LICENSE
└── requirements.txt
```

## Local Preview

```bash
npm run dev
```

Then open:

- `http://127.0.0.1:4173/en/test-en`
- `http://127.0.0.1:4173/pt/test-pt`

The local server uses `public/` as the web root and handles `/log.php`, so logging can be tested without PHP.

## Display Controls

The page includes two small display controls:

- Theme: switches between light and dark mode.
- Motion: switches between no motion, default motion, and super fun mode.

Preferences are saved in the browser with `localStorage`.

## Useful Commands

```bash
npm run dev
npm run check
npm run qr
```

`npm run check` validates the JavaScript files. `npm run qr` rebuilds the QR code PNGs from `data/qr-recipients.csv`.

## Guest Messages

Most routes work without being added anywhere. For example:

- `/en/example-guest` becomes `Dear Example Guest,`
- `/pt/pessoa-teste` becomes `Olá, Pessoa Teste,`

Use `public/js/site-config.js` for guests who need a custom greeting, message, signature, or splash photo.

```js
"example-guest": {
  en: {
    greeting: "Dear Example Guest,",
    message: "Thanks for celebrating with us.",
    signature: "With gratitude, the hosts"
  }
}
```

For Brazilian Portuguese, use a `pt` block:

```js
"pessoa-teste": {
  pt: {
    greeting: "Olá, Pessoa Teste,",
    message: "Obrigado por celebrar conosco.",
    signature: "Com gratidão, os anfitriões"
  }
}
```

## Splash Photos

Site-ready images live in `public/assets/`. Guest splash photos live in `public/assets/guests/`.

```js
"example-guest": {
  splash: {
    image: "/assets/guests/example-guest.jpg",
    rotation: "1.25deg",
    en: {
      kicker: "A favorite memory",
      title: "Glad you are here, Example Guest",
      caption: "A short caption for the photo.",
      alt: "Description of the photo"
    }
  }
}
```

The splash text is language-specific. Add `en`, `pt`, or both.

For a public demo repository, keep images generic and remove private EXIF metadata before committing.

## QR Codes

Guest QR cards are generated from `data/qr-recipients.csv`.

```csv
filename_label,name,url,message
example_guest_en,Example Guest,,
pessoa_teste_pt,Pessoa Teste,,
```

Then run:

```bash
python3 -m pip install -r requirements.txt
npm run qr
```

The PNGs are written to `generated/qr-codes/`. Blank `url` and `message` columns use the default URL and this label:

```text
Scan me!
Test EN
```

## Upload

For cPanel, upload the contents of `public/` into `public_html`.

The Apache rewrite rules in `public/.htaccess` let friendly URLs like `/en/test-en` load the same page. JavaScript handles the language and guest name after that.

Make sure `.htaccess` files are visible when uploading. Some file managers hide dotfiles by default.

## Logs And Privacy

The live site writes lightweight visit events to `public/logs/access-log.txt`.

Logged values can include:

- URL path and query string
- Guest slug and language
- Referrer
- Browser language and user agent
- Viewport and screen size
- IP address, as seen by the server
- Basic interaction events, such as page view, story click, and page exit

Keep `public/logs/.htaccess` in the repo because it blocks direct browser access to the log on cPanel.

If you do not want logging, remove the `track(...)` calls in `public/js/app.js` and remove `public/log.php` from the deployed site.

For real deployments, tell guests if you are collecting visit logs.

## Changelog

### Unreleased

- Keep project documentation consolidated in `README.md`.

### 1.0.0

- Publish a generic demo version with English and Brazilian Portuguese routes.
- Organize deployable files under `public/`.
- Include QR code generation from CSV input.
