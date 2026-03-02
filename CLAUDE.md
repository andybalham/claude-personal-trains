# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UK Rail Departure Board — a Netlify-hosted web app displaying live UK train departure information using the National Rail Darwin OpenLDBWS SOAP API. Designed as a single-page app with a serverless backend proxy.

## Architecture

- **Frontend**: Single `index.html` file containing all HTML, CSS, and JavaScript (no separate .js or .css files)
- **Backend**: Netlify Function at `netlify/functions/departures.js` — proxies requests to the Darwin SOAP API via `darwin-ldb-node`
- **Hosting**: Netlify (static site + serverless functions)
- **API key**: `DARWIN_API_KEY` stored in Netlify env vars, never exposed to frontend

The frontend calls `/.netlify/functions/departures?from=CRS&to=CRS` which returns a normalized JSON array of departure objects. URL query params `?from=KGX&to=EDB` drive the route display.

## Commands

```bash
npm install                    # Install dependencies
netlify dev                    # Local dev server (http://localhost:8888)
netlify deploy --prod          # Deploy to production
```

Local development requires a `.env` file with `DARWIN_API_KEY=<token>` (must be in `.gitignore`).

## Key Constraints

- Only allowed npm dependency is `darwin-ldb-node` — flag any additions as a deviation
- All frontend code must stay inline in `index.html` — do not split into separate files
- Never hardcode `DARWIN_API_KEY` in source files; read from `process.env` only
- Implementation follows phased task list in `specifications/implementation/initial-tasks.md` — complete phases in order
- Full requirements spec is in `specifications/requirements/initial-requirements.md`
