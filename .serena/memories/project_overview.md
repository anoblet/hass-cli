# Project Overview

- **Purpose**: Command-line interface for interacting with Home Assistant's REST API, returning JSON for automation-friendly usage.
- **Tech Stack**: Node.js ES modules (JavaScript) using `axios` for HTTP, `commander` for CLI parsing, and `dotenv` for configuration.
- **Structure**:
  - `bin/hass-cli.js`: Commander CLI definitions connecting user commands to API functions.
  - `src/api.js`: Axios wrapper functions exporting REST endpoints and shared helpers (`outputJson`, `handleApiError`).
- **Configuration**: Requires `.env` with `HASS_API_URL` and `HASS_API_TOKEN` (long-lived access token) loaded via `dotenv`.
- **Output Contract**: CLI commands print JSON `{ success: true, data, ... }` on success and `{ success: false, error }` on failure to stdout.
- **Notable Behaviour**: Commands perform logging by stringifying JSON responses; errors include HTTP metadata and missing config hints.