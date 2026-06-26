const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('tennis_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

// Auth
export const authApi = {
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

// Matches
export const matchApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/matches/${q ? '?' + q : ''}`);
  },
  get: (id) => request(`/api/matches/${id}`),
  create: (data) => request('/api/matches/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/matches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/matches/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/api/matches/${id}/analyze`, { method: 'POST' }),
};

// Sessions
export const sessionApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/sessions/${q ? '?' + q : ''}`);
  },
  get: (id) => request(`/api/sessions/${id}`),
  create: (data) => request('/api/sessions/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/sessions/${id}`, { method: 'DELETE' }),
};

// Stats
export const statsApi = {
  overview: () => request('/api/stats/overview'),
  trends: (n = 10) => request(`/api/stats/trends?last_n=${n}`),
};
