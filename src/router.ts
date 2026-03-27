import { handleChat } from "./routes/chat";
import { handleHealth } from "./routes/health";
import { handleHome } from "./routes/home";
import { handleUserById, handleUsers } from "./routes/users";

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userIdMatch = url.pathname.match(/^\/users\/(\d+)$/);

  console.log(`[router] Peticion entrante: ${request.method} ${url.pathname}`);

  if (request.method === "GET" && url.pathname === "/") {
    console.log("[router] Ruta seleccionada: GET /");
    return handleHome();
  }

  if (request.method === "GET" && url.pathname === "/health") {
    console.log("[router] Ruta seleccionada: GET /health");
    return handleHealth();
  }

  if (request.method === "POST" && url.pathname === "/chat") {
    console.log("[router] Ruta seleccionada: POST /chat");
    return handleChat(request);
  }

  if (
    (request.method === "GET" || request.method === "POST") &&
    url.pathname === "/users"
  ) {
    console.log(`[router] Ruta seleccionada: ${request.method} /users`);
    return handleUsers(request);
  }

  if (
    userIdMatch &&
    (request.method === "GET" ||
      request.method === "PUT" ||
      request.method === "PATCH" ||
      request.method === "DELETE")
  ) {
    const userId = Number(userIdMatch[1]);

    console.log(
      `[router] Ruta seleccionada: ${request.method} /users/${userId}`,
    );

    return handleUserById(request, userId);
  }

  console.warn(`[router] Ruta no encontrada: ${request.method} ${url.pathname}`);
  return new Response("Not Found", { status: 404 });
}
