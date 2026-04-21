// Dialog de confirmation simple (remplace window.confirm natif, non stylé)
// Usage : const ok = await confirm('Supprimer ce projet ?')

import { el } from '../utils/dom.js';

export function confirm(message) {
  return new Promise((resolve) => {
    const overlay = el('div',
      { class: 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6' },
      el('div', { class: 'bg-bg-card rounded-2xl border border-slate-700 p-6 w-full max-w-sm flex flex-col gap-4' },
        el('p', { class: 'text-slate-100' }, message),
        el('div', { class: 'flex gap-3 justify-end' },
          el('button', {
            class: 'btn-secondary',
            onClick: () => { overlay.remove(); resolve(false); }
          }, 'Annuler'),
          el('button', {
            class: 'btn bg-red-700 hover:bg-red-600 text-white',
            onClick: () => { overlay.remove(); resolve(true); }
          }, 'Supprimer')
        )
      )
    );
    document.body.appendChild(overlay);
  });
}