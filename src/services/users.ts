import { sql } from "bun";

export interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  active: boolean;
}

export interface UpdateUserInput {
  name: string;
  email: string;
  active: boolean;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

function toIsoTimestamp(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function mapUserRowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    active: row.active,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

function assertDatabaseUrlConfigured() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim().length === 0) {
    throw new Error("DATABASE_URL no está configurada.");
  }
}

async function ensureUsersTable() {
  if (schemaReady) {
    return;
  }

  if (schemaPromise) {
    await schemaPromise;
    return;
  }

  schemaPromise = (async () => {
    assertDatabaseUrlConfigured();

    console.log("[users-service] Verificando tabla users...");

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    schemaReady = true;
    console.log("[users-service] Tabla users lista.");
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });

  await schemaPromise;
}

export async function listUsers(): Promise<User[]> {
  await ensureUsersTable();

  const rows = (await sql`
    SELECT id, name, email, active, created_at, updated_at
    FROM users
    ORDER BY id ASC
  `) as UserRow[];

  return rows.map(mapUserRowToUser);
}

export async function findUserById(userId: number): Promise<User | null> {
  await ensureUsersTable();

  const rows = (await sql`
    SELECT id, name, email, active, created_at, updated_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `) as UserRow[];

  const user = rows[0];

  return user ? mapUserRowToUser(user) : null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  await ensureUsersTable();

  const rows = (await sql`
    INSERT INTO users (name, email, active)
    VALUES (${input.name}, ${input.email}, ${input.active})
    RETURNING id, name, email, active, created_at, updated_at
  `) as UserRow[];

  const createdUser = rows[0];

  if (!createdUser) {
    throw new Error("No se pudo crear el usuario.");
  }

  return mapUserRowToUser(createdUser);
}

export async function updateUserById(
  userId: number,
  input: UpdateUserInput,
): Promise<User | null> {
  await ensureUsersTable();

  const rows = (await sql`
    UPDATE users
    SET
      name = ${input.name},
      email = ${input.email},
      active = ${input.active},
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, name, email, active, created_at, updated_at
  `) as UserRow[];

  const updatedUser = rows[0];

  return updatedUser ? mapUserRowToUser(updatedUser) : null;
}

export async function deleteUserById(userId: number): Promise<boolean> {
  await ensureUsersTable();

  const rows = (await sql`
    DELETE FROM users
    WHERE id = ${userId}
    RETURNING id
  `) as Array<{ id: number }>;

  return rows.length > 0;
}
