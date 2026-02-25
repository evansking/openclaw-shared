# OpenClaw Shared

An open-source collection of skills, tools, and an admin dashboard for [OpenClaw](https://openclaw.ai) agents — focused on an iMessage AI assistant that runs on a Mac.

## What This Is

A personal AI assistant that:

- **Reads your iMessages** and auto-classifies them (memory, calendar, reminder, or ignore)
- **Remembers things about your friends** — saves facts to organized markdown files
- **Proposes calendar events and reminders** — asks you to confirm before acting
- **Responds in group chats** on your behalf when you send it in
- **Books restaurants** on Resy and OpenTable
- **Sends articles to your Kindle**
- **Searches your notes** with keyword and semantic search

The classification pipeline uses a **local LLM** (DeepSeek via Ollama) for fast first-pass classification, then **Claude** (via OpenClaw) for verification before taking any action. This keeps costs low while maintaining accuracy.

## Architecture

```
┌──────────────────┐     SSH      ┌──────────────────┐
│   Bot Account    │◄────────────►│ Personal Account │
│   (runs agents)  │              │ (Apple ID/iMsg)  │
│                  │              │                  │
│  OpenClaw GW     │              │  Messages.app    │
│  text-processor  │              │  Contacts        │
│  admin-ui        │              │  imsg CLI        │
│  Ollama          │              │  Calendar        │
└──────────────────┘              └──────────────────┘
```

**Two macOS user accounts on the same Mac:**

- **Bot account** — Runs OpenClaw gateway, all agents, scripts, and daemons. Never logged into an Apple ID.
- **Personal account** — Your real Apple ID. Only used for iMessage, Calendar, and Contacts access. The bot account reaches it via `ssh user@localhost`.

This separation keeps your Apple ID services isolated from the bot runtime.

---

## Prerequisites

### Required

| Dependency | Install | Purpose |
|------------|---------|---------|
| **macOS 14+** | — | Operating system (needs Messages.app) |
| **Two user accounts** | System Settings → Users | Bot account + personal Apple ID account |
| **Node.js 22+** | `brew install node@22` | OpenClaw runtime |
| **Python 3.9+** | Pre-installed on macOS | text-processor, resy, send-to-kindle |
| **OpenClaw** | `npm install -g openclaw` | AI agent gateway, cron, channels |
| **Ollama** | `brew install ollama` | Local LLM server |
| **DeepSeek-R1:8b** | `ollama pull deepseek-r1:8b` | Fast message classification model (~5 GB) |
| **imsg** | `brew install steipete/tap/imsg` | iMessage CLI (read/send/watch) |
| **Anthropic API key** | [console.anthropic.com](https://console.anthropic.com) | Claude access for verification layer |

### Python packages

```bash
pip3 install requests
```

Additional packages for optional tools:

```bash
# For send-to-kindle
pip3 install beautifulsoup4 lxml readability-lxml playwright
python3 -m playwright install chromium

# For the anthropic SDK (if using directly)
pip3 install anthropic
```

### Optional

| Dependency | Install | Purpose |
|------------|---------|---------|
| **BlueBubbles** | [bluebubbles.app](https://bluebubbles.app) | iMessage bridge (alternative to direct imsg) |
| **gogcli** | `brew install gogcli` | Google Calendar/Gmail/Drive API access |
| **Bun** | [bun.sh](https://bun.sh) | Required for qmd (markdown search) |
| **qmd** | `bun install -g qmd` | Local markdown search with semantic mode |

---

## Quick Start

### 1. Clone and add to PATH

```bash
git clone https://github.com/evansking/openclaw-shared.git
export PATH="$PWD/openclaw-shared/tools:$PATH"
# Add to ~/.zshrc to persist
```

### 2. Set up SSH between accounts

Enable Remote Login in System Settings → General → Sharing → Remote Login for both accounts. Then set up passwordless SSH from the bot account:

```bash
# On the bot account
ssh-keygen -t ed25519  # if you don't have a key yet
ssh-copy-id personaluser@localhost
```

Test it:

```bash
ssh personaluser@localhost whoami
# Should print your personal account username
```

### 3. Install core dependencies

```bash
# Homebrew packages
brew install node@22 ollama
brew install steipete/tap/imsg

# Node packages
npm install -g openclaw

# Ollama model
ollama serve &  # Start the server
ollama pull deepseek-r1:8b

# Python packages
pip3 install requests
```

### 4. Grant macOS permissions

On **both accounts**, grant these in System Settings → Privacy & Security:

- **Full Disk Access** → Your terminal app (Terminal.app or iTerm2)
- **Automation** → Allow your terminal to control Messages.app

### 5. Configure OpenClaw

```bash
openclaw init
```

This creates `~/.openclaw/openclaw.json`. Edit it to add your Anthropic API key and configure agents. At minimum you need:

- An API key for Claude
- A `main` agent
- A `worker` agent (used by text-processor for verification)

### 6. Configure text-processor

Create `~/.config/text-processor/config.json`:

```json
{
  "my_number": "+12125551234",
  "bot_identifiers": ["your-bot-email@icloud.com"],
  "signature": "- YourBot (Your Assistant)",
  "assistant_name": "yourbot",
  "channel": "imessage",
  "ssh_target": "personaluser@localhost",
  "imsg_path": "/opt/homebrew/bin/imsg"
}
```

| Key | Description |
|-----|-------------|
| `my_number` | Your phone number (for sending confirmations to yourself) |
| `bot_identifiers` | Email(s) associated with the bot's iMessage account — used to skip processing bot's own messages |
| `signature` | Appended to every message the assistant sends |
| `assistant_name` | Name to detect in group chat mentions (triggers join request flow) |
| `channel` | OpenClaw channel name (`imessage` or `bluebubbles`) |
| `ssh_target` | SSH connection to the account running Messages.app |
| `imsg_path` | Path to the imsg binary on the personal account |

Copy the classifier prompt:

```bash
mkdir -p ~/.config/text-processor
cp tools/classifier-prompt.txt ~/.config/text-processor/
```

### 7. Create a contacts file

The text-processor resolves phone numbers to names using a simple text file:

```
+12125551234|Alice Smith
+13105559876|Bob Jones
```

Save this wherever you configured `contacts_file` (default: `~/contacts.txt`).

### 8. Start services

```bash
# Terminal 1: Ollama (if not already running)
ollama serve

# Terminal 2: OpenClaw gateway
openclaw gateway

# Terminal 3: Text processor
text-processor
```

To run as background services, create LaunchAgent plists (see [Running as Services](#running-as-services)).

### 9. Test it

```bash
# Check imsg access
ssh personaluser@localhost /opt/homebrew/bin/imsg chats --limit 5 --json

# Check Ollama
curl -s http://localhost:11434/api/tags | python3 -m json.tool

# Check OpenClaw
openclaw health

# Send a test message
theo-send --chat-id 1 --text "Hello from the assistant"
```

---

## Skills

### text-processor

**Auto-classify iMessages and take action**

Daemon that polls incoming messages every 3 seconds:

1. **DeepSeek** (local) classifies each message as memory / calendar / reminder / none
2. **Claude** (via OpenClaw) verifies before taking action
3. Saves memories, proposes reminders/calendar events, or ignores

Features:
- **Memory saving** — Facts about people saved to organized markdown folders with source tracking
- **Calendar detection** — Proposes adding events to your calendar
- **Reminder detection** — Asks if you want to be reminded about something
- **Chat watching** — When the assistant sends a message, it watches for replies for 1 hour
- **Group join detection** — When someone mentions the assistant in an unwatched group, it asks you for permission to join
- **Tapback reactions** — Heart/thumbs-up = yes, thumbs-down = no

**Tools:** `text-processor`, `theo-send`, `classifier-prompt.txt`

See [skills/text-processor/SKILL.md](skills/text-processor/SKILL.md) for full documentation.

---

### resy

**Restaurant reservations via Resy API**

| Command | Description |
|---------|-------------|
| `resy search "name"` | Find restaurants by name |
| `resy browse YYYY-MM-DD` | See what's available on a date |
| `resy slots <venue_id> <date>` | Get time slots |
| `resy book` | Complete a reservation |
| `resy reservations` | List upcoming reservations |
| `resy cancel` | Cancel a reservation |

**Setup:** Log into [resy.com](https://resy.com) → DevTools → Application → Cookies → copy `authToken` → save to `~/.config/resy/auth_token`

**Tool:** `tools/resy` (Python, stdlib only)

---

### opentable

**Restaurant search via browser automation**

Search and book restaurants on OpenTable using OpenClaw's built-in browser. No API key needed — uses your logged-in session.

**Setup:** Log into [opentable.com](https://opentable.com) in the OpenClaw browser.

---

### kindle

**Send articles to Kindle**

Fetches web articles, extracts readable content, and emails to your Kindle.

```bash
send-to-kindle https://example.com/article
```

**Setup:** Create `~/.openclaw/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
KINDLE_EMAIL=you_abc123@kindle.com
```

- **SMTP**: Use Gmail with an [App Password](https://support.google.com/accounts/answer/185833) (requires 2FA)
- **Kindle email**: Amazon → Manage Content and Devices → Preferences → Send-to-Kindle Email

**Tool:** `tools/send-to-kindle` (Python + Playwright)

---

### imsg

**iMessage/SMS CLI on macOS**

| Command | Description |
|---------|-------------|
| `imsg chats` | List recent conversations |
| `imsg history --chat-id N` | Read messages from a chat |
| `imsg send --to "+1..." --text "hi"` | Send a message |
| `imsg watch --chat-id N` | Stream incoming messages |

**Setup:** `brew install steipete/tap/imsg` + grant Full Disk Access and Automation permissions.

---

### qmd

**Local markdown search**

```bash
qmd search "query" -c my-notes      # Keyword search (fast)
qmd vsearch "query" -c my-notes     # Semantic search (slower)
qmd get "path/to/file.md"           # Retrieve a file
```

**Setup:**

```bash
bun install -g qmd
qmd init my-notes ~/path/to/notes
qmd update -c my-notes
qmd embed -c my-notes  # enables semantic search
```

---

## Admin Dashboard

A web UI for monitoring and managing the system.

**Stack:** React 19 + Vite + Express + Tailwind CSS

```bash
cd admin-ui
npm install
cp config.example.json ~/.config/admin-ui/config.json
# Edit config.json with your paths
npm run dev
```

Features (toggleable in config):
- View and search friends memory files
- Monitor text-processor decisions pipeline
- View active chat watchers
- Service health checks
- View workspace files

---

## Google Calendar & Gmail (Optional)

If you want the assistant to create calendar events or send emails, install `gogcli`:

```bash
brew install gogcli
```

Authenticate with your Google account:

```bash
gog auth setup --account you@gmail.com
```

Create a helper script for calendar events (example):

```bash
#!/bin/bash
# add-calendar-event "Title" "2026-03-01T14:00:00-08:00" "2026-03-01T15:00:00-08:00" "Description" "Location"
gog calendar events create \
  --account "$GOG_ACCOUNT" \
  --title "$1" \
  --start "$2" \
  --end "$3" \
  --description "$4" \
  --location "$5"
```

The text-processor's calendar detection will propose events to the user. With this script available as an OpenClaw tool, the agent can create them after the user confirms.

---

## Running as Services

Create LaunchAgent plists to run services automatically on login.

### OpenClaw Gateway

Save to `~/Library/LaunchAgents/ai.openclaw.gateway.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.gateway</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/opt/homebrew/lib/node_modules/openclaw/dist/index.js</string>
        <string>gateway</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOURUSERNAME/.openclaw/logs/gateway.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOURUSERNAME/.openclaw/logs/gateway.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
```

### Text Processor

Save to `~/Library/LaunchAgents/ai.openclaw.text-processor.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.text-processor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/YOURUSERNAME/openclaw-shared/tools/text-processor</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOURUSERNAME/.openclaw/logs/text-processor.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOURUSERNAME/.openclaw/logs/text-processor.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
```

Load them:

```bash
mkdir -p ~/.openclaw/logs
launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
launchctl load ~/Library/LaunchAgents/ai.openclaw.text-processor.plist
```

---

## Configuration Reference

### text-processor config

`~/.config/text-processor/config.json` — all keys are optional (defaults shown):

```json
{
  "my_number": "+1XXXXXXXXXX",
  "bot_identifiers": ["your-bot@email.com"],
  "contacts_file": "~/contacts.txt",
  "memory_dir": "~/memory/friends",
  "prompt_file": "~/.config/text-processor/classifier-prompt.txt",
  "watched_chats_file": "~/.config/text-processor/watched-chats.json",
  "decisions_file": "~/.openclaw/text-processor-decisions.json",
  "state_file": "~/.openclaw/text-processor-state.json",
  "sources_file": "~/memory/sources.jsonl",
  "pending_joins_file": "~/.config/text-processor/pending-group-joins.json",
  "signature": "- Assistant",
  "assistant_name": "assistant",
  "channel": "imessage",
  "send_script": "theo-send",
  "ssh_target": "user@localhost",
  "imsg_path": "/opt/homebrew/bin/imsg"
}
```

### Admin UI config

Copy `admin-ui/config.example.json` to `~/.config/admin-ui/config.json`:

```json
{
  "openclaw_dir": "~/.openclaw",
  "bin_dir": "~/bin",
  "clawd_dir": "~/clawd",
  "user_name": "User",
  "app_title": "OpenClaw Admin",
  "features": {
    "text_processor": true,
    "friends": true,
    "active_chats": true,
    "stories": false,
    "blog_watcher": false
  }
}
```

---

## Friends Memory Structure

The text-processor saves facts about people to markdown files:

```
memory/friends/
├── alice-smith/
│   ├── index.md          # Core facts (always true)
│   └── 2026-02.md        # Monthly updates (time-sensitive)
├── bob-jones/
│   ├── index.md
│   └── 2026-02.md
```

**index.md** — Permanent facts:

```markdown
# Alice Smith

## Core

- (family) Has a brother named Tom
- (work) Product manager at Stripe
- (birthday) March 15

## Preferences

- (preference) Loves Thai food
- (preference) Allergic to shellfish
```

**2026-02.md** — Monthly updates:

```markdown
# February 2026

- [03] (life_event) Just got engaged to partner Mike
- [15] (health) Recovering from knee surgery
- [22] (work) Got promoted to Senior PM
```

Each fact includes a source hash linking back to the original message in `sources.jsonl`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `imsg: command not found` | `brew install steipete/tap/imsg` |
| Text-processor crashes on startup | Make sure Ollama is running: `ollama serve` |
| SSH connection refused | Enable Remote Login in System Settings → Sharing |
| "Full Disk Access" errors | System Settings → Privacy → Full Disk Access → add your terminal |
| Classification always returns "none" | Check that DeepSeek model is pulled: `ollama list` |
| Replies not being detected | Check `watched-chats.json` — watchers expire after 1 hour |
| Admin UI won't start | Run `npm install` in `admin-ui/` and check config exists |
| Gateway port already in use | `lsof -i :18789` to find and kill the old process |

---

## Quick Reference

| Skill | What it does | Credentials needed |
|-------|--------------|-------------------|
| text-processor | Auto-classify texts, save memories, propose reminders/events | Config file + Ollama + OpenClaw |
| resy | Book restaurants on Resy | Resy auth token (from cookie) |
| opentable | Book restaurants on OpenTable | OpenTable login (in browser) |
| kindle | Send articles to Kindle | SMTP + Kindle email |
| imsg | Read/send iMessages | macOS permissions |
| qmd | Search markdown files | None |
