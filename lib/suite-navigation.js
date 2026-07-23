export const suiteViews = Object.freeze([
  { id: 'pulse', label: 'Token Pulse', shortLabel: 'Pulse', href: '/', description: 'Live agent telemetry' },
  { id: 'prompts', label: 'Prompt Gallery', shortLabel: 'Prompts', href: '/prompts', description: 'Reusable operator workflows' },
  { id: 'growth', label: 'Growth Tracker', shortLabel: 'Growth', href: '/growth', description: 'Evidence-led growth command' },
]);

export function resolveSuiteView(pathname = '/') {
  if (pathname === '/') return 'pulse';
  if (pathname === '/prompts' || pathname.startsWith('/prompts/')) return 'prompts';
  if (pathname === '/growth' || pathname.startsWith('/growth/')) return 'growth';
  return null;
}
