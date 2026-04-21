import { el } from '../utils/dom.js';
import { searchObjets } from '../api/catalogue.js';

export function autocomplete({ categorieId, onSelectMultiple, placeholder = 'Rechercher un objet...' }) {
  let suggestions = [];
  let isOpen = false;
  let timer = null;
  // Map<key, { obj, quantite }>
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
    class: 'w-full py-3 bg-accent text-bg font-semibold text-sm rounded-b-xl hidden items-center justify-center gap-2'
  }, el('span', { class: 'icon text-base' }, 'check_circle'), 'Ajouter les objets');

  const itemsContainer = el('div', { class: 'overflow-y-auto max-h-64' });

  const dropdown = el('div', {
    class: 'absolute z-30 w-full bg-bg-card border border-slate-700 rounded-xl shadow-xl mt-1 hidden overflow-hidden'
  }, itemsContainer, btnConfirm);

  const wrapper = el('div', { class: 'relative' }, input, badge, dropdown);

  // ── Événements globaux ──────────────────────────────────────────

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

  // ── Rendu complet du dropdown ───────────────────────────────────
  // Appelé uniquement lors d'une nouvelle recherche, PAS lors d'un toggle

  function renderDropdown(terme) {
    dropdown.classList.remove('hidden');
    isOpen = true;
    itemsContainer.replaceChildren();

    suggestions.forEach(obj => {
      const key = String(obj.id); // force string pour cohérence Map
      itemsContainer.appendChild(buildItem(obj, key, false));
    });

    // Option créer
    const terme_ = (terme || '').trim();
    const exactMatch = suggestions.some(
      s => s.libelle.toLowerCase() === terme_.toLowerCase()
    );
    if (!exactMatch && terme_.length > 0) {
      const createKey = 'new:' + terme_;
      const fakeObj = { id: null, libelle: terme_, isNew: true };
      itemsContainer.appendChild(buildItem(fakeObj, createKey, true));
    }

    if (itemsContainer.children.length === 0) {
      itemsContainer.appendChild(
        el('div', { class: 'px-4 py-4 text-sm text-slate-500 text-center' },
          'Catalogue vide - tape un nom pour creer le premier objet'
        )
      );
    }

    updateConfirmBtn();
  }

  // ── Construction d'un item ──────────────────────────────────────

  function buildItem(obj, key, isCreate) {
    const entry = selected.get(key);
    const isChecked = !!entry;
    const quantite = entry ? entry.quantite : 1;

    // Checkbox
    const checkbox = el('input', {
      type: 'checkbox',
      class: 'w-4 h-4 shrink-0 pointer-events-none', // pointer-events-none : c'est la ligne qui gère le clic
      checked: isChecked
    });

    // Libellé
    const label = isCreate
      ? el('span', { class: 'text-sm text-accent flex items-center gap-1 flex-1 min-w-0 truncate' },
          el('span', { class: 'icon text-base shrink-0' }, 'add_circle'),
          'Creer : ' + obj.libelle
        )
      : el('span', { class: 'text-sm flex-1 min-w-0 truncate' }, obj.libelle);

    // Contrôles quantité (visibles seulement si coché)
    const qtyVal = el('span', {
      class: 'text-sm font-bold text-accent w-5 text-center shrink-0'
    }, String(quantite));

    const qtyMoins = el('button', {
      class: 'w-6 h-6 rounded bg-bg-elevated text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-slate-600 shrink-0'
    }, '-');

    const qtyPlus = el('button', {
      class: 'w-6 h-6 rounded bg-bg-elevated text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-slate-600 shrink-0'
    }, '+');

    const qtyControls = el('div', {
      class: 'flex items-center gap-1 ' + (isChecked ? 'flex' : 'hidden')
    }, qtyMoins, qtyVal, qtyPlus);

    const item = el('div', {
      class: 'flex items-center gap-3 px-3 py-2 border-b border-slate-800 last:border-0 cursor-pointer ' +
             (isChecked ? 'bg-accent/10' : 'hover:bg-bg-elevated')
    }, checkbox, label, qtyControls);

    // ── Clic sur la ligne = toggle (hors boutons +/-) ─────────────
    item.addEventListener('mousedown', (e) => {
      if (qtyMoins.contains(e.target) || qtyPlus.contains(e.target)) return;
      e.preventDefault();

      if (selected.has(key)) {
        // Décocher
        selected.delete(key);
        checkbox.checked = false;
        qtyControls.classList.add('hidden');
        qtyControls.classList.remove('flex');
        qtyVal.textContent = '1';
        item.classList.remove('bg-accent/10');
        item.classList.add('hover:bg-bg-elevated');
      } else {
        // Cocher
        selected.set(key, { obj, quantite: 1 });
        checkbox.checked = true;
        qtyControls.classList.remove('hidden');
        qtyControls.classList.add('flex');
        item.classList.add('bg-accent/10');
        item.classList.remove('hover:bg-bg-elevated');
      }

      updateConfirmBtn();
      updateBadge();
      // PAS de re-render du dropdown → l'état visuel est mis à jour directement
    });

    // ── Bouton moins ──────────────────────────────────────────────
    qtyMoins.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const current = selected.get(key);
      if (!current) return;
      const newQty = Math.max(1, current.quantite - 1);
      selected.set(key, { obj, quantite: newQty });
      qtyVal.textContent = String(newQty);
      updateConfirmBtn();
    });

    // ── Bouton plus ───────────────────────────────────────────────
    qtyPlus.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const current = selected.get(key);
      if (!current) return;
      const newQty = current.quantite + 1;
      selected.set(key, { obj, quantite: newQty });
      qtyVal.textContent = String(newQty);
      updateConfirmBtn();
    });

    return item;
  }

  // ── Bouton confirmation ─────────────────────────────────────────

  function updateConfirmBtn() {
    const count = selected.size;
    if (count > 0) {
      const total = [...selected.values()].reduce((s, e) => s + e.quantite, 0);
      btnConfirm.classList.remove('hidden');
      btnConfirm.classList.add('flex');
      btnConfirm.replaceChildren(
        el('span', { class: 'icon text-base' }, 'check_circle'),
        'Ajouter ' + count + ' objet' + (count > 1 ? 's' : '') +
        ' (' + total + ' unite' + (total > 1 ? 's' : '') + ')'
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

  // ── Confirmation finale ─────────────────────────────────────────

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