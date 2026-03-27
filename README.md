# cubepath-bun-api

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.10. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## REST de usuarios (PostgreSQL con Bun SQL nativo)

El proyecto expone un CRUD completo en `/users` usando `import { sql } from "bun"`.

Define en `.env`:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/base_de_datos
```

### Endpoints

- `GET /users` -> lista usuarios
- `GET /users/:id` -> detalle de usuario
- `POST /users` -> crea usuario
- `PUT /users/:id` -> reemplaza usuario completo
- `PATCH /users/:id` -> actualización parcial
- `DELETE /users/:id` -> elimina usuario

### Ejemplo rápido

```bash
curl -X POST "http://localhost:3000/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","active":true}'
```
