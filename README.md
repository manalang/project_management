# Project Management

A browser-based toolkit for managing engineering development and long-term operations projects.

## Current capabilities

- Guided project initialization with document import
- PDF, Word, Excel/CSV, text, and Markdown extraction
- Portfolio health dashboard and project drill-downs
- Dependency-aware schedules and critical-path tasks
- Task assignments and status tracking
- Budget-versus-actual monitoring
- Meeting agendas, project metrics, and printable reports
- Persistent project records and retained source documents

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run build
```

The application uses a Cloudflare Worker-compatible runtime, D1 database, and R2 document storage. GitHub Pages alone cannot run the authenticated backend; production deployment should be triggered from this repository to a server-capable host.
