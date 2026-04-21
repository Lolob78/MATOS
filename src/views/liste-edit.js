import { getListe, updateListe, getLignesDeListe, addLigne, updateLigne, deleteLigne } from '../api/listes.js';
import { getCategories } from '../api/categories.js';
import { getOrCreateObjet, incrementUsage } from '../api/catalogue.js';
import { el, icon } from '../utils/dom.js';
import { toDisplay, toInput } from '../utils/date.js';
import { autocomplete } from '../components/autocomplete.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { confirm } from '../components/confirm.js';
import { navigate } from '../router.js';
import { genererPDF } from '../pdf/generator.js';
import { getProjet } from '../api/projets.js';

export function listeEditView({ id }) {
  const root = el('div', { class: 'min-h-dvh pb-32' });

  let liste      = null;
  let categories = [];
  let lignes     = [];
  let categorieCourante = null;
  let acInput    = null;

  // ── Chargement initial ──────────────────────────────────────────
  async function load() {
    try {
      [liste, categories, lignes] = await Promise.all([
        getListe(id),
        getCategories(),
        getLignesDeListe(id)
      ]);
      categorieCourante = categories[0] ?? null;
      render();
    } catch (e) {
      toast.error('Erreur chargement liste');
      console.error(e);
    }
  }

  // ── Rendu principal ─────────────────────────────────────────────
  function render() {
    root.replaceChildren(
      el('div', { class: 'max-w-lg mx-auto flex flex-col gap-4' },
        renderHeader(),
        renderFormAjout(),
        renderListeGroupee()
      )
    );
  }

  // ── Header ──────────────────────────────────────────────────────
  function renderHeader() {
    return el('header', {
      class: 'flex items-center justify-between px-4 py-4 sticky top-0 bg-bg z-10 border-b border-slate-800'
    },
      el('div', { class: 'flex items-center gap-2 min-w-0' },
        el('button', {
          class: 'btn-ghost p-2 shrink-0',
          onClick: () => history.back()
        }, icon('arrow_back')),
        el('div', { class: 'min-w-0' },
          el('h1', { class: 'text-base font-bold truncate' }, `Version ${liste.version}`),
          el('p', { class: 'text-xs text-slate-400' },
            `${lignes.length} objet${lignes.length > 1 ? 's' : ''}`
          )
        )
      ),
      el('div', { class: 'flex gap-2' },
        el('button', {
          class: 'btn-ghost p-2',
          title: 'Dates de sortie / rendu',
          onClick: openDatesModal
        }, icon('calendar_month')),
        el('button', {
          class: 'btn-primary',
          onClick: handleGenererPDF
        }, icon('picture_as_pdf'), 'PDF')
      )
    );
  }

  // ── Formulaire d'ajout ──────────────────────────────────────────
  function renderFormAjout() {

    // Grille des catégories
    const categorieGrid = el('div', { class: 'px-4' },
      el('p', { class: 'text-xs text-slate-400 uppercase tracking-wider mb-2' }, 'Catégorie'),
      el('div', { class: 'grid grid-cols-3 gap-2' },
        ...categories.map(cat =>
          el('button', {
            class: `py-2 px-1 rounded-xl text-xs font-medium transition-colors text-center
                    ${categorieCourante?.id === cat.id
                      ? 'bg-accent text-bg'
                      : 'bg-bg-card text-slate-300 hover:bg-bg-elevated border border-slate-700'}`,
            onClick: () => {
              categorieCourante = cat;
              // Re-render pour activer visuellement le bouton,
              // puis déclenche le dropdown immédiatement sur la nouvelle instance
              render();
              setTimeout(() => acInput?.showAll(), 50);
            }
          }, cat.name)
        )
      )
    );

    // Instance autocomplete avec sélection multiple
    acInput = autocomplete({
      categorieId: categorieCourante?.id,
      placeholder: 'Rechercher ou créer des objets…',
      onSelectMultiple: handleAjoutMultiple
    });

    return el('div', { class: 'flex flex-col gap-3' },
      categorieGrid,
      el('div', { class: 'px-4 flex flex-col gap-3' },
        el('p', { class: 'text-xs text-slate-400 uppercase tracking-wider' },
          'Ajouter des objets'
        ),
        acInput.wrapper
      )
    );
  }

  // ── Ajout multiple depuis le dropdown ───────────────────────────
  async function handleAjoutMultiple(items) {
  if (!categorieCourante) { toast.error('Choisis une categorie'); return; }

  let ajouts = 0;
  const erreurs = [];

  for (const { obj, quantite } of items) {
    try {
      const objet = await getOrCreateObjet(obj.libelle, categorieCourante.id);

      const dejaPresent = lignes.some(l => l.objets_catalogue.id === objet.id);
      if (dejaPresent) {
        erreurs.push(objet.libelle + ' deja present');
        continue;
      }

      // On utilise la quantité choisie dans le dropdown
      await addLigne(id, objet.id, quantite, null);
      await incrementUsage(objet.id);
      ajouts++;
    } catch (e) {
      erreurs.push('Erreur : ' + obj.libelle);
      console.error(e);
    }
  }

  if (ajouts > 0) {
    toast.success(ajouts + ' objet' + (ajouts > 1 ? 's' : '') + ' ajoute' + (ajouts > 1 ? 's' : ''));
    lignes = await getLignesDeListe(id);
    render();
  }
  if (erreurs.length > 0) {
    toast.error(erreurs.join(' - '));
  }
 }

  // ── Liste groupée par catégorie ─────────────────────────────────
  function renderListeGroupee() {
    if (lignes.length === 0) {
      return el('div', { class: 'px-4' },
        el('div', { class: 'card text-slate-400 text-sm text-center' },
          icon('inventory_2'), ' Liste vide — sélectionne une catégorie et des objets ci-dessus.'
        )
      );
    }

    // Groupe par catégorie
    const grouped = new Map();
    lignes.forEach(ligne => {
      const cat = ligne.objets_catalogue.categories;
      if (!grouped.has(cat.id)) grouped.set(cat.id, { cat, lignes: [] });
      grouped.get(cat.id).lignes.push(ligne);
    });

    // Trie par sort_order
    const sorted = [...grouped.values()].sort((a, b) => a.cat.sort_order - b.cat.sort_order);

    return el('div', { class: 'px-4 flex flex-col gap-4' },
      el('p', { class: 'text-xs text-slate-400 uppercase tracking-wider' },
        `Liste — ${lignes.length} objet${lignes.length > 1 ? 's' : ''}`
      ),
      ...sorted.map(({ cat, lignes: groupLignes }) =>
        el('div', { class: 'flex flex-col gap-2' },
          // Titre catégorie
          el('div', { class: 'flex items-center gap-2' },
            el('span', { class: 'text-xs font-bold text-accent uppercase tracking-wider' }, cat.name),
            el('span', { class: 'text-xs text-slate-500' }, `(${groupLignes.length})`),
            el('div', { class: 'flex-1 h-px bg-slate-800' })
          ),
          ...groupLignes.map(renderLigne)
        )
      )
    );
  }

  // ── Rendu d'une ligne ───────────────────────────────────────────
  function renderLigne(ligne) {
  const objet = ligne.objets_catalogue;

  return el('div', { class: 'card flex flex-col gap-1 py-2 px-3' },
    // Ligne principale : tout sur une ligne
    el('div', { class: 'flex items-center gap-2' },

      // Quantité +/-  horizontal
      el('div', { class: 'flex items-center gap-1 shrink-0' },
        el('button', {
          class: 'w-6 h-6 rounded bg-bg-elevated text-slate-300 hover:bg-red-700 hover:text-white text-sm font-bold transition-colors flex items-center justify-center',
          onClick: () => handleUpdateQty(ligne, ligne.quantite - 1)
        }, '−'),
        el('span', { class: 'text-sm font-bold text-accent w-6 text-center' }, ligne.quantite),
        el('button', {
          class: 'w-6 h-6 rounded bg-bg-elevated text-slate-300 hover:bg-accent hover:text-bg text-sm font-bold transition-colors flex items-center justify-center',
          onClick: () => handleUpdateQty(ligne, ligne.quantite + 1)
        }, '+')
      ),

      // Libellé — prend tout l'espace disponible
      el('span', { class: 'text-sm font-medium flex-1 min-w-0 truncate' }, objet.libelle),

      // Boutons edit + delete côte à côte
      el('div', { class: 'flex items-center gap-1 shrink-0' },
        el('button', {
          class: 'w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-bg-elevated transition-colors',
          onClick: () => openEditLigne(ligne)
        }, icon('edit')),
        el('button', {
          class: 'w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-bg-elevated transition-colors',
          onClick: () => handleDeleteLigne(ligne)
        }, icon('delete'))
      )
    ),

    // Remarques en dessous si présentes
    ligne.remarques && el('p', {
      class: 'text-xs text-slate-500 italic pl-1 truncate'
    }, ligne.remarques)
  );
}
  // ── Édition d'une ligne (modal) ─────────────────────────────────
  function openEditLigne(ligne) {
    const objet = ligne.objets_catalogue;
    let quantite = ligne.quantite;

    const qtyDisplay = el('span', { class: 'text-2xl font-bold w-12 text-center' }, quantite);

    const remarquesInput = el('input', {
      type: 'text',
      class: 'input',
      placeholder: 'Remarques / accessoires',
      value: ligne.remarques ?? ''
    });

    const btnSave = el('button', {
      class: 'btn-primary w-full',
      onClick: handleSave
    }, icon('save'), 'Enregistrer');

    const m = modal({
      title: objet.libelle,
      content: el('div', { class: 'flex flex-col gap-4' },
        el('div', { class: 'flex items-center justify-center gap-4' },
          el('button', {
            class: 'btn-secondary w-12 h-12 text-2xl',
            onClick: () => {
              quantite = Math.max(1, quantite - 1);
              qtyDisplay.textContent = quantite;
            }
          }, '−'),
          qtyDisplay,
          el('button', {
            class: 'btn-secondary w-12 h-12 text-2xl',
            onClick: () => { quantite++; qtyDisplay.textContent = quantite; }
          }, '+')
        ),
        remarquesInput,
        btnSave
      )
    });

    async function handleSave() {
      btnSave.disabled = true;
      try {
        await updateLigne(ligne.id, {
          quantite,
          remarques: remarquesInput.value.trim() || null
        });
        toast.success('Ligne mise à jour');
        m.close();
        lignes = await getLignesDeListe(id);
        render();
      } catch (e) {
        toast.error('Erreur : ' + e.message);
        btnSave.disabled = false;
      }
    }

    m.open();
    setTimeout(() => remarquesInput.focus(), 100);
  }

  // ── Suppression d'une ligne ─────────────────────────────────────
  async function handleDeleteLigne(ligne, skipConfirm = false) {
    if (!skipConfirm) {
      const ok = await confirm(`Supprimer « ${ligne.objets_catalogue.libelle} » de la liste ?`);
      if (!ok) return;
    }
    try {
      await deleteLigne(ligne.id);
      lignes = await getLignesDeListe(id);
      render();
      toast.success('Objet retiré de la liste');
    } catch (e) {
      toast.error('Erreur suppression');
    }
  }

  // ── Modal dates sortie / rendu ──────────────────────────────────
  function openDatesModal() {
    const dateSortie = el('input', {
      type: 'date', class: 'input',
      value: toInput(liste.date_sortie)
    });
    const dateRendu = el('input', {
      type: 'date', class: 'input',
      value: toInput(liste.date_rendu)
    });

    const btnSave = el('button', {
      class: 'btn-primary w-full',
      onClick: handleSave
    }, icon('save'), 'Enregistrer');

    const m = modal({
      title: 'Dates sortie / rendu',
      content: el('div', { class: 'flex flex-col gap-3' },
        el('label', { class: 'text-sm text-slate-400' }, 'Sortie Matos'),
        dateSortie,
        el('label', { class: 'text-sm text-slate-400' }, 'Rendu Matos'),
        dateRendu,
        btnSave
      )
    });

    async function handleSave() {
      btnSave.disabled = true;
      try {
        liste = await updateListe(id, {
          date_sortie: dateSortie.value || null,
          date_rendu:  dateRendu.value  || null
        });
        toast.success('Dates enregistrées');
        m.close();
        render();
      } catch (e) {
        toast.error('Erreur : ' + e.message);
        btnSave.disabled = false;
      }
    }

    m.open();
  }
  // Après la fonction openDatesModal, avant load()
  async function handleGenererPDF() {
    try {
      // Récupère le projet depuis l'id du projet dans la liste
      const projet = await getProjet(liste.projet_id);
      toast.success('Generation PDF en cours...');
      await genererPDF(liste, projet);
    } catch (e) {
      toast.error('Erreur generation PDF : ' + e.message);
      console.error(e);
    }
  }

  load();
  return root;
}