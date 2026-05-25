import axios from 'axios';

const isDev = import.meta.env.DEV;

function logRequest(label, config) {
  if (!isDev) return;
  const { method, baseURL, url, params, data } = config;
  const fullUrl = `${baseURL || ''}${url}`;
  console.groupCollapsed(
    `%c[${label}] %c${method.toUpperCase()} %c${fullUrl}`,
    'color: #1a73e8; font-weight: bold',
    'color: #f9ab00; font-weight: bold',
    'color: #5f6368'
  );
  if (params && Object.keys(params).length) console.log('Params:', params);
  if (data) console.log('Body:', data);
  console.log('Headers:', { ...config.headers });
  console.groupEnd();
}

function logResponse(label, response) {
  if (!isDev) return;
  const { status, config, data } = response;
  const fullUrl = `${config.baseURL || ''}${config.url}`;
  const duration = response.config._startTime
    ? `${Date.now() - response.config._startTime}ms`
    : '';
  console.groupCollapsed(
    `%c[${label}] %c${status} %c${config.method.toUpperCase()} %c${fullUrl} %c${duration}`,
    'color: #34a853; font-weight: bold',
    `color: ${status < 400 ? '#34a853' : '#ea4335'}; font-weight: bold`,
    'color: #f9ab00',
    'color: #5f6368',
    'color: #9aa0a6'
  );
  console.log('Response:', data);
  console.groupEnd();
}

function logError(label, error) {
  if (!isDev) return;
  const config = error.config || {};
  const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
  const status = error.response?.status || 'NETWORK';
  const duration = config._startTime ? `${Date.now() - config._startTime}ms` : '';
  console.groupCollapsed(
    `%c[${label}] %c${status} %c${(config.method || '').toUpperCase()} %c${fullUrl} %c${duration}`,
    'color: #ea4335; font-weight: bold',
    'color: #ea4335; font-weight: bold',
    'color: #f9ab00',
    'color: #5f6368',
    'color: #9aa0a6'
  );
  if (error.response?.data) console.log('Error data:', error.response.data);
  else console.log('Error:', error.message);
  console.groupEnd();
}

// CMS API client — talks to the CMS backend
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_CMS_API_URL || 'http://localhost:8001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auth API client — talks to the Auth Service
const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Booking API client — talks to the Booking Service.
// Booking only accepts X-Project-Id (not X-Project-Key), so we send the public_id under that header.
const bookingClient = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_API_URL || 'http://localhost:8002/api',
  headers: { 'Content-Type': 'application/json' },
});

// --- Interceptors for CMS client ---
apiClient.interceptors.request.use((config) => {
  config._startTime = Date.now();
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const projectKey = localStorage.getItem('active_project_key');
  if (projectKey) config.headers['X-Project-Key'] = projectKey;

  // For FormData bodies, drop the JSON Content-Type so axios sets
  // `multipart/form-data; boundary=...` itself. Without this Laravel never
  // parses $_FILES and `$request->file('files')` is empty.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      }
    }
  }

  logRequest('CMS', config);
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => { logResponse('CMS', res); return res; },
  async (err) => {
    logError('CMS', err);
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await authClient.post('/refresh', { refresh_token: refreshToken });
        const newToken = res.data.access_token || res.data.refresh_token;

        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
        throw new Error('No token in refresh response');
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// --- Interceptors for Auth client ---
authClient.interceptors.request.use((config) => {
  config._startTime = Date.now();
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  logRequest('AUTH', config);
  return config;
});

authClient.interceptors.response.use(
  (res) => { logResponse('AUTH', res); return res; },
  (err) => { logError('AUTH', err); return Promise.reject(err); }
);

// --- Interceptors for Booking client ---
// Mirrors the CMS interceptor: attach bearer token, attach project header (as X-Project-Id
// since Booking's ResolveProject middleware only reads that header), and refresh on 401.
bookingClient.interceptors.request.use((config) => {
  config._startTime = Date.now();
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const projectKey = localStorage.getItem('active_project_key');
  if (projectKey) config.headers['X-Project-Id'] = projectKey;

  logRequest('BOOKING', config);
  return config;
});

bookingClient.interceptors.response.use(
  (res) => { logResponse('BOOKING', res); return res; },
  async (err) => {
    logError('BOOKING', err);
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return bookingClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await authClient.post('/refresh', { refresh_token: refreshToken });
        const newToken = res.data.access_token || res.data.refresh_token;

        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return bookingClient(originalRequest);
        }
        throw new Error('No token in refresh response');
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export { authClient, bookingClient };
export default apiClient;
