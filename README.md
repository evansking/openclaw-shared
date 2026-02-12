# OpenClaw Shared Skills

A collection of skills and tools for OpenClaw agents.

## Installation

1. Clone this repo
2. Add `tools/` to your PATH:
   ```bash
   export PATH="/path/to/openclaw-shared/tools:$PATH"
   ```
3. Copy desired skills to your OpenClaw workspace:
   ```bash
   cp -r skills/resy ~/.openclaw/skills/
   ```

---

## Skills

### resy
**Restaurant reservations via Resy API**

Search restaurants, check availability, and book tables on Resy.

| Capability | Description |
|------------|-------------|
| `resy search "name"` | Find restaurants by name |
| `resy browse YYYY-MM-DD` | See what's available on a date |
| `resy slots <venue_id> <date>` | Get time slots for a restaurant |
| `resy book` | Complete a reservation |
| `resy reservations` | List upcoming reservations |
| `resy cancel` | Cancel a reservation |

**Setup required:**
1. Log into [resy.com](https://resy.com)
2. Open browser DevTools → Application → Cookies
3. Copy the `authToken` cookie value
4. Save to `~/.config/resy/auth_token`

**Tool:** `tools/resy` (Python, no dependencies beyond stdlib)

---

### opentable
**Restaurant search via browser automation**

Search and book restaurants on OpenTable. Uses OpenClaw browser — no API key needed.

| Capability | Description |
|------------|-------------|
| Search by name, cuisine, or neighborhood | Deep-links to search results |
| Check availability | See time slots for a specific restaurant |
| Book a table | Click through reservation flow |

**Setup required:**
1. Log into [opentable.com](https://opentable.com) in your OpenClaw browser
2. That's it — uses your logged-in session

**Tool:** None (browser-based)

---

### kindle
**Send articles to Kindle**

Fetches web articles, cleans them up, and emails to your Kindle as readable HTML.

| Capability | Description |
|------------|-------------|
| `send-to-kindle <url>` | Fetch article and send to Kindle |

**Setup required:**

Create `~/.openclaw/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
KINDLE_EMAIL=you_abc123@kindle.com
```

How to get these:
1. **SMTP credentials**: Use Gmail with an [App Password](https://support.google.com/accounts/answer/185833) (requires 2FA enabled)
2. **KINDLE_EMAIL**: Find in Amazon → Manage Your Content and Devices → Preferences → Personal Document Settings → Send-to-Kindle Email

**Tool:** `tools/send-to-kindle` (Python + Playwright)

---

### imsg
**iMessage/SMS on macOS**

Read and send iMessages from your Mac.

| Capability | Description |
|------------|-------------|
| `imsg chats` | List recent conversations |
| `imsg history --chat-id N` | Read messages from a chat |
| `imsg send --to "+1..." --text "hi"` | Send a message |
| `imsg watch --chat-id N` | Stream incoming messages |

**Setup required:**
1. Install: `brew install steipete/tap/imsg`
2. Grant Full Disk Access to your terminal (System Settings → Privacy)
3. Grant Automation permission for Messages.app when prompted

**Tool:** None (installed via brew)

---

### qmd
**Local markdown search**

Search across markdown files using keyword or semantic search. Great for notes, docs, knowledge bases.

| Capability | Description |
|------------|-------------|
| `qmd search "query" -c collection` | Keyword search (fast) |
| `qmd vsearch "query" -c collection` | Semantic search (slower) |
| `qmd get "path/to/file.md"` | Retrieve a specific file |

**Setup required:**
1. Install: `bun install -g qmd`
2. Index your markdown folder:
   ```bash
   qmd init my-notes ~/path/to/notes
   qmd update -c my-notes
   qmd embed -c my-notes  # enables semantic search
   ```

**Tool:** None (installed via bun)

---

### text-processor
**Auto-classify iMessages and take action**

Watches incoming texts, classifies them using local LLM (DeepSeek), verifies with Claude, and takes action — saving memories, proposing reminders, or detecting calendar events.

| Capability | Description |
|------------|-------------|
| `text-processor` | Run the daemon (polls every 3s) |
| `theo-send --chat-id N --text "msg"` | Send as assistant + watch for replies |

**Architecture:**
1. DeepSeek-R1:8b (local via Ollama) does fast first-pass classification
2. Claude (via OpenClaw) verifies before taking action
3. Memories saved to markdown files, reminders/calendar sent as confirmation texts

**Dependencies:**

| Dependency | Install | Purpose |
|------------|---------|---------|
| Python 3 | (pre-installed on macOS) | Runtime |
| Ollama | `brew install ollama` | Local LLM server |
| DeepSeek-R1:8b | `ollama pull deepseek-r1:8b` | Classification model |
| imsg | `brew install steipete/tap/imsg` | iMessage access |
| OpenClaw | `npm install -g openclaw` | Claude verification + cron |
| requests | `pip3 install requests` | HTTP client for Ollama |

**Setup required:**

1. Install dependencies above
2. Create config file `~/.config/text-processor/config.json`:

```json
{
  "my_number": "+1234567890",
  "bot_identifiers": ["your-bot@email.com"],
  "contacts_file": "/path/to/contacts.txt",
  "memory_dir": "/path/to/memory/friends",
  "prompt_file": "/path/to/classifier-prompt.txt",
  "watched_chats_file": "/path/to/watched-chats.json",
  "decisions_file": "~/.openclaw/text-processor-decisions.json",
  "state_file": "~/.openclaw/text-processor-state.json",
  "signature": "- YourBot (Your Assistant)"
}
```

3. Copy `classifier-prompt.txt` to your prompt_file path
4. Create a contacts file (format: `+1234567890|Name` per line)
5. Grant Full Disk Access to your terminal
6. Start Ollama: `ollama serve`
7. Run: `text-processor`

**Tools:** `tools/text-processor`, `tools/theo-send`, `tools/classifier-prompt.txt` (Python)

---

## Quick Reference

| Skill | What it does | Credentials needed |
|-------|--------------|-------------------|
| resy | Book restaurants on Resy | Resy auth token (from cookie) |
| opentable | Book restaurants on OpenTable | OpenTable login (in browser) |
| kindle | Send articles to Kindle | SMTP + Kindle email |
| imsg | Read/send iMessages | macOS permissions |
| qmd | Search markdown files | None |
| text-processor | Auto-classify texts, save memories | Config file + Ollama + OpenClaw |
