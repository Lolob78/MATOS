// Lightweight pub/sub global state
// Usage: state.set('user', { id: 1 }); state.on('user', cb); state.get('user');

const _store = {};
const _listeners = {};

export const state = {
  get(key) {
    return _store[key];
  },

  set(key, value) {
    _store[key] = value;
    (_listeners[key] ?? []).forEach((cb) => cb(value));
  },

  on(key, cb) {
    (_listeners[key] ??= []).push(cb);
    // Return unsubscribe fn
    return () => {
      _listeners[key] = _listeners[key].filter((fn) => fn !== cb);
    };
  },
};
