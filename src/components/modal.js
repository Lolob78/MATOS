// Modal réutilisable. Usage :
// const m = modal({ title: 'Nouveau projet', content: formNode, onClose: () => {} });
// m.open() / m.close()

import { el } from '../utils/dom.js';

export function modal({ title, content, onClose } = {}) {
  let overlay, dialog;

  function close() {
    overlay?.remove();
    overlay = null;
    onClose?.();
  }

  function open() {
    overlay = el('div',
      { class: 'fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4',
        onClick: (e) => { if (e.target === overlay) close(); }
      },
      dialog = el('div',
        { class: 'bg-bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-700 flex flex-col max-h-[90dvh]' },

        // Header
        el('div', { class: 'flex items-center justify-between p-4 border-b border-slate-700 shrink-0' },
          el('h2', { class: 'text-lg font-semibold' }, title ?? ''),
          el('button', { class: 'btn-ghost p-2', onClick: close },
            el('span', { class: 'icon' }, 'close')
          )
        ),

        // Contenu scrollable
        el('div', { class: 'overflow-y-auto p-4 flex flex-col gap-4' }, content)
      )
    );
    document.body.appendChild(overlay);
  }

  return { open, close };
}