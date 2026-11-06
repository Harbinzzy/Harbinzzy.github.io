'use strict';

document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = tab => {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next]);
      tabs[next].focus();
    });
  });
});

const dialog = document.getElementById('figure-dialog');
const enlarged = document.getElementById('enlarged-figure');
let figureTrigger;
document.querySelectorAll('.figure-zoom').forEach(button => {
  button.addEventListener('click', () => {
    const image = button.querySelector('img');
    figureTrigger = button;
    enlarged.src = image.currentSrc || image.src;
    enlarged.alt = image.alt;
    document.getElementById('figure-caption').textContent = button.closest('figure').querySelector('figcaption')?.textContent || image.alt;
    document.getElementById('figure-original').href = enlarged.src;
    dialog.showModal();
    document.body.classList.add('modal-open');
    document.getElementById('close-figure').focus();
  });
});
document.getElementById('close-figure').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  figureTrigger?.focus({preventScroll: true});
});

document.getElementById('copy-bibtex').addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(document.getElementById('citation').textContent);
    status.textContent = 'BibTeX copied to clipboard.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('citation'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = 'Citation selected. Press Ctrl+C (or ⌘C) to copy.';
  }
});
