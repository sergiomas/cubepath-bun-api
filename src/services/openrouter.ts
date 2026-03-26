import { OpenRouter } from "@openrouter/sdk";
import { env } from "../config/env";
import type { ChatCompletionInput, ChatTextStream } from "./chat.types";

function createClient(): OpenRouter {
  console.log("[openrouter] Creando cliente de OpenRouter...");

  if (!env.openRouterApiKey) {
    console.error("[openrouter] OPENROUTER_API_KEY no configurada");
    throw new Error("Falta OPENROUTER_API_KEY en el entorno.");
  }

  console.log("[openrouter] OPENROUTER_API_KEY detectada");

  return new OpenRouter({
    apiKey: env.openRouterApiKey,
  });
}

export async function createOpenRouterChatStream(
  input: ChatCompletionInput,
): Promise<ChatTextStream> {
  console.log("[openrouter] Iniciando sendChatMessage", {
    model: input.model,
    messageLength: input.message.length,
  });

  const openrouter = createClient();

  console.log("[openrouter] Enviando peticion streaming a OpenRouter...");

  const stream = await openrouter.chat.send({
    chatGenerationParams: {
      model: input.model,
      messages: [
        {
          role: "user",
          content: input.message,
        },
      ],
      stream: true,
    },
  });

  console.log("[openrouter] Stream recibido. Preparando parser...");

  async function* toTextStream(): AsyncGenerator<string, void, void> {
    let streamChunkCount = 0;
    let textChunkCount = 0;
    let reasoningTokens: number | null = null;

    for await (const chunk of stream) {
      streamChunkCount += 1;

      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        textChunkCount += 1;
        console.log("[openrouter] Chunk de texto", {
          streamChunkCount,
          textChunkCount,
          contentLength: content.length,
        });
        yield content;
      }

      const usageReasoningTokens =
        chunk.usage?.completionTokensDetails?.reasoningTokens;

      if (usageReasoningTokens != null) {
        reasoningTokens = usageReasoningTokens;
      }
    }

    console.log("[openrouter] Stream parseado", {
      streamChunkCount,
      textChunkCount,
      reasoningTokens,
    });
  }

  return toTextStream();
}
