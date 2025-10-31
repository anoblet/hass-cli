import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Constants
const API_TOKEN = process.env.HASS_API_TOKEN;
const API_URL = process.env.HASS_API_URL;

// Create axios instance with common config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Error handling helper that returns JSON
const handleApiError = (error) => {
  let errorResponse = {
    success: false,
    error: {
      message: error.message
    }
  };

  if (error.response) {
    errorResponse.error.status = error.response.status;
    errorResponse.error.statusText = error.response.statusText;
    if (error.response.data) {
      errorResponse.error.data = error.response.data;
    }
  } else if (error.request) {
    errorResponse.error.type = 'network';
    errorResponse.error.message = 'No response received from Home Assistant';
  }

  // Check for common configuration issues
  if (!API_URL || !API_TOKEN) {
    errorResponse.error.config = {
      missing: []
    };
    if (!API_URL) errorResponse.error.config.missing.push('HASS_API_URL');
    if (!API_TOKEN) errorResponse.error.config.missing.push('HASS_API_TOKEN');
  }

  console.log(JSON.stringify(errorResponse, null, 2));
  return errorResponse;
};

// Output JSON response
const outputJson = (data, metadata = {}) => {
  const response = {
    success: true,
    ...metadata,
    data
  };
  console.log(JSON.stringify(response, null, 2));
  return response;
};

const TRANSIENT_NO_RESPONSE_CODES = new Set(['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT']);

const shouldAssumeNoResponseSuccess = (error) => {
  if (!error || error.response || !error.request) {
    return false;
  }

  if (error.code && TRANSIENT_NO_RESPONSE_CODES.has(error.code)) {
    return true;
  }

  const message = (error.message || '').toLowerCase();

  if (message.includes('socket hang up')) {
    return true;
  }

  return false;
};

// API Endpoints Implementation

// GET /api/
async function checkApi() {
  try {
    const response = await api.get('/');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/config
async function getConfig() {
  try {
    const response = await api.get('/config');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/events
async function getEvents() {
  try {
    const response = await api.get('/events');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/services
async function getServices(domain) {
  try {
    const response = await api.get('/services');
    
    if (domain) {
      const filteredData = {};
      if (response.data[domain]) {
        filteredData[domain] = response.data[domain];
      }
      return outputJson(filteredData, { domain });
    }
    
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/services/<domain>/<service>
async function callService(domain, service, data = {}) {
  try {
    const response = await api.post(`/services/${domain}/${service}`, data);
    return outputJson(response.data, { service: `${domain}.${service}`, serviceData: data });
  } catch (error) {
    if (shouldAssumeNoResponseSuccess(error)) {
      return outputJson(null, {
        service: `${domain}.${service}`,
        serviceData: data,
        note: 'No response received from Home Assistant; assuming success'
      });
    }
    return handleApiError(error);
  }
}

// GET /api/history/period/<timestamp>
async function getHistory(timestamp, filterEntityId, endTime) {
  try {
    let url = `/history/period${timestamp ? `/${timestamp}` : ''}`;
    
    const params = {};
    if (filterEntityId) {
      params.filter_entity_id = filterEntityId;
    }
    if (endTime) {
      params.end_time = endTime;
    }
    
    const response = await api.get(url, { params });
    return outputJson(response.data, { 
      timestamp, 
      filterEntityId: filterEntityId || null,
      endTime: endTime || null
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/logbook/<timestamp>
async function getLogbook(timestamp, entityId, endTime) {
  try {
    let url = `/logbook${timestamp ? `/${timestamp}` : ''}`;
    
    const params = {};
    if (entityId) {
      params.entity = entityId;
    }
    if (endTime) {
      params.end_time = endTime;
    }
    
    const response = await api.get(url, { params });
    return outputJson(response.data, {
      timestamp,
      entityId: entityId || null,
      endTime: endTime || null
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/states
async function getStates() {
  try {
    const response = await api.get('/states');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/states/<entity_id>
async function getEntityState(entityId) {
  try {
    const response = await api.get(`/states/${entityId}`);
    return outputJson(response.data, { entityId });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/states/<entity_id>
async function setState(entityId, state, attributes = {}) {
  try {
    const response = await api.post(`/states/${entityId}`, {
      state,
      attributes
    });
    return outputJson(response.data, { entityId, state, attributes });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/error_log
async function getErrorLog() {
  try {
    const response = await api.get('/error_log');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/camera_proxy/<camera entity_id>
async function getCameraProxy(entityId, width, height) {
  try {
    const params = {};
    if (width) params.width = width;
    if (height) params.height = height;
    
    const response = await api.get(`/camera_proxy/${entityId}`, { 
      params,
      responseType: 'arraybuffer'
    });
    
    // Convert binary data to base64 for JSON output
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    return outputJson({
      image: base64Image,
      contentType: response.headers['content-type']
    }, { entityId, width: width || null, height: height || null });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/template
async function renderTemplate(template) {
  try {
    const response = await api.post('/template', { template });
    return outputJson({ rendered: response.data }, { template });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/entities
async function getEntities(domain) {
  try {
    const response = await api.get('/states');
    let entities = response.data;
    
    if (domain) {
      entities = entities.filter(entity => entity.entity_id.startsWith(`${domain}.`));
    }
    
    return outputJson(entities, { domain: domain || null });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/webhook/<webhook_id>
async function triggerWebhook(webhookId, data = {}) {
  try {
    const response = await api.post(`/webhook/${webhookId}`, data);
    return outputJson(response.data, { webhookId });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/discovery_info
async function getDiscoveryInfo() {
  try {
    const response = await api.get('/discovery_info');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/calendars
async function getCalendars() {
  try {
    const response = await api.get('/calendars');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/calendars/<calendar_entity_id>
async function getCalendarEvents(entityId, start, end) {
  try {
    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    
    const response = await api.get(`/calendars/${entityId}`, { params });
    return outputJson(response.data, { 
      entityId, 
      start: start || null, 
      end: end || null 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/config/core/check_config
async function checkConfig() {
  try {
    const response = await api.post('/config/core/check_config');
    return outputJson(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export {
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
};
