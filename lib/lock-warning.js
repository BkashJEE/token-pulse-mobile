import { createElement } from 'react';

export function LockWarning({ message, onRetry, busy = false }) {
  if (!message) return null;
  return createElement(
    'div',
    { className: 'lock-warning', role: 'alert' },
    createElement('small', null, message),
    createElement('button', { type: 'button', onClick: onRetry, disabled: busy }, 'Retry lock'),
  );
}
