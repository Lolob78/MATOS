// Routeur hash-based ultra simple. Pas de lib.
// Format : #/route ou #/route/:id
// Chaque route = fonction qui retourne un DOM node.

const routes = new Map();
let notFoundHandler = () => document.createTextNode('404');
let container = null;

export function registerRoute(pattern, handler) {
  routes.set(pattern, handler);
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function initRouter(rootContainer) {
  container = rootContainer;
  window.addEventListener('hashchange', render);
  render();
}

export function navigate(path) {
  window.location.hash = path;
}

function render() {
  const hash = window.location.hash.slice(1) || '/';
  const { handler, params } = match(hash);
  const node = handler ? handler(params) : notFoundHandler();
  container.replaceChildren(node);
  window.scrollTo(0, 0);
}

// Matching basique : /projet/:id -> capture id
function match(path) {
  for (const [pattern, handler] of routes) {
    const params = matchPattern(pattern, path);
    if (params) return { handler, params };
  }
  return { handler: null, params: {} };
}

function matchPattern(pattern, path) {
  const pParts = pattern.split('/').filter(Boolean);
  const sParts = path.split('/').filter(Boolean);
  if (pParts.length !== sParts.length) return null;
  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':')) {
      params[pParts[i].slice(1)] = decodeURIComponent(sParts[i]);
    } else if (pParts[i] !== sParts[i]) {
      return null;
    }
  }
  return params;
}