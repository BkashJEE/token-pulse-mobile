import { bearer, safeEqual } from '../../../lib/auth.js';
import { readRequestSession } from '../../../lib/session.js';
import { readSnapshot } from '../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function handleGet(request, { read = readSnapshot } = {}) {
  const hasSession = Boolean(readRequestSession(request));
  const hasLegacyNativeAccess = safeEqual(bearer(request), process.env.DASHBOARD_TOKEN);
  if (!hasSession && !hasLegacyNativeAccess) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let snapshot;
  try { snapshot = await read(); } catch { return Response.json({ error: 'Snapshot storage unavailable' }, { status: 503 }); }
  if (!snapshot) return Response.json({ error: 'Waiting for desktop sync' }, { status: 404 });
  return Response.json(snapshot, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export const GET = request => handleGet(request);
