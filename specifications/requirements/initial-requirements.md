# UK Rail Departure Board — Requirements Document

## Overview

A Netlify-hosted web application that displays live UK train departure information for a given route, using the National Rail Darwin OpenLDBWS SOAP API as its data source. The application is intended to be built and deployed using Claude Code.

---

## Technology Stack

| Layer               | Technology                                          |
| ------------------- | --------------------------------------------------- |
| Hosting & Functions | Netlify (static site + Netlify Functions)           |
| Frontend            | Vanilla HTML, CSS, JavaScript (single `index.html`) |
| Backend             | Netlify Function (Node.js)                          |
| Train Data API      | National Rail Darwin OpenLDBWS SOAP API             |
| SOAP wrapper        | `darwin-ldb-node` npm package                       |
| Notifications       | Browser Notification API                            |
| Secrets management  | Netlify Environment Variables                       |

---

## Repository Structure

```text
uk-rail-board/
├── index.html                  ← Frontend (single page)
├── netlify.toml                ← Netlify config
├── package.json                ← Dependencies for functions
└── netlify/
    └── functions/
        └── departures.js       ← Serverless function (Darwin proxy)
```

---

## URL Structure

The station pair to display is passed via URL query parameters:

```text
https://<site>.netlify.app/?from=KGX&to=EDB
```

| Parameter | Description                                   | Example |
| --------- | --------------------------------------------- | ------- |
| `from`    | 3-letter CRS code for the departure station   | `KGX`   |
| `to`      | 3-letter CRS code for the destination station | `EDB`   |

If either parameter is missing or invalid, the page should display a clear error message instructing the user to provide valid CRS codes.

---

## Netlify Function: `departures.js`

### Endpoint

```text
GET /.netlify/functions/departures?from=KGX&to=EDB
```

### Behaviour

- Reads `from` and `to` query parameters from the request
- Calls the Darwin OpenLDBWS API using the `darwin-ldb-node` wrapper
- Fetches the next **10 departures** from the `from` station that call at the `to` station (`filterCrs`)
- Returns a JSON response to the frontend

### Environment Variable

| Variable         | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `DARWIN_API_KEY` | National Rail Darwin API token — set in Netlify dashboard under Site Settings → Environment Variables |

### Response Shape (JSON)

The function should return an array of service objects, each containing:

```json
[
  {
    "scheduledDeparture": "14:32",
    "estimatedDeparture": "14:47",
    "platform": "5",
    "operator": "LNER",
    "destination": "Edinburgh",
    "scheduledArrival": "18:55",
    "estimatedArrival": "19:10",
    "journeyMinutes": 263,
    "isCancelled": false,
    "delayMinutes": 15
  }
]
```

- `delayMinutes` should be calculated as the difference between `estimatedDeparture` and `scheduledDeparture`
- If a service is cancelled, `isCancelled` should be `true` and `delayMinutes` should be `null`
- If a train is on time, `estimatedDeparture` should be `"On time"` and `delayMinutes` should be `0`

### Error Handling

- If the Darwin API call fails, return HTTP 502 with a JSON error body: `{ "error": "Failed to fetch departure data" }`
- If `from` or `to` parameters are missing, return HTTP 400: `{ "error": "Missing required parameters: from, to" }`

---

## Frontend: `index.html`

### Page Structure

- A header showing the route: e.g. **"London King's Cross → Edinburgh"** (full station names resolved from CRS codes if possible, otherwise display the CRS code)
- A **last updated** timestamp showing when data was last fetched
- A **next refresh** countdown (counting down from 15 minutes)
- A scrollable table of the next 10 departures
- A status banner for alerts (hidden when no issues)

### Departures Table

| Column       | Description                                   |
| ------------ | --------------------------------------------- |
| Departs      | Scheduled departure time                      |
| Arrives      | Scheduled arrival time                        |
| Journey Time | Duration in hours and minutes (e.g. "4h 23m") |
| Platform     | Platform number, or "TBC" if not yet assigned |
| Operator     | Train operating company name                  |
| Status       | "On time", "Delayed Xm", or "Cancelled"       |

### Status Column Styling

- **On time** — green text
- **Delayed** — amber text, with the number of minutes shown
- **Cancelled** — red text, strikethrough on the row

---

## Auto-Refresh

- The page should automatically re-fetch data from the Netlify Function every **15 minutes** using `setInterval`
- A visible countdown timer should show the time remaining until the next refresh
- The user should also be able to trigger a manual refresh via a **"Refresh Now"** button
- On each refresh, the departures table and last updated timestamp should update without a full page reload

---

## Browser Notifications

### Permission Request

- On first load, the app should request permission to send browser notifications using the Browser Notification API
- If the user denies permission, the app should display a subtle inline message: _"Enable notifications to receive delay alerts"_
- If the user grants permission, a confirmation message should be shown briefly

### Notification Triggers

A browser notification should be sent when, **after a refresh**, any of the following conditions are detected on the displayed route:

| Trigger                                   | Notification Text                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Any service delayed by 15 minutes or more | "⚠️ Delay: The [time] [operator] service is delayed by [X] minutes"                  |
| Any service cancelled                     | "🚫 Cancellation: The [time] [operator] service to [destination] has been cancelled" |

### Notification Rules

- Notifications should only fire once per service per refresh cycle — do not repeatedly notify about the same delay on subsequent refreshes unless the delay increases
- Track notified services in memory (using a `Set` keyed on service ID + delay bucket) to avoid duplicate alerts
- Notifications should link back to the page when clicked (`notification.onclick`)

---

## `netlify.toml`

```toml
[build]
  functions = "netlify/functions"
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## `package.json` (functions dependencies)

```json
{
  "name": "uk-rail-board",
  "version": "1.0.0",
  "dependencies": {
    "darwin-ldb-node": "^2.0.0"
  }
}
```

---

## Deployment Instructions (for Claude Code)

1. Initialise the project: `npm install`
2. Install Netlify CLI: `npm install -g netlify-cli`
3. Log in: `netlify login`
4. Link to a new Netlify site: `netlify init`
5. Set the environment variable: `netlify env:set DARWIN_API_KEY <your_token>`
6. Deploy to production: `netlify deploy --prod`

---

## Out of Scope

The following are explicitly out of scope for this version:

- User accounts or saved routes
- Mobile app or PWA packaging
- Historical journey data or analytics
- Multi-leg journeys or interchange suggestions
- Support for bus, tram, or other transport modes
- Any backend database or persistent storage

---

## Acceptance Criteria

- [ ] Visiting `/?from=KGX&to=EDB` displays a populated departures table
- [ ] All five data columns (operator, journey time, platform, scheduled times, status) are present and populated
- [ ] Cancelled services are visually distinct (red, strikethrough)
- [ ] Delayed services show the number of minutes delay in amber
- [ ] The page refreshes automatically every 15 minutes without a full reload
- [ ] A countdown timer is visible at all times
- [ ] A "Refresh Now" button triggers an immediate data fetch
- [ ] Browser notifications fire for delays ≥ 15 minutes and cancellations
- [ ] The same delay does not trigger duplicate notifications across refreshes
- [ ] Missing or invalid CRS codes show a user-friendly error
- [ ] The `DARWIN_API_KEY` is never exposed in frontend code or network responses
- [ ] The app deploys successfully to Netlify with `netlify deploy --prod`
