---
name: opentable
description: Search restaurants and check availability on OpenTable via browser automation.
---

# OpenTable — Restaurant Search & Reservations

Search for restaurants and check availability on OpenTable using browser automation. No API — everything is browser-based.

**Requires:** OpenClaw browser. User must be logged into opentable.com.

## When to use

Use alongside the Resy skill when searching for reservations. Resy is faster (API-based), so check Resy first, then OpenTable for additional options — especially restaurants not on Resy.

- "What's available Saturday night?" — check Resy, then OpenTable
- "Can you check OpenTable for Bestia?" — OpenTable specifically
- "Find me a table for 4 Friday" — both platforms

## Search for restaurants

### By name — deep link to search

```
https://www.opentable.com/s?dateTime={YYYY-MM-DD}T{HH:MM}&covers={N}&term={QUERY}&metroId=4
```

| Param | Description | Example |
|-------|-------------|---------|
| dateTime | Date and time (ISO format) | 2026-02-07T19:00 |
| covers | Party size | 2 |
| term | Restaurant name or cuisine | bestia |
| metroId | Metro area (4 = LA) | 4 |

```bash
openclaw browser open "https://www.opentable.com/s?dateTime=2026-02-07T19:00&covers=2&term=bestia&metroId=4"
```

### Browse by area — omit the term

For general "what's available" queries, search without `term` or use a cuisine/neighborhood:

```bash
# General LA availability
openclaw browser open "https://www.opentable.com/s?dateTime=2026-02-07T19:00&covers=2&metroId=4"

# By cuisine
openclaw browser open "https://www.opentable.com/s?dateTime=2026-02-07T19:00&covers=2&term=italian&metroId=4"

# By neighborhood
openclaw browser open "https://www.opentable.com/s?dateTime=2026-02-07T19:00&covers=2&term=venice+beach&metroId=4"
```

### Read search results

After navigating, snapshot to read the results:

```bash
openclaw browser snapshot
```

Results show restaurant name, cuisine, price range, rating, neighborhood, and available time slots.

## Check availability for a specific restaurant

Navigate directly to the restaurant page with date/covers pre-set:

```
https://www.opentable.com/r/{RESTAURANT-SLUG}?dateTime={YYYY-MM-DD}T{HH:MM}&covers={N}
```

Restaurant slugs are lowercase, hyphenated, with city appended:
- `bestia-los-angeles`
- `gracias-madre-west-hollywood`
- `providence-los-angeles`

```bash
openclaw browser open "https://www.opentable.com/r/bestia-los-angeles?dateTime=2026-02-07T19:00&covers=2"
```

After loading, snapshot to see available time slots:

```bash
openclaw browser snapshot
```

## Book a reservation

### Step 1: Click a time slot

From either search results or a restaurant page, click the desired time slot button:

```bash
openclaw browser click {timeslot_ref}
```

### Step 2: Confirm booking details

A booking confirmation panel appears. Snapshot to read the details:

```bash
openclaw browser snapshot
```

Check for:
- Restaurant name
- Date, time, party size
- Seating type (indoor, outdoor, bar, etc.)
- Any special notes or policies

### Step 3: Complete the reservation

**IMPORTANT: Always confirm with user before completing.** Show them:
- Restaurant name
- Date and time
- Party size
- Any cancellation policy shown

If user confirms, click the "Complete reservation" button:

```bash
openclaw browser click {complete_ref}
```

### Step 4: Confirm success

Snapshot the confirmation page to capture:
- Confirmation number
- Final details (time, party size, any notes)

```bash
openclaw browser snapshot
```

## Presenting results alongside Resy

When asked about availability, check both platforms and present a combined view:

```
Resy:
  Bestia — 7:00pm, 7:30pm, 9:15pm (Dining Room)
  Bavel — 8:00pm, 8:30pm (Patio)

OpenTable:
  Providence — 7:00pm, 7:45pm, 8:30pm
  Gracias Madre — 6:30pm, 7:00pm, 8:00pm

Which one catches your eye?
```

## Metro IDs

| City | metroId |
|------|---------|
| Los Angeles | 4 |
| San Francisco | 3 |
| New York | 8 |

Default to LA (metroId 4). For other cities, search opentable.com — the metroId appears in the URL.

## Date handling — VERIFY THE DAY OF WEEK

Before using any date, confirm the day of week:

```bash
date -j -f "%Y-%m-%d" "2026-02-07" "+%A"   # macOS
```

When user says "Saturday", "this Friday", etc.:
1. Compute the date from today
2. Verify with the `date` command
3. Include the day of week in confirmation (e.g., "Saturday Feb 7")

## Defaults

- **Party size:** 2 (unless specified)
- **Time:** 7:00pm (unless specified)
- **Metro:** Los Angeles (metroId 4)

## Tips

- **Deep link is key** — skip the homepage, go straight to search results or restaurant page
- **Resy first, then OpenTable** — Resy is faster (API). Use OpenTable to expand options
- **Time slots on search results are clickable** — you can book directly from search
- **Logged-in session matters** — saved payment/contact info only work when logged in
- **If the page asks to log in**, tell user they need to log into OpenTable in the browser
