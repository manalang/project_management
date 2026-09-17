# Project Management

A browser-based toolkit for managing engineering development and long-term operations projects.

## Current capabilities

- Guided project initialization
- Portfolio health dashboard and project drill-downs
- Dependency-aware schedules and critical-path tasks
- Task assignments and status tracking
- Budget-versus-actual monitoring
- Meeting agendas and notes
- Project metrics and printable status reports
- Persistent, user-owned project data

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run build
```

The application uses a Cloudflare Worker-compatible runtime and D1 database. GitHub Pages alone cannot run the authenticated database backend; production deployment should be triggered from this repository to a server-capable host.
