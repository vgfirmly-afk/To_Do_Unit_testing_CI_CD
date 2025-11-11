// test/index.test.js (ESM)
import { expect } from 'chai';
import sinon from 'sinon';

// Node 18+ has global Request/Response
const RequestCtor = globalThis.Request;

// Import modules under test
import * as index from '../src/index.js'; // or '../index.js' if in root
import DB from '../src/db.js';       // or '../db.js' if in root

// 👇 Centralized base URL for all tests
const BASE_URL = 'http://localhost:8787';

describe('Todos Worker routes', () => {
  let env;

  beforeEach(() => {
    env = { mydb: {} };
    sinon.stub(DB, 'initDb').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  // Health check
  it('GET / should return ok true', async () => {
    const req = new RequestCtor(`${BASE_URL}/`, { method: 'GET' });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(200);
    const payload = await res.json();
    expect(payload).to.deep.equal({ ok: true });
  });

  // GET /todos
  it('GET /todos should return list of todos', async () => {
    const fakeTodos = [{ id: 1, title: 'A', completed: false }];
    sinon.stub(DB, 'getAllTodos').resolves(fakeTodos);

    const req = new RequestCtor(`${BASE_URL}/todos`, { method: 'GET' });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(200);
    const payload = await res.json();
    expect(payload).to.deep.equal(fakeTodos);
  });

  it('GET /todos negative - DB rejects (expected)', async () => {
    sinon.restore();
    sinon.stub(DB, 'initDb').resolves();
    sinon.stub(DB, 'getAllTodos').rejects(new Error('db fail'));

    const req = new RequestCtor(`${BASE_URL}/todos`, { method: 'GET' });
    try {
      await index.handleRequest(req, env);
      throw new Error('Expected handleRequest to throw');
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
    }
  });

  // GET /todos/:id
  it('GET /todos/:id should return a todo when found', async () => {
    const fake = { id: 2, title: 'Read', completed: true };
    sinon.stub(DB, 'getTodoById').resolves(fake);

    const req = new RequestCtor(`${BASE_URL}/todos/2`, { method: 'GET' });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(200);
    const payload = await res.json();
    expect(payload).to.deep.equal(fake);
  });

  it('GET /todos/:id negative - invalid id returns 400', async () => {
    const req = new RequestCtor(`${BASE_URL}/todos/abc`, { method: 'GET' });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(400);
    const payload = await res.json();
    expect(payload).to.have.property('error');
  });

  it('GET /todos/:id negative - not found returns 404', async () => {
    sinon.stub(DB, 'getTodoById').resolves(null);
    const req = new RequestCtor(`${BASE_URL}/todos/999`, { method: 'GET' });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(404);
    const payload = await res.json();
    expect(payload).to.have.property('error');
  });

  // POST /todos
  it('POST /todos should create and return 201', async () => {
    const input = { title: 'New Task', completed: false };
    sinon.stub(DB, 'createTodo').resolves({ id: 10, ...input });

    const req = new RequestCtor(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });

    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(201);
    const payload = await res.json();
    expect(payload).to.deep.equal({ id: 10, ...input });
  });

  it('POST /todos negative - invalid JSON returns 400', async () => {
    const req = new RequestCtor(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(400);
    const payload = await res.json();
    expect(payload).to.have.property('error', 'Invalid JSON');
  });

  it('POST /todos negative - validation fail (missing title) returns 400', async () => {
    const req = new RequestCtor(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(400);
    const payload = await res.json();
    expect(payload).to.have.property('error', 'Validation failed');
    expect(payload).to.have.property('details').that.is.an('array');
  });

  // PUT /todos/:id
  it('PUT /todos/:id should update and return updated todo', async () => {
    sinon.stub(DB, 'getTodoById').resolves({ id: 3, title: 'Old', completed: false });
    sinon.stub(DB, 'updateTodo').resolves({ id: 3, title: 'Updated', completed: true });

    const req = new RequestCtor(`${BASE_URL}/todos/3`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated', completed: true }),
    });

    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(200);
    const payload = await res.json();
    expect(payload).to.deep.equal({ id: 3, title: 'Updated', completed: true });
  });

  it('PUT /todos/:id negative - invalid id returns 400', async () => {
    const req = new RequestCtor(`${BASE_URL}/todos/xyz`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'x' }),
    });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(400);
    const payload = await res.json();
    expect(payload).to.have.property('error');
  });

  it('PUT /todos/:id negative - validation fails when empty body returns 400', async () => {
    sinon.stub(DB, 'getTodoById').resolves({ id: 5, title: 't', completed: false });

    const req = new RequestCtor(`${BASE_URL}/todos/5`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(400);
    const payload = await res.json();
    expect(payload).to.have.property('error', 'Validation failed');
  });

  // DELETE /todos/:id
  it('DELETE /todos/:id should return 204', async () => {
    sinon.stub(DB, 'deleteTodo').resolves(true);
    const req = new RequestCtor(`${BASE_URL}/todos/7`, { method: 'DELETE' });

    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(204);
  });

  it('DELETE /todos/:id negative - invalid id returns 400', async () => {
    const req = new RequestCtor(`${BASE_URL}/todos/notanid`, { method: 'DELETE' });
    const res = await index.handleRequest(req, env);
    expect(res.status).to.equal(400);
    const payload = await res.json();
    expect(payload).to.have.property('error');
  });
});
