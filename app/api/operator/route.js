import { isLocalDashboardRequest, readRequestSession } from '../../../lib/session.js';
import { operatorWorkbench } from '../../../lib/operator-data.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };

export async function handleGet(request, { localAccess = isLocalDashboardRequest } = {}) {
  const isLocal = localAccess(request);
  if (!isLocal && !readRequestSession(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  return Response.json(isLocal ? { ...operatorWorkbench, accessMode: 'local' } : operatorWorkbench, { status: 200, headers });
}

export const GET = request => handleGet(request);
