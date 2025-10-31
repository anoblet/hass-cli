# Home Assistant CLI

A command-line interface for interacting with Home Assistant's REST API. This CLI tool provides JSON-formatted responses for all commands and supports all Home Assistant REST API endpoints.

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd cli
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your Home Assistant instance URL and long-lived access token:
   ```
   HASS_API_URL=http://your-home-assistant-instance:8123/api
   HASS_API_TOKEN=your_long_lived_access_token
   ```

   You can generate a long-lived access token from your Home Assistant profile page.

4. Link the CLI globally (optional):
   ```
   npm link
   ```

## Features

- Non-interactive command-line interface
- JSON-formatted responses for all commands
- Support for all Home Assistant REST API endpoints
- ES module structure with modern JavaScript features

## Response Format

All responses are formatted as JSON with this structure:

```json
{
  "success": true,
  "data": [actual API response]
}
```

Or in case of errors:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "status": 404,
    "statusText": "Not Found"
  }
}
```

Some Home Assistant services (for example `homeassistant.reload_all`) accept the request but close the
connection without returning a payload. When that happens the CLI will still respond with
`success: true`, echo the service metadata, and include a note that no response was received so the
result is assumed to be successful.

## Available Commands

### API Check and Information

#### Check API connection
```
hass-cli check
```

#### Get Home Assistant configuration
```
hass-cli config
```

#### Get discovery information
```
hass-cli discovery
```

#### Validate Home Assistant configuration
```
hass-cli check-config
```

### Entities and States

#### List all entities
```
hass-cli entities
```

Filter entities by domain:
```
hass-cli entities --domain light
```

#### Get state of a specific entity
```
hass-cli state light.living_room
```

#### List all states
```
hass-cli states
```

#### Set the state of an entity
```
hass-cli set-state light.living_room "on" --attributes '{"brightness": 255, "color_temp": 300}'
```

### Services

#### List all available services
```
hass-cli services
```

Filter services by domain:
```
hass-cli services --domain light
```

#### Call a service
Turn on a light:
```
hass-cli call light turn_on --entity-id light.living_room
```

Set brightness and color:
```
hass-cli call light turn_on --entity-id light.living_room --data '{"brightness": 255, "rgb_color": [255, 0, 0]}'
```

### Events

#### List all available events
```
hass-cli events
```

### History and Logs

#### Get state history
```
hass-cli history --entity-id light.living_room --timestamp "2025-04-10T00:00:00Z" --end-time "2025-04-12T23:59:59Z"
```

#### Get logbook entries
```
hass-cli logbook --entity-id light.living_room --timestamp "2025-04-10T00:00:00Z"
```

#### Get error log
```
hass-cli error-log
```

### Templates

#### Render a template
```
hass-cli template "{{ states('sensor.temperature') }}"
```

### Camera

#### Get camera snapshot (as base64)
```
hass-cli camera-proxy camera.front_door --width 640 --height 480
```

### Webhooks

#### Trigger a webhook
```
hass-cli webhook my_webhook_id --data '{"some_data": "value"}'
```

### Calendars

#### List all calendars
```
hass-cli calendars
```

#### Get calendar events
```
hass-cli calendar-events calendar.holidays --start "2025-04-12" --end "2025-05-12"
```

## Usage in Scripts

This CLI tool is designed to be used in scripts where JSON output can be processed. For example:

```bash
# Get the temperature and process it
TEMP=$(hass-cli state sensor.temperature | jq -r '.data.state')
if [ "$TEMP" -gt 25 ]; then
  # Turn on the AC
  hass-cli call climate set_temperature --entity-id climate.living_room --data '{"temperature": 23}'
fi
```

## Additional Information

For more information about Home Assistant's REST API, visit: https://developers.home-assistant.io/docs/api/rest/