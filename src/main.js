import './styles/main.css';
import { supabase } from './supabase.js';
import { initRouter, registerRoute, setNotFound, navigate } from './router.js';
import { loginView } from './views/login.js';
import { accueilView } from './views/accueil.js';
import { projetView } from './views/projet.js';
import { carnetView } from './views/carnet.js';
import { listeEditView } from './views/liste-edit.js';
import { el } from './utils/dom.js';

async function bootstrap() {
  const app = document.getElementById('app');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    registerRoute('/', () => loginView());
    setNotFound(() => loginView());
  } else {
    registerRoute('/',            ()       => accueilView());
    registerRoute('/projet/:id', (params) => projetView(params));
    registerRoute('/carnet',     ()       => carnetView());
	registerRoute('/liste/:id', (params) => listeEditView(params));
    setNotFound(() => el('div', { class: 'p-6 text-slate-400' }, '404 — page introuvable'));
  }

  initRouter(app);

  let previouslyLoggedIn = !!session;
  supabase.auth.onAuthStateChange((event, newSession) => {
    const nowLoggedIn = !!newSession;
    if (nowLoggedIn === previouslyLoggedIn) return;
    previouslyLoggedIn = nowLoggedIn;
    window.location.hash = '/';
    window.location.reload();
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  document.getElementById('app').innerHTML = `
    <div class="p-6 text-red-400">
      Erreur de démarrage. Vérifie la console et ton fichier .env.local.
    </div>`;
});