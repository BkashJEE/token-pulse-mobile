export const MAX_SNAPSHOT_BYTES = 250_000;
const MAX_PLATFORMS = 20;
const MAX_SESSIONS_PER_PLATFORM = 12;

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const nonNegative = value => Math.max(0, finite(value));
const integer = value => Math.max(0, Math.trunc(finite(value)));
const text = (value, max, fallback = '') => typeof value === 'string' ? value.slice(0, max) : fallback;
const sourceProvenance = value => ['JSONL', 'Trajectory log', 'SQLite', 'JSON mirror'].includes(value) ? value : 'Unknown source';
const sourceLiveliness = value => ({
  state: ['live', 'idle', 'stale', 'ready', 'offline', 'unknown'].includes(value?.state) ? value.state : 'unknown',
  label: text(value?.label, 12, 'UNKNOWN'),
  ageMs: value?.ageMs == null ? null : nonNegative(value.ageMs),
});

export async function readJsonBody(request, maxBytes = MAX_SNAPSHOT_BYTES) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return { error: 'Snapshot too large', status: 413 };
  if (!request.body) return { error: 'Invalid JSON', status: 400 };
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return { error: 'Snapshot too large', status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { value: JSON.parse(source) };
  } catch {
    return { error: 'Invalid JSON', status: 400 };
  }
}

export function normalizeSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== 1 || !Number.isFinite(value.total) || !Array.isArray(value.platforms)) return null;
  if (value.platforms.length > MAX_PLATFORMS) return null;
  const platforms = [];
  for (const platform of value.platforms) {
    if (!platform || typeof platform !== 'object' || !Array.isArray(platform.activeSessionList || [])) return null;
    const sourceSessions = platform.activeSessionList || [];
    if (sourceSessions.length > MAX_SESSIONS_PER_PLATFORM) return null;
    platforms.push({
      id: text(platform.id, 60, 'unknown'),
      label: text(platform.label, 80, 'Unknown'),
      dataSource: sourceProvenance(platform.dataSource),
      liveliness: sourceLiveliness(platform.liveliness),
      connected: platform.connected === true,
      total: nonNegative(platform.total),
      sessions: integer(platform.sessions),
      active: integer(platform.active),
      latestAt: nonNegative(platform.latestAt),
      quota: platform.quota?.available === true ? {
        available: true,
        remainingPercent: Math.min(100, nonNegative(platform.quota.remainingPercent)),
        usedPercent: Math.min(100, nonNegative(platform.quota.usedPercent)),
        resetsAt: Number.isFinite(platform.quota.resetsAt) ? platform.quota.resetsAt : null,
        label: text(platform.quota.label, 120) || undefined,
      } : { available: false, remainingPercent: null, usedPercent: null, resetsAt: null },
      activeSessionList: sourceSessions.map(session => ({
        id: text(session?.id, 120),
        title: text(session?.title, 240, 'Untitled session'),
        model: session?.model == null ? null : text(session.model, 120),
        updatedAt: nonNegative(session?.updatedAt),
        total: nonNegative(session?.total),
      })),
    });
  }
  const hardware = value.hardware && typeof value.hardware === 'object' ? {
    fetchedAt: nonNegative(value.hardware.fetchedAt),
    pressure: text(value.hardware.pressure, 20, 'UNKNOWN'),
    cpu: { name: text(value.hardware.cpu?.name, 160, 'CPU'), logicalCores: integer(value.hardware.cpu?.logicalCores), utilization: Math.min(100, nonNegative(value.hardware.cpu?.utilization)) },
    memory: { totalGb: nonNegative(value.hardware.memory?.totalGb), availableGb: nonNegative(value.hardware.memory?.availableGb), usedGb: nonNegative(value.hardware.memory?.usedGb), utilization: Math.min(100, nonNegative(value.hardware.memory?.utilization)) },
    gpu: { name: text(value.hardware.gpu?.name, 160, 'GPU'), vramGb: nonNegative(value.hardware.gpu?.vramGb), usedVramGb: value.hardware.gpu?.usedVramGb == null ? null : nonNegative(value.hardware.gpu.usedVramGb), utilization: value.hardware.gpu?.utilization == null ? null : Math.min(100, nonNegative(value.hardware.gpu.utilization)), source: text(value.hardware.gpu?.source, 40) },
    recommendation: { mode: text(value.hardware.recommendation?.mode, 40, 'UNKNOWN'), model: text(value.hardware.recommendation?.model, 160, 'Unknown'), fit: text(value.hardware.recommendation?.fit, 160), route: text(value.hardware.recommendation?.route, 500), reason: text(value.hardware.recommendation?.reason, 240) },
  } : null;
  const alerts = (Array.isArray(value.alerts) ? value.alerts : []).slice(0, 20).map(alert => ({
    id: text(alert?.id, 120), severity: alert?.severity === 'critical' ? 'critical' : 'warning', type: text(alert?.type, 60),
    title: text(alert?.title, 160, 'Token Pulse alert'), detail: text(alert?.detail, 300), action: text(alert?.action, 300),
    platformId: alert?.platformId == null ? null : text(alert.platformId, 60), createdAt: nonNegative(alert?.createdAt),
  }));
  return {
    schema: 1,
    fetchedAt: nonNegative(value.fetchedAt),
    period: text(value.period, 40, 'Unknown'),
    dateKey: text(value.dateKey, 20),
    total: nonNegative(value.total), input: nonNegative(value.input), output: nonNegative(value.output), cacheRead: nonNegative(value.cacheRead),
    cacheHitRate: Math.min(1, nonNegative(value.cacheHitRate)),
    activeSessions: integer(value.activeSessions), sessions: integer(value.sessions), platforms, hardware, alerts,
  };
}
