# Style and Conventions

- **Language**: Modern JavaScript (ES modules). Avoid CommonJS patterns.
- **Imports/Exports**: Use `import ... from` syntax and named exports from `src/api.js`.
- **Formatting**: 2-space indentation, semicolons present, single quotes for strings.
- **Responses**: Always return `success: true/false` JSON via helper functions; print `JSON.stringify(..., null, 2)` to stdout.
- **Error Handling**: Use `handleApiError` helper; CLI-level parsing errors manually print structured JSON and call `process.exit(1)`.
- **Environment**: Access `.env` via `dotenv.config()` early in execution.
- **Data Validation**: Minimal; rely on Home Assistant API responses and explicit JSON parsing with try/catch in CLI.