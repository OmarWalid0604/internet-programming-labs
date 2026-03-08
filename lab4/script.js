/* ════════════════════════════════════════════
   TO-DO LIST — script.js
   Structure: Class → State → DOM → Events → Render
════════════════════════════════════════════ */


/* ══════════════════════════════════════════
   1. TASK CLASS
══════════════════════════════════════════ */
class Task {
  constructor(description) {
    this.id          = Date.now() + Math.random(); // unique id
    this.description = description.trim();
    this.done        = false;
    this.createdAt   = new Date();
  }

  /** Toggle completion state */
  toggle() {
    this.done = !this.done;
  }
}


/* ══════════════════════════════════════════
   2. STATE — Tasks array + active filter
══════════════════════════════════════════ */
let tasks  = [];          // Array of Task objects
let filter = 'all';       // 'all' | 'active' | 'done'


/* ══════════════════════════════════════════
   3. DOM — Select Nodes
══════════════════════════════════════════ */
const taskInput    = document.getElementById('task-input');
const addBtn       = document.getElementById('add-btn');
const taskList     = document.getElementById('task-list');
const emptyState   = document.getElementById('empty-state');
const statTotal    = document.getElementById('stat-total');
const statDone     = document.getElementById('stat-done');
const clearDoneBtn = document.getElementById('clear-done-btn');
const filterBtns   = document.querySelectorAll('.filter-btn');


/* ══════════════════════════════════════════
   4. EVENTS — Listen for User Actions
══════════════════════════════════════════ */

// Add on button click
addBtn.addEventListener('click', handleAdd);

// Add on Enter key
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAdd();
});

// Filter tabs
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

// Clear completed tasks
clearDoneBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  render();
});

// Task list: toggle or delete via event delegation
taskList.addEventListener('click', (e) => {
  const li = e.target.closest('.task-item');
  if (!li) return;

  const id = Number(li.dataset.id);

  // Delete button
  if (e.target.closest('.task-delete')) {
    deleteTask(id);
    return;
  }

  // Toggle anywhere else on the row
  toggleTask(id);
});


/* ══════════════════════════════════════════
   5. LOGIC — Functions
══════════════════════════════════════════ */

/** Add a new task */
function handleAdd() {
  const text = taskInput.value.trim();

  if (!text) {
    // Shake the input to signal error
    taskInput.parentElement.classList.remove('shake');
    requestAnimationFrame(() => taskInput.parentElement.classList.add('shake'));
    setTimeout(() => taskInput.parentElement.classList.remove('shake'), 400);
    taskInput.focus();
    return;
  }

  const task = new Task(text);
  tasks.push(task);           // store in array
  taskInput.value = '';
  taskInput.focus();

  // If filter is 'done', switch to 'all' so the new task is visible
  if (filter === 'done') {
    filter = 'all';
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
  }

  render();
}

/** Toggle a task's done state by id */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.toggle();
    render();
  }
}

/** Remove a task from the array by id */
function deleteTask(id) {
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (li) {
    // Animate out before removing
    li.style.transition = 'opacity 0.2s, transform 0.2s';
    li.style.opacity    = '0';
    li.style.transform  = 'translateX(20px)';
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      render();
    }, 200);
  }
}

/** Return tasks filtered by current filter state */
function getFilteredTasks() {
  switch (filter) {
    case 'active': return tasks.filter(t => !t.done);
    case 'done':   return tasks.filter(t => t.done);
    default:       return tasks;
  }
}


/* ══════════════════════════════════════════
   6. RENDER — Update the DOM
══════════════════════════════════════════ */

/** Full re-render of the task list */
function render() {
  const visible = getFilteredTasks();

  // Build innerHTML for all visible tasks
  taskList.innerHTML = visible.map(task => `
    <li class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
      <div class="task-check">${task.done ? '✓' : ''}</div>
      <span class="task-text">${escapeHTML(task.description)}</span>
      <button class="task-delete" title="Delete task">✕</button>
    </li>
  `).join('');

  // Show / hide empty state
  emptyState.classList.toggle('visible', visible.length === 0);

  // Update stats (always from full tasks array)
  const doneCount  = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  statTotal.textContent = `${totalCount} task${totalCount !== 1 ? 's' : ''}`;
  statDone.textContent  = `${doneCount} done`;
}

/** Prevent XSS by escaping user-entered HTML characters */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


/* ══════════════════════════════════════════
   7. INIT — First render
══════════════════════════════════════════ */
render();
