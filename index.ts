import { startServer } from "./src/server";

console.log("[boot] Iniciando API Bun...");

const server = startServer();

console.log(`[boot] API escuchando en http://localhost:${server.port}`);