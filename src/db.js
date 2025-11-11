// Lightweight D1 wrapper used by the worker and testable by stubbing
let _db = null;

export async function initDb(db) {
  if (!db) throw new Error('D1 instance required');
  _db = db;
  // ensure table exists (best-effort; D1 will run this on first call)
  try {
    await _db.prepare(
      `CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0
      );`
    ).run();
  } catch (e) {
    // swallow (tests may stub _db and not implement prepare)
  }
}

function requireDb() {
  if (!_db) throw new Error('Database not initialized');
  return _db;
}

export async function getAllTodos() {
  const db = requireDb();
  const res = await db.prepare('SELECT id, title, completed FROM todos').all();
  return res.results.map(r => ({ id: r.id, title: r.title, completed: !!r.completed }));
}

export async function getTodoById(id) {
  const db = requireDb();
  const st = await db.prepare('SELECT id, title, completed FROM todos WHERE id = ?').bind(id).first();
  if (!st) return null;
  return { id: st.id, title: st.title, completed: !!st.completed };
}

export async function createTodo({ title, completed = false }) {
  if (!title || typeof title !== 'string') throw new Error('Invalid title');
  const db = requireDb();
  const res = await db.prepare('INSERT INTO todos (title, completed) VALUES (?, ?)').bind(title, completed ? 1 : 0).run();
  // D1 run() returns { success, meta: { last_row_id } } depending on runtime; adapt defensively
  const id = res?.meta?.last_row_id ?? res?.lastInsertRowid ?? null;
  return { id, title, completed };
}

export async function updateTodo(id, { title, completed }) {
  if (!id) throw new Error('Missing id');
  const db = requireDb();
  // We will only update provided fields
  const existing = await getTodoById(id);
  if (!existing) return null;
  const newTitle = title !== undefined ? title : existing.title;
  const newCompleted = completed !== undefined ? (completed ? 1 : 0) : (existing.completed ? 1 : 0);
  await db.prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?').bind(newTitle, newCompleted, id).run();
  return { id, title: newTitle, completed: !!newCompleted };
}

export async function deleteTodo(id) {
  const db = requireDb();
  await db.prepare('DELETE FROM todos WHERE id = ?').bind(id).run();
  return true;
}

// Add this at the bottom to provide a mutable object for tests
const defaultDB = {
  initDb,
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};

export default defaultDB;