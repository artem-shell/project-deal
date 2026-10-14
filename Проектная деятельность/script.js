(() => {
  'use strict';
  const KEY = 'quiet-plan-v1';
  const form = document.querySelector('#task-form');
  const input = document.querySelector('#task-input');
  const list = document.querySelector('#task-list');
  const template = document.querySelector('#task-template');
  const status = document.querySelector('#status');
  const clear = document.querySelector('#clear');
  let tasks = [];
  let filter = 'all';
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) tasks = saved.filter(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean');
  } catch {
    status.textContent = 'Не удалось прочитать сохранённые задачи. Новые записи доступны в этой вкладке.';
  }
  const date = new Date();
  document.querySelector('#date').textContent = date.toLocaleDateString('ru-RU', {day:'numeric',month:'long',weekday:'short'}).toUpperCase();
  document.querySelector('#date').dateTime = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); status.textContent = ''; }
    catch { status.textContent = 'Браузер не разрешил сохранение. Задачи останутся только до закрытия страницы.'; }
  }
  function render() {
    list.replaceChildren();
    const shown = tasks.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done));
    for (const task of shown) {
      const row = template.content.firstElementChild.cloneNode(true);
      row.dataset.id = task.id;
      row.classList.toggle('done', task.done);
      row.querySelector('.task-text').textContent = task.text;
      row.querySelector('.task-check').checked = task.done;
      row.querySelector('.delete').setAttribute('aria-label', `Удалить: ${task.text}`);
      list.append(row);
    }
    const done = tasks.filter(t => t.done).length;
    const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    document.querySelector('#total').textContent = tasks.length;
    document.querySelector('#progress-text').textContent = tasks.length ? `${done} из ${tasks.length} завершено · ${percent}%` : 'Пока чистый лист';
    document.querySelector('#progress-bar').style.width = `${percent}%`;
    document.querySelector('.progress').setAttribute('aria-valuenow', percent);
    clear.disabled = done === 0;
    const empty = document.querySelector('#empty');
    empty.hidden = shown.length > 0;
    empty.querySelector('h2').textContent = tasks.length ? (filter === 'done' ? 'Всё ещё впереди' : 'Можно выдохнуть') : 'Место для хороших планов';
    empty.querySelector('p').textContent = tasks.length ? (filter === 'done' ? 'Здесь появятся завершённые дела.' : 'В этом списке пока нет незавершённых дел.') : 'Добавь первое дело — остальное сложится.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) { input.value = ''; input.focus(); return; }
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    tasks.unshift({id, text, done:false});
    filter = 'all';
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    input.value = '';
    save(); render(); input.focus();
  });
  list.addEventListener('change', event => {
    if (!event.target.matches('.task-check')) return;
    const task = tasks.find(t => t.id === event.target.closest('.task').dataset.id);
    if (!task) return;
    task.done = event.target.checked;
    const id = task.id;
    save(); render();
    const row = [...list.children].find(el => el.dataset.id === id);
    if (row) row.querySelector('.task-check').focus();
    else document.querySelector(`[data-filter="${filter}"]`).focus();
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('.delete');
    if (!button) return;
    const row = button.closest('.task');
    const nextId = (row.nextElementSibling || row.previousElementSibling)?.dataset.id;
    tasks = tasks.filter(t => t.id !== row.dataset.id);
    save(); render();
    const next = [...list.children].find(el => el.dataset.id === nextId);
    if (next) next.querySelector('.delete').focus(); else input.focus();
  });
  document.querySelector('.filters').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  });
  clear.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    save(); render(); input.focus();
  });
  render();
})();
