import { getCategories, createCategorie, deleteCategorie } from '../api/categories.js';
import { USER_CONFIG } from '../config.js';
import { el } from '../utils/dom.js';
import { showToast } from '../components/toast.js';

export async function render(root) {
  const categories = await getCategories();

  const container = el('div', { class: 'p-4 max-w-2xl mx-auto space-y-8' });
  container.innerHTML = `
    <section>
      <h2 class="text-xl font-bold mb-3">Informations</h2>
      <p class="text-sm text-gray-600">${USER_CONFIG.nom} — ${USER_CONFIG.email}</p>
    </section>

    <section>
      <h2 class="text-xl font-bold mb-3">Catégories</h2>
      <ul class="space-y-2 mb-4" id="liste-cats">
        ${categories.map((c) => `
          <li class="card flex justify-between items-center" data-id="${c.id}">
            <span>${c.nom}</span>
            <button class="btn-delete text-red-500 text-sm">Supprimer</button>
          </li>
        `).join('')}
      </ul>
      <button class="btn-primary" id="btn-add-cat">+ Catégorie</button>
    </section>
  `;

  container.querySelector('#liste-cats').addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;
    const li = btn.closest('li');
    await deleteCategorie(li.dataset.id);
    li.remove();
    showToast('Catégorie supprimée');
  });

  container.querySelector('#btn-add-cat').addEventListener('click', async () => {
    const nom = prompt('Nom de la catégorie :');
    if (!nom) return;
    const cat = await createCategorie({ nom, ordre: 99 });
    const li = el('li', { class: 'card flex justify-between items-center', 'data-id': cat.id });
    li.innerHTML = `<span>${cat.nom}</span><button class="btn-delete text-red-500 text-sm">Supprimer</button>`;
    container.querySelector('#liste-cats').appendChild(li);
    showToast('Catégorie créée');
  });

  root.replaceChildren(container);
}
