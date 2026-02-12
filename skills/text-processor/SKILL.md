---
name: text-processor
description: iMessage processing pipeline — auto-classifies texts, saves memories, handles reminders, monitors chat responses, and detects tapback reactions.
---

# Text Processor & iMessage Pipeline

Automated processing of incoming iMessages using local LLM (DeepSeek) with Claude verification.

## How It Works

1. **Polls incoming messages** via `imsg` CLI
2. **Classifies each message** through DeepSeek-R1:8b locally via Ollama
3. **Verifies with Claude** (via OpenClaw) before taking action
4. **Takes action**: saves memory, sends reminder confirmation, or ignores

**Script:** `text-processor`
**Logs:** `~/.openclaw/logs/text-processor.log`

## Classifications

Each message is classified as: **memory**, **calendar**, **reminder**, or **none**.

### Memory actions

Saves facts about people to markdown files organized by person.

Categories: family, work, health, preference, life_event, relationship, contact_info, address, birthday, pet.

### Calendar actions

Detects events the user will attend — sends a confirmation text asking to add to calendar.

### Reminder actions

- Sends a confirmation text asking if user wants to set a reminder
- User can reply: "yes", "no", or "yes but at [different time]"
- The OpenClaw agent handles the response and creates the reminder via cron

## Chat Watcher

When the assistant sends a message from the user's account (via `theo-send`), replies from that chat get forwarded to the main agent session for 1 hour (refreshed on each new message).

Active watchers are stored in the `watched_chats_file` path from config. Expired entries auto-clean.

## Service Management

```bash
# Start as service (create your own plist)
launchctl load ~/Library/LaunchAgents/text-processor.plist

# View logs
tail -f ~/.openclaw/logs/text-processor.log

# Start manually
text-processor
```

## Friends Memory Structure

Each friend has a folder in the configured `memory_dir`:

**Two types of files:**

1. **`index.md`** — Core/permanent facts (always true)
   - Family info, work/career, preferences, contact info, birthdays, pets

2. **`YYYY-MM.md`** (e.g., `2026-01.md`) — Monthly updates (time-sensitive)
   - Life events, health updates, relationship changes, recent news

## theo-send

Send messages as the assistant with automatic chat watching:

```bash
theo-send --chat-id 5 --text "Your message here"
```

This:
1. Appends the configured signature
2. Sends via `imsg`
3. Registers the chat for reply forwarding (1 hour)
