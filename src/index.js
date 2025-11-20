import { Router } from "itty-router";
import Joi from "joi";
import DB from "./db.js";

const router = Router();

// 🧩 Joi Schemas
const idSchema = Joi.number().integer().positive().required();

const todoSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  completed: Joi.boolean().default(false),
});

const updateTodoSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  completed: Joi.boolean().optional(),
}).min(1);

// 🧰 Helper: Standard JSON Response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// -----------------------------
// 🌐 ROUTES
// -----------------------------

// Health check
router.get("/qw", () => jsonResponse({ ok: true }));

// List todos
router.get("/todos", async ({ env }) => {
  await DB.initDb(env.mydb);
  const todos = await DB.getAllTodos();
  return jsonResponse(todos);
});

// Get single
router.get("/todos/:id", async ({ params, env }) => {
  await DB.initDb(env.mydb);

  const { error, value: id } = idSchema.validate(Number(params.id));
  if (error) return jsonResponse({ error: "Invalid id" }, 400);

  const todo = await DB.getTodoById(id);
  if (!todo) return jsonResponse({ error: "Not found" }, 404);

  return jsonResponse(todo);
});

// Create
router.post("/todos", async (request) => {
  const { env } = request;

  await DB.initDb(env.mydb);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { error, value } = todoSchema.validate(body, { abortEarly: false });
  if (error) {
    return jsonResponse(
      {
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      },
      400,
    );
  }

  const created = await DB.createTodo(value);
  return jsonResponse(created, 201);
});

// Update
router.put("/todos/:id", async (request) => {
  const { env, params } = request;
  await DB.initDb(env.mydb);

  const { error: idError, value: id } = idSchema.validate(Number(params.id));
  if (idError) return jsonResponse({ error: "Invalid id" }, 400);

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { error, value } = updateTodoSchema.validate(body, {
    abortEarly: false,
  });
  if (error) {
    return jsonResponse(
      {
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      },
      400,
    );
  }

  const updated = await DB.updateTodo(id, value);
  if (!updated) return jsonResponse({ error: "Not found" }, 404);

  return jsonResponse(updated);
});

// Delete
router.delete("/todos/:id", async ({ params, env }) => {
  await DB.initDb(env.mydb);

  const { error, value: id } = idSchema.validate(Number(params.id));
  if (error) return jsonResponse({ error: "Invalid id" }, 400);

  await DB.deleteTodo(id);
  return new Response(null, { status: 204 });
});

// 404 fallback
router.all("*", () => jsonResponse({ error: "Not found" }, 404));

// -----------------------------
// 🧩 Entry Point
// -----------------------------

export async function handleRequest(request, env) {
  request.env = env || {}; // attach env to request
  return router.handle(request);
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
