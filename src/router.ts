import { handleChat } from "./routes/chat";
import { handleHealth } from "./routes/health";
import { handleHome } from "./routes/home";

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

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

  console.warn(`[router] Ruta no encontrada: ${request.method} ${url.pathname}`);
  return new Response("Not Found", { status: 404 });
}
