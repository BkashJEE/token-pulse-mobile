import crypto from 'node:crypto';
import { safeEqual } from '../../../lib/auth.js';
import { createDeviceSession, sessionCookie, SESSION_DURATION_SECONDS } from '../../../lib/session.js';
import { readJsonBody } from '../../../lib/validation.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const responseHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

export async function handlePost(request, { now = Date.now, deviceId = crypto.randomUUID } = {}) {
  const parsed = await readJsonBody(request, 8192);
  if (parsed.error) return Response.json({ error: 'Invalid request' }, { status: parsed.status, headers: responseHeaders });
  const accessKey = parsed.value?.accessKey;
  if (!safeEqual(accessKey, process.env.DASHBOARD_TOKEN)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: responseHeaders });
  }

  try {
    const session = createDeviceSession({ secret: process.env.SESSION_SECRET, now: now(), deviceId: deviceId() });
    return new Response(null, {
      status: 204,
      headers: { ...responseHeaders, 'Set-Cookie': sessionCookie(session.token, SESSION_DURATION_SECONDS) },
    });
  } catch {
    return Response.json({ error: 'Session configuration unavailable' }, { status: 503, headers: responseHeaders });
  }
}

export const POST = request => handlePost(request);
