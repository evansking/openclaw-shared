---
name: kindle
description: Send articles to Kindle. Default action when user texts a bare article URL.
---

# Send to Kindle

Fetch a web article, clean it up, and email it to your Kindle as a readable HTML document.

**CLI:** `send-to-kindle <url>`

**Always uses Playwright headed** (real visible Chromium window, not headless). This is the right tool for this job — don't use `web_fetch` or `openclaw browser` for Kindle sends.

## Setup

Create `~/.openclaw/.env` with:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-app-password
KINDLE_EMAIL=you_abc123@kindle.com
```

## When to use

- **User texts a bare URL with no other context** — assume they want it sent to Kindle
- User says "send to kindle", "read later", "kindle this", etc.
- Any article/blog link

Do NOT use for non-article URLs (e.g. YouTube videos, Google Maps links, app store links, shopping pages).

## How to use

```bash
send-to-kindle "https://example.com/some-article"
```

The script launches a visible Chromium window, loads the page like a real user, auto-dismisses cookie banners, extracts the article with readability, and emails it as a clean HTML attachment.

## If the script fails

If it exits with BLOCKED, the site beat Playwright's Chromium. Recover manually:

1. Open the page in openclaw browser (real system Chrome — harder to block):
```bash
openclaw browser open "<url>"
openclaw browser wait --load-state networkidle
```

2. Grab the content:
```bash
openclaw browser snapshot
# Find the article element ref, then:
openclaw browser evaluate --fn '(el) => el.innerHTML' --ref <ref>
```

3. Email it to Kindle — load SMTP creds from `~/.openclaw/.env` and send as `.html` attachment.

4. Close the tab:
```bash
openclaw browser close <tab-id>
```

**Don't give up just because the script errored.**

## Reply

- "Sent 'The Future of AI' to your Kindle."
- If it fails and you recovered manually, same confirmation.
- If it truly can't be fetched (hard paywall requiring login, etc.), tell user why.

## Notes

- Config (SMTP credentials, Kindle email) is in `~/.openclaw/.env`
- Strips ads, nav, scripts, and junk before sending
- Sends as `.html` attachment so Kindle preserves formatting
