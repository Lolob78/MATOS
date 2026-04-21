import { getProjet, getEquipe, addMembreEquipe, removeMembreEquipe } from '../api/projets.js';
import { getPersonnes } from '../api/personnes.js';
import { getListesDuProjet, createListe, dupliquerListe, deleteListe } from '../api/listes.js';
import { el, icon } from '../utils/dom.js';
import { toDisplay, toInput } from '../utils/date.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { confirm } from '../components/confirm.js';
import { navigate } from '../router.js';
import { ROLES } from '../config.js';
import { genererPDF } from '../pdf/generator.js';

export function projetView({ id }) {
  const root = el('div', { class: 'min-h-dvh pb-24' });
  let activeTab = 'listes';
  let projet = null;

  async function load() {
    try {
      projet = await getProjet(id);
      render();
    } catch (e) {
      toast.error('Projet introuvable');
      navigate('/');
    }
  }

  function render() {
    root.replaceChildren(
      el('div', { class: 'max-w-lg mx-auto' },
        renderHeader(),
        renderInfos(),
        renderTabs(),
        renderTabContent()
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
          onClick: () => navigate('/')
        }, icon('arrow_back')),
        el('h1', { class: 'text-lg font-bold truncate' }, projet.nom)
      ),
      el('button', {
        class: 'btn-ghost p-2',
        title: 'Modifier',
        onClick: () => navigate(`/?edit=${id}`)
      }, icon('edit'))
    );
  }

  // ── Infos synthétiques ──────────────────────────────────────────
  function renderInfos() {
    const items = [
      projet.realisateur    && ['movie',           `Réal. ${projet.realisateur}`],
      projet.producteur     && ['business',         projet.producteur],
      projet.directeur_prod && ['manage_accounts', `Dir. prod. ${projet.directeur_prod}`],
      projet.chef_operateur && ['camera',           `Chef Op. ${projet.chef_operateur}`],
      (projet.date_debut || projet.date_fin) && ['event',
        [
          projet.date_debut && `Début ${toDisplay(projet.date_debut)}`,
          projet.date_fin   && `Fin ${toDisplay(projet.date_fin)}`
        ].filter(Boolean).join('  —  ')
      ]
    ].filter(Boolean);

    if (!items.length) return el('div', {});

    return el('div', { class: 'px-4 py-3 flex flex-col gap-1' },
      ...items.map(([ic, txt]) =>
        el('p', { class: 'text-sm text-slate-400 flex items-center gap-2' },
          el('span', { class: 'icon text-base' }, ic), txt
        )
      )
    );
  }

  // ── Onglets ─────────────────────────────────────────────────────
  function renderTabs() {
    const tab = (key, label, ic) => el('button', {
      class: `flex-1 flex items-center justify-center gap-1 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === key
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400'}`,
      onClick: () => { activeTab = key; render(); }
    }, icon(ic), label);

    return el('div', { class: 'flex border-b border-slate-800 mx-4 mt-2' },
      tab('listes', 'Listes matériel', 'list_alt'),
      tab('equipe', 'Équipe',          'group')
    );
  }

  function renderTabContent() {
    return activeTab === 'listes' ? renderTabListes() : renderTabEquipe();
  }

  // ── Onglet Listes ───────────────────────────────────────────────
  function renderTabListes() {
    const container = el('div', { class: 'px-4 mt-4 flex flex-col gap-3' },
      el('p', { class: 'text-slate-400 text-sm' }, 'Chargement…')
    );

    (async () => {
      try {
        const listes = await getListesDuProjet(id);
        container.replaceChildren(
          el('button', {
            class: 'btn-primary w-full',
            onClick: () => openNouvelleVersion(listes)
          }, icon('add'), 'Nouvelle version de liste'),

          listes.length === 0
            ? el('p', { class: 'text-slate-400 text-sm text-center mt-4' },
                'Aucune liste. Crée la première !'
              )
            : el('div', { class: 'flex flex-col gap-3' },
                ...listes.map(liste => renderCarteListe(liste))
              )
        );
      } catch (e) {
        toast.error('Erreur chargement listes');
        console.error(e);
      }
    })();

    return container;
  }

  function renderCarteListe(liste) {
    return el('div', { class: 'card flex flex-col gap-2' },
      el('div', { class: 'flex items-center justify-between' },
        el('div', {},
          el('p', { class: 'font-semibold' }, `Version ${liste.version}`),
          el('p', { class: 'text-xs text-slate-400' },
            `Créée le ${toDisplay(liste.created_at?.slice(0, 10))}`
          ),
          el('div', { class: 'flex gap-3 text-xs text-slate-400 mt-1 flex-wrap' },
            liste.date_sortie && el('span', {},
              icon('local_shipping'), ` Sortie ${toDisplay(liste.date_sortie)}`
            ),
            liste.date_rendu && el('span', {},
              icon('keyboard_return'), ` Rendu ${toDisplay(liste.date_rendu)}`
            )
          )
        ),
        el('button', {
          class: 'btn-ghost p-2 text-red-400 shrink-0',
          onClick: () => handleDeleteListe(liste)
        }, icon('delete'))
      ),
      el('div', { class: 'flex gap-2' },
        el('button', {
          class: 'btn-secondary flex-1',
          onClick: () => navigate(`/liste/${liste.id}`)
        }, icon('edit'), 'Éditer'),
        el('button', {
          class: 'btn-ghost flex-1',
          onClick: () => handleGenererPDFDepuisProjet(liste)
        }, icon('picture_as_pdf'), 'PDF')
      )
    );
  }

  function openNouvelleVersion(listesExistantes) {
    const peutDupliquer = listesExistantes.length > 0;
    let modeSelect = 'vide';
    let sourceId = listesExistantes[0]?.id ?? null;

    const btnVide = el('button', {
      class: 'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors bg-accent text-bg border-accent',
      onClick: () => {
        modeSelect = 'vide';
        btnVide.className = 'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors bg-accent text-bg border-accent';
        btnDup.className  = 'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors bg-bg-card text-slate-300 border-slate-700';
        selectSource.classList.add('hidden');
      }
    }, 'Partir de zéro');

    const btnDup = el('button', {
      class: 'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors bg-bg-card text-slate-300 border-slate-700',
      onClick: () => {
        if (!peutDupliquer) { toast.error('Aucune liste à dupliquer'); return; }
        modeSelect = 'dupliquer';
        btnDup.className  = 'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors bg-accent text-bg border-accent';
        btnVide.className = 'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors bg-bg-card text-slate-300 border-slate-700';
        selectSource.classList.remove('hidden');
      }
    }, 'Dupliquer une version');

    const selectSource = el('select', { class: 'input hidden' },
      ...listesExistantes.map(l =>
        el('option', { value: l.id }, `Version ${l.version}`)
      )
    );
    selectSource.addEventListener('change', () => { sourceId = selectSource.value; });

    const btnCreer = el('button', {
      class: 'btn-primary w-full',
      onClick: handleCreer
    }, icon('add'), 'Créer la version');

    const m = modal({
      title: 'Nouvelle version de liste',
      content: el('div', { class: 'flex flex-col gap-3' },
        el('div', { class: 'flex gap-2' }, btnVide, btnDup),
        selectSource,
        btnCreer
      )
    });

    async function handleCreer() {
      btnCreer.disabled = true;
      try {
        let nouvelleListe;
        if (modeSelect === 'dupliquer' && sourceId) {
          nouvelleListe = await dupliquerListe(sourceId, id);
          toast.success(`Version ${nouvelleListe.version} créée par duplication`);
        } else {
          nouvelleListe = await createListe(id);
          toast.success(`Version ${nouvelleListe.version} créée`);
        }
        m.close();
        navigate(`/liste/${nouvelleListe.id}`);
      } catch (e) {
        toast.error('Erreur : ' + e.message);
        btnCreer.disabled = false;
      }
    }

    m.open();
  }

  async function handleDeleteListe(liste) {
    const ok = await confirm(`Supprimer la Version ${liste.version} et tous ses objets ?`);
    if (!ok) return;
    try {
      await deleteListe(liste.id);
      toast.success('Liste supprimée');
      render();
    } catch (e) {
      toast.error('Erreur suppression');
    }
  }

  async function handleGenererPDFDepuisProjet(liste) {
    try {
      toast.success('Generation PDF en cours...');
      await genererPDF(liste, projet); // projet est déjà dans le scope de projetView
    } catch (e) {
      toast.error('Erreur generation PDF : ' + e.message);
      console.error(e);
    }
  }

  // ── Onglet Équipe ───────────────────────────────────────────────
  function renderTabEquipe() {
    const container = el('div', { class: 'px-4 mt-4 flex flex-col gap-3' },
      el('p', { class: 'text-slate-400 text-sm' }, 'Chargement équipe…')
    );

    (async () => {
      try {
        const equipe = await getEquipe(id);
        container.replaceChildren(
          el('button', {
            class: 'btn-secondary w-full',
            onClick: () => openAjoutMembre()
          }, icon('person_add'), 'Ajouter depuis le carnet'),

          equipe.length === 0
            ? el('p', { class: 'text-slate-400 text-sm text-center mt-4' },
                'Aucun membre ajouté'
              )
            : el('div', { class: 'flex flex-col gap-2' },
                ...equipe.map(({ role, personnes: p }) =>
                  el('div', { class: 'card flex items-center gap-3' },
                    el('div', { class: 'flex-1 min-w-0' },
                      el('p', { class: 'font-medium' }, `${p.prenom} ${p.nom}`),
                      el('p', { class: 'text-xs text-slate-400' }, role),
                      el('div', { class: 'flex gap-3 text-xs text-slate-500 flex-wrap mt-0.5' },
                        p.email     && el('span', {}, p.email),
                        p.telephone && el('span', {}, p.telephone)
                      )
                    ),
                    el('button', {
                      class: 'btn-ghost p-2 text-red-400 shrink-0',
                      onClick: () => handleRemoveMembre(p, role)
                    }, icon('person_remove'))
                  )
                )
              )
        );
      } catch (e) {
        toast.error('Erreur chargement équipe');
        console.error(e);
      }
    })();

    return container;
  }

  async function openAjoutMembre() {
    let personnes = [];
    try { personnes = await getPersonnes(); }
    catch (e) { toast.error('Erreur chargement carnet'); return; }

    if (personnes.length === 0) {
      toast.error('Carnet vide — ajoute d\'abord des personnes');
      return;
    }

    const selectPersonne = el('select', { class: 'input' },
      el('option', { value: '' }, '— Choisir une personne —'),
      ...personnes.map(p =>
        el('option', { value: p.id }, `${p.prenom} ${p.nom}`)
      )
    );

    const selectRole = el('select', { class: 'input' },
      el('option', { value: '' }, '— Choisir un rôle —'),
      ...ROLES.map(r => el('option', { value: r }, r))
    );

    const btnAjouter = el('button', {
      class: 'btn-primary w-full',
      onClick: handleAjouter
    }, icon('person_add'), 'Ajouter à l\'équipe');

    const m = modal({
      title: 'Ajouter un membre',
      content: el('div', { class: 'flex flex-col gap-3' },
        el('label', { class: 'text-sm text-slate-400' }, 'Personne'),
        selectPersonne,
        el('label', { class: 'text-sm text-slate-400' }, 'Rôle sur ce projet'),
        selectRole,
        btnAjouter
      )
    });

    async function handleAjouter() {
      const personneId = selectPersonne.value;
      const role       = selectRole.value;
      if (!personneId || !role) {
        toast.error('Sélectionne une personne et un rôle');
        return;
      }
      btnAjouter.disabled = true;
      try {
        await addMembreEquipe(id, personneId, role);
        toast.success('Membre ajouté');
        m.close();
        render();
      } catch (e) {
        toast.error(e.code === '23505'
          ? 'Cette personne a déjà ce rôle'
          : 'Erreur : ' + e.message
        );
        btnAjouter.disabled = false;
      }
    }

    m.open();
  }

  async function handleRemoveMembre(p, role) {
    const ok = await confirm(`Retirer ${p.prenom} ${p.nom} (${role}) de l'équipe ?`);
    if (!ok) return;
    try {
      await removeMembreEquipe(id, p.id, role);
      toast.success('Membre retiré');
      render();
    } catch (e) {
      toast.error('Erreur : ' + e.message);
    }
  }

  load();
  return root;
}