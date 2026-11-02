# Chrome Web Store listing

## Name

Copy Page as Markdown

## Summary

Copy any page to your clipboard as Markdown, ready to paste into an LLM. Runs locally.

## Category

Developer Tools

## Description

Not every site has a "copy to Markdown" button. This extension gives you one on every page.

Click the toolbar icon or press Alt+Shift+M, and the page you are on is copied to your clipboard as Markdown, ready to paste into ChatGPT, Claude, Gemini, or any other LLM.

- Copies the whole rendered page, including JavaScript-rendered and logged-in pages
- Includes text inside collapsed sections, hidden menus, and dialogs
- Adds the page title and source URL, and keeps links and images
- Keeps tables as HTML so their rows and columns survive
- Replaces base64 images with their alt text
- Tells you when iframes, shadow DOM sections, or embedded images were left out

Everything runs in your browser. There are no accounts, settings, analytics, or network requests, and the source is open at https://github.com/usetemi/copy-page-as-markdown.

## Single purpose

Copy the current page to the clipboard as Markdown when the user clicks the toolbar icon or presses the keyboard shortcut.

## Permission justifications

- **activeTab:** read the page the user is on, only when they click the icon or press the shortcut.
- **scripting:** run the HTML-to-Markdown conversion in that tab.
- **offscreen:** write to the clipboard from an extension document, which works whatever the page's focus, security context, or permissions policy.
- **clipboardWrite:** place the converted Markdown on the clipboard.

## Remote code

No. All code is bundled in the package.

## Data usage

The extension collects no user data. None of the data categories apply.

## Privacy policy URL

https://github.com/usetemi/copy-page-as-markdown/blob/main/PRIVACY.md

## Support URL

https://github.com/usetemi/copy-page-as-markdown/issues

## Images

- Screenshot, 1280x800: `store/screenshot.png`
- Small promo tile, 440x280: `store/promo-tile.png`
- Store icon, 128x128: `icons/icon128.png`
