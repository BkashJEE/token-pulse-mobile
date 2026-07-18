import { bearer, safeEqual } from '../../../lib/auth.js';
import { writeSnapshot } from '../../../lib/store.js';
import { normalizeSnapshot, readJsonBody } from '../../../lib/validation.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function handlePost(request, { write = writeSnapshot, now = Date.now } = {}) {
  if (!safeEqual(bearer(request), process.env.SYNC_TOKEN)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = await readJsonBody(request);
  if (parsed.error) return Response.json({ error: parsed.error }, { status: parsed.status });
  const snapshot = normalizeSnapshot(parsed.value);
  if (!snapshot) return Response.json({ error: 'Invalid snapshot' }, { status: 400 });
  try {
    await write({ ...snapshot, receivedAt: now() });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Snapshot storage unavailable' }, { status: 503 });
  }
}

export const POST = request => handlePost(request);
