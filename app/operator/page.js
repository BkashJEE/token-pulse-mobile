'use client';

import { useMemo, useState } from 'react';
import { GrowthSessionController } from '../../lib/growth-session-controller.js';
import { LockWarning } from '../../lib/lock-warning.js';
import { filterPlaybooks, isOperatorReadySurface, openOperatorSession, requestOperator } from '../../lib/operator-ui.js';

function Mark({ compact = false }) {
  return <div className={`operator-mark${compact ? ' compact' : ''}`}><img src="/operator-workbench-mark.svg" alt="" /></div>;
}

function Entry({ surface, status, error, lockError, unlock, lock, load }) {
  const [key, setKey] = useState('');
  if (surface === 'loading') {
    const opening = status === 'unlocking';
    return <main className="operator-entry" aria-busy="true" aria-live="polite"><section><Mark /><span className="operator-kicker">PRIVATE OPERATOR SYSTEM</span><h1>{opening ? 'Securing your workbench' : 'Restoring private access'}</h1><p>{opening ? 'Creating an encrypted, short-lived device session.' : 'Checking this browser without reading or storing your access key.'}</p><div className="operator-loader"><i /></div><small>Private · evidence-led · no remote execution</small></section></main>;
  }
  if (surface === 'unavailable') {
    return <main className="operator-entry"><section><Mark /><span className="operator-kicker">SESSION PRESERVED</span><h1>The playbook library is unavailable.</h1><p>Your private session remains active. Retry without entering the key again.</p><button onClick={() => load({ afterUnlock: true })}>Retry workbench <span>→</span></button></section></main>;
  }
  return <main className="operator-entry"><section><Mark /><span className="operator-kicker">TOKEN PULSE · OPERATOR WORKBENCH</span><h1>Signals become<br /><em>safe moves.</em></h1><p>One private library for turning runtime and growth evidence into repeatable, approval-aware outcomes.</p><div className="entry-proof"><span><i /> Source-bound</span><span>Read-only MVP</span><span>Approval-aware</span></div><form onSubmit={event => { event.preventDefault(); if (key.trim()) unlock(key); }}><label htmlFor="operator-access">Private access key</label><div><input id="operator-access" type="password" value={key} onChange={event => setKey(event.target.value)} placeholder="Enter private key" autoComplete="current-password" disabled={status === 'unlocking' || status === 'locking'} /><span>⌁</span></div><button type="submit" disabled={!key.trim() || status === 'unlocking' || status === 'locking'}>{status === 'unlocking' ? 'Opening…' : 'Open workbench'} <span>→</span></button></form>{error && <small className="entry-error" role="alert">{error}</small>}<LockWarning message={lockError} onRetry={lock} busy={status === 'locking'} /><small className="entry-note">The key never appears in the URL or browser storage.</small></section></main>;
}

function SurfaceIcon({ id }) {
  const paths = {
    'token-pulse': 'M4 13h3l2-6 4 11 3-8 2 3h2',
    'growth-command': 'M4 18l5-5 4 3 7-9M16 7h4v4',
    'operator-workbench': 'M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z',
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[id]} /></svg>;
}

function Header({ onLock, local }) {
  return <header className="operator-header"><a href="/operator" className="header-brand"><Mark compact /><span><small>BKASH OS</small><strong>Operator Workbench</strong></span></a><div className="header-actions"><span className="private-state"><i /> {local ? 'LOCAL' : 'PRIVATE'}</span>{!local && <button onClick={onLock}>Lock</button>}</div></header>;
}

function SurfaceRail({ surfaces }) {
  return <section className="surface-rail" aria-label="Connected product surfaces">{surfaces.map(surface => <a key={surface.id} href={surface.href} className={surface.id === 'operator-workbench' ? 'current' : ''}><span className="surface-icon"><SurfaceIcon id={surface.id} /></span><span><small>{surface.role}</small><strong>{surface.name}</strong><em>{surface.state}</em></span><b aria-hidden="true">↗</b></a>)}</section>;
}

