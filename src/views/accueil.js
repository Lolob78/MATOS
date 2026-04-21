import { supabase } from '../supabase.js';
import { getProjets, deleteProjet } from '../api/projets.js';
import { createProjet, updateProjet } from '../api/projets.js';
import { el, icon } from '../utils/dom.js';
import { toDisplay, toInput } from '../utils/date.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { confirm } from '../components/confirm.js';
import { navigate } from '../router.js';

//-------------- AJOUT TEMPORAIRE
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';


export function accueilView() {
  const root = el('div', { class: 'min-h-dvh pb-24' });

  // ── Chargement initial ──────────────────────────────────────────
  async function load() {
    root.replaceChildren(
      el('div', { class: 'max-w-lg mx-auto' },
        renderHeader(),
        el('div', { class: 'px-4' },
          el('p', { class: 'text-slate-400 text-sm text-center mt-16' }, 'Chargement…')
        )
      )
    );

    try {
      const projets = await getProjets();
      renderPage(projets);
    } catch (e) {
      toast.error('Erreur chargement projets');
      console.error(e);
    }
  }

  // ── Rendu complet ───────────────────────────────────────────────
  function renderPage(projets) {
    root.replaceChildren(
      el('div', { class: 'max-w-lg mx-auto' },
        renderHeader(),
        el('div', { class: 'px-4 flex flex-col gap-3 mt-2' },
          projets.length === 0
            ? el('div', { class: 'card text-slate-400 text-sm text-center mt-8' },
                icon('movie'), ' Aucun projet. Crée le premier !'
              )
            : projets.map(renderCarteProjet)
        )
      )
    );
  }

  // ── Header avec bouton (+) ──────────────────────────────────────
	function renderHeader() {
	  return el('header', { class: 'flex items-center justify-between px-4 py-4 sticky top-0 bg-bg z-10 border-b border-slate-800' },
		el('h1', { class: 'text-2xl font-bold tracking-tight' }, 'MATOS'),
		el('div', { class: 'flex gap-2' },
		  el('button', {
			class: 'btn-ghost',
			title: 'Carnet adresses',
			onClick: () => navigate('/carnet')
		  }, icon('contacts')),
		  el('button', {
			class: 'btn-primary',
			title: 'Nouveau projet',
			onClick: () => openFormProjet(null)
		  }, icon('add'), 'Projet')
		)
	  );
	}
  // ── Carte projet ────────────────────────────────────────────────
  function renderCarteProjet(p) {
    return el('div', {
      class: 'card flex flex-col gap-2 active:scale-[0.98] transition-transform cursor-pointer',
      onClick: () => navigate(`/projet/${p.id}`)
    },
      el('div', { class: 'flex items-start justify-between gap-2' },
        el('div', {},
          el('h2', { class: 'font-semibold text-lg leading-tight' }, p.nom),
          p.realisateur && el('p', { class: 'text-slate-400 text-sm' }, `Réal. ${p.realisateur}`)
        ),
        // Boutons edit/delete — stopPropagation pour ne pas naviguer
        el('div', { class: 'flex gap-1 shrink-0', onClick: (e) => e.stopPropagation() },
          el('button', {
            class: 'btn-ghost p-2',
            onClick: () => openFormProjet(p)
          }, icon('edit')),
          el('button', {
            class: 'btn-ghost p-2 text-red-400',
            onClick: () => handleDelete(p)
          }, icon('delete'))
        )
      ),
      el('div', { class: 'flex gap-4 text-xs text-slate-400 flex-wrap' },
        p.date_debut && el('span', {}, icon('event'), ` Début : ${toDisplay(p.date_debut)}`),
        p.date_fin   && el('span', {}, icon('event_busy'), ` Fin : ${toDisplay(p.date_fin)}`),
        p.producteur && el('span', {}, icon('business'), ` ${p.producteur}`)
      )
    );
  }

  // ── Formulaire projet (création + édition) ──────────────────────
  function openFormProjet(projet) {
    // Champs du formulaire
    const fields = {
      nom:            el('input', { type: 'text',  class: 'input', placeholder: 'Nom du projet *', value: projet?.nom ?? '' }),
      realisateur:    el('input', { type: 'text',  class: 'input', placeholder: 'Réalisateur',     value: projet?.realisateur ?? '' }),
      producteur:     el('input', { type: 'text',  class: 'input', placeholder: 'Producteur',      value: projet?.producteur ?? '' }),
      directeur_prod: el('input', { type: 'text',  class: 'input', placeholder: 'Dir. de prod.',   value: projet?.directeur_prod ?? '' }),
      chef_operateur: el('input', { type: 'text',  class: 'input', placeholder: 'Chef opérateur',  value: projet?.chef_operateur ?? '' }),
      date_debut:     el('input', { type: 'date',  class: 'input', value: toInput(projet?.date_debut) }),
      date_fin:       el('input', { type: 'date',  class: 'input', value: toInput(projet?.date_fin) })
    };

    const btnSave = el('button', { class: 'btn-primary w-full', onClick: handleSave },
      icon('save'), projet ? 'Enregistrer' : 'Créer le projet'
    );

    const content = el('div', { class: 'flex flex-col gap-3' },
      el('p', { class: 'text-xs text-slate-400 uppercase tracking-wider' }, 'Infos projet'),
      fields.nom,
      el('div', { class: 'grid grid-cols-2 gap-3' },
        fields.date_debut,
        fields.date_fin
      ),
      el('p', { class: 'text-xs text-slate-400 uppercase tracking-wider mt-2' }, 'Équipe'),
      fields.realisateur,
      fields.producteur,
      fields.directeur_prod,
      fields.chef_operateur,
      btnSave
    );

    const m = modal({
      title: projet ? 'Modifier le projet' : 'Nouveau projet',
      content
    });

    async function handleSave() {
      const nom = fields.nom.value.trim();
      if (!nom) { toast.error('Le nom du projet est requis'); return; }

      btnSave.disabled = true;
      btnSave.textContent = 'Enregistrement…';

      const payload = {
        nom,
        realisateur:    fields.realisateur.value.trim()    || null,
        producteur:     fields.producteur.value.trim()     || null,
        directeur_prod: fields.directeur_prod.value.trim() || null,
        chef_operateur: fields.chef_operateur.value.trim() || null,
        date_debut:     fields.date_debut.value            || null,
        date_fin:       fields.date_fin.value              || null
      };

      try {
        if (projet) {
          await updateProjet(projet.id, payload);
          toast.success('Projet mis à jour');
        } else {
          await createProjet(payload);
          toast.success('Projet créé');
        }
        m.close();
        load(); // Recharge la liste
      } catch (e) {
        toast.error('Erreur : ' + e.message);
        btnSave.disabled = false;
        btnSave.textContent = projet ? 'Enregistrer' : 'Créer le projet';
      }
    }

    m.open();
    // Focus auto sur le champ nom
    setTimeout(() => fields.nom.focus(), 100);
  }

  // ── Suppression ─────────────────────────────────────────────────
  async function handleDelete(p) {
    const ok = await confirm(`Supprimer le projet « ${p.nom} » et toutes ses listes ?`);
    if (!ok) return;
    try {
      await deleteProjet(p.id);
      toast.success('Projet supprimé');
      load();
    } catch (e) {
      toast.error('Erreur : ' + e.message);
    }
  }

  load();
  return root;
}