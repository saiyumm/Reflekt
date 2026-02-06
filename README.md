# Reflekt

A local-first weekly updates dashboard for web developers. Track what you ship, tag it, attach screenshots, and compare before/after changes — all without any cloud dependency.

## Features

- **Date-based updates** — log what you worked on with title, description, date, category, tags, and status
- **Smart auto-categorization** — detects Bug Fix, Development, Improvement, Documentation, DevOps from your title and description as you type
- **Week-based collapsible views** — updates grouped by ISO week with animated expand/collapse and category breakdown bars
- **Attachments** — upload images, add links, or attach before/after screenshot pairs
- **Before/After comparison** — side-by-side viewer with independent zoom and pan per image
- **Filters** — filter by category, date range, tags, and full-text search
- **Detail panel** — click any card to see full details in a slide-out panel
- **Dark/Light/System theme** — follows your system preference with manual toggle
- **Export/Import** — full JSON export (with base64 images) for backup and portability
- **Keyboard shortcuts** — `N` for new update, `/` to focus search, `Esc` to close dialogs
- **Fully local** — SQLite database, files stored on disk, zero cloud dependencies

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS v4 + shadcn/ui + Framer Motion
- **Backend:** Express.js (lightweight local API server)
- **Database:** SQLite via better-sqlite3
- **Storage:** Local filesystem for attachments

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/reflekt.git
cd reflekt

# Install dependencies
npm install

# Start development (runs both Vite and Express)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. That's it.

## Project Structure

```
Reflekt/
├── server/              # Express API server
│   ├── index.ts         # Server entry point
│   ├── db.ts            # SQLite setup + migrations
│   ├── routes/          # API route handlers
│   └── utils/           # Auto-categorization engine
├── src/                 # React frontend
│   ├── components/      # UI components
│   │   ├── layout/      # AppShell, Header, Sidebar
│   │   ├── updates/     # WeekGroup, UpdateCard, UpdateForm, UpdateDetail
│   │   ├── media/       # BeforeAfter, ImagePreview, AddAttachmentDialog
│   │   ├── filters/     # FilterBar
│   │   ├── shared/      # CategoryBadge, TagBadge, ThemeToggle, EmptyState
│   │   └── ui/          # shadcn/ui primitives
│   ├── hooks/           # useUpdates, useFilters, useWeekGroups, useTheme
│   ├── lib/             # API client, categories, categorize engine, utils
│   └── types/           # TypeScript type definitions
├── data/                # Runtime data (gitignored)
│   ├── reflekt.db       # SQLite database
│   └── attachments/     # Uploaded images
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Express concurrently |
| `npm run dev:client` | Start Vite only |
| `npm run dev:server` | Start Express only |
| `npm run build` | Production build |

## Data

All data is stored locally in the `data/` directory:
- `data/reflekt.db` — SQLite database
- `data/attachments/` — uploaded image files

This directory is gitignored. Use Export/Import to back up or transfer your data.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Create new update |
| `/` | Focus search bar |
| `Esc` | Close dialogs and panels |

## License

MIT
