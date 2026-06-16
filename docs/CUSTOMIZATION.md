# Customization

The demo data is intentionally generic. Use this guide when adapting the project for a real event.

## Add A Guest Route

Most URLs work automatically. A route like this:

```text
/en/example-guest
```

becomes:

```text
Dear Example Guest,
```

For Portuguese, use `/pt/`:

```text
/pt/pessoa-teste
```

## Add A Custom Message

Edit `public/js/site-config.js` and add a key under `guests`.

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

## Add A Splash Photo

Put the image in `public/assets/guests/`, then add a `splash` block.

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

## Add QR Codes

Edit `data/qr-recipients.csv`.

```csv
filename_label,name,url,message
example_guest_en,Example Guest,,
pessoa_teste_pt,Pessoa Teste,,
```

Then run:

```bash
npm run qr
```

Blank `url` and `message` values use the default URL and label style. Fill those columns only when a guest needs something special.

## Keep Public Demo Data Generic

If this repository is public, avoid committing real names, private photos, phone numbers, addresses, registry links, or event details. Keep those changes in a private copy or private branch.
