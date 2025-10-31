# Task Completion Checklist

1. Ensure `.env` contains valid `HASS_API_URL` and `HASS_API_TOKEN` before manual testing.
2. Run relevant CLI command via `npm start -- <command>` or `node bin/hass-cli.js ...` to validate behaviour.
3. Verify JSON output matches `{ success: true|false, ... }` contract.
4. Update README command documentation when CLI behaviour changes.
5. No automated tests exist; rely on manual execution and linting via editor conventions.