function PlaybookCard({ playbook, expanded, onToggle }) {
  const [copied, setCopied] = useState(false);
  const copyPrompt = async event => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(playbook.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return <article className={`playbook-card${expanded ? ' expanded' : ''}`}>
    <button className="playbook-summary" onClick={onToggle} aria-expanded={expanded}>
      <span className="playbook-index">{playbook.id.slice(0, 2).toUpperCase()}</span>
      <span className="playbook-title"><span><em>{playbook.category}</em><i>{playbook.cadence}</i></span><strong>{playbook.title}</strong><p>{playbook.outcome}</p></span>
      <span className="integration-stack">{playbook.integrations.slice(0, 3).map(item => <i key={item}>{item.slice(0, 1)}</i>)}</span>
      <b className="expand-control" aria-hidden="true">{expanded ? '−' : '+'}</b>
    </button>
    {expanded && <div className="playbook-detail">
      <div className="contract-grid">
        <section><small>TRIGGER</small><p>{playbook.trigger}</p></section>
        <section><small>PROOF OF DONE</small><p>{playbook.proof}</p></section>
        <section className="approval-contract"><small>APPROVAL BOUNDARY</small><p>{playbook.approval}</p></section>
        <section><small>SUCCESS MEASURE</small><p>{playbook.success}</p></section>
      </div>
      <div className="detail-columns">
        <section><small>CONNECTED SOURCES</small><ul>{playbook.sources.map(source => <li key={source}>{source}</li>)}</ul></section>
        <section><small>OPERATING STEPS</small><ol>{playbook.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
      </div>
      <section className="prompt-contract"><div><span><small>EXACT OPERATOR PROMPT</small><em>Manual execution · read-only MVP</em></span><button onClick={copyPrompt}>{copied ? 'Copied' : 'Copy prompt'}</button></div><p>{playbook.prompt}</p></section>
    </div>}
  </article>;
}

function Workbench({ data, lock }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(data.playbooks[0]?.id || null);
  const filtered = useMemo(() => filterPlaybooks(data.playbooks, { category, query }), [data.playbooks, category, query]);
  const local = data.accessMode === 'local';

  return <main className="operator-app"><Header onLock={lock} local={local} /><div className="operator-shell">
    <aside><div className="side-intro"><span>WORK IN PROGRESS</span><strong>Outcome library</strong><p>Not prompts for browsing. Operating contracts for verified work.</p></div><SurfaceRail surfaces={data.surfaces} /><div className="safety-card"><span>READ-ONLY MVP</span><strong>No invisible execution.</strong><p>Every consequential move stays behind Dad’s explicit approval.</p></div></aside>
    <section className="operator-content">
      <section className="operator-hero"><span className="operator-kicker">SIGNAL → RESULT</span><h1>Choose the outcome.<br /><em>Keep the proof.</em></h1><p>{data.mission}</p><div className="loop-strip">{data.loop.map((item, index) => <span key={item}><i>{String(index + 1).padStart(2, '0')}</i>{item}</span>)}</div></section>
      <section className="library-head"><div><small>OPERATING PLAYBOOKS</small><h2>What needs to move?</h2><p>{filtered.length} of {data.playbooks.length} playbooks · {data.release}</p></div><label><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search outcomes, tools, triggers…" aria-label="Search playbooks" /></label></section>
      <div className="category-tabs" role="group" aria-label="Playbook category">{['All', 'Work', 'Personal'].map(item => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}<span>{item === 'All' ? data.playbooks.length : data.playbooks.filter(playbook => playbook.category === item).length}</span></button>)}</div>
      <section className="playbook-list">{filtered.map(playbook => <PlaybookCard key={playbook.id} playbook={playbook} expanded={expanded === playbook.id} onToggle={() => setExpanded(expanded === playbook.id ? null : playbook.id)} />)}{filtered.length === 0 && <div className="empty-state"><strong>No matching playbook.</strong><p>Try a product name, trigger, or broader category.</p></div>}</section>
      <footer className="operator-footer"><span><i /> {local ? 'Local browser · no access key' : 'Private device session'}</span><p>Copying is local. No workflow was run and no external system was changed.</p></footer>
    </section>
  </div></main>;
}

function OperatorViewState(props) {
  if (!isOperatorReadySurface(props.surface)) return <Entry {...props} />;
  return <Workbench data={props.data} lock={props.lock} />;
}

export default function OperatorWorkbench() {
  return <GrowthSessionController request={requestOperator} open={openOperatorSession} endpoint="/api/operator">{OperatorViewState}</GrowthSessionController>;
}
