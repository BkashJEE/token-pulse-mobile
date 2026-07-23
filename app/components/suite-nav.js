'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { resolveSuiteView, suiteViews } from '../../lib/suite-navigation.js';

function SuiteIcon({ id }) {
  if (id === 'pulse') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h4l2-7 4 13 3-9 2 3h3" /></svg>;
  if (id === 'prompts') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v4H7zM5 7h14v14H5zM8 11h8M8 15h6" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M3 19h18M15 6l3-3 3 3" /></svg>;
}

export default function SuiteNav() {
  const active = resolveSuiteView(usePathname());
  if (!active) return null;

  return <div className="suite-switcher-wrap">
    <nav className="suite-switcher" aria-label="Token Pulse products">
      {suiteViews.map(view => <Link key={view.id} href={view.href} aria-label={view.label} className={active === view.id ? 'active' : ''} aria-current={active === view.id ? 'page' : undefined}>
        <SuiteIcon id={view.id} />
        <span className="suite-label-long" aria-hidden="true">{view.label}</span>
        <span className="suite-label-short" aria-hidden="true">{view.shortLabel}</span>
      </Link>)}
    </nav>
  </div>;
}
