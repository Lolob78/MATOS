import { el } from '../utils/dom.js';
import { searchObjets } from '../api/catalogue.js';

export function autocomplete({ categorieId, onSelectMultiple, placeholder = 'Rechercher un objet…' }) {
  let suggestions = [];
  let isOpen = false;
  let timer = null;
  let selected = new Map();

  const input = el('input', {
    type: 'text',
    class: 'input',
    placeholder,
    autocomplete: 'off'
  });

  const badge = el('span', {
    class: 'absolute right-3 top-1/2 -translate-y-1/2 bg-accent text-bg text-xs font-bold rounded-full w-5 h-5 items-center justify-center hidden'
  });

  const btnConfirm = el('button', {
    class: 'w-full py-3 bg-accent text-bg font-semibold text-sm rounded-b-xl hidden items-center justify-center gap-2 sticky bottom-0'
  }, el('span', { class: 'icon text-base' }, 'check_circle'), 'Ajouter les objets');

  const itemsContainer = el('div', { class: 'overflow-y-auto' });

  const dropdown = el('div', {
    class: 'absolute z-30 w-full bg-bg-card border border-slate-700 rounded-xl shadow-xl mt-1 hidden overflow-hidden'
  }, itemsContainer, btnConfirm);

  const wrapper = el('div', { class: 'relative' }, input, badge, dropdown);

  // ── Événements ──────────────────────────────────────────────────

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => search(input.value), 250);
  });

  input.addEventListener('focus', () => {
    if (!isOpen) search(input.value);
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) close();
  });

  btnConfirm.addEventListener('mousedown', (e) => {
    e.preventDefault();
    confirmSelection();
  });

  // ── Recherche ───────────────────────────────────────────────────

  async function search(terme) {
    if (!categorieId) return;
    try {
      suggestions = await searchObjets(categorieId, terme);
      renderDropdown(terme);
    } catch (e) {
      console.error('Autocomplete error', e);
    }
  }

  // ── Rendu dropdown ──────────────────────────────────────────────

  function renderDropdown(terme) {
    dropdown.classList.remove('hidden');
    isOpen = true;
    itemsContainer.replaceChildren();

    suggestions.forEach(obj => {
      const key = obj.id;
      const isChecked = selected.has(key);

      const checkbox = el('input', {
        type: 'checkbox',
        class: 'w-4 h-4 shrink-0',
        checked: isChecked
      });

      const item = el('div', {
        class: 'flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-800 last:border-0 ' +
               (isChecked ? 'bg-accent/10' : 'hover:bg-bg-elevated')
      },
        checkbox,
        el('span', { class: 'text-sm flex-1' }, obj.libelle),
        obj.usage_count > 0
          ? el('span', { class: 'text-xs text-slate-500 shrink-0' }, 'x' + obj.usage_count)
          : null
      );

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        toggleItem(obj, key, item, checkbox);
      });

      itemsContainer.appendChild(item);
    });

    // Option créer
    const terme_ = (terme || '').trim();
    const exactMatch = suggestions.some(
      s => s.libelle.toLowerCase() === terme_.toLowerCase()
    );

    if (!exactMatch && terme_.length > 0) {
      const createKey = 'new:' + terme_;
      const isChecked = selected.has(createKey);

      const checkbox = el('input', {
        type: 'checkbox',
        class: 'w-4 h-4 shrink-0',
        checked: isChecked
      });

      const createItem = el('div', {
        class: 'flex items-center gap-3 px-4 py-3 cursor-pointer text-accent ' +
               (isChecked ? 'bg-accent/10' : 'hover:bg-accent/5')
      },
        checkbox,
        el('span', { class: 'icon text-base' }, 'add_circle'),
        el('span', { class: 'text-sm' }, 'Creer : ' + terme_)
      );

      createItem.addEventListener('mousedown', (e) => {
        e.preventDefault();
        toggleItem({ id: null, libelle: terme_, isNew: true }, createKey, createItem, checkbox);
      });

      itemsContainer.appendChild(createItem);
    }

    if (itemsContainer.children.length === 0) {
      itemsContainer.appendChild(
        el('div', { class: 'px-4 py-4 text-sm text-slate-500 text-center' },
          'Catalogue vide — tape un nom pour creer le premier objet'
        )
      );
    }

    updateConfirmBtn();
  }

  // ── Toggle ──────────────────────────────────────────────────────

  function toggleItem(obj, key, itemEl, checkbox) {
    if (selected.has(key)) {
      selected.delete(key);
      checkbox.checked = false;
      itemEl.className = itemEl.className.replace('bg-accent/10', 'hover:bg-bg-elevated');
    } else {
      selected.set(key, obj);
      checkbox.checked = true;
      itemEl.className = itemEl.className.replace('hover:bg-bg-elevated', 'bg-accent/10');
    }
    updateConfirmBtn();
    updateBadge();
  }

  // ── Bouton confirmation ─────────────────────────────────────────

  function updateConfirmBtn() {
    const count = selected.size;
    if (count > 0) {
      btnConfirm.classList.remove('hidden');
      btnConfirm.classList.add('flex');
      btnConfirm.replaceChildren(
        el('span', { class: 'icon text-base' }, 'check_circle'),
        'Ajouter ' + count + ' objet' + (count > 1 ? 's' : '')
      );
    } else {
      btnConfirm.classList.add('hidden');
      btnConfirm.classList.remove('flex');
    }
  }

  function updateBadge() {
    const count = selected.size;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
      badge.classList.add('flex');
    } else {
      badge.classList.add('hidden');
      badge.classList.remove('flex');
    }
  }

  // ── Confirmation ────────────────────────────────────────────────

  function confirmSelection() {
    if (selected.size === 0) return;
    const items = [...selected.values()];
    onSelectMultiple(items);
    selected.clear();
    input.value = '';
    updateBadge();
    close();
  }

  function close() {
    dropdown.classList.add('hidden');
    isOpen = false;
  }

  function reset() {
    input.value = '';
    selected.clear();
    updateBadge();
    close();
  }

  function updateCategorie(newCategorieId) {
    categorieId = newCategorieId;
    selected.clear();
    input.value = '';
    updateBadge();
    search('');
    input.focus();
  }

  function showAll() {
    search('');
    input.focus();
  }

  return { wrapper, input, reset, updateCategorie, showAll };
}