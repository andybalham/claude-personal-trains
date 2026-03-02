# UK Rail Departure Board — Implementation Task List

> Hand this file to Claude Code along with `requirements.md`. Work through tasks in order — each phase builds on the previous one. Do not skip ahead. Mark each task `[x]` when complete before moving to the next.

---

## Phase 1: Project Scaffolding

- [ ] **1.1** Create the project root directory `uk-rail-board/`
- [ ] **1.2** Create the subdirectory `netlify/functions/`
- [ ] **1.3** Create `package.json` with the content specified in the requirements (name, version, and `darwin-ldb-node` dependency)
- [ ] **1.4** Create `netlify.toml` with the build config and redirect rule specified in the requirements
- [ ] **1.5** Create empty placeholder files: `index.html` and `netlify/functions/departures.js`
- [ ] **1.6** Run `npm install` and confirm `node_modules/darwin-ldb-node` is present
- [ ] **1.7** Commit the scaffolded structure to a new local git repository (`git init && git add . && git commit -m "chore: initial scaffold"`)

---

## Phase 2: Netlify Function — `departures.js`

- [ ] **2.1** Import `darwin-ldb-node` at the top of `departures.js`
- [ ] **2.2** Read `from` and `to` query parameters from the incoming request event
- [ ] **2.3** Implement parameter validation: if either `from` or `to` is missing, return HTTP 400 with body `{ "error": "Missing required parameters: from, to" }`
- [ ] **2.4** Read `DARWIN_API_KEY` from `process.env`
- [ ] **2.5** Call `getDepartureBoard` (or equivalent darwin-ldb-node method) with:
  - `token`: the API key from env
  - `crs`: the `from` parameter
  - `filterCrs`: the `to` parameter
  - `numRows`: 10
- [ ] **2.6** Map the raw Darwin response into the clean JSON response shape defined in the requirements, including:
  - `scheduledDeparture`, `estimatedDeparture`
  - `scheduledArrival`, `estimatedArrival`
  - `platform` (default to `null` if not assigned)
  - `operator`
  - `destination`
  - `journeyMinutes` (integer, calculated from scheduled times)
  - `isCancelled` (boolean)
  - `delayMinutes` (integer or `null` if cancelled)
- [ ] **2.7** Calculate `delayMinutes` as the difference in minutes between `estimatedDeparture` and `scheduledDeparture`; set to `0` if on time, `null` if cancelled
- [ ] **2.8** Set `estimatedDeparture` to the string `"On time"` when the service is running to schedule
- [ ] **2.9** Wrap the Darwin API call in a try/catch; on failure return HTTP 502 with body `{ "error": "Failed to fetch departure data" }`
- [ ] **2.10** Return the mapped array as a JSON response with HTTP 200 and `Content-Type: application/json`
- [ ] **2.11** Confirm the function never reads or returns `DARWIN_API_KEY` in the response body or headers

---

## Phase 3: Local Function Testing

- [ ] **3.1** Install Netlify CLI globally: `npm install -g netlify-cli`
- [ ] **3.2** Create a `.env` file in the project root containing `DARWIN_API_KEY=<your_token>` (add `.env` to `.gitignore` immediately)
- [ ] **3.3** Start the local dev server: `netlify dev`
- [ ] **3.4** Test the function with a valid request: `curl "http://localhost:8888/.netlify/functions/departures?from=KGX&to=EDB"` and confirm a JSON array is returned
- [ ] **3.5** Test missing parameter handling: `curl "http://localhost:8888/.netlify/functions/departures?from=KGX"` and confirm HTTP 400 is returned
- [ ] **3.6** Confirm the response shape matches the specification in `requirements.md` exactly (all fields present, correct types)
- [ ] **3.7** Commit working function: `git add . && git commit -m "feat: add departures netlify function"`

---

## Phase 4: Frontend — Page Structure (`index.html`)

- [ ] **4.1** Create the HTML boilerplate with `<!DOCTYPE html>`, `<head>`, and `<body>` sections
- [ ] **4.2** In `<head>`, set the page title to `"UK Rail Departure Board"` and add a `<meta charset="UTF-8">` and `<meta name="viewport">` tag
- [ ] **4.3** Add a `<header>` element containing:
  - An `<h1>` for the route title (e.g. "London King's Cross → Edinburgh") — populated dynamically by JS
  - A notification permission status message element (hidden by default)
- [ ] **4.4** Add a status banner `<div id="alert-banner">` below the header (hidden by default, shown when delays/cancellations are present)
- [ ] **4.5** Add a controls bar containing:
  - A "Last updated: —" `<span id="last-updated">`
  - A "Next refresh in: MM:SS" `<span id="countdown">`
  - A `<button id="refresh-btn">Refresh Now</button>`
