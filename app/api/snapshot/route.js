import { bearer, safeEqual } from '../../../lib/auth';
import { readSnapshot } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!safeEqual(bearer(request), process.env.DASHBOARD_TOKEN)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const snapshot = await readSnapshot().catch(() => null);
  if (!snapshot) return Response.json({ error: 'Waiting for desktop sync' }, { status: 404 });
  return Response.json(snapshot, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
