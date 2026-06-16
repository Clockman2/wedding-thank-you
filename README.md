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

## Guest Messages

Most routes work without being added anywhere. For example:

- `/en/example-guest` becomes `Dear Example Guest,`
- `/pt/pessoa-teste` becomes `Olá, Pessoa Teste,`

Use `public/js/site-config.js` for guests who need a custom greeting, message, signature, or splash photo.

```js
"test-en": {
  en: {
    greeting: "Dear Test EN,"
  },
  splash: {
    image: "/assets/guests/test-en.jpg",
    rotation: "1.35deg",
    en: {
      kicker: "Test photo",
      title: "Glad you are here, Test EN",
      caption: "A simple demo splash photo.",
      alt: "Demo guest photo for the English test route"
    }
  }
}
```

## Photos

Site-ready images live in `public/assets/`. The demo guest splash images are:

- `public/assets/guests/test-en.jpg`
- `public/assets/guests/test-pt.jpg`

## Useful Commands

```bash
npm run dev
npm run check
npm run qr
```

`npm run check` validates the JavaScript files. `npm run qr` rebuilds the QR code PNGs from `data/qr-recipients.csv`.

## QR Codes

Guest QR cards are generated from `data/qr-recipients.csv`.

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

See [docs/DEPLOY.md](docs/DEPLOY.md) for a short cPanel upload checklist.

## Logs

The live site writes lightweight visit events to `public/logs/access-log.txt`.

That file is ignored by Git. Keep `public/logs/.htaccess` in the repo because it blocks direct browser access to the log on cPanel.
