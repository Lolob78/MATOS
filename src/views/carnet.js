import { getPersonnes, createPersonne, updatePersonne, deletePersonne } from '../api/personnes.js';
import { el, icon } from '../utils/dom.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { confirm } from '../components/confirm.js';
import { navigate } from '../router.js';

export function carnetView() {
  const root = el('div', { class: 'min-h-dvh pb-24' });

  async function load() {
    root.replaceChildren(
      el('div', { class: 'max-w-lg mx-auto' },
        renderHeader(),
        el('div', { class: 'px-4 mt-4 text-slate-400 text-sm text-center' }, 'Chargement…')
      )
    );
    try {
      const personnes = await getPersonnes();
      renderPage(personnes);
    } catch (e) {
      toast.error('Erreur chargement carnet');
    }
  }

  function renderPage(personnes) {
    root.replaceChildren(
      el('div', { class: 'max-w-lg mx-auto' },
        renderHeader(),
        el('div', { class: 'px-4 flex flex-col gap-3 mt-2' },
          personnes.length === 0
            ? el('div', { class: 'card text-slate-400 text-sm text-center mt-8' },
                'Carnet vide. Ajoute une personne !'
              )
            : personnes.map(renderCartePersonne)
        )
      )
    );
  }

  function renderHeader() {
    return el('header', { class: 'flex items-center justify-between px-4 py-4 sticky top-0 bg-bg z-10 border-b border-slate-800' },
      el('div', { class: 'flex items-center gap-2' },
        el('button', { class: 'btn-ghost p-2', onClick: () => navigate('/') }, icon('arrow_back')),
        el('h1', { class: 'text-xl font-bold' }, 'Carnet')
      ),
      el('button', {
        class: 'btn-primary',
        onClick: () => openFormPersonne(null)
      }, icon('person_add'), 'Ajouter')
    );
  }

  function renderCartePersonne(p) {
    const initiales = `${p.prenom[0]}${p.nom[0]}`.toUpperCase();
    return el('div', { class: 'card flex items-center gap-3' },
      // Avatar initiales
      el('div', { class: 'w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold shrink-0 text-sm' },
        initiales
      ),
      el('div', { class: 'flex-1 min-w-0' },
        el('p', { class: 'font-medium truncate' }, `${p.prenom} ${p.nom}`),
        el('div', { class: 'flex gap-3 text-xs text-slate-400 flex-wrap' },
          p.email     && el('span', {}, icon('mail'),  ` ${p.email}`),
          p.telephone && el('span', {}, icon('phone'), ` ${p.telephone}`)
        )
      ),
      el('div', { class: 'flex gap-1 shrink-0' },
        el('button', { class: 'btn-ghost p-2', onClick: () => openFormPersonne(p) }, icon('edit')),
        el('button', { class: 'btn-ghost p-2 text-red-400', onClick: () => handleDelete(p) }, icon('delete'))
      )
    );
  }

  function openFormPersonne(personne) {
    const fields = {
      prenom:    el('input', { type: 'text',  class: 'input', placeholder: 'Prénom *',   value: personne?.prenom    ?? '' }),
      nom:       el('input', { type: 'text',  class: 'input', placeholder: 'Nom *',      value: personne?.nom       ?? '' }),
      email:     el('input', { type: 'email', class: 'input', placeholder: 'Email',      value: personne?.email     ?? '' }),
      telephone: el('input', { type: 'tel',   class: 'input', placeholder: 'Téléphone',  value: personne?.telephone ?? '' })
    };

    const btnSave = el('button', { class: 'btn-primary w-full', onClick: handleSave },
      icon('save'), personne ? 'Enregistrer' : 'Ajouter'
    );

    const m = modal({
      title: personne ? 'Modifier' : 'Nouvelle personne',
      content: el('div', { class: 'flex flex-col gap-3' },
        el('div', { class: 'grid grid-cols-2 gap-3' }, fields.prenom, fields.nom),
        fields.email,
        fields.telephone,
        btnSave
      )
    });

    async function handleSave() {
      const prenom = fields.prenom.value.trim();
      const nom    = fields.nom.value.trim();
      if (!prenom || !nom) { toast.error('Prénom et nom requis'); return; }

      btnSave.disabled = true;

      const payload = {
        prenom,
        nom,
        email:     fields.email.value.trim()     || null,
        telephone: fields.telephone.value.trim() || null
      };

      try {
        if (personne) {
          await updatePersonne(personne.id, payload);
          toast.success('Personne mise à jour');
        } else {
          await createPersonne(payload);
          toast.success('Personne ajoutée');
        }
        m.close();
        load();
      } catch (e) {
        toast.error('Erreur : ' + e.message);
        btnSave.disabled = false;
      }
    }

    m.open();
    setTimeout(() => fields.prenom.focus(), 100);
  }

  async function handleDelete(p) {
    const ok = await confirm(`Supprimer ${p.prenom} ${p.nom} du carnet ?`);
    if (!ok) return;
    try {
      await deletePersonne(p.id);
      toast.success('Personne supprimée');
      load();
    } catch (e) {
      toast.error('Erreur suppression');
    }
  }

  load();
  return root;
}