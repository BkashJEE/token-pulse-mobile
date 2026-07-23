export function resolveGrowthSurface(status, hasData) {
  if (hasData && status === 'ready') return 'dashboard';
  if (status === 'checking' || status === 'unlocking' || status === 'loading') return 'loading';
  if (status === 'unavailable') return 'unavailable';
  return 'locked';
}

export async function requestGrowth(fetcher = fetch) {
  try {
    const response = await fetcher('/api/growth', { cache: 'no-store', credentials: 'same-origin' });
    if (response.status === 401) return { kind: 'locked' };
    if (!response.ok) return { kind: 'unavailable' };
    return { kind: 'ready', data: await response.json() };
  } catch {
    return { kind: 'unavailable' };
  }
}

export async function closeGrowthSession(fetcher = fetch) {
  try {
    const response = await fetcher('/api/session/logout', { method: 'POST', credentials: 'same-origin' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function openGrowthSession(accessKey, fetcher = fetch) {
  try {
    const response = await fetcher('/api/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessKey }),
    });
    if (!response.ok) return { kind: 'rejected', status: response.status };
    return requestGrowth(fetcher);
  } catch {
    return { kind: 'unavailable' };
  }
}