- [ ] **4.6** Add a `<table id="departures-table">` with a `<thead>` containing columns: Departs, Arrives, Journey Time, Platform, Operator, Status
- [ ] **4.7** Add a `<tbody id="departures-body">` (empty — populated by JS)
- [ ] **4.8** Add an `<div id="error-message">` element (hidden by default) for displaying CRS validation errors

---

## Phase 5: Frontend — CSS Styling

- [ ] **5.1** Add `<style>` block in `<head>` (all CSS inline in the single file)
- [ ] **5.2** Style the overall page: clean sans-serif font, dark background or white background, comfortable padding
- [ ] **5.3** Style the table: full width, bordered cells, alternating row shading, readable font size
- [ ] **5.4** Add status colour styles:
  - `.status-on-time` — green text (`#2e7d32` or similar)
  - `.status-delayed` — amber text (`#f57c00` or similar)
  - `.status-cancelled` — red text (`#c62828` or similar)
- [ ] **5.5** Add `.row-cancelled` style: red text colour and `text-decoration: line-through` on all cells in the row
- [ ] **5.6** Style the alert banner: amber background, dark text, visible padding, hidden by default (`display: none`)
- [ ] **5.7** Style the error message block: red border, light red background, padding, hidden by default
- [ ] **5.8** Style the controls bar: flexbox layout, space between last-updated, countdown, and refresh button
- [ ] **5.9** Make the table horizontally scrollable on small screens using `overflow-x: auto` on a wrapper div

---

## Phase 6: Frontend — JavaScript Core

- [ ] **6.1** Add a `<script>` block at the bottom of `<body>` (all JS inline in the single file)
- [ ] **6.2** On page load, read `from` and `to` from `window.location.search` using `URLSearchParams`
- [ ] **6.3** Validate that both `from` and `to` are present and are exactly 3 uppercase letters; if not, show the error message element and halt execution
- [ ] **6.4** Create a CRS-to-station-name lookup object covering at minimum the 20 most common UK terminals (e.g. KGX → "London King's Cross", PAD → "London Paddington", EDB → "Edinburgh", MAN → "Manchester Piccadilly", etc.); fall back to displaying the raw CRS code if not found
- [ ] **6.5** Populate the `<h1>` route title using the resolved station names and the `→` separator
- [ ] **6.6** Write a `fetchDepartures()` async function that:
  - Calls `/.netlify/functions/departures?from=<from>&to=<to>`
  - On success, passes the JSON array to `renderTable()`
  - On failure, displays the error message element with the error text
- [ ] **6.7** Write a `renderTable(services)` function that:
  - Clears `<tbody id="departures-body">`
  - Iterates over the services array
  - Creates a `<tr>` for each service with the correct column values
  - Applies `.row-cancelled` class to cancelled rows
  - Applies the correct `.status-*` class to the Status cell
  - Displays platform as "TBC" if `null`
  - Formats `journeyMinutes` as "Xh Ym" (e.g. "4h 23m")
- [ ] **6.8** Write a `updateLastUpdated()` function that sets the `#last-updated` span to the current time formatted as `HH:MM:SS`
- [ ] **6.9** On initial page load, call `fetchDepartures()` and `updateLastUpdated()`

---

## Phase 7: Frontend — Auto-Refresh & Countdown

- [ ] **7.1** Define a `REFRESH_INTERVAL_MS` constant set to `900000` (15 minutes in milliseconds)
- [ ] **7.2** Define a `countdownSeconds` variable initialised to `900` (15 minutes in seconds)
- [ ] **7.3** Write a `startCountdown()` function that:
  - Resets `countdownSeconds` to 900
  - Uses `setInterval` (every 1 second) to decrement `countdownSeconds` and update the `#countdown` span formatted as `MM:SS`
  - When `countdownSeconds` reaches 0, calls `fetchDepartures()`, calls `updateLastUpdated()`, and resets the countdown
- [ ] **7.4** Call `startCountdown()` on initial page load
- [ ] **7.5** Add a click event listener to `#refresh-btn` that:
  - Calls `fetchDepartures()` immediately
  - Calls `updateLastUpdated()`
  - Resets `countdownSeconds` to 900 (restarting the countdown)

---

## Phase 8: Frontend — Browser Notifications

- [ ] **8.1** On page load, check `Notification.permission`:
  - If `"granted"`: proceed silently
  - If `"default"`: call `Notification.requestPermission()` and handle the result
  - If `"denied"`: show the notification permission message with text _"Enable notifications to receive delay alerts"_
