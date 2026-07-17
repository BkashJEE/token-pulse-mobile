import { get, put } from '@vercel/blob';

const SNAPSHOT_PATH = 'token-pulse/latest.json';

export async function writeSnapshot(snapshot) {
  return put(SNAPSHOT_PATH, JSON.stringify(snapshot), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 0 });
}

export async function readSnapshot() {
  const result = await get(SNAPSHOT_PATH, { access: 'private' });
  if (!result?.stream) return null;
  return JSON.parse(await new Response(result.stream).text());
}
