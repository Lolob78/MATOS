// Notification légère (succès / erreur) — s'auto-détruit après 3s
// Usage : toast.success('Projet créé') ou toast.error('Erreur réseau')

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }
  return container;
}

function show(message, type = 'success') {
  const colors = type === 'success'
    ? 'bg-green-800 border-green-600 text-green-100'
    : 'bg-red-900 border-red-700 text-red-100';

  const node = document.createElement('div');
  node.className = `${colors} border rounded-xl px-4 py-3 text-sm shadow-lg
                    transition-opacity duration-300 pointer-events-auto`;
  node.textContent = message;

  getContainer().appendChild(node);

  // Fade out puis suppression
  setTimeout(() => { node.style.opacity = '0'; }, 2700);
  setTimeout(() => { node.remove(); }, 3000);
}

export const toast = {
  success: (msg) => show(msg, 'success'),
  error:   (msg) => show(msg, 'error')
};