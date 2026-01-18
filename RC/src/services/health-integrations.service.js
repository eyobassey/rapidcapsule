import http from './http';

const BASE_URL = '/health-integrations';

export const healthIntegrationsService = {
  // Get all user integrations
  getUserIntegrations() {
    return http.get(BASE_URL);
  },

  // Get integration status for a specific provider
  getIntegrationStatus(provider) {
    return http.get(`${BASE_URL}/status/${provider}`);
  },

  // Connect a new integration
  connectIntegration(data) {
    return http.post(`${BASE_URL}/connect`, data);
  },

  // Handle OAuth callbacks
  handleGoogleFitCallback(code, state) {
    return http.post(`${BASE_URL}/google-fit/callback`, { code, state });
  },

  handleSamsungHealthCallback(code, state) {
    return http.post(`${BASE_URL}/samsung-health/callback`, { code, state });
  },

  handleAppleHealthCallback(authData) {
    return http.post(`${BASE_URL}/apple-health/callback`, { authData });
  },

  // Sync health data
  syncHealthData(provider, data) {
    return http.post(`${BASE_URL}/sync/${provider}`, data);
  },

  // Get health data
  getHealthData(filters = {}) {
    return http.get(`${BASE_URL}/data`, { params: filters });
  },

  // Update sync settings
  updateSyncSettings(provider, settings) {
    return http.patch(`${BASE_URL}/${provider}/settings`, settings);
  },

  // Disconnect integration
  disconnectIntegration(provider) {
    return http.delete(`${BASE_URL}/${provider}`);
  },

  // Push health data to vitals
  pushToVitals(dataIds) {
    return http.post(`${BASE_URL}/push-to-vitals`, { dataIds });
  },
};

export default healthIntegrationsService;