import { env } from "./config/env";
import { handleRequest } from "./router";

export function startServer() {
  console.log(`[server] Preparando Bun.serve con puerto ${env.port}`);

  const server = Bun.serve({
    port: env.port,
    fetch: handleRequest,
  });

  console.log(`[server] Bun.serve iniciado correctamente en puerto ${server.port}`);

  return server;
}
