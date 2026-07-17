'use client';

import { useCallback, useEffect, useState } from 'react';

const compact = value => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
const ago = value => { const seconds = Math.max(0, Math.round((Date.now() - value) / 1000)); return seconds < 60 ? 'just now' : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago` : `${Math.floor(seconds / 3600)}h ago`; };

function Login({ onUnlock, error }) {
  const [token, setToken] = useState('');
  return <main className="login"><div className="mark">⌁</div><h1>Token Pulse</h1><p>Your private agent telemetry, wherever you are.</p><form onSubmit={event => { event.preventDefault(); onUnlock(token); }}><input type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="Mobile access key" autoComplete="current-password"/><button>Open dashboard</button></form>{error && <small>{error}</small>}</main>;
}

export default function Dashboard() {
  const [token, setToken] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async value => {
    if (!value) return;
    const response = await fetch('/api/snapshot', { headers: { Authorization: `Bearer ${value}` }, cache: 'no-store' });
    if (!response.ok) { setError(response.status === 401 ? 'That access key is not valid.' : 'Desktop snapshot is not available yet.'); return; }
    setData(await response.json()); setError('');
  }, []);
  const unlock = value => { localStorage.setItem('token-pulse-access', value); setToken(value); load(value); };
  useEffect(() => { const saved = localStorage.getItem('token-pulse-access') || ''; setToken(saved); load(saved); }, [load]);
  useEffect(() => { if (!token) return; const timer = setInterval(() => load(token), 30_000); return () => clearInterval(timer); }, [token, load]);
  if (!data) return <Login onUnlock={unlock} error={error}/>;
  const stale = Date.now() - (data.receivedAt || data.fetchedAt) > 20 * 60_000;
  const hardware = data.hardware || {};
  const sessions = data.platforms.flatMap(platform => (platform.activeSessionList || []).map(session => ({ ...session, platform: platform.label, platformId: platform.id }))).sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 8);
  return <main className="shell">
    <header><div><span className={`pulse ${stale ? 'stale' : ''}`}></span><b>Token Pulse</b></div><span>{stale ? 'STALE' : 'LIVE'}</span></header>
    <section className="hero"><small>TOKENS TODAY</small><strong>{compact(data.total)}</strong><p>{data.sessions} sessions across {data.platforms.filter(item => item.connected).length} runtimes · synced {ago(data.receivedAt || data.fetchedAt)}</p></section>
    <section className="split"><article><small>FRESH INPUT</small><strong>{compact(data.input)}</strong></article><article><small>CACHE READ</small><strong>{compact(data.cacheRead)}</strong></article><article><small>OUTPUT</small><strong>{compact(data.output)}</strong></article></section>
    <section className="platforms">{data.platforms.map(platform => <article key={platform.id}><div><i className={platform.id}></i><b>{platform.label}</b><em>{platform.active} active</em></div><strong>{compact(platform.total)}</strong><span>{platform.quota?.available ? `${Math.round(platform.quota.remainingPercent)}% quota left` : `${platform.sessions} sessions`}</span></article>)}</section>
    <section className="readiness"><div><small>AGENT READINESS</small><b>{hardware.recommendation?.mode || 'UNKNOWN'}</b></div><div><strong>{hardware.recommendation?.model || 'Waiting for scan'}</strong><span>{hardware.cpu?.utilization || 0}% CPU · {hardware.memory?.utilization || 0}% RAM · {hardware.gpu?.vramGb || 0} GB VRAM</span></div></section>
    <section className="sessions"><div className="section-title"><b>Active sessions</b><span>Last 20 minutes</span></div>{sessions.map(session => <article key={`${session.platformId}-${session.id}`}><i className={session.platformId}></i><div><strong>{session.title || 'Untitled session'}</strong><span>{session.platform} · {ago(session.updatedAt)}</span></div><em>{compact(session.total)}</em></article>)}</section>
    <footer><button onClick={() => load(token)}>Refresh now</button><button className="ghost" onClick={() => { localStorage.removeItem('token-pulse-access'); setData(null); setToken(''); }}>Lock</button></footer>
  </main>;
}
