import { createChatStream } from "../services/openrouter";

const DEFAULT_MODEL = "openrouter/free";

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

  const model = isNonEmptyString(body.model) ? body.model : DEFAULT_MODEL;

  console.log("[chat] Payload validado", {
    messageLength: body.message.length,
    model,
    usedDefaultModel: !isNonEmptyString(body.model),
  });

  try {
    console.log("[chat] Llamando al servicio de OpenRouter...");

    const openRouterStream = await createChatStream({
      message: body.message,
      model,
    });

    console.log("[chat] Stream de OpenRouter recibido. Iniciando stream al cliente...");

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let chunkCount = 0;
        let reasoningTokens: number | null = null;

        try {
          for await (const chunk of openRouterStream) {
            chunkCount += 1;

            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              controller.enqueue(encoder.encode(content));
              console.log("[chat] Chunk enviado al cliente", {
                chunkCount,
                contentLength: content.length,
              });
            } else {
              console.log("[chat] Chunk recibido sin contenido", { chunkCount });
            }

            const usageReasoningTokens =
              chunk.usage?.completionTokensDetails?.reasoningTokens;

            if (usageReasoningTokens != null) {
              reasoningTokens = usageReasoningTokens;
              console.log("[chat] reasoningTokens detectado", {
                reasoningTokens,
              });
            }
          }

          console.log("[chat] Stream finalizado", {
            chunkCount,
            reasoningTokens,
          });

          controller.close();
        } catch (streamError) {
          console.error("[chat] Error durante el streaming al cliente", streamError);
          controller.error(streamError);
        }
      },
      cancel(reason) {
        console.warn("[chat] El cliente canceló la respuesta en streaming", {
          reason,
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[chat] Error en servicio OpenRouter", error);

    const details =
      error instanceof Error ? error.message : "Error desconocido en /chat.";

    console.error("[chat] Devolviendo 500 en /chat", { details });

    return Response.json(
      { error: "No se pudo consultar OpenRouter.", details },
      { status: 500 },
    );
  }
}