- [ ] **8.2** Declare a `notifiedServices` Set at the top of the script block (module-level, persists across refreshes)
- [ ] **8.3** Write a `checkForAlerts(services)` function that:
  - Iterates over the services array
  - For each cancelled service, builds a key `"cancel-<scheduledDeparture>-<operator>"` and if not in `notifiedServices`, fires a notification and adds the key to the Set
  - For each delayed service (delayMinutes ≥ 15), builds a key `"delay-<scheduledDeparture>-<operator>-<delayBucket>"` where `delayBucket = Math.floor(delayMinutes / 5) * 5`, and if not in `notifiedServices`, fires a notification and adds the key to the Set
- [ ] **8.4** Implement notification firing: create a `new Notification(title, { body, icon })` where:
  - Cancellation title: `"🚫 Cancellation"`
  - Cancellation body: `"The [scheduledDeparture] [operator] service to [destination] has been cancelled"`
  - Delay title: `"⚠️ Delay"`
  - Delay body: `"The [scheduledDeparture] [operator] service is delayed by [delayMinutes] minutes"`
- [ ] **8.5** Set `notification.onclick = () => window.focus()` on each notification instance
- [ ] **8.6** Call `checkForAlerts(services)` at the end of `renderTable()` (after the table has been updated)
- [ ] **8.7** Only fire notifications if `Notification.permission === "granted"`

---

## Phase 9: Integration Testing (Local)

- [ ] **9.1** Start `netlify dev` and open `http://localhost:8888/?from=KGX&to=EDB` in a browser
- [ ] **9.2** Confirm the route title displays correctly (e.g. "London King's Cross → Edinburgh")
- [ ] **9.3** Confirm the departures table populates with up to 10 rows
- [ ] **9.4** Confirm all 6 columns are present and contain data
- [ ] **9.5** Confirm the "Last updated" timestamp updates on load and on manual refresh
- [ ] **9.6** Confirm the countdown timer counts down visibly
- [ ] **9.7** Click "Refresh Now" and confirm the table reloads and the countdown resets to 15:00
- [ ] **9.8** Test with an invalid URL: `http://localhost:8888/?from=XX&to=EDB` — confirm the error message appears and no table is shown
- [ ] **9.9** Test with missing parameters: `http://localhost:8888/` — confirm the error message appears
- [ ] **9.10** Open browser DevTools → Network tab and confirm `DARWIN_API_KEY` does not appear in any request or response
- [ ] **9.11** Manually trigger a notification by temporarily lowering the delay threshold in `checkForAlerts` to 0 minutes, refreshing, then restoring it
- [ ] **9.12** Confirm a second refresh with the same service does not fire a duplicate notification
- [ ] **9.13** Commit passing integration tests: `git add . && git commit -m "feat: complete frontend implementation"`

---

## Phase 10: Deployment to Netlify

- [ ] **10.1** Ensure `.env` is listed in `.gitignore` and has not been committed
- [ ] **10.2** Run `netlify login` and authenticate via browser
- [ ] **10.3** Run `netlify init` to create a new Netlify site linked to this project; accept defaults for build settings
- [ ] **10.4** Set the production environment variable: `netlify env:set DARWIN_API_KEY <your_token>`
- [ ] **10.5** Run `netlify deploy --prod` to deploy to production
- [ ] **10.6** Visit the live URL (printed by the CLI) with `?from=KGX&to=EDB` and confirm the app works identically to the local version
- [ ] **10.7** Verify in the Netlify dashboard under **Functions** that `departures` appears and shows invocation logs
- [ ] **10.8** Verify in the Netlify dashboard under **Environment Variables** that `DARWIN_API_KEY` is present and its value is masked

---

## Phase 11: Final Acceptance Criteria Check

Run through each item in the requirements acceptance criteria and mark it off:

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
- [ ] `DARWIN_API_KEY` is never exposed in frontend code or network responses
- [ ] The app deploys successfully to Netlify with `netlify deploy --prod`

---

## Notes for Claude Code

- **Do not** proceed to Phase 3 testing until Phase 2 is fully implemented — the function must be complete before it can be meaningfully tested.
- **Do not** hardcode the `DARWIN_API_KEY` value anywhere in source files. It must only ever be read from `process.env`.
- **Do not** add any additional npm dependencies beyond `darwin-ldb-node` without flagging this as a deviation from requirements.
- If `darwin-ldb-node` does not expose a method that matches the requirements exactly, inspect its documentation or source and adapt the mapping in Task 2.6 accordingly — but keep the output JSON shape identical to the specification.
- All JavaScript and CSS must remain in `index.html` as a single file. Do not create separate `.js` or `.css` files.
- If any task cannot be completed as specified, stop and report the blocker with a clear explanation before attempting a workaround.
