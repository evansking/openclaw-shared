---
name: text-processor
description: iMessage processing pipeline — auto-classifies texts, saves memories, handles reminders/calendar events, monitors chat responses, detects tapback reactions, and handles group chat join requests.
---

# Text Processor & iMessage Pipeline

Automated processing of incoming iMessages using local LLM (DeepSeek) with Claude verification.

## How It Works

1. **Polls incoming messages** via `imsg` CLI
2. **Classifies each message** through DeepSeek-R1:8b locally via Ollama
3. **Verifies with Claude** (via OpenClaw) before taking action
4. **Takes action**: saves memory, sends reminder/calendar confirmation, or ignores

**Script:** `text-processor`
**Logs:** `~/.openclaw/logs/text-processor.log`

## Classifications

Each message is classified as: **memory**, **calendar**, **reminder**, or **none**.

### Memory actions

Saves facts about people to markdown files organized by person. Each saved fact includes a source hash linking back to the original message for traceability.

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

## Group Chat Join Detection

When the assistant's name is mentioned in an **unwatched** group chat:

1. **DeepSeek** classifies whether the message is directed at the assistant
2. **Claude** verifies and composes a notification
3. The owner gets a DM asking if the assistant should join the conversation
4. If approved, the assistant reads context and responds, auto-registering the chat for continued watching

Pending join requests are tracked and have a 1-hour cooldown per chat.

## Configuration

All settings live in `~/.config/text-processor/config.json`:

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

## Source Tracking

Each saved memory fact gets a source hash. The `sources.jsonl` file links every fact back to the original message, sender, and chat for auditability.

## theo-send

Send messages as the assistant with automatic chat watching:

```bash
theo-send --chat-id 5 --text "Your message here"
```

This:
1. Appends the configured signature (skips if already present)
2. Sends via `imsg`
3. Registers the chat for reply forwarding (1 hour)
