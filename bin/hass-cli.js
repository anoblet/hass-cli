#!/usr/bin/env node

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { readFileSync } from 'fs';

import {
  callService,
  checkApi,
  checkConfig,
  getCalendarEvents,
  getCalendars,
  getCameraProxy,
  getConfig,
  getDiscoveryInfo,
  getEntities,
  getEntityState,
  getErrorLog,
  getEvents,
  getHistory,
  getLogbook,
  getServices,
  getStates,
  renderTemplate,
  setState,
  triggerWebhook
} from '../src/api.js';

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

program
  .name('hass-cli')
  .description('A CLI tool to interact with the Home Assistant REST API')
  .version(packageJson.version);

// Calendar events command
program
  .command('calendar-events <entity_id>')
  .description('Get events for a calendar entity')
  .option('-e, --end <end>', 'End date for events (ISO format)')
  .option('-s, --start <start>', 'Start date for events (ISO format)')
  .action(async (entityId, options) => {
    await getCalendarEvents(entityId, options.start, options.end);
  });

// Calendars command
program
  .command('calendars')
  .description('Get all calendar entities from Home Assistant')
  .action(async () => {
    await getCalendars();
  });

// Call service command
program
  .command('call <domain> <service>')
  .description('Call a service in Home Assistant')
  .option('-d, --data <json>', 'JSON data to pass to the service', '{}')
  .option('-e, --entity-id <entity_id>', 'Entity ID to target')
  .action(async (domain, service, options) => {
    const serviceData = {};
    
    if (options.entityId) {
      serviceData.entity_id = options.entityId;
    }
    
    try {
      const additionalData = JSON.parse(options.data);
      await callService(domain, service, { ...serviceData, ...additionalData });
    } catch (err) {
      console.error(JSON.stringify({
        success: false,
        error: {
          message: `Error parsing JSON data: ${err.message}`
        }
      }, null, 2));
      process.exit(1);
    }
  });

// Camera proxy command
program
  .command('camera-proxy <entity_id>')
  .description('Get camera snapshot as base64')
  .option('-h, --height <height>', 'Height of the image')
  .option('-w, --width <width>', 'Width of the image')
  .action(async (entityId, options) => {
    const width = options.width ? parseInt(options.width, 10) : undefined;
    const height = options.height ? parseInt(options.height, 10) : undefined;
    await getCameraProxy(entityId, width, height);
  });

// Check API command
program
  .command('check')
  .description('Check the Home Assistant API')
  .action(async () => {
    await checkApi();
  });

// Check config command
program
  .command('check-config')
  .description('Validate Home Assistant configuration files')
  .action(async () => {
    await checkConfig();
  });

// Config command
program
  .command('config')
  .description('Get Home Assistant configuration')
  .action(async () => {
    await getConfig();
  });

// Discovery info command
program
  .command('discovery')
  .description('Get Home Assistant discovery info')
  .action(async () => {
    await getDiscoveryInfo();
  });

// Entities command
program
  .command('entities')
  .description('List all entities from Home Assistant')
  .option('-d, --domain <domain>', 'Filter entities by domain (e.g., light, switch)')
  .action(async (options) => {
    await getEntities(options.domain);
  });

// Error log command
program
  .command('error-log')
  .description('Get Home Assistant error log')
  .action(async () => {
    await getErrorLog();
  });

// Events command
program
  .command('events')
  .description('Get all events from Home Assistant')
  .action(async () => {
    await getEvents();
  });

// History command
program
  .command('history')
  .description('Get state history from Home Assistant')
  .option('-e, --entity-id <entity_id>', 'Entity ID to filter history for')
  .option('-n, --end-time <end_time>', 'End time for history')
  .option('-t, --timestamp <timestamp>', 'Start time for history')
  .action(async (options) => {
    await getHistory(options.timestamp, options.entityId, options.endTime);
  });

// Logbook command
program
  .command('logbook')
  .description('Get logbook entries from Home Assistant')
  .option('-e, --entity-id <entity_id>', 'Entity ID to filter logbook for')
  .option('-n, --end-time <end_time>', 'End time for logbook')
  .option('-t, --timestamp <timestamp>', 'Start time for logbook')
  .action(async (options) => {
    await getLogbook(options.timestamp, options.entityId, options.endTime);
  });

// Services command
program
  .command('services')
  .description('List all available services in Home Assistant')
  .option('-d, --domain <domain>', 'Filter services by domain')
  .action(async (options) => {
    await getServices(options.domain);
  });

// Set state command
program
  .command('set-state <entity_id> <state>')
  .description('Set the state of an entity')
  .option('-a, --attributes <json>', 'JSON attributes to include with the state', '{}')
  .action(async (entityId, state, options) => {
    try {
      const attributes = JSON.parse(options.attributes);
      await setState(entityId, state, attributes);
    } catch (err) {
      console.error(JSON.stringify({
        success: false,
        error: {
          message: `Error parsing JSON attributes: ${err.message}`
        }
      }, null, 2));
      process.exit(1);
    }
  });

// State command
program
  .command('state <entity_id>')
  .description('Get the state of a specific entity')
  .action(async (entityId) => {
    await getEntityState(entityId);
  });

// States command
program
  .command('states')
  .description('Get all states from Home Assistant')
  .action(async () => {
    await getStates();
  });

// Template command
program
  .command('template <template>')
  .description('Render a Home Assistant template')
  .action(async (template) => {
    await renderTemplate(template);
  });

// Webhook command
program
  .command('webhook <webhook_id>')
  .description('Trigger a Home Assistant webhook')
  .option('-d, --data <json>', 'JSON data to send with the webhook', '{}')
  .action(async (webhookId, options) => {
    try {
      const data = JSON.parse(options.data);
      await triggerWebhook(webhookId, data);
    } catch (err) {
      console.error(JSON.stringify({
        success: false,
        error: {
          message: `Error parsing JSON data: ${err.message}`
        }
      }, null, 2));
      process.exit(1);
    }
  });

program.parse(process.argv);
