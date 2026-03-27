import { SQL } from "bun";
import {
  createUser,
  deleteUserById,
  findUserById,
  listUsers,
  updateUserById,
} from "../services/users";

interface CreateOrUpdateUserBody {
  name?: unknown;
  email?: unknown;
  active?: unknown;
}

interface PartialUserBody {
  name?: unknown;
  email?: unknown;
  active?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function buildDatabaseErrorResponse(error: unknown, operation: string): Response {
  console.error(`[users-route] Error en ${operation}`, error);

  if (error instanceof SQL.PostgresError && error.code === "23505") {
    return Response.json(
      { error: "Ya existe un usuario con ese email." },
      { status: 409 },
    );
  }

  const details = error instanceof Error ? error.message : "Error desconocido.";

  return Response.json(
    {
      error: "Error de base de datos en users.",
      details,
    },
    { status: 500 },
  );
}

export async function handleUsers(request: Request): Promise<Response> {
  console.log(`[users-route] Entrando en ${request.method} /users`);

  if (request.method === "GET") {
    try {
      const users = await listUsers();
      return Response.json(users);
    } catch (error) {
      return buildDatabaseErrorResponse(error, "GET /users");
    }
  }

  if (request.method === "POST") {
    let body: CreateOrUpdateUserBody;

    try {
      body = (await request.json()) as CreateOrUpdateUserBody;
    } catch {
      return Response.json(
        { error: "El body debe ser JSON válido." },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(body.name)) {
      return Response.json(
        { error: "El campo 'name' es obligatorio." },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(body.email)) {
      return Response.json(
        { error: "El campo 'email' es obligatorio." },
        { status: 400 },
      );
    }

    if (body.active !== undefined && !isBoolean(body.active)) {
      return Response.json(
        { error: "El campo 'active' debe ser booleano." },
        { status: 400 },
      );
    }

    try {
      const createdUser = await createUser({
        name: body.name.trim(),
        email: body.email.trim(),
        active: body.active ?? true,
      });

      return Response.json(createdUser, { status: 201 });
    } catch (error) {
      return buildDatabaseErrorResponse(error, "POST /users");
    }
  }

  return Response.json({ error: "Método no permitido." }, { status: 405 });
}

export async function handleUserById(
  request: Request,
  userId: number,
): Promise<Response> {
  console.log(`[users-route] Entrando en ${request.method} /users/${userId}`);

  if (request.method === "GET") {
    try {
      const user = await findUserById(userId);

      if (!user) {
        return Response.json({ error: "Usuario no encontrado." }, { status: 404 });
      }

      return Response.json(user);
    } catch (error) {
      return buildDatabaseErrorResponse(error, "GET /users/:id");
    }
  }

  if (request.method === "PUT") {
    let body: CreateOrUpdateUserBody;

    try {
      body = (await request.json()) as CreateOrUpdateUserBody;
    } catch {
      return Response.json(
        { error: "El body debe ser JSON válido." },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(body.name)) {
      return Response.json(
        { error: "El campo 'name' es obligatorio." },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(body.email)) {
      return Response.json(
        { error: "El campo 'email' es obligatorio." },
        { status: 400 },
      );
    }

    if (!isBoolean(body.active)) {
      return Response.json(
        { error: "El campo 'active' es obligatorio y debe ser booleano." },
        { status: 400 },
      );
    }

    try {
      const updatedUser = await updateUserById(userId, {
        name: body.name.trim(),
        email: body.email.trim(),
        active: body.active,
      });

      if (!updatedUser) {
        return Response.json({ error: "Usuario no encontrado." }, { status: 404 });
      }

      return Response.json(updatedUser);
    } catch (error) {
      return buildDatabaseErrorResponse(error, "PUT /users/:id");
    }
  }

  if (request.method === "PATCH") {
    let body: PartialUserBody;

    try {
      body = (await request.json()) as PartialUserBody;
    } catch {
      return Response.json(
        { error: "El body debe ser JSON válido." },
        { status: 400 },
      );
    }

    const hasName = body.name !== undefined;
    const hasEmail = body.email !== undefined;
    const hasActive = body.active !== undefined;

    if (!hasName && !hasEmail && !hasActive) {
      return Response.json(
        { error: "Debes enviar al menos un campo a actualizar." },
        { status: 400 },
      );
    }

    if (hasName && !isNonEmptyString(body.name)) {
      return Response.json(
        { error: "Si envías 'name', debe ser string no vacío." },
        { status: 400 },
      );
    }

    if (hasEmail && !isNonEmptyString(body.email)) {
      return Response.json(
        { error: "Si envías 'email', debe ser string no vacío." },
        { status: 400 },
      );
    }

    if (hasActive && !isBoolean(body.active)) {
      return Response.json(
        { error: "Si envías 'active', debe ser booleano." },
        { status: 400 },
      );
    }

    try {
      const currentUser = await findUserById(userId);

      if (!currentUser) {
        return Response.json({ error: "Usuario no encontrado." }, { status: 404 });
      }

      const nameToUse = isNonEmptyString(body.name)
        ? body.name.trim()
        : currentUser.name;
      const emailToUse = isNonEmptyString(body.email)
        ? body.email.trim()
        : currentUser.email;
      const activeToUse = isBoolean(body.active)
        ? body.active
        : currentUser.active;

      const updatedUser = await updateUserById(userId, {
        name: nameToUse,
        email: emailToUse,
        active: activeToUse,
      });

      if (!updatedUser) {
        return Response.json({ error: "Usuario no encontrado." }, { status: 404 });
      }

      return Response.json(updatedUser);
    } catch (error) {
      return buildDatabaseErrorResponse(error, "PATCH /users/:id");
    }
  }

  if (request.method === "DELETE") {
    try {
      const deleted = await deleteUserById(userId);

      if (!deleted) {
        return Response.json({ error: "Usuario no encontrado." }, { status: 404 });
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      return buildDatabaseErrorResponse(error, "DELETE /users/:id");
    }
  }

  return Response.json({ error: "Método no permitido." }, { status: 405 });
}
