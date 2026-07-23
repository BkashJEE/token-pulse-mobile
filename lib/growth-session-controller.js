import { createElement, useEffect, useState } from 'react';
import { closeGrowthSession, openGrowthSession, requestGrowth, resolveGrowthSurface } from './growth-ui.js';

export function GrowthSessionController({
  children,
  request = requestGrowth,
  open = openGrowthSession,
  close = closeGrowthSession,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [lockError, setLockError] = useState('');
  const [status, setStatus] = useState('checking');

  const load = async ({ afterUnlock = false } = {}) => {
    if (afterUnlock) setStatus('loading');
    const result = await request();
    if (result.kind === 'ready') {
      setData(result.data); setError(''); setStatus('ready'); return;
    }
    setData(null);
    if (result.kind === 'locked') { setStatus('locked'); return; }
    setStatus('unavailable');
  };

  const unlock = async accessKey => {
    setError(''); setStatus('unlocking');
    const result = await open(accessKey);
    if (result.kind === 'ready') { setData(result.data); setStatus('ready'); return; }
    setStatus('locked');
    setError(result.kind === 'rejected' && result.status === 401
      ? 'That access key is not valid.'
      : result.kind === 'rejected' && result.status === 429
        ? 'Too many attempts. Wait before trying again.'
        : 'Private session is unavailable.');
  };

  const lock = async () => {
    setData(null); setError(''); setLockError(''); setStatus('locking');
    const closed = await close();
    setStatus('locked');
    if (!closed) setLockError('The dashboard is hidden, but this browser’s session cookie could not be cleared. Retry before leaving this device.');
  };

  useEffect(() => { load(); }, []);

  return createElement(children, {
    data,
    error,
    lockError,
    status,
    surface: resolveGrowthSurface(status, Boolean(data)),
    load,
    unlock,
    lock,
  });
}
