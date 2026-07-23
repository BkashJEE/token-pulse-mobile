async function operatorFetch(path, options) {
  return fetch(path, { ...options, credentials: 'same-origin', cache: 'no-store' });
}

export async function requestOperator() {
  const response = await operatorFetch('/api/operator');
  if (response.status === 200) return { kind: 'ready', status: 200, data: await response.json() };
  if (response.status === 401) return { kind: 'locked', status: 401, data: null };
  return { kind: 'unavailable', status: response.status, data: null };
}

export async function openOperatorSession(accessKey) {
  const response = await operatorFetch('/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessKey }),
  });
  if (response.status !== 204) return { kind: 'rejected', status: response.status, data: null };
  return requestOperator();
}

export function isOperatorReadySurface(surface) {
  return surface === 'dashboard';
}

export function filterPlaybooks(playbooks, { category = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return playbooks.filter(playbook => {
    if (category !== 'All' && playbook.category !== category) return false;
    if (!needle) return true;
    const haystack = [
      playbook.title,
      playbook.outcome,
      playbook.trigger,
      playbook.category,
      ...playbook.integrations,
      ...playbook.sources,
    ].join(' ').toLowerCase();
    return haystack.includes(needle);
  });
}
