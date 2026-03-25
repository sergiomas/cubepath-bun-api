export function handleHealth(): Response {
  console.log("[health] Entrando en GET /health");

  const responsePayload = { status: "ok" };

  console.log("[health] Respuesta generada", responsePayload);

  return Response.json(responsePayload);
}
