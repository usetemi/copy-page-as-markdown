# Copy Page as Markdown

A Chrome extension that copies the page you are on to your clipboard as
Markdown, ready to paste into an LLM. Not every site has a "copy to Markdown"
button; this gives you one everywhere.

Click the toolbar icon or press `Alt+Shift+M`. The badge shows a check when the
copy worked and an X when it did not. Change the shortcut at
`chrome://extensions/shortcuts`.

## Output

```markdown
# Page title

Source: https://example.com/page

Page content, with absolute link and image URLs.

> Note: omitted 2 iframes, 1 shadow DOM section, 3 embedded images.
```

The extension converts the whole rendered page, so it works on JavaScript-heavy
and logged-in pages.

- Only `script`, `style`, and `noscript` are removed. Navigation, footers,
  collapsed sections, and hidden menus and dialogs stay, so text behind a
  collapsible is copied too.
- A text selection is ignored.
- Tables stay as HTML with only `href`, `src`, `alt`, `colspan`, and `rowspan`
  attributes, because converting them with Turndown's defaults loses their rows
  and columns. A site that uses tables for layout, such as Hacker News, comes
  out mostly as HTML.
- Images embedded as `data:` URIs are replaced by their alt text.
- The closing note appears only when something was left out: iframes, open
  shadow DOM sections, or embedded images.

## Limits

- Content that a page only loads when you open or scroll to it is not in the
  page yet, so it is not copied.
- Closed shadow roots cannot be detected, so the note does not count them.
- Chrome does not allow extensions on `chrome://` pages or the Chrome Web Store,
  so those show the X.

## Privacy

Conversion runs entirely in your browser. The extension makes no network
requests of its own and has no accounts or telemetry. See
[PRIVACY.md](PRIVACY.md).

## Install from source

```sh
npm ci
npm run build
```

Open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**,
and select `dist/`.

## Develop

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

The end-to-end tests load the built extension in Chromium, trigger its toolbar
action, and read the real clipboard.

## Release

Set the version in `manifest.json`, then push a matching tag such as `v0.1.0`.
CI runs the tests and attaches `copy-page-as-markdown.zip` to a GitHub release.
Upload that zip in the Chrome Web Store developer dashboard. `store/` holds the
listing text and images.

## License

[MIT](LICENSE). From [Temi](https://usetemi.com).
