---
name: resy
description: Search restaurants, check availability, and book reservations on Resy.
---

# Resy — Restaurant Reservations

Search for restaurants, check available time slots, and book reservations via the Resy API.

**CLI:** `resy <command>`

## Setup

1. Get your Resy auth token by logging into resy.com and grabbing the `authToken` cookie
2. Save it to `~/.config/resy/auth_token`

## When to use

- "Book me a table at Bestia for Saturday"
- "What's available at Madre tonight?"
- "Find me a restaurant in Silver Lake for 4 people Friday"
- "Cancel my reservation at Bavel"
- "What reservations do I have coming up?"

## Browse what's available

When asked "what's available Wednesday?" or "find me dinner options this weekend":

```bash
resy browse <YYYY-MM-DD> --party-size 2 --limit 15
```

Override location with lat/long:
```bash
resy --lat 33.9925 --long -118.4695 browse 2026-02-05 --party-size 2
```

Shows restaurants with availability, ratings, price range, and time previews.

## Booking flow

### Step 1: Search for the restaurant

```bash
resy search "madre" --limit 5
```

Output shows venue name, ID, neighborhood, cuisine, and price range. You need the **venue ID** for the next step.

### Step 2: Check available time slots

```bash
resy slots <venue_id> <YYYY-MM-DD> --party-size 2
```

Example:
```bash
resy slots 12345 2026-02-05 --party-size 2
```

Shows available times and seating types (Dining Room, Bar, Patio, etc.).

To get the config tokens needed for booking, use `--json`:
```bash
resy --json slots 12345 2026-02-05 --party-size 2
```

Each slot has a `config_token` — you'll need this for the next step.

### Step 3: Get booking details

```bash
resy details "<config_token>" <YYYY-MM-DD> --party-size 2
```

This returns:
- **book_token** — needed to confirm the booking
- **payment method** — your card on file
- **cancellation policy** — show this to user before booking

### Step 4: Book (ALWAYS confirm with user first)

```bash
resy book "<book_token>" <payment_method_id>
```

**IMPORTANT:** Never book without explicit confirmation. Always show:
- Restaurant name
- Date and time
- Party size
- Seating type
- Cancellation policy

### List upcoming reservations

```bash
resy reservations
```

### Cancel a reservation

```bash
resy cancel "<resy_token>"
```

## JSON output

Add `--json` before the command for machine-readable output:
```bash
resy --json search "madre"
resy --json slots 12345 2026-02-05
resy --json details "<token>" 2026-02-05
```

## Location

Default location is Los Angeles. Override with:
```bash
resy --lat 37.7749 --long -122.4194 search "nopa"  # San Francisco
```

## Auth

Token stored at `~/.config/resy/auth_token`. Tokens expire periodically — refresh by logging into resy.com and grabbing the `authToken` cookie.

## Known LA locations

| Area | Lat | Long |
|------|-----|------|
| LA Downtown (default) | 34.0522 | -118.2437 |
| Venice / Westside | 33.9925 | -118.4695 |
| Santa Monica | 34.0195 | -118.4912 |
| Silver Lake | 34.0869 | -118.2702 |
| West Hollywood | 34.0900 | -118.3617 |
| Culver City | 34.0211 | -118.3965 |

## Date handling — VERIFY THE DAY OF WEEK

**Before using any date, always confirm the day of week.** Run:
```bash
date -j -f "%Y-%m-%d" "2026-01-31" "+%A"   # macOS
```

When user says "Saturday", "this Friday", "next Wednesday", etc.:
1. Compute the date from today's date
2. **Verify it with the `date` command above**
3. Include the day of week in your confirmation (e.g., "Saturday Jan 31")

## Tips

- If a restaurant isn't found by name search, try shorter/partial names
- Popular restaurants may show no availability — try different dates
- Book tokens expire in ~5 minutes, so don't delay between details and book
- Party size defaults to 2 if not specified
