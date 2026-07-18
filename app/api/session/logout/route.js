import { clearSessionCookie } from '../../../../lib/session.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function handlePost() {
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': clearSessionCookie(),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const POST = () => handlePost();
