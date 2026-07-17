import { bearer, safeEqual } from '../../../lib/auth';
import { writeSnapshot } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!safeEqual(bearer(request), process.env.SYNC_TOKEN)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || body.schema !== 1 || !Number.isFinite(body.total) || !Array.isArray(body.platforms)) return Response.json({ error: 'Invalid snapshot' }, { status: 400 });
  const encoded = JSON.stringify(body);
  if (encoded.length > 250_000) return Response.json({ error: 'Snapshot too large' }, { status: 413 });
  await writeSnapshot({ ...body, receivedAt: Date.now() });
  return Response.json({ ok: true });
}
