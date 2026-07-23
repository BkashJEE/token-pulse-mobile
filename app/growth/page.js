'use client';

import { useState } from 'react';
import { GrowthSessionController } from '../../lib/growth-session-controller.js';
import { LockWarning } from '../../lib/lock-warning.js';

const number = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);

function Icon({ name }) {
  const paths = {
    today: 'M4 5h16v15H4zM8 3v4M16 3v4M4 10h16M8 14h2M14 14h2',
    posts: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
    plan: 'M5 19V8M12 19V4M19 19v-7',
    intel: 'M4 18l5-5 4 3 7-9M16 7h4v4',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function BrandMark({ compact = false }) {
  return <div className={`growth-brand-mark${compact ? ' compact' : ''}`}><img src="/x-growth-icon.png" alt="" /></div>;
}

function LoadingGrowth({ mode = 'checking' }) {
  const copy = mode === 'unlocking'
    ? ['Securing this device', 'Creating a private, encrypted dashboard session.']
    : mode === 'loading'
      ? ['Building your command view', 'Loading verified goals, signals, and source notes.']
      : ['Checking private access', 'Restoring your secure device session.'];
  return <main className="growth-entry growth-loading" aria-live="polite" aria-busy="true">
    <section className="entry-panel">
      <div className="loading-stage"><BrandMark /><span className="loading-orbit" /><i className="loading-pulse p1" /><i className="loading-pulse p2" /><i className="loading-pulse p3" /></div>
      <span className="eyebrow">TOKEN PULSE · X GROWTH</span>
      <h1>{copy[0]}</h1>
      <p>{copy[1]}</p>
      <div className="loading-track"><i /></div>
      <small>Private · read-only · source-backed</small>
    </section>
  </main>;
}

function LockedGrowth({ onUnlock, error, busy, lockError, onRetryLock }) {
  const [key, setKey] = useState('');
  return <main className="growth-entry growth-lock">
    <section className="entry-panel">
      <BrandMark />
      <span className="eyebrow">PRIVATE GROWTH COMMAND</span>
      <h1>Clear signals.<br />Better moves.</h1>
      <p>Your evidence-led path from today’s baseline to the 10K mission.</p>
      <div className="entry-proof"><span><i /> Verified inputs</span><span>Read-only</span><span>Private session</span></div>
      <form onSubmit={event => { event.preventDefault(); if (key.trim()) onUnlock(key); }}>
        <label htmlFor="growth-access">Mobile access key</label>
        <div className="entry-input"><input id="growth-access" value={key} onChange={event => setKey(event.target.value)} type="password" placeholder="Enter private key" autoComplete="current-password" disabled={busy} /><span aria-hidden="true">⌁</span></div>
        <button type="submit" disabled={busy || !key.trim()}>{busy ? 'Opening…' : 'Open command center'}<span aria-hidden="true">→</span></button>
      </form>
      {error && <small className="form-error" role="alert">{error}</small>}
      <LockWarning message={lockError} onRetry={onRetryLock} busy={busy} />
      <small className="entry-footnote">The key never appears in the URL or browser storage.</small>
    </section>
  </main>;
}

function UnavailableGrowth({ onRetry }) {
  return <main className="growth-entry growth-lock">
    <section className="entry-panel">
      <BrandMark />
      <span className="eyebrow">PRIVATE SESSION PRESERVED</span>
      <h1>Dashboard data is unavailable.</h1>
      <p>Your private session remains in place. Retry without entering the access key again.</p>
      <form onSubmit={event => { event.preventDefault(); onRetry(); }}><button type="submit">Retry dashboard<span aria-hidden="true">→</span></button></form>
      <small className="entry-footnote">No private data was cached in this error view.</small>
    </section>
  </main>;
}

function Header({ data }) {
  const ageDays = Math.max(0, Math.floor((Date.now() - Date.parse(`${data.verifiedAt}T00:00:00Z`)) / 86400000));
  const stale = ageDays > 7;
  return <header className="growth-header">
    <div><BrandMark compact /><div><small>{data.account}</small><strong>Growth Command</strong></div></div>
    <div className={`header-status${stale ? ' stale' : ''}`}><span className="status-dot" /><div><small>DATA STATUS</small><strong>Snapshot as of {data.verifiedAt}</strong></div></div>
  </header>;
}

const tabs = { today: 'Today', posts: 'Posts', plan: 'Plan', intel: 'Intel', more: 'More' };

function GrowthNav({ tab, onChange }) {
  return <nav className="growth-tabs" aria-label="X Growth sections">{Object.entries(tabs).map(([key, label]) => <button key={key} className={tab === key ? 'selected' : ''} onClick={() => onChange(key)} aria-current={tab === key ? 'page' : undefined}><Icon name={key} /><span>{label}</span></button>)}</nav>;
}

function Today({ data }) {
  const { mission, baseline, gate } = data;
  return <div className="growth-view today-view">
    <section className="mission-card">
      <div className="mission-copy"><span className="eyebrow">10K FOLLOWER MISSION</span><strong>{number(mission.current)}</strong><p>of {number(mission.target)} followers</p><div className="mission-track"><i style={{ width: `${mission.progress}%` }} /></div><small>{number(mission.remaining)} to go · {mission.progress}% complete</small></div>
      <div className="progress-ring" style={{ '--progress': `${mission.progress * 3.6}deg` }}><div><strong>{mission.progress}%</strong><span>complete</span></div></div>
    </section>

    <section className="decision-card"><div><span className="status-dot" /><div><small>ALGORITHM GATE</small><strong>{gate.decision}</strong></div></div><b>{gate.score}<span>/100</span></b><p>Strengthen audience fit, action design, and content diversity before increasing volume.</p></section>

    <div className="section-heading"><div><small>TODAY’S DIRECTION</small><h2>Protect the signal</h2></div><span>01</span></div>
    <section className="focus-list">{data.focus.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p>{index === 0 && <em>Priority</em>}</article>)}</section>

    <div className="section-heading"><div><small>VERIFIED BASELINE</small><h2>Four-day pulse</h2></div><span>02</span></div>
    <section className="stat-grid">
      <article className="wide"><small>PUBLIC VIEWS</small><strong>{number(baseline.views)}</strong><span>Jul 18–21</span></article>
      <article><small>POSTS</small><strong>{baseline.posts}</strong><span>{baseline.postsPerDay}/day</span></article>
      <article><small>MEDIAN</small><strong>{baseline.medianViews}</strong><span>views/post</span></article>
      <article><small>INTERACTION</small><strong>{baseline.interactionRate}%</strong><span>observed</span></article>
      <article><small>ZERO ACTION</small><strong>{baseline.zeroActionRate}%</strong><span>reduce below 40%</span></article>
    </section>
  </div>;
}

function Posts({ data }) {
  return <div className="growth-view">
    <div className="page-title"><span className="eyebrow">CONTENT INTELLIGENCE</span><h1>What earns attention</h1><p>Compare jobs, not just totals. Public views and private impressions stay separate.</p></div>
    <section className="format-stack">{data.formats.map((format, index) => <article key={format.name}>
      <div className="format-rank">0{index + 1}</div><div className="format-main"><div><strong>{format.name}</strong><span>{format.job}</span></div><p>{format.decision}</p><div className="format-metrics"><span><b>{number(format.average)}</b> avg views</span><span><b>{format.rate}%</b> interaction</span><span><b>{format.posts}</b> posts</span></div></div>
    </article>)}</section>
    <section className="sheet-card"><div className="card-head"><div><small>POST TRACKER</small><strong>Canonical posts</strong></div><span className="pending">AWAITING CURRENT EXPORT</span></div><p>No rows are invented. Import the next native X Analytics export before scoring current posts.</p></section>
    <section className="sheet-card"><div className="card-head"><div><small>RAW ANALYTICS</small><strong>{data.rawAnalytics.rows} verified rows</strong></div><span>through Jul 12</span></div><p>{data.rawAnalytics.status}</p><div className="raw-list">{data.rawAnalytics.latest.map(post => <article key={`${post.date}-${post.text}`}><div><span>{post.date}</span><p>{post.text}</p></div><strong>{post.impressions}<small> impressions</small></strong></article>)}</div></section>
  </div>;
}

function Plan({ data }) {
  return <div className="growth-view">
    <div className="page-title"><span className="eyebrow">12-MONTH PATH</span><h1>Climb without guessing</h1><p>Targets are planning assumptions—not forecasts or promises.</p></div>
    <section className="experiment-card"><span className="eyebrow">ACTIVE EXPERIMENT</span><div><strong>{data.experiment.id}</strong><span>{data.experiment.sample}</span></div><h2>{data.experiment.hypothesis}</h2><p>{data.experiment.baseline}</p><small>ONE VARIABLE · {data.experiment.variable}</small></section>
    <section className="timeline">{data.milestones.map(([label, followers, phase], index) => <article key={label} className={index === 0 ? 'current' : ''}><i /><div><small>{label}</small><strong>{number(followers)}</strong></div><span>{phase}</span></article>)}</section>
  </div>;
}

function Intel({ data }) {
  return <div className="growth-view">
    <div className="page-title"><span className="eyebrow">COMPETITOR INTELLIGENCE</span><h1>Signals, not imitation</h1><p>Follower counts appear only when verified. Blank baselines stay blank.</p></div>
    <section className="intel-list">{data.competitors.map((item, index) => <article key={item.handle}>
      <div className="competitor-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div><div><div><strong>{item.handle}</strong><span>{item.tier}</span></div><p>{item.note}</p></div><b>{item.followers ? number(item.followers) : '—'}<small>{item.followers ? ' followers' : ' not collected'}</small></b>
    </article>)}</section>
    <aside className="truth-note"><span>!</span><p><strong>Evidence guardrail</strong>@arknow91 is one verified peer signal, not a complete competitor study. Collect 20–30 comparable posts before drawing account-level conclusions.</p></aside>
  </div>;
}

function More({ data, onLock }) {
  return <div className="growth-view">
    <div className="page-title"><span className="eyebrow">EVIDENCE & SYSTEM</span><h1>Know what is real</h1><p>Every decision resolves to a source, cadence, or explicit assumption.</p></div>
    <section className="sheet-card"><div className="card-head"><div><small>ALGORITHM GATE</small><strong>{data.gate.score}/100 · {data.gate.decision}</strong></div></div><div className="gate-list">{data.gateDimensions.map(item => <article key={item.name}><div><span>{item.name}</span><em>{item.status}</em></div><div className="mini-track"><i style={{ width: `${item.score / item.max * 100}%` }} /></div><strong>{item.score}/{item.max}</strong></article>)}</div></section>
    <section className="sheet-card"><div className="card-head"><div><small>METRIC DICTIONARY</small><strong>Definitions</strong></div></div><div className="definition-list">{data.metrics.map(([name, formula, cadence]) => <article key={name}><strong>{name}</strong><p>{formula}</p><span>{cadence}</span></article>)}</div></section>
    <section className="sheet-card"><div className="card-head"><div><small>SOURCES & DECISIONS</small><strong>Proof ledger</strong></div></div><div className="source-list">{data.sources.map(source => <article key={source.item}><div><strong>{source.item}</strong><span>{source.source}</span></div><b>{source.value}</b><em className={source.status === 'Verified' ? 'ok' : ''}>{source.status}</em></article>)}</div></section>
    <section className="sheet-card"><div className="card-head"><div><small>WORKBOOK MAP</small><strong>All 10 sheets preserved</strong></div></div><div className="map-list">{data.workbookMap.map(([sheet, tab], index) => <article key={sheet}><span>{String(index + 1).padStart(2, '0')}</span><strong>{sheet}</strong><em>{tab}</em></article>)}</div></section>
    <footer className="growth-footer"><p>{data.accessMode === 'local' ? 'Local · no access key · read-only' : 'Private · read-only · source-backed'}</p>{data.accessMode !== 'local' && <button onClick={onLock}>Lock this browser</button>}</footer>
  </div>;
}

function GrowthViewState({ data, error, lockError, status, surface, load, unlock, lock }) {
  const [tab, setTab] = useState('today');
  if (surface === 'loading') return <LoadingGrowth mode={status} />;
  if (surface === 'unavailable') return <UnavailableGrowth onRetry={() => load({ afterUnlock: true })} />;
  if (surface === 'locked') return <LockedGrowth onUnlock={unlock} error={error} lockError={lockError} onRetryLock={lock} busy={status === 'unlocking' || status === 'locking'} />;
  const pages = { today: <Today data={data} />, posts: <Posts data={data} />, plan: <Plan data={data} />, intel: <Intel data={data} />, more: <More data={data} onLock={lock} /> };
  const changeTab = key => { setTab(key); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <main className="growth-app"><Header data={data} /><div className="growth-workspace"><GrowthNav tab={tab} onChange={changeTab} /><section className="growth-content">{pages[tab]}</section></div></main>;
}

export default function GrowthDashboard() {
  return <GrowthSessionController>{GrowthViewState}</GrowthSessionController>;
}
