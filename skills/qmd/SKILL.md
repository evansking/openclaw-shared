---
name: qmd
description: Local hybrid search for markdown notes and docs. Use when searching notes, finding related content, or retrieving documents from indexed collections.
homepage: https://github.com/tobi/qmd
metadata: {"openclaw":{"emoji":"🔍","os":["darwin","linux"],"requires":{"bins":["qmd"]}}}
---

# qmd - Quick Markdown Search

Local search engine for Markdown notes, docs, and knowledge bases.

## Install

```bash
bun install -g qmd
```

Binary installs to `~/.bun/bin/qmd`. Prepend PATH if needed:
```bash
export PATH="$HOME/.bun/bin:$PATH" && qmd <command>
```

## When to use

- Searching across multiple markdown files at once
- Finding documents by topic or keyword
- Semantic search when keywords aren't enough
- Any question that spans multiple files in a collection

## Setup — Index a collection

Create a collection from a folder of markdown files:

```bash
qmd init my-notes ~/notes
qmd update -c my-notes
qmd embed -c my-notes   # optional: enables semantic search
```

## Search modes

**Use `qmd search` by default** — it's instant (BM25 keyword match).

```bash
# Keyword search (fast, default)
qmd search "project ideas" -c my-notes

# Semantic search (slower, use when keywords aren't enough)
qmd vsearch "what should I work on next" -c my-notes
```

Avoid `qmd query` (hybrid + reranking) — it's slow and usually overkill.

## Common commands

```bash
# Search a collection
qmd search "meeting notes" -c my-notes
qmd search "birthday" -c contacts -n 10

# JSON output (for programmatic use)
qmd search "project" -c my-notes --json

# Semantic search (when keywords fail)
qmd vsearch "things I need to follow up on" -c my-notes

# Retrieve a specific file
qmd get "notes/2026-01-15.md"
qmd multi-get "notes/2026-01-*.md"  # All January notes
```

## Keeping the index fresh

Run after new files are added:
```bash
qmd update -c my-notes && qmd embed -c my-notes
```

## When NOT to use qmd

- Looking up a specific file you know the path to → just read it directly
- qmd is for searching ACROSS files when you don't know which one has the answer
