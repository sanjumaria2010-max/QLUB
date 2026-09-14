const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: ({ email, password } = {}) =>
    req("/auth/login", {
      method: "POST",
      body: JSON.stringify(email ? { email, password } : { password }),
    }),
  restaurants: () => req("/restaurants"),
  neighborhoods: () => req("/neighborhoods"),
  vocSync: ({ restaurant, query } = {}) =>
    req("/voice-of-customer/sync", {
      method: "POST",
      body: JSON.stringify({ restaurant: restaurant || null, query: query || null }),
    }),
  vocHistory: (limit = 10) => req(`/voice-of-customer/history?limit=${limit}`),
  generateOutreach: ({ restaurant, pain_points, tone } = {}) =>
    req("/outreach/generate", {
      method: "POST",
      body: JSON.stringify({ restaurant, pain_points: pain_points || null, tone: tone || "confident-friendly" }),
    }),
};
