// Shared by overlays so opening one while closing another cannot unlock the page.
const locks = new Set();
let previous;

export function lockPageScroll() {
 const token = Symbol('scroll-lock');
 if (!locks.size) {
  previous = { body: document.body.style.overflow, root: document.documentElement.style.overflow };
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
 }
 locks.add(token);
 return () => {
  if (!locks.delete(token) || locks.size) return;
  document.body.style.overflow = previous.body;
  document.documentElement.style.overflow = previous.root;
 };
}
