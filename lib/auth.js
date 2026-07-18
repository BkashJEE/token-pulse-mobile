import crypto from 'node:crypto';

export function safeEqual(value, expected) {
  if (typeof value !== 'string' || typeof expected !== 'string' || !value || !expected || value.length > 4096 || expected.length > 4096) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function bearer(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer[\t ]+([^\s].*)$/i.exec(header);
  return match && !/[\r\n]/.test(match[1]) ? match[1] : '';
}
