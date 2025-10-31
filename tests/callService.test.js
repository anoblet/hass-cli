import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import test from 'node:test';

const ORIGINAL_URL = process.env.HASS_API_URL;
const ORIGINAL_TOKEN = process.env.HASS_API_TOKEN;

const ASSUMED_SUCCESS_NOTE = 'No response received from Home Assistant; assuming success';

test('callService treats a closed connection with no payload as success', async (t) => {
  let handled = false;
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/services/homeassistant/reload_all') {
      req.resume();
      req.on('end', () => {
        handled = true;
        res.socket.destroy();
      });
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  server.listen(0);

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    process.env.HASS_API_URL = ORIGINAL_URL;
    process.env.HASS_API_TOKEN = ORIGINAL_TOKEN;
  });

  await once(server, 'listening');
  const { port } = server.address();

  process.env.HASS_API_URL = `http://127.0.0.1:${port}/api`;
  process.env.HASS_API_TOKEN = 'test-token';

  const modulePath = new URL('../src/api.js', import.meta.url);
  const { callService } = await import(`${modulePath}?${Date.now()}`);

  const logged = [];
  const originalLog = console.log;
  console.log = (message, ...rest) => {
    logged.push(message);
  };

  try {
    const result = await callService('homeassistant', 'reload_all');

    assert.equal(result.success, true);
    assert.equal(result.service, 'homeassistant.reload_all');
    assert.equal(result.data, null);
    assert.equal(result.note, ASSUMED_SUCCESS_NOTE);
    assert.equal(handled, true);

    const printed = JSON.parse(logged.at(-1));
    assert.equal(printed.success, true);
    assert.equal(printed.service, 'homeassistant.reload_all');
    assert.equal(printed.note, ASSUMED_SUCCESS_NOTE);
  } finally {
    console.log = originalLog;
  }
});
