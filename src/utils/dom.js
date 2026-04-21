// Helpers DOM minimalistes (pas de framework, pas de virtual DOM)

/** Crée un élément avec attrs et enfants. Ex: el('div', {class:'card'}, 'Hello') */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined && v !== false) {
      node.setAttribute(k, v);
    }
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Vide un container et y monte un nouveau node */
export function mount(container, node) {
  container.replaceChildren(node);
}

/** Icône Material Symbol. Ex: icon('logout') */
export function icon(name) {
  return el('span', { class: 'icon' }, name);
}