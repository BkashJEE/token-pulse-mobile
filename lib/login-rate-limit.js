const WINDOW_MS = 15 * 60 * 1000;
const PER_CLIENT_LIMIT = 8;
const GLOBAL_LIMIT = 64;
const MAX_CLIENTS = 2048;

function retryAfterSeconds(resetAt, now) {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function createLoginRateLimiter({
  windowMs = WINDOW_MS,
  perClientLimit = PER_CLIENT_LIMIT,
  globalLimit = GLOBAL_LIMIT,
  maxClients = MAX_CLIENTS,
} = {}) {
  const clients = new Map();
  let globalWindow = { count: 0, resetAt: 0 };

  function activeWindow(entry, now) {
    return entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + windowMs };
  }

  function prune(now) {
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key);
    }
    while (clients.size >= maxClients) clients.delete(clients.keys().next().value);
  }

  return {
    check(clientKey, now = Date.now()) {
      globalWindow = activeWindow(globalWindow, now);
      const client = activeWindow(clients.get(clientKey), now);
      if (globalWindow.count >= globalLimit) {
        return { allowed: false, scope: 'global', retryAfter: retryAfterSeconds(globalWindow.resetAt, now) };
      }
      if (client.count >= perClientLimit) {
        return { allowed: false, scope: 'client', retryAfter: retryAfterSeconds(client.resetAt, now) };
      }
      return { allowed: true };
    },
    recordFailure(clientKey, now = Date.now()) {
      prune(now);
      globalWindow = activeWindow(globalWindow, now);
      const client = activeWindow(clients.get(clientKey), now);
      globalWindow.count += 1;
      client.count += 1;
      clients.set(clientKey, client);
    },
    clearClient(clientKey) {
      clients.delete(clientKey);
    },
  };
}

export function requestClientKey(request) {
  const raw = request.headers.get('x-vercel-forwarded-for')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')
    || 'unknown';
  const candidate = raw.split(',', 1)[0].trim();
  return candidate && candidate.length <= 64 && /^[0-9a-f:.]+$/i.test(candidate) ? candidate : 'unknown';
}

export const loginRateLimiter = createLoginRateLimiter();
