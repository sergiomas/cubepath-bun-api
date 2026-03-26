import { createRoundRobinChatStream } from "../services/chat-round-robin";

interface ChatRequestBody {
  message?: unknown;
  model?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function handleChat(request: Request): Promise<Response> {
  console.log("[chat] Entrando en POST /chat");

  let body: ChatRequestBody;

  try {
    console.log("[chat] Intentando parsear body JSON...");
    body = (await request.json()) as ChatRequestBody;
    console.log("[chat] Body parseado correctamente", {
      hasMessage: isNonEmptyString(body.message),
      hasModel: isNonEmptyString(body.model),
    });
  } catch {
    console.error("[chat] Error parseando JSON en body");
    return Response.json(
      { error: "El body debe ser JSON valido." },
      { status: 400 },
    );
  }

  if (!isNonEmptyString(body.message)) {
    console.warn("[chat] Validacion fallida: 'message' ausente o vacio");
    return Response.json(
      { error: "El campo 'message' es obligatorio." },
      { status: 400 },
    );
  }

  const requestedModel = isNonEmptyString(body.model) ? body.model : undefined;

  console.log("[chat] Payload validado", {
    messageLength: body.message.length,
    requestedModel,
    usesProviderDefaultModel: !requestedModel,
  });

  try {
    console.log("[chat] Solicitando stream al selector round robin...");

    const routedStream = await createRoundRobinChatStream({
      message: body.message,
      requestedModel,
    });

    console.log("[chat] Stream recibido. Iniciando envio al cliente...", {
      provider: routedStream.provider,
      model: routedStream.model,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let chunkCount = 0;
        let streamedCharacters = 0;

        try {
          for await (const content of routedStream.stream) {
            chunkCount += 1;
            streamedCharacters += content.length;

            controller.enqueue(encoder.encode(content));
            console.log("[chat] Chunk enviado al cliente", {
              provider: routedStream.provider,
              chunkCount,
              contentLength: content.length,
              streamedCharacters,
            });
          }

          console.log("[chat] Stream finalizado", {
            provider: routedStream.provider,
            model: routedStream.model,
            chunkCount,
            streamedCharacters,
          });

          controller.close();
        } catch (streamError) {
          console.error("[chat] Error durante el streaming al cliente", {
            provider: routedStream.provider,
            model: routedStream.model,
            streamError,
          });
          controller.error(streamError);
        }
      },
      cancel(reason) {
        console.warn("[chat] El cliente canceló la respuesta en streaming", {
          provider: routedStream.provider,
          model: routedStream.model,
          reason,
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Chat-Provider": routedStream.provider,
        "X-Chat-Model": routedStream.model,
      },
    });
  } catch (error) {
    console.error("[chat] Error en seleccion/proveedor de chat", error);

    const details =
      error instanceof Error ? error.message : "Error desconocido en /chat.";

    console.error("[chat] Devolviendo 500 en /chat", { details });

    return Response.json(
      { error: "No se pudo consultar ningun proveedor de chat.", details },
      { status: 500 },
    );
  }
}
