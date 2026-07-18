'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [tab, setTab] = useState('overview');
  const requestState = useRef({ sequence: 0, controller: null });
  const load = useCallback(async value => {
    if (!value) return;
    const sequence = ++requestState.current.sequence;
    requestState.current.controller?.abort();
    const controller = new AbortController();
    requestState.current.controller = controller;
    try {
      const response = await fetch('/api/snapshot', { headers: { Authorization: `Bearer ${value}` }, cache: 'no-store', signal: controller.signal });
      if (sequence !== requestState.current.sequence) return;
      if (!response.ok) { setError(response.status === 401 ? 'That access key is not valid.' : response.status === 503 ? 'Snapshot storage is temporarily unavailable.' : 'Desktop snapshot is not available yet.'); return; }
      const next = await response.json();
      if (sequence === requestState.current.sequence) { setData(next); setError(''); }
    } catch (loadError) {
      if (loadError?.name !== 'AbortError' && sequence === requestState.current.sequence) setError('Token Pulse could not reach the server.');
    }
  }, []);
  const unlock = value => { localStorage.setItem('token-pulse-access', value); setToken(value); load(value); };
  useEffect(() => { const saved = localStorage.getItem('token-pulse-access') || ''; setToken(saved); load(saved); }, [load]);
  useEffect(() => { if (!token) return; const timer = setInterval(() => load(token), 30_000); return () => { clearInterval(timer); requestState.current.controller?.abort(); }; }, [token, load]);
  if (!data) return <Login onUnlock={unlock} error={error}/>;
  const stale = Date.now() - (data.receivedAt || data.fetchedAt) > 20 * 60_000;
  const hardware = data.hardware || {};
  const sessions = data.platforms.flatMap(platform => (platform.activeSessionList || []).map(session => ({ ...session, platform: platform.label, platformId: platform.id }))).sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 8);
  return <main className="shell tabbed">
    <header><div><span className={`pulse ${stale ? 'stale' : ''}`}></span><b>Token Pulse</b></div><span>{stale ? 'STALE' : 'LIVE'}</span></header>
    {tab === 'overview' && <div className="tab-page">
      {(data.alerts || []).length > 0 && <section className="alert-stack" aria-label="Active alerts">{data.alerts.slice(0, 3).map(alert => <article key={alert.id} className={alert.severity}><span>!</span><div><strong>{alert.title}</strong><p>{alert.detail}</p><small>{alert.action}</small></div></article>)}</section>}
      <section className="hero"><small>TOKENS TODAY</small><strong>{compact(data.total)}</strong><p>{data.sessions} sessions across {data.platforms.filter(item => item.connected).length} runtimes · synced {ago(data.receivedAt || data.fetchedAt)}</p></section>
      <section className="split"><article><small>FRESH INPUT</small><strong>{compact(data.input)}</strong></article><article><small>CACHE READ</small><strong>{compact(data.cacheRead)}</strong></article><article><small>OUTPUT</small><strong>{compact(data.output)}</strong></article></section>
      <section className="platforms">{data.platforms.map(platform => <article key={platform.id}><div><i className={platform.id}></i><b>{platform.label}</b><em>{platform.active} active</em></div><strong>{compact(platform.total)}</strong><span>{platform.quota?.available ? `${Math.round(platform.quota.remainingPercent)}% quota left` : `${platform.sessions} sessions`}</span></article>)}</section>
      <section className="quick-insights"><article><small>CACHE HIT</small><strong>{Math.round((data.cacheHitRate || 0) * 100)}%</strong></article><article><small>AVG / SESSION</small><strong>{compact(data.sessions ? data.total / data.sessions : 0)}</strong></article><button onClick={() => setTab('system')}><span><small>RUN MODE</small><strong>{hardware.recommendation?.mode || 'UNKNOWN'}</strong></span><em>System details →</em></button></section>
    </div>}
    {tab === 'sessions' && <div className="tab-page sessions-page"><section className="sessions"><div className="section-title"><div><small>LIVE WORK</small><b>Active sessions</b></div><span>Last 20 minutes</span></div>{sessions.length ? sessions.map(session => <article key={`${session.platformId}-${session.id}`}><i className={session.platformId}></i><div><strong>{session.title || 'Untitled session'}</strong><span>{session.platform}{session.model ? ` · ${session.model}` : ''} · {ago(session.updatedAt)}</span></div><em>{compact(session.total)}</em></article>) : <p className="empty">No sessions are active right now.</p>}</section></div>}
    {tab === 'system' && <div className="tab-page system-page">
      <section className="system-hero"><small>AGENT READINESS</small><strong>{hardware.recommendation?.mode || 'UNKNOWN'}</strong><p>{hardware.recommendation?.route || 'Waiting for the desktop hardware scan.'}</p></section>
      <section className="system-grid"><article><small>CPU LOAD</small><strong>{hardware.cpu?.utilization || 0}%</strong></article><article><small>MEMORY</small><strong>{hardware.memory?.utilization || 0}%</strong></article><article><small>GPU VRAM</small><strong>{hardware.gpu?.vramGb || 0} GB</strong></article></section>
      <section className="model-fit"><small>BEST LOCAL FIT</small><strong>{hardware.recommendation?.model || 'Waiting for scan'}</strong><span>System pressure: {hardware.pressure || 'unknown'}</span></section>
      <section className="quota-list"><div className="section-title"><b>Provider quotas</b><span>Account allowance</span></div>{data.platforms.map(platform => <article key={platform.id}><div><i className={platform.id}></i><b>{platform.label}</b></div><strong>{platform.quota?.available ? `${Math.round(platform.quota.remainingPercent)}% left` : 'Not exposed'}</strong></article>)}</section>
      <footer><button onClick={() => load(token)}>Refresh now</button><button className="ghost" onClick={() => { requestState.current.sequence++; requestState.current.controller?.abort(); localStorage.removeItem('token-pulse-access'); setData(null); setToken(''); }}>Lock</button></footer>
    </div>}
    <nav className="tabbar" aria-label="Dashboard sections">
      <button className={tab === 'overview' ? 'selected' : ''} onClick={() => setTab('overview')}><TabIcon name="overview"/><span>Overview</span></button>
      <button className={tab === 'sessions' ? 'selected' : ''} onClick={() => setTab('sessions')}><TabIcon name="sessions"/><span>Sessions</span><em>{data.activeSessions}</em></button>
      <button className={tab === 'system' ? 'selected' : ''} onClick={() => setTab('system')}><TabIcon name="system"/><span>System</span></button>
    </nav>
  </main>;
}

function TabIcon({ name }) {
  if (name === 'overview') return <svg viewBox="0 0 24 24"><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z"/></svg>;
  if (name === 'sessions') return <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
  return <svg viewBox="0 0 24 24"><path d="M4 15h3l2-7 4 11 2-6h5"/></svg>;
}
