# Wedding Thank-You Site

A small cPanel-friendly thank-you site with personalized URLs.

The public demo data is intentionally generic. It includes one English test route and one Brazilian Portuguese test route:

- `/en/test-en`
- `/pt/test-pt`

The page reads the last part of the URL, turns it into a guest label, and swaps in the right language copy. A guest can also have a small splash photo before the note.

## Local Preview

```bash
node server.mjs
```

Then open:

- `http://127.0.0.1:4173/en/test-en`
- `http://127.0.0.1:4173/pt/test-pt`

The local server also handles `/log.php`, so logging can be tested without PHP.

## Guest Messages

Most routes work without being added anywhere. For example:

- `/en/example-guest` becomes `Dear Example Guest,`
- `/pt/pessoa-teste` becomes `Olá, Pessoa Teste,`

Use `guests.js` for guests who need a custom greeting, message, signature, or splash photo.

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

Site-ready images live in `assets/`. The demo guest splash images are:

- `assets/guests/test-en.jpg`
- `assets/guests/test-pt.jpg`

## QR Codes

Guest QR cards are generated from `qr_recipients.csv`.

```bash
python3 -m pip install -r requirements-qr.txt
python3 tools/create_qr_codes.py
```

The PNGs are written to `qr_codes/`. Blank `url` and `message` columns use the default URL and this label:

```text
Scan me!
Test EN
```

## Upload

For cPanel, upload the site files into `public_html`:

- `index.html`
- `styles.css`
- `script.js`
- `guests.js`
- `log.php`
- `.htaccess`
- `assets/`
- `logs/.htaccess`

Apache rewrite rules let friendly URLs like `/en/test-en` load the same page. JavaScript handles the language and guest name after that.

## Logs

The live site writes lightweight visit events to `logs/access-log.txt`.

That file is ignored by Git. Keep `logs/.htaccess` in the repo because it blocks direct browser access to the log on cPanel.
