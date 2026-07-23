'use client';

import { useMemo, useState } from 'react';
import { filterPrompts, promptCategories, promptTemplates, writePromptToClipboard } from '../../lib/prompt-gallery.js';

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
}

export default function PromptGallery() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [copied, setCopied] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [copyError, setCopyError] = useState('');
  const prompts = useMemo(() => filterPrompts(promptTemplates, { query, category }), [query, category]);

  const copyPrompt = async prompt => {
    setCopyError('');
    try {
      await writePromptToClipboard(navigator.clipboard, prompt.prompt);
      setCopied(prompt.id);
      const successMessage = `${prompt.title} copied to clipboard.`;
      setCopyStatus(successMessage);
      window.setTimeout(() => {
        setCopied(current => current === prompt.id ? '' : current);
        setCopyStatus(current => current === successMessage ? '' : current);
      }, 1800);
    } catch {
      setCopied('');
      setCopyStatus('');
      setCopyError('Copy was blocked by this browser. Open the prompt and copy it manually.');
    }
  };

  return <main className="prompt-gallery">
    <header className="prompt-hero">
      <span className="prompt-kicker">OPERATOR WORKFLOWS</span>
      <h1>Prompt Gallery</h1>
      <p>Reusable, proof-first workflows for monitoring, optimization, operations, growth, and shipping.</p>
      <div className="prompt-search">
        <SearchIcon />
        <label htmlFor="prompt-query" className="sr-only">Search prompts</label>
        <input id="prompt-query" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by task, signal, or outcome" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
      </div>
      <div className="prompt-categories" role="group" aria-label="Prompt categories">
        {promptCategories.map(item => <button type="button" key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
      </div>
    </header>

    <section className="prompt-results">
      <div className="prompt-results-head"><strong role="status" aria-live="polite" aria-atomic="true">{prompts.length} {prompts.length === 1 ? 'workflow' : 'workflows'}</strong><span>{category === 'All' ? 'All categories' : category}</span></div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{copyStatus}</div>
      {copyError && <div className="prompt-copy-error" role="alert">{copyError}</div>}
      {prompts.length ? <div className="prompt-grid">{prompts.map((prompt, index) => <article className="prompt-card" key={prompt.id}>
        <div className="prompt-card-top"><span>{String(index + 1).padStart(2, '0')}</span><em>{prompt.category}</em></div>
        <h2>{prompt.title}</h2>
        <p>{prompt.description}</p>
        <details>
          <summary>View full prompt</summary>
          <div className="prompt-text">{prompt.prompt}</div>
        </details>
        <button type="button" className={copied === prompt.id ? 'copied' : ''} onClick={() => copyPrompt(prompt)}>{copied === prompt.id ? 'Copied' : 'Copy prompt'}<span aria-hidden="true">{copied === prompt.id ? '✓' : '⧉'}</span></button>
      </article>)}</div> : <div className="prompt-empty"><strong>No matching workflow</strong><p>Try a broader search or switch to another category.</p><button type="button" onClick={() => { setQuery(''); setCategory('All'); }}>Show all prompts</button></div>}
    </section>
  </main>;
}
