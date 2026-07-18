import { get, put } from '@vercel/blob';

const SNAPSHOT_PATH = 'token-pulse/latest.json';
const MAX_STORED_BYTES = 250_000;

export async function writeSnapshot(snapshot) {
  return put(SNAPSHOT_PATH, JSON.stringify(snapshot), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 0 });
}

export async function readSnapshot() {
  const result = await get(SNAPSHOT_PATH, { access: 'private' });
  if (!result?.stream) return null;
  const source = await new Response(result.stream).text();
  if (Buffer.byteLength(source, 'utf8') > MAX_STORED_BYTES) throw new Error('Stored snapshot is too large');
  return JSON.parse(source);
}
