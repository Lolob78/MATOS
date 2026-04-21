import { supabase } from '../supabase.js';
import { el, icon } from '../utils/dom.js';

export function loginView() {
  let message = '';
  let loading = false;
  let emailInput;
  const root = el('div', { class: 'min-h-dvh flex items-center justify-center p-6' });

  function render() {
    root.replaceChildren(
      el('div', { class: 'card w-full max-w-sm' },
        el('h1', { class: 'text-3xl font-bold text-center mb-2' }, 'MATOS'),
        el('p', { class: 'text-slate-400 text-center mb-6' }, 'Listes matériel lumière'),
        (emailInput = el('input', {
          type: 'email',
          class: 'input mb-4',
          placeholder: 'ton@email.fr',
          autocomplete: 'email'
        })),
        el('button', {
          class: 'btn-primary w-full',
          disabled: loading,
          onClick: handleLogin
        },
          icon('mail'),
          loading ? 'Envoi…' : 'Recevoir le lien magique'
        ),
        message && el('p', { class: 'text-sm text-slate-400 text-center mt-4' }, message)
      )
    );
  }

  async function handleLogin() {
    const email = emailInput.value.trim();
    if (!email) {
      message = 'Email requis';
      render();
      return;
    }
    loading = true;
    message = '';
    render();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });

    loading = false;
    message = error
      ? `Erreur : ${error.message}`
      : '✉️ Lien envoyé ! Vérifie ta boîte mail.';
    render();
  }

  render();
  return root;
}