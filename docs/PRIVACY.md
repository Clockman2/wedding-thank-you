# Privacy And Logging

The site includes lightweight visit logging through `public/log.php`.

Logged values can include:

- URL path and query string
- Guest slug and language
- Referrer
- Browser language and user agent
- Viewport and screen size
- IP address, as seen by the server
- Basic interaction events, such as page view, story click, and page exit

The log is written to:

```text
public/logs/access-log.txt
```

Keep `public/logs/.htaccess` in place so the log file is not readable through a browser.

If you do not want logging, remove the `track(...)` calls in `public/js/app.js` and remove `public/log.php` from the deployed site.

For real deployments, tell guests if you are collecting visit logs.